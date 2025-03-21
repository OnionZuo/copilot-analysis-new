# GitHub Copilot Prompt 组装机制分析报告

## 概述

本报告对 GitHub Copilot 版本 1.288.0 的 prompt 组装机制进行了深入分析。通过对代码库的逆向工程，我们揭示了 Copilot 如何构建、组织和优化发送给底层模型的 prompt，以生成高质量的代码补全建议。

Copilot 的 prompt 组装系统是一个复杂而精密的机制，它通过多个组件的协同工作，确保生成的 prompt 包含最相关的上下文信息，同时遵守模型的 token 限制。本报告详细分析了这一系统的核心组件、它们之间的交互方式以及整体工作流程。

## 目录

1. PromptWishlist 机制
   - 元素管理
   - 优先级和排序
   - Token 管理

2. Snippet 提供器
   - 基础 SnippetProvider 类
   - 提供器类型及其贡献
   - 上下文整合

3. 分词系统
   - 分词器实现
   - Token 长度约束
   - Token 管理策略

4. Prompt 组装工作流
   - 执行流程
   - 组件交互
   - 数据流

## 1. PromptWishlist 机制

### 元素管理

PromptWishlist 类（定义在 `wishlist.ts` 中）是管理 prompt 元素的核心组件。它维护一个将被组装成最终发送给 Copilot 模型的 prompt 的元素集合。

元素管理系统的关键组件：

1. **PromptElement 类**：表示构成 prompt 的单个元素：
   ```typescript
   var _PromptElement = class _PromptElement {
     constructor(text, kind, tokens, id, score) {
       this.text = text;
       this.kind = kind;
       this.tokens = tokens;
       this.id = id;
       this.score = score;
     }
   };
   ```
   每个元素包含：
   - `text`：实际内容
   - `kind`：元素类型（如 "LanguageMarker"、"PathMarker" 等）
   - `tokens`：此元素的 token 计数
   - `id`：唯一标识符
   - `score`：用于优先级排序的重要性分数

2. **元素添加**：`append` 方法向 wishlist 添加新元素：
   ```typescript
   append(text, kind, tokens, score) {
     if (text === "") return;
     let normalizedText = this.snippetTextProcessor.processText(text, this.lineEndingOption);
     tokens === void 0 && (tokens = this.tokenizer.tokenLength(normalizedText)), score === void 0 && (score = 1);
     let element = new PromptElement(normalizedText, kind, tokens, this.nextId++, score);
     this.elements.push(element);
   }
   ```
   此方法：
   - 使用 snippetTextProcessor 规范化文本
   - 如果未提供，则计算 token 计数
   - 如果未指定，则分配默认分数 1
   - 创建新的 PromptElement 并将其添加到集合中

### 优先级和排序

PromptWishlist 使用两个关键类来确定元素的顺序和优先级：

1. **PromptOrderList**：定义不同类型元素在最终 prompt 中出现的顺序：
   ```typescript
   getOrderList() {
     switch (this.preset) {
       case "default":
         return ["PathMarker", "LanguageMarker", "Traits", "SimilarFile", "TooltipSignature", "BeforeCursor", "AfterCursor"];
       // ... 其他预设的不同排序
     }
   }
   ```
   默认顺序是：
   1. PathMarker（文件路径信息）
   2. LanguageMarker（编程语言）
   3. Traits（语言特定特性）
   4. SimilarFile（来自相似文件的代码）
   5. TooltipSignature（函数签名）
   6. BeforeCursor（光标位置之前的代码）
   7. AfterCursor（光标位置之后的代码）

2. **PromptPriorityList**：为不同元素类型分配优先级权重：
   ```typescript
   getPriorityList() {
     switch (this.preset) {
       case "default":
         return {
           PathMarker: 0,
           LanguageMarker: 0,
           Traits: 0,
           SimilarFile: 1,
           TooltipSignature: 0,
           BeforeCursor: 0,
           AfterCursor: 0
         };
       // ... 其他预设的不同优先级
     }
   }
   ```
   
   优先级值影响在达到 token 限制时如何选择元素：
   - 优先级 0：按顺序包含元素，直到达到 token 限制
   - 优先级 > 0：在包含之前，元素按分数 × 优先级排序

### Token 管理

PromptWishlist 实现了复杂的 token 管理，以确保 prompt 符合模型约束：

