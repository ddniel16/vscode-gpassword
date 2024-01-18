
interface ExtensionConfigType {
  randomLengthMin: number;
  randomLengthMax: number;
}

export type ExtensionConfig = Readonly<ExtensionConfigType>;
