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
          const encoded = base64Service.encode(payload.text, payload.format, payload.includePadding);
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
          const decoded = base64Service.decode(payload.text, payload.format);
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
  <div class="text-field">
    <label for="inputText">Input</label>
    <textarea id="inputText" placeholder="Paste your text here to encode/decode..." aria-label="Text to encode or decode"></textarea>
  </div>

  <div class="options">
    <label for="format">Format</label>
    <select id="format">
      <option value="base64">Base64</option>
      <option value="base64url">Base64URL</option>
    </select>
    <label id="paddingOption" for="includePadding" hidden>
      <input id="includePadding" type="checkbox">
      Include padding
    </label>
  </div>

  <div class="button-group transform-actions" aria-label="Input actions">
    <button id="encodeBtn" class="button" type="button" title="Encode the input" disabled>Encode</button>
    <button id="decodeBtn" class="button" type="button" title="Decode the input" disabled>Decode</button>
  </div>

  <div class="text-field">
    <label for="outputText">Output</label>
    <textarea id="outputText" placeholder="The result will appear here..." aria-label="Encoding or decoding result" readonly></textarea>
  </div>

  <div class="button-group output-actions" aria-label="Output actions">
    <button id="copyBtn" class="button button-secondary" type="button" title="Copy the output" disabled>Copy output</button>
    <button id="clearBtn" class="button button-secondary" type="button" title="Clear input and output">Clear</button>
  </div>
  <small id="status" class="error" role="alert" aria-live="polite"></small>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const encodeBtn = document.getElementById('encodeBtn');
  const decodeBtn = document.getElementById('decodeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const format = document.getElementById('format');
  const includePadding = document.getElementById('includePadding');
  const paddingOption = document.getElementById('paddingOption');
  const status = document.getElementById('status');

  function updateActions() {
    const hasInput = inputText.value.length > 0;
    encodeBtn.disabled = !hasInput;
    decodeBtn.disabled = !hasInput;
    copyBtn.disabled = outputText.value.length === 0;
  }

  function clearOutput() {
    outputText.value = '';
    updateActions();
  }

  format.addEventListener('change', () => {
    paddingOption.hidden = format.value !== 'base64url';
    status.textContent = '';
    clearOutput();
  });

  includePadding.addEventListener('change', clearOutput);
  inputText.addEventListener('input', () => {
    status.textContent = '';
    updateActions();
  });

  encodeBtn.addEventListener('click', () => transform('encode'));
  decodeBtn.addEventListener('click', () => transform('decode'));

  function transform(type) {
    const text = inputText.value;
    if (!text) {
      return;
    }

    status.textContent = '';
    clearOutput();
    vscode.postMessage({
      type,
      payload: {
        text,
        format: format.value,
        includePadding: includePadding.checked
      }
    });
  }

  copyBtn.addEventListener('click', () => {
    const text = outputText.value;
    if (text) {
      vscode.postMessage({ type: 'copy', payload: text });
    }
  });

  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    clearOutput();
    status.textContent = '';
    inputText.focus();
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'result') {
      outputText.value = message.payload;
      status.textContent = '';
      updateActions();
    } else if (message.type === 'error') {
      clearOutput();
      status.textContent = message.payload;
    }
  });

  updateActions();
})();
</script>
</body>
</html>`;
}

export const base64Tool: ToolModule = { getHtml, handleMessage };
