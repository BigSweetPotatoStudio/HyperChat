"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/workspace/chatspace.tsx":
/*!*******************************************!*\
  !*** ./src/pages/workspace/chatspace.tsx ***!
  \*******************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChatSpace: () => (/* binding */ ChatSpace)
/* harmony export */ });
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/list/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/splitter/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tabs/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/badge/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../chat */ "./src/pages/chat/index.tsx");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/call */ "./src/common/call.ts");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _sessions__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./sessions */ "./src/pages/workspace/sessions.tsx");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/ClockCircleOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/LaptopOutlined.js");
/* harmony import */ var _common_event__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common/event */ "./src/common/event.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chat__WEBPACK_IMPORTED_MODULE_1__, _common_call__WEBPACK_IMPORTED_MODULE_2__]);
([_chat__WEBPACK_IMPORTED_MODULE_1__, _common_call__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);









function ChatPage({ sessionID = "", type = undefined, onChange = undefined, hyperChatData = {
    uid: "",
    agentKey: "",
    message: "",
    onComplete: (text) => undefined,
    onError: (e) => { },
}, }) {
    const [curr, setCurr] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        title: "",
        type: type,
        url: "",
    });
    const data = [
        {
            title: "HyperChat",
            type: "hyperchat",
            url: "",
        },
        {
            title: "Gemini",
            type: "gemini",
            url: "https://gemini.google.com/",
        },
        {
            title: "AIStudio-Google",
            type: "aistudio",
            url: "https://aistudio.google.com/prompts/new_chat",
        },
        {
            title: "DeepSeek",
            type: "deepseek",
            url: "https://chat.deepseek.com/",
        },
        {
            title: "Qianwen",
            type: "qianwen",
            url: "https://chat.qwenlm.ai/",
        },
        {
            title: "Qianwen-chinese",
            type: "qianwen-chinese",
            url: "https://tongyi.aliyun.com/qianwen/",
        },
    ];
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "h-full", key: sessionID }, curr.type == undefined ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex h-full w-full flex-col items-center justify-center" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { header: react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                "Please select Chat.",
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    "If you want to log in to Google, You need to click here to log in.",
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { type: "link", onClick: () => {
                            (0,_common_call__WEBPACK_IMPORTED_MODULE_2__.call)("openBrowser", [
                                "https://www.google.com/",
                                "Chrome",
                            ]);
                        } }, "login Google"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "(Because the browser that comes with Electron is Chromium, it may be considered not secure enough. )"))), bordered: true, dataSource: data, renderItem: (item) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"].Item, null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { type: "link", onClick: () => {
                        setCurr(item);
                        onChange && onChange(item);
                    } }, item.title))) }))) : curr.type == "hyperchat" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_chat__WEBPACK_IMPORTED_MODULE_1__.Chat, { sessionID: sessionID, data: hyperChatData, onTitleChange: (t) => {
            onChange &&
                onChange({
                    title: t == undefined ? "HyperChat" : react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                        `HyperChat`,
                        " ",
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "text-sky-400" }, t)),
                });
        } })) : curr.url ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("webview", { className: "webview h-full w-full", 
        // useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        src: curr.url, allowpopups: "true", partition: "persist:webview" })) : ("not support")));
}
function ChatSpace() {
    const [num, setNum] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    function refresh() {
        setNum((num) => num + 1);
    }
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (0,_common_call__WEBPACK_IMPORTED_MODULE_2__.msg_receive)("message-from-main", async (msg) => {
            if (msg.type == "call_agent") {
                let { agent_name, message, uid } = msg.data;
                let agents = await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.Agents.init();
                let agent = agents.data.find((x) => x.label == agent_name);
                if (agent == null) {
                    throw new Error(`Agent ${agent_name} not found`);
                }
                let n = {
                    key: (0,uuid__WEBPACK_IMPORTED_MODULE_8__["default"])(),
                    label: "New Tab",
                    closeIcon: false,
                    children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ChatPage, { type: "hyperchat", onChange: (item) => {
                            n.label = item.title;
                            refresh();
                        }, sessionID: uid, hyperChatData: {
                            agentKey: agent.key,
                            message,
                            uid,
                            onComplete: (text) => {
                                setActiveKey(activeKey);
                                (0,_common_call__WEBPACK_IMPORTED_MODULE_2__.call)("call_agent_res", [uid, text, undefined]);
                                setItems((items) => items.filter((item) => item.key !== n.key));
                            },
                            onError: (e) => {
                                setActiveKey(activeKey);
                                (0,_common_call__WEBPACK_IMPORTED_MODULE_2__.call)("call_agent_res", [uid, "", e.message]);
                                setItems((items) => items.filter((item) => item.key !== n.key));
                            },
                        } })),
                };
                setItems([...items, n]);
                setActiveKey(n.key);
            }
        });
    }, []);
    const [items, setItems] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([
        {
            key: "1",
            label: "HyperChat",
            closable: false,
            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ChatPage, { sessionID: (0,uuid__WEBPACK_IMPORTED_MODULE_8__["default"])(), type: "hyperchat", onChange: (item) => {
                    items[0].label = item.title;
                    refresh();
                } })),
        },
    ]);
    const [activeKey, setActiveKey] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("1");
    const [open, setOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [disabled, setDisabled] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
    const [bounds, setBounds] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    const draggleRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    const showModal = () => {
        setOpen(true);
    };
    const handleOk = (e) => {
        console.log(e);
        setOpen(false);
    };
    const handleCancel = (e) => {
        console.log(e);
        setOpen(false);
    };
    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };
    const [sessionCount, setSessionCount] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        if (sessionCount == 0) {
            setOpen(false);
        }
    }, [sessionCount]);
    const [sizes, setSizes] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(["100%", 0]);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "myworkspace flex h-full flex-col" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { onResize: (sizes) => {
                setSizes(sizes);
                _common_event__WEBPACK_IMPORTED_MODULE_5__.EVENT.fire("chatspace-resize", sizes);
            } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"].Panel, { size: sizes[0], style: { overflow: "hidden" } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { className: "h-full", tabPosition: "bottom", type: "editable-card", activeKey: activeKey, centered: true, items: items, onChange: (e) => {
                        setActiveKey(e);
                    }, onEdit: (targetKey, action) => {
                        if (action === "add") {
                            let n = {
                                key: (0,uuid__WEBPACK_IMPORTED_MODULE_8__["default"])(),
                                label: "New Tab",
                                children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ChatPage, { onChange: (item) => {
                                        n.label = item.title;
                                        refresh();
                                    } })),
                            };
                            setItems([...items, n]);
                            setActiveKey(n.key);
                        }
                        else {
                            setItems(items.filter((item) => item.key !== targetKey));
                            let find = items.findIndex((item) => item.key == targetKey);
                            if (find == -1)
                                return;
                            setActiveKey(items[find - 1]?.key);
                        }
                    } })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"].Panel, { size: sizes[1], min: "20%", max: "70%" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_sessions__WEBPACK_IMPORTED_MODULE_4__.Sessions, { setSessionCount: setSessionCount }))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { position: "fixed", bottom: 0, right: 0, margin: 15 } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { count: sessionCount ? react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], { style: { color: '#f5222d' } }) : 0, className: "cursor-pointer", onClick: () => {
                    if (sizes[1] == 0) {
                        setSizes(["60%", "40%"]);
                        _common_event__WEBPACK_IMPORTED_MODULE_5__.EVENT.fire("chatspace-resize", sizes);
                    }
                    else {
                        setSizes(["100%", 0]);
                    }
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_13__["default"], null)))));
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/tailwind.css":
/*!**************************!*\
  !*** ./src/tailwind.css ***!
  \**************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin

    if(true) {
      (function() {
        var localsJsonString = undefined;
        // 1750832765668
        var cssReload = __webpack_require__(/*! ../node_modules/mini-css-extract-plugin/dist/hmr/hotModuleReplacement.js */ "./node_modules/mini-css-extract-plugin/dist/hmr/hotModuleReplacement.js")(module.id, {});
        // only invalidate when locals change
        if (
          module.hot.data &&
          module.hot.data.value &&
          module.hot.data.value !== localsJsonString
        ) {
          module.hot.invalidate();
        } else {
          module.hot.accept();
        }
        module.hot.dispose(function(data) {
          data.value = localsJsonString;
          cssReload();
        });
      })();
    }
  

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("a73a56019190c21af57b")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.a22606eea64bb6ada7bb.hot-update.js.map