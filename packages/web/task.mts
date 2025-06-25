import { $, argv, fs, os, path, usePowerShell, within } from "zx";
import { fileURLToPath } from "url";

import { createClient } from "webdav";
import { retry } from "zx";
$.verbose = true;

if (os.platform() === "win32") {
  usePowerShell();
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






if (argv.dev) {
  await within(() => {
    return Promise.all([
      $`npm run dev`,
      $({
        cwd: path.resolve(__dirname, "../electron/"),
      })`npm run dev`,
      // $({
      //   cwd: path.resolve(__dirname, "../reactnative/"),
      // })`npm run dev:injected`,
    ]);
  });
}

if (argv.electronprod) {
  let pack = await fs.readJSON(path.resolve(__dirname, "./package.json"));
  let pack2 = await fs.readJSON(
    path.resolve(__dirname, "../electron/package.json"),
  );
  pack2.version = pack.version;
  await fs.writeFile(
    path.resolve(__dirname, "../electron/package.json"),
    JSON.stringify(pack2, null, 2),
  );

  await fs.remove("../electron/web-build");
  await fs.copy(
    path.resolve(__dirname, "./build/"),
    path.resolve(__dirname, "../electron/web-build/"),
    { overwrite: true },
  );
  if (argv.electronprodtest) {
    await $({
      cwd: path.resolve(__dirname, "../electron/"),
    })`npm run testprod`;
  } else {
    await $({
      cwd: path.resolve(__dirname, "../electron/"),
    })`npm run prod`;
  }
}

if (argv.androidprod) {
  // let pack = await fs.readJSON(path.resolve(__dirname, "./package.json"));
  // let pack2 = await fs.readJSON(
  //   path.resolve(__dirname, "../reactnative/package.json"),
  // );
  // pack2.version = pack.version;
  // await fs.writeFile(
  //   path.resolve(__dirname, "../reactnative/package.json"),
  //   JSON.stringify(pack2, null, 2),
  // );

  await fs.remove("../flutter_app/assets");
  // react-native
  await fs.copy(
    path.resolve(__dirname, "./build/"),
    path.resolve(__dirname, "../flutter_app/assets/"),
    { overwrite: true },
  );

  // await $({
  //   cwd: path.resolve(__dirname, "../reactnative/"),
  // })`npx react-native-asset`;

  // await $({
  //   cwd: path.resolve(__dirname, "../reactnative/"),
  // })`npm run build:injected`;

  // android
  // await $({
  //   cwd: path.resolve(__dirname, "../reactnative/android"),
  // })`./gradlew clean`;
  if (argv.androidprodtest) {
    await $({
      cwd: path.resolve(__dirname, "../flutter_app"),
    })`flutter build apk --release`;
  } else {
    await $({
      cwd: path.resolve(__dirname, "../flutter_app"),
    })`flutter build apk --release`;

    await $({
      cwd: path.resolve(__dirname, "../flutter_app"),
    })`flutter build appbundle --release`;
  }
}

if (argv.iosprod) {
  await fs.remove("../flutter_app/assets");
  // react-native
  await fs.copy(
    path.resolve(__dirname, "./build/"),
    path.resolve(__dirname, "../flutter_app/assets/"),
    { overwrite: true },
  );

  await $({
    cwd: path.resolve(__dirname, "../flutter_app/"),
  })`flutter build ipa --release`;
}

if (argv.pre) {
  await $`npm run build`;
  await fs.copy("./public/logo.png", "./build/logo.png", { overwrite: true });
  // electron
  let pack = await fs.readJSON(path.resolve(__dirname, "./package.json"));
  let pack2 = await fs.readJSON(
    path.resolve(__dirname, "../electron/package.json"),
  );
  pack2.version = pack.version;
  await fs.writeFile(
    path.resolve(__dirname, "../electron/package.json"),
    JSON.stringify(pack2, null, 2),
  );

  await fs.remove("../electron/web-build");
  await fs.copy(
    path.resolve(__dirname, "./build/"),
    path.resolve(__dirname, "../electron/web-build/"),
    { overwrite: true },
  );

  // flutter_app
  await fs.remove("../flutter_app/assets");
  // react-native
  await fs.copy(
    path.resolve(__dirname, "./build/"),
    path.resolve(__dirname, "../flutter_app/assets/"),
    { overwrite: true },
  );
}



if (argv.test) {
  let pack = await import("./package.json");

  let p = path.resolve(__dirname, `../dist/${pack.version}`);
  await fs.ensureDir(p);
  await $`npm run buildtest`;
  await fs.copy("./public/logo.png", "./build/logo.png", { overwrite: true });
  // electron
  // await $`tsx task.mts --electronprod --electronprodtest`;

  if (os.platform() === "win32") {
    // android
    await $`tsx task.mts --androidprod --androidprodtest`;
  } else {
    await $`tsx task.mts --iosprod`;
  }

  await fs.copy(
    "../flutter_app/build/app/outputs/flutter-apk/app-release.apk",
    p,
    { overwrite: true },
  );
}
