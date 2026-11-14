import crypto from "node:crypto";
import * as vscode from "vscode";
import { generateHtpasswdEntry } from "../../services/basicAuth";
import type { ToolModule } from "./types";

function handleMessage(webview: vscode.Webview): vscode.Disposable {
  return webview.onDidReceiveMessage(async (msg) => {
    switch (msg.type) {
      case "generate": {
        try {
          const entry = await generateHtpasswdEntry(
            msg.payload.username,
            msg.payload.password,
            msg.payload.format,
            msg.payload.costOrRounds
          );
          webview.postMessage({ type: "result", payload: entry });
        } catch (error) {
          webview.postMessage({
            type: "error",
            payload: error instanceof Error ? error.message : "Could not generate the htpasswd entry.",
          });
        }
        break;
      }
      case "copy": {
        try {
          await vscode.env.clipboard.writeText(msg.payload);
          vscode.window.showInformationMessage("Basic Auth entry copied to clipboard");
        } catch (error) {
          vscode.window.showErrorMessage(
            `Could not copy the Basic Auth entry: ${error instanceof Error ? error.message : "Clipboard error"}`
          );
        }
        break;
      }
    }
  });
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "basicAuth.css"));
  const nonce = crypto.randomBytes(16).toString("hex");
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${styleUri}">
<title>Basic Auth</title>
</head>
<body>
<h2>Basic Auth</h2>
<div class="container">
  <div class="field">
    <label for="username">Username</label>
    <input id="username" type="text" autocomplete="off">
  </div>
  <div class="field">
    <label for="password">Password</label>
    <input id="password" type="password" autocomplete="new-password">
  </div>
  <div class="field">
    <label for="format">Hash format</label>
    <select id="format">
      <option value="bcrypt" selected>bcrypt (recommended)</option>
      <option value="apr1">APR1-MD5</option>
      <option value="sha">SHA-1</option>
      <option value="sha256-crypt">SHA-256 crypt</option>
      <option value="sha512-crypt">SHA-512 crypt</option>
    </select>
  </div>
  <div id="workFactorField" class="field">
    <label id="workFactorLabel" for="workFactor">Bcrypt cost (4-17)</label>
    <input id="workFactor" type="number" min="4" max="17" step="1" value="12">
  </div>
  <small id="parameterHelp" class="help"></small>
  <div class="button-group">
    <button id="generate" type="button">Generate</button>
    <button id="copy" class="button-secondary" type="button" disabled>Copy</button>
    <button id="clear" class="button-secondary" type="button">Clear</button>
  </div>
  <div class="field">
    <label for="result">.htpasswd entry</label>
    <textarea id="result" rows="3" spellcheck="false" aria-live="polite"></textarea>
    <small id="status" role="status"></small>
  </div>
</div>
<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const format = document.getElementById('format');
  const workFactorField = document.getElementById('workFactorField');
  const workFactorLabel = document.getElementById('workFactorLabel');
  const workFactor = document.getElementById('workFactor');
  const parameterHelp = document.getElementById('parameterHelp');
  const result = document.getElementById('result');
  const status = document.getElementById('status');
  const copy = document.getElementById('copy');

  function updateWorkFactor() {
    if (format.value === 'bcrypt') {
      workFactorField.hidden = false;
      workFactorLabel.textContent = 'Bcrypt cost (4-17)';
      workFactor.min = '4';
      workFactor.max = '17';
      workFactor.step = '1';
      workFactor.value = '12';
      parameterHelp.textContent = 'Recommended: 12. Each increment roughly doubles the work.';
    } else if (format.value === 'sha256-crypt' || format.value === 'sha512-crypt') {
      workFactorField.hidden = false;
      workFactorLabel.textContent = 'SHA-crypt rounds (1,000-100,000)';
      workFactor.min = '1000';
      workFactor.max = '100000';
      workFactor.step = '1000';
      workFactor.value = '5000';
      parameterHelp.textContent = 'Default: 5,000 rounds. More rounds increase generation time.';
    } else {
      workFactorField.hidden = true;
      parameterHelp.textContent = format.value === 'apr1'
        ? 'APR1-MD5 uses a fixed 1,000 rounds.'
        : 'SHA-1 has no configurable cost or rounds.';
    }
  }

  format.addEventListener('change', updateWorkFactor);
  updateWorkFactor();

  document.getElementById('generate').addEventListener('click', () => {
    status.textContent = '';
    vscode.postMessage({
      type: 'generate',
      payload: {
        username: username.value,
        password: password.value,
        format: format.value,
        costOrRounds: Number(workFactor.value)
      }
    });
  });

  copy.addEventListener('click', () => {
    if (result.value) {
      vscode.postMessage({ type: 'copy', payload: result.value });
    }
  });

  document.getElementById('clear').addEventListener('click', () => {
    result.value = '';
    status.textContent = '';
    copy.disabled = true;
  });

  window.addEventListener('message', (event) => {
    if (event.data.type === 'result') {
      result.value = event.data.payload;
      status.textContent = '';
      copy.disabled = false;
    } else if (event.data.type === 'error') {
      result.value = '';
      status.textContent = event.data.payload;
      copy.disabled = true;
    }
  });
})();
</script>
</body>
</html>`;
}

export const basicAuthTool: ToolModule = { getHtml, handleMessage };
