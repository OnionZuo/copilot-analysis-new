var RemoteSchema = Type.Object({
    name: Type.String(),
    url: Type.String()
  }),
  GitMetadataSchema = Type.Object({
    path: Type.String(),
    head: Type.Optional(Type.Object({
      name: Type.String(),
      upstream: Type.Optional(RemoteSchema)
    })),
    remotes: Type.Optional(Type.Array(RemoteSchema))
  });

,var GitMetadataSkillId = "git-metadata";