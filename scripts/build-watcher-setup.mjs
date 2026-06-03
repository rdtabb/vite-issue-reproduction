import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "./src");

async function runBuild() {
    const watcher = await build({ build: { watch: {} } });

    watcher.on("event", (event) => {
        if (event.code === "BUNDLE_END") {
            console.log("bundling finished")

            event.result.close();
        }
    })
};

runBuild();
