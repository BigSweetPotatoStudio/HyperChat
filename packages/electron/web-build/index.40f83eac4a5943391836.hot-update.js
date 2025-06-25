"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/market/market.tsx":
/*!*************************************!*\
  !*** ./src/pages/market/market.tsx ***!
  \*************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Market: () => (/* binding */ Market)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../common/call */ "./src/common/call.ts");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/list/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tag/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tabs/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/space/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popconfirm/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popover/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/switch/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tooltip/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/radio/index.js");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _common_code__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../common/code */ "./src/common/code.tsx");
/* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! zod */ "./node_modules/zod/lib/index.mjs");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/CaretRightOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/StopOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/SyncOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/CheckCircleTwoTone.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/DisconnectOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/SettingOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/DeleteOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/MoreOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/MinusCircleOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/PlusOutlined.js");
/* harmony import */ var json_schema_to_zod__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! json-schema-to-zod */ "./node_modules/json-schema-to-zod/dist/esm/index.js");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var _common_context__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../common/context */ "./src/common/context.ts");
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../common */ "./src/common/index.ts");
/* harmony import */ var _components_pre__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../components/pre */ "./src/components/pre.tsx");
/* harmony import */ var _gateway__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./gateway */ "./src/pages/market/gateway.tsx");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common_code__WEBPACK_IMPORTED_MODULE_3__, _common__WEBPACK_IMPORTED_MODULE_8__, _gateway__WEBPACK_IMPORTED_MODULE_10__]);
([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common_code__WEBPACK_IMPORTED_MODULE_3__, _common__WEBPACK_IMPORTED_MODULE_8__, _gateway__WEBPACK_IMPORTED_MODULE_10__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);






// DATA.MCP.data = [
//   {
//     name: "hyper_tools",
//     description: "hyper_tools",
//   },
//   ...DATA.MCP.data,
// ];

window["z"] = zod__WEBPACK_IMPORTED_MODULE_4__.z;






// export type Package = {
//   type: "npx" | "uvx" | "other";
//   name: string;
//   github?: string;
//   description: string;
//   keywords: string[];
//   resolve: (config: any) => {
//     command: string;
//     args: string[];
//     env: Record<string, string>;
//   };
//   configSchema: any;
// };
// const config = z.object({
//   paths: z.array(
//     z.object({
//       path: z.string({
//         description: "filesystem path",
//         required_error: "path is required",
//       }),
//     }),
//   ),
//   path: z.string({
//     description: "filesystem path",
//   }),
//   port: z.number({
//     description: "port",
//   }),
//   host: z.boolean({
//     description: "host",
//   }),
// });
// type Config = z.infer<typeof config>;
// const p: Package = {
//   type: "npx",
//   name: "@modelcontextprotocol/server-filesystem",
//   github: "https://github.com/modelcontextprotocol/servers.git",
//   description: "Server 1 filesystem",
//   keywords: ["server", "filesystem"],
//   resolve: (config: Config) => {
//     return {
//       command: "npx",
//       args: [
//         "-y",
//         "@modelcontextprotocol/server-filesystem",
//         ...config.paths.map((x) => x.path),
//       ],
//       env: {},
//     };
//   },
//   configSchema: zodToJsonSchema(config),
// };
function Market() {
    const [num, setNum] = react__WEBPACK_IMPORTED_MODULE_0___default().useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const { globalState, updateGlobalState, mcpClients } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_7__.HeaderContext);
    const [nodeV, setNodeV] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("");
    const [uv, setUvVer] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("");
    const [mcpLoadingObj, setMcpLoadingObj] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
    // const [mcpExtensionData, setMcpExtensionData] = useState<any>([]);
    let init = async () => {
        (async () => {
            let x = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("exec", ["node", ["-v"]]);
            setNodeV(x);
        })();
        (async () => {
            let y = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("exec", ["uv", ["-V"]]);
            setUvVer(y);
        })();
    };
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        init();
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.init();
            refresh();
        })();
    }, []);
    const [form] = antd__WEBPACK_IMPORTED_MODULE_11__["default"].useForm();
    const [mcpconfigform] = antd__WEBPACK_IMPORTED_MODULE_11__["default"].useForm();
    const [isPathOpen, setIsPathOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [currRow, setCurrRow] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        ext: {}
    });
    const [mcpconfigOpen, setMcpconfigOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [loadingOpenMCP, setLoadingOpenMCP] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [mcpform] = antd__WEBPACK_IMPORTED_MODULE_11__["default"].useForm();
    const [currResult, setCurrResult] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        data: null,
        error: null,
    });
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => { }, []);
    const RenderEnableAndDisable = (item) => {
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { key: "enable", onClick: async (e) => {
                try {
                    mcpLoadingObj[item.name] = true;
                    setMcpLoadingObj({ ...mcpLoadingObj });
                    if (item.status != "disabled") {
                        await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("closeMcpClients", [item.name, {
                                isdelete: false,
                                isdisable: true
                            }]);
                    }
                    else {
                        await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", [item.name]);
                    }
                }
                catch (e) {
                    antd__WEBPACK_IMPORTED_MODULE_13__["default"].error(e.message);
                }
                finally {
                    mcpLoadingObj[item.name] = false;
                    setMcpLoadingObj({ ...mcpLoadingObj });
                }
            }, type: "link", title: item.status == "disabled"
                ? (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Enable`
                : (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Disable`, icon: item.status == "disabled" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_14__["default"], null)) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_15__["default"], null)) }));
    };
    const ListItemMeta = (item) => {
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"].Item.Meta, { className: "px-2", title: react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null,
                    item.name,
                    "\u00A0",
                    item.version && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_17__["default"], null, item.version),
                    item.source == "builtin" && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_17__["default"], { color: "blue" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `built-in`),
                    item.source == "hyperchat" && item.config.isSync && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_17__["default"], { className: " text-blue-400" }, "sync"),
                    "\u00A0",
                    (item.config?.type && item.config?.type != "stdio") && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_17__["default"], null, item.config?.type),
                    "\u00A0",
                    item.status == "connecting" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_18__["default"], { spin: true, className: "text-blue-400" })) : item.status == "connected" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_19__["default"], { twoToneColor: "#52c41a" })) : item.status == "disconnected" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_20__["default"], { className: "text-red-400" })) : item.status ==
                        "disabled" ? null : null)), description: item.servername }));
    };
    const [searchValue, setSearchValue] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("");
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "market overflow-auto" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-2/5" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_21__["default"], { className: "rounded-lg bg-white", type: "card", items: [
                        {
                            label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `MCP Community`,
                            key: "thirdparty",
                            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "bg-white p-0" },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex justify-center p-1" },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"].Compact, null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Search", onChange: e => {
                                                setSearchValue(e.target.value);
                                            } }),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { onClick: () => {
                                                mcpform.resetFields();
                                                setIsAddMCPConfigOpen(true);
                                                setCurrResult({
                                                    data: null,
                                                    error: null,
                                                });
                                            } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Add MCP`),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Open Configuration File`, icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_24__["default"], null), onClick: async () => {
                                                let p = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("pathJoin", ["mcp.json"]);
                                                await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openExplorer", [p]);
                                            } }))),
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { maxHeight: "calc(100vh - 152px)", overflowY: "auto" } },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { itemLayout: "horizontal", dataSource: mcpClients.filter(x => x.source == "hyperchat" && x.name && x.name.includes(searchValue)), renderItem: (item, index) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"].Item, { className: "hover:cursor-pointer hover:bg-slate-300", actions: [react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"].Compact, null, [
                                                    (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { key: "list-del", className: "text-lg hover:text-cyan-400" },
                                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_25__["default"], { title: "Sure to delete?", onConfirm: async () => {
                                                                try {
                                                                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("closeMcpClients", [
                                                                        item.name,
                                                                        {
                                                                            isdelete: true,
                                                                            isdisable: false,
                                                                        }
                                                                    ]);
                                                                }
                                                                catch (e) {
                                                                    antd__WEBPACK_IMPORTED_MODULE_13__["default"].error(e.message);
                                                                }
                                                            } },
                                                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `delete`, type: "link" },
                                                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_26__["default"], { className: "text-lg hover:text-cyan-400" }))))),
                                                    RenderEnableAndDisable(item),
                                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { key: "set-del", className: "text-lg hover:text-cyan-400" },
                                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { type: "link", onClick: async (e) => {
                                                                // await MCP_CONFIG.init()
                                                                // const config =
                                                                //   MCP_CONFIG.get().mcpServers[item.name];
                                                                let formValues = {
                                                                    ...item.config,
                                                                    name: item.name,
                                                                };
                                                                formValues._name = item.name;
                                                                formValues._type = "edit";
                                                                formValues.command = [
                                                                    formValues.command || "",
                                                                    ...formValues.args || [],
                                                                ].join("   ");
                                                                formValues._envList = [];
                                                                for (let key in (formValues.env || {})) {
                                                                    formValues._envList.push({
                                                                        name: key,
                                                                        value: formValues.env[key],
                                                                    });
                                                                }
                                                                formValues.type =
                                                                    formValues?.type || formValues?.hyperchat?.type || "stdio";
                                                                formValues.url =
                                                                    formValues?.url || formValues?.hyperchat?.url || "";
                                                                formValues.headers = Object.entries(formValues.headers || {}).map(([key, value]) => `${key}=${value}`).join("\n");
                                                                mcpform.resetFields();
                                                                mcpform.setFieldsValue(formValues);
                                                                setIsAddMCPConfigOpen(true);
                                                                setCurrResult({
                                                                    data: null,
                                                                    error: null,
                                                                });
                                                            }, title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Setting` },
                                                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_24__["default"], null))),
                                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_27__["default"], { key: "more-setting", trigger: "click", title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `More Setting`, content: react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                                            (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Sync`,
                                                            ": ",
                                                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_28__["default"], { value: item.config.isSync, onChange: async (e) => {
                                                                    // await MCP_CONFIG.init()
                                                                    // MCP_CONFIG.get().mcpServers[item.name].isSync = e;
                                                                    // await MCP_CONFIG.save();
                                                                    // item.config.isSync = e;
                                                                    // refresh();
                                                                    item.config.isSync = e;
                                                                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", [item.name, item.config, { onlySave: true }]);
                                                                } })) },
                                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { type: "link", icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_29__["default"], null), title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `More Setting` }))
                                                    // ) : undefined,
                                                ].filter((x) => x != null))] }, ListItemMeta(item))) })))),
                        },
                        {
                            label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Build-in`,
                            key: "official",
                            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "bg-white p-0" },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { itemLayout: "horizontal", dataSource: mcpClients.filter(x => x.source == "builtin"), renderItem: (item, index) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"].Item, { className: "hover:cursor-pointer hover:bg-slate-300", actions: [
                                            RenderEnableAndDisable(item),
                                            item.status != "disabled" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { className: "text-lg hover:text-cyan-400" },
                                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { type: "link", title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Setting`, onClick: async (e) => {
                                                        e.stopPropagation();
                                                        mcpconfigform.resetFields();
                                                        let zo = eval((0,json_schema_to_zod__WEBPACK_IMPORTED_MODULE_5__.jsonSchemaToZod)(item.ext.configSchema));
                                                        mcpconfigform?.setFieldsValue(zo.safeParse({}).data);
                                                        mcpconfigform.setFieldsValue(item.config?.hyperchat?.config || {});
                                                        setCurrRow(item);
                                                        setMcpconfigOpen(true);
                                                        refresh();
                                                    } },
                                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_24__["default"], null)))) : undefined,
                                        ].filter((x) => x != null) }, ListItemMeta(item))) }))),
                        },
                        mcpClients.filter(x => x.source == "claude").length > 0 && {
                            label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Claude Desktop`,
                            key: "claude",
                            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "bg-white p-0" },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex justify-center p-1" },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Open Configuration File`, icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_24__["default"], null), onClick: async () => {
                                                let c = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("getConfig", []);
                                                await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openExplorer", [c.claudeConfigPath]);
                                            } }, "Claude Desktop Config"),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { title: "isLoadClaudeConfig:", className: "my-bottom" },
                                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_28__["default"], { checked: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().isLoadClaudeConfig, onChange: async (checked) => {
                                                    if (checked) {
                                                        for (let x of mcpClients.filter(x => x.source == "claude")) {
                                                            await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", [x.name]);
                                                        }
                                                    }
                                                    else {
                                                        for (let x of mcpClients.filter(x => x.source == "claude")) {
                                                            await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("closeMcpClients", [x.name, { isdelete: false, isdisable: true }]);
                                                        }
                                                    }
                                                    _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().isLoadClaudeConfig = checked;
                                                    await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                                    refresh();
                                                } }),
                                            " "))),
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { maxHeight: "calc(100vh - 152px)", overflowY: "auto" } },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { itemLayout: "horizontal", dataSource: mcpClients.filter(x => x.source == "claude" && x.name && x.name.includes(searchValue)), renderItem: (item, index) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"].Item, { className: "hover:cursor-pointer hover:bg-slate-300" }, ListItemMeta(item))) })))),
                        },
                        {
                            label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `MCP Gateway`,
                            key: "mcpGateway",
                            children: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_gateway__WEBPACK_IMPORTED_MODULE_10__.MCPGateWayPage, null)))
                        }
                    ].filter(x => x) })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full p-4 lg:w-3/5" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `More MCP Market`),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://modelcontextprotocol.io/examples" }, "modelcontextprotocol.io/examples")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://mcp.so/" }, "mcp.so")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://www.pulsemcp.com/" }, "pulsemcp.com")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://glama.ai/mcp/servers?attributes=" }, "glama.ai")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://smithery.ai/" }, "smithery.ai")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Help: "),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "help" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"], null,
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "font-bold" }, "nodejs: "),
                                    nodeV || (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Not Installed`)),
                            !nodeV && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"], null,
                                    _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().platform == "win32" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please run the command.`),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_common_code__WEBPACK_IMPORTED_MODULE_3__.Code, null, "winget install OpenJS.NodeJS.LTS"))) : _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().platform == "darwin" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please run the command.`),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_common_code__WEBPACK_IMPORTED_MODULE_3__.Code, null, "brew install node"))) : (""),
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://nodejs.org/" }, "goto nodejs")),
                                " "))),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"], null,
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "font-bold" }, "uv:"),
                                    " ",
                                    uv || (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Not Installed`)),
                            !uv && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_22__["default"], null,
                                    _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().platform == "win32" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please run the command.`),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_common_code__WEBPACK_IMPORTED_MODULE_3__.Code, null, "winget install --id=astral-sh.uv -e"))) : _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().platform == "darwin" ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please run the command.`),
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_common_code__WEBPACK_IMPORTED_MODULE_3__.Code, null, "brew install uv"))) : (""),
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "https://github.com/astral-sh/uv" }, "goto uv"))))),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_30__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `you might need to customize the PATH environment var.` },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { onClick: () => {
                                    setIsPathOpen(true);
                                }, danger: true }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Try Repair environment`))))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_31__["default"], { width: 600, title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Configure PATH`, open: isPathOpen, okButtonProps: { autoFocus: true, htmlType: "submit" }, cancelButtonProps: { style: { display: "none" } }, onCancel: () => {
                    setIsPathOpen(false);
                }, modalRender: (dom) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { form: form, layout: "vertical", name: "ConfigurePATH", initialValues: {
                        PATH: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().PATH,
                    }, clearOnDestroy: true, onFinish: async (values) => {
                        _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().PATH = values.PATH;
                        await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                        init();
                        setIsPathOpen(false);
                    } }, dom)) },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "PATH", label: "PATH" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Here, you would input the result of the command echo $PATH." }))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_31__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `BuildIn MCP Configuration`, open: mcpconfigOpen, footer: [], onCancel: () => setMcpconfigOpen(false), forceRender: true },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { name: "buildinMcpConfigform", form: mcpconfigform, onFinish: async (values) => {
                        // console.log("onFinish", values);
                        let zo = eval((0,json_schema_to_zod__WEBPACK_IMPORTED_MODULE_5__.jsonSchemaToZod)(currRow.ext.configSchema));
                        values = zo.safeParse(values).data;
                        // console.log("onFinish", values);
                        currRow.config = {
                            ...currRow.config,
                            hyperchat: {
                                config: values,
                            }
                        };
                        try {
                            if (currRow.source == "builtin") {
                                await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", [
                                    currRow.name,
                                    currRow.config,
                                ]);
                                setMcpconfigOpen(false);
                            }
                            else {
                                // ! 不会生效了
                                // let config = currRow.resolve(values);
                                // config.hyperchat = {
                                //   url: "",
                                //   type: "stdio",
                                //   scope: "outer",
                                //   config: values,
                                // };
                                // await call("openMcpClient", [currRow.name, config]);
                                // MCP_CONFIG.get().mcpServers[currRow.name] = config;
                                // await MCP_CONFIG.save();
                                // await getClients();
                                // setMcpconfigOpen(false);
                            }
                        }
                        catch (e) {
                            antd__WEBPACK_IMPORTED_MODULE_13__["default"].error(e.message);
                        }
                    } },
                    currRow.ext.configSchema
                        ? (0,_common__WEBPACK_IMPORTED_MODULE_8__.JsonSchema2FormItemOrNull)(currRow.ext.configSchema) ||
                            (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `No parameters`
                        : [],
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { className: "flex justify-end" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { htmlType: "submit" }, "Submit")))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_31__["default"], { width: 600, title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Configure MCP`, open: isAddMCPConfigOpen, okButtonProps: {
                    autoFocus: true,
                    htmlType: "submit",
                    loading: loadingOpenMCP,
                }, okText: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Install And Run`, maskClosable: false, cancelButtonProps: { style: { display: "none" } }, onCancel: () => {
                    setIsAddMCPConfigOpen(false);
                }, modalRender: (dom) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { initialValues: {
                        type: "stdio",
                    }, form: mcpform, layout: "vertical", name: "Configure MCP", clearOnDestroy: true, onFinish: async (values) => {
                        try {
                            setLoadingOpenMCP(true);
                            if (values._type != "edit") { // 新建
                                if (mcpClients.find(x => x.name === values.name)) {
                                    antd__WEBPACK_IMPORTED_MODULE_13__["default"].error((0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `MCP Service Name already exists`);
                                    return;
                                }
                            }
                            else { //编辑
                                if (values._name && values.name != values._name) {
                                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("closeMcpClients", [values._name, { isdelete: true, isdisable: true }]);
                                }
                            }
                            let mcpServerConfig = {};
                            if (values.type == "sse" || values.type == "streamableHttp") {
                                let headers = {};
                                values.headers = values.headers || "";
                                let lines = values.headers.split("\n");
                                for (let line of lines) {
                                    let [key, value] = line.split("=");
                                    if (key && value) {
                                        headers[key.trim()] = value.trim();
                                    }
                                }
                                mcpServerConfig = {
                                    url: values.url,
                                    type: values.type,
                                    headers: headers,
                                };
                            }
                            else {
                                let commands = values.command
                                    .split(" ")
                                    .filter((x) => x.trim() != "");
                                let [command, ...args] = commands;
                                values.command = command.trim();
                                values.args = args;
                                values.env = {};
                                try {
                                    values._envList = values._envList || [];
                                    for (let x of values._envList) {
                                        values.env[x.name.trim()] = x.value.trim();
                                    }
                                }
                                catch {
                                    antd__WEBPACK_IMPORTED_MODULE_13__["default"].error("Please enter a valid JSON");
                                    return;
                                }
                                mcpServerConfig = {
                                    command: values.command,
                                    args: values.args,
                                    env: values.env,
                                };
                            }
                            await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", [values.name, mcpServerConfig]);
                            setCurrResult({
                                data: "success",
                                error: null,
                            });
                            refresh();
                            setIsAddMCPConfigOpen(false);
                        }
                        catch (e) {
                            // message.error(e.message);
                            setCurrResult({
                                data: null,
                                error: e.message,
                            });
                        }
                        finally {
                            setLoadingOpenMCP(false);
                        }
                    } }, dom)) },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { className: "hidden", name: "_type", label: "_type" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], null)),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "_name", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Old Name`, className: "hidden", rules: [{ message: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { disabled: true, placeholder: "Please enter" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "name", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Name`, rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Please enter" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "type", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `type`, rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_32__["default"].Group, { onChange: (e) => {
                            refresh();
                        } },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_32__["default"], { value: "stdio" }, "stdio"),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_32__["default"], { value: "sse" }, "sse"),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_32__["default"], { value: "streamableHttp" }, "streamableHttp"))),
                (mcpform.getFieldValue("type") == "sse" || mcpform.getFieldValue("type") == "streamableHttp") ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    " ",
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "url", label: "url", rules: [{ required: true, message: "Please enter" }] },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Please enter url" })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "headers", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `request-headers` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"].TextArea, { placeholder: "Content-Type=application/json\r\nAuthorization=Bearer token" })))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "command", label: "command", rules: [{ required: true, message: "Please enter" }] },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Please enter command" })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { label: "env" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].List, { name: "_envList" }, (fields, { add, remove }) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                            fields.map(({ key, name, ...restField }) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { key: key, style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                } },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { ...restField, name: [name, "name"], rules: [
                                        { required: true, message: "Missing name" },
                                    ] },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Var Name" })),
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { ...restField, className: "flex-1", name: [name, "value"], rules: [
                                        { required: true, message: "Missing Value" },
                                    ] },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_23__["default"], { placeholder: "Var Value" })),
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, null,
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_33__["default"], { onClick: () => remove(name) }))))),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, null,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { type: "dashed", onClick: () => add(), block: true, icon: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_34__["default"], null) }, "Add Environment Variables")))))))),
                currResult.data && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Result:"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, (currResult.data)))),
                currResult.error && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "text-red-500 max-h-64 overflow-auto" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Result:"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_pre__WEBPACK_IMPORTED_MODULE_9__.Pre, null, currResult.error.toString())))))));
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
        // 1750832886122
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
/******/ 	__webpack_require__.h = () => ("d0e5b89578bb6ee3e91c")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.40f83eac4a5943391836.hot-update.js.map