import * as vscode from "vscode";
import { decodeJWT, JwtError } from "../services/jwt";

export class JWT {
  vscodeWindow: typeof vscode.window;

  constructor(vscodeWindow: typeof vscode.window) {
    this.vscodeWindow = vscodeWindow;
  }

  decode(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No active text editor found. Please open a file and try again.");
      return;
    }

    if (activeTextEditor.selection.isEmpty) {
      this.vscodeWindow.showErrorMessage("No text selected");
      return;
    }

    const textSelected = activeTextEditor.document.getText(activeTextEditor.selection);

    if (textSelected.trim() === "") {
      this.vscodeWindow.showErrorMessage("No text selected");
      return;
    }

    let decodedText;
    try {
      decodedText = decodeJWT(textSelected);
    } catch (error) {
      this.vscodeWindow.showErrorMessage(error instanceof JwtError ? error.message : "Could not decode JWT.");
      return;
    }

    activeTextEditor.edit((editBuilder) => {
      for (const selection of activeTextEditor.selections) {
        editBuilder.replace(selection, JSON.stringify(decodedText, null, 2));
      }
    });

    this.vscodeWindow.showInformationMessage("JWT decode");
  }
}
