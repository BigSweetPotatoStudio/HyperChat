// import webpack from 'webpack';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import nodeExternals from 'webpack-node-externals';
// // 获取当前文件的目录名
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = (env, argv) => {
  console.log("ENV:", process.env.NODE_ENV); // 打印出传入的环境变量
  // console.log('Mode:', argv.mode); // 打印出Webpack的mode值

  const isDev = process.env.NODE_ENV !== "production" ? true : false;
  return {
    target: "node",
    entry: {
      main: "./ts/main",
      preload: "./ts/preload",
    },
    // publicPath: '/',
    // experiments: {
    //   outputModule: true,
    // },
    // externalsType: "module", // in order to ignore built-in modules like path, fs, etc.
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()],
    // externals: {
    //   "electron-screenshots": 'require("electron-screenshots")',
    // },
    plugins: [
      // new Dotenv(),
      new webpack.EnvironmentPlugin({
        NODE_ENV: "development",
        myEnv: process.env.myEnv || "prod",
        runtime: "node",
        // no_electron: "0",
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
              // transpileOnly: true, // 确保放在这里
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
      // Add support for TypeScripts fully qualified ESM imports.
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      alias: {
        ts: path.resolve(__dirname, "./ts"),
      },
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, "./tsconfig.json"),
        }),
      ],
    },
    output: {
      filename: "[name].js", // 使用 contenthash 作为文件名的一部分
      chunkFilename: "[name].js", // 对于动态导入的模块
      path: path.resolve(__dirname, "js"),
      libraryTarget: "umd", // 输出格式
    },
    mode: "development",
    devtool: false,
    optimization: {
      minimize: false, // This disables minification even in production mode
    },
    devServer: {
      static: "./build", // 告诉服务器从哪里提供内容，通常是webpack的输出目录
      port: 3000, // 设置端口号，默认是8080
      open: false, // 告诉dev-server在服务器启动后打开浏览器
      hot: true, // 启用webpack的模块热替换特性（HMR）
      compress: true, // 启用gzip压缩
      historyApiFallback: true, // 当找不到路径的时候，默认加载index.html文件
      // more options...
    },
  };
};
