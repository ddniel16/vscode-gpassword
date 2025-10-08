import * as crypto from 'crypto';
import * as vscode from "vscode";

export class JWTViewProvider implements vscode.WebviewViewProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  private base64urlDecode(str: string): Buffer {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) { str += '='; }
    return Buffer.from(str, 'base64');
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    console.log("Resolving JWT View");

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    webviewView.webview.onDidReceiveMessage(async msg => {
      const { type, payload } = msg;

      switch (type) {
      case 'verify': {
        try {
          const [jwtHeader, jwtPayload, jwtSignature] = payload.jwt.split('.');
          const signature = this.base64urlDecode(jwtSignature);

          const datos = `${jwtHeader}.${jwtPayload}`;
          const expectedSignature = crypto
            .createHmac('sha256', payload.secret)
            .update(datos)
            .digest();

          if (!crypto.timingSafeEqual(signature, expectedSignature)) {
            throw new Error('Invalid signature');
          }

          webviewView.webview.postMessage({ type: 'verifyResult', success: true, message: 'JWT válido' });

        } catch (error) {

          const errorMsg = (error instanceof Error) ? error.message : String(error);
          webviewView.webview.postMessage({ type: 'verifyResult', success: false, message: errorMsg });

        }
        break;
      }
      }

    });


    // URI al CSS externo
    const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src/style/', 'jwt.css'));

    // Nonce para permitir el script
    const nonce = Date.now().toString(36);

    // CSP estricta sin inline no autorizado (solo style desde paquete y script con nonce)
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
      "form-action 'none'"
    ].join('; ');


    webviewView.webview.html = `<!DOCTYPE html>
  <html lang="es">
  <head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${styleUri}">
  </head>
  <body>
  <h3>JWT</h3>

  <textarea id="jwtInput" placeholder="Paste your JWT here"></textarea>
  <button id="decodeButton">Decode</button>

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

  <br /><br />

  <div id="row" class="verify hidden">
    <input type="text" id="secret" placeholder="Secret" />
    <span id="verifyResult"></span>
    <small>Support for HS256</small>
  </div>

  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const element = id => document.getElementById(id);

  element('jwtInput').addEventListener('change', () => {
    const jwt = element('jwtInput').value;
    const [header, payload, signature] = jwt.split('.');

    try {
      element('jwt-header').textContent = JSON.stringify(JSON.parse(atob(header)), null, 2);
    } catch (e) {
      element('jwt-header').textContent = 'Invalid Header';
    }

    try {
      element('jwt-payload').textContent = JSON.stringify(JSON.parse(atob(payload)), null, 2);
    } catch (e) {
      element('jwt-payload').textContent = 'Invalid Payload';
    }

    element('jwt-signature').textContent = signature || '';
  });

  secret.addEventListener('change', async () => {
    const jwt = element('jwtInput').value;
    const secret = element('secret').value;
    vscode.postMessage({ type: 'verify', payload: { jwt, secret } });
  });

  window.addEventListener('message', event => {
    const { type, success, message } = event.data;
    if (type === 'verifyResult') {
      const resultEl = element('verifyResult');
      console.log('Mensaje de verificación recibido:', event.data);
      console.log('Mensaje de verificación recibido (message):', message);
      resultEl.textContent = message.message || message;
      resultEl.className = success ? 'success' : 'error';
    }
  });

  </script>
  </body>
  </html>
    `;
  }
}
