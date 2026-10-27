// Copies the IFC viewer's runtime assets into public/vendor so they're served by the app itself.
// Runs before `dev` and `build`; public/vendor is gitignored.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// Some packages don't export package.json, so resolve the entry and walk up to the package root.
function pkgDir(name) {
  let dir = dirname(require.resolve(name));
  while (!existsSync(join(dir, "package.json")) || !dir.replaceAll("\\", "/").endsWith(name)) {
    if (dirname(dir) === dir) throw new Error(`Package root not found for ${name}`);
    dir = dirname(dir);
  }
  return dir;
}
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor");

const assets = [
  [join(pkgDir("@thatopen/fragments"), "dist", "Worker", "worker.mjs"), join(out, "fragments", "worker.mjs")],
  [join(pkgDir("web-ifc"), "web-ifc.wasm"), join(out, "web-ifc", "web-ifc.wasm")],
  [join(pkgDir("web-ifc"), "web-ifc-mt.wasm"), join(out, "web-ifc", "web-ifc-mt.wasm")],
];

for (const [from, to] of assets) {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log(`viewer assets → ${out}`);
