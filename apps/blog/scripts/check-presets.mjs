// Garante que os presets Nocturne (brainTheme.ts) repetem os valores reais de tokens de styles.css.
// Cada linha de preset tem um comentário "// --token" ; aqui conferimos o hex contra o CSS do design system.
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../design-system/nocturne/styles.css", import.meta.url), "utf8");
const ts = await readFile(new URL("../app/features/brain/brainTheme.ts", import.meta.url), "utf8");
const token = (name) => css.match(new RegExp(`${name.replace(/[-]/g, "\\-")}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

let bad = 0, checked = 0;
for (const line of ts.split("\n")) {
  const m = line.match(/:\s*"(#[0-9a-fA-F]{6})",.*\/\/\s*(--color-[a-z0-9-]+)/);
  if (!m) continue;
  checked++;
  const want = token(m[2]);
  if (want !== m[1].toLowerCase()) { bad++; console.error(`DIVERGE ${m[2]}: preset ${m[1]} × CSS ${want}`); }
}
if (!checked) { console.error("nenhum preset com comentário de token encontrado"); process.exit(2); }
console.log(`${checked} valores de preset conferidos contra styles.css${bad ? `, ${bad} divergentes` : ": ok"}`);
process.exit(bad ? 1 : 0);
