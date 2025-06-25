interface Window {
  ext: any;
  tools: any;
  getTools: any;
}

declare module "*.txt" {
  const value: any;
  export default value;
}

declare module "shell-path" {
  export function shellPathSync(): string;
  export function shellPath(): Promise<string>;
}
