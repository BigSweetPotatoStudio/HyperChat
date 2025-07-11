/**
 * Config 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../../core/dist/command.mjs';

export async function getConfig(key: string) {
  const logger = new Logger();
  
  try {
    logger.info(`⚙️ 获取配置: ${key}`);
    
    // 获取应用设置
    const appSettings = await Command.getAppSettings();
    
    // 简单的键路径解析
    const keys = key.split('.');
    let value: any = appSettings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        logger.error(`配置键 ${key} 不存在`);
        process.exit(1);
      }
    }
    
    console.log(`\n⚙️ 配置值:`);
    console.log(`键名: ${key}`);
    console.log(`值: ${JSON.stringify(value, null, 2)}`);
    
  } catch (error) {
    logger.error('获取配置失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function setConfig(key: string, value: string) {
  const logger = new Logger();
  
  try {
    logger.info(`⚙️ 设置配置: ${key} = ${value}`);
    
    // 获取当前应用设置
    const appSettings = await Command.getAppSettings();
    
    // 解析值（尝试JSON解析，失败则作为字符串）
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    
    // 简单的键路径设置
    const keys = key.split('.');
    let target: any = appSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    const lastKey = keys[keys.length - 1];
    target[lastKey] = parsedValue;
    
    // 更新应用设置
    await Command.updateAppSettings({ updates: appSettings });
    
    logger.success(`✅ 配置更新成功`);
    console.log(`键名: ${key}`);
    console.log(`新值: ${JSON.stringify(parsedValue, null, 2)}`);
    
  } catch (error) {
    logger.error('设置配置失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function listConfig() {
  const logger = new Logger();
  
  try {
    logger.info('⚙️ 获取所有配置...');
    
    const appSettings = await Command.getAppSettings();
    
    console.log('\n⚙️ 应用配置:');
    console.log(JSON.stringify(appSettings, null, 2));
    
  } catch (error) {
    logger.error('获取配置失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}