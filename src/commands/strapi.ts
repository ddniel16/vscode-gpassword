import * as vscode from "vscode";
import { generateStrapiTokens } from "../services/salts";

export class Strapi {
  vscodeWindow: typeof vscode.window;

  constructor(vscodeWindow: typeof vscode.window) {
    this.vscodeWindow = vscodeWindow;
  }

  generateYml(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = generateStrapiTokens("yaml");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(selection.anchor, salt + "\n");
    });

    this.vscodeWindow.showInformationMessage("Strapi tokens generated");
  }

  generateEnv(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = generateStrapiTokens("env");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(selection.anchor, salt + "\n");
    });

    this.vscodeWindow.showInformationMessage("Strapi tokens generated");
  }
}
