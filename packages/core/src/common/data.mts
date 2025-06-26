/**
 * 数据持久化增强模块
 * 
 * 核心功能：
 * - 为 Data 原型添加文件系统持久化能力
 * - 提供异步和同步的数据初始化方法
 * - 自动处理数据格式化和序列化
 * - 初始化应用核心配置数据
 * - 处理配置迁移和兼容性
 * 
 * 依赖关系：
 * - shared/data: 数据模型和实例定义
 * - polyfills/index: 应用数据目录和常量
 * - es6: 文件系统工具 (zx)
 * 
 * 生命周期：
 * 1. 扩展 Data 原型方法
 * 2. 初始化应用设置和电子应用数据
 * 3. 处理 WebDAV 配置继承
 * 4. 处理环境变量和快捷方式迁移
 * 5. 保存最终配置
 * 
 * 使用说明：
 * 该模块通过副作用的方式工作，导入时自动执行初始化流程
 * 扩展的方法可通过 Data 实例直接调用
 */

import {
  electronData,
  AppSetting,
  ENV_CONFIG,
  VarList,
  Data,
} from "../../../shared/data.mjs";

import { appDataDir, CONST } from "../polyfills/index.mjs";

import { zx } from "../es6.mjs";
const { fs, path } = zx;

/**
 * 异步初始化数据
 * 
 * 从文件系统加载 JSON 数据并合并到当前实例
 * 支持可选的格式化处理函数
 * 
 * @param _options - 初始化选项（当前未使用）
 * @returns Promise<any> - 返回初始化后的数据对象
 */
Data.prototype.init = async function (_options: any = {}) {
  try {
    (this as any).localStorage = await fs.readJSON(path.join(appDataDir, this.KEY));
  } catch (e) {
    (this as any).localStorage = {};
  }
  (this as any).data = this.options?.formatInit?.(Object.assign({}, (this as any).data, (this as any).localStorage)) || {};
  return (this as any).data;
}

/**
 * 同步初始化数据
 * 
 * 同步版本的数据初始化方法，不返回 Promise
 * 主要用于需要立即获取数据的场景
 * 
 * @param _ - 初始化选项（当前未使用）
 * @returns any - 返回初始化后的数据对象
 */
Data.prototype.initSync = function ({ } = {}) {
  try {
    if (fs.existsSync(path.join(appDataDir, this.KEY))) {
      (this as any).localStorage = fs.readJsonSync(path.join(appDataDir, this.KEY));
    } else {
      (this as any).localStorage = {};
    }
  } catch (e) {
    (this as any).localStorage = {};
  }
  (this as any).data = this.options?.formatInit?.(Object.assign({}, (this as any).data, (this as any).localStorage)) || {};
  return (this as any).data;
};

/**
 * 异步保存数据到文件系统
 * 
 * 将当前数据对象序列化为 JSON 格式并写入文件
 * 支持可选的格式化处理函数用于保存前的数据转换
 * 
 * @returns Promise<void> - 保存完成的 Promise
 */
Data.prototype.save = async function () {
  return await fs.writeFile(
    path.join(appDataDir, this.KEY),
    JSON.stringify(this.options?.formatSave?.((this as any).data) || (this as any).data, null, 2)
  );
}

/*
 * 注释掉的同步保存方法，保留供参考
 */
// Data.prototype.saveSync = function () {
//   return fs.writeFileSync(
//     path.join(appDataDir, this.KEY),
//     JSON.stringify(this.options.formatSave(this.data), null, 2)
//   );
// };

// for (let data of DataList) {
//   data.override({
//     async init() {

//       try {
//         if (await fs.exists(path.join(appDataDir, this.KEY))) {
//           this.localStorage = await fs.readJSON(path.join(appDataDir, this.KEY));
//         } else {
//           this.localStorage = {};
//         }
//       } catch (e) {
//         this.localStorage = {};
//       }
//       this.data = this.options.formatInit(Object.assign({}, this.data, this.localStorage));
//       return this.data;
//     },
//     initSync() {
//       try {
//         if (fs.existsSync(path.join(appDataDir, this.KEY))) {
//           this.localStorage = fs.readJsonSync(path.join(appDataDir, this.KEY));
//         } else {
//           this.localStorage = {};
//         }
//       } catch (e) {
//         this.localStorage = {};
//       }
//       this.data = this.options.formatInit(Object.assign({}, this.data, this.localStorage));
//       return this.data;
//     },
//     async save() {
//       try {
//         if (this.KEY == "chat_history.json") {
//         } else {
//           getMessageService().sendAllToRenderer({
//             type: "syncNodeToWeb",
//             data: { key: this.KEY, data: this.data },
//           });
//         }
//       } catch (e) { }

//       return await fs.writeFile(
//         path.join(appDataDir, this.KEY),
//         JSON.stringify(this.options.formatSave(this.data), null, 2)
//       );
//     },
//     saveSync() {
//       try {
//         if (this.KEY == "chat_history.json") {
//         } else {
//           getMessageService().sendAllToRenderer({
//             type: "syncNodeToWeb",
//             data: { key: this.KEY, data: this.data },
//           });
//         }
//       } catch (e) { }

//       return fs.writeFileSync(
//         path.join(appDataDir, this.KEY),
//         JSON.stringify(this.options.formatSave(this.data), null, 2)
//       );
//     }
//   });
// }


// export const MCPServerPORT = 16110;

/*
 * ==========================================
 * 应用初始化流程
 * ==========================================
 * 
 * 以下代码在模块导入时自动执行，负责：
 * 1. 初始化应用核心配置
 * 2. 处理配置数据的迁移和兼容性
 * 3. 设置默认值和平台特定配置
 */

// 1. 初始化应用设置和电子应用数据
await AppSetting.init();
await electronData.init();

// 2. 处理 WebDAV 配置继承 - 从应用设置继承到电子应用数据
electronData.get().webdav.url = electronData.get().webdav.url || AppSetting.get().webdav.url;
electronData.get().webdav.password = electronData.get().webdav.password || AppSetting.get().webdav.password;
electronData.get().webdav.username = electronData.get().webdav.username || AppSetting.get().webdav.username;
electronData.get().webdav.baseDirName = electronData.get().webdav.baseDirName || AppSetting.get().webdav.baseDirName;

// 3. 设置默认值和平台信息
electronData.get().runTask = electronData.get().runTask == null ? true : electronData.get().runTask;
electronData.get().isLoadClaudeConfig = electronData.get().isLoadClaudeConfig == null ? true : electronData.get().isLoadClaudeConfig;
electronData.get().platform = process.platform;

// 4. 处理环境变量迁移 - 将临时的 PATH 配置迁移到电子应用数据
if ((await ENV_CONFIG.init()).PATH != "") {
  electronData.get().PATH = ENV_CONFIG.get().PATH;
  ENV_CONFIG.get().PATH = "";
  await ENV_CONFIG.save();
}

// 5. 处理快捷方式迁移 - 将旧版本的快捷方式迁移到新的变量列表系统
if (AppSetting.get().quicks.length > 0 && !fs.existsSync(path.join(appDataDir, VarList.KEY))) {
  await VarList.init();
  VarList.get().data = VarList.get().data.concat(AppSetting.get().quicks.map(x => {
    return { name: x.label, value: x.quick, variableStrategy: "lazy", key: x.value, scope: "quick", variableType: "string" };
  }));
  AppSetting.get().quicks = [];
  await VarList.save();
}

// 6. 最终保存所有配置
await AppSetting.save();
// electronData.get().mcp_server_port = MCPServerPORT; // 保留供参考
electronData.get().version = CONST.getVersion;
await electronData.save();


