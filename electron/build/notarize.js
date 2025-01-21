const { notarize } = require("@electron/notarize");
const path = require("path");

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== "darwin" || process.env.GH_TOKEN == "") {
    console.log("Skipping notarization");
    return;
  }
  console.log("Notarizing...");

  const appBundleId = context.packager.appInfo.info._configuration.appId;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.normalize(
    path.join(context.appOutDir, `${appName}.app`)
  );
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  if (!appleId) {
    console.warn("Not notarizing: Missing APPLE_ID environment variable");
    return;
  }
  if (!appleIdPassword) {
    console.warn(
      "Not notarizing: Missing APPLE_ID_PASSWORD environment variable"
    );
    return;
  }
  return notarize({
    appBundleId,
    appPath,
    appleId,
    appleIdPassword,
  });
};
