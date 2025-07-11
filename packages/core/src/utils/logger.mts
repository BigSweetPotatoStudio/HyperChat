/**
 * Core Logger utility
 */

export class Logger {
  private verbose: boolean;
  private quiet: boolean;

  constructor(verbose = false, quiet = false) {
    this.verbose = verbose;
    this.quiet = quiet;
  }

  info(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log(message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.log('🐛', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.warn('⚠️', message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error('❌', message, ...args);
  }

  success(message: string, ...args: any[]): void {
    if (!this.quiet) {
      console.log('✅', message, ...args);
    }
  }
}