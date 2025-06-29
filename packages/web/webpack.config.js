const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  // 环境变量设置
  process.env.myEnv = process.env.myEnv || "dev";
  process.env.NODE_ENV = process.env.NODE_ENV || "development";

  const isDev = process.env.NODE_ENV !== "production";

  console.log("ENV:", process.env.NODE_ENV);
  console.log("myEnv:", process.env.myEnv);
  return {
    entry: {
      index: "./src/index",
    },

    mode: isDev ? "development" : "production",
    devtool: isDev ? "source-map" : false,

    plugins: [
      // PWA Service Worker (仅生产环境)
      ...(!isDev ? [
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          exclude: [/\.map$/, /asset-manifest\.json$/],
          maximumFileSizeToCacheInBytes: 40 * 1024 * 1024, // 40MB
        })
      ] : []),

      // PWA Manifest
      new WebpackPwaManifest({
        filename: 'manifest.json',
        name: 'HyperChat',
        short_name: 'HyperChat',
        description: 'HyperChat is a agent application',
        background_color: '#ffffff',
        theme_color: '#333333',
        display: 'standalone',
        start_url: './index.html',
        icons: [
          {
            src: path.resolve(__dirname, 'public/logo.png'),
            sizes: [96, 128, 192, 256, 384, 512],
            destination: path.join('icons'),
          },
        ],
      }),

      // CSS 提取
      new MiniCssExtractPlugin({
        filename: isDev ? "[name].css" : "[name].[contenthash].css",
      }),

      // HTML 生成
      new HtmlWebpackPlugin({
        title: "HyperChat",
        template: "public/index.html",
      }),

      // 图标生成
      new FaviconsWebpackPlugin({
        logo: "public/logo.png",
        favicons: {
          appName: "HyperChat",
          appDescription: "HyperChat is a agent application",
          background: "#ffffff",
          theme_color: "#333333",
          icons: {
            appleStartup: false,
            yandex: false,
            appleIcon: false,
            android: false,
            windows: false,
          },
        },
      }),

      // 清理构建目录
      new CleanWebpackPlugin(),

      // 环境变量
      new webpack.EnvironmentPlugin({
        NODE_ENV: process.env.NODE_ENV || "development",
        myEnv: process.env.myEnv || "dev",
        myRuntime: "web",
      }),

      // 全局变量
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
    ],

    module: {
      rules: [
        // TypeScript/JavaScript 处理
        {
          test: /\.[cm]?(ts|js)x?$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              transpileOnly: true,
            },
          },
          exclude: /node_modules/,
          resolve: {
            fullySpecified: false,
          },
        },
        // 专门处理 .mts 文件
        {
          test: /\.mts$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
              transpileOnly: true,
            },
          },
          resolve: {
            fullySpecified: false,
          },
        },

        // CSS 处理
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },

        // 图片处理
        {
          test: /\.(png|jpe?g|gif|webp)$/i,
          use: [
            {
              loader: "file-loader",
            },
          ],
        },

        // 文本文件处理
        {
          test: /\.txt$/i,
          use: "raw-loader",
        },
      ],
    },

    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx", ".css", ".mts", ".mjs"],
      extensionAlias: {
        ".js": [".js", ".ts", ".mts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      alias: {
        "@": path.resolve(__dirname, "."),
        "@hyperchat/shared": path.resolve(__dirname, "../core/src/shared"),
      },
      fallback: {
        "process/browser": require.resolve("process/browser"),
        querystring: require.resolve("querystring-es3"),
      },
    },

    externals: {
      ["react-native-sqlite-storage"]: "null",
    },

    cache: {
      type: "filesystem",
    },

    output: {
      filename: isDev ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: isDev ? "[name].js" : "[name].[contenthash].js",
      path: path.resolve(__dirname, "build"),
      publicPath: "",
    },

    devServer: {
      static: path.resolve(__dirname, "build"),
      port: 8080,
      open: false,
      hot: true,
      compress: true,
      historyApiFallback: true,
      devMiddleware: {
        writeToDisk: true,
      },
    },
  };
};
