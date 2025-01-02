const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
module.exports = (env, argv) => {
  console.log("ENV:", process.env.NODE_ENV);

  const isDev = process.env.NODE_ENV !== "production" ? true : false;
  return {
    target: "web",
    entry: {
      turndown: "./eval/turndown",
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: process.env.NODE_ENV || "development",
        myEnv: process.env.myEnv || "production",
      }),
    ].filter((x) => x != null),
    module: {
      rules: [
        {
          test: /\.txt/,
          type: "asset",
        },
        {
          test: /\.[cm]?(ts|js)x?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".mts", ".mjs", ".jsx", ".css", "txt"],
      // Add support for TypeScripts fully qualified ESM imports.
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
    },
    output: {
      filename: "[name].js", // 使用 contenthash 作为文件名的一部分
      chunkFilename: "[name].js", // 对于动态导入的模块
      path: path.resolve(__dirname, "../electron/js"),
    },
    mode: isDev ? "development" : "production",
    devtool: false,
  };
};
