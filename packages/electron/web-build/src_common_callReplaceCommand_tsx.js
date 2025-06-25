"use strict";
(globalThis["webpackChunkweb"] = globalThis["webpackChunkweb"] || []).push([["src_common_callReplaceCommand_tsx"],{

/***/ "./src/common/callReplaceCommand.tsx":
/*!*******************************************!*\
  !*** ./src/common/callReplaceCommand.tsx ***!
  \*******************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   replaceCommand: () => (/* binding */ replaceCommand)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _call__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./call */ "./src/common/call.ts");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var _components_pre__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/pre */ "./src/components/pre.tsx");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_call__WEBPACK_IMPORTED_MODULE_1__]);
_call__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];




const replaceCommand = {
    setClipboardText: async (text) => {
        const copy = (text) => {
            if (navigator.clipboard && window.isSecureContext) {
                // Use the modern Clipboard API when available and in secure context
                navigator.clipboard.writeText(text).catch((err) => {
                    console.error("Failed to copy text using Clipboard API:", err);
                    fallbackCopy(text);
                });
            }
            else {
                fallbackCopy(text);
            }
        };
        const fallbackCopy = (text) => {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "absolute";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        };
        copy(text);
    },
    openExplorer: async (path) => {
        let res = await _call__WEBPACK_IMPORTED_MODULE_1__.ext.invert("readFile", [path, ""]);
        antd__WEBPACK_IMPORTED_MODULE_3__["default"].info({
            title: 'File Content',
            width: "80%",
            style: {
                maxWidth: 1024,
            },
            maskClosable: true,
            content: (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_components_pre__WEBPACK_IMPORTED_MODULE_2__.Pre, null, res.data)),
            onOk() { },
        });
    },
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

}]);
//# sourceMappingURL=src_common_callReplaceCommand_tsx.js.map