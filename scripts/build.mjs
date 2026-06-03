import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "./src");

async function runBuild() {
    await build();

    console.log("\n waiting for file changes");
};

runBuild();

fs.watch(srcDir, { recursive: true }, () => {
    runBuild();
});
