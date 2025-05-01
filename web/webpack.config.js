const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { GenerateSW, InjectManifest } = require('workbox-webpack-plugin');
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
      ...(isDev
        ? [
          // (() => {
          //   let workboxPlugin = new InjectManifest({
          //     // 排除不需要缓存的文件
          //     exclude: [/\.map$/, /asset-manifest\.json$/],
          //     // 增加文件大小限制
          //     maximumFileSizeToCacheInBytes: 40 * 1024 * 1024, // 40MB
          //     // 自定义 Service Worker 文件路径
          //     swSrc: './src/sw.js',
          //     swDest: './service-worker.js', // 输出的 Service Worker 文件名，默认为 "service-worker.js"
          //     // additionalManifestEntries: [], // 额外要缓存的条目
          //     // dontCacheBustURLsMatching: /\.\w{8}\./,  // 跳过对已有 hash 的 URL 进行缓存破坏
          //   });
          //   if (process.env.NODE_ENV !== 'production') {
          //     Object.defineProperty(workboxPlugin, 'alreadyCalled', {
          //       get() {
          //         return false
          //       },
          //       set() { }
          //     })
          //   }
          //   return workboxPlugin;
          // })(),
        ]
        : [
          // GenerateSW 会为你创建一个完整的 Service Worker 文件
          // 适合大多数基本的 PWA 用例
          new GenerateSW({
            clientsClaim: true, // Service Worker 激活后立即控制所有客户端
            skipWaiting: true,  // 新 Service Worker 安装后立即激活
            exclude: [/\.map$/, /asset-manifest\.json$/],
            // 增加文件大小限制
            maximumFileSizeToCacheInBytes: 40 * 1024 * 1024, // 40MB
            // runtimeCaching: [  // 配置运行时缓存策略
            //   {
            //     urlPattern: /^https:\/\/api\.example\.com\//, // 匹配 API 请求
            //     handler: 'NetworkFirst',  // 优先使用网络，失败时回退到缓存
            //     options: {
            //       cacheName: 'api-cache',
            //       expiration: {
            //         maxEntries: 50,       // 最多缓存50个请求
            //         maxAgeSeconds: 86400, // 缓存1天
            //       },
            //     },
            //   },
            //   {
            //     urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/, // 匹配图片文件
            //     handler: 'CacheFirst',    // 优先使用缓存，减少网络请求
            //     options: {
            //       cacheName: 'images-cache',
            //       expiration: {
            //         maxEntries: 60,
            //         maxAgeSeconds: 2592000, // 30天
            //       },
            //     },
            //   },
            // ],
            // navigateFallback: '/index.html', // SPA 应用常用，处理导航请求的回退页面
            // navigateFallbackDenylist: [/^\/api\//], // 不应用回退策略的路径
          }),
        ]),
      // PWA manifest 插件
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
        // screenshots: [
        //   {
        //     src: "screenshots/screenshot1.png",
        //     sizes: "1280x720",
        //     type: "image/png",
        //     form_factor: "wide"
        //   }
        // ],
      }),
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
      publicPath: "",
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
