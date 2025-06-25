"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/App.tsx":
/*!*********************!*\
  !*** ./src/App.tsx ***!
  \*********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react-router-dom */ "./node_modules/react-router/dist/index.js");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react-router-dom */ "./node_modules/react-router-dom/dist/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/spin/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/app/index.js");
/* harmony import */ var _router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./router */ "./src/router.tsx");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _common_call__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./common/call */ "./src/common/call.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_router__WEBPACK_IMPORTED_MODULE_1__, _common_call__WEBPACK_IMPORTED_MODULE_3__]);
([_router__WEBPACK_IMPORTED_MODULE_1__, _common_call__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);


// 引入 Ant Design 相关组件和图标




/**
 * App 组件为 Web 前端的主入口：
 * - 初始化全局数据（如 electronData）
 * - 自动同步 WebDAV 数据（如开启 autoSync）
 * - 提供全局 loading 状态
 * - 渲染主路由结构和全局 Spin 加载指示
 */
function App() {
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false); // 控制全局加载状态
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        (async () => {
            // 初始化 electronData，自动同步 WebDAV 数据
            let st = await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_2__.electronData.init();
            if (st.autoSync) {
                setLoading(true);
                try {
                    // 触发 WebDAV 同步
                    await (0,_common_call__WEBPACK_IMPORTED_MODULE_3__.call)("webDavSync", []);
                    setLoading(false);
                }
                catch (e) {
                    setLoading(false);
                    console.error(e); // 同步失败时输出错误
                }
            }
        })();
    }, []);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_4__["default"], { spinning:  false && 0, tip: "Syncing..." },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"], null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react_router_dom__WEBPACK_IMPORTED_MODULE_6__.Routes, null, (0,_router__WEBPACK_IMPORTED_MODULE_1__.getRoute)((0,_router__WEBPACK_IMPORTED_MODULE_1__.getLayoutRoute)()))))));
}
/**
 * NoMatch 组件：用于未匹配到路由时的兜底页面
 */
function NoMatch() {
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "Nothing to see here!"),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react_router_dom__WEBPACK_IMPORTED_MODULE_7__.Link, { to: "/" }, "Go to the home page"))));
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
        // 1750832924260
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
/******/ 	__webpack_require__.h = () => ("75ef8afeffc3d5c924bf")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.c08257d34bd0f5826ec5.hot-update.js.map