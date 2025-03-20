var assertShape = __name((schema, payload) => {
  if (value_exports.Check(schema, payload)) return payload;
  let error = `Typebox schema validation failed:
${[...value_exports.Errors(schema, payload)].map(i => `${i.path} ${i.message}`).join(`
`)}`;
  throw new Error(error);
}, "assertShape");