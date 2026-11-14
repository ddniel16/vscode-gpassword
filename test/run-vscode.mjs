import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { build } from "esbuild";

const executable = process.env.VSCODE_EXECUTABLE;
if (!executable || !isAbsolute(executable)) {
  throw new Error("VSCODE_EXECUTABLE debe indicar la ruta absoluta al ejecutable de VS Code.");
}

const extensionPath = resolve(process.env.VSCODE_EXTENSION_PATH || ".");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "gpassword-test-"));

try {
  const testPath = join(temporaryDirectory, "vscode-test.cjs");
  const resultPath = join(temporaryDirectory, "result");
  await build({
    entryPoints: ["test/vscode.test.mjs"],
    outfile: testPath,
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["vscode"],
  });

  const result = spawnSync(
    executable,
    [
      `--user-data-dir=${join(temporaryDirectory, "user")}`,
      `--extensions-dir=${join(temporaryDirectory, "extensions")}`,
      `--extensionDevelopmentPath=${extensionPath}`,
      `--extensionTestsPath=${testPath}`,
      "--disable-workspace-trust",
      "--skip-welcome",
      "--skip-release-notes",
      "--disable-gpu",
    ],
    { stdio: "inherit", timeout: 120000, env: { ...process.env, GPASSWORD_TEST_RESULT: resultPath } }
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Las pruebas de VS Code finalizaron con estado ${result.status} y señal ${result.signal}.`);
  }
  if (readFileSync(resultPath, "utf8") !== "ok") {
    throw new Error("Las pruebas de VS Code no finalizaron correctamente.");
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
