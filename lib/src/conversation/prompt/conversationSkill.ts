var _ConversationSkillRegistry = class _ConversationSkillRegistry {
  constructor() {
    this.skills = [];
  }
  registerSkill(skill) {
    if (this.getSkill(skill.id)) throw new Error(`Skill with id '${skill.id}' already registered`);
    this.skills.push(skill);
  }
  getSkill(id) {
    return this.skills.find(skill => skill.id === id);
  }
  getDescriptors() {
    return [...this.skills];
  }
};

,__name(_ConversationSkillRegistry, "ConversationSkillRegistry");

,var ConversationSkillRegistry = _ConversationSkillRegistry;