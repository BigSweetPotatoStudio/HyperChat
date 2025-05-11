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
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Result,
  Segmented,
  Select,
  Slider,
  Space,
  Spin,
  Splitter,
  Table,
  Tag,
  theme,
  Tooltip,
  Tree,
  Typography,
  Upload,
  Watermark,
} from "antd";
const antdMessage = message;
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import OpenAI from "openai";
import { v4 } from "uuid";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { io } from "socket.io-client";
import { getURL_PRE, msg_receive } from "../../common/call";
import "@xterm/xterm/css/xterm.css";
import _ from 'lodash';
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { z } from "zod";

function Pre(p) {
  return (
    <div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {p.children as string}
      </pre>
    </div>
  );
}

function urlToBase64(url: string) {
  return new Promise<string>((resolve, reject) => {
    // 创建图片对象
    const img = new Image();

    // 跨域支持
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      // 创建画布
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 设置画布大小
      canvas.width = (this as any).width;
      canvas.height = (this as any).height;

      // 绘制图片
      ctx.drawImage(this as any, 0, 0);

      // 转换为 Base64
      const base64 = canvas.toDataURL("image/png");
      // console.log(base64);
      resolve(base64);
    };

    img.onerror = function () {
      reject(new Error("图片加载失败"));
    };

    // 设置图片源
    img.src = url;
  });
}

function blobToBase64(blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string); // reader.result 包含 Base64 字符串
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.onabort = () => {
      reject(new Error("读取中断"));
    };

    reader.readAsDataURL(blob);
  });
}

