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

const webdavClient = createClient(
  "http://alist.dadigua.men/dav/ubuntu/downloads/static/downloads/AudioBridge",
  {
    username: "dadigua",
    password: "qweQWE1!@#",
  },
);
await webdavClient.getDirectoryContents("/");

const uploadDirectory = async (sourceDir: string, targetDir: string) => {
  const files = await fs.readdir(sourceDir);
  for (const file of files) {
    console.log("file : ", file);
    if (file.endsWith(".ipa") || file.endsWith(".aab")) {
      continue;
    }
    const sourcePath = `${sourceDir}/${file}`;
    const targetPath = `${targetDir}/${file}`;
    const stat = await fs.stat(sourcePath);
    if (stat.isDirectory()) {
      let isExist = await webdavClient.exists(targetPath);
      if (!isExist) {
        await webdavClient.createDirectory(targetPath);
      }
      await uploadDirectory(sourcePath, targetPath);
    } else {
      const fileContent = await fs.readFile(sourcePath);
      await retry(3, () =>
        webdavClient.putFileContents(targetPath, fileContent, {}),
      );
      // await webdavClient.putFileContents(targetPath, fileContent, {});
    }
  }
};

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

if (argv.prod) {
  // await uploadDirectory("../dist", "");
  if (argv.new) {
    await $`npm version patch`;
  }

  let pack = await import("./package.json");

  let p = path.resolve(__dirname, `../dist/${pack.version}`);
  await fs.emptyDir("../dist");
  await fs.ensureDir(p);

  await $`tsx task.mts --pre`;

  await fs.remove("../electron/dist");
  // electron
  await $`tsx task.mts --electronprod`;
  if (os.platform() === "win32") {
    await fs.copy(
      `../electron/dist/AudioBridge Setup ${pack.version}.exe`,
      p + `/AudioBridge-Setup-${pack.version}.exe`,
      {
        overwrite: true,
      },
    );
  } else {
    await fs.copy(
      `../electron/dist/AudioBridge Setup ${pack.version}.exe`,
      p + `/AudioBridge-Setup-${pack.version}.exe`,
      {
        overwrite: true,
      },
    );

    await fs.copy(
      `../electron/dist/AudioBridge-${pack.version}-arm64.dmg`,
      p + `/AudioBridge-${pack.version}-arm64.dmg`,
      {
        overwrite: true,
      },
    );
    await fs.copy(
      `../electron/dist/AudioBridge-${pack.version}.dmg`,
      p + `/AudioBridge-${pack.version}-x64.dmg`,
      {
        overwrite: true,
      },
    );
  }

  await uploadDirectory("../dist", "");
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
