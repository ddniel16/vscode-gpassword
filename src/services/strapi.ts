import crypto from "node:crypto";

export class Strapi {
  editorWindow: any;

  constructor(editorWindow: any) {
    this.editorWindow = editorWindow;
  }

  generateSalt(): object {
    return {
      APP_KEYS: [
        crypto.randomBytes(16).toString('base64'),
        crypto.randomBytes(16).toString('base64'),
        crypto.randomBytes(16).toString('base64'),
        crypto.randomBytes(16).toString('base64')
      ].join(','),
      API_TOKEN_SALT: crypto.randomBytes(16).toString('base64'),
      TRANSFER_TOKEN_SALT: crypto.randomBytes(16).toString('base64'),
      ADMIN_JWT_SECRET: crypto.randomBytes(16).toString('base64'),
      JWT_SECRET: crypto.randomBytes(16).toString('base64'),
      REFRESH_SECRET: crypto.randomBytes(16).toString('base64'),
    };
  }

  generateYml(): void {
    const activeTextEditor = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      console.log("No open editor");
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = Object.entries(this.generateSalt())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, salt);
    });

    this.editorWindow.showInformationMessage("WordPress salts generated");
  }

  generateEnv(): void {
    const activeTextEditor = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      console.log("No open editor");
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = Object.entries(this.generateSalt())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const selection = activeTextEditor.selection;
    activeTextEditor.edit(function (editBuilder: any) {
      editBuilder.insert(selection.anchor, salt);
    });

    this.editorWindow.showInformationMessage("WordPress salts generated");
  }
}