1. **Token 计数**：使用分词器计算每个元素的 token 数：
   ```typescript
   tokens === void 0 && (tokens = this.tokenizer.tokenLength(normalizedText))
   ```

2. **Token 预算分配**：`fulfill` 方法在遵守 token 限制的同时组装元素：
   ```typescript
   fulfill(suffixText, options, cachedSuffix) {
     let maxPromptLength = options.maxPromptLength,
       suffixOption = options.suffixOption || "fifteenPercent",
       // ... 其他选项
       
     // 计算后缀 tokens 和长度
     let suffixPercentOfMaxPromptLength = Math.floor(maxPromptLength * suffixPercent / 100);
     // ... 后缀 token 计算
     
     // 计算 prompt 的剩余 token 预算
     let maxPromptTokenLength = maxPromptLength - suffixTokensLength,
     
     // ... 基于类型、顺序和优先级的元素选择逻辑
     
     // 返回组装的 prompt
     let promptText = promptElements.map(element => element.text).join(""),
       promptTokens = promptElements.reduce((acc, element) => acc + element.tokens, 0),
       promptInfo = new PromptInfo(promptText, promptTokens, promptElements, suffixTokens, suffixText);
     
     return { promptInfo, newCachedSuffix };
   }
   ```

3. **元素选择策略**：
   - 对于优先级为 0 的元素：按顺序包含，直到达到 token 限制
   - 对于优先级 > 0 的元素：按分数 × 优先级排序，然后包含，直到达到限制
   - 最终组装时，无论选择策略如何，都按原始顺序排序元素

这种 token 管理确保了在模型的 token 限制内包含最重要的上下文。

## 2. Snippet 提供器

### 基础 SnippetProvider 类

`SnippetProvider` 类是所有专门提供器的基础，这些提供器为 prompt 贡献不同类型的内容。它定义在 `snippetProviders/snippetProvider.ts` 中：

```typescript
_SnippetProvider = class _SnippetProvider {
  constructor(workerProxy) {
    this.api = workerProxy;
  }
  async getSnippets(context, signal) {
    let start = Date.now();
    try {
      let snippets = await this.getSnippetsImpl(context, signal);
      return {
        providerType: this.type,
        snippets: snippets,
        runtime: Date.now() - start
      };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw new ProviderTimeoutError(this.type);
      throw {
        providerType: this.type,
        error: e
      };
    }
  }
  async getSnippetsImpl(context, signal) {
    return [];
  }
};
```

基础提供器的关键特性：
- 在构造函数中接受工作代理，用于异步操作
- 通过 `getSnippets` 方法提供通用接口
- 实现性能跟踪（测量运行时间）
- 一致地处理错误和超时
- 定义一个空的 `getSnippetsImpl` 方法，由子类重写

### 提供器类型及其贡献

Copilot 使用几种专门的 snippet 提供器，每种都为 prompt 贡献特定类型的上下文：

1. **LanguageSnippetProvider** (`language.ts`)：
   ```typescript
   var _LanguageSnippetProvider = class _LanguageSnippetProvider extends SnippetProvider {
     constructor() {
       super(...arguments);
       this.type = "language";
     }
     async getSnippetsImpl(context) {
       let { doc: doc } = context;
       if (!doc) return [];
       let languageMarker = getLanguageMarker(doc);
       return languageMarker ? [{
         provider: this.type,
         score: 1,
         snippet: newLineEnded(languageMarker)
       }] : [];
     }
   };
   ```
   - **目的**：向 prompt 添加语言标识标记
   - **贡献**：帮助模型理解正在使用哪种编程语言
   - **示例**：`// Language: javascript` 或 `# Language: python`

2. **PathSnippetProvider** (`path.ts`)：
   ```typescript
   var _PathSnippetProvider = class _PathSnippetProvider extends SnippetProvider {
     constructor() {
       super(...arguments);
       this.type = "path";
     }
     async buildSnippets(context) {
       let { currentFile: currentFile } = context;
       return currentFile.languageId = normalizeLanguageId(currentFile.languageId), [{
         provider: this.type,
         semantics: "snippet",
         snippet: newLineEnded(getPathMarker(currentFile)),
         relativePath: currentFile.relativePath,
         startLine: 0,
         endLine: 0,
         score: 0
       }];
     }
   };
   ```
   - **目的**：向 prompt 添加文件路径信息
   - **贡献**：提供关于文件位置和结构的上下文
   - **示例**：`// Path: src/components/Button.tsx`

