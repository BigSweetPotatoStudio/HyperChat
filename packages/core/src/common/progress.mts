/**
 * 进度跟踪和管理模块
 * 
 * 核心功能：
 * - 提供进度条数据模型和管理
 * - 支持多个并发任务的进度跟踪
 * - 自动计算进度百分比
 * - 与应用数据持久化集成
 * 
 * 依赖关系：
 * - shared/data: 应用数据模型，用于持久化进度信息
 * 
 * 使用场景：
 * - 文件上传/下载进度显示
 * - 大型任务执行进度跟踪
 * - 批量操作进度监控
 * - 前端进度条更新
 * 
 * 架构说明：
 * - Progress: 单个进度项的数据模型
 * - ProgressList: 进度列表管理器，支持多任务跟踪
 */

import { LocalSetting } from "../shared/data.mjs";

/**
 * 进度项数据模型
 * 
 * 表示单个任务的进度信息，包含进度计算和状态管理
 */
class Progress {
  /** 任务名称，用于唯一标识进度项 */
  name = "";
  /** 已完成的数量 */
  loaded = 0;
  /** 总数量 */
  total = 0;
  /** 进度状态：进行中或已完成 */
  status: "progress" | "success" = "progress";
  /** 计算得出的进度百分比 */
  progress = 0;
  
  /**
   * 创建进度项实例
   * 
   * @param name - 任务名称
   * @param loaded - 已完成数量
   * @param total - 总数量
   */
  constructor(name: string, loaded: number, total: number) {
    this.name = name;
    this.loaded = loaded;
    this.total = total;
  }
  
  /**
   * 计算进度百分比
   * 
   * 将 loaded/total 转换为保留两位小数的百分比
   * 例如：50/100 -> 50.00
   */
  calcProgress() {
    this.progress = Math.round((this.loaded / this.total) * 10000) / 100;
  }
}

/**
 * 进度列表管理器
 * 
 * 管理多个并发任务的进度信息，提供统一的进度更新和查询接口
 */
class ProgressList {
  /** 进度项数组 */
  data: Array<Progress> = [];
  
  /**
   * 重置所有进度数据
   * 
   * 清空所有进度项，通常在开始新的批量任务前调用
   */
  reset() {
    this.data = [];
  }
  
  /**
   * 设置或更新指定任务的进度
   * 
   * 如果任务不存在则创建新的进度项，否则更新现有进度
   * 当 loaded 等于 total 时自动标记为完成状态
   * 
   * @param name - 任务名称
   * @param loaded - 已完成数量
   * @param total - 总数量
   * 
   * @example
   * ```typescript
   * // 开始文件上传
   * await progressList.setProgress('文件上传', 0, 100);
   * 
   * // 更新进度
   * await progressList.setProgress('文件上传', 50, 100);
   * 
   * // 完成任务
   * await progressList.setProgress('文件上传', 100, 100);
   * ```
   */
  async setProgress(name: string, loaded: number, total: number) {
    let progress = this.data.find((x) => x.name == name);
    if (!progress) {
      progress = new Progress(name, loaded, total);
      this.data.push(progress);
    }
    progress.loaded = loaded;
    progress.total = total;
    progress.calcProgress();
    if (progress.loaded == progress.total) {
      progress.status = "success";
    }
    await LocalSetting.save();
  }
  
  /**
   * 获取所有进度数据
   * 
   * @returns 包含所有进度项的数组
   */
  getData() {
    return this.data;
  }
}

/**
 * 全局进度列表实例
 * 
 * 应用中所有进度跟踪操作都通过此实例进行
 */
export const progressList = new ProgressList();
