export * from "./workspaceManager-enhanced.mjs"

// import * as path from "path";
// import * as fs from "fs";
// import { CONSTANTS } from "../agent/constants.mjs";
// import { Workspace } from "./workspace.mjs";

// /**
//  * 工作区管理器类 - 简化版：直接加载指定目录的工作区
//  * 核心理念：每个工作区独立管理自己的配置和数据
//  */
// export class WorkspaceManager {
//   private currentWorkspace!: Workspace;
//   private isInitialized = false;

//   constructor() {
//   }

//   /**
//    * 初始化工作区管理器（简化版）
//    * @param workspacePath 工作区路径
//    */
//   async initialize(workspacePath: string): Promise<void> {
//     if (this.isInitialized) {
//       return;
//     }

//     try {
//       this.currentWorkspace = new Workspace(workspacePath);
//       await this.currentWorkspace.initialize();
//       this.isInitialized = true;
//     } catch (error) {
//       console.warn('初始化工作区管理器失败:', error);
//       throw error;
//     }
//   }


//   /**
//    * 清理工作区管理器，释放资源
//    */
//   async uninitialize(): Promise<void> {
//     if (!this.isInitialized) {
//       return;
//     }

//     try {
//       // 清理当前工作区
//       if (this.currentWorkspace) {
//         await this.currentWorkspace.uninit();
//       }

//       this.isInitialized = false;
//     } catch (error) {
//       console.warn('清理工作区管理器失败:', error);
//       throw error;
//     }
//   }

//   /**
//    * 切换工作区（简化版）
//    * @param workspacePath 工作区路径
//    * @param force 是否强制创建工作区
//    */
//   async switchWorkspace(workspacePath: string, force: boolean = false): Promise<void> {
//     // 检查目标工作区是否存在
//     if (!force && !this.isWorkspaceDirectory(workspacePath)) {
//       throw new Error(`工作区不存在: ${workspacePath}`);
//     }

//     // 如果目标路径与当前工作区相同，无需切换
//     if (this.currentWorkspace && this.currentWorkspace.workspacePath === workspacePath) {
//       return;
//     }

//     // 先清理当前工作区的资源
//     try {
//       await this.uninitialize();
//     } catch (error) {
//       console.warn('清理当前工作区失败:', error);
//     }

//     // 初始化新工作区
//     await this.initialize(workspacePath);
//     await this.currentWorkspace.start();
//   }


//   /**
//    * 获取当前工作区
//    */
//   getCurrentWorkspace(): Workspace {
//     if (!this.isInitialized) {
//       throw new Error("工作区管理器尚未初始化，请先调用 initialize() 方法。");
//     }
//     return this.currentWorkspace;
//   }

//   /**
//    * 检查工作区管理器是否已初始化
//    */
//   isWorkspaceInitialized(): boolean {
//     return this.isInitialized;
//   }



//   /**
//    * 创建新工作区（简化版）
//    */
//   async createWorkspace(workspacePath: string): Promise<Workspace> {
//     // 检查目录是否存在
//     if (!fs.existsSync(workspacePath)) {
//       throw new Error(`工作区路径不存在: ${workspacePath}`);
//     }

//     // 检查工作区是否已存在
//     if (this.isWorkspaceDirectory(workspacePath)) {
//       throw new Error(`工作区已存在: ${workspacePath}`);
//     }

//     // 创建工作区实例并初始化
//     const workspace = new Workspace(workspacePath);
//     await workspace.initialize();

//     return workspace;
//   }




//   /**
//    * 检查指定路径是否为工作区（是否包含 .hyperchat 文件夹）
//    */
//   isWorkspaceDirectory(directoryPath: string): boolean {
//     const hyperChatPath = path.join(directoryPath, CONSTANTS.HYPERCHAT_DIR);
//     return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
//   }


//   /**
//    * 检查是否为全局工作区
//    */
//   isGlobalWorkspace(workspacePath: string): boolean {
//     const normalizedWorkspacePath = path.resolve(workspacePath);
//     const normalizedGlobalPath = path.resolve(CONSTANTS.GLOBAL_PATH);
//     return normalizedWorkspacePath === normalizedGlobalPath;
//   }

//   /**
//    * 获取全局工作区路径
//    */
//   getGlobalWorkspacePath(): string {
//     return CONSTANTS.GLOBAL_PATH;
//   }



//   /**
//    * 获取当前工作区路径
//    */
//   getCurrentWorkspacePath(): string {
//     return this.currentWorkspace.workspacePath;
//   }


// }