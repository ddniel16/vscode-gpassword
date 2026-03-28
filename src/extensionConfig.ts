export type ToolId = "password" | "jwt" | "base64" | "salts" | "url";

interface ExtensionConfigType {
  randomLengthMin: number;
  randomLengthMax: number;
  defaultTool: ToolId;
  passwordGeneratorLength: number;
  passwordGeneratorDefault: {
    includeNumbers: boolean;
    includeSymbols: boolean;
    includeUppercase: boolean;
  };
}

export type ExtensionConfig = Readonly<ExtensionConfigType>;
