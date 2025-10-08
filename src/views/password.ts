import * as vscode from "vscode";

import { PasswordsGenerator } from "../services/passwords";
import { EntropyCalculator } from "../services/entropy";

export class PasswordGeneratorViewProvider implements vscode.WebviewViewProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      // Restringimos a la carpeta media que contendrá assets estáticos empaquetados
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };

    webviewView.webview.onDidReceiveMessage(async msg => {
      const { type, payload } = msg;

      switch (type) {
      case 'listGenerate': {
        const passwordGenerator = new PasswordsGenerator();
        const entropyCalculator = new EntropyCalculator();

        const listItems = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
        let listGenerate: { id: string; value: string, entropy: { theoreticalBits: number, shannonBits: number, score: string } }[] = [];

        listItems.forEach((item, index) => {
          const pwd = passwordGenerator.generatePassword(payload);
          const entropy = entropyCalculator.calculateDetailedEntropy(pwd, payload);
          listGenerate.push({ "id": item, "value": pwd, "entropy": entropy });
        });

        webviewView.webview.postMessage({ type: 'listGenerateMessage', payload: listGenerate });
        break;
      }
      case 'copy': {
        if (payload) {
          await vscode.env.clipboard.writeText(payload);
          vscode.window.showInformationMessage('Password copied to clipboard');
        }
        break;
      }
      }

    });

    const cfg = vscode.workspace.getConfiguration("gpassword");
    const settings = {
      defaultLength: cfg.get<number>('passwordGeneratorLength', 20),
      includeNumbers: cfg.get<boolean>('passwordGeneratorDefault.includeNumbers', true),
      includeSymbols: cfg.get<boolean>('passwordGeneratorDefault.includeSymbols', true),
      includeUppercase: cfg.get<boolean>('passwordGeneratorDefault.includeUppercase', true),
      customChars: cfg.get<string>('passwordGeneratorDefault.customChars', ''),
    };
    const settingsJson = JSON.stringify(settings).replace(/</g, '\\u003c');

    // URI al CSS externo
  const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'password.css'));

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
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${styleUri}">
</head>
<body>
<h2 id="title">Password Generator</h2>

<div class="row">
  <label id="lengthLabel" for="length">Length (<span id="lenLabel">${settings.defaultLength}</span>)</label>
  <input id="length" type="range" min="10" max="55" value="${settings.defaultLength}">
</div>

<div class="row">
  <input type="checkbox" id="chkNumbers" ${settings.includeNumbers?'checked':''}>
  <label id="numbersLabel" for="chkNumbers">Numbers</label>
</div>

<div class="row">
  <input type="checkbox" id="chkSymbols" ${settings.includeSymbols?'checked':''}>
  <label id="symbolsLabel" for="chkSymbols">Symbols</label>
</div>

<div class="row">
  <input type="checkbox" id="chkUpper" ${settings.includeUppercase?'checked':''}>
  <label id="upperLabel" for="chkUpper">Uppercase</label>
</div>

<div class="col">
  <label id="customLabel" for="custom">Custom chars</label>
  <input id="custom" class="inline-input" type="text" value="${settings.customChars}" placeholder="Extra chars">
  <small id="customHelp">Will mix into the password</small>
</div>

<hr />

<button id="regenerate" title="Generate">Regenerate list</button>

<div class="listItems">
  <button id="copy-a" title="Copy">Copy</button> <code id="result-a"></code> <small class="entropy-data hidden" id="entropy-a"></small><br />
  <button id="copy-b" title="Copy">Copy</button> <code id="result-b"></code> <small class="entropy-data hidden" id="entropy-b"></small><br />
  <button id="copy-c" title="Copy">Copy</button> <code id="result-c"></code> <small class="entropy-data hidden" id="entropy-c"></small><br />
  <button id="copy-d" title="Copy">Copy</button> <code id="result-d"></code> <small class="entropy-data hidden" id="entropy-d"></small><br />
  <button id="copy-e" title="Copy">Copy</button> <code id="result-e"></code> <small class="entropy-data hidden" id="entropy-e"></small><br />
  <button id="copy-f" title="Copy">Copy</button> <code id="result-f"></code> <small class="entropy-data hidden" id="entropy-f"></small><br />
  <button id="copy-g" title="Copy">Copy</button> <code id="result-g"></code> <small class="entropy-data hidden" id="entropy-g"></small><br />
  <button id="copy-h" title="Copy">Copy</button> <code id="result-h"></code> <small class="entropy-data hidden" id="entropy-h"></small><br />
  <button id="copy-i" title="Copy">Copy</button> <code id="result-i"></code> <small class="entropy-data hidden" id="entropy-i"></small><br />
  <button id="copy-j" title="Copy">Copy</button> <code id="result-j"></code> <small class="entropy-data hidden" id="entropy-j"></small><br />
</div>

<div class="row">
  <input type="checkbox" id="chkEntropy">
  <label id="entropyLabel" for="chkEntropy">Show entropy</label>
</div>

<div class="entropy-data hidden">
  <small>T = Theoretical entropy, S = Shannon entropy</small><br />
  <small>Entropy calculated with <a href="https://en.wikipedia.org/wiki/Entropy_(information_theory)" target="_blank">Shannon's formula</a> and theoretical entropy based on character pool.</small>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const element = id => document.getElementById(id);
const settings = ${settingsJson};

element('length').addEventListener('input', (event) => {
  element('lenLabel').textContent = event.target.value;
});

element('length').addEventListener('change', listGenerate);
element('chkNumbers').addEventListener('change', listGenerate);
element('chkSymbols').addEventListener('change', listGenerate);
element('chkUpper').addEventListener('change', listGenerate);
element('custom').addEventListener('input', listGenerate);

element('chkEntropy').addEventListener('change', (event) => {
  Array.from(document.getElementsByClassName('entropy-data')).forEach(element => {
    if (event.target.checked) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });
});

element('regenerate').addEventListener('click', listGenerate);
function listGenerate() {
  const localValues = {
    length: parseInt(element('length').value, 10),
    numbers: element('chkNumbers').checked,
    symbols: element('chkSymbols').checked,
    uppercase: element('chkUpper').checked,
    customChars: element('custom').value
  };
  vscode.postMessage({ type: 'listGenerate', payload: localValues });
}
listGenerate();

window.addEventListener('message', (event) => {
  if (event.data.type === 'listGenerateMessage') {
    event.data.payload.forEach(item => {
      const codeEl = element("result-"+ item.id);
      if (codeEl) {
        codeEl.textContent = item.value;
        codeEl.className = item.entropy.score;

        element('copy-' + item.id).onclick = () => {
          vscode.postMessage({ type: 'copy', payload: item.value });
        };
      }

      const entropyEl = element('entropy-' + item.id);
      if (entropyEl) {
        entropyEl.textContent = 'Entropy: T=' + item.entropy.theoreticalBits.toFixed(2) + ' bits, S=' + item.entropy.shannonBits.toFixed(2) + ' bits (' + item.entropy.score.replace('-', ' ') + ')';
      }
    });
  }
});
</script>
</body>
</html>
    `;
  }
}
