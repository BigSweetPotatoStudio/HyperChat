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
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/list/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/splitter/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tabs/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/badge/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _chat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../chat */ "./src/pages/chat/index.tsx");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _sessions__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./sessions */ "./src/pages/workspace/sessions.tsx");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/ClockCircleOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/LaptopOutlined.js");
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/event'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chat__WEBPACK_IMPORTED_MODULE_1__]);
_chat__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];









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
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"], { header: react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                "Please select Chat.",
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    "If you want to log in to Google, You need to click here to log in.",
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { type: "link", onClick: () => {
                            Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("openBrowser", [
                                "https://www.google.com/",
                                "Chrome",
                            ]);
                        } }, "login Google"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "(Because the browser that comes with Electron is Chromium, it may be considered not secure enough. )"))), bordered: true, dataSource: data, renderItem: (item) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { type: "link", onClick: () => {
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
        Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("message-from-main", async (msg) => {
            if (msg.type == "call_agent") {
                let { agent_name, message, uid } = msg.data;
                let agents = await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.Agents.init();
                let agent = agents.data.find((x) => x.label == agent_name);
                if (agent == null) {
                    throw new Error(`Agent ${agent_name} not found`);
                }
                let n = {
                    key: (0,uuid__WEBPACK_IMPORTED_MODULE_7__["default"])(),
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
                                Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("call_agent_res", [uid, text, undefined]);
                                setItems((items) => items.filter((item) => item.key !== n.key));
                            },
                            onError: (e) => {
                                setActiveKey(activeKey);
                                Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("call_agent_res", [uid, "", e.message]);
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
            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ChatPage, { sessionID: (0,uuid__WEBPACK_IMPORTED_MODULE_7__["default"])(), type: "hyperchat", onChange: (item) => {
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
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { onResize: (sizes) => {
                setSizes(sizes);
                Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/event'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).fire("chatspace-resize", sizes);
            } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Panel, { size: sizes[0], style: { overflow: "hidden" } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { className: "h-full", tabPosition: "bottom", type: "editable-card", activeKey: activeKey, centered: true, items: items, onChange: (e) => {
                        setActiveKey(e);
                    }, onEdit: (targetKey, action) => {
                        if (action === "add") {
                            let n = {
                                key: (0,uuid__WEBPACK_IMPORTED_MODULE_7__["default"])(),
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
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Panel, { size: sizes[1], min: "20%", max: "70%" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_sessions__WEBPACK_IMPORTED_MODULE_4__.Sessions, { setSessionCount: setSessionCount }))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { position: "fixed", bottom: 0, right: 0, margin: 15 } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { count: sessionCount ? react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_11__["default"], { style: { color: '#f5222d' } }) : 0, className: "cursor-pointer", onClick: () => {
                    if (sizes[1] == 0) {
                        setSizes(["60%", "40%"]);
                        Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/event'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).fire("chatspace-resize", sizes);
                    }
                    else {
                        setSizes(["100%", 0]);
                    }
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], null)))));
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/pages/workspace/sessions.tsx":
/*!******************************************!*\
  !*** ./src/pages/workspace/sessions.tsx ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Sessions: () => (/* binding */ Sessions)
/* harmony export */ });
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tabs/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/dropdown/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var socket_io_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! socket.io-client */ "./node_modules/socket.io-client/build/esm/index.js");
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* harmony import */ var _xterm_xterm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @xterm/xterm */ "./node_modules/@xterm/xterm/lib/xterm.js");
/* harmony import */ var _xterm_xterm__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_xterm_xterm__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _xterm_addon_fit__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @xterm/addon-fit */ "./node_modules/@xterm/addon-fit/lib/addon-fit.js");
/* harmony import */ var _xterm_addon_fit__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_xterm_addon_fit__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _xterm_addon_web_links__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @xterm/addon-web-links */ "./node_modules/@xterm/addon-web-links/lib/addon-web-links.js");
/* harmony import */ var _xterm_addon_web_links__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_xterm_addon_web_links__WEBPACK_IMPORTED_MODULE_5__);
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/sleep'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/CopyOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/SnippetsOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/ClearOutlined.js");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var _xterm_addon_clipboard__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @xterm/addon-clipboard */ "./node_modules/@xterm/addon-clipboard/lib/addon-clipboard.js");
/* harmony import */ var _xterm_addon_clipboard__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_xterm_addon_clipboard__WEBPACK_IMPORTED_MODULE_7__);











