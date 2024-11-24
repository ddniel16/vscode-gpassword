export class Base64 {
  window: any;

  constructor(window: any) {
    this.window = window;
  }

  encode(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    activeTextEditor.edit(function (editBuilder: any) {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, btoa(textSelected));
      }
    });

    this.window.showInformationMessage("Base 64 encode");
  }

  decode(): void {
    const activeTextEditor = this.window.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.window.showErrorMessage("No open editor");
      console.log("No open editor");
      return;
    }

    activeTextEditor.edit(function (editBuilder: any) {
      for (const selection of activeTextEditor.selections) {
        let textSelected = activeTextEditor.document.getText(selection);
        editBuilder.replace(selection, atob(textSelected));
      }
    });

    this.window.showInformationMessage("Base 64 decode");
  }
}
