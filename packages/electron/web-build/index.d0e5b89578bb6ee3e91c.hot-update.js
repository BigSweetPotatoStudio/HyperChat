"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/knowledgeBase/knowledgeBase.tsx":
/*!***************************************************!*\
  !*** ./src/pages/knowledgeBase/knowledgeBase.tsx ***!
  \***************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KnowledgeBase: () => (/* binding */ KnowledgeBase)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../common/call */ "./src/common/call.ts");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popover/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/popconfirm/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/space/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/button/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/table/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/message/index.js");
/* harmony import */ var _common_progress__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/progress */ "./src/common/progress.tsx");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _knowledgeBaseModal__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./knowledgeBaseModal */ "./src/pages/knowledgeBase/knowledgeBaseModal.tsx");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var _knowledgeBaseResourceModal__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./knowledgeBaseResourceModal */ "./src/pages/knowledgeBase/knowledgeBaseResourceModal.tsx");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");
/* harmony import */ var _common_context__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../common/context */ "./src/common/context.ts");
/* harmony import */ var _common_util__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../common/util */ "./src/common/util.tsx");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common_progress__WEBPACK_IMPORTED_MODULE_2__, _knowledgeBaseResourceModal__WEBPACK_IMPORTED_MODULE_5__]);
([_common_call__WEBPACK_IMPORTED_MODULE_1__, _common_progress__WEBPACK_IMPORTED_MODULE_2__, _knowledgeBaseResourceModal__WEBPACK_IMPORTED_MODULE_5__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);











const { Search } = antd__WEBPACK_IMPORTED_MODULE_9__["default"];
function KnowledgeBase() {
    const [num, setNum] = react__WEBPACK_IMPORTED_MODULE_0___default().useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const { globalState, updateGlobalState } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(_common_context__WEBPACK_IMPORTED_MODULE_7__.HeaderContext);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.init();
            refresh();
        })();
    }, []);
    const [isOpenProgress, setIsOpenProgress] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [currRowKnowledgeBase, setCurrRowKnowledgeBase] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
    const columns = [
        {
            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `name`,
            dataIndex: "name",
            key: "name",
            render: (text, record) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_10__["default"], { title: "model: " + record.model, content: record.description },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "cursor-pointer" }, text))),
        },
        {
            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `operation`,
            dataIndex: "operation",
            key: "operation",
            render: (text, record) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap gap-2" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { onClick: () => {
                        setCurrRowKnowledgeBase(record);
                        setIsOpenKnowledgeBase(true);
                    } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Edit`),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { onClick: () => {
                        setCurrRowKnowledgeBase(record);
                    } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Open`),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Sure to delete?`, onConfirm: async () => {
                        await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("vectorStoreDelete", [record]);
                        _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList.filter((x) => x.key !== record.key);
                        await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.save();
                        (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", ["hyper_knowledge_base"]);
                        refresh();
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Delete`)))),
        },
    ];
    const [isOpenKnowledgeBase, setIsOpenKnowledgeBase] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [isOpenResource, setIsOpenResource] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [loadingSearch, setLoadingSearch] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-1/3" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], null,
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { onClick: () => {
                            setCurrRowKnowledgeBase({});
                            setIsOpenKnowledgeBase(true);
                        }, type: "primary" }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Create`)),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { pagination: false, rowKey: "key", dataSource: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList, columns: columns })),
            currRowKnowledgeBase.key && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-full lg:w-2/3" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap justify-between" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_12__["default"], null,
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_13__["default"], { type: "primary", onClick: () => {
                                setIsOpenResource(true);
                            } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Add`),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Search, { onSearch: async (e) => {
                                // console.log("searchValue", e);
                                setLoadingSearch(true);
                                let res = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("vectorStoreSearch", [
                                    currRowKnowledgeBase,
                                    e,
                                    5,
                                ]);
                                antd__WEBPACK_IMPORTED_MODULE_15__["default"].info({
                                    title: "Search Result",
                                    width: 1200,
                                    maskClosable: true,
                                    content: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { pagination: false, rowKey: "key", dataSource: res, columns: [
                                            {
                                                title: "pageContent",
                                                dataIndex: "pageContent",
                                                key: "pageContent",
                                            },
                                            {
                                                title: "score",
                                                dataIndex: "score",
                                                key: "score",
                                            },
                                        ] })),
                                });
                                setLoadingSearch(false);
                            }, placeholder: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `test search`, enterButton: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Search`, loading: loadingSearch }))),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_14__["default"], { rowKey: "key", pagination: false, dataSource: currRowKnowledgeBase.resources, columns: [
                        {
                            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Name`,
                            dataIndex: "name",
                            key: "name",
                        },
                        {
                            title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `FilePath`,
                            dataIndex: "filepath",
                            key: "filepath",
                            render: (text, record) => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex flex-wrap gap-2" },
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", { onClick: async () => {
                                        // let f = await call("pathJoin", [record.filepath]);
                                        let e = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("exists", [record.filepath]);
                                        if (e) {
                                            let p = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("pathJoin", [record.filepath]);
                                            await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openExplorer", [p]);
                                        }
                                        else {
                                            antd__WEBPACK_IMPORTED_MODULE_16__["default"].error("file not exists");
                                        }
                                    } }, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Open`),
                                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_11__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Sure to delete?`, onConfirm: async () => {
                                        let f = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("vectorStoreRemoveResource", [
                                            currRowKnowledgeBase,
                                            record,
                                        ]);
                                        currRowKnowledgeBase.resources =
                                            currRowKnowledgeBase.resources.filter((x) => {
                                                return x.key !== record.key;
                                            });
                                        _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.save();
                                        antd__WEBPACK_IMPORTED_MODULE_16__["default"].success("remove success");
                                        refresh();
                                    } },
                                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", null, (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Remove`)))),
                        },
                    ] })))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_15__["default"], { title: (0,_i18n__WEBPACK_IMPORTED_MODULE_6__.t) `Progress`, destroyOnClose: true, open: isOpenProgress, onOk: () => setIsOpenProgress(false), onCancel: () => setIsOpenProgress(false) },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_common_progress__WEBPACK_IMPORTED_MODULE_2__.MyProgress, null)),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_knowledgeBaseModal__WEBPACK_IMPORTED_MODULE_4__.KnowledgeBaseModal, { open: isOpenKnowledgeBase, initialValues: currRowKnowledgeBase, onCreate: async (v) => {
                if (_shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList.find((x) => x.name === v.name && x.key !== v.key)) {
                    antd__WEBPACK_IMPORTED_MODULE_16__["default"].warning("name already exists");
                    return;
                }
                if (currRowKnowledgeBase.key) {
                    let i = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList.findIndex((x) => x.key === currRowKnowledgeBase.key);
                    Object.assign(_shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList[i], v);
                }
                else {
                    v.key = (0,uuid__WEBPACK_IMPORTED_MODULE_17__["default"])();
                    v.resources = [];
                    _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.get().dbList.push(v);
                }
                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.save();
                (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("openMcpClient", ["hyper_knowledge_base"]);
                setIsOpenKnowledgeBase(false);
            }, onCancel: () => {
                setIsOpenKnowledgeBase(false);
            } }),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_knowledgeBaseResourceModal__WEBPACK_IMPORTED_MODULE_5__.KnowledgeBaseResourceModal, { open: isOpenResource, initialValues: {}, onCreate: async (v) => {
                v.key = (0,uuid__WEBPACK_IMPORTED_MODULE_17__["default"])();
                let r = await (0,_common_call__WEBPACK_IMPORTED_MODULE_1__.call)("vectorStoreAdd", [currRowKnowledgeBase, v, _common_util__WEBPACK_IMPORTED_MODULE_8__.isOnBrowser]);
                if (!Array.isArray(currRowKnowledgeBase.resources)) {
                    currRowKnowledgeBase.resources = [];
                }
                currRowKnowledgeBase.resources.push(r);
                await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_BASE.save();
                setIsOpenResource(false);
                refresh();
            }, onCancel: () => {
                setIsOpenResource(false);
            } })));
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
        // 1750832892900
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
/******/ 	__webpack_require__.h = () => ("6d144816253894f8c32b")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.d0e5b89578bb6ee3e91c.hot-update.js.map