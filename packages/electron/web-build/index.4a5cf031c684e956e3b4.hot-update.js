"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/pages/knowledgeBase/knowledgeBaseModal.tsx":
/*!********************************************************!*\
  !*** ./src/pages/knowledgeBase/knowledgeBaseModal.tsx ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KnowledgeBaseModal: () => (/* binding */ KnowledgeBaseModal)
/* harmony export */ });
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/form/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/input/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/select/index.js");
/* harmony import */ var antd__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! antd */ "./node_modules/antd/es/modal/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../i18n */ "./src/i18n.ts");




const ModalForm = ({ initialValues, onFormInstanceReady, }) => {
    const [form] = antd__WEBPACK_IMPORTED_MODULE_3__["default"].useForm();
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
        onFormInstanceReady(form);
    }, []);
    const [num, setNum] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
    const refresh = () => {
        setNum((x) => x + 1);
    };
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_3__["default"], { form: form, name: "form_in_modal", initialValues: initialValues },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_3__["default"].Item, { className: "hidden", name: "key", label: "key" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_4__["default"], null)),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_3__["default"].Item, { name: "name", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `name`, rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter` }] },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_4__["default"], { placeholder: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter` })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_3__["default"].Item, { name: "model", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `model`, rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter` }] },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_5__["default"], { placeholder: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please select`, options: _shared_data_mjs__WEBPACK_IMPORTED_MODULE_1__.GPT_MODELS.get()
                    .data.filter((x) => x.type == "embedding")
                    .map((x) => {
                    return {
                        label: x.name,
                        value: x.key,
                    };
                }), disabled: form.getFieldValue("key") })),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_3__["default"].Item, { name: "description", label: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `description`, rules: [{ required: true, message: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter` }] },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_4__["default"].TextArea, { placeholder: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `Please enter`, rows: 4 }))));
};
const KnowledgeBaseModal = ({ open, onCreate, onCancel, initialValues, }) => {
    const [formInstance, setFormInstance] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(antd__WEBPACK_IMPORTED_MODULE_6__["default"], { width: 800, open: open, title: (0,_i18n__WEBPACK_IMPORTED_MODULE_2__.t) `KnowledgeBase`, okButtonProps: { autoFocus: true }, onCancel: onCancel, destroyOnClose: true, onOk: async () => {
            try {
                const values = await formInstance?.validateFields();
                formInstance?.resetFields();
                onCreate(values);
            }
            catch (error) {
                console.log("Failed:", error);
            }
        } },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ModalForm, { initialValues: initialValues, onFormInstanceReady: (instance) => {
                setFormInstance(instance);
            } })));
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
        // 1750832878556
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
/******/ 	__webpack_require__.h = () => ("40f83eac4a5943391836")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.4a5cf031c684e956e3b4.hot-update.js.map