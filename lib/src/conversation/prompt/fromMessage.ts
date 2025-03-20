function fromMessage(message) {
  let lines = message.split(`
`),
    chunks = [],
    inCodeBlock = !1,
    codeBlockLines = [];
  for (let line of lines) line.startsWith("```") ? (inCodeBlock ? (chunks.push([elidableTextForSourceCode(codeBlockLines.join(`
`)), 1]), codeBlockLines = [], chunks.push([new ElidableText([line]), 1])) : chunks.push([new ElidableText([line]), 1]), inCodeBlock = !inCodeBlock) : inCodeBlock ? codeBlockLines.push(line) : chunks.push([new ElidableText([line]), .8]);
  return inCodeBlock && (chunks.push([elidableTextForSourceCode(codeBlockLines.join(`
`)), 1]), chunks.push([new ElidableText(["```"]), 1])), new ElidableText(chunks);
},__name(fromMessage, "fromMessage");