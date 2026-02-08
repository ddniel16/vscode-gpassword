import * as vscode from "vscode";

export const BASE64_VIEW_ID = "passwordGenerator.base64";

export class Base64ViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = BASE64_VIEW_ID;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      const { type, payload } = msg;

      switch (type) {
        case "encode": {
          try {
            const encoded = Buffer.from(payload, "utf-8").toString("base64");
            webviewView.webview.postMessage({
              type: "result",
              payload: encoded,
            });
          } catch (error) {
            webviewView.webview.postMessage({
              type: "result",
              payload: `Error: ${error instanceof Error ? error.message : "Encoding error"}`,
            });
          }
          break;
        }
        case "decode": {
          try {
            const decoded = Buffer.from(payload, "base64").toString("utf-8");
            webviewView.webview.postMessage({
              type: "result",
              payload: decoded,
            });
          } catch (error) {
            webviewView.webview.postMessage({
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

    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "base64.css"),
    );

    const nonce = Date.now().toString(36);

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
  </div>
</div>

<script nonce="${nonce}">
(function() {
  const vscode = acquireVsCodeApi();
  const textarea = document.getElementById('inputText');
  const encodeBtn = document.getElementById('encodeBtn');
  const decodeBtn = document.getElementById('decodeBtn');
  const copyBtn = document.getElementById('copyBtn');

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
