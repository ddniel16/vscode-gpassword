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
  { id: "basicAuth", label: "Basic Auth", icon: "lock" },
] as const;

export class ToolItem extends vscode.TreeItem {
  constructor(
    public readonly toolId: ToolId,
    label: string,
    icon: string,
    active: boolean
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = toolId;
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
  private readonly _items: ToolItem[];
  private _onDidChangeTreeData = new vscode.EventEmitter<ToolItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(defaultTool: ToolId) {
    this._activeTool = defaultTool;
    this._items = TOOLS.map((tool) => new ToolItem(tool.id, tool.label, tool.icon, tool.id === defaultTool));
  }

  get activeTool(): ToolId {
    return this._activeTool;
  }

  setActiveTool(toolId: ToolId): void {
    const previous = this._items.find((item) => item.toolId === this._activeTool);
    const next = this._items.find((item) => item.toolId === toolId);
    if (!next) {
      throw new Error(`Unknown tool: ${toolId}`);
    }
    this._activeTool = toolId;
    if (previous && previous !== next) {
      previous.description = "";
      previous.contextValue = "tool";
      this._onDidChangeTreeData.fire(previous);
    }
    next.description = "●";
    next.contextValue = "activeTool";
    this._onDidChangeTreeData.fire(next);
  }

  getTreeItem(element: ToolItem): vscode.TreeItem {
    return element;
  }

  getParent(): undefined {
    return undefined;
  }

  getActiveItem(): ToolItem {
    const item = this._items.find((tool) => tool.toolId === this._activeTool);
    if (!item) {
      throw new Error(`Unknown tool: ${this._activeTool}`);
    }
    return item;
  }

  getChildren(): ToolItem[] {
    return this._items;
  }
}
