import { workspace, window, commands, type ExtensionContext } from 'vscode';
import bcrypt from 'bcrypt';

import { GeneratorPassword } from './generator.password';
import { type ExtensionConfig } from './extensionConfig';

/** Extension Configuration */
export let $extConfig: ExtensionConfig;

export function activate(context: ExtensionContext) {
  $extConfig = workspace.getConfiguration().get('gpassword')!;

  let letters = commands.registerCommand('gpassword.Letters', () => {
    console.debug('Only letters');

    let acTxEditor = window.activeTextEditor;
    if (!acTxEditor) {
      console.error('No open editor');
      return;
    }

    const selection = acTxEditor.selection;
    acTxEditor.edit(function (textEditor) {
      textEditor.insert(selection.anchor, new GeneratorPassword($extConfig).lettersGenerate());
    });
  });

  let lettersNumbers = commands.registerCommand('gpassword.LettersNumbers', () => {
    console.debug('Letters & Numbers');

    let acTxEditor = window.activeTextEditor;
    if (!acTxEditor) {
      console.error('No open editor');
      return;
    }

    const selection = acTxEditor.selection;
    acTxEditor.edit(function (textEditor) {
      textEditor.insert(selection.anchor, new GeneratorPassword($extConfig).lettersNumbersGenerate());
    });
  });

  let allCharacters = commands.registerCommand('gpassword.AllCharacters', () => {
    console.debug('All character');

    let acTxEditor = window.activeTextEditor;
    if (!acTxEditor) {
      console.error('No open editor');
      return;
    }

    const selection = acTxEditor.selection;
    acTxEditor.edit(function (textEditor) {
      textEditor.insert(selection.anchor, new GeneratorPassword($extConfig).allCharactersGenerate());
    });
  });

  let passwordToBasicAuth = commands.registerCommand('gpassword.passwordToBasicAuth', () => {
    console.debug('Password to Basic Auth');

    const acTxEditor = window.activeTextEditor;
    if (!acTxEditor || acTxEditor === undefined) {
      console.error('No open editor');
      return;
    }

    acTxEditor.edit(function (editBuilder) {
      for (const selection of acTxEditor.selections) {
        let textSelected = acTxEditor.document.getText(selection);
        editBuilder.replace(selection, bcrypt.hashSync(textSelected, 10));
      }
    });

    window.showInformationMessage('hashed password!');
  });

  context.subscriptions.push(letters);
  context.subscriptions.push(lettersNumbers);
  context.subscriptions.push(allCharacters);

  context.subscriptions.push(passwordToBasicAuth);
}

// This method is called when your extension is deactivated
export function deactivate() {}
