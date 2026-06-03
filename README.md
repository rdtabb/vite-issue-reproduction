# Issue for Vite github repository

## Setting up the repo
Minimum node version: `22.12`

Run this to install dependencies:
```bash
npm i 
```

Run one of these scripts to startup server with rebuild being triggered on file changes in `src/` directory:
```bash
npm run test-build:fs
```

```bash
npm run test-build:watcher
```


## Initial reproduction environment
```
OS: MacOS Ventura 13.2
CPU: Apple Silicon M1 PRO
Node version: 22.19.0
Vite version: 8.0.16
@originjs/vite-plugin-federation version: 1.4.1
```

## Problem description

### Setup with `fs.watch`

On my work we use `vite` in combination with `@originjs/vite-plugin-federation` for microfrontend architecture. Our dev server for local development of microfrontends uses `vite javascript api`, in particular `build` and `preview` functions. I have reproduced the basic setup of our dev server in the `scripts/build-fs-setup.mjs` file and it is callable via `npm run test-build:fs` command. The file's contents look like this:
```js
// scripts/build-fs-setup.mjs

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
```

This setup used to work fine with `vite 7`, but recently we migrated from `vite v7` to `vite v8`, when the problem with the setup occurred. Dev server watches for changes in the `src/` directory and calls the `build` function to create new build in the `dist/` folder for `preview` function to serve. The first build works just fine and outputs files into `dist/` directory like this:
```bash
vite v8.0.16 building client environment for production...
✓ 19 modules transformed.
computing gzip size...
dist/index.html                                            0.88 kB │ gzip:  0.40 kB
dist/assets/__federation_shared_react-BmZOW2Vo.js          0.05 kB │ gzip:  0.07 kB
dist/assets/__federation_shared_react-dom-CIbs1JzC.js      0.06 kB │ gzip:  0.08 kB
dist/assets/__federation_expose_App-BG60HPEN.js            0.06 kB │ gzip:  0.08 kB
dist/assets/chunk-CNslAQYE.js                              0.08 kB │ gzip:  0.08 kB
dist/assets/__federation_fn_import-CrIFjyo1.js             0.15 kB │ gzip:  0.12 kB
dist/assets/application-CZ8ZPCxm.js                        0.44 kB │ gzip:  0.31 kB
dist/assets/preload-helper-D4M6sveU.js                     1.19 kB │ gzip:  0.68 kB
dist/assets/remoteEntry.js                                 1.66 kB │ gzip:  0.92 kB
dist/assets/react-dom-BrlEOGHP.js                          3.56 kB │ gzip:  1.35 kB
dist/assets/_virtual___federation_fn_import-C6nCgEMi.js    4.88 kB │ gzip:  1.97 kB
dist/assets/react-DAdgi939.js                              7.52 kB │ gzip:  2.87 kB
dist/assets/index-DLGg-ymB.js                            179.28 kB │ gzip: 56.75 kB

✓ built in 134ms
```

However, after changing any file in the src directory (e.g. `src/shared/application.tsx` file) the expected output lack some files. Here, for example, you can see that after rebuilding the project, two files (namely `dist/assets/__federation_expose_App-BG60HPEN.js` and `dist/assets/application-CZ8ZPCxm.js`) are missing:
```bash
vite v8.0.16 building client environment for production...
✓ 19 modules transformed.
computing gzip size...
dist/index.html                                            0.73 kB │ gzip:  0.36 kB
dist/assets/__federation_shared_react-BPccOY4S.js          0.05 kB │ gzip:  0.07 kB
dist/assets/__federation_shared_react-dom-CIoOUEaX.js      0.06 kB │ gzip:  0.08 kB
dist/assets/__federation_fn_import-weQfXVti.js             0.15 kB │ gzip:  0.12 kB
dist/assets/preload-helper-D4M6sveU.js                     1.19 kB │ gzip:  0.68 kB
dist/assets/remoteEntry.js                                 1.65 kB │ gzip:  0.91 kB
dist/assets/react-dom-BO45BItK.js                          3.53 kB │ gzip:  1.33 kB
dist/assets/_virtual___federation_fn_import-PzxWb5mz.js    4.88 kB │ gzip:  1.97 kB
dist/assets/react-DOBUGK-L.js                              7.55 kB │ gzip:  2.88 kB
dist/assets/index-DXU0_Zkx.js                            179.57 kB │ gzip: 56.84 kB

✓ built in 121ms
```

