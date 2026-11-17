import crypto from "node:crypto";
import * as vscode from "vscode";
import { analyzeJWT, JwtError, verifyJWTSignature } from "../../services/jwt";
import type { ToolModule } from "./types";

function handleMessage(webview: vscode.Webview): vscode.Disposable {
  return webview.onDidReceiveMessage(async (msg) => {
    const { type, payload } = msg;

    switch (type) {
      case "decode": {
        try {
          webview.postMessage({
            type: "decodeResult",
            requestId: payload.requestId,
            payload: analyzeJWT(payload.jwt),
          });
        } catch (error) {
          webview.postMessage({
            type: "decodeError",
            requestId: payload.requestId,
            payload: error instanceof JwtError ? error.message : "Could not decode JWT.",
          });
        }
        break;
      }
      case "verify": {
        try {
          const result = verifyJWTSignature(payload.jwt, payload.secret);
          const message = result.valid
            ? "HS256 signature verified."
            : result.reason === "unsupported-algorithm"
              ? `Signature verification is not supported for ${result.algorithm ?? "an unspecified algorithm"}.`
              : "Invalid HS256 signature.";

          webview.postMessage({
            type: "verifyResult",
            requestId: payload.requestId,
            success: result.valid,
            message,
          });
        } catch (error) {
          webview.postMessage({
            type: "verifyResult",
            requestId: payload.requestId,
            success: false,
            message: error instanceof JwtError ? error.message : "Could not verify the JWT signature.",
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

<div class="field">
  <label for="jwtInput">Compact JWT</label>
  <textarea id="jwtInput" placeholder="Paste your JWT here" aria-label="JWT to decode"></textarea>
</div>
<button id="decodeButton" type="button">Decode</button>
<small id="decodeStatus" class="error" role="alert" aria-live="polite"></small>

<div class="row">
  <h4>Header</h4>
  <pre id="jwt-header"></pre>
</div>

<div class="row">
  <h4>Payload</h4>
  <pre id="jwt-payload"></pre>
</div>

<div class="row">
  <h4>Signature</h4>
  <pre id="jwt-signature"></pre>
</div>

<div class="row">
  <h4>Temporal claims</h4>
  <p id="temporalStatus" role="status">No JWT analyzed.</p>
</div>

<div id="verificationSection" class="row verify hidden">
  <h4>Signature verification</h4>
  <small>Decoding a JWT does not verify its signature.</small>
  <p id="verifyAvailability" role="status"></p>
  <div id="verifyControls" class="verify-controls hidden">
    <label for="secret">HS256 secret</label>
    <input type="password" id="secret" autocomplete="off" />
    <button id="verifyButton" type="button" disabled>Verify signature</button>
  </div>
  <div id="verifyResult" role="status" aria-live="polite"></div>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const element = id => document.getElementById(id);
  let latestRequestId = 0;

  function clearAnalysis() {
    element('jwt-header').textContent = '';
    element('jwt-payload').textContent = '';
    element('jwt-signature').textContent = '';
    element('temporalStatus').textContent = 'No JWT analyzed.';
    element('decodeStatus').textContent = '';
    element('verificationSection').classList.add('hidden');
    element('verifyControls').classList.add('hidden');
    element('verifyAvailability').textContent = '';
    element('verifyResult').textContent = '';
    element('verifyResult').className = '';
    element('verifyButton').disabled = true;
  }

  function decodeJWT() {
    const jwt = element('jwtInput').value.trim();
    const requestId = ++latestRequestId;
    element('secret').value = '';
    clearAnalysis();

    if (jwt) {
      vscode.postMessage({ type: 'decode', payload: { jwt, requestId } });
    }
  }

  function temporalDescription(name, claim) {
    const descriptions = {
      missing: 'not present',
      valid: name === 'exp' ? 'not expired' : 'active',
      expired: 'expired',
      'not-yet-valid': 'not active yet',
      invalid: 'invalid NumericDate'
    };
    const value = claim.value === undefined ? '' : ' (' + claim.value + ' seconds)';
    return name + ': ' + descriptions[claim.status] + value;
  }

  element('jwtInput').addEventListener('input', decodeJWT);
  element('decodeButton').addEventListener('click', decodeJWT);

  element('secret').addEventListener('input', () => {
    element('verifyResult').textContent = '';
    element('verifyResult').className = '';
    element('verifyButton').disabled = element('secret').value.length === 0;
  });

  element('verifyButton').addEventListener('click', () => {
    const jwt = element('jwtInput').value.trim();
    const secret = element('secret').value;
    if (!jwt || !secret) {
      return;
    }

    element('verifyButton').disabled = true;
    element('verifyResult').textContent = 'Verifying signature...';
    vscode.postMessage({
      type: 'verify',
      payload: { jwt, secret, requestId: latestRequestId }
    });
  });

  element('secret').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !element('verifyButton').disabled) {
      element('verifyButton').click();
    }
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.requestId !== latestRequestId) {
      return;
    }

    if (message.type === 'decodeResult') {
      const { header, payload, signature, temporal } = message.payload;
      element('jwt-header').textContent = JSON.stringify(header, null, 2);
      element('jwt-payload').textContent = JSON.stringify(payload, null, 2);
      element('jwt-signature').textContent = signature || 'No signature';
      element('temporalStatus').textContent =
        temporalDescription('exp', temporal.exp) + ' · ' +
        temporalDescription('nbf', temporal.nbf) + ' · ' +
        (temporal.withinValidityWindow ? 'Claims are within the validity window.' : 'Claims are outside the validity window or invalid.');

      element('verificationSection').classList.remove('hidden');
      if (header.alg === 'HS256') {
        element('verifyAvailability').textContent = 'HS256 signature verification is available.';
        element('verifyControls').classList.remove('hidden');
      } else {
        const algorithm = typeof header.alg === 'string' ? header.alg : 'unspecified algorithm';
        element('verifyAvailability').textContent =
          'Signature verification is not supported for ' + algorithm + '.';
      }
      element('decodeStatus').textContent = '';
    } else if (message.type === 'decodeError') {
      element('decodeStatus').textContent = message.payload;
      element('temporalStatus').textContent = 'Claims could not be analyzed.';
    } else if (message.type === 'verifyResult') {
      element('verifyResult').textContent = message.message;
      element('verifyResult').className = message.success ? 'success' : 'error';
      element('verifyButton').disabled = element('secret').value.length === 0;
    }
  });

  decodeJWT();
})();
</script>
</body>
</html>`;
}

export const jwtTool: ToolModule = { getHtml, handleMessage };
