"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/setting/index.tsx":
/*!*************************************!*\
  !*** ./src/pages/setting/index.tsx ***!
  \*************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Setting: () => (/* binding */ Setting)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/select/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/switch/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/radio/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input-number/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/space/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../common/call */ "./src/common/call.ts");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../common */ "./src/common/index.ts");
/* harmony import */ var antd_es_form_Form__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd/es/form/Form */ "./node_modules/antd/es/form/hooks/useForm.js");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var _common_context__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common/context */ "./src/common/context.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common__WEBPACK_IMPORTED_MODULE_3__]);
([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);








function Setting() {
    const [num, setNum] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    function refresh() {
        setNum((num) => num + 1);
    }
    const { globalState, updateGlobalState, setLang } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_5__.HeaderContext);
    let port = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.init();
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.init();
            setPassword(_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().password);
            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("isAutoLauncher").catch((x) => _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher); // 获取是否自动启动
            webdavForm.resetFields();
            webdavForm.setFieldsValue(Object.assign(_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().webdav, { baseDirName: "HyperChat" }));
            const c = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("getConfig");
            port.current = c.port;
            refresh();
        })();
    }, []);
    const [webdavForm] = (0,antd_es_form_Form__WEBPACK_IMPORTED_MODULE_6__["default"])();
    const [password, setPassword] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("");
    const [day, setDay] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(30);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "overflow-auto h-full" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "relative flex flex-wrap" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-1/2 lg:p-4" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { layout: "vertical", name: "basicSitting", 
                    // initialValues={{
                    //   isAutoLauncher: AppSetting.get().isAutoLauncher,
                    //   mcpCallToolTimeout: AppSetting.get().mcpCallToolTimeout,
                    // }}
                    autoComplete: "off" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Language`, className: "lg:hidden" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { value: _i18n__WEBPACK_IMPORTED_MODULE_4__.currLang, className: "w-full", onChange: (e) => {
                                setLang(e);
                            }, options: [
                                { value: "zhCN", label: "中文" },
                                { value: "enUS", label: "English" },
                            ] })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `LaunchStartup` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher, checkedChildren: "Startup", unCheckedChildren: "Close", onChange: async (value) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher = value;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.save();
                                if (value) {
                                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("enableAutoLauncher");
                                }
                                else {
                                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("disableAutoLauncher");
                                }
                                refresh();
                            } })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Exit Action` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"].Group, { value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().closeAction, onChange: async (e) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().closeAction = e.target.value;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                refresh();
                            } },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { value: "minimize" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Minimize to Tray`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { value: "exit" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Exit Application`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { value: 0 }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Ask Every Time`))),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `autoSync`, tooltip: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `This is an experimental feature, 5min sync once` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { checkedChildren: "AutoSync", unCheckedChildren: "Close", value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().autoSync, onChange: async (e) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().autoSync = e;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                refresh();
                            } })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `mcpCallToolTimeout` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { className: "w-full", value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().mcpCallToolTimeout, onChange: async (value) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().mcpCallToolTimeout =
                                    parseInt(value) || 60;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.save();
                                refresh();
                            } })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `web asscess password` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"].Compact, null,
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { className: "w-full", value: password, onChange: async (e) => {
                                    setPassword(e.target.value || "123456");
                                } }),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: async () => {
                                    if (!/^[a-zA-Z0-9]+$/.test(password)) {
                                        antd__WEBPACK_IMPORTED_MODULE_15__["default"].error((0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Password must contain only letters and numbers`);
                                        return;
                                    }
                                    _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().password = password;
                                    await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                    antd__WEBPACK_IMPORTED_MODULE_15__["default"].success((0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Update Success, please restart`);
                                } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Update`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: () => window.open(`${location.protocol}//${location.hostname}:${port.current}/${_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().password}/`) },
                                "OpenWeb(",
                                `${location.protocol}//${location.hostname}:${port.current}/${_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().password}/`,
                                ")"))),
                    _common__WEBPACK_IMPORTED_MODULE_3__.isOnBrowser && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Network Settings` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"].Group, { options: [
                                {
                                    label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `local-browser` + (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `(Need to solve cors problem)`,
                                    value: "local-browser",
                                },
                                {
                                    label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `server-proxy`,
                                    value: "server-proxy",
                                },
                            ], value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().browserNetworkSetting, onChange: async (e) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().browserNetworkSetting = e.target.value;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                refresh();
                            } })),
                    !_common__WEBPACK_IMPORTED_MODULE_3__.isOnBrowser && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Startup window size` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { options: [
                                // 4:3 比例
                                {
                                    label: "1024x768 (4:3)",
                                    value: "1024x768",
                                }, {
                                    label: "1280x960 (4:3)",
                                    value: "1280x960",
                                }, {
                                    label: "1600x1200 (4:3)",
                                    value: "1600x1200",
                                },
                                // 16:10 比例
                                {
                                    label: "1280x800 (16:10)",
                                    value: "1280x800",
                                }, {
                                    label: "1440x900 (16:10)",
                                    value: "1440x900",
                                }, {
                                    label: "1680x1050 (16:10)",
                                    value: "1680x1050",
                                },
                                // 16:9 比例
                                {
                                    label: "1280x720 (16:9)",
                                    value: "1280x720",
                                }, {
                                    label: "1366x768 (16:9)",
                                    value: "1366x768",
                                }, {
                                    label: "1600x900 (16:9)",
                                    value: "1600x900",
                                }, {
                                    label: "1920x1080 (16:9)",
                                    value: "1920x1080",
                                }
                            ], value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().windowSize.width + "x" + _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().windowSize.height, onChange: (e) => {
                                let [width, height] = e.split("x").map(x => parseInt(x));
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().windowSize.width = width;
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().windowSize.height = height;
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                refresh();
                                antd__WEBPACK_IMPORTED_MODULE_15__["default"].success((0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Save Success, please restart`);
                            } })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Develop Mode` },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { value: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().isDeveloper, onChange: async (value) => {
                                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().isDeveloper = value;
                                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                                refresh();
                            } })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `ClearChatHistory(exclude Star)`, name: "deleteChatRecord" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { wrap: true },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { placeholder: "day", value: day, onChange: e => setDay(e) }),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: async () => {
                                    let res = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("clearChatHistory", [day]);
                                    antd__WEBPACK_IMPORTED_MODULE_15__["default"].success((0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Clear Success ` + res + (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) ` records`);
                                } },
                                (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `Clear logs older than `,
                                day,
                                (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) ` days`))),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `DevTools`, name: "openDevTools" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { wrap: true },
                            !_common__WEBPACK_IMPORTED_MODULE_3__.isOnBrowser && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: () => {
                                    (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openDevTools", []);
                                } },
                                (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `openDevTools`,
                                "(",
                                window.electron.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                                ")"),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: () => (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openExplorer", [_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().logFilePath]) }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `logFile`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: () => (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openExplorer", [_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().appDataDir]) }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `appDataDir`))),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "Github", name: "Github" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { target: "_blank", href: "https://github.com/BigSweetPotatoStudio/HyperChat" }, "https://github.com/BigSweetPotatoStudio/HyperChat")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "Telegram", name: "Telegram" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { target: "_blank", href: "https://t.me/dadigua001" }, "https://t.me/dadigua001")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "QQ\u7FA4", name: "QQ\u7FA4" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { className: "flex items-center text-blue-500", target: "_blank", href: "https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim" }, "759977131"))),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "text-red-500" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_4__.t) `This software is free and OpenSource. Feel free to follow me, and I
            will bring more utility software.`),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { layout: "horizontal", name: "1351561", labelCol: { span: 4 }, wrapperCol: { span: 20 }, autoComplete: "off" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "Email", name: "Email" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { href: "mailto:develop@dadigua.men" }, "0laopo0@gmail.com")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "\u5C0F\u7EA2\u4E66", name: "\u5C0F\u7EA2\u4E66" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { target: "_blank", href: "https://www.xiaohongshu.com/user/profile/5f0dc4fc0000000001005234" }, "\u5927\u5730\u74DC\u7684\u5C0F\u7EA2\u4E66")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "X(Twitter)", name: "X(Twitter)" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { target: "_blank", href: "https://x.com/ddg85479319" }, "Twitter")),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"].Item, { label: "Bilibili", name: "Bilibili" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { target: "_blank", href: "https://space.bilibili.com/96150707" }, "\u5927\u5730\u74DC\u7684Bilibili")))))));
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
        // 1750832872071
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
/******/ 	__webpack_require__.h = () => ("4a5cf031c684e956e3b4")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.c84bacdf6dd63607e111.hot-update.js.map