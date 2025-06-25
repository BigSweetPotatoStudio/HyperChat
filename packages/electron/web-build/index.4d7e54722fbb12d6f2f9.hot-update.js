"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/setting/sync.tsx":
/*!************************************!*\
  !*** ./src/pages/setting/sync.tsx ***!
  \************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WebdavSetting: () => (/* binding */ WebdavSetting)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/space/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../common/call */ "./src/common/call.ts");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/CloudSyncOutlined.js");
/* harmony import */ var antd_es_form_Form__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd/es/form/Form */ "./node_modules/antd/es/form/hooks/useForm.js");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var _common_context__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../common/context */ "./src/common/context.ts");
/* harmony import */ var _components_pre__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../components/pre */ "./src/components/pre.tsx");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_call__WEBPACK_IMPORTED_MODULE_1__]);
_common_call__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];









function WebdavSetting() {
    const [num, setNum] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    function refresh() {
        setNum((num) => num + 1);
    }
    const { globalState, updateGlobalState, setLang } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_4__.HeaderContext);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.init();
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.init();
            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("isAutoLauncher").catch((x) => _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.AppSetting.get().isAutoLauncher); // 获取是否自动启动
            webdavForm.resetFields();
            webdavForm.setFieldsValue(Object.assign(_shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().webdav, { baseDirName: "HyperChat" }));
            refresh();
        })();
    }, []);
    const [webdavForm] = (0,antd_es_form_Form__WEBPACK_IMPORTED_MODULE_6__["default"])();
    const [syncLoading, setSyncLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const webDavOnFinish = async (values, type) => {
        if (type === "save") {
            setSyncLoading(true);
            try {
                await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("testWebDav", [values]);
                _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().webdav = values;
                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
                await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("webDavSync", []);
                antd__WEBPACK_IMPORTED_MODULE_7__["default"].success((0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Sync Success`);
                setCurrResult({
                    data: null,
                    error: null,
                });
                setSyncLoading(false);
                refresh();
            }
            catch (error) {
                antd__WEBPACK_IMPORTED_MODULE_7__["default"].error("Sync failed");
                setCurrResult({
                    data: null,
                    error: error,
                });
                setSyncLoading(false);
            }
        }
        else {
            await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("testWebDav", [values]);
            antd__WEBPACK_IMPORTED_MODULE_7__["default"].success("Test success");
            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.get().webdav = values;
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.save();
            antd__WEBPACK_IMPORTED_MODULE_7__["default"].success("Save success");
        }
    };
    const [currResult, setCurrResult] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        data: null,
        error: null,
    });
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "relative flex flex-wrap" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-1/2 lg:p-4" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { name: "webdavForm", form: webdavForm, labelCol: { span: 8 }, wrapperCol: { span: 16 }, style: { maxWidth: 600 }, onFinish: webDavOnFinish, initialValues: {
                        baseDirName: "HyperChat",
                    }, autoComplete: "off" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `WebDAV Url`, name: "url", rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Please input` }], normalize: (value) => value.trim() },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], null)),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Username`, name: "username", rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Please input!` }], normalize: (value) => value.trim() },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], null)),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Password`, name: "password", rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Please input!` }], normalize: (value) => value.trim() },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"].Password, null)),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Item, { label: (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `baseDirName`, name: "baseDirName", rules: [{ required: true, message: "Please input!" }], normalize: (value) => value.trim() },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { disabled: true, defaultValue: "HyperChat" })),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"].Item, { wrapperCol: { offset: 8, span: 16 } },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], null,
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { type: "primary", htmlType: "submit" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Save`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { onClick: async () => {
                                    webdavForm.validateFields().then((values) => {
                                        webDavOnFinish(values, "save");
                                    });
                                    // setSyncLoading(true);
                                    // try {
                                    //   await call("webDavSync", []);
                                    //   message.success(t`Sync Success`);
                                    //   setCurrResult({
                                    //     data: null,
                                    //     error: null,
                                    //   });
                                    //   setSyncLoading(false);
                                    //   refresh();
                                    // } catch (error) {
                                    //   message.error("Sync failed");
                                    //   setCurrResult({
                                    //     data: null,
                                    //     error: error,
                                    //   });
                                    //   setSyncLoading(false);
                                    // }
                                }, loading: syncLoading },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], null),
                                (0,_i18n__WEBPACK_IMPORTED_MODULE_3__.t) `Sync`)))),
                currResult.data && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Result:"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, (currResult.data)))),
                currResult.error && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "text-red-500 max-h-64 overflow-auto" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, "Result:"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_pre__WEBPACK_IMPORTED_MODULE_5__.Pre, null, currResult.error.toString())))))));
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
        // 1750832844176
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
/******/ 	__webpack_require__.h = () => ("c84bacdf6dd63607e111")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.4d7e54722fbb12d6f2f9.hot-update.js.map