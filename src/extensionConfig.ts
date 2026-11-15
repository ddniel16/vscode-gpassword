export type ToolId = "password" | "jwt" | "base64" | "salts" | "url" | "basicAuth";

interface ExtensionConfigType {
  randomLengthMin: number;
  randomLengthMax: number;
  defaultTool: ToolId;
  passwordGeneratorLength: number;
  passwordGeneratorDefault: {
    includeNumbers: boolean;
    includeSymbols: boolean;
    includeUppercase: boolean;
    excludeAmbiguous: boolean;
  };
}

export type ExtensionConfig = Readonly<ExtensionConfigType>;
