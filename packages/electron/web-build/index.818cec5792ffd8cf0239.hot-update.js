"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/variableList/variableList.tsx":
/*!*************************************************!*\
  !*** ./src/pages/variableList/variableList.tsx ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   VariableList: () => (/* binding */ VariableList)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/table/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tooltip/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/select/index.js");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/QuestionCircleOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/EditOutlined.js");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/DeleteOutlined.js");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var antd_lib__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd/lib */ "./node_modules/antd/lib/index.js");
/* harmony import */ var _monaco_editor_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @monaco-editor/react */ "./node_modules/@monaco-editor/react/dist/index.mjs");
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/context'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());









const VariableList = () => {
    const { globalState, updateGlobalState, setLang } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../shared/context'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
    const [num, setNum] = react__WEBPACK_IMPORTED_MODULE_0___default().useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const [scope, setScope] = react__WEBPACK_IMPORTED_MODULE_0___default().useState({
        name: undefined,
        key: undefined
    });
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.init();
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.init();
            refresh();
        })();
    }, []);
    const [isScopeOpen, setIsScopeOpen] = react__WEBPACK_IMPORTED_MODULE_0___default().useState(false);
    const [scopeForm] = antd__WEBPACK_IMPORTED_MODULE_5__["default"].useForm();
    const [isVariableOpen, setIsVariableOpen] = react__WEBPACK_IMPORTED_MODULE_0___default().useState(false);
    const [variableForm] = antd__WEBPACK_IMPORTED_MODULE_5__["default"].useForm();
    return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "overflow-auto h-full" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-1/4" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { scroll: { y: "calc(-151px + 100vh)" }, size: "small", rowKey: "key", title: () => {
                        return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex gap-1" },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { size: "small", onClick: () => {
                                    setScope({
                                        name: undefined,
                                        key: undefined
                                    });
                                } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Clear Select`),
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { size: "small", onClick: () => {
                                    scopeForm.resetFields();
                                    scopeForm.setFieldsValue({
                                        name: undefined
                                    });
                                    setIsScopeOpen(true);
                                } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Add`));
                    }, rowSelection: {
                        type: "radio", selectedRowKeys: [scope.key], onChange: (selectedRowKeys) => {
                            setScope((_shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.find(x => x.key == selectedRowKeys[0]) || {}));
                        }
                    }, columns: [
                        {
                            title: react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
                                (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `NameSpace`,
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Changed the name, it was previously called scope` },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_9__["default"], null)),
                                " "),
                            dataIndex: 'name',
                            render: (text, record) => {
                                return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null,
                                    text,
                                    " ",
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_10__["default"], { className: "cursor-pointer hover:text-cyan-400", onClick: () => {
                                            scopeForm.resetFields();
                                            scopeForm.setFieldsValue({
                                                ...record,
                                            });
                                            setIsScopeOpen(true);
                                        } }),
                                    " ",
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd_lib__WEBPACK_IMPORTED_MODULE_11__.Popconfirm, { title: react__WEBPACK_IMPORTED_MODULE_0___default().createElement("pre", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Are you sure to delete this NameSpace?
Including variables will also be deleted`), onConfirm: async () => {
                                            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.filter(x => x.key !== record.key);
                                            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.filter(x => x.scope !== record.name);
                                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.save();
                                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.save();
                                            refresh();
                                        } },
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], { className: "cursor-pointer hover:text-cyan-400" })));
                            }
                        },
                    ], pagination: false, dataSource: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-3/4" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { scroll: { y: "calc(-151px + 100vh)" }, size: "small", rowKey: "key", title: () => {
                        return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex gap-1" },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { size: "small", onClick: () => {
                                    variableForm.resetFields();
                                    variableForm.setFieldsValue({
                                        scope: scope.name || _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data[0]?.name,
                                        variableStrategy: "lazy",
                                        variableType: "string"
                                    });
                                    setIsVariableOpen(true);
                                } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Add`));
                    }, columns: [
                        {
                            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `VariableName`,
                            dataIndex: 'name',
                            width: 200,
                            render: (text, record) => {
                                return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "line-clamp-1" }, text),
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_10__["default"], { className: "cursor-pointer hover:text-cyan-400", onClick: () => {
                                            variableForm.resetFields();
                                            variableForm.setFieldsValue({
                                                ...record,
                                            });
                                            setIsVariableOpen(true);
                                        } }),
                                    " ",
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd_lib__WEBPACK_IMPORTED_MODULE_11__.Popconfirm, { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `are you sure to delete this variable?`, onConfirm: async () => {
                                            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.filter(x => x.key !== record.key);
                                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.save();
                                            refresh();
                                        } },
                                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_12__["default"], { className: "cursor-pointer hover:text-cyan-400" })));
                            }
                        },
                        {
                            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Value`,
                            dataIndex: 'value',
                            render: (text, record) => {
                                return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "line-clamp-2" }, text || "code");
                            }
                        },
                        {
                            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `NameSpace`,
                            dataIndex: 'scope',
                            render: (text, record) => {
                                return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "line-clamp-1" }, text);
                            }
                        },
                    ], pagination: false, dataSource: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.filter(x => {
                        if (scope?.name == null) {
                            return true;
                        }
                        else {
                            return x.scope == scope.name;
                        }
                    }) }))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `NameSpace`, open: isScopeOpen, footer: [], onCancel: () => setIsScopeOpen(false), forceRender: true, width: "80%", zIndex: 2000 },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"], { form: scopeForm, onFinish: async (values) => {
                    if (values.key) {
                        let find = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.find(x => x.key === values.key);
                        if (find) {
                            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.filter(x => x.scope == find.name).forEach(x => {
                                x.scope = values.name;
                            });
                            find.name = values.name;
                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.save();
                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.save();
                        }
                    }
                    else {
                        _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.push({ key: (0,uuid__WEBPACK_IMPORTED_MODULE_14__["default"])(), name: values.name });
                        await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.save();
                    }
                    setIsScopeOpen(false);
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { className: "hidden", name: "key", label: "key" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], null)),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "name", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Name`, rules: [
                        { required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter the name` },
                        { pattern: /^[a-zA-Z0-9]+$/, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Only allow alphanumeric characters` },
                        {
                            validator: async (rule, value) => {
                                if (_shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.find(x => x.name == value)) {
                                    throw new Error((0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Name already exists`);
                                }
                                else if (value == "hyper") {
                                    throw new Error((0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Name cannot be "hyper"`);
                                }
                            }
                        }
                    ] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], { placeholder: "Please enter the name" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { className: "flex justify-end" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { htmlType: "submit" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Submit`)))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Variable`, open: isVariableOpen, footer: [], onCancel: () => setIsVariableOpen(false), forceRender: true, width: "80%", zIndex: 2000 },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"], { form: variableForm, onFinish: async (values) => {
                    if (values.key) {
                        let findIndex = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.findIndex(x => x.key === values.key);
                        if (findIndex !== -1) {
                            _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data[findIndex] = values;
                            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.save();
                        }
                    }
                    else {
                        _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.get().data.push({ ...values, key: (0,uuid__WEBPACK_IMPORTED_MODULE_14__["default"])() });
                        await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarList.save();
                    }
                    setIsVariableOpen(false);
                } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { className: "hidden", name: "key", label: "key" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], null)),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "name", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Name`, rules: [{ required: true, message: `Please enter the name` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], { placeholder: "Please enter the name" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "variableType", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `variableType`, rules: [{ required: true, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { onChange: () => {
                            refresh();
                        }, options: ["string", "js", "webjs"].map(item => ({ value: item, label: item })) })),
                variableForm.getFieldValue("variableType") != "string" && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "code", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Code`, rules: [{ required: true, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_monaco_editor_react__WEBPACK_IMPORTED_MODULE_3__["default"], { height: "200px", defaultLanguage: "javascript", defaultValue: variableForm.getFieldValue("code") })),
                variableForm.getFieldValue("variableType") == "string" && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "value", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Value`, rules: [{ required: true, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"].TextArea, { placeholder: "Please enter", rows: 8 })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "scope", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `NameSpace`, rules: [{ required: true, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { options: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.VarScopeList.get().data.map(item => ({ value: item.name, label: item.name })) })),
                variableForm.getFieldValue("variableType") == "string" && react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "variableStrategy", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `variableStrategy`, rules: [{ required: true, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_16__["default"], { onChange: () => {
                            refresh();
                        }, options: [{
                                label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `lazy(Replace when Sending)`, value: "lazy"
                            }, {
                                label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `immediate(Replace immediately = Quick input)`, value: "immediate"
                            }] })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { name: "description", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Description`, rules: [{ required: false, message: `Please enter` }] },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"].TextArea, { placeholder: "Please enter" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"].Item, { className: "flex justify-end" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { htmlType: "submit" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Submit`)))));
};


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
        // 1750832735200
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
/******/ 	__webpack_require__.h = () => ("d850e88da8399ab1d8c8")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.818cec5792ffd8cf0239.hot-update.js.map