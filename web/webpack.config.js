const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  process.env.myEnv = process.env.myEnv || "dev";
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  console.log("ENV:", process.env.NODE_ENV); // 打印出传入的环境变量
  console.log("myEnv:", process.env.myEnv); // 打印出Webpack的mode值

  const isDev = process.env.NODE_ENV !== "production" ? true : false;
  return {
    entry: {
      // t: './src/test',
      index: "./src/index",
    },
    // publicPath: '/',
    plugins: [
      new MiniCssExtractPlugin({
        filename: isDev ? "[name].css" : "[name].[contenthash].css", // 使用 contenthash
      }),

      new HtmlWebpackPlugin({
        title: "dadigua-toolbox", // 用于设置生成的HTML文档的标题
        template: "public/index.html", // 模板文件路径
      }),
      new FaviconsWebpackPlugin({
        logo: "public/logo.png",
        favicons: {
          appName: "dadigua",
          appDescription: "dadiguaApp",
          background: "#ddd",
          theme_color: "#333",
          icons: {
            appleStartup: false,
            yandex: false,
            appleIcon: false,
            android: false,
            windows: false,
          },
        },
      }), // svg works too!,
      new CleanWebpackPlugin(),
      // new Dotenv(),
      new webpack.EnvironmentPlugin({
        NODE_ENV: process.env.NODE_ENV || "development",
        REACT_APP_REMOTE_URL:
          "https://www.dadigua.men" ||
          (isDev ? "http://localhost:18002" : "https://www.dadigua.men"),
        myEnv: process.env.myEnv || "dev",
      }),
      new webpack.ProvidePlugin({
        process: "process/browser",
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
              transpileOnly: true, // 确保放在这里
            },
          },
          exclude: /node_modules/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|webp)$/i,
          use: [
            {
              loader: "file-loader",
            },
          ],
        },
        {
          test: /\.txt$/i,
          use: "raw-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx", ".css"],
      // Add support for TypeScripts fully qualified ESM imports.
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      fallback: {
        "process/browser": require.resolve("process/browser"),
        querystring: require.resolve("querystring-es3"),
      },
    },
    externals: {
      ["react-native-sqlite-storage"]: "null",
    },
    output: {
      filename: isDev ? "[name].js" : "[name].js", // 使用 contenthash 作为文件名的一部分
      chunkFilename: isDev ? "[name].js" : "[name].js", // 对于动态导入的模块
      path: path.resolve(__dirname, "../electron/web-build"),
    },
    mode: isDev ? "development" : "production",
    devtool: isDev ? "source-map" : false,
    cache: {
      type: "filesystem", // 使用文件系统级别的缓存
    },
    // optimization: {
    //   splitChunks: {
    //     chunks: 'all',
    //   },
    // },
    devServer: {
      static: path.resolve(__dirname, "../electron/web-build"), // 告诉服务器从哪里提供内容，通常是webpack的输出目录
      port: 8080, // 设置端口号，默认是8080
      open: false, // 告诉dev-server在服务器启动后打开浏览器
      hot: true, // 启用webpack的模块热替换特性（HMR）
      compress: true, // 启用gzip压缩
      historyApiFallback: true, // 当找不到路径的时候，默认加载index.html文件
      devMiddleware: {
        writeToDisk: true, // 启用文件写入磁盘
      },
    },
  };
};
