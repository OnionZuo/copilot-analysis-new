# GitHub Copilot TooltipSignature 生成机制分析

## 概述

本报告专门分析 GitHub Copilot 版本 1.288.0 中 TooltipSignature（工具提示签名）的生成机制。TooltipSignature 是 Copilot prompt 组装系统中的一个重要组件，它负责向 prompt 中添加函数和方法签名信息，帮助模型生成更准确的代码补全，特别是在函数调用和参数补全方面。

## TooltipSignature 的作用

TooltipSignature 在 Copilot 的 prompt 组装中扮演着特殊角色：

1. **函数参数补全**：当用户在编写函数调用时，TooltipSignature 提供函数签名信息，帮助 Copilot 生成正确的参数列表。

2. **方法调用辅助**：在面向对象编程中，它提供类方法的签名，帮助用户正确调用对象方法。

3. **API 使用指导**：对于库和框架 API，它提供参数类型和顺序信息，减少查阅文档的需要。

## 实现机制

### TooltipSignatureSnippetProvider 类

TooltipSignature 的核心实现在 `snippetProviders/tooltipSignature.ts` 文件中的 `TooltipSignatureSnippetProvider` 类：

```typescript
var _TooltipSignatureSnippetProvider = class _TooltipSignatureSnippetProvider extends SnippetProvider {
  constructor() {
    super(...arguments);
    this.type = "tooltip-signature";
  }
  async buildSnippets(context) {
    let {
      currentFile: currentFile,
      tooltipSignature: tooltipSignature
    } = context,
    snippets = [];
    return currentFile.languageId = normalizeLanguageId(currentFile.languageId), tooltipSignature && endsWithAttributesOrMethod(currentFile) && snippets.push({
      provider: this.type,
      semantics: "snippet",
      snippet: newLineEnded(announceTooltipSignatureSnippet(tooltipSignature, currentFile.languageId)),
      relativePath: currentFile.relativePath,
      startLine: 0,
      endLine: 0,
      score: 0
    }), snippets;
  }
};
```

这个类继承自基础的 `SnippetProvider` 类，并实现了特定于工具提示签名的逻辑。

### 关键函数和工作流程

1. **条件触发机制**：
   ```typescript
   tooltipSignature && endsWithAttributesOrMethod(currentFile)
   ```
   TooltipSignature 只在两个条件同时满足时才会被添加到 prompt 中：
   - 上下文中存在 tooltipSignature 信息
   - 当前文件以属性或方法访问结束（通过 `endsWithAttributesOrMethod` 函数判断）

2. **endsWithAttributesOrMethod 函数**：
   ```typescript
   function endsWithAttributesOrMethod(file) {
     let source = file.source,
       offset = file.offset;
     if (offset === 0 || offset > source.length) return false;
     let lastChar = source.charAt(offset - 1);
     return lastChar === "." || lastChar === ":" && source.charAt(offset - 2) === ":";
   }
   ```
   这个函数检查光标位置是否紧跟在属性访问符（`.`）或作用域解析运算符（`::`）之后，这通常表示用户正在尝试访问对象属性或方法。

3. **announceTooltipSignatureSnippet 函数**：
   ```typescript
   function announceTooltipSignatureSnippet(tooltipSignature, languageId) {
     let commentedSignature = commentBlockAsSingles(`Signature: ${tooltipSignature}`, languageId);
     return commentedSignature;
   }
   ```
   这个函数将工具提示签名转换为适当的注释格式，根据不同的编程语言使用不同的注释样式。

4. **commentBlockAsSingles 函数**：
   ```typescript
   function commentBlockAsSingles(text, languageId) {
     let commentStart = getCommentStart(languageId);
     return text.split("\n").map(line => `${commentStart} ${line}`).join("\n");
   }
   ```
   这个函数将多行文本转换为单行注释的形式，使用适合特定语言的注释标记。

### 签名信息的来源

TooltipSignature 的信息来源于编辑器的语言服务器协议（LSP）：

