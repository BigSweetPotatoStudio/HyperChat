import {
  CopyOutlined,
  DownloadOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  FundViewOutlined,
  UploadOutlined,
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
import "github-markdown-css/github-markdown-light.css";
import "../../../public/katex/katex.min.css";

import markdownit from "markdown-it";
import mk from "@vscode/markdown-it-katex";

export function UserContent({ x, regenerate = undefined, submit }) {
  const [isEdit, setIsEdit] = useState(false);
  const [value, setValue] = useState("");
  useEffect(() => {
    if (x.content_context.edit) {
      if (Array.isArray(x.content)) {
        setValue(x.content[0].text);
      } else {
        setValue(x.content.toString());
      }
      setIsEdit(true);
    } else {
      setIsEdit(false);
    }
  }, [x.content_context.edit]);
  return (
    <div>
      {isEdit ? (
        <div>
          <Input.TextArea
            rows={4}
            style={{ minWidth: 600 }}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            // onPressEnter={() => {
            //   x.content_context.edit = false;
            //   setIsEdit(false);
            //   if (Array.isArray(x.content)) {
            //     x.content[0].text = value;
            //     submit(x.content);
            //   } else {
            //     submit(value);
            //   }
            // }}
          />
          <Space.Compact>
            <Button
              size="small"
              onClick={() => {
                x.content_context.edit = false;
                setIsEdit(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={() => {
                x.content_context.edit = false;
                setIsEdit(false);
                if (Array.isArray(x.content)) {
                  x.content[0].text = value;
                  submit(x.content);
                } else {
                  submit(value);
                }
              }}
            >
              Submit
            </Button>
          </Space.Compact>
        </div>
      ) : Array.isArray(x.content) ? (
        x.content.map((c, i) => {
          if (c.type == "text") {
            return (
              <div key={i}>
                <pre
                  key={i}
                  style={{
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {c.text.toString()}
                </pre>
                {x.content.length > 1 && i == 0 && (
                  <Divider plain>resources</Divider>
                )}
              </div>
            );
          } else if (c.type == "image_url") {
            return (
              <DownImage
                onClick={() => {
                  Modal.info({
                    width: "50%",
                    title: "Tip",
                    maskClosable: true,
                    content: (
                      <div>
                        <img
                          className="bg-cover"
                          src={c.image_url.url as string}
                        />
                      </div>
                    ),
                  });
                }}
                key={i}
                src={c.image_url.url}
                className="h-48 w-48"
              />
            );
          } else {
            return <span key={i}>unknown</span>;
          }
        })
      ) : (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {x.content.toString()}
        </pre>
      )}
    </div>
  );
}

// let webviewErrorValue = "";
import { call } from "../../common/call";
import hljs from "highlight.js"; // https://highlightjs.org
import "highlight.js/styles/github.css";
import { v4 } from "uuid";
import { sleep } from "../../common/sleep";
// import "highlight.js/lib/languages/all";

// import javascript from "highlight.js/lib/languages/javascript.js";
// hljs.registerLanguage("javascript", javascript);

// import xml from "highlight.js/lib/languages/xml.js";
// hljs.registerLanguage("xml", xml);

// import go from "highlight.js/lib/languages/go.js";
// hljs.registerLanguage("go", go);

// import rust from "highlight.js/lib/languages/rust.js";
// hljs.registerLanguage("rust", rust);

// import css from "highlight.js/lib/languages/css.js";
// hljs.registerLanguage("css", css);

const md = markdownit({
  html: true,
  breaks: true,

  highlight: function (str, lang) {
    let fnName = "copy" + v4().replaceAll("-", "");
    window[fnName] = async () => {
      await call("setClipboardText", [str]);
      message.success("Copied to clipboard");
    };
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          `<pre style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs">` +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (__) {}
    }

    return (
      `<pre style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs" >` +
      md.utils.escapeHtml(str) +
      "</code></pre>"
    );
  },
});
md.use(mk);

function render(content) {
  content = content.replace(/\\\[(.+?)\\\]/gs, "$$" + "$1" + "$$");
  content = content.replace(/\\\((.+?)\\\)/g, "$$" + "$1" + "$$");
  return md.render(content);
}

const renderMarkdown: BubbleProps["messageRender"] = (content) => (
  <div
    className="markdown-body text-sm lg:text-base"
    dangerouslySetInnerHTML={{ __html: render(content) }}
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

export const MarkDown = ({ markdown, onCallback }) => {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  let [artifacts, setArtifacts] = React.useState("");
  let [artifactsType, setArtifactsType] = React.useState("html");
  useEffect(() => {
    if (markdown) {
      // console.log(extractHTMLContent(markdown));
      let html = extractHTMLContent(markdown);
      if (html) {
        setArtifacts(html);
        setArtifactsType("html");
      } else {
        let svg = extractSvgContent(markdown);
        if (svg) {
          setArtifacts(`<html><body style="display: flex;justify-content: center;">${svg}</body></html>`);
        }

        setArtifactsType("svg");
      }
    }
  }, [markdown]);
  // console.log(artifacts);
  const [render, setRender] = React.useState("markdown");
  const webviewRef = useRef(null);
  const webviewError = useRef("");
  useEffect(() => {
    if (render == "artifacts") {
      webviewError.current = "";
    }
  }, [render]);
  const [webviewXY, setWebviewXY] = React.useState({
    x: "800px",
    y: "480px",
  });

  return (
    <div
      className="relative bg-white p-2"
      style={{ width: "100%", overflowX: "auto" }}
    >
      {/* <CopyOutlined
        className="cursor-pointer"
        onClick={async () => {
          // await call("setClipboardText", [props.children]);
          // message.success("Copied to clipboard");
        }}
      /> */}

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
      {render == "markdown" ? renderMarkdown(markdown) : null}

      {render == "artifacts" ? (
        <div className="relative">
          {webviewError.current && (
            <Space>
              <Button
                size="small"
                onClick={() => {
                  onCallback && onCallback(webviewError.current);
                }}
                icon={<UploadOutlined />}
              >
                Sender
              </Button>
              <span className="text-red-400">Console Error: </span>
              <code>{webviewError.current}</code>
            </Space>
          )}
          <Space.Compact className="absolute right-0 top-0">
            {/* <Button
              size="small"
              onClick={async () => {
                let nativeImage = await webviewRef.current?.capturePage();
                let imageUrl = nativeImage.toDataURL();

                webviewRef.current.downloadURL(imageUrl);
                // const link = document.createElement("a");
                // link.href = imageUrl;
                // link.download = "capture.png";
                // document.body.appendChild(link);
                // link.click();
                // document.body.removeChild(link);
              }}
            >
              capturePage
            </Button> */}
            <Button
              size="small"
              onClick={() => {
                webviewRef.current?.openDevTools();
              }}
            >
              openDevTools
            </Button>
          </Space.Compact>

          <webview
            ref={(w) => {
              if (w) {
                webviewRef.current = w;
                w.addEventListener("console-message", (e: any) => {
                  // console.log("Guest page logged a message:", e.message);
                  if (e.level === 3) {
                    // error
                    webviewError.current =
                      webviewError.current + e.message + "\n";

                    refresh();
                  }
                });
                w.addEventListener("did-finish-load", async () => {
                  try {
                    await sleep(1000);
                    let res = await (w as any).executeJavaScript(
                      `var r;
var res
if(document.body){
    r = document.body.getBoundingClientRect();
} else {
    r = document.firstChild.getBoundingClientRect();
}
res ={ width: r.width, height: r.height };`,
                    );
                    // console.log(res);
                    setWebviewXY({
                      x: res.width + "px",
                      y: res.height + "px",
                    });
                  } catch (e) {
                    console.error("webview executeJavaScript fail: ", e);
                  }
                });
              }
            }}
            src={
              `data:${"text/html"};charset=utf-8;base64,` +
              textToBase64Unicode(artifacts)
            }
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
            // src="https://www.baidu.com"
            // className="w-3/5"
            style={{
              height: webviewXY.y,
              width: webviewXY.x,
            }}
          ></webview>
          {/* <iframe  image/svg+xml
            src={"data:text/html;base64," + textToBase64Unicode(artifacts)}
            // className="w-3/5"
            style={{
              height: "calc(60vh)",
              width: "calc(60vw)",
            }}
          ></iframe> */}
        </div>
      ) : null}

      {render == "text" ? (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {markdown}
        </pre>
      ) : null}
    </div>
  );
};

export const DownImage = ({ src, ...p }) => {
  return (
    <div className="relative">
      <img src={src} {...p} />
      <DownloadOutlined
        onClick={() => {
          const link = document.createElement("a");
          link.href = src;
          link.download = "image.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        className="absolute bottom-2 right-2 cursor-pointer text-lg hover:text-blue-500"
      />
    </div>
  );
};
