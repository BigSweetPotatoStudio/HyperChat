require("dotenv").config();
const { notarize } = require("@electron/notarize");
const path = require("path");
const os = require("os");

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== "darwin" || process.env.GH_TOKEN == "") {
    console.log("Skipping notarization");
    return;
  }
  console.log("Notarizing...");

  try {
    console.log("test...", os.arch());

    if (os.arch() === 'x64') {
      console.log("test...1");
      const file = path.join(__dirname, '..', 'dist', 'latest-mac.yml');
      if (fs.existsSync(file)) {
        fs.rmSync(file);
        console.log('latest-mac.yml removed before publish.');
      } else {
        console.log('latest-mac.yml not found.');
      }
    }
  } catch (e) {
    console.log(e);
  }

  // const appBundleId = context.packager.appInfo.info._configuration.appId;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.normalize(
    path.join(context.appOutDir, `${appName}.app`)
  );

  await notarize({
    appBundleId: "men.dadigua.hpyerchat",
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
  console.log("Notarized app:", appPath);
};
