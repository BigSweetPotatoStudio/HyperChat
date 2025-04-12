import React from "react";

import { ext } from "./call";
import type { CommandFactory as Command } from "../../../electron/ts/command.mjs";
import { Modal } from "antd";
import { Pre } from "../components/pre";
export const replaceCommand: Partial<Command> = {
  setClipboardText: async (text: string) => {
    const copy = (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        // Use the modern Clipboard API when available and in secure context
        navigator.clipboard.writeText(text).catch((err) => {
          console.error("Failed to copy text using Clipboard API:", err);
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    };

    const fallbackCopy = (text: string) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "absolute";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    };
    copy(text);
  },
  openExplorer: async (path: string) => {
    let res = await ext.invert("readFile", [path, ""]);

    Modal.info({
      title: 'File Content',
      width: "80%",
      style: {
        maxWidth: 1024,
      },
      maskClosable: true,
      content: (
        <Pre>
          {res.data}
        </Pre>
      ),
      onOk() { },
    });
  },
};