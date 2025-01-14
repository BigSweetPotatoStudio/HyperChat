import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// declare module "pdfjs-dist/legacy/build/pdf.js" {
//   const pdfjs: any;
//   export default pdfjs;
// }

function pdfLoader(path) {
  return new PDFLoader(path, {
    // you may need to add `.then(m => m.default)` to the end of the import
    pdfjs: () => import("pdfjs-dist").then((m) => m.default),
  });
}
