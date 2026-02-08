import * as vscode from "vscode";
import crypto from "node:crypto";

export class Strapi {
  editorWindow: any;

  constructor(editorWindow: any) {
    this.editorWindow = editorWindow;
  }

  /**
   * Generates a set of cryptographic salts and secrets for Strapi configuration.
   *
   * @param mode - Determines the separator used in the output ("env" for "=", "yml" for ": ").
   * @returns A string containing the generated keys and salts, formatted per the specified mode.
   */
  generateSalt(mode: string): string {
    let tokens = {
      APP_KEYS: [
        crypto.randomBytes(16).toString("base64"),
        crypto.randomBytes(16).toString("base64"),
        crypto.randomBytes(16).toString("base64"),
        crypto.randomBytes(16).toString("base64"),
      ].join(","),
      API_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
      TRANSFER_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
      ADMIN_JWT_SECRET: crypto.randomBytes(16).toString("base64"),
      JWT_SECRET: crypto.randomBytes(16).toString("base64"),
      REFRESH_SECRET: crypto.randomBytes(16).toString("base64"),
    };

    let separator = mode === "env" ? "=" : ": ";

    return Object.entries(tokens)
      .map(([key, value]) => `${key}${separator}${value}`)
      .join("\n");
  }

  /**
   * Inserts generated Strapi salts and secrets in YAML format at the current cursor position in the active text editor.
   * Shows an information message upon success or an error if no editor is open.
   *
   * @returns {void}
   */
  generateYml(): void {
    const activeTextEditor: vscode.TextEditor | undefined = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = this.generateSalt("yml");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.insert(selection.anchor, salt + "\n");
    });

    this.editorWindow.showInformationMessage("Strapi tokens generated");
  }

  /**
   * Inserts generated Strapi salts and secrets in ENV format at the current cursor position in the active text editor.
   * Shows an information message upon success or an error if no editor is open.
   *
   * @returns {void}
   */
  generateEnv(): void {
    const activeTextEditor: vscode.TextEditor | undefined = this.editorWindow.activeTextEditor;
    if (activeTextEditor === undefined) {
      this.editorWindow.showErrorMessage("No open editor");
      return;
    }

    const salt = this.generateSalt("env");
    const selection = activeTextEditor.selection;
    activeTextEditor.edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.insert(selection.anchor, salt + "\n");
    });

    this.editorWindow.showInformationMessage("Strapi tokens generated");
  }
}