3. **SimilarFilesProvider** (`similarFiles.ts`)：
   ```typescript
   var _SimilarFilesProvider = class _SimilarFilesProvider extends SnippetProvider {
     constructor() {
       super(...arguments);
       this.type = "similar-files";
     }
     async buildSnippets(context) {
       let {
         currentFile: currentFile,
         similarFiles: similarFiles,
         options: options
       } = context;
       return options && similarFiles && similarFiles.length ? await this.api.getSimilarSnippets(currentFile, similarFiles, options.similarFilesOptions) : [];
     }
   };
   ```
   - **目的**：包含来自与当前文件相似的文件的代码片段
   - **贡献**：提供来自代码库的相关代码模式和示例
   - **优先级**：高于其他提供器（在默认配置中优先级值为 1）

4. **TooltipSignatureProvider** (`tooltipSignature.ts`)：
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
   - **目的**：添加函数/方法签名信息
   - **贡献**：帮助参数补全和方法使用
   - **条件**：仅在光标位于方法或属性时添加

5. **CodeSnippetProvider** (`codeSnippet.ts`)：
   ```typescript
   var _CodeSnippetProvider = class _CodeSnippetProvider extends SnippetProvider {
     constructor() {
       super(...arguments);
       this.type = "code";
     }
     async buildSnippets(context) {
       var _a;
       if (context.codeSnippets === void 0 || context.codeSnippets.length === 0) return [];
       let {
         codeSnippets: codeSnippets
       } = context,
       snippetsByUri = new Map();
       // ... 处理逻辑
       return result;
     }
   };
   ```
   - **目的**：包含来自当前上下文的代码片段
   - **贡献**：提供光标周围的直接代码上下文
   - **处理**：按 URI 分组片段并组合它们

6. **TraitProvider** (`trait.ts`)：
   ```typescript
   var _TraitProvider = class _TraitProvider extends SnippetProvider {
     constructor() {
       super(...arguments);
       this.type = "trait";
     }
     async buildSnippets(context) {
       if (context.traits.length === 0) return [];
       let { currentFile: currentFile } = context;
       return currentFile.languageId = normalizeLanguageId(currentFile.languageId), [{
         provider: this.type,
         semantics: "snippet",
         snippet: commentBlockAsSingles(`Consider this related information:` + context.traits.map(trait => trait.kind === "string" ? newLineEnded(trait.value) : newLineEnded(`${trait.name}: ${trait.value}`)).join(""), currentFile.languageId),
         relativePath: currentFile.relativePath,
         startLine: 0,
         endLine: 0,
         score: 0
       }];
     }
   };
   ```
   - **目的**：添加特定语言的特性或特征
   - **贡献**：提供关于语言特性或模式的附加上下文

### 上下文整合

snippet 提供器协同工作，为 prompt 构建全面的上下文：

1. **上下文对象**：每个提供器接收包含相关信息的上下文对象：
   - `currentFile`：关于当前文件的信息（路径、语言等）
   - `doc`：文档内容和元数据
   - `similarFiles`：代码库中相似文件的列表
   - `tooltipSignature`：可用时的函数签名信息
   - `codeSnippets`：来自当前上下文的代码片段

2. **Snippet 格式**：提供器以一致的格式返回片段：
   ```typescript
   {
     provider: this.type,      // 提供器类型标识符
     semantics: "snippet",     // 语义（snippet 或 snippets）
     snippet: content,         // 实际内容
     relativePath: path,       // 相关文件路径
     startLine: lineNumber,    // 起始行
     endLine: lineNumber,      // 结束行
     score: importance         // 重要性分数
   }
   ```

3. **与 PromptWishlist 的集成**：`kindForSnippetProviderType` 函数将提供器类型映射到 PromptWishlist 元素类型：
   ```typescript
   function kindForSnippetProviderType(provider) {
     switch (provider) {
       case "similar-files": return "SimilarFile";
       case "path": return "PathMarker";
       case "language": return "LanguageMarker";
       case "tooltip-signature": return "TooltipSignature";
       case "trait": return "Traits";
       case "code": return "CodeSnippet";
       default: throw new Error(`Unknown snippet provider type ${provider}`);
     }
   }
   ```

这种映射确保来自不同提供器的片段在最终 prompt 组装中被正确分类和优先处理。
