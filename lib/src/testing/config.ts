var _FixedBlockModeConfig = class _FixedBlockModeConfig extends BlockModeConfig {
  constructor(blockMode) {
    super();
    this.blockMode = blockMode;
  }
  async forLanguage(ctx, languageId) {
    return this.blockMode;
  }
};

,__name(_FixedBlockModeConfig, "FixedBlockModeConfig");

,var FixedBlockModeConfig = _FixedBlockModeConfig;