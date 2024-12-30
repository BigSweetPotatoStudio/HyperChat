import {
  FileMarkdownOutlined,
  FileTextOutlined,
  FundViewOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Result,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Attachments,
  Bubble,
  BubbleProps,
  Conversations,
  ConversationsProps,
  Prompts,
  Sender,
  Suggestion,
  ThoughtChain,
  Welcome,
  XProvider,
  useXAgent,
  useXChat,
} from "@ant-design/x";
const antdMessage = message;
import React, { useCallback, useEffect, useRef, useState } from "react";
import markdownit from "markdown-it";

export function UserContent({ x, regenerate, submit }) {
  const [isEdit, setIsEdit] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div>
      {isEdit ? (
        <div>
          <Input.TextArea
            style={{ minWidth: 600 }}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <Space.Compact>
            <Button
              size="small"
              onClick={() => {
                setValue(x.content);
                setIsEdit(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={() => {
                setIsEdit(false);
                submit(value);
              }}
            >
              Submit
            </Button>
          </Space.Compact>
        </div>
      ) : (
        <Tooltip
          title={
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setValue(x.content);
                  setIsEdit(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  regenerate();
                }}
              >
                Regenerate
              </Button>
            </>
          }
        >
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {x.content as string}
          </pre>
        </Tooltip>
      )}
    </div>
  );
}

const md = markdownit({ html: true, breaks: true });
const renderMarkdown: BubbleProps["messageRender"] = (content) => (
  <div
    className="markdown-body"
    dangerouslySetInnerHTML={{ __html: md.render(content) }}
  />
);
function extractHTMLContent(str) {
  // 定义一个正则表达式来匹配 ```html 和 ``` 之间的所有内容
  const regex = /```html(.*?)```/gs;
  // 执行匹配并检查是否有结果
  let match = regex.exec(str);
  if (match && match[1]) {
    // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
    return match[1].trim();
  }
  // 如果没有找到匹配的内容，则返回空字符串或 null
  return "";
}
function extractSvgContent(str) {
  // 定义一个正则表达式来匹配 ```svg 和 ``` 之间的所有内容
  let regex = /```xml(\n?<svg.*?)```/gs;
  // 执行匹配并检查是否有结果
  let match = regex.exec(str);
  if (match && match[1]) {
    // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
    return match[1].trim();
  }
  // 定义一个正则表达式来匹配 ```svg 和 ``` 之间的所有内容
  regex = /```svg(\n?<svg.*?)```/gs;
  // 执行匹配并检查是否有结果
  match = regex.exec(str);
  if (match && match[1]) {
    // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
    return match[1].trim();
  }
  return "";
}
function textToBase64Unicode(text) {
  // 创建一个Uint8Array从TextEncoder输出的字节流
  let encoder = new TextEncoder();
  let uint8Array = encoder.encode(text);

  // 将Uint8Array转化为字符串，因为btoa接受字符串作为参数
  let binaryString = Array.from(uint8Array, (byte) =>
    String.fromCharCode(byte),
  ).join("");

  // 使用btoa进行Base64编码
  return btoa(binaryString);
}

export const MarkDown = ({ markdown }) => {
  let [artifacts, setArtifacts] = React.useState("");
  useEffect(() => {
    if (markdown) {
      // console.log(extractHTMLContent(markdown));
      let html = extractHTMLContent(markdown);
      if (html) {
        setArtifacts(html);
      } else {
        let svg = extractSvgContent(markdown);
        setArtifacts(svg);
      }
    }
  }, [markdown]);
  // console.log(artifacts);
  const [render, setRender] = React.useState("markdown");
  return (
    <div
      className="relative bg-white p-2"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <Segmented
        size="small"
        value={render}
        onChange={(value) => {
          setRender(value);
        }}
        options={[
          {
            label: "Markdown",
            value: "markdown",
            icon: <FileMarkdownOutlined />,
          },
          {
            label: "Text",
            value: "text",
            icon: <FileTextOutlined />,
          },
          artifacts && {
            label: "Artifacts",
            value: "artifacts",
            icon: <FundViewOutlined />,
          },
        ].filter((x) => x)}
      />
      <br></br>
      {render == "markdown" ? (
        renderMarkdown(markdown)
      ) : render == "artifacts" ? (
        <iframe
          src={"data:text/html;base64," + textToBase64Unicode(artifacts)}
          // className="w-3/5"
          style={{
            height: "calc(60vh)",
            width: "calc(60vw)",
          }}
        ></iframe>
      ) : (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {markdown}
        </pre>
      )}
    </div>
  );
};
