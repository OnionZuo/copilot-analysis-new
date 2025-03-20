var DependencySchema = Type.Object({
    name: Type.String(),
    version: Type.Optional(Type.String())
  }),
  ProjectMetadataSchema = Type.Object({
    language: Type.Object({
      id: Type.String(),
      name: Type.String(),
      version: Type.Optional(Type.String())
    }),
    libraries: Type.Array(DependencySchema),
    buildTools: Type.Array(DependencySchema)
  });

,var ProjectMetadataSkillId = "project-metadata";