let URL_PRE = Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();
let lastSizes = {};
const socket = (0,socket_io_client__WEBPACK_IMPORTED_MODULE_1__.io)(URL_PRE + "terminal-message");
socket.on("connect", () => {
    console.log("terminal-message-connected");
});
function Sessions({ setSessionCount = undefined }) {
    //   const [activeKey, setActiveKey] = useState("1");
    const [num, setNum] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    function refresh() {
        setNum((num) => num + 1);
    }
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            // await call("OpenTerminal", []);
        })();
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        async function OpenTerminal(terminalID) {
            console.log("Received message:", terminalID);
            let sssion = {
                type: "terminal",
                id: terminalID,
                context: {},
            };
            data.current.sessions.push(sssion);
            data.current.activeKey = terminalID;
            refresh();
            await Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/sleep'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(500);
            const terminalRef = document.getElementById("terminal-" + terminalID);
            if (!terminalRef) {
                console.error("Terminal element not found");
                return;
            }
            const xterm = new _xterm_xterm__WEBPACK_IMPORTED_MODULE_3__.Terminal({
                cols: 80,
                rows: 30,
                cursorBlink: true,
                fontSize: 12,
                // fontFamily: ,
            });
            xterm.attachCustomKeyEventHandler((event) => {
                // xterm.
                return true; // Allow other keys to propagate
            });
            const fitAddon = new _xterm_addon_fit__WEBPACK_IMPORTED_MODULE_4__.FitAddon();
            xterm.loadAddon(fitAddon);
            xterm.loadAddon(new _xterm_addon_web_links__WEBPACK_IMPORTED_MODULE_5__.WebLinksAddon());
            const clipboardAddon = new _xterm_addon_clipboard__WEBPACK_IMPORTED_MODULE_7__.ClipboardAddon();
            xterm.loadAddon(clipboardAddon);
            xterm.open(terminalRef);
            await Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/sleep'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(500);
            xterm.onResize((size) => {
                console.log("Resized to: ", terminalID, size.cols, size.rows);
                lastSizes = size;
                socket.emit("terminal-receive", {
                    terminalID: terminalID,
                    type: "resize",
                    data: size,
                });
            });
            fitAddon.fit();
            // window.onresize = () => {
            //   setTimeout(() => {
            //     fitAddon.fit();
            //   }, 1000);
            // };
            // EVENT.on("chatspace-resize", () => {
            //   setTimeout(() => {
            //     fitAddon.fit();
            //   }, 1000);
            // });
            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    // console.log(entry.contentRect.width, entry.contentRect.height)
                    setTimeout(() => {
                        fitAddon.fit();
                    }, 1000);
                }
            });
            resizeObserver.observe(terminalRef);
            xterm.onData(function (data) {
                // console.log("xterm onData: ", data);
                socket.emit("terminal-receive", {
                    terminalID: terminalID,
                    data: data,
                });
            });
            sssion.context.xterm = xterm;
            sssion.context.fitAddon = fitAddon;
            sssion.context.xtermdata = "";
        }
        socket.on("open-terminal", (m) => {
            OpenTerminal(m.terminalID);
        });
        let sessionObj = {};
        socket.on("terminal-send", async (m) => {
            if (m.type == "execute-status-change") {
                if (m.data.status == 1) {
                    setSessionCount(1);
                }
                else {
                    setSessionCount(0);
                }
                return;
            }
            // console.log("terminal-send: ", m.data);
            let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
            if (sessionObj[m.terminalID] == undefined) {
                sessionObj[m.terminalID] = {
                    xtermdata: "",
                    timer: 0
                };
            }
            sessionObj[m.terminalID].xtermdata += m.data;
            clearTimeout(sessionObj[m.terminalID].timer);
            if (sssion && sssion.context.xterm) {
            }
            else {
                sessionObj[m.terminalID].timer = setTimeout(() => {
                    // console.log("terminal-send2: ", sessionObj[m.terminalID].xtermdata);
                    if (sssion && sssion.context.xterm) {
                        sssion.context.xterm.write(sessionObj[m.terminalID].xtermdata);
                        sessionObj[m.terminalID].xtermdata = "";
                    }
                }, 1000);
                return;
            }
            // console.log("terminal-send2: ", sessionObj[m.terminalID].xtermdata);
            sssion.context.xterm.write(sessionObj[m.terminalID].xtermdata);
            sessionObj[m.terminalID].xtermdata = "";
        });
        socket.on("close-terminal", async (m) => {
            // console.log("close-terminal:", m);
            let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
            if (sssion) {
                data.current.sessions = data.current.sessions.filter((x) => x.id != m.terminalID);
                refresh();
            }
        });
        setTimeout(async () => {
            let terminalIDs = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("GetTerminals", []);
            for (let id of terminalIDs) {
                await OpenTerminal(id);
            }
            if (terminalIDs.length == 0) {
                await Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("OpenTerminal", []);
            }
        }, 1000);
    }, []);
    const data = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)({
        sessions: [],
        activeKey: "",
    });
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "my-tabs" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { type: "editable-card", activeKey: data.current.activeKey, onChange: (key) => {
                data.current.activeKey = key;
                refresh();
                Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("ActiveAITerminal", [key]);
                let session = data.current.sessions.find((x) => { return x.id == key; });
                if (session) {
                    // console.log("session", session);
                    setTimeout(() => {
                        session.context.fitAddon.fit();
                    }, 1000);
                }
            }, 
            // hideAdd
            onEdit: (targetKey, action) => {
                if (action === "add") {
                    Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("OpenTerminal", []);
                }
                else {
                    data.current.sessions = data.current.sessions.filter((x) => x.id != targetKey);
                    refresh();
                    Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/call'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("CloseTerminal", [targetKey]);
                }
            }, items: data.current.sessions.map((x) => {
                if (x.type == "terminal") {
                    return {
                        label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Terminal` + "-" + x.id,
                        key: x.id,
                        closable: true,
                        children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { menu: {
                                items: [
                                    {
                                        label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Copy`,
                                        key: 'Copy',
                                        icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_10__["default"], null),
                                    },
                                    {
                                        label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Parse`,
                                        key: 'Parse',
                                        icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_11__["default"], null),
                                    },
                                    {
                                        label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Clear`,
                                        key: 'Clear',
                                        icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], null),
                                    },
                                ],
                                onClick: (e) => {
                                    if (e.key == "Copy") {
                                        let sssion = data.current.sessions.find((x) => x.id == x.id);
                                        if (sssion && sssion.context.xterm) {
                                            let selection = sssion.context.xterm.getSelection();
                                            if (selection) {
                                                navigator.clipboard.writeText(selection).then(() => {
                                                    console.log("Copied to clipboard:", selection);
                                                }).catch(err => {
                                                    console.error("Failed to copy:", err);
                                                });
                                            }
                                        }
                                    }
                                    if (e.key == "Parse") {
                                        navigator.clipboard.readText().then((txt) => {
                                            socket.emit("terminal-receive", {
                                                terminalID: x.id,
                                                data: txt,
                                            });
                                            console.log("Read to clipboard:", txt);
                                        }).catch(err => {
                                            console.error("Failed to Read:", err);
                                        });
                                    }
                                    if (e.key == "Clear") {
                                        socket.emit("terminal-receive", {
                                            terminalID: x.id,
                                            data: "clear\r",
                                        });
                                    }
                                }
                            }, trigger: ['contextMenu'] },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "terminal-" + x.id, style: { height: "calc(-155px + 100vh)", minWidth: "400px" } }))),
                    };
                }
                else {
                    return {
                        label: "Other",
                        key: x.id,
                        children: react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Other"),
                    };
                }
            }) })));
}


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
        // 1750832726963
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
/******/ 	__webpack_require__.h = () => ("818cec5792ffd8cf0239")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.3fa01085f92292e98642.hot-update.js.map