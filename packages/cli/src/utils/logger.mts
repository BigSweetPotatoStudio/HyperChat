/**
 * Logger 工具类
 * 
 * 提供命令行日志输出功能
 */

export class Logger {
  private verbose: boolean;
  private quiet: boolean;

  constructor(verbose: boolean = false, quiet: boolean = false) {
    this.verbose = verbose;
    this.quiet = quiet;
  }

  info(message: string, ...args: any[]) {
    if (!this.quiet) {
      console.log(message, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    if (!this.quiet) {
      console.log('✅ ' + message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (!this.quiet) {
      console.warn('⚠️  ' + message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    console.error('❌ ' + message, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.verbose && !this.quiet) {
      console.log('🔍 ' + message, ...args);
    }
  }

  log(message: string, ...args: any[]) {
    if (!this.quiet) {
      console.log(message, ...args);
    }
  }
}