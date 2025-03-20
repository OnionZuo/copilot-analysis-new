var path = fn(require("path"));

,var _Language = class _Language {
  constructor(languageId, isGuess, fileExtension) {
    this.languageId = languageId;
    this.isGuess = isGuess;
    this.fileExtension = fileExtension;
  }
};

,__name(_Language, "Language");

,var Language = _Language,
  _LanguageDetection = class _LanguageDetection {};

,__name(_LanguageDetection, "LanguageDetection");

,var LanguageDetection = _LanguageDetection,
  knownExtensions = new Map(),
  knownFilenames = new Map(),
  _a,
  _b;

,for (let [languageId, {
  extensions: extensions,
  filenames: filenames
}] of Object.entries(knownLanguages)) {
  for (let extension of extensions) knownExtensions.set(extension, [...((_a = knownExtensions.get(extension)) != null ? _a : []), languageId]);
  for (let filename of filenames != null ? filenames : []) knownFilenames.set(filename, [...((_b = knownFilenames.get(filename)) != null ? _b : []), languageId]);
},var _FilenameAndExensionLanguageDetection = class _FilenameAndExensionLanguageDetection extends LanguageDetection {
  detectLanguage(doc) {
    let filename = basename(doc.uri),
      extension = Jee.extname(filename).toLowerCase(),
      extensionWithoutTemplate = this.extensionWithoutTemplateLanguage(filename, extension),
      languageIdWithGuessing = this.detectLanguageId(filename, extensionWithoutTemplate);
    return new Language(languageIdWithGuessing.languageId, languageIdWithGuessing.isGuess, this.computeFullyQualifiedExtension(extension, extensionWithoutTemplate));
  }
  extensionWithoutTemplateLanguage(filename, extension) {
    if (knownTemplateLanguageExtensions.includes(extension)) {
      let filenameWithoutExtension = filename.substring(0, filename.lastIndexOf(".")),
        extensionWithoutTemplate = Jee.extname(filenameWithoutExtension).toLowerCase();
      if (extensionWithoutTemplate.length > 0 && knownFileExtensions.includes(extensionWithoutTemplate) && this.isExtensionValidForTemplateLanguage(extension, extensionWithoutTemplate)) return extensionWithoutTemplate;
    }
    return extension;
  }
  isExtensionValidForTemplateLanguage(extension, extensionWithoutTemplate) {
    let limitations = templateLanguageLimitations[extension];
    return !limitations || limitations.includes(extensionWithoutTemplate);
  }
  detectLanguageId(filename, extension) {
    var _a;
    if (knownFilenames.has(filename)) return {
      languageId: knownFilenames.get(filename)[0],
      isGuess: !1
    };
    let extensionCandidates = (_a = knownExtensions.get(extension)) != null ? _a : [];
    if (extensionCandidates.length > 0) return {
      languageId: extensionCandidates[0],
      isGuess: extensionCandidates.length > 1
    };
    for (; filename.includes(".");) if (filename = filename.replace(/\.[^.]*$/, ""), knownFilenames.has(filename)) return {
      languageId: knownFilenames.get(filename)[0],
      isGuess: !1
    };
    return {
      languageId: "unknown",
      isGuess: !0
    };
  }
  computeFullyQualifiedExtension(extension, extensionWithoutTemplate) {
    return extension !== extensionWithoutTemplate ? extensionWithoutTemplate + extension : extension;
  }
};

,__name(_FilenameAndExensionLanguageDetection, "FilenameAndExensionLanguageDetection");

,var FilenameAndExensionLanguageDetection = _FilenameAndExensionLanguageDetection,
  _GroupingLanguageDetection = class _GroupingLanguageDetection extends LanguageDetection {
    constructor(delegate) {
      super();
      this.delegate = delegate;
    }
    detectLanguage(doc) {
      let language = this.delegate.detectLanguage(doc),
        languageId = language.languageId;
      return languageId === "c" || languageId === "cpp" ? new Language("cpp", language.isGuess, language.fileExtension) : language;
    }
  };

,__name(_GroupingLanguageDetection, "GroupingLanguageDetection");

,var GroupingLanguageDetection = _GroupingLanguageDetection,
  _ClientProvidedLanguageDetection = class _ClientProvidedLanguageDetection extends LanguageDetection {
    constructor(delegate) {
      super();
      this.delegate = delegate;
    }
    detectLanguage(doc) {
      return doc.uri.startsWith("untitled:") || doc.uri.startsWith("vscode-notebook-cell:") ? new Language(doc.languageId, !0, "") : this.delegate.detectLanguage(doc);
    }
  };

,__name(_ClientProvidedLanguageDetection, "ClientProvidedLanguageDetection");

,var ClientProvidedLanguageDetection = _ClientProvidedLanguageDetection,
  languageDetection = new GroupingLanguageDetection(new ClientProvidedLanguageDetection(new FilenameAndExensionLanguageDetection()));

,function detectLanguage({
  uri: uri,
  clientLanguageId: clientLanguageId
}) {
  let language = languageDetection.detectLanguage({
    uri: uri,
    languageId: "UNKNOWN"
  });
  return language.languageId === "UNKNOWN" ? clientLanguageId : language.languageId;
},__name(detectLanguage, "detectLanguage");