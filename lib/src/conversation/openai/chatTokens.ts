function countMessagesTokens(messages, modelConfiguration) {
  let tokenizer = getTokenizer(modelConfiguration.tokenizer),
    numTokens = 0;
  for (let message of messages) numTokens += modelConfiguration.baseTokensPerMessage, message.role && (numTokens += tokenizer.tokenize(message.role).length), message.name && (numTokens += tokenizer.tokenize(message.name).length + modelConfiguration.baseTokensPerName), message.content && (numTokens += tokenizer.tokenize(message.content).length);
  return numTokens += modelConfiguration.baseTokensPerCompletion, numTokens;
},__name(countMessagesTokens, "countMessagesTokens");