// Webpack 配置文件，用于 Node.js 环境下的 HyperChat 构建（无 Electron 环境）
const path = require("path"); // Node.js 路径模块
const webpack = require("webpack"); // Webpack 主包
const nodeExternals = require("webpack-node-externals"); // 用于排除 node_modules 依赖
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin"); // 支持 tsconfig 路径别名

module.exports = (env, argv) => {
  console.log("ENV:", process.env.NODE_ENV); // 打印当前环境变量

  const isDev = process.env.NODE_ENV !== "production" ? true : false; // 判断是否为开发环境
  return {
    target: "node", // 指定构建目标为 Node.js
    entry: {
      main_no_electron: "./src/main_no_electron", // 入口文件，主进程代码
    },
    externalsPresets: { node: true }, // 忽略 Node.js 内置模块
    externals: [nodeExternals()], // 排除 node_modules 依赖，提升构建速度
    plugins: [
      // 注入环境变量到代码中
      new webpack.EnvironmentPlugin({
        NODE_ENV: "production", // 默认生产环境
        myEnv: process.env.myEnv || "prod", // 自定义环境变量
        runtime: "node", // 运行时类型
        use_electron: "1", // 是否使用 electron，1 表示否
      }),
    ],
    module: {
      rules: [
        {
          test: /\.[cm]?(ts|js)x?$/, // 匹配 ts/js/tsx/jsx/mts/mjs 文件
          use: {
            loader: "ts-loader", // 使用 ts-loader 处理 TypeScript
            options: {
              configFile: "tsconfig.json", // 指定 ts 配置
              transpileOnly: true, // 仅转译，不做类型检查，加快编译
            },
          },
          exclude: /node_modules/, // 排除 node_modules
          resolve: {
            fullySpecified: false, // 允许省略扩展名
          },
        },
        {
          test: /\.txt$/i, // 处理 txt 文件为原始字符串
          use: "raw-loader",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".mts", ".mjs", ".jsx", ".css"], // 支持的扩展名
      extensionAlias: {
        ".js": [".js", ".ts"],
        ".cjs": [".cjs", ".cts"],
        ".mjs": [".mjs", ".mts"],
      },
      alias: {
        src: path.resolve(__dirname, "./src"), // src 路径别名
      },
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, "./tsconfig.json"), // 支持 tsconfig 路径映射
        }),
      ],
    },
    output: {
      filename: "[name].js", // 输出文件名
      chunkFilename: "[name].js", // 动态导入模块文件名
      path: path.resolve(__dirname, "js"), // 输出目录
      libraryTarget: "umd", // 通用模块定义，兼容多种引入方式
    },
    mode: isDev ? "development" : "production", // 构建模式
    devtool: false, // 不生成 source map
    optimization: {
      minimize: false, // 不压缩代码，便于调试
    },
    devServer: {
      static: "./build", // 静态资源目录
      port: 3000, // 开发服务器端口
      open: false, // 启动后不自动打开浏览器
      hot: true, // 启用热更新
      compress: true, // 启用 gzip 压缩
      historyApiFallback: true, // 路由回退到 index.html
    },
  };
};