They are missing in the `dist/` directory itself as well. So, as it seems, they just get deleted by consequtive rebuilds. This, not unexpectedly, causes bugs in the bundle, because the deleted files are pretty important

### Setup with `build.watch`

The same problem occurs when switching from using `fs.watch` to using vite's inbuilt `build.watch` mechanism. This setup can be found in the `build-watcher-setup.mjs` and is it callable by `npm run test-build:watcher`:

```js
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
```

The exact same problem appears, the first bundle is full:
```bash
vite v8.0.16 building client environment for production...

watching for file changes...

build started...
✓ 19 modules transformed.
computing gzip size...
dist/index.html                                            0.88 kB │ gzip:  0.40 kB
dist/assets/__federation_shared_react-DKZ1fflW.js          0.05 kB │ gzip:  0.07 kB
dist/assets/__federation_shared_react-dom-DNM3IaPW.js      0.06 kB │ gzip:  0.08 kB
dist/assets/__federation_expose_App-84XRqqm1.js            0.06 kB │ gzip:  0.08 kB
dist/assets/chunk-D9-fqq9M.js                              0.08 kB │ gzip:  0.08 kB
dist/assets/__federation_fn_import-Qgvpi6-Z.js             0.15 kB │ gzip:  0.12 kB
dist/assets/application-Cg4J6xH-.js                        0.44 kB │ gzip:  0.31 kB
dist/assets/preload-helper-zJ_50EbN.js                     1.19 kB │ gzip:  0.68 kB
dist/assets/remoteEntry.js                                 1.66 kB │ gzip:  0.92 kB
dist/assets/react-dom-B0DV3nYS.js                          3.56 kB │ gzip:  1.35 kB
dist/assets/_virtual___federation_fn_import-B8pbsqGf.js    4.88 kB │ gzip:  1.97 kB
dist/assets/react-C84HUWCp.js                              7.52 kB │ gzip:  2.87 kB
dist/assets/index-By-0jI3x.js                            179.28 kB │ gzip: 56.75 kB

built in 119ms.
```

While the consequtive builds write incomplete bundles to the `dist/` directory:

```bash
build started...
✓ 19 modules transformed.
computing gzip size...
dist/index.html                                            0.57 kB │ gzip:  0.33 kB
dist/assets/__federation_fn_import-Bu-NZt-0.js             0.15 kB │ gzip:  0.12 kB
dist/assets/preload-helper-zJ_50EbN.js                     1.19 kB │ gzip:  0.68 kB
dist/assets/remoteEntry.js                                 1.65 kB │ gzip:  0.91 kB
dist/assets/_virtual___federation_fn_import-DgoO8rQN.js    4.84 kB │ gzip:  1.99 kB
dist/assets/index-DBe3yi4V.js                            190.54 kB │ gzip: 60.06 kB

built in 109ms.
```

### Concerns about `@originjs/vite-plugin-federation` plugin causing the bug 

This bug has been described in this issue https://github.com/originjs/vite-plugin-federation/issues/738 in the `@originjs/vite-plugin-federation` repository, however with a slightly different setup, using `vite --build`. 

Upon inspecting the plugin's internal behaviours, it seems it is not the source of the issue, as it receives bundle with missing files in its `generateBundle` hook and does not change its contents prior to that point. So it appeared most logical to take this issue up to the `vite` itself. 

## Problem reproduction

1. For setup with `fs.watch` run:
 - `npm run test-build:fs`
 - Check the contents of the generated `dist/` folder
 - Open `src/shared/application.tsx`, add a new line to the end of the file and save it, triggering the rebuild
 - Check the contens of the `dist/` folder, now `dist/assets/__federation_expose_App` file is missing, causing the bug

2. For setup with `build.watch` run:
 - `npm run test-build:watcher`
 - Check the contents of the generated `dist/` folder
 - Open `src/shared/application.tsx`, add a new line to the end of the file and save it, triggering the rebuild
 - Check the contens of the `dist/` folder, now `dist/assets/__federation_expose_App` file is missing, causing the bug

