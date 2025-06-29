// import React from "react";
// import type { Command } from "../../../core/src/command.mjs";
// import { Modal } from "antd";
// import { Pre } from "../components/pre";

// /**
//  * An object containing partial implementations of `Command` functions.
//  * This is used to override or replace default backend command behaviors
//  * with web-specific implementations in the frontend.
//  *
//  * For example, a command like `setClipboardText` can be implemented here
//  * using the browser's Clipboard API, providing a different behavior
//  * than the backend's implementation.
//  */
// export const replaceCommand: Partial<Command> = {
//   // Example of overriding the `setClipboardText` command.
//   // This implementation uses the browser's Clipboard API to copy text.
//   // setClipboardText: async ({ text }: { text: string }) => {
//   //   const copy = (text: string) => {
//   //     if (navigator.clipboard && window.isSecureContext) {
//   //       // Use the modern Clipboard API when available and in a secure context.
//   //       navigator.clipboard.writeText(text).catch((err) => {
//   //         console.error("Failed to copy text using Clipboard API:", err);
//   //         fallbackCopy(text);
//   //       });
//   //     } else {
//   //       // Fallback for older browsers or insecure contexts.
//   //       fallbackCopy(text);
//   //     }
//   //   };

//   //   const fallbackCopy = (text: string) => {
//   //     const textarea = document.createElement("textarea");
//   //     textarea.value = text;
//   //     textarea.style.position = "absolute";
//   //     textarea.style.opacity = "0";
//   //     document.body.appendChild(textarea);
//   //     textarea.select();
//   //     document.execCommand("copy");
//   //     document.body.removeChild(textarea);
//   //   };
//   //   copy(text);
//   // },

//   // Example of overriding the `openExplorer` command.
//   // This implementation reads a file's content and displays it in a modal dialog.
//   // openExplorer: async ({ path }: { path: string }) => {
//   //   let res = await ext.invert("readFile", [path, ""]);

//   //   Modal.info({
//   //     title: 'File Content',
//   //     width: "80%",
//   //     style: {
//   //       maxWidth: 1024,
//   //     },
//   //     maskClosable: true,
//   //     content: (
//   //       <Pre>
//   //         {res.data}
//   //       </Pre>
//   //     ),
//   //     onOk() { },
//   //   });
//   // },
// };