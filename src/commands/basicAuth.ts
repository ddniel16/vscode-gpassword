import * as vscode from "vscode";
import bcrypt from "bcrypt";

export class BasicAuth {
  vscodeWindow: typeof vscode.window;

  constructor(vscodeWindow: typeof vscode.window) {
    this.vscodeWindow = vscodeWindow;
  }

  async passwordToHash(): Promise<void> {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    const selections = activeTextEditor.selections;
    const hashes = await Promise.all(
      selections.map((selection) => {
        const text = activeTextEditor.document.getText(selection);
        return bcrypt.hash(text, 10);
      })
    );

    activeTextEditor.edit((editBuilder) => {
      selections.forEach((selection, i) => {
        editBuilder.replace(selection, hashes[i]);
      });
    });

    this.vscodeWindow.showInformationMessage("Password to Basic Auth");
  }
}
