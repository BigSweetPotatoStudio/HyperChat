"use strict";
globalThis["webpackHotUpdateweb"]("index",{

/***/ "./src/components/ai.ts":
/*!******************************!*\
  !*** ./src/components/ai.ts ***!
  \******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   genCronExpression: () => (/* binding */ genCronExpression),
/* harmony export */   getDefaultModelConfig: () => (/* binding */ getDefaultModelConfig),
/* harmony export */   getDefaultModelConfigSync: () => (/* binding */ getDefaultModelConfigSync),
/* harmony export */   rename: () => (/* binding */ rename)
/* harmony export */ });
/* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! zod */ "./node_modules/zod/lib/index.mjs");
/* harmony import */ var _shared_data_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../shared/data.mjs */ "../shared/data.mts");
/* harmony import */ var _common_event__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common/event */ "./src/common/event.ts");
/* harmony import */ var _common_openai_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/openai.js */ "./src/common/openai.ts");
/* harmony import */ var openai_helpers_zod__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! openai/helpers/zod */ "./node_modules/openai/helpers/zod.mjs");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_openai_js__WEBPACK_IMPORTED_MODULE_2__]);
_common_openai_js__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];





async function getDefaultModelConfig() {
    // const BaseResponseSchema = z.object({ status: z.string() });
    // // Invalid JSON Schema for Structured Outputs
    // const json = zodResponseFormat(BaseResponseSchema, 'final_schema');
    // console.log(json);
    let config = undefined;
    await _shared_data_mjs__WEBPACK_IMPORTED_MODULE_0__.GPT_MODELS.init();
    if (config == null) {
        config = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_0__.GPT_MODELS.get().data.find(m => m.isDefault);
    }
    if (config == null) {
        if (_shared_data_mjs__WEBPACK_IMPORTED_MODULE_0__.GPT_MODELS.get().data.length == 0) {
            _common_event__WEBPACK_IMPORTED_MODULE_1__.EVENT.fire("setIsModelConfigOpenTrue");
            throw new Error("Please add LLM first");
        }
        config = _shared_data_mjs__WEBPACK_IMPORTED_MODULE_0__.GPT_MODELS.get().data[0];
    }
    return config;
}
function getDefaultModelConfigSync(models) {
    let config = undefined;
    if (config == null) {
        config = models.get().data.find(m => m.isDefault);
    }
    if (config == null) {
        config = models.get().data[0];
    }
    return config;
}
async function rename(messages) {
    let config = await getDefaultModelConfig();
    try {
        let openaiClient = new _common_openai_js__WEBPACK_IMPORTED_MODULE_2__.OpenAiChannel({
            ...config,
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
            supportTool: false,
            requestType: "complete",
        }, messages);
        let res = await openaiClient.completionParse((0,openai_helpers_zod__WEBPACK_IMPORTED_MODULE_3__.zodResponseFormat)(zod__WEBPACK_IMPORTED_MODULE_4__.z.object({
            name: zod__WEBPACK_IMPORTED_MODULE_4__.z.string({
                description: "Summarize this chat record"
            }),
        }), "test"));
        // console.log(res);
        return res.name;
    }
    catch (e) {
        return e.message;
    }
}
async function genCronExpression(message) {
    let config = await getDefaultModelConfig();
    try {
        let openaiClient = new _common_openai_js__WEBPACK_IMPORTED_MODULE_2__.OpenAiChannel({
            ...config,
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
            supportTool: false,
            requestType: "complete",
        }, [{
                role: "system",
                content: "You are a cron expression generator. Please generate a cron expression for the following message.",
            }, {
                role: "user",
                content: message,
            }]);
        let res = await openaiClient.completionParse((0,openai_helpers_zod__WEBPACK_IMPORTED_MODULE_3__.zodResponseFormat)(zod__WEBPACK_IMPORTED_MODULE_4__.z.object({
            cron: zod__WEBPACK_IMPORTED_MODULE_4__.z.string({
                description: "This is a cron expression"
            }),
        }), "test"));
        // console.log(res);
        return res.cron;
    }
    catch (e) {
        return e.message;
    }
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
        // 1750832900905
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
/******/ 	__webpack_require__.h = () => ("c08257d34bd0f5826ec5")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=index.6d144816253894f8c32b.hot-update.js.map