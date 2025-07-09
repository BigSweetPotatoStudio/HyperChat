import { v4 } from "uuid";
import { Data } from "../base/data.mjs";
import type { ChatHistoryItem, AgentConfig, Var, VarScope } from "../../shared/types.mjs";

export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<ChatHistoryItem>,
}, {
  sync: true,
});

export const Agents = new Data("agents.json", {
  data: [] as Array<AgentConfig>,
});

export const VarList = new Data(
  "var.json",
  {
    data: [{
      "key": "4c80381e-88fa-4010-a5c7-03420bbe7d11",
      "name": "currentTime",
      "variableType": "js",
      "code": "function get(){\n    return new Date().toLocaleString('zh-CN', {\n  year: 'numeric',\n  month: '2-digit',\n  day: '2-digit',\n  hour: '2-digit',\n  minute: '2-digit',\n  second: '2-digit',\n  hour12: false\n});\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current time",
    },
    {
      "key": "4c80381e-88fa-4010-a5c7-03420bbe7d14",
      "name": "currentTimeFromServer",
      "variableType": "webjs",
      "code": "function get(){\n    return new Date().toLocaleString('zh-CN', {\n  year: 'numeric',\n  month: '2-digit',\n  day: '2-digit',\n  hour: '2-digit',\n  minute: '2-digit',\n  second: '2-digit',\n  hour12: false\n});\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current time",
    },
    {
      "key": "e7517b77-14cd-40ed-b25a-1fe0c328be1e",
      "name": "LANG",
      "variableType": "webjs",
      "code": "function get(){\nlet currLang = navigator.language == \"zh-CN\" ? \"zhCN\" : \"enUS\";\nif (localStorage.getItem(\"currLang\")) {\n  currLang = localStorage.getItem(\"currLang\");\n}\nreturn currLang == \"zhCN\" ? \"中文\" : \"English\";\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current language",
    },
    {
      "key": "6c9f704e-69ab-47b6-b10f-ae9927801ee8",
      "name": "Clipboard",
      "variableType": "webjs",
      "code": "async function get(){\n    return await window.navigator.clipboard.readText();\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the clipboard contents",
    },
    {
      "key": "88970a9a-d328-422a-bedc-617c0caf635c",
      "name": "os",
      "variableType": "js",
      "code": "const os = require('os');\n/**\n * 获取系统名称\n * @returns {string} 系统名称的描述字符串\n */\nfunction get() {\n    const platform = os.platform();\n    let systemDescription = '';\n\n    switch (platform) {\n        case 'win32':\n            systemDescription = 'Windows';\n            break;\n        case 'darwin':\n            systemDescription = 'macOS';\n            break;\n        case 'linux':\n            systemDescription = 'Linux';\n            break;\n        default:\n            systemDescription = 'Unknown system';\n    }\n    return systemDescription;\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the system name",
    },] as Array<Var>,
  },
  {
    sync: true,
  }
);

export const VarScopeList = new Data(
  "var_scope.json",
  {
    data: [{
      name: "var",
      key: v4(),
      type: "custom",
    }, {
      name: "quick",
      key: v4(),
      type: "custom",
    }] as Array<VarScope>,
  },
  {
    sync: true,
  }
);