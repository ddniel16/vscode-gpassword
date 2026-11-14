import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import * as vscode from "vscode";

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
  const extension = vscode.extensions.getExtension("ddniel16.gpassword");
  assert.ok(extension, "La extensión instalada no está disponible");
  await extension.activate();

  const encoded = await runCommand("gpassword.BaseEncode", "contraseña");
  assert.equal(encoded, Buffer.from("contraseña").toString("base64"));
  assert.equal(await runCommand("gpassword.BaseDecode", encoded), "contraseña");

  const encodedUrl = await runCommand("gpassword.UrlEncode", "a & ñ");
  assert.equal(encodedUrl, "a%20%26%20%C3%B1");
  assert.equal(await runCommand("gpassword.UrlDecode", encodedUrl), "a & ñ");

  const token = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"sub":"usuario"}').toString("base64url")}.`;
  const jwt = JSON.parse(await runCommand("gpassword.JWT", token));
  assert.deepEqual(jwt.payload, { sub: "usuario" });

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
  await vscode.commands.executeCommand("gpassword.switchTool", "url");
  if (process.env.GPASSWORD_TEST_RESULT) {
    writeFileSync(process.env.GPASSWORD_TEST_RESULT, "ok");
  }
  console.log("Pruebas de comandos de la extensión completadas");
}
