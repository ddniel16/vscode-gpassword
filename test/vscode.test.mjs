import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import * as vscode from "vscode";
import { NavigatorProvider } from "../src/views/navigator";

async function runCommand(command, text = "") {
  const document = await vscode.workspace.openTextDocument({ content: text });
  const editor = await vscode.window.showTextDocument(document);
  editor.selection = new vscode.Selection(document.positionAt(0), document.positionAt(text.length));
  const changed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      subscription.dispose();
      reject(new Error(`El comando ${command} no modificó el documento`));
    }, 10000);
    const subscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === document) {
        clearTimeout(timer);
        subscription.dispose();
        resolve(document.getText());
      }
    });
  });
  await vscode.commands.executeCommand(command);
  return changed;
}

export async function run() {
  const navigator = new NavigatorProvider("password");
  const items = navigator.getChildren();
  const passwordItem = navigator.getActiveItem();
  navigator.setActiveTool("basicAuth");
  const basicAuthItem = navigator.getActiveItem();
  assert.equal(passwordItem.description, "");
  assert.equal(basicAuthItem.description, "●");
  assert.equal(navigator.getParent(basicAuthItem), undefined);
  assert.equal(
    navigator.getChildren().find((item) => item.toolId === "basicAuth"),
    basicAuthItem
  );
  assert.equal(
    navigator.getChildren().find((item) => item.toolId === "password"),
    items[0]
  );
  navigator.setActiveTool("password");
  assert.equal(navigator.getActiveItem(), passwordItem);
  assert.equal(passwordItem.description, "●");
  assert.equal(basicAuthItem.description, "");

  const extension = vscode.extensions.getExtension("ddniel16.gpassword");
  assert.ok(extension, "La extensión instalada no está disponible");
  await extension.activate();

  const encoded = await runCommand("gpassword.BaseEncode", "contraseña");
  assert.equal(encoded, Buffer.from("contraseña").toString("base64"));
  assert.equal(await runCommand("gpassword.BaseDecode", encoded), "contraseña");

  const encodedBase64Url = await runCommand("gpassword.Base64UrlEncode", "💩");
  assert.equal(encodedBase64Url, Buffer.from("💩").toString("base64url"));
  assert.equal(await runCommand("gpassword.Base64UrlDecode", encodedBase64Url), "💩");

  const encodedUrl = await runCommand("gpassword.UrlEncode", "a & ñ");
  assert.equal(encodedUrl, "a%20%26%20%C3%B1");
  assert.equal(await runCommand("gpassword.UrlDecode", encodedUrl), "a & ñ");

  const fullUrl = "https://example.com/a b?q=x y#tag";
  const encodedFullUrl = await runCommand("gpassword.UrlEncodeUri", fullUrl);
  assert.equal(encodedFullUrl, "https://example.com/a%20b?q=x%20y#tag");
  assert.equal(await runCommand("gpassword.UrlDecodeUri", encodedFullUrl), fullUrl);
  const encodedForm = await runCommand("gpassword.UrlEncodeForm", "a b+c&ñ");
  assert.equal(encodedForm, "a+b%2Bc%26%C3%B1");
  assert.equal(await runCommand("gpassword.UrlDecodeForm", encodedForm), "a b+c&ñ");

  const token = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"sub":"usuario"}').toString("base64url")}.`;
  const jwt = JSON.parse(await runCommand("gpassword.JWT", token));
  assert.deepEqual(jwt.payload, { sub: "usuario" });

  const invalidJwtDocument = await vscode.workspace.openTextDocument({ content: "invalid.jwt" });
  const invalidJwtEditor = await vscode.window.showTextDocument(invalidJwtDocument);
  invalidJwtEditor.selection = new vscode.Selection(
    invalidJwtDocument.positionAt(0),
    invalidJwtDocument.positionAt(invalidJwtDocument.getText().length)
  );
  await vscode.commands.executeCommand("gpassword.JWT");
  assert.equal(invalidJwtDocument.getText(), "invalid.jwt");

  for (const command of ["gpassword.Letters", "gpassword.LettersNumbers", "gpassword.AllCharacters"]) {
    const password = await runCommand(command);
    assert.ok(password.length >= 20 && password.length <= 25);
  }
  for (const command of ["gpassword.WordPressSaltYml", "gpassword.WordPressSaltEnv"]) {
    assert.equal((await runCommand(command)).split("\n").length, 8);
  }
  for (const command of ["gpassword.StrapiYml", "gpassword.StrapiEnv"]) {
    assert.equal((await runCommand(command)).trim().split("\n").length, 6);
  }

  const toolConfiguration = vscode.workspace.getConfiguration("gpassword");
  const configuredDefaultTool = toolConfiguration.get("defaultTool");
  assert.equal(configuredDefaultTool, "password");
  await vscode.commands.executeCommand("passwordGenerator.navigator.focus");
  await vscode.commands.executeCommand("gpassword.switchTool", "basicAuth");
  await vscode.commands.executeCommand("gpassword.switchTool", "url");
  assert.equal(toolConfiguration.get("defaultTool"), configuredDefaultTool);

  if (process.env.GPASSWORD_TEST_RESULT) {
    writeFileSync(process.env.GPASSWORD_TEST_RESULT, "ok");
  }
  console.log("Pruebas de comandos de la extensión completadas");
}
