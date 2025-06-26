import React from "react";
import { message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { setClipboardText } from "./util";

/**
 * Props for the Code component.
 */
interface CodeProps {
  /**
   * The code content to be displayed.
   */
  children: string;
}

/**
 * A component that displays a piece of code with a copy-to-clipboard button.
 * @param {CodeProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered code component.
 */
export function Code({ children }: CodeProps): React.ReactElement {
  const handleCopy = async () => {
    try {
      await setClipboardText({ text: children });
      message.success("Copied to clipboard");
    } catch (error) {
      message.error("Failed to copy");
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <code className="bg-slate-300 p-1">
      {children}{" "}
      <CopyOutlined
        className="cursor-pointer"
        onClick={handleCopy}
      />
    </code>
  );
}
