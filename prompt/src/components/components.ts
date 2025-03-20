function Text(props) {
  if (props.children) return Array.isArray(props.children) ? props.children.join("") : props.children;
},__name(Text, "Text");

,function Chunk(props) {
  return props.children;
},__name(Chunk, "Chunk");