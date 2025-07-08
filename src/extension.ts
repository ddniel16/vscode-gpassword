import { workspace, window, commands, type ExtensionContext } from "vscode";

import { Base64 } from "./services/base64";
import { BasicAuth } from "./services/basicAuth";
import { Passwords } from "./services/passwords";
import { ExtensionConfig } from "./extensionConfig";
import { WordPressSalts } from "./services/wordPressSalts";
import { JWT } from "./services/jwt";
import { Strapi } from "./services/strapi";

export const extConfig: ExtensionConfig = {} as ExtensionConfig;

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration().get("gpassword");
  if (config) {
    Object.assign(extConfig, config);
  }

  // * Register commands

  // Generate Passwords
  context.subscriptions.push(commands.registerCommand("gpassword.Letters", () => {
    new Passwords(window, extConfig).lettersGenerate();
  }));

  context.subscriptions.push(commands.registerCommand("gpassword.LettersNumbers", () => {
    new Passwords(window, extConfig).lettersNumbersGenerate();
  }));

  context.subscriptions.push(commands.registerCommand("gpassword.AllCharacters", () => {
    new Passwords(window, extConfig).allCharactersGenerate();
  }));

  // Generate Base64
  context.subscriptions.push(commands.registerCommand("gpassword.BaseEncode", () => {
    new Base64(window).encode();
  }));
  context.subscriptions.push(commands.registerCommand("gpassword.BaseDecode", () => {
    new Base64(window).decode();
  }));

  // Generate Basic Auth hash
  context.subscriptions.push(commands.registerCommand("gpassword.passwordToBasicAuth", () => {
    new BasicAuth(window).passwordToHash();
  }));

  // Generate JWT Tokens
  context.subscriptions.push(commands.registerCommand("gpassword.JWT", () => {
    new JWT(window).decode();
  }));

  // Generate Strapi Tokens
  context.subscriptions.push(commands.registerCommand("gpassword.StrapiYml", () => {
    new Strapi(window).generateYml();
  }));

  context.subscriptions.push(commands.registerCommand("gpassword.StrapiEnv", () => {
    new Strapi(window).generateEnv();
  }));

  // Generate WordPress Tokens
  context.subscriptions.push(commands.registerCommand("gpassword.WordPressSaltYml", () => {
    new WordPressSalts(window).generateYml();
  }));

  context.subscriptions.push(commands.registerCommand("gpassword.WordPressSaltEnv", () => {
    new WordPressSalts(window).generateEnv();
  }));
}
