import * as vscode from "vscode";
import crypto from "crypto";

export const SALTS_VIEW_ID = "passwordGenerator.salts";

export class SaltsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = SALTS_VIEW_ID;

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
        case "wordpress-env": {
          const result = this.generateWordPressSalts("env");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "wordpress-yaml": {
          const result = this.generateWordPressSalts("yaml");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "strapi-env": {
          const result = this.generateStrapiSalts("env");
          webviewView.webview.postMessage({
            type: "result",
            payload: result,
          });
          break;
        }
        case "strapi-yaml": {
          const result = this.generateStrapiSalts("yaml");
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
      vscode.Uri.joinPath(this.context.extensionUri, "media", "salts.css"),
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

  /**
   * Genera un salt aleatorio de 64 caracteres para WordPress
   * Excluye comillas simples, dobles y backticks
   */
  private generateSalt(): string {
    const excludeChars = ["'", '"', "`"];
    let salt = "";

    while (salt.length < 64) {
      const charCode = crypto.randomInt(33, 127);
      const char = String.fromCharCode(charCode);
      if (!excludeChars.includes(char)) {
        salt += char;
      }
    }

    return salt;
  }

  /**
   * Genera salts de WordPress en formato ENV o YAML
   */
  private generateWordPressSalts(format: "env" | "yaml"): string {
    const hashKeys = [
      "AUTH_KEY",
      "AUTH_SALT",
      "LOGGED_IN_KEY",
      "LOGGED_IN_SALT",
      "NONCE_KEY",
      "NONCE_SALT",
      "SECURE_AUTH_KEY",
      "SECURE_AUTH_SALT",
    ];

    if (format === "env") {
      return hashKeys
        .map((key) => `${key}='${this.generateSalt()}'`)
        .join("\n");
    } else {
      return hashKeys
        .map((key) => `${key}: "${this.generateSalt()}"`)
        .join("\n");
    }
  }

  /**
   * Genera tokens de Strapi en formato ENV o YAML
   */
  private generateStrapiSalts(format: "env" | "yaml"): string {
    const appKeys = [
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
      crypto.randomBytes(16).toString("base64"),
    ];

    const tokens = {
      APP_KEYS: appKeys.join(","),
      API_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
      TRANSFER_TOKEN_SALT: crypto.randomBytes(16).toString("base64"),
      ADMIN_JWT_SECRET: crypto.randomBytes(16).toString("base64"),
      JWT_SECRET: crypto.randomBytes(16).toString("base64"),
      REFRESH_SECRET: crypto.randomBytes(16).toString("base64"),
    };

    if (format === "env") {
      return Object.entries(tokens)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    } else {
      // Para YAML, APP_KEYS se formatea como array
      // let yaml = `APP_KEYS:\n`;
      // appKeys.forEach((key) => {
      //   yaml += `  - ${key}\n`;
      // });

      let yaml = `APP_KEYS: ${tokens.APP_KEYS}\n`;
      yaml += `API_TOKEN_SALT: ${tokens.API_TOKEN_SALT}\n`;
      yaml += `TRANSFER_TOKEN_SALT: ${tokens.TRANSFER_TOKEN_SALT}\n`;
      yaml += `ADMIN_JWT_SECRET: ${tokens.ADMIN_JWT_SECRET}\n`;
      yaml += `JWT_SECRET: ${tokens.JWT_SECRET}\n`;
      yaml += `REFRESH_SECRET: ${tokens.REFRESH_SECRET}`;

      return yaml;
    }
  }
}
