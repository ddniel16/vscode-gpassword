import { workspace, window, commands, type ExtensionContext } from "vscode";

import { Base64 } from "./services/base64";
import { BasicAuth } from "./services/basicAuth";
import { Passwords } from "./services/passwords";
import { type ExtensionConfig } from "./extensionConfig";
import { WordPressSalts } from "./services/wordPressSalts";
import { JWT } from "./services/jwt";

export let $extConfig: ExtensionConfig;

export function activate(context: ExtensionContext) {
  $extConfig = workspace.getConfiguration().get("gpassword")!;

  let letters = commands.registerCommand("gpassword.Letters", () => {
    new Passwords(window, $extConfig).lettersGenerate();
  });

  let lettersNumbers = commands.registerCommand("gpassword.LettersNumbers", () => {
    new Passwords(window, $extConfig).lettersNumbersGenerate();
  });

  let allCharacters = commands.registerCommand("gpassword.AllCharacters", () => {
    new Passwords(window, $extConfig).allCharactersGenerate();
  });

  let passwordToBasicAuth = commands.registerCommand("gpassword.passwordToBasicAuth", () => {
    new BasicAuth(window).passwordToBasicAuth();
  });

  let baseEncode = commands.registerCommand("gpassword.BaseEncode", () => {
    new Base64(window).encode();
  });

  let baseDecode = commands.registerCommand("gpassword.BaseDecode", () => {
    new Base64(window).decode();
  });

  let wordPressSaltYml = commands.registerCommand("gpassword.WordPressSaltYml", () => {
    new WordPressSalts(window).generateYml();
  });

  let wordPressSaltEnv = commands.registerCommand("gpassword.WordPressSaltEnv", () => {
    new WordPressSalts(window).generateEnv();
  });

  let jwt = commands.registerCommand("gpassword.JWT", () => {
    new JWT(window).decode();
  });

  context.subscriptions.push(letters);
  context.subscriptions.push(lettersNumbers);
  context.subscriptions.push(allCharacters);

  context.subscriptions.push(passwordToBasicAuth);

  context.subscriptions.push(baseEncode);
  context.subscriptions.push(baseDecode);

  context.subscriptions.push(wordPressSaltYml);
  context.subscriptions.push(wordPressSaltEnv);

  context.subscriptions.push(jwt);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Deactivate extension");
}
