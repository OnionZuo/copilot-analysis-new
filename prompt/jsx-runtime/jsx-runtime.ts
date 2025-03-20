function functionComponentFunction(type, props, key) {
  let children = [];
  Array.isArray(props.children) ? children = props.children : props.children && (children = [props.children]);
  let componentProps = {
    ...props,
    children: children
  };
  return key && (componentProps.key = key), {
    type: type,
    props: componentProps
  };
},__name(functionComponentFunction, "functionComponentFunction");

,function fragmentFunction(children) {
  return {
    type: "f",
    children: children
  };
},__name(fragmentFunction, "fragmentFunction");

,fragmentFunction.isFragmentFunction = !0;