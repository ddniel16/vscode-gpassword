interface ExtensionConfigType {
  randomLengthMin: number;
  randomLengthMax: number;
  passwordGeneratorLength: number;
  passwordGeneratorDefault: {
    includeNumbers: boolean;
    includeSymbols: boolean;
    includeUppercase: boolean;
  };
}

export type ExtensionConfig = Readonly<ExtensionConfigType>;