import {
  AlipayCircleOutlined,
  AppstoreOutlined,
  BarsOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  GithubOutlined,
  LoadingOutlined,
  SmileOutlined,
  StopOutlined,
  UserOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  RedoOutlined,
  StarOutlined,
  SearchOutlined,
  DownOutlined,
  SyncOutlined,
  LinkOutlined,
  FileImageOutlined,
  ToolOutlined,
  CopyOutlined,
  SettingOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  StockOutlined,
  WechatWorkOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined,
  ClearOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckOutlined,
  DisconnectOutlined,
  ApiOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import {
  ChatHistory,
  GPT_MODELS,
  Agents,
  AppSetting,
  IMCPClient,
  electronData,
  HyperChatCompletionTool,
  Tool_Call,
  VarList,
} from "../../../../common/data";

import { PromptsModal } from "./promptsModal";
import {
  getTools,
  InitedClient,
} from "../../common/mcp";
import { EVENT } from "../../common/event";
import InfiniteScroll from "react-infinite-scroll-component";
import { call } from "../../common/call";
import { MyAttachR } from "./attachR";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";
import { QuickPath, SelectFile } from "../../common/selectFile";
import Clarity from "@microsoft/clarity";
import { ChatHistoryItem } from "../../../../common/data";
import { useForm } from "antd/es/form/Form";
import { currLang, t } from "../../i18n";
import { NumberStep } from "../../common/numberStep";
import { HeaderContext } from "../../common/context";
import dayjs from "dayjs";
import { sleep } from "../../common/sleep";
import { BetaSchemaForm, DrawerForm } from "@ant-design/pro-components";
import {
  JsonSchema2FormItem,
  JsonSchema2FormItemOrNull,
  JsonSchema2ProFormColumnsType,
} from "../../common/util";
import zodToJsonSchema from "zod-to-json-schema";
import { Icon } from "../../components/icon";
import { Messages } from "../../components/messages";
import { getFirstCharacter, getFirstEmoji } from "../../common";
import { Container, X } from "lucide-react";
import { setInterval } from "node:timers/promises";
import { getDefaultModelConfig, getDefaultModelConfigSync, rename } from "../../components/ai";
import { InputAI } from "../../components/input_ai";
import { MySender } from "../../components/my_sender";
import { disableCompletionItemProvider, Editor, enableCompletionItemProvider } from "../../components/editor";
import { Link } from "react-router-dom";


export const Chat = ({
  onTitleChange = undefined,
  sessionID = "",
  data: agentData = {
    uid: "",
    agentKey: "",
    message: "",
    onComplete: (text) => { },
    onError: (e) => { },
  },
  onlyView = {
    histroyKey: "",
  },
}) => {
  useEffect(() => {
    console.log("Chat")
  }, []);
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
  useEffect(() => {
    loadMoreData(false);
  }, [globalState]);

  const [modal, contextHolder] = Modal.useModal();
  let getAgentNameObj = useRef({} as Record<string, string>);
  let builtinAgent = useRef([{
    "key": "1",
    "label": "💧MCP Helper",
    "prompt": `# I am a super agent. According to the user's requirements, I first think and then design a tool flow, call various tools, and complete the recent addition of MCP
# MCP is a command, and the operation method is similar to npx, uvx, etc. The user is a novice, and I want to do more.
# To answer a user please use {{var.LANG}}

1. I can search + summarize the web page online, query the MCP running command line, and it is best to find the Gtihub web page to obtain command information.
2. Try to add stdio. If adding stdio type MCP fails, I can use the terminal to enter the command to test the error.
3. If an error is reported, use the terminal to help the user install the environment (such as nodejs or uv or python, etc.).
4. If the test is successful, call the tool to add mcp.`,
    "allowMCPs": [
      "hyper_tools",
      "hyper_terminal",
      "hyper_settings"
    ],
    "confirm_call_tool": false,
    "description": "This is an assistant for adding mcp. You can send the Github URL or installation URL to it, and it will automatically install stdio mcp for you.",
    "type": "builtin"
  }, {
    "key": "2",
    "label": "😎Task Demo",
    "prompt": "# 我是一个超级Agent，根据用户的要求，先设计一个工具流，调用各种工具，完成工具流\n* 当前操作系统是 {{var.os}}\n* 当前时间是  {{var.currentTime}} \n* 用户期待用 {{var.LANG}} 回复\n* 完成工作流后，最后把记忆写入memory.hyper变量，方便下次使用。\n\n这是你的记忆:\n   {{memory.hyper}}",
    "modelKey": "208f7893-aefe-4940-b309-17d63e3753ba",
    "allowMCPs": [
      "hyper_tools",
      "hyper_settings"
    ],
    "confirm_call_tool": false,
    "description": "这个可以使用网页的工作流，演示使用变量，实现记忆功能",
    "type": "builtin"
  }] as any);

  useEffect(() => {
    (async () => {
      try {
        DATA.current.loadingMessages = true;
        refresh();
        await Promise.all([
          Agents.init(),
          GPT_MODELS.init(),
          AppSetting.init(),
          ChatHistory.init(),
          electronData.init(),
          VarList.init(),
        ]);
        disableCompletionItemProvider();
        enableCompletionItemProvider();
        msg_receive("message-from-main", async (msg) => {
          if (msg.type == "update_var_list") {
            await VarList.init();
            disableCompletionItemProvider();
            enableCompletionItemProvider();
          }
        });


        Agents.get().data = builtinAgent.current.concat(Agents.get().data.filter(x => x.type != "builtin"));
        Agents.get().data.forEach((x) => {
          getAgentNameObj.current[x.key] = x.label;
        });
        // console.log("AppSetting", AppSetting.get().quicks);
        refresh();
        loadMoreData(false);

        if (agentData.agentKey) {
          try {
            // let agents = await GPTS.init();
            // let agent = agents.data.find((x) => x.label == data.agentKey);
            await onGPTSClick(agentData.agentKey);

            if (agentData.message) {
              await onRequest(agentData.message);
              // let relayMessage = openaiClient.current.getRelay(2);
              // console.log("Relay Message:", relayMessage);
              agentData.onComplete(openaiClient.current.lastMessage.content);
            }
          } catch (e) {
            console.error(" hyper_call_agent error: ", e);
            agentData.onError(e);
          }
        } else if (onlyView.histroyKey) {
          if (onlyView.histroyKey) {
            let item = ChatHistory.get().data.find(
              (x) => x.key === onlyView.histroyKey,
            );
            if (item) {
              // currentChatReset({
              //   ...item,
              //   messages: [],
              // });

              if (item.messages == null || item.messages.length == 0 || +item.version == 2) {

                let messages = await call("readJSON", [`messages/${item.key}.json`]).catch(() => []);
                item.messages = messages || [];
                if (item.messages.length == 0 && item.agentKey != null) {
                  let agent = Agents.get().data.find(x => x.key == item.agentKey);
                  if (agent) {
                    item.messages = [
                      {
                        role: "system" as const,
                        content: agent.prompt,
                        content_date: Date.now(), // Corrected to use Date.now() for current timestamp
                      },
                    ];
                  }
                }

              }
              currentChatReset(item);
            }
          }
        } else {
          if (AppSetting.get().defaultAllowMCPs == undefined) {
            // let clients = await getClients().catch(() => [] as InitedClient[]);
            AppSetting.get().defaultAllowMCPs = [];
          }

          currentChatReset(
            {
              allowMCPs: AppSetting.get().defaultAllowMCPs,
            },
            "",
          );
        }
      } finally {
        DATA.current.loadingMessages = false;
        refresh();
      }
    })();
  }, [onlyView.histroyKey]);

  const onGPTSClick = async (key: string, { loadHistory = true } = {}) => {
    let find = Agents.get().data.find((y) => y.key === key);
    selectGptsKey.current = find.key;
    historyFilterType.current = "all";
    await currentChatReset(
      {
        allowMCPs: find.allowMCPs,
        agentKey: find.key,
        modelKey: find.modelKey,
        attachedDialogueCount: find.attachedDialogueCount,
        temperature: find.temperature,
        confirm_call_tool: find.confirm_call_tool,
      },
      find.prompt,
    );
  };

  const openaiClient = useRef<OpenAiChannel>();

  // const clientsRef = useRef<InitedClient[]>([]);

  const promptsRef = useRef<InitedClient["prompts"]>([]);
  const resourcesRef = useRef<InitedClient["resources"]>([]);

  const [isOpenPromptsModal, setIsOpenPromptsModal] = useState(false);
  const [promptsModalValue, setPromptsModalValue] = useState({} as any);

  const [value, setValue] = React.useState("");

  const defaultChatValue: ChatHistoryItem = {
    label: "",
    key: "",
    messages: [],
    modelKey: undefined,
    agentKey: undefined,
    sended: false,
    requestType: "stream",
    allowMCPs: [],
    temperature: undefined,
    attachedDialogueCount: undefined,
    dateTime: Date.now(),
    isCalled: agentData.agentKey ? true : false,
    isTask: false,
    confirm_call_tool: true,
    icon: ""
  };

  const mobile = useRef({
    is: window.innerWidth < 1024,
  });

  const DATA = useRef({
    mcpLoading: false,
    showHistory: mobile.current.is ? false : onlyView.histroyKey ? false : true,
    suggestionShow: false,
    diffs: [] as Array<{
      messages: ChatHistoryItem["messages"];
      modelKey: string;
      openaiClient: OpenAiChannel;
      label: string;
    }>,
    loadingMessages: false,
    scrollBottom: true,
  });

  const currentChat = React.useRef<ChatHistoryItem>(defaultChatValue);
  const currentChatReset = async (
    newConfig: Partial<ChatHistoryItem>,
    prompt = "",
    // loadDefaultAllowMCPs = undefined,
  ) => {
    if (prompt) {
      newConfig.messages = [
        {
          role: "system" as const,
          content_template: prompt,
          content_date: Date.now(), // Corrected to use Date.now() for current timestamp
          content: "",
        },
      ];
    }
    currentChat.current = {
      ...defaultChatValue,
      ...newConfig,
    };
    for (let d of DATA.current.diffs) {
      d.messages = currentChat.current.messages.slice();
    }


    resourceResListRef.current = [];
    promptResList.current = [];
    // let clients = await getClients().catch(() => []);
    // clientsRef.current = clients;

    // clientsRef.current;
    // let p = getPrompts(currentChat.current.allowMCPs);
    // promptsRef.current = p;
    // let r = getResourses(currentChat.current.allowMCPs);
    // resourcesRef.current = r;

    refresh();
  };

  useEffect(() => {
    let set = new Set();
    for (let tool_name of currentChat.current.allowMCPs) {
      let [name, _] = tool_name.split(" > ");
      set.add(name);
    }

    let prompts: IMCPClient["prompts"] = [];

    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        prompts = prompts.concat(v.prompts);
      });
    promptsRef.current = prompts;

    let resources: IMCPClient["resources"] = [];

    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        resources = resources.concat(v.resources);
      });
    resourcesRef.current = resources;
    refresh();
  }, [mcpClients, currentChat.current.allowMCPs]);

  const selectGptsKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (currentChat.current.agentKey == null) {
      onTitleChange && onTitleChange();
    } else {
      let find = Agents.get().data.find(
        (x) => x.key == currentChat.current.agentKey,
      );
      if (find) {
        onTitleChange && onTitleChange(find.label);
      } else {
        onTitleChange && onTitleChange("");
      }
    }
  }, [currentChat.current.agentKey]);


  const [loading, setLoading] = useState(false);
  let cacheOBJ = useRef({} as Record<string, OpenAiChannel>);
  const onRequest = useCallback(async (message?: string) => {
    Clarity.event(`sender-${process.env.NODE_ENV}`);
    console.log("onRequest", message);
    let confirm_call_tool_cb = (tool: Tool_Call) => {
      return new Promise((resolve, reject) => {
        console.log("tool", tool);
        let m = modal.confirm({
          title: t`Comfirm Call Tool`,
          width: "90%",
          style: { maxWidth: 1024 },
          footer: [],
          content: (
            <div>
              <Form
                initialValues={tool.function.argumentsOBJ}
                name="control-hooks"
                onFinish={(e) => {
                  // console.log(e);
                  resolve(e);
                  m.destroy();
                }}
              >
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    padding: "8px 0",
                    textAlign: "center",
                  }}
                >
                  <span>Tool Name: </span>
                  <span className="text-purple-500">
                    {tool.restore_name || tool.function.name}
                  </span>
                </pre>
                {JsonSchema2FormItemOrNull(
                  getTools().find(
                    (x) => x.restore_name == tool.restore_name,
                  ).function.parameters,
                ) || t`No parameters`}
                <Form.Item>
                  <div className="flex flex-wrap justify-between">
                    <Button
                      onClick={() => {
                        m.destroy();
                        reject(new Error(t`User Cancel`));
                      }}
                    >{t`Cancel`}</Button>
                    <Space>
                      <Button
                        type="primary"
                        ghost
                        htmlType="submit"
                        onClick={() => {
                          currentChat.current.confirm_call_tool = false;
                          if (openaiClient.current) {
                            openaiClient.current.options.confirm_call_tool = false;
                          }
                        }}
                      >
                        {t`Allow this Chat`}
                      </Button>
                      <Button type="primary" htmlType="submit">
                        {t`Allow Once`}
                      </Button>
                    </Space>
                  </div>
                </Form.Item>
              </Form>
            </div>
          ),
        });
      });
    }

    let iOnRequest = async (index: number, modelKey, messages: MyMessage[], setOpenaiClient: (openaiClient) => void) => {
      let current = index == -1 ? true : false;
      let config = GPT_MODELS.get().data.find(
        (x) => x.key == modelKey,
      );
      if (config == null) {
        if (GPT_MODELS.get().data.length == 0) {
          EVENT.fire("setIsModelConfigOpenTrue");
          throw new Error("Please add LLM first");
        }
        config = await getDefaultModelConfig();
      }
      let openaiClient = (() => {
        let cacheKey = index;
        if (cacheOBJ.current[cacheKey]) {
          return cacheOBJ.current[cacheKey];
        }
        let res = new OpenAiChannel(
          {
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
          },
        );
        cacheOBJ.current[cacheKey] = res;
        return res;
      })();

      function getFirstUserContent() {
        let label = currentChat.current.label.toString();
        let firstUser = messages.find(
          (x) => x.content_attached != false && x.role == "user",
        );
        let firstUserContent = (firstUser as OpenAI.ChatCompletionUserMessageParam)?.content;
        if (typeof firstUserContent == "string") {
          label = firstUserContent;
        } else if (Array.isArray(firstUserContent)) {
          label = firstUserContent.find((x) => x.type == "text")?.text || "";
        } else {
          label = (firstUserContent as any).toString();
        }
        return label;
      }

      try {
        openaiClient.options = {
          ...config,

          requestType: currentChat.current.requestType,
          allowMCPs: currentChat.current.allowMCPs,
          temperature: currentChat.current.temperature,
          confirm_call_tool: currentChat.current.confirm_call_tool,
          confirm_call_tool_cb,
          messages_format_callback: async (message) => {
            if (message.role == "user" || message.role == "system") {
              if (!message.content_sended) {
                let varList = [...VarList.get().data?.map((v) => {
                  let varName = v.scope + "." + v.name;
                  return {
                    ...v,
                    varName: varName,
                  }
                })];
                async function renderTemplate(template: string) {
                  let reg = /{{(.*?)}}/g;
                  let matchs = template.match(reg);
                  let subResults = [];
                  for (let match of matchs || []) {
                    let varName = match.slice(2, -2).trim();
                    let v = varList.find((x) => x.varName == varName);
                    let value = varName;
                    if (v) {
                      if (v.variableType == "js") {
                        value = await call("runCode", [{ code: v.code }]);
                      } else if (v.variableType == "webjs") {
                        let code = `
                        (async () => {
                            ${v.code}
                           return await get()
                        })()
                        `;
                        // console.log(code);
                        value = await eval(code);
                      } else {
                        value = v.value;
                      }
                    }
                    subResults.push({ value, varName });
                  }
                  let result = template.replace(reg, (match, p1) => {
                    return subResults.find((x) => x.varName === p1.trim())?.value || match;
                  });
                  return result;
                }
                if (message.content_template) {
                  if (typeof message.content == "string") {
                    message.content = await renderTemplate(message.content_template);
                  }
                  else if (Array.isArray(message.content) && message.content.length >= 1) {
                    if (message.content[0].type == "text") {
                      message.content[0].text = await renderTemplate(message.content_template);
                    }
                  }

                }
                message.content_sended = true;
              }
            }
          },
        }
        setOpenaiClient(openaiClient);
        openaiClient.messages = messages;
        if (message) {
          openaiClient.addMessage(
            {
              role: "user",
              content: "",
              content_template: message,
              content_date: new Date().getTime(),
            },
            resourceResListRef.current,
            promptResList.current,
          );
        }

        if (current) {
          if (currentChat.current.sended == false) {


            currentChat.current = {
              ...currentChat.current,

              key: v4(),
              label: message.toString(),
              messages: openaiClient.messages,
              sended: true,
              dateTime: Date.now(),
            };

          } else {

            currentChat.current.label = getFirstUserContent();
            currentChat.current.dateTime = Date.now();

          }
        }
        refresh();


        await openaiClient.completion(() => {
          Object.assign(messages, openaiClient.messages);
          refresh();
        });
        currentChat.current.label = getFirstUserContent();

        resourceResListRef.current = [];
        promptResList.current = [];

        calcAttachDialogue(
          openaiClient.messages,
          currentChat.current.attachedDialogueCount,
          false,
        );

        Object.assign(messages, openaiClient.messages)
        refresh();



        if (current) {
          // currentChat.current.messages = messages;
          // refresh();

          await call("addChatHistory", [currentChat.current])
          let findIndex = ChatHistory.get().data.findIndex(
            (x) => x.key == currentChat.current.key,
          );
          if (findIndex > -1) {
            ChatHistory.get().data.splice(findIndex, 1)
          }
          ChatHistory.get().data.unshift(currentChat.current);
          loadMoreData(false);
        }


      } catch (e) {


        console.error(e);

        openaiClient.lastMessage.content_error = e.message;
        Object.assign(messages, openaiClient.messages)
        refresh();


        if (current) {
          // await ChatHistory.save();
          await call("addChatHistory", [currentChat.current])
          let findIndex = ChatHistory.get().data.findIndex(
            (x) => x.key == currentChat.current.key,
          );
          if (findIndex > -1) {
            ChatHistory.get().data.splice(findIndex, 1)
          }
          ChatHistory.get().data.unshift(currentChat.current);
          loadMoreData(false);
        }
        refresh();
        antdMessage.error(
          e.message || t`An error occurred, please try again later`,
        );
      }
    }
    try {
      setLoading(true);
      let alls = []
      for (let [index, diff] of DATA.current.diffs.entries()) {
        diff.messages = _.cloneDeep(currentChat.current.messages);
        let promise = iOnRequest(index, diff.modelKey, diff.messages, (openaiClient) => {
          diff.openaiClient = openaiClient;
        });
        alls.push(promise);
      }
      let promise = iOnRequest(-1, currentChat.current.modelKey, currentChat.current.messages, (c) => {
        openaiClient.current = c;
      });
      alls.push(promise);
      await Promise.allSettled(alls).then((res) => {
        if (res.every(x => x.status == "fulfilled")) {

        } else {
          console.log("all res has error", res);
        }
      });
    } catch (e) {

    } finally {
      setLoading(false);
    }
  }, []);

  const [isToolsShow, setIsToolsShow] = useState(false);

  const [loadMoreing, setLoadMoreing] = useState(false);
  const [conversations, setConversations] = useState<
    GetProp<ConversationsProps, "items">
  >([]);

  let loadIndex = useRef(0);

  const loadDataTatal = useRef(0);

  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");

  const historyFilterType = useRef<
    "all" | "star" | "search" | "agent" | "task"
  >("all");
  useEffect(() => {
    loadMoreData(false);
  }, [
    historyFilterType.current,
    historyFilterSearchValue,
    selectGptsKey.current,
  ]);


  const loadMoreData = useCallback(
    async (loadMore = true, loadIndexChange = true) => {
      refresh();
      return;
      // console.log(historyFilterType, historyFilterSearchValue, loadIndex.current);
      // console.log("loadMoreData: ", ChatHistory.get().data);
      if (ChatHistory.get().data.length == 0) {
        console.log("waiting ChatHistory init");
        return;
      }
      if (loadIndexChange) {
        if (loadMore) {
          loadIndex.current += 35;
        } else {
          loadIndex.current = 35;
        }
      }
      if (loadMoreing) {
        return;
      }
      setLoadMoreing(true);

      let formmatedData = ChatHistory.get()
        .data.filter((x) => {
          return (
            selectGptsKey.current == null ||
            x.agentKey == selectGptsKey.current ||
            x["gptsKey"] == selectGptsKey.current
          );
        })
        .filter((x) => {
          if (historyFilterType.current == "all") {
            return !x.isCalled && !x.isTask;
          } else if (historyFilterType.current == "agent") {
            return x.isCalled == true;
          } else if (historyFilterType.current == "task") {
            return x.isTask == true;
          } else if (historyFilterType.current == "star") {
            return x.icon == "⭐";
          } else {
            return (
              historyFilterSearchValue == "" ||
              x.label
                .toString()
                .toLowerCase()
                .includes(historyFilterSearchValue)
            );
          }
        });
      loadDataTatal.current = formmatedData.length;
      formmatedData = formmatedData.slice(0, loadIndex.current);
      setConversations(formmatedData);
      // console.log("loadMoreData", loadIndex.current, loadDataTatal.current);
      setLoadMoreing(false);
    },
    [historyFilterSearchValue],
  );

  // const [resourceResList, setResourceResList] = React.useState<
  //   Array<
  //     MCPTypes.ReadResourceResult & {
  //       call_name: string;
  //       uid: string;
  //     }
  //   >
  // >([]);
  const resourceResListRef = useRef<
    Array<
      MCPTypes.ReadResourceResult & {
        call_name: string;
        uid: string;
      }
    >
  >([]);

  const promptResList = useRef([]);

  const [isFillPromptModalOpen, setIsFillPromptModalOpen] =
    React.useState(false);
  const [isOpenMoreSetting, setIsOpenMoreSetting] = React.useState(false);

  const [formMoreSetting] = useForm();

  const [fillPromptFormItems, setFillPromptFormItems] = React.useState([]);
  const mcpCallPromptCurr = useRef({} as any);

  const sensors = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const [botSearchValue, setBotSearchValue] = useState("");

  // const [historyFilterSign, setHistoryFilterSign] = useState<number>(0);



  let currModel = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelConfigSync(GPT_MODELS)
  );

  let supportImage = currModel?.supportImage;

  let supportTool = currModel?.supportTool;

  let modelName = currModel?.name;
  // console.log("modelName", modelName);

  const onActiveChange = async (key) => {
    if (currentChat.current.key == key) {
      return;
    }
    let item = ChatHistory.get().data.find((x) => x.key == key);
    if (item) {
      // console.log("onActiveChange", item);
      if (mobile.current.is) {
        DATA.current.showHistory = false;
      }
      // currentChat.current.messages=[]
      // refresh();
      if (item.messages == null || item.messages.length == 0 || +item.version == 2) {
        try {
          DATA.current.loadingMessages = true;
          refresh();
          let messages = await call("readJSON", [`messages/${item.key}.json`]).catch(() => []);
          item.messages = messages || [];
          if (item.messages.length == 0 && item.agentKey != null) {
            let agent = Agents.get().data.find(x => x.key == item.agentKey);
            if (agent) {
              item.messages = [
                {
                  role: "system" as const,
                  content: agent.prompt,
                  content_date: Date.now(), // Corrected to use Date.now() for current timestamp
                },
              ];
            }
          }
        } finally {
          DATA.current.loadingMessages = false;
          refresh();
        }
      }
      await currentChatReset(item);
    }
  }

  const [tableHeight, setTableHeight] = useState(500);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleResize = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        setTableHeight(containerHeight - 50);
      }
    };

    // Initial calculation
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  let historyShowNode = (
    <div ref={tableContainerRef} className="h-full relative">
      <div className="mt-2 flex items-center justify-between">
        <Space>
          <span>{t`Chat Logs`}</span>
        </Space>
        <Segmented
          size="small"
          value={historyFilterType.current}
          onChange={(value) => {
            historyFilterType.current = value as any;
            refresh();
          }}
          options={[
            {
              title: t`All`,
              value: "all",
              icon: <CommentOutlined />,
            },
            {
              title: t`Star`,
              value: "star",
              icon: <StarOutlined />,
            },
            {
              title: t`Search`,
              value: "search",
              icon: <SearchOutlined />,
            },
            {
              title: t`Agent`,
              value: "agent",
              icon: <Icon name="bx-bot" />,
            },
            {
              title: t`Task`,
              value: "task",
              icon: <Icon name="task"></Icon>,
            },
          ]}
        />
      </div>
      <div>
        {historyFilterType.current == "search" && (
          <Input
            size="small"
            placeholder="search"
            value={historyFilterSearchValue}
            onChange={(e) => {
              setHistoryFilterSearchValue(e.target.value);
            }}
            allowClear
          ></Input>
        )}
      </div>
      <Table
        virtual
        bordered={false}
        scroll={{ x: 232, y: tableHeight }}
        pagination={false}
        size="small"
        showHeader={false}
        rowKey="key"
        rowHoverable={false}
        rowClassName={(x) => x.key == currentChat.current.key ? "rounded my-table-row bg-slate-200" : "rounded my-table-row hover:bg-slate-100"}
        columns={[{
          title: t`Chat Logs`,
          dataIndex: "label",
          key: "label",
          width: "100%",

          render: (text, x) => {
            let agentName = getAgentNameObj.current[x.agentKey || x["gptsKey"]] || "";
            let first = getFirstCharacter(agentName);
            return (<Popover placement="right" content={!mobile.current.is && <div style={{
              maxWidth: "calc(70vw)",
            }}>
              <div className="line-clamp-4 whitespace-pre">{text}</div>
              <div className="text-gray-400">{`${dayjs(x.dateTime).format("YYYY-MM-DD HH:mm:ss")}   `}<span className=" text-sky-400">{agentName}</span></div>
            </div>}>

              <div className="pt-2 pb-2 flex items-center cursor-pointer relative" onClick={() => {
                onActiveChange(x.key);
              }}>
                <>
                  {first && <span className="rounded bg-slate-300 inline-block text-center" style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}>{first}</span>}
                  {x.icon == "⭐" ? <StarOutlined /> : undefined}
                </>

                <div style={{ height: 22 }} className="ml-1 overflow-hidden">{x.label.toString()}</div>

                <Dropdown trigger={["click", "contextMenu"]} menu={{
                  onClick: async (menuInfo) => {
                    menuInfo.domEvent.stopPropagation();
                    let conversation = x;
                    // message.info(`Click ${conversation.key} - ${menuInfo.key}`);
                    if (menuInfo.key === "remove") {


                      await call("removeChatHistory", [{ key: conversation.key }]);
                      let index = ChatHistory.get().data.findIndex(
                        (x) => x.key === conversation.key,
                      );
                      ChatHistory.get().data.splice(index, 1);
                      loadMoreData(false, false);
                      refresh();
                      message.success(t`Delete Success`);
                    }
                    if (menuInfo.key === "star") {
                      let index = ChatHistory.get().data.findIndex(
                        (x) => x.key === conversation.key,
                      );
                      if (ChatHistory.get().data[index].icon == "⭐") {
                        ChatHistory.get().data[index].icon = "";
                      } else {
                        ChatHistory.get().data[index].icon = "⭐";
                      }
                      loadMoreData(false, false);
                      refresh();
                      await call("changeChatHistory", [ChatHistory.get().data[index]])

                    }
                    if (menuInfo.key === "rename") {
                      await onActiveChange(conversation.key);

                      setIsOpenMoreSetting(true);
                      formMoreSetting.resetFields();
                      formMoreSetting.setFieldsValue(currentChat.current);
                    }
                  },
                  items: [
                    {
                      label: t`Star`,
                      key: "star",
                      icon: <StarOutlined />,
                    },
                    {
                      label: t`Rename`,
                      key: "rename",
                      icon: <EditOutlined />,
                    },
                    {
                      label: t`Remove`,
                      key: "remove",
                      icon: <DeleteOutlined />,
                      danger: true,
                    },
                  ],

                }} placement="bottomRight">
                  <EllipsisOutlined onClick={(e) => {
                    e.stopPropagation();
                  }} className="hidden menus rounded text-center absolute right-0 bg-white text-sky-400"
                    style={{ top: "50%", transform: "translateY(-50%)", fontSize: 16 }} />
                </Dropdown>

              </div>

            </Popover>);
          },
        }]} dataSource={ChatHistory.get().data
          .filter((x) => {
            if (selectGptsKey.current == null || x.agentKey == selectGptsKey.current || x["gptsKey"] == selectGptsKey.current) {
              if (historyFilterType.current == "all") {
                return !x.isCalled && !x.isTask;
              } else if (historyFilterType.current == "agent") {
                return x.isCalled == true;
              } else if (historyFilterType.current == "task") {
                return x.isTask == true;
              } else if (historyFilterType.current == "star") {
                return x.icon == "⭐";
              } else {
                return (
                  historyFilterSearchValue == "" ||
                  x.label
                    .toString()
                    .toLowerCase()
                    .includes(historyFilterSearchValue)
                );
              }
            } else {
              return false;
            }
          })}></Table>
    </div>
  );

  const [callToolOpen, setCallToolOpen] = useState(false);
  const [callToolForm] = Form.useForm();
  const [currTool, setCurrTool] = useState({} as any);
  const [currToolResult, setCurrToolResult] = useState({
    data: null as any,
    error: null as any,
  });


  const { token } = theme.useToken();
  const editorRef = useRef<any>(null);


  return (
    <div key={sessionID} className="chat relative h-full">
      <div className="h-full rounded-lg bg-white">
        <XProvider>
          {mobile.current.is && (
            <>
              <Drawer
                placement="left"
                className="chat"
                onClose={(e) => {
                  DATA.current.showHistory = false;
                  refresh();
                }}
                footer={null}
                title={t`Chat Logs`}
                open={DATA.current.showHistory}
                getContainer={false}
              >
                {historyShowNode}
              </Drawer>
            </>
          )}

          <div className="flex h-full">
            {DATA.current.showHistory && (
              <>
                <div className="hidden h-full w-0 flex-none overflow-hidden pr-2 lg:block lg:w-60">
                  {historyShowNode}
                </div>
                <Divider type="vertical" className="hidden h-full lg:block" />
              </>
            )}
            <div style={{ alignSelf: "stretch", width: (mobile.current.is) ? "100%" : DATA.current.showHistory ? "calc(100% - 265px)" : "100%" }}>
              <Spin wrapperClassName="my-spin w-full h-full"

                spinning={DATA.current.loadingMessages} indicator={<LoadingOutlined spin />} tip={t`Loading...`}  >
                <div
                  className="h-full flex w-full flex-col justify-between"

                >
                  {
                    DATA.current.diffs.length == 0 ?
                      <div className="msg-container overflow-auto">
                        {(currentChat.current.messages == null ||
                          currentChat.current.messages?.length == 0) && (
                            <>
                              <Welcome
                                icon="👋"
                                title={t`Welcome`}
                                className="mb-4"
                                description={
                                  Agents.get().data.length > 0
                                    ? t`Choose a prompt from below, and let's start chatting`
                                    : t`Start chatting`
                                }
                              />
                              <Space>
                                <Input
                                  placeholder="search"
                                  value={botSearchValue}
                                  onChange={(e) => {
                                    setBotSearchValue(e.target.value);
                                  }}
                                  allowClear
                                ></Input>
                                <Button
                                  onClick={() => {
                                    setPromptsModalValue({
                                      confirm_call_tool: false,
                                    } as any);
                                    setIsOpenPromptsModal(true);
                                  }}
                                >
                                  {t`Add Agent`}
                                </Button>
                              </Space>

                              <div className="flex items-center">
                                <div className="flex flex-wrap">
                                  <DndContext
                                    sensors={botSearchValue != "" ? [] : [sensors]}
                                    onDragEnd={(e) => {
                                      try {
                                        let data = Agents.get().data;
                                        let oldIndex = data.findIndex(
                                          (x) => x.key == e.active.id,
                                        );

                                        let newIndex = data.findIndex(
                                          (x) => x.key == e.over.id,
                                        );

                                        let item = data[oldIndex];

                                        data.splice(oldIndex, 1);

                                        data.splice(newIndex, 0, item);

                                        Agents.save();
                                        refresh();
                                      } catch { }
                                    }}
                                  >
                                    <SortableContext
                                      items={(Agents.get()
                                        .data).filter(
                                          (x) =>
                                            botSearchValue == "" ||
                                            x.label
                                              .toLowerCase()
                                              .includes(botSearchValue),
                                        )
                                        .map((x) => x.key)}
                                    >
                                      {(Agents.get()
                                        .data).filter(
                                          (x) =>
                                            botSearchValue == "" ||
                                            x.label
                                              .toLowerCase()
                                              .includes(botSearchValue),
                                        )
                                        .map((item) => (
                                          <SortableItem
                                            key={item.key}
                                            id={item.key}
                                            item={item}
                                            onClick={(item) => {
                                              // console.log("onGPTSClick", item);
                                              onGPTSClick(item.key);
                                            }}
                                            onEdit={() => {
                                              let value = Agents.get().data.find(
                                                (y) => y.key === item.key,
                                              );
                                              setPromptsModalValue(value);
                                              setIsOpenPromptsModal(true);
                                            }}
                                            onRemove={() => {
                                              Modal.confirm({
                                                title: "Tip",
                                                maskClosable: true,
                                                content: "Are you sure to delete?",
                                                onOk: async () => {
                                                  let index = Agents.get().data.findIndex(
                                                    (y) => y.key === item.key,
                                                  );
                                                  Agents.get().data.splice(index, 1);
                                                  await Agents.save();
                                                  call("openMcpClient", ["hyper_agent"]);
                                                  refresh();
                                                },
                                                onCancel(...args) { },
                                              });
                                            }}
                                          />
                                        ))}
                                    </SortableContext>
                                  </DndContext>
                                </div>
                              </div>
                            </>
                          )}

                        <Messages messages={currentChat.current.messages} onSumbit={(messages) => {
                          currentChat.current.messages = messages;
                          refresh();
                          onRequest();
                        }} status={openaiClient.current?.status}
                          onClone={async (i) => {
                            let clone = _.cloneDeep(currentChat.current);
                            clone.key = v4();
                            clone.messages = clone.messages.slice(0, i + 1);
                            clone.icon = "";

                            await call("addChatHistory", [clone]);
                            ChatHistory.get().data.unshift(clone);

                            loadMoreData(false, false);
                          }}></Messages>
                      </div>
                      : <Splitter layout={window.innerHeight > window.innerWidth ? "vertical" : "horizontal"} className="msg-container overflow-auto">
                        <Splitter.Panel>
                          <div className="h-full">
                            {(currentChat.current.messages == null ||
                              currentChat.current.messages?.length == 0) && (
                                <>
                                  <Welcome
                                    icon="👋"
                                    title={t`Welcome`}
                                    className="mb-4"
                                    description={
                                      Agents.get().data.length > 0
                                        ? t`Choose a prompt from below, and let's start chatting`
                                        : t`Start chatting`
                                    }
                                  />
                                  <Space>
                                    <Input
                                      placeholder="search"
                                      value={botSearchValue}
                                      onChange={(e) => {
                                        setBotSearchValue(e.target.value);
                                      }}
                                      allowClear
                                    ></Input>
                                    <Button
                                      onClick={() => {
                                        setPromptsModalValue({
                                          confirm_call_tool: false,
                                        } as any);
                                        setIsOpenPromptsModal(true);
                                      }}
                                    >
                                      {t`Add Agent`}
                                    </Button>
                                  </Space>

                                  <div className="flex items-center">
                                    <div className="flex flex-wrap">
                                      <DndContext
                                        sensors={botSearchValue != "" ? [] : [sensors]}
                                        onDragEnd={(e) => {
                                          try {
                                            let data = Agents.get().data;
                                            let oldIndex = data.findIndex(
                                              (x) => x.key == e.active.id,
                                            );

                                            let newIndex = data.findIndex(
                                              (x) => x.key == e.over.id,
                                            );

                                            let item = data[oldIndex];

                                            data.splice(oldIndex, 1);

                                            data.splice(newIndex, 0, item);

                                            Agents.save();
                                            refresh();
                                          } catch { }
                                        }}
                                      >
                                        <SortableContext
                                          items={(Agents.get()
                                            .data).filter(
                                              (x) =>
                                                botSearchValue == "" ||
                                                x.label
                                                  .toLowerCase()
                                                  .includes(botSearchValue),
                                            )
                                            .map((x) => x.key)}
                                        >
                                          {(Agents.get()
                                            .data).filter(
                                              (x) =>
                                                botSearchValue == "" ||
                                                x.label
                                                  .toLowerCase()
                                                  .includes(botSearchValue),
                                            )
                                            .map((item) => (
                                              <SortableItem
                                                key={item.key}
                                                id={item.key}
                                                item={item}
                                                onClick={(item) => {
                                                  // console.log("onGPTSClick", item);
                                                  onGPTSClick(item.key);
                                                }}
                                                onEdit={() => {
                                                  let value = Agents.get().data.find(
                                                    (y) => y.key === item.key,
                                                  );
                                                  setPromptsModalValue(value);
                                                  setIsOpenPromptsModal(true);
                                                }}
                                                onRemove={() => {
                                                  Modal.confirm({
                                                    title: "Tip",
                                                    maskClosable: true,
                                                    content: "Are you sure to delete?",
                                                    onOk: async () => {
                                                      let index = Agents.get().data.findIndex(
                                                        (y) => y.key === item.key,
                                                      );
                                                      Agents.get().data.splice(index, 1);
                                                      await Agents.save();
                                                      call("openMcpClient", ["hyper_agent"]);
                                                      refresh();
                                                    },
                                                    onCancel(...args) { },
                                                  });
                                                }}
                                              />
                                            ))}
                                        </SortableContext>
                                      </DndContext>
                                    </div>
                                  </div>
                                </>
                              )}

                            <Messages messages={currentChat.current.messages} onSumbit={(messages) => {
                              currentChat.current.messages = messages;
                              refresh();
                              onRequest();
                            }} status={openaiClient.current?.status}
                              onClone={async (i) => {
                                let clone = _.cloneDeep(currentChat.current);
                                clone.key = v4();
                                clone.messages = clone.messages.slice(0, i + 1);
                                clone.icon = "";

                                await call("addChatHistory", [clone]);
                                ChatHistory.get().data.unshift(clone);

                                loadMoreData(false, false);
                              }}></Messages>
                          </div>


                        </Splitter.Panel>

                        {
                          DATA.current.diffs.map((x, i) => {
                            return <Splitter.Panel key={i} className="h-full"  >
                              <Watermark className="h-full  relative" content={x.label} font={{
                                color: "rgba(0,0,0,.25)",
                              }}>
                                <div className=" absolute top-0 right-0 cursor-pointer z-10 text-red-400" onClick={() => {
                                  DATA.current.diffs = DATA.current.diffs.filter((_, j) => j != i);
                                  refresh();
                                }}><CloseCircleOutlined /></div>
                                <Messages readOnly messages={x.messages} onSumbit={(messages) => {

                                }} status={x.openaiClient?.status}></Messages>
                              </Watermark>
                            </Splitter.Panel>;
                          })}
                      </Splitter>
                  }




                  <div className="my-footer flex-grow-0 pt-1">
                    <div className="my-op flex justify-between">
                      <div className="op-left">
                        <span>
                          <>
                            <span>
                              <Button
                                size="small"
                                onClick={() => {
                                  DATA.current.showHistory =
                                    !DATA.current.showHistory;
                                  refresh();
                                }}
                              >
                                {DATA.current.showHistory ? (
                                  <MenuFoldOutlined />
                                ) : (
                                  <MenuUnfoldOutlined />
                                )}
                              </Button>

                              <Divider type="vertical" />
                            </span>
                            {currentChat.current.agentKey && (
                              <>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    currentChatReset({
                                      messages: [],
                                      // 返回
                                      allowMCPs: AppSetting.get().defaultAllowMCPs,
                                      sended: false,
                                      agentKey: undefined,
                                    });
                                    selectGptsKey.current = undefined;
                                    loadMoreData(false);
                                  }}
                                >
                                  <LeftOutlined />
                                </Button>
                                <Divider type="vertical" />
                              </>
                            )}
                          </>
                        </span>
                        <Tooltip title={t`New Chat`}>
                          <PlusCircleOutlined
                            className="cursor-pointer hover:text-cyan-400"
                            onClick={() => {
                              if (currentChat.current.agentKey) {
                                let key =
                                  currentChat.current.agentKey ||
                                  currentChat.current["gptsKey"];
                                onGPTSClick(key);
                              } else {
                                currentChatReset({
                                  messages: [],
                                  allowMCPs: AppSetting.get().defaultAllowMCPs,
                                  sended: false,
                                  agentKey: undefined,
                                });
                                selectGptsKey.current = undefined;
                              }
                            }}
                          />
                        </Tooltip>
                        <Divider type="vertical" />
                        <Tooltip title={t`Clear Context`}>
                          <ClearOutlined
                            className="cursor-pointer hover:text-cyan-400"
                            onClick={() => {

                              calcAttachDialogue(
                                currentChat.current.messages,
                                0,
                                true,
                              );
                              refresh();

                            }}
                          />
                        </Tooltip>

                        <Divider type="vertical" />
                        <Tooltip title={t`Select LLM`}>
                          <span className="inline-block">
                            <Icon name="brain" />{" "}
                            <Select
                              size="small"
                              showSearch
                              optionFilterProp="label"
                              placeholder={
                                GPT_MODELS.get().data.length > 0
                                  ? getDefaultModelConfigSync(GPT_MODELS).name
                                  : "Please add a LLM model"
                              }
                              className="w-60"
                              allowClear
                              value={currentChat.current.modelKey}
                              onChange={(value) => {
                                currentChat.current.modelKey = value;
                                refresh();
                              }}
                              options={GPT_MODELS.get()
                                .data.filter(
                                  (x) => x.type == "llm" || x.type == null,
                                )
                                .map((x) => {
                                  return {
                                    label: x.name,
                                    value: x.key,
                                  };
                                })}
                            ></Select>
                          </span>
                        </Tooltip>
                        <Divider type="vertical" />
                        <Tooltip title={t`Select Request Type`}>
                          <span className="inline-block">
                            <span>type:</span>
                            <Dropdown
                              trigger={['click']}
                              arrow
                              menu={{
                                selectable: true,
                                selectedKeys: [currentChat.current.requestType],
                                items: [
                                  {
                                    label: "stream",
                                    key: "stream",
                                  },
                                  {
                                    label: "complete",
                                    key: "complete",
                                  },
                                ],
                                onClick: (e) => {
                                  currentChat.current.requestType = e.key as any;
                                  refresh();
                                },
                              }}
                            >
                              <Button size="small" type="link">
                                {currentChat.current.requestType}
                                <DownOutlined />
                              </Button>
                            </Dropdown>
                          </span>
                        </Tooltip>
                        <Divider type="vertical" />

                        <SettingOutlined
                          title={t`Settings`}
                          className="cursor-pointer hover:text-cyan-400"
                          onClick={() => {
                            setIsOpenMoreSetting(true);
                            formMoreSetting.resetFields();
                            // console.log(currentChat.current);
                            formMoreSetting.setFieldsValue(currentChat.current);
                          }}
                        />

                      </div>
                      <div className="flex">
                        <div>
                          {
                            electronData.get().isDeveloper && <Button size="small" title={t`Download Chat Config`} onClick={() => {
                              let a = document.createElement("a");
                              a.href = URL.createObjectURL(
                                new Blob([JSON.stringify(currentChat.current, null, 2)], { type: "text/json" }),
                              );
                              a.download = (currentChat.current.key || "none") + ".json";
                              a.click();
                            }}><DownloadOutlined /></Button>
                          }
                        </div>

                        <Divider type="vertical" />
                        <Link style={{ color: "inherit" }} title={t`edit variables`} to={"/Setting/VariableList"}> <Icon name="var" className="hover:text-cyan-400"></Icon></Link>
                        <Divider type="vertical" />
                        <Dropdown
                          trigger={['click']}
                          arrow
                          menu={{
                            selectable: true,
                            items: GPT_MODELS.get()
                              .data.filter(
                                (x) => x.type == "llm" || x.type == null,
                              )
                              .map((x) => {
                                return {
                                  label: <>{x.name}{DATA.current.diffs.find(y => y.modelKey == x.key) && <><CheckOutlined /></>}</>,
                                  value: x.key,
                                  key: x.key,
                                };
                              }),
                            onClick: (e) => {
                              if (!DATA.current.diffs.find(x => x.modelKey == e.key)) {
                                let name = GPT_MODELS.get().data.find((x) => x.key == e.key)?.name;
                                DATA.current.diffs.push({ modelKey: e.key, messages: currentChat.current.messages, openaiClient: undefined, label: name });
                                refresh();
                              } else {
                                DATA.current.diffs = DATA.current.diffs.filter(x => x.modelKey != e.key);
                                refresh();
                              }
                            },
                          }}
                        >
                          <Button size="small" title={t`Model Comparison in Chat`}>
                            <Icon name="duibi"></Icon>
                          </Button>
                        </Dropdown>
                      </div>
                    </div>
                    <MyAttachR
                      resourceResList={resourceResListRef.current}
                      resourceResListRemove={(x) => {
                        resourceResListRef.current =
                          resourceResListRef.current.filter((v) => v.uid != x.uid);
                        refresh();
                        message.success(t`Delete Success`);
                      }}
                      promptResList={promptResList.current}
                      promptResListRemove={(x) => {

                        promptResList.current = promptResList.current.filter((v) => v.uid != x.uid);
                        refresh();
                        message.success(t`Delete Success`);
                      }}
                    ></MyAttachR>

                    <div className="my-sender-container">
                      <Editor
                        onDragFile={async (file) => {

                          if (!file) {
                            return;
                          }
                          if (file.path) {
                            editorRef.current?.insertTextAtCursor(file.path);
                          } else {
                            if (file.type.includes("image")) {
                              let path = await blobToBase64(file);
                              resourceResListRef.current.push({
                                call_name: "UserUpload",
                                contents: [
                                  {
                                    path: path,
                                    blob: path,
                                    type: "image",
                                  },
                                ],
                                uid: v4(),
                              });
                              refresh();
                            } else {
                              message.warning(t`please uplaod image`);
                            }
                          }
                        }}

                        onParseFile={async (file) => {
                          if (!file) {
                            return;
                          }
                          // if (file.path) {
                          //   editorRef.current?.insertTextAtCursor(file.path);
                          // } else {
                            if (file.type.includes("image")) {
                              let path = await blobToBase64(file);
                              resourceResListRef.current.push({
                                call_name: "UserUpload",
                                contents: [
                                  {
                                    path: path,
                                    blob: path,
                                    type: "image",
                                  },
                                ],
                                uid: v4(),
                              });
                              refresh();
                            } else {
                              message.warning(t`please uplaod image`);
                            }
                          // }
                        }}
                        submitType="enter"
                        ref={editorRef}
                        style={{
                          border: "0px",
                          padding: "4px 0px 4px",
                        }} autoHeight rows={1} maxRows={10} value={value}
                        onChange={(nextVal) => {
                          setValue(nextVal);
                        }}
                        onSubmit={(s) => {
                          if (DATA.current.suggestionShow) {
                            return;
                          }
                          if (s == "") {
                            return;
                          }
                          onRequest(s);
                          setValue("");
                          editorRef.current?.setValue("");
                        }}
                        fontSize={16}
                        lineHeight={32}
                        placeholder={t`You can use variables by enter namespace, for example, enter var, or use @ to call other agents.`}
                      />

                      <Sender
                        className="my-sender"
                        footer={({ components }) => {
                          const { SendButton, LoadingButton, SpeechButton } = components;
                          return (
                            <Flex justify="space-between" align="center">
                              <Flex align="center">

                                {supportImage && (
                                  <>
                                    <Upload
                                      accept="image/*"
                                      fileList={[]}
                                      beforeUpload={async (file) => {
                                        if (file.type.includes("image")) {
                                          let path = await blobToBase64(file);
                                          resourceResListRef.current.push({
                                            call_name: "UserUpload",
                                            contents: [
                                              {
                                                path: path,
                                                blob: await urlToBase64(path),
                                                type: "image",
                                              },
                                            ],
                                            uid: v4(),
                                          });
                                          refresh();
                                        } else {
                                          message.warning(t`please uplaod image`);
                                        }
                                        return false;
                                      }}
                                    >
                                      <Button
                                        type="text"
                                        icon={<LinkOutlined />}
                                        onClick={() => { }}
                                      />
                                    </Upload>
                                    {/* <Divider type="vertical" /> */}
                                  </>)}

                                <Tooltip title={t`MCP and Tools`} placement="bottom">

                                  {supportTool == null || supportTool == true ? (
                                    <Space.Compact>
                                      <Button onClick={() => {
                                        setIsToolsShow(true);
                                      }} type="dashed" icon={<Icon name="mcp" ></Icon>}>


                                        {(() => {
                                          let set = new Set();
                                          for (let tool_name of currentChat.current.allowMCPs) {
                                            let [name, _] = tool_name.split(" > ");
                                            set.add(name);
                                          }

                                          let load = mcpClients.filter(
                                            (v) => v.status == "connected",
                                          ).length;
                                          let all = mcpClients.filter(x => x.status !== "disabled").length;
                                          let curr = mcpClients.filter((v) => {
                                            return v.status !== "disabled" && set.has(v.name);
                                          }).length;

                                          return DATA.current.mcpLoading ? (
                                            <>
                                              {`${curr} `}
                                              <SyncOutlined spin />
                                              {`(${load}/${all})`}
                                            </>
                                          ) : (
                                            curr
                                          );
                                        })()}
                                        <Icon name="chuizi-copy" ></Icon>{

                                          (() => {
                                            let tools: IMCPClient["tools"] = [];

                                            mcpClients.forEach((v) => {
                                              tools = tools.concat(
                                                v.tools.filter((t) => {

                                                  return (
                                                    currentChat.current.allowMCPs.includes(t.clientName) || currentChat.current.allowMCPs.includes(t.restore_name)
                                                  );
                                                }),
                                              );
                                            });

                                            // let set = new Set();
                                            // for (let tool_name of currentChat.current.allowMCPs) {
                                            //   let [name, _] = tool_name.split(" > ");
                                            //   set.add(name);
                                            // }

                                            // let curr = mcpClients.filter((v) => {
                                            //   return v.status !== "disabled" && set.has(v.name);
                                            // });
                                            // let toolLen = 0;
                                            // for (let x of curr) {
                                            //   toolLen += x.tools.length;
                                            // }
                                            return (
                                              <>
                                                {tools.length}
                                              </>
                                            )
                                          })()
                                        }
                                      </Button>

                                    </Space.Compact>
                                  ) : (
                                    <>  <Button
                                      size="small"
                                      type="text"
                                      icon={<Icon name="mcp"></Icon>}
                                      onClick={() => { }}
                                    >{t`LLM not support`}</Button>  </>
                                  )}

                                </Tooltip>
                                {/* <Divider type="vertical" /> */}
                                <Tooltip title={t`Resources`} placement="bottom">
                                  <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                      items: resourcesRef.current.map((x, i) => {
                                        return {
                                          key: x.key,
                                          label: !x.description
                                            ? x.key
                                            : `${x.key}--${x.description}`,
                                        };
                                      }),
                                      onClick: async (item) => {
                                        let resource = resourcesRef.current.find(
                                          (x) => x.key === item.key,
                                        );
                                        if (resource) {
                                          let res = await call("mcpCallResource", [
                                            resource.clientName as string,
                                            resource.uri,
                                          ]);
                                          let t = {
                                            ...res,
                                            call_name: resource.key + "--" + resource.uri,
                                            uid: v4(),
                                          };
                                          console.log("mcpCallResource", t);
                                          resourceResListRef.current.push(t);
                                          refresh();
                                        }
                                      },
                                    }}
                                    arrow
                                  >
                                    <Button size="small" type="default" className="cursor-pointer border-0">
                                      <Icon name="resources" />{" "}
                                      {resourcesRef.current.length}
                                    </Button>
                                  </Dropdown>
                                </Tooltip>

                                <Tooltip title={t`Prompts`} placement="bottom">
                                  <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                      items: promptsRef.current.map((x, i) => {
                                        return {
                                          key: x.key,
                                          label: `${x.key} (${x.description})`,
                                        };
                                      }),
                                      onClick: async (item) => {
                                        let prompt = promptsRef.current.find(
                                          (x) => x.key === item.key,
                                        );
                                        if (prompt) {
                                          if (
                                            prompt.arguments &&
                                            prompt.arguments.length > 0
                                          ) {
                                            setIsFillPromptModalOpen(true);
                                            setFillPromptFormItems(prompt.arguments);
                                            mcpCallPromptCurr.current = prompt;
                                          } else {
                                            let res = await call("mcpCallPrompt", [
                                              prompt.clientName as string,
                                              prompt.name,
                                              {},
                                            ]);
                                            console.log("mcpCallPrompt", res);
                                            res.call_name = prompt.key;
                                            res.uid = v4();
                                            promptResList.current.push(res);
                                            refresh();

                                          }
                                        }
                                      },
                                    }}
                                    arrow
                                  >
                                    <Button size="small" type="default" className="cursor-pointer border-0">
                                      <Icon name="prompts" />{" "}
                                      {promptsRef.current.length}
                                    </Button>
                                  </Dropdown>
                                </Tooltip>
                              </Flex>
                              <Flex align="center">
                                {/* <Button type="text" style={{
                                    fontSize: 18,
                                    color: token.colorText,
                                  }} icon={<ApiOutlined />} />

                                  <Divider type="vertical" /> */}
                                {loading ? (
                                  <LoadingButton type="default" />
                                ) : (
                                  <SendButton type="primary" disabled={false} />
                                )}
                              </Flex>
                            </Flex>
                          );
                        }}
                        actions={false}
                        loading={loading}
                        value={value}
                        onChange={(nextVal) => {
                          // if (nextVal === "/") {
                          //   onTrigger();
                          // } else if (!nextVal) {
                          //   onTrigger(false);
                          // }
                          setValue(nextVal);
                        }}
                        onCancel={() => {
                          setLoading(false);
                          openaiClient.current?.cancel();
                          for (let d of DATA.current.diffs) {
                            d.openaiClient?.cancel();
                          }
                          // message.success("Cancel sending!");
                        }}
                        onSubmit={(s) => {
                          if (DATA.current.suggestionShow) {
                            return;
                          }
                          onRequest(value);
                          setValue("");
                          editorRef.current?.setValue("");
                        }}
                        placeholder={t`Start inputting, You can use @ to call other agents, or quickly enter`}
                      />
                    </div>

                  </div>
                </div>
              </Spin>
            </div>
          </div>
        </XProvider>
        <PromptsModal
          open={isOpenPromptsModal}
          onCreate={async (value) => {
            if (value.key) {
              const index = Agents.get().data.findIndex(
                (y) => y.key == value.key,
              );
              if (index !== -1) {
                Agents.get().data[index] = value as any;
              }
            } else {
              Agents.get().data.push({
                ...value,
                key: v4(),
                allowMCPs: value.allowMCPs || [],
              });
            }
            await Agents.save();
            Agents.get().data.forEach((x) => {
              getAgentNameObj.current[x.key] = x.label;
            });
            // 修改更新agents状态
            call("openMcpClient", ["hyper_agent"]);
            refresh();
            setIsOpenPromptsModal(false);
          }}
          initialValues={promptsModalValue}
          onCancel={() => {
            setIsOpenPromptsModal(false);
          }}
        ></PromptsModal>
        <Modal
          width={1000}
          open={isToolsShow}
          onCancel={() => setIsToolsShow(false)}
          maskClosable
          title={t`MCP Tool`}
          // onOk={() => setIsToolsShow(false)}
          footer={[
            <Button
              key="2"
              onClick={async () => {
                AppSetting.get().defaultAllowMCPs =
                  currentChat.current.allowMCPs;
                await AppSetting.save();
                setIsToolsShow(false);
              }}
            >{t`Set Default`}</Button>,
            <Button
              key="1"
              type="primary"
              onClick={() => {
                setIsToolsShow(false);
              }}
            >
              {t`OK`}
            </Button>,
          ]}
        // cancelButtonProps={{ style: { display: "none" } }}
        >
          <Tree
            checkable
            selectedKeys={[]}
            onSelect={(selectedKeys, info) => {
              // console.log("onSelect", selectedKeys, info);
              let [clientName, _] = (selectedKeys[0] as string).split(" > ");
              if (info.node.isLeaf) {

                if (info.node.checked) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != selectedKeys[0]);
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != clientName);
                } else {
                  currentChat.current.allowMCPs.push(selectedKeys[0] as string);
                }
              } else {
                if (info.node.halfChecked || info.node.checked == false) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
                  currentChat.current.allowMCPs.push(info.node.key);
                  info.node.children.forEach((x) => {
                    currentChat.current.allowMCPs.push(x.key as string);
                  });
                } else {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
                }
              }

              refresh();
            }}
            onCheck={(checkedKeys) => {
              // console.log("onCheck", checkedKeys);
              currentChat.current.allowMCPs = checkedKeys as string[];
              refresh();
            }}
            checkedKeys={currentChat.current.allowMCPs}
            treeData={mcpClients.filter(x => x.status != "disabled").map((x) => {
              return {
                title: (<Tooltip title={x.servername}>
                  <span>
                    {x.name}{" "}{x.source == "claude" ? <Tag color="blue">{t`claude`}</Tag> : x.source == "builtin" ? <Tag color="blue">{t`built-in`}</Tag> : null}
                    {x.status == "connected" ? null : x.status ==
                      "connecting" ? (
                      <SyncOutlined spin className="m-1 text-blue-400" />
                    ) : (
                      x.source == "hyperchat" ? <Button
                        className="m-1"
                        size="small"
                        onClick={async () => {
                          x.status = "connecting";
                          refresh();
                          await call("openMcpClient", [x.name]);
                        }}
                      >{t`Reload`}</Button> : <DisconnectOutlined className="text-red-400" />
                    )}
                  </span></Tooltip>
                ),
                key: x.name,
                children: x.tools.map((tool) => {
                  return {
                    title: (
                      <Tooltip title={tool.function.description}>
                        <span
                        >
                          {tool.origin_name || tool.function.name}
                          <ApiOutlined onClick={(e) => {
                            e.stopPropagation();
                            setCurrTool(tool);
                            setCurrToolResult({
                              data: null,
                              error: null,
                            });
                            callToolForm.resetFields();
                            setCallToolOpen(true);
                          }} title={t`run`} className=" hover:text-cyan-400 ml-1" />
                        </span>
                      </Tooltip>
                    ),
                    key: tool.restore_name,
                    isLeaf: true,
                  };
                }),
              };
            })}
          />

        </Modal>

        <Modal
          title={t`Call Tool`}
          open={callToolOpen}
          footer={[]}
          onCancel={() => setCallToolOpen(false)}
          forceRender={true}
          width={"80%"}
          zIndex={2000}
        >
          <Form
            // layout="vertical"
            form={callToolForm}
            // labelCol={{ span: 6 }}
            // wrapperCol={{ span: 18 }}
            onFinish={async (values) => {
              console.log("onFinish", values);
              try {
                let call_res = await call("mcpCallTool", [
                  currTool.clientName,
                  currTool.origin_name,
                  values,
                ]);
                setCurrToolResult({
                  data: call_res,
                  error: null,
                });

                // console.log(call_res);
              } catch (e) {
                setCurrToolResult({
                  data: null,
                  error: e,
                });
              }
            }}
          >
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                padding: "8px 0",
                textAlign: "center",
              }}
            >
              <span>Tool Name: </span>
              <span className="text-purple-500">
                {currTool.restore_name || currTool?.function?.name}
              </span>
              <div><span>Tool description: </span>
                <span className="text-gray-400">{currTool?.function?.description}</span></div>
            </pre>
            {currTool.key
              ? JsonSchema2FormItemOrNull(
                currTool.function.parameters,
              ) || t`No parameters`
              : []}
            <Form.Item className="flex justify-end">
              <Button htmlType="submit">Submit</Button>
            </Form.Item>
          </Form>
          {currToolResult.data && (
            <div>
              <div>Result:</div>
              <div>{JSON.stringify(currToolResult.data)}</div>
            </div>
          )}
          {currToolResult.error && (
            <div>
              <div>Result:</div>
              <div>{currToolResult.error.toString()}</div>
            </div>
          )}
        </Modal>

        <Modal
          width={800}
          title={t`Fill Prompt Arguments`}
          open={isFillPromptModalOpen}
          okButtonProps={{ autoFocus: true, htmlType: "submit" }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsFillPromptModalOpen(false);
          }}
          modalRender={(dom) => (
            <Form
              name="FillPrompt"
              clearOnDestroy
              onFinish={async (values) => {
                let prompt = mcpCallPromptCurr.current;
                let res = await call("mcpCallPrompt", [
                  prompt.clientName as string,
                  prompt.name,
                  values,
                ]);
                console.log("mcpCallPrompt", res);
                res.call_name = prompt.key;
                res.uid = v4();
                promptResList.current.push(res);
                refresh();
                setIsFillPromptModalOpen(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
          {fillPromptFormItems.map((x) => {
            return (
              <Form.Item
                key={x.name}
                name={x.name}
                label={x.name}
                rules={[{ required: x.required, message: "Please enter" }]}
              >
                <Input placeholder={x.description}></Input>
              </Form.Item>
            );
          })}
        </Modal>
        <Modal
          width={800}
          title={t`More Setting`}
          open={isOpenMoreSetting}
          okButtonProps={{ autoFocus: true, htmlType: "submit" }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsOpenMoreSetting(false);
          }}
          modalRender={(dom) => (
            <Form
              name="MoreSetting"
              form={formMoreSetting}
              clearOnDestroy
              onFinish={async (values) => {
                currentChat.current.attachedDialogueCount =
                  values.attachedDialogueCount;
                currentChat.current.temperature = values.temperature;

                calcAttachDialogue(
                  currentChat.current.messages,
                  currentChat.current.attachedDialogueCount,
                );

                currentChat.current.confirm_call_tool =
                  values.confirm_call_tool;
                let item = ChatHistory.get().data.find(
                  (x) => x.key === currentChat.current.key,
                );
                if (item) {
                  item.label = values.label;
                  currentChat.current.label = values.label;
                  await call("changeChatHistory", [currentChat.current]);
                  loadMoreData();
                }
                refresh();
                setIsOpenMoreSetting(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
          <Form.Item
            name="label"
            label={t`Name`}
          >
            <InputAI aiGen={async () => {
              let res = await rename([{
                role: "user" as const,
                content: `${currLang === "zhCN" ? "请使用中文" : ""}
${currentChat.current.messages.filter(x => x.role != "tool").map(x => {
                  return `` + x.role + `: ` + x.content;
                }).join("\n")}`
              }]);
              return res;
            }} />
          </Form.Item>
          <Form.Item
            name="temperature"
            label={t`temperature`}
            tooltip={t`What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.`}
          >
            <NumberStep defaultValue={1} min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item
            name="attachedDialogueCount"
            label={t`attachedDialogueCount`}
            tooltip={t`Number of sent Dialogue Message attached per request`}
          >
            <NumberStep defaultValue={10} max={20} />
          </Form.Item>
          <Form.Item
            name="confirm_call_tool"
            label={t`callToolType`}
            tooltip={t`Do you want to confirm calling the tool?`}
          >
            <Radio.Group>
              <Radio value={true}>{t`Need Confirm`}</Radio>
              <Radio value={false}>{t`Direct Call`}</Radio>
            </Radio.Group>
          </Form.Item>
        </Modal>

        {contextHolder}


      </div>
    </div>
  );
};

const calcAttachDialogue = (
  messages,
  attachedDialogueCount,
  overwrite = true,
) => {
  if (attachedDialogueCount == null) {
    attachedDialogueCount = 10;
  }
  let c = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    let m = messages[i];
    if (m.role == "system") {
      m.content_attached = true;
      continue;
    }

    if (overwrite) {
      m.content_attached = c < attachedDialogueCount;
    } else {
      if (m.content_attached == false && c < attachedDialogueCount) {
      } else {
        m.content_attached = c < attachedDialogueCount;
      }
    }

    if (m.role == "user") {
      c++;
    }
  }
};
