export class JWT {
  vscodeWindow: any;

  constructor(vscodeWindow: any) {
    this.vscodeWindow = vscodeWindow;
  }

  base64UrlDecode(string: string): string {
    let base64 = string.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    base64 += padding;
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  checkStringIsJWT(string: string): boolean {
    const parts = string.split('.');
    if (parts.length !== 3) {
      this.vscodeWindow.showErrorMessage('Invalid JWT');
      return false;
    }

    const isValid = parts.every(part => /^[A-Za-z0-9-_]*$/.test(part));

    if (!isValid) {
      this.vscodeWindow.showErrorMessage('Invalid JWT');
      return false;
    }

    return true;
  }

  decode(): void {
    const activeTextEditor = this.vscodeWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.vscodeWindow.showErrorMessage("No active text editor found. Please open a file and try again.");
      console.log("No active text editor found. Please open a file and try again.");
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

    if (!this.checkStringIsJWT(textSelected)) {
      this.vscodeWindow.showErrorMessage("Invalid JWT");
      return;
    }

    const [header, payload, signature] = textSelected.split('.');

    let decodedText = {};
    try {
      decodedText = {
        header: JSON.parse(this.base64UrlDecode(header)),
        payload: JSON.parse(this.base64UrlDecode(payload)),
        signature: signature
      };
    } catch (error) {
      this.vscodeWindow.showErrorMessage("Error decoding JWT");
      return;
    }

    activeTextEditor.edit(function (editBuilder: any) {
      for (const selection of activeTextEditor.selections) {
        editBuilder.replace(selection, JSON.stringify(decodedText, null, 2));
      }
    });

    this.vscodeWindow.showInformationMessage("JWT decode");
  }
}
