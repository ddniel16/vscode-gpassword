import { workspace, window, commands, type ExtensionContext } from "vscode";

// Import Commands
import { Base64 } from "./commands/base64";
import { BasicAuth } from "./commands/basicAuth";
import { Passwords } from "./commands/passwords";
import { ExtensionConfig, type ToolId } from "./extensionConfig";
import { WordPressSalts } from "./commands/wordPressSalts";
import { JWT } from "./commands/jwt";
import { Strapi } from "./commands/strapi";
import { Url } from "./commands/url";

// Import views
import { NavigatorProvider } from "./views/navigator";
import { ToolViewProvider } from "./views/toolView";

export const extConfig: ExtensionConfig = {} as ExtensionConfig;

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration().get("gpassword");
  if (config) {
    Object.assign(extConfig, config);
  }

  // Reactive config: update extConfig when settings change
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("gpassword")) {
        const updated = workspace.getConfiguration().get("gpassword");
        if (updated) {
          Object.assign(extConfig, updated);
        }
      }
    })
  );

  // * Register commands

  // Generate Passwords
  context.subscriptions.push(
    commands.registerCommand("gpassword.Letters", () => {
      new Passwords(window, extConfig).lettersGenerate();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.LettersNumbers", () => {
      new Passwords(window, extConfig).lettersNumbersGenerate();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.AllCharacters", () => {
      new Passwords(window, extConfig).allCharactersGenerate();
    })
  );

  // Generate Base64
  context.subscriptions.push(
    commands.registerCommand("gpassword.BaseEncode", () => {
      new Base64(window).encode();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("gpassword.BaseDecode", () => {
      new Base64(window).decode();
    })
  );

  // Generate Basic Auth hash
  context.subscriptions.push(
    commands.registerCommand("gpassword.passwordToBasicAuth", () => {
      new BasicAuth(window).passwordToHash();
    })
  );

  // Generate JWT Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.JWT", () => {
      new JWT(window).decode();
    })
  );

  // Generate Strapi Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.StrapiYml", () => {
      new Strapi(window).generateYml();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.StrapiEnv", () => {
      new Strapi(window).generateEnv();
    })
  );

  // Generate WordPress Tokens
  context.subscriptions.push(
    commands.registerCommand("gpassword.WordPressSaltYml", () => {
      new WordPressSalts(window).generateYml();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("gpassword.WordPressSaltEnv", () => {
      new WordPressSalts(window).generateEnv();
    })
  );

  // URL Encode/Decode
  context.subscriptions.push(
    commands.registerCommand("gpassword.UrlEncode", () => {
      new Url(window).encode();
    })
  );
  context.subscriptions.push(
    commands.registerCommand("gpassword.UrlDecode", () => {
      new Url(window).decode();
    })
  );

  // * Register views

  const defaultTool = workspace.getConfiguration("gpassword").get<ToolId>("defaultTool", "base64");

  const navigatorProvider = new NavigatorProvider(defaultTool);
  const toolViewProvider = new ToolViewProvider(context, defaultTool);

  context.subscriptions.push(window.registerTreeDataProvider(NavigatorProvider.viewId, navigatorProvider));

  context.subscriptions.push(window.registerWebviewViewProvider(ToolViewProvider.viewId, toolViewProvider));

  context.subscriptions.push(
    commands.registerCommand("gpassword.switchTool", (toolId: ToolId) => {
      navigatorProvider.setActiveTool(toolId);
      toolViewProvider.switchTool(toolId);
    })
  );
}

export function deactivate(): void {}
