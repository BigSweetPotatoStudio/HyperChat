"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/market/gateway.tsx":
/*!**************************************!*\
  !*** ./src/pages/market/gateway.tsx ***!
  \**************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GatewayModal: () => (/* binding */ GatewayModal),
/* harmony export */   MCPGateWayPage: () => (/* binding */ MCPGateWayPage)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popover/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popconfirm/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/space/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/table/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/tree-select/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var _src_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/src/i18n */ "./src/i18n.ts");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _common_context__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../common/context */ "./src/common/context.ts");
/* harmony import */ var _src_common_call__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/src/common/call */ "./src/common/call.ts");
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/CopyOutlined.js");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_src_common_call__WEBPACK_IMPORTED_MODULE_4__]);
_src_common_call__WEBPACK_IMPORTED_MODULE_4__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];

 // 添加了Form、Modal、Input、TreeSelect等导入





function MCPGateWayPage() {
    const { mcpClients } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_3__.HeaderContext);
    const [isModalOpen, setIsModalOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [initialValues, setInitialValues] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({
        name: "",
        description: "",
        allowMCPs: [],
    });
    const [refresh, setRefresh] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.init();
            setRefresh((prev) => prev + 1);
        })();
    }, []);
    // 更新数据
    const handleUpdate = async () => {
        setRefresh((prev) => prev + 1);
    };
    // 创建或更新网关
    const handleCreateOrUpdateGateway = async (values) => {
        try {
            const gatewayData = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.get();
            if (values.key) {
                // 更新现有网关
                const index = gatewayData.data.findIndex(item => item.name === values.key);
                if (index !== -1) {
                    gatewayData.data[index] = {
                        name: values.name,
                        description: values.description,
                        allowMCPs: values.allowMCPs,
                    };
                }
            }
            else {
                // 创建新网关
                gatewayData.data.push({
                    name: values.name,
                    description: values.description,
                    allowMCPs: values.allowMCPs,
                });
            }
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.save();
            await (0,_src_common_call__WEBPACK_IMPORTED_MODULE_4__.call)("refreshMcpRoutes", []);
            setIsModalOpen(false);
            antd__WEBPACK_IMPORTED_MODULE_5__["default"].success(values.key ? (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Gateway updated successfully` : (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Gateway created successfully`);
            handleUpdate();
        }
        catch (error) {
            antd__WEBPACK_IMPORTED_MODULE_5__["default"].error((0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Operation failed: ` + error.message);
        }
    };
    // 删除网关
    const handleDelete = async (name) => {
        try {
            const gatewayData = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.get();
            gatewayData.data = gatewayData.data.filter(item => item.name !== name);
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.save();
            antd__WEBPACK_IMPORTED_MODULE_5__["default"].success((0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Gateway deleted successfully`);
            handleUpdate();
        }
        catch (error) {
            antd__WEBPACK_IMPORTED_MODULE_5__["default"].error((0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Delete failed: ` + error.message);
        }
    };
    // 编辑网关
    const handleEdit = (record) => {
        setInitialValues({
            key: record.name,
            name: record.name,
            description: record.description || "",
            allowMCPs: record.allowMCPs || [],
        });
        setIsModalOpen(true);
    };
    // 创建新网关
    const handleCreate = () => {
        setInitialValues({
            name: "",
            description: "",
            allowMCPs: [],
        });
        setIsModalOpen(true);
    };
    const columns = [
        {
            title: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `name`,
            dataIndex: "name",
            key: "name",
            render: (text, record) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { content: record.description },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "cursor-pointer" }, text))),
        },
        {
            title: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `operation`,
            dataIndex: "operation",
            key: "operation",
            render: (text, record) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap gap-2" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { onClick: () => handleEdit(record) }, (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Edit`),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_7__["default"], { title: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Sure to delete?`, onConfirm: () => handleDelete(record.name) },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", null, (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Delete`)))),
        },
    ];
    return react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_8__["default"], null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_9__["default"], { onClick: handleCreate, type: "primary" }, (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Create Gateway`)),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { pagination: false, rowKey: "name", dataSource: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.MCP_GateWay.get().data, columns: columns }),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(GatewayModal, { open: isModalOpen, onCreate: handleCreateOrUpdateGateway, onCancel: () => setIsModalOpen(false), initialValues: initialValues })));
}
// 表单组件
const GatewayForm = ({ initialValues, onFormInstanceReady, }) => {
    const [refresh, setRefresh] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    const [form] = antd__WEBPACK_IMPORTED_MODULE_11__["default"].useForm();
    const { mcpClients } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_3__.HeaderContext);
    const [name, setName] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(initialValues.name || "");
    let config = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)({
        port: 0,
        password: "",
    });
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            const c = await (0,_src_common_call__WEBPACK_IMPORTED_MODULE_4__.call)("getConfig");
            config.current.port = c.port;
            config.current.password = c.password;
            setRefresh((prev) => prev + 1);
        })();
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        onFormInstanceReady(form);
    }, []);
    let urls = ({
        sse: `${location.protocol}//${location.hostname}:${config.current.port}/${config.current.password}/mcp/${name}/sse`,
        streamableHttp: `${location.protocol}//${location.hostname}:${config.current.port}/${config.current.password}/mcp/${name}/mcp`,
    });
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { form: form, name: "gateway_form", initialValues: initialValues },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { className: "hidden", name: "key", label: "key" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], null)),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "name", label: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `name`, rules: [{ required: true, pattern: /^[a-zA-Z0-9]+$/, message: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Only allow alphanumeric characters` }] },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { placeholder: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Please enter name`, onChange: e => {
                    setName(e.target.value);
                } })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "description", label: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `description` },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"].TextArea, { placeholder: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Please enter description`, rows: 3 })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { name: "allowMCPs", label: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `allowMCPs`, rules: [{ required: true, message: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Please select allowed MCP` }] },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { multiple: true, treeCheckable: true, placeholder: (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Please select allowed MCP`, showCheckedStrategy: antd__WEBPACK_IMPORTED_MODULE_13__["default"].SHOW_PARENT, treeData: mcpClients?.filter(x => x.status != "disabled")?.map((x) => {
                    return {
                        title: x.name,
                        key: x.name,
                        value: x.name,
                        children: x.tools.map((t) => {
                            return {
                                title: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { title: t.function.description },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, t.origin_name || t.function.name))),
                                key: t.restore_name,
                                value: t.restore_name,
                            };
                        }),
                    };
                }) || [] })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { label: "sse" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { disabled: true, value: urls.sse, addonAfter: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: async () => {
                        await (0,_src_common_call__WEBPACK_IMPORTED_MODULE_4__.call)("setClipboardText", [urls.sse]);
                        antd__WEBPACK_IMPORTED_MODULE_5__["default"].success((0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Copied to clipboard`);
                    } }) })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"].Item, { label: "streamableHttp" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], { disabled: true, value: urls.streamableHttp, addonAfter: react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ant_design_icons__WEBPACK_IMPORTED_MODULE_14__["default"], { onClick: async () => {
                        await (0,_src_common_call__WEBPACK_IMPORTED_MODULE_4__.call)("setClipboardText", [urls.streamableHttp]);
                        antd__WEBPACK_IMPORTED_MODULE_5__["default"].success((0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Copied to clipboard`);
                    } }) }))));
};
// 模态框组件
const GatewayModal = ({ open, onCreate, onCancel, initialValues, }) => {
    const [formInstance, setFormInstance] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], { width: 800, open: open, title: initialValues.key ? (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Edit Gateway` : (0,_src_i18n__WEBPACK_IMPORTED_MODULE_1__.t) `Create Gateway`, okButtonProps: { autoFocus: true, loading: loading }, onCancel: onCancel, destroyOnClose: true, onOk: async () => {
            try {
                setLoading(true);
                const values = await formInstance?.validateFields();
                formInstance?.resetFields();
                await onCreate(values);
                setLoading(false);
            }
            catch (error) {
                setLoading(false);
                console.log("Failed:", error);
            }
        } },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(GatewayForm, { initialValues: initialValues, onFormInstanceReady: (instance) => {
                setFormInstance(instance);
            } })));
};

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
        // 1750832795416
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
/******/ 	__webpack_require__.h = () => ("4d7e54722fbb12d6f2f9")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.1110cef51afd02052f47.hot-update.js.map