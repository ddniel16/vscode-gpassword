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

  const commandDefinitions: Array<{
    command: string;
    callback: () => void;
  }> = [
    {
      command: "gpassword.Letters",
      callback: () => new Passwords(window, extConfig).lettersGenerate(),
    },
    {
      command: "gpassword.LettersNumbers",
      callback: () => new Passwords(window, extConfig).lettersNumbersGenerate(),
    },
    {
      command: "gpassword.AllCharacters",
      callback: () => new Passwords(window, extConfig).allCharactersGenerate(),
    },
    {
      command: "gpassword.passwordToBasicAuth",
      callback: () => new BasicAuth(window).passwordToHash(),
    },
    {
      command: "gpassword.BaseEncode",
      callback: () => new Base64(window).encode(),
    },
    {
      command: "gpassword.BaseDecode",
      callback: () => new Base64(window).decode(),
    },
    {
      command: "gpassword.WordPressSaltYml",
      callback: () => new WordPressSalts(window).generateYml(),
    },
    {
      command: "gpassword.WordPressSaltEnv",
      callback: () => new WordPressSalts(window).generateEnv(),
    },
    {
      command: "gpassword.StrapiYml",
      callback: () => new Strapi(window).generateYml(),
    },
    {
      command: "gpassword.StrapiEnv",
      callback: () => new Strapi(window).generateEnv(),
    },
    {
      command: "gpassword.JWT",
      callback: () => new JWT(window).decode(),
    },
  ];

  for (const def of commandDefinitions) {
    const subscribe = commands.registerCommand(def.command, def.callback);
    context.subscriptions.push(subscribe);
  }
}
