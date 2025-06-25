declare module 'auto-launch' {
  interface AutoLaunchOptions {
    name: string;
    path: string;
  }
  
  export default class AutoLaunch {
    constructor(options: AutoLaunchOptions);
    enable(): Promise<void>;
    disable(): Promise<void>;
    isEnabled(): Promise<boolean>;
  }
}