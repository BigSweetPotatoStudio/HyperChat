// import type { Command } from '../../ts/command'

interface Window {
  flutter_inappwebview: any;
  process: any;
  ext: any;
  electron: any;
  ReactNativeWebView: any;
  exposedFetch: any;
  fetchResponseHandler: any;
  originalFetch: any;
  fetchErrorHandler: any;
  injectedRN: boolean;
  MyWebView: any;
  translate: any;
  tools: any;
  // clarity: any;
}

declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.webp" {
  const value: any;
  export default value;
}

declare module "*.txt" {
  const value: any;
  export default value;
}
