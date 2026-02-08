import crypto from "crypto";

export class WordPressSalts {
  hashKeys: string[];
  window: any;

  constructor(window: any) {
    this.window = window;
    this.hashKeys = [
      "AUTH_KEY",
      "AUTH_SALT",
      "LOGGED_IN_KEY",
      "LOGGED_IN_SALT",
      "NONCE_KEY",
      "NONCE_SALT",
      "SECURE_AUTH_KEY",
      "SECURE_AUTH_SALT",
    ];
  }

  generateSalt(): string {
    const excludeChars = ["'", '"', "\\"];
    let salt = "";

    while (salt.length < 64) {
      const charCode = crypto.randomInt(33, 127);
      const char = String.fromCharCode(charCode);
      if (!excludeChars.includes(char)) {
        salt += char;
      }
    }

    return salt;
  }
  generateYml(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    let yml = this.hashKeys.map((key) => `${key}: "${this.generateSalt()}"`).join("\n");

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, yml);
    });

    this.window.showInformationMessage("WordPress salts generated");
  }

  generateEnv(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    console.log();

    let env = this.hashKeys.map((key) => `${key}='${this.generateSalt()}'`).join("\n");

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, env);
    });

    this.window.showInformationMessage("WordPress salts generated");
  }
}
