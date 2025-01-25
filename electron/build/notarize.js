require("dotenv").config();
const { notarize } = require("@electron/notarize");
const path = require("path");

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== "darwin" || process.env.GH_TOKEN == "") {
    console.log("Skipping notarization");
    return;
  }
  console.log("Notarizing...");

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
