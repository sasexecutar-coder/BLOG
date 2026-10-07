// Executa build-brain-assets.js em Node (>= 20) fora do harness do Claude Design.
// O gerador espera readFileBinary / saveFile / log como globais da função assíncrona.
//
//   node pipeline/build.mjs [--out <dir>] [--check]
//
// --out    destino dos assets (padrão: pipeline/out)
// --check  compara GLB, partículas e atributos com docs/provenance/build-report.json
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = resolve(outIdx >= 0 ? args[outIdx + 1] : join(here, "out"));
const check = args.includes("--check");

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const source = await readFile(join(here, "build-brain-assets.js"), "utf8");
const run = new AsyncFunction("readFileBinary", "saveFile", "log", source);

await run(
  async (path) => new Blob([await readFile(join(here, path))]),
  async (path, data) => {
    const target = join(out, path.replace(/^assets\//, ""));
    await mkdir(dirname(target), { recursive: true });
    const bytes = typeof data === "string" ? data : Buffer.from(await data.arrayBuffer());
    await writeFile(target, bytes);
    console.log("escrito", target);
  },
  () => {},
);

if (check) {
  const report = JSON.parse(await readFile(join(here, "..", "docs/provenance/build-report.json"), "utf8"));
  const expected = {
    "brain-surface.glb": report.glb.sha256,
    "brain-particles.bin": report.particles.sha256,
    "brain-particles-attr.bin": report.particles.attrSha256,
  };
  let failed = false;
  for (const [file, hash] of Object.entries(expected)) {
    const actual = createHash("sha256").update(await readFile(join(out, file))).digest("hex");
    const ok = actual === hash;
    failed ||= !ok;
    console.log(`${ok ? "OK  " : "FAIL"} ${file} ${actual}`);
  }
  if (failed) process.exit(1);
}
