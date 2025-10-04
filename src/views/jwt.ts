import * as vscode from "vscode";

export class JWTViewProvider implements vscode.WebviewViewProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    console.log("Resolving JWT View");

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        console.log('[JWTView] se hizo visible nuevamente');
      } else {
        console.log('[JWTView] se ocultó');
      }
    });

    webviewView.webview.html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <h3>JWT</h3>
      </body>
      </html>
    `;
  }
}
