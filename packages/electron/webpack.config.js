const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = (env, argv) => {
  console.log("ENV:", process.env.NODE_ENV); // 打印出传入的环境变量

  const isDev = process.env.NODE_ENV !== "production" ? true : false;
  return {
    target: "electron-main",
    entry: {
      main: "./src/main.mts",
      preload: "./src/preload.mts",
    },
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()],
    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: "production",
        myEnv: process.env.myEnv || "prod",
        runtime: "electron",
        use_electron: "1",
      }),
    ],
    module: {
      rules: [
        {
          test: /\.[cm]?(ts|js)x?$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
            },
          },
          exclude: /node_modules/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.txt$/i,
          use: "raw-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".mts", ".mjs", ".jsx", ".css"],
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      alias: {
        "@hyperchat/core": path.resolve(__dirname, "../core/src"),
        "@dadigua/hyperchat-shared": path.resolve(__dirname, "../shared"),
      },
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, "./tsconfig.json"),
        }),
      ],
    },
    output: {
      filename: "[name].js",
      chunkFilename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      libraryTarget: "commonjs2",
    },
    mode: isDev ? "development" : "production",
    devtool: isDev ? "source-map" : false,
    optimization: {
      minimize: !isDev,
    },
  };
};