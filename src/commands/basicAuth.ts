import bcrypt from "bcrypt";

export class BasicAuth {
  editorWindow: any;

  constructor(editorWindow: any) {
    this.editorWindow = editorWindow;
  }

  /**
   * Converts the currently selected text(s) in the active editor to Basic Auth format.
   * Uses bcrypt to hash the selected text and replaces it in the editor.
   * Shows an information message upon success or an error message if no editor is open.
   */
  passwordToHash(): void {
    const activeTextEditor = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    activeTextEditor.edit(function (editBuilder: any) {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, bcrypt.hashSync(textSelected, 10));
      }
    });

    this.editorWindow.showInformationMessage("Password to Basic Auth");
  }
}
