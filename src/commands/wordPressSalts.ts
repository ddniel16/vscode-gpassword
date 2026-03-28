import * as vscode from "vscode";
import { generateWordPressSalts } from "../services/salts";

export class WordPressSalts {
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

    const yml = generateWordPressSalts("yaml");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(selection.anchor, yml);
    });

    this.vscodeWindow.showInformationMessage("WordPress salts generated");
  }

  generateEnv(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    const env = generateWordPressSalts("env");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder) => {
      editBuilder.insert(selection.anchor, env);
    });

    this.vscodeWindow.showInformationMessage("WordPress salts generated");
  }
}
