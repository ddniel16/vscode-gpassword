import * as vscode from "vscode";

export interface ToolModule {
  getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string;
  handleMessage(webview: vscode.Webview): vscode.Disposable;
}
