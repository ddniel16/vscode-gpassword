import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

/** Plugin que emite marcas para que el problemMatcher de VS Code detecte inicio/fin de compilación */
const notifyPlugin = {
  name: "notify",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.log("[watch] build finished with errors");
      } else {
        console.log("[watch] build finished");
      }
    });
  },
};

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: true,
  minify: !isWatch,
  plugins: isWatch ? [notifyPlugin] : [],
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[watch] watcher active");
} else {
  await esbuild.build(buildOptions);
  console.log("[esbuild] build complete");
}
