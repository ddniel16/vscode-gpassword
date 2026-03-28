import * as vscode from "vscode";
import type { ToolId } from "../extensionConfig";
import type { ToolModule } from "./tools/types";

import { base64Tool } from "./tools/base64";
import { jwtTool } from "./tools/jwt";
import { passwordTool } from "./tools/password";
import { saltsTool } from "./tools/salts";
import { urlTool } from "./tools/url";

export type { ToolModule };

const TOOL_REGISTRY: Record<ToolId, ToolModule> = {
  base64: base64Tool,
  jwt: jwtTool,
  password: passwordTool,
  salts: saltsTool,
  url: urlTool,
};

export class ToolViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "passwordGenerator.toolView";

  private _webviewView: vscode.WebviewView | undefined;
  private _messageDisposable: vscode.Disposable | undefined;
  private _currentTool: ToolId;

  constructor(
    private readonly context: vscode.ExtensionContext,
    defaultTool: ToolId
  ) {
    this._currentTool = defaultTool;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };

    webviewView.onDidDispose(() => {
      this._webviewView = undefined;
      this._messageDisposable?.dispose();
      this._messageDisposable = undefined;
    });

    this._renderTool(this._currentTool);
  }

  switchTool(toolId: ToolId): void {
    this._currentTool = toolId;
    if (this._webviewView) {
      this._renderTool(toolId);
    }
  }

  private _renderTool(toolId: ToolId): void {
    const view = this._webviewView;
    if (!view) {
      return;
    }

    // Dispose previous message handler
    this._messageDisposable?.dispose();

    const toolModule = TOOL_REGISTRY[toolId];
    view.webview.html = toolModule.getHtml(view.webview, this.context.extensionUri);
    this._messageDisposable = toolModule.handleMessage(view.webview);
  }
}
