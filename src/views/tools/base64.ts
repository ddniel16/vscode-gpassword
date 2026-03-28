import crypto from "node:crypto";
import * as vscode from "vscode";
import * as base64Service from "../../services/base64";
import type { ToolModule } from "./types";

function handleMessage(webview: vscode.Webview): vscode.Disposable {
  return webview.onDidReceiveMessage(async (msg) => {
    const { type, payload } = msg;

    switch (type) {
      case "encode": {
        try {
          const encoded = base64Service.encode(payload);
          webview.postMessage({ type: "result", payload: encoded });
        } catch (error) {
          webview.postMessage({
            type: "result",
            payload: `Error: ${error instanceof Error ? error.message : "Encoding error"}`,
          });
        }
        break;
      }
      case "decode": {
        try {
          const decoded = base64Service.decode(payload);
          webview.postMessage({ type: "result", payload: decoded });
        } catch (error) {
          webview.postMessage({
            type: "result",
            payload: `Error: ${error instanceof Error ? error.message : "Decoding error"}`,
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
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "base64.css"));
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
<title>Base64 Encoder/Decoder</title>
</head>
<body>
<h2>Base64 Encoder/Decoder</h2>

<div class="container">
  <textarea id="inputText" placeholder="Paste your text here to encode/decode..."></textarea>

  <div class="button-group">
    <button id="encodeBtn" class="button">Encode</button>
    <button id="decodeBtn" class="button">Decode</button>
    <button id="copyBtn" class="button button-secondary">Copy</button>
    <button id="clearBtn" class="button button-secondary">Clear</button>
  </div>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const textarea = document.getElementById('inputText');
  const encodeBtn = document.getElementById('encodeBtn');
  const decodeBtn = document.getElementById('decodeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  encodeBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      vscode.postMessage({ type: 'encode', payload: text });
    }
  });

  decodeBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (text) {
      vscode.postMessage({ type: 'decode', payload: text });
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

export const base64Tool: ToolModule = { getHtml, handleMessage };
