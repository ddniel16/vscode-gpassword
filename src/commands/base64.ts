export class Base64 {
  editorWindow: any;

  constructor(editorWindow: any) {
    this.editorWindow = editorWindow;
  }

  /**
   * Encodes the currently selected text(s) in the active editor to Base64.
   * Shows an information message upon success or an error message if no editor is open.
   */
  encode(): void {
    const activeTextEditor = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    activeTextEditor.edit((editBuilder: any) => {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, Buffer.from(textSelected, 'utf-8').toString('base64'));
      }
    });

    this.editorWindow.showInformationMessage("Selection encoded to Base64");
  }

  /**
   * Decodes the currently selected Base64-encoded text(s) in the active editor.
   * Shows an information message upon success or an error message if no editor is open or decoding fails.
   */
  decode(): void {
    const activeTextEditor = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      console.log("No open editor");
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    activeTextEditor.edit((editBuilder: any) => {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, Buffer.from(textSelected, 'base64').toString('utf-8'));
      }
    });

    this.editorWindow.showInformationMessage("Selection decoded from Base64");
  }
}
