import crypto from "node:crypto";
import * as vscode from "vscode";
import { generateWordPressSalts, generateStrapiTokens } from "../services/salts";

export const SALTS_VIEW_ID = "passwordGenerator.salts";

export class SaltsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = SALTS_VIEW_ID;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      const { type, payload } = msg;

      switch (type) {
        case "wordpress-env": {
          const result = generateWordPressSalts("env");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "wordpress-yaml": {
          const result = generateWordPressSalts("yaml");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "strapi-env": {
          const result = generateStrapiTokens("env");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "strapi-yaml": {
          const result = generateStrapiTokens("yaml");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "copy": {
          if (payload) {
            await vscode.env.clipboard.writeText(payload);
            vscode.window.showInformationMessage("Salts copied to clipboard");
          }
          break;
        }
      }
    });

    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "salts.css")
    );

    const nonce = crypto.randomBytes(16).toString("hex");

    const csp = [
      "default-src 'none'",
      `style-src ${webviewView.webview.cspSource}`,
      `img-src ${webviewView.webview.cspSource} data:`,
      `font-src ${webviewView.webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
      "connect-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join("; ");

    webviewView.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${styleUri}">
<title>Salts Generator</title>
</head>
<body>
<h2>Salts Generator</h2>

<div class="container">
  <textarea id="saltsText" placeholder="Select an option to generate salts..."></textarea>

  <div class="button-group">
    <h3>WordPress</h3>
    <div class="buttons-row">
      <button id="wordpressEnvBtn" class="button">ENV Format</button>
      <button id="wordpressYamlBtn" class="button">YAML Format</button>
    </div>
  </div>

  <div class="button-group">
    <h3>Strapi</h3>
    <div class="buttons-row">
      <button id="strapiEnvBtn" class="button">ENV Format</button>
      <button id="strapiYamlBtn" class="button">YAML Format</button>
    </div>
  </div>

  <div class="copy-section">
    <button id="copyBtn" class="button button-secondary">Copy</button>
  </div>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const textarea = document.getElementById('saltsText');
  const wordpressEnvBtn = document.getElementById('wordpressEnvBtn');
  const wordpressYamlBtn = document.getElementById('wordpressYamlBtn');
  const strapiEnvBtn = document.getElementById('strapiEnvBtn');
  const strapiYamlBtn = document.getElementById('strapiYamlBtn');
  const copyBtn = document.getElementById('copyBtn');

  wordpressEnvBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'wordpress-env' });
  });

  wordpressYamlBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'wordpress-yaml' });
  });

  strapiEnvBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'strapi-env' });
  });

  strapiYamlBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'strapi-yaml' });
  });

  copyBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      vscode.postMessage({ type: 'copy', payload: text });
    }
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'result') {
      textarea.value = message.payload;
    }
  });
})();
</script>
</body>
</html>`;
  }
}
