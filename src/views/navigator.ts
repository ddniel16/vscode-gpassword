import * as vscode from "vscode";
import type { ToolId } from "../extensionConfig";

interface ToolDefinition {
  id: ToolId;
  label: string;
  icon: string;
}

const TOOLS: readonly ToolDefinition[] = [
  { id: "password", label: "Password Generator", icon: "key" },
  { id: "jwt", label: "JWT Decoder & Validator", icon: "code" },
  { id: "base64", label: "Base64 Encoder/Decoder", icon: "file-binary" },
  { id: "salts", label: "Salts Generator", icon: "shield" },
  { id: "url", label: "URL Encoder/Decoder", icon: "link" },
] as const;

export class ToolItem extends vscode.TreeItem {
  constructor(
    public readonly toolId: ToolId,
    label: string,
    icon: string,
    active: boolean
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = {
      command: "gpassword.switchTool",
      title: "Switch Tool",
      arguments: [toolId],
    };
    this.description = active ? "●" : "";
    this.contextValue = active ? "activeTool" : "tool";
  }
}

export class NavigatorProvider implements vscode.TreeDataProvider<ToolItem> {
  public static readonly viewId = "passwordGenerator.navigator";

  private _activeTool: ToolId;
  private _onDidChangeTreeData = new vscode.EventEmitter<ToolItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(defaultTool: ToolId) {
    this._activeTool = defaultTool;
  }

  get activeTool(): ToolId {
    return this._activeTool;
  }

  setActiveTool(toolId: ToolId): void {
    this._activeTool = toolId;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ToolItem): vscode.TreeItem {
    return element;
  }

  getChildren(): ToolItem[] {
    return TOOLS.map((t) => new ToolItem(t.id, t.label, t.icon, t.id === this._activeTool));
  }
}
