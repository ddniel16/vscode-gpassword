import { type ExtensionConfig } from "../extensionConfig";
import { PasswordsGenerator } from "../services/passwords";

export class Passwords {
  randomLengthMin: number;
  randomLengthMax: number;
  window: any;

  constructor(window: any, $extConfig: ExtensionConfig) {
    this.randomLengthMin = $extConfig.randomLengthMin;
    this.randomLengthMax = $extConfig.randomLengthMax;
    this.window = window;

    if (this.randomLengthMin >= this.randomLengthMax) {
      throw new Error('The "Random Length Min" parameter is greater than the "Random Length Max"!');
    }
  }

  lettersGenerate(): void {
    const passwordGenerator = new PasswordsGenerator();
    let password = passwordGenerator.generatePassword({
      numbers: false,
      symbols: false,
      uppercase: true,
      customChars: "",
      length: this.randomNumber(),
    });

    this.printPassword(password);
  }

  lettersNumbersGenerate(): void {
    const passwordGenerator = new PasswordsGenerator();
    let password = passwordGenerator.generatePassword({
      numbers: true,
      symbols: false,
      uppercase: true,
      customChars: "",
      length: this.randomNumber(),
    });

    this.printPassword(password);
  }

  allCharactersGenerate(): void {
    const passwordGenerator = new PasswordsGenerator();
    let password = passwordGenerator.generatePassword({
      numbers: true,
      symbols: true,
      uppercase: true,
      customChars: "",
      length: this.randomNumber(),
    });

    this.printPassword(password);
  }

  private printPassword(password: string): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      return;
    }

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, password);
    });

    this.window.showInformationMessage("Password generated");
  }

  randomNumber(): number {
    const min = Math.ceil(this.randomLengthMin);
    const max = Math.floor(this.randomLengthMax);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
