interface Window {
  ext: any;
  tools: any;
}

declare module "*.txt" {
  const value: any;
  export default value;
}
