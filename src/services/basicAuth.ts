import bcrypt from "bcrypt";

export class BasicAuth {
  window: any;

  constructor(window: any) {
    this.window = window;
  }

  passwordToBasicAuth(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    activeTextEditor.edit(function (editBuilder: any) {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, bcrypt.hashSync(textSelected, 10));
      }
    });

    this.window.showInformationMessage("Password to Basic Auth");
  }
}
