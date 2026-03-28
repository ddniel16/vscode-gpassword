import crypto from "node:crypto";
import * as vscode from "vscode";
import type { ToolModule } from "./types";

function base64urlDecode(str: string): Buffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64");
}

function handleMessage(webview: vscode.Webview): vscode.Disposable {
  return webview.onDidReceiveMessage(async (msg) => {
    const { type, payload } = msg;

    switch (type) {
      case "verify": {
        try {
          const [jwtHeader, jwtPayload, jwtSignature] = payload.jwt.split(".");
          const signature = base64urlDecode(jwtSignature);

          const datos = `${jwtHeader}.${jwtPayload}`;
          const expectedSignature = crypto.createHmac("sha256", payload.secret).update(datos).digest();

          if (!crypto.timingSafeEqual(signature, expectedSignature)) {
            throw new Error("Invalid signature");
          }

          webview.postMessage({
            type: "verifyResult",
            success: true,
            message: "JWT is valid",
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          webview.postMessage({
            type: "verifyResult",
            success: false,
            message: errorMsg,
          });
        }
        break;
      }
    }
  });
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "media", "jwt.css"));
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
  </head>
  <body>
  <h3>JWT Decoder & Validator</h3>

  <textarea id="jwtInput" placeholder="Paste your JWT here"></textarea>
  <button id="decodeButton" type="button">Decode</button>

  <div id="row">
    <h4>Header</h4>
    <pre id="jwt-header"> </pre>
  </div>

  <div id="row">
    <h4>Payload</h4>
    <pre id="jwt-payload"> </pre>
  </div>

  <div id="row">
    <h4>Signature</h4>
    <pre id="jwt-signature"> </pre>
  </div>

  <br />

  <div id="row" class="verify hidden">
    <h4>Verify Signature (HS256)</h4>
    <input type="text" id="secret" placeholder="Enter secret key" />
    <button id="verifyButton" type="button">Verify</button>
    <div id="verifyResult"></div>
  </div>

  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const element = id => document.getElementById(id);

  function decodeJWT() {
    const jwt = element('jwtInput').value.trim();

    if (!jwt) {
      element('jwt-header').textContent = '';
      element('jwt-payload').textContent = '';
      element('jwt-signature').textContent = '';
      document.querySelector('.verify').classList.add('hidden');
      element('verifyResult').textContent = '';
      element('verifyResult').className = '';
      return;
    }

    const parts = jwt.split('.');
    if (parts.length !== 3) {
      element('jwt-header').textContent = 'Invalid JWT format';
      element('jwt-payload').textContent = '';
      element('jwt-signature').textContent = '';
      document.querySelector('.verify').classList.add('hidden');
      return;
    }

    const [header, payload, signature] = parts;

    try {
      const decodedHeader = JSON.parse(atob(header));
      element('jwt-header').textContent = JSON.stringify(decodedHeader, null, 2);

      if (decodedHeader.alg === 'HS256') {
        document.querySelector('.verify').classList.remove('hidden');
      } else {
        document.querySelector('.verify').classList.add('hidden');
      }
    } catch (e) {
      element('jwt-header').textContent = 'Invalid Header encoding';
    }

    try {
      element('jwt-payload').textContent = JSON.stringify(JSON.parse(atob(payload)), null, 2);
    } catch (e) {
      element('jwt-payload').textContent = 'Invalid Payload encoding';
    }

    element('jwt-signature').textContent = signature || 'No signature';
  }

  element('jwtInput').addEventListener('input', decodeJWT);
  element('decodeButton').addEventListener('click', decodeJWT);

  element('verifyButton')?.addEventListener('click', () => {
    const jwt = element('jwtInput').value.trim();
    const secret = element('secret').value;

    if (!jwt || !secret) {
      const resultEl = element('verifyResult');
      resultEl.textContent = 'Please enter both JWT and secret';
      resultEl.className = 'error';
      return;
    }

    vscode.postMessage({ type: 'verify', payload: { jwt, secret } });
  });

  element('secret').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      element('verifyButton').click();
    }
  });

  window.addEventListener('message', event => {
    const { type, success, message } = event.data;
    if (type === 'verifyResult') {
      const resultEl = element('verifyResult');
      resultEl.textContent = message.message || message;
      resultEl.className = success ? 'success' : 'error';
    }
  });

  </script>
  </body>
  </html>`;
}

export const jwtTool: ToolModule = { getHtml, handleMessage };
