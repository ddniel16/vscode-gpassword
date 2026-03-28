import * as vscode from "vscode";
import * as urlService from "../services/url";

export class Url {
  vscodeWindow: typeof vscode.window;

  constructor(vscodeWindow: typeof vscode.window) {
    this.vscodeWindow = vscodeWindow;
  }

  encode(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    activeTextEditor.edit((editBuilder) => {
      for (const selection of activeTextEditor.selections) {
        const textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, urlService.encode(textSelected));
      }
    });

    this.vscodeWindow.showInformationMessage("Selection URL encoded");
  }

  decode(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No open editor");
      return;
    }

    activeTextEditor.edit((editBuilder) => {
      for (const selection of activeTextEditor.selections) {
        const textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, urlService.decode(textSelected));
      }
    });

    this.vscodeWindow.showInformationMessage("Selection URL decoded");
  }
}
