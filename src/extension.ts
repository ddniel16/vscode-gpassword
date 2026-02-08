import { workspace, window, commands, type ExtensionContext } from "vscode";

// Import Commands
import { Base64 } from "./commands/base64";
import { BasicAuth } from "./commands/basicAuth";
import { Passwords } from "./commands/passwords";
import { ExtensionConfig } from "./extensionConfig";
import { WordPressSalts } from "./commands/wordPressSalts";
import { JWT } from "./commands/jwt";
import { Strapi } from "./commands/strapi";

// Import views
import { PasswordGeneratorViewProvider } from "./views/password";
import { JWTViewProvider } from "./views/jwt";
import { Base64ViewProvider } from "./views/base64";
import { SaltsViewProvider } from "./views/salts";

export const extConfig: ExtensionConfig = {} as ExtensionConfig;

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration().get("gpassword");
  if (config) {
    Object.assign(extConfig, config);
  }

  // * Register commands

  // Generate Passwords
  context.subscriptions.push(
    commands.registerCommand("gpassword.Letters", () => {
      new Passwords(window, extConfig).lettersGenerate();
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.LettersNumbers", () => {
      new Passwords(window, extConfig).lettersNumbersGenerate();
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.AllCharacters", () => {
      new Passwords(window, extConfig).allCharactersGenerate();
    }),
  );

  // Generate Base64
  context.subscriptions.push(
    commands.registerCommand("gpassword.BaseEncode", () => {
      new Base64(window).encode();
    }),
  );
  context.subscriptions.push(
    commands.registerCommand("gpassword.BaseDecode", () => {
      new Base64(window).decode();
    }),
  );

  // Generate Basic Auth hash
  context.subscriptions.push(
    commands.registerCommand("gpassword.passwordToBasicAuth", () => {
      new BasicAuth(window).passwordToHash();
    }),
  );

  // Generate JWT Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.JWT", () => {
      new JWT(window).decode();
    }),
  );

  // Generate Strapi Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.StrapiYml", () => {
      new Strapi(window).generateYml();
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.StrapiEnv", () => {
      new Strapi(window).generateEnv();
    }),
  );

  // Generate WordPress Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.WordPressSaltYml", () => {
      new WordPressSalts(window).generateYml();
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.WordPressSaltEnv", () => {
      new WordPressSalts(window).generateEnv();
    }),
  );

  // * Register views

  // Password Generator
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      PasswordGeneratorViewProvider.viewId,
      new PasswordGeneratorViewProvider(context),
    ),
  );

  // JWT Generator
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      JWTViewProvider.viewId,
      new JWTViewProvider(context),
    ),
  );

  // Base64 Encoder/Decoder
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      Base64ViewProvider.viewId,
      new Base64ViewProvider(context),
    ),
  );

  // Salts Generator
  context.subscriptions.push(
    window.registerWebviewViewProvider(
      SaltsViewProvider.viewId,
      new SaltsViewProvider(context),
    ),
  );
}

export function deactivate(): void {}
