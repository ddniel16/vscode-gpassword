import { type ExtensionConfig } from "../extensionConfig";

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
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    let password = this.passwordGenerator("letters");

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, password);
    });

    this.window.showInformationMessage("Password generated");
  }

  lettersNumbersGenerate(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    let password = this.passwordGenerator("letters-numbers");

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, password);
    });

    this.window.showInformationMessage("Password generated");
  }

  allCharactersGenerate(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    let password = this.passwordGenerator("all-generate");

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

  passwordGenerator(typeGenerate: string): string {
    const passwordLength = this.randomNumber();

    const letters = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ";
    const symbols = "[]{}()¿?-_.:,;><|/¡!^*+=@#$%&";
    const numeric = "1234567890";

    let characters = "";
    switch (typeGenerate) {
    case "letters":
      characters = letters;
      break;
    case "letters-numbers":
      characters = letters + numeric;
      break;
    case "all-generate":
      characters = letters + numeric + symbols;
      break;
    }

    const charLength = characters.length;

    let password = "";
    let index = 0;
    while (index < passwordLength) {
      let charIndex = Math.floor(
        Math.floor(Math.random() * charLength)
      );
      password += characters.charAt(charIndex);
      ++index;
    }

    return password;
  }
}
