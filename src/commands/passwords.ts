import * as vscode from "vscode";
import crypto from "node:crypto";
import { type ExtensionConfig } from "../extensionConfig";
import { PasswordsGenerator } from "../services/passwords";

export class Passwords {
  randomLengthMin: number;
  randomLengthMax: number;
  vscodeWindow: typeof vscode.window;

  constructor(vscodeWindow: typeof vscode.window, $extConfig: ExtensionConfig) {
    this.randomLengthMin = $extConfig.randomLengthMin;
    this.randomLengthMax = $extConfig.randomLengthMax;
    this.vscodeWindow = vscodeWindow;

    if (this.randomLengthMin >= this.randomLengthMax) {
      throw new Error('The "Random Length Min" parameter is greater than the "Random Length Max"!');
    }
  }

  lettersGenerate(): void {
    const passwordGenerator = new PasswordsGenerator();
    const password = passwordGenerator.generatePassword({
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
    const password = passwordGenerator.generatePassword({
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
    const password = passwordGenerator.generatePassword({
      numbers: true,
      symbols: true,
      uppercase: true,
      customChars: "",
      length: this.randomNumber(),
    });

    this.printPassword(password);
  }

  private printPassword(password: string): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(selection.anchor, password);
    });

    this.vscodeWindow.showInformationMessage("Password generated");
  }

  randomNumber(): number {
    const min = Math.ceil(this.randomLengthMin);
    const max = Math.floor(this.randomLengthMax);
    return crypto.randomInt(min, max + 1);
  }
}
