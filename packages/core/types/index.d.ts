interface Window {
  ext: any;
  tools: any;
  getTools: any;
}

declare module "*.txt" {
  const value: any;
  export default value;
}
