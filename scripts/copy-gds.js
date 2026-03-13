const fs = require("fs");
const path = require("path");

const pkgRoot = path.join(__dirname, "..", "node_modules", "govuk-frontend");
const govukDir = path.join(pkgRoot, "govuk");
const govukEsm = path.join(pkgRoot, "govuk-esm");
const dest = path.join(__dirname, "..", "public", "govuk");

if (!fs.existsSync(govukDir)) {
  console.warn("govuk-frontend not found at", pkgRoot, "- run npm install");
  process.exit(0);
}

function copyRecursive(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const dstPath = path.join(dst, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// Copy assets (fonts, images) so CSS url() resolve
const assetsSource = path.join(govukDir, "assets");
if (fs.existsSync(assetsSource)) {
  copyRecursive(assetsSource, path.join(dest, "assets"));
}
// Copy ESM bundle for initAll in browser
if (fs.existsSync(govukEsm)) {
  copyRecursive(govukEsm, path.join(dest, "govuk-esm"));
}
// Init script: load ESM and run initAll (path relative to public/govuk)
fs.writeFileSync(
  path.join(dest, "govuk-init.js"),
  "import { initAll } from './govuk-esm/all.mjs'; initAll();\n"
);
console.log("GDS assets copied to public/govuk");
