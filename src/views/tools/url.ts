import crypto from "node:crypto";
import * as vscode from "vscode";
import * as urlService from "../../services/url";
import type { ToolModule } from "./types";

function handleMessage(webview: vscode.Webview): vscode.Disposable {
  return webview.onDidReceiveMessage(async (msg) => {
    const { type, payload } = msg;

    switch (type) {
      case "encode": {
        try {
          const encoded = urlService.encode(payload.text, payload.format);
          webview.postMessage({ type: "result", payload: encoded });
        } catch (error) {
          webview.postMessage({
            type: "error",
            payload: error instanceof Error ? error.message : "Encoding error",
          });
        }
        break;
      }
      case "decode": {
        try {
          const decoded = urlService.decode(payload.text, payload.format);
          webview.postMessage({ type: "result", payload: decoded });
        } catch (error) {
          webview.postMessage({
            type: "error",
            payload: error instanceof Error ? error.message : "Decoding error",
          });
        }
        break;
      }
      case "copy": {
        if (payload) {
          await vscode.env.clipboard.writeText(payload);
          vscode.window.showInformationMessage("Content copied to clipboard");
        }
        break;
      }
    }
  });
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "url.css"));
  const nonce = crypto.randomBytes(16).toString("hex");

  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource}`,
    `img-src ${webview.cspSource} data:`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
    "connect-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${styleUri}">
<title>URL Encoder/Decoder</title>
</head>
<body>
<h2>URL Encoder/Decoder</h2>

<div class="container">
  <textarea id="inputText" placeholder="Paste your text here to URL encode/decode..."></textarea>

  <div class="options">
    <label for="format">Format</label>
    <select id="format">
      <option value="component">URL component</option>
      <option value="uri">Full URL</option>
      <option value="form">Form data</option>
    </select>
  </div>

  <div class="button-group">
    <button id="encodeBtn" class="button">Encode</button>
    <button id="decodeBtn" class="button">Decode</button>
    <button id="copyBtn" class="button button-secondary">Copy</button>
    <button id="clearBtn" class="button button-secondary">Clear</button>
  </div>
  <small id="status" class="error" role="status"></small>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const textarea = document.getElementById('inputText');
  const encodeBtn = document.getElementById('encodeBtn');
  const decodeBtn = document.getElementById('decodeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const format = document.getElementById('format');
  const status = document.getElementById('status');

  encodeBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      status.textContent = '';
      vscode.postMessage({ type: 'encode', payload: { text, format: format.value } });
    }
  });

  decodeBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      status.textContent = '';
      vscode.postMessage({ type: 'decode', payload: { text, format: format.value } });
    }
  });

  copyBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      vscode.postMessage({ type: 'copy', payload: text });
    }
  });

  clearBtn.addEventListener('click', () => {
    textarea.value = '';
    status.textContent = '';
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'result') {
      textarea.value = message.payload;
      status.textContent = '';
    } else if (message.type === 'error') {
      status.textContent = message.payload;
    }
  });
})();
</script>
</body>
</html>`;
}

export const urlTool: ToolModule = { getHtml, handleMessage };