1. **LSP 悬停信息**：当用户将光标放在代码上时，LSP 提供类型信息和签名。

2. **编辑器集成**：VS Code 等编辑器将这些信息传递给 Copilot 扩展。

3. **上下文对象**：这些信息作为 `tooltipSignature` 属性包含在传递给 snippet 提供器的上下文对象中。

### 在 Prompt 中的位置和优先级

在 Copilot 的 prompt 组装过程中，TooltipSignature 有特定的位置和处理方式：

1. **位置**：在默认的 PromptOrderList 中，TooltipSignature 位于 SimilarFile 之后，BeforeCursor 之前：
   ```typescript
   getOrderList() {
     switch (this.preset) {
       case "default":
         return ["PathMarker", "LanguageMarker", "Traits", "SimilarFile", "TooltipSignature", "BeforeCursor", "AfterCursor"];
       // ...
     }
   }
   ```

2. **优先级**：在默认的 PromptPriorityList 中，TooltipSignature 的优先级为 0，表示它按顺序包含，而不是基于分数排序：
   ```typescript
   getPriorityList() {
     switch (this.preset) {
       case "default":
         return {
           // ...
           TooltipSignature: 0,
           // ...
         };
       // ...
     }
   }
   ```

3. **Token 限制**：TooltipSignature 有一个特定的 token 限制，防止过长的签名占用过多 token 预算：
   ```typescript
   const MAX_TOOLTIP_SIGNATURE_TOKENS = 50;
   
   // 在 prompt.ts 中的使用
   tooltipSignatureSnippet !== void 0 && tokenizer.tokenLength(tooltipSignatureSnippet.snippet) <= MAX_TOOLTIP_SIGNATURE_TOKENS ? (
     // 处理正常大小的工具提示
   ) : (
     // 处理过大的工具提示
   )
   ```

## 特殊处理机制

TooltipSignature 在 prompt 组装过程中有一些特殊的处理机制：

1. **与直接上下文的集成**：
   ```typescript
   [directContext, tooltipSignatureSnippet] = transferLastLineToTooltipSignature(directContext, tooltipSignatureSnippet)
   ```
   这个函数将直接上下文的最后一行（通常是属性访问或方法调用的开始）转移到 TooltipSignature 中，确保签名与调用上下文紧密关联。

2. **transferLastLineToTooltipSignature 函数**：
   ```typescript
   function transferLastLineToTooltipSignature(directContext, tooltipSignatureSnippet) {
     let lastNewline = directContext.lastIndexOf("\n");
     if (lastNewline === -1) {
       // 处理单行情况
       return ["", {
         ...tooltipSignatureSnippet,
         snippet: directContext + tooltipSignatureSnippet.snippet
       }];
     } else {
       // 处理多行情况
       let lastLine = directContext.substring(lastNewline + 1);
       return [directContext.substring(0, lastNewline + 1), {
         ...tooltipSignatureSnippet,
         snippet: lastLine + tooltipSignatureSnippet.snippet
       }];
     }
   }
   ```
   这个函数确保属性访问或方法调用的上下文与签名信息一起包含在 TooltipSignature 元素中。

3. **大型签名的处理**：
   ```typescript
   tooltipSignatureSnippet !== void 0 && tokenizer.tokenLength(tooltipSignatureSnippet.snippet) <= MAX_TOOLTIP_SIGNATURE_TOKENS ? (
     // 正常处理
   ) : tooltipSignatureSnippet !== void 0 ? (
     // 处理过大的签名
     let truncatedSignature = tokenizer.takeFirstTokens(tooltipSignatureSnippet.snippet, MAX_TOOLTIP_SIGNATURE_TOKENS);
     promptWishlist.append(truncatedSignature.text, "TooltipSignature")
   ) : null;
   ```
   对于超过 token 限制的签名，系统会截断它们以适应 token 预算，确保不会因为一个大型签名而牺牲其他重要上下文。