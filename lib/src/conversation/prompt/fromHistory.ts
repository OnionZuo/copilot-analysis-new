function fromHistory(history) {
  var _a;
  let turns = filterTurns(history),
    elidableHistory = [];
  for (let i = 0; i < turns.length; i++) {
    let turn = turns[i],
      request = formatTurnMessage(turn.request, i + 1),
      response = turn.response && ((_a = turn.response) == null ? void 0 : _a.type) !== "meta" ? formatTurnMessage(turn.response) : "",
      message = request;
    response !== "" && (message += `
` + response + (turns.length > 1 && i !== turns.length - 1 ? `
` : "")), elidableHistory.push(fromMessage(message));
  }
  return elidableHistory.length > 0 ? new ElidableText([[new ElidableText(["Consider the following conversation history:"]), 1], [weighElidableList(elidableHistory, "inverseLinear"), 1]]) : null;
},__name(fromHistory, "fromHistory");

,var MAX_TURNS_IN_HISTORY = 5;

,function filterTurns(turns, agent) {
  return turns.filter(turn => {
    var _a;
    return (turn.status === "success" || turn.status === "in-progress") && turn.request.message != "" && ((_a = turn.agent) == null ? void 0 : _a.agentSlug) === agent;
  }).reverse().slice(0, MAX_TURNS_IN_HISTORY).reverse();
},__name(filterTurns, "filterTurns");

,function formatTurnMessage(turnMessage, index = 0) {
  let role;
  switch (turnMessage.type) {
    case "user":
    case "template":
      role = "User";
      break;
    case "model":
      role = "GitHub Copilot";
      break;
    default:
      role = turnMessage.type;
  }
  let messagePrefix = turnMessage.message.startsWith("```") ? `
` : " ";
  return `${index > 0 ? `${index}) ` : ""}${role}:${messagePrefix}${turnMessage.message}`;
},__name(formatTurnMessage, "formatTurnMessage");