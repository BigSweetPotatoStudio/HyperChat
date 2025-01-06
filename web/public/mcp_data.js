(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === "object" && typeof module === "object")
    module.exports = factory();
  else if (typeof define === "function" && define.amd) define([], factory);
  else {
    var a = factory();
    for (var i in a) (typeof exports === "object" ? exports : root)[i] = a[i];
  }
})(self, () => {
  return /******/ (() => {
    // webpackBootstrap
    /******/ "use strict";
    /******/ var __webpack_modules__ = {
      /***/ "./src/@modelcontextprotocol/server-filesystem/index.ts":
        /*!**************************************************************!*\
  !*** ./src/@modelcontextprotocol/server-filesystem/index.ts ***!
  \**************************************************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var zod_to_json_schema__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! zod-to-json-schema */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js",
            );
          /* harmony import */ var _mcp__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(/*! ../../mcp */ "./src/mcp.ts");

          const config = zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
            path: zod__WEBPACK_IMPORTED_MODULE_2__.z.string({
              required_error: "Path is required",
              description: "allow path",
            }),
          });
          const p = {
            type: "npx",
            name: "@modelcontextprotocol/server-filesystem",
            github: "https://github.com/modelcontextprotocol/servers.git",
            description: "Server filesystem",
            keywords: ["server", "filesystem"],
            resolve: (config) => {
              return {
                command: "npx",
                args: [
                  "-y",
                  "@modelcontextprotocol/server-filesystem",
                  config.path,
                ],
                env: {},
              };
            },
            configSchema: (0,
            zod_to_json_schema__WEBPACK_IMPORTED_MODULE_0__.zodToJsonSchema)(
              config,
            ),
          };
          _mcp__WEBPACK_IMPORTED_MODULE_1__.MCP.register(p);

          /***/
        },

      /***/ "./src/mcp-obsidian/index.ts":
        /*!***********************************!*\
  !*** ./src/mcp-obsidian/index.ts ***!
  \***********************************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var zod_to_json_schema__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! zod-to-json-schema */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js",
            );
          /* harmony import */ var _mcp__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(/*! ../mcp */ "./src/mcp.ts");

          const config = zod__WEBPACK_IMPORTED_MODULE_2__.z.object({
            path: zod__WEBPACK_IMPORTED_MODULE_2__.z.string({
              required_error: "Path is required",
              description: "obsidian note path",
            }),
          });
          const p = {
            type: "npx",
            name: "mcp-obsidian",
            github: "https://github.com/MarkusPfundstein/mcp-obsidian",
            description: "obsidian",
            keywords: ["obsidian"],
            resolve: (config) => {
              return {
                command: "npx",
                args: ["-y", "mcp-obsidian", config.path],
                env: {},
              };
            },
            configSchema: (0,
            zod_to_json_schema__WEBPACK_IMPORTED_MODULE_0__.zodToJsonSchema)(
              config,
            ),
          };
          _mcp__WEBPACK_IMPORTED_MODULE_1__.MCP.register(p);

          /***/
        },

      /***/ "./src/mcp.ts":
        /*!********************!*\
  !*** ./src/mcp.ts ***!
  \********************/
        /***/ (
          __unused_webpack_module,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ MCP: () => /* binding */ MCP,
            /* harmony export */
          });
          class MCPServers {
            data = [];
            register(p) {
              this.data.push(p);
            }
          }
          const MCP = new MCPServers();

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js":
        /*!*********************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js ***!
  \*********************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ defaultOptions: () =>
              /* binding */ defaultOptions,
            /* harmony export */ getDefaultOptions: () =>
              /* binding */ getDefaultOptions,
            /* harmony export */ ignoreOverride: () =>
              /* binding */ ignoreOverride,
            /* harmony export */
          });
          const ignoreOverride = Symbol(
            "Let zodToJsonSchema decide on which parser to use",
          );
          const defaultOptions = {
            name: undefined,
            $refStrategy: "root",
            basePath: ["#"],
            effectStrategy: "input",
            pipeStrategy: "all",
            dateStrategy: "format:date-time",
            mapStrategy: "entries",
            removeAdditionalStrategy: "passthrough",
            definitionPath: "definitions",
            target: "jsonSchema7",
            strictUnions: false,
            definitions: {},
            errorMessages: false,
            markdownDescription: false,
            patternStrategy: "escape",
            applyRegexFlags: false,
            emailStrategy: "format:email",
            base64Strategy: "contentEncoding:base64",
            nameStrategy: "ref",
          };
          const getDefaultOptions = (options) =>
            typeof options === "string"
              ? {
                  ...defaultOptions,
                  name: options,
                }
              : {
                  ...defaultOptions,
                  ...options,
                };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js":
        /*!******************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js ***!
  \******************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ getRefs: () => /* binding */ getRefs,
            /* harmony export */
          });
          /* harmony import */ var _Options_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ./Options.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js",
            );

          const getRefs = (options) => {
            const _options = (0,
            _Options_js__WEBPACK_IMPORTED_MODULE_0__.getDefaultOptions)(
              options,
            );
            const currentPath =
              _options.name !== undefined
                ? [..._options.basePath, _options.definitionPath, _options.name]
                : _options.basePath;
            return {
              ..._options,
              currentPath: currentPath,
              propertyPath: undefined,
              seen: new Map(
                Object.entries(_options.definitions).map(([name, def]) => [
                  def._def,
                  {
                    def: def._def,
                    path: [..._options.basePath, _options.definitionPath, name],
                    // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
                    jsonSchema: undefined,
                  },
                ]),
              ),
            };
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ addErrorMessage: () =>
              /* binding */ addErrorMessage,
            /* harmony export */ setResponseValueAndErrors: () =>
              /* binding */ setResponseValueAndErrors,
            /* harmony export */
          });
          function addErrorMessage(res, key, errorMessage, refs) {
            if (!refs?.errorMessages) return;
            if (errorMessage) {
              res.errorMessage = {
                ...res.errorMessage,
                [key]: errorMessage,
              };
            }
          }
          function setResponseValueAndErrors(
            res,
            key,
            value,
            errorMessage,
            refs,
          ) {
            res[key] = value;
            addErrorMessage(res, key, errorMessage, refs);
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js":
        /*!*******************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js ***!
  \*******************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ addErrorMessage: () =>
              /* reexport safe */ _errorMessages_js__WEBPACK_IMPORTED_MODULE_2__.addErrorMessage,
            /* harmony export */ default: () => __WEBPACK_DEFAULT_EXPORT__,
            /* harmony export */ defaultOptions: () =>
              /* reexport safe */ _Options_js__WEBPACK_IMPORTED_MODULE_0__.defaultOptions,
            /* harmony export */ getDefaultOptions: () =>
              /* reexport safe */ _Options_js__WEBPACK_IMPORTED_MODULE_0__.getDefaultOptions,
            /* harmony export */ getRefs: () =>
              /* reexport safe */ _Refs_js__WEBPACK_IMPORTED_MODULE_1__.getRefs,
            /* harmony export */ ignoreOverride: () =>
              /* reexport safe */ _Options_js__WEBPACK_IMPORTED_MODULE_0__.ignoreOverride,
            /* harmony export */ parseAnyDef: () =>
              /* reexport safe */ _parsers_any_js__WEBPACK_IMPORTED_MODULE_4__.parseAnyDef,
            /* harmony export */ parseArrayDef: () =>
              /* reexport safe */ _parsers_array_js__WEBPACK_IMPORTED_MODULE_5__.parseArrayDef,
            /* harmony export */ parseBigintDef: () =>
              /* reexport safe */ _parsers_bigint_js__WEBPACK_IMPORTED_MODULE_6__.parseBigintDef,
            /* harmony export */ parseBooleanDef: () =>
              /* reexport safe */ _parsers_boolean_js__WEBPACK_IMPORTED_MODULE_7__.parseBooleanDef,
            /* harmony export */ parseBrandedDef: () =>
              /* reexport safe */ _parsers_branded_js__WEBPACK_IMPORTED_MODULE_8__.parseBrandedDef,
            /* harmony export */ parseCatchDef: () =>
              /* reexport safe */ _parsers_catch_js__WEBPACK_IMPORTED_MODULE_9__.parseCatchDef,
            /* harmony export */ parseDateDef: () =>
              /* reexport safe */ _parsers_date_js__WEBPACK_IMPORTED_MODULE_10__.parseDateDef,
            /* harmony export */ parseDef: () =>
              /* reexport safe */ _parseDef_js__WEBPACK_IMPORTED_MODULE_3__.parseDef,
            /* harmony export */ parseDefaultDef: () =>
              /* reexport safe */ _parsers_default_js__WEBPACK_IMPORTED_MODULE_11__.parseDefaultDef,
            /* harmony export */ parseEffectsDef: () =>
              /* reexport safe */ _parsers_effects_js__WEBPACK_IMPORTED_MODULE_12__.parseEffectsDef,
            /* harmony export */ parseEnumDef: () =>
              /* reexport safe */ _parsers_enum_js__WEBPACK_IMPORTED_MODULE_13__.parseEnumDef,
            /* harmony export */ parseIntersectionDef: () =>
              /* reexport safe */ _parsers_intersection_js__WEBPACK_IMPORTED_MODULE_14__.parseIntersectionDef,
            /* harmony export */ parseLiteralDef: () =>
              /* reexport safe */ _parsers_literal_js__WEBPACK_IMPORTED_MODULE_15__.parseLiteralDef,
            /* harmony export */ parseMapDef: () =>
              /* reexport safe */ _parsers_map_js__WEBPACK_IMPORTED_MODULE_16__.parseMapDef,
            /* harmony export */ parseNativeEnumDef: () =>
              /* reexport safe */ _parsers_nativeEnum_js__WEBPACK_IMPORTED_MODULE_17__.parseNativeEnumDef,
            /* harmony export */ parseNeverDef: () =>
              /* reexport safe */ _parsers_never_js__WEBPACK_IMPORTED_MODULE_18__.parseNeverDef,
            /* harmony export */ parseNullDef: () =>
              /* reexport safe */ _parsers_null_js__WEBPACK_IMPORTED_MODULE_19__.parseNullDef,
            /* harmony export */ parseNullableDef: () =>
              /* reexport safe */ _parsers_nullable_js__WEBPACK_IMPORTED_MODULE_20__.parseNullableDef,
            /* harmony export */ parseNumberDef: () =>
              /* reexport safe */ _parsers_number_js__WEBPACK_IMPORTED_MODULE_21__.parseNumberDef,
            /* harmony export */ parseObjectDef: () =>
              /* reexport safe */ _parsers_object_js__WEBPACK_IMPORTED_MODULE_22__.parseObjectDef,
            /* harmony export */ parseOptionalDef: () =>
              /* reexport safe */ _parsers_optional_js__WEBPACK_IMPORTED_MODULE_23__.parseOptionalDef,
            /* harmony export */ parsePipelineDef: () =>
              /* reexport safe */ _parsers_pipeline_js__WEBPACK_IMPORTED_MODULE_24__.parsePipelineDef,
            /* harmony export */ parsePromiseDef: () =>
              /* reexport safe */ _parsers_promise_js__WEBPACK_IMPORTED_MODULE_25__.parsePromiseDef,
            /* harmony export */ parseReadonlyDef: () =>
              /* reexport safe */ _parsers_readonly_js__WEBPACK_IMPORTED_MODULE_26__.parseReadonlyDef,
            /* harmony export */ parseRecordDef: () =>
              /* reexport safe */ _parsers_record_js__WEBPACK_IMPORTED_MODULE_27__.parseRecordDef,
            /* harmony export */ parseSetDef: () =>
              /* reexport safe */ _parsers_set_js__WEBPACK_IMPORTED_MODULE_28__.parseSetDef,
            /* harmony export */ parseStringDef: () =>
              /* reexport safe */ _parsers_string_js__WEBPACK_IMPORTED_MODULE_29__.parseStringDef,
            /* harmony export */ parseTupleDef: () =>
              /* reexport safe */ _parsers_tuple_js__WEBPACK_IMPORTED_MODULE_30__.parseTupleDef,
            /* harmony export */ parseUndefinedDef: () =>
              /* reexport safe */ _parsers_undefined_js__WEBPACK_IMPORTED_MODULE_31__.parseUndefinedDef,
            /* harmony export */ parseUnionDef: () =>
              /* reexport safe */ _parsers_union_js__WEBPACK_IMPORTED_MODULE_32__.parseUnionDef,
            /* harmony export */ parseUnknownDef: () =>
              /* reexport safe */ _parsers_unknown_js__WEBPACK_IMPORTED_MODULE_33__.parseUnknownDef,
            /* harmony export */ primitiveMappings: () =>
              /* reexport safe */ _parsers_union_js__WEBPACK_IMPORTED_MODULE_32__.primitiveMappings,
            /* harmony export */ setResponseValueAndErrors: () =>
              /* reexport safe */ _errorMessages_js__WEBPACK_IMPORTED_MODULE_2__.setResponseValueAndErrors,
            /* harmony export */ zodPatterns: () =>
              /* reexport safe */ _parsers_string_js__WEBPACK_IMPORTED_MODULE_29__.zodPatterns,
            /* harmony export */ zodToJsonSchema: () =>
              /* reexport safe */ _zodToJsonSchema_js__WEBPACK_IMPORTED_MODULE_34__.zodToJsonSchema,
            /* harmony export */
          });
          /* harmony import */ var _Options_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ./Options.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js",
            );
          /* harmony import */ var _Refs_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./Refs.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js",
            );
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! ./errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_3__ =
            __webpack_require__(
              /*! ./parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );
          /* harmony import */ var _parsers_any_js__WEBPACK_IMPORTED_MODULE_4__ =
            __webpack_require__(
              /*! ./parsers/any.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js",
            );
          /* harmony import */ var _parsers_array_js__WEBPACK_IMPORTED_MODULE_5__ =
            __webpack_require__(
              /*! ./parsers/array.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js",
            );
          /* harmony import */ var _parsers_bigint_js__WEBPACK_IMPORTED_MODULE_6__ =
            __webpack_require__(
              /*! ./parsers/bigint.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js",
            );
          /* harmony import */ var _parsers_boolean_js__WEBPACK_IMPORTED_MODULE_7__ =
            __webpack_require__(
              /*! ./parsers/boolean.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js",
            );
          /* harmony import */ var _parsers_branded_js__WEBPACK_IMPORTED_MODULE_8__ =
            __webpack_require__(
              /*! ./parsers/branded.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js",
            );
          /* harmony import */ var _parsers_catch_js__WEBPACK_IMPORTED_MODULE_9__ =
            __webpack_require__(
              /*! ./parsers/catch.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js",
            );
          /* harmony import */ var _parsers_date_js__WEBPACK_IMPORTED_MODULE_10__ =
            __webpack_require__(
              /*! ./parsers/date.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js",
            );
          /* harmony import */ var _parsers_default_js__WEBPACK_IMPORTED_MODULE_11__ =
            __webpack_require__(
              /*! ./parsers/default.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js",
            );
          /* harmony import */ var _parsers_effects_js__WEBPACK_IMPORTED_MODULE_12__ =
            __webpack_require__(
              /*! ./parsers/effects.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js",
            );
          /* harmony import */ var _parsers_enum_js__WEBPACK_IMPORTED_MODULE_13__ =
            __webpack_require__(
              /*! ./parsers/enum.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js",
            );
          /* harmony import */ var _parsers_intersection_js__WEBPACK_IMPORTED_MODULE_14__ =
            __webpack_require__(
              /*! ./parsers/intersection.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js",
            );
          /* harmony import */ var _parsers_literal_js__WEBPACK_IMPORTED_MODULE_15__ =
            __webpack_require__(
              /*! ./parsers/literal.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js",
            );
          /* harmony import */ var _parsers_map_js__WEBPACK_IMPORTED_MODULE_16__ =
            __webpack_require__(
              /*! ./parsers/map.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js",
            );
          /* harmony import */ var _parsers_nativeEnum_js__WEBPACK_IMPORTED_MODULE_17__ =
            __webpack_require__(
              /*! ./parsers/nativeEnum.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js",
            );
          /* harmony import */ var _parsers_never_js__WEBPACK_IMPORTED_MODULE_18__ =
            __webpack_require__(
              /*! ./parsers/never.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js",
            );
          /* harmony import */ var _parsers_null_js__WEBPACK_IMPORTED_MODULE_19__ =
            __webpack_require__(
              /*! ./parsers/null.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js",
            );
          /* harmony import */ var _parsers_nullable_js__WEBPACK_IMPORTED_MODULE_20__ =
            __webpack_require__(
              /*! ./parsers/nullable.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js",
            );
          /* harmony import */ var _parsers_number_js__WEBPACK_IMPORTED_MODULE_21__ =
            __webpack_require__(
              /*! ./parsers/number.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js",
            );
          /* harmony import */ var _parsers_object_js__WEBPACK_IMPORTED_MODULE_22__ =
            __webpack_require__(
              /*! ./parsers/object.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js",
            );
          /* harmony import */ var _parsers_optional_js__WEBPACK_IMPORTED_MODULE_23__ =
            __webpack_require__(
              /*! ./parsers/optional.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js",
            );
          /* harmony import */ var _parsers_pipeline_js__WEBPACK_IMPORTED_MODULE_24__ =
            __webpack_require__(
              /*! ./parsers/pipeline.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js",
            );
          /* harmony import */ var _parsers_promise_js__WEBPACK_IMPORTED_MODULE_25__ =
            __webpack_require__(
              /*! ./parsers/promise.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js",
            );
          /* harmony import */ var _parsers_readonly_js__WEBPACK_IMPORTED_MODULE_26__ =
            __webpack_require__(
              /*! ./parsers/readonly.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js",
            );
          /* harmony import */ var _parsers_record_js__WEBPACK_IMPORTED_MODULE_27__ =
            __webpack_require__(
              /*! ./parsers/record.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js",
            );
          /* harmony import */ var _parsers_set_js__WEBPACK_IMPORTED_MODULE_28__ =
            __webpack_require__(
              /*! ./parsers/set.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js",
            );
          /* harmony import */ var _parsers_string_js__WEBPACK_IMPORTED_MODULE_29__ =
            __webpack_require__(
              /*! ./parsers/string.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js",
            );
          /* harmony import */ var _parsers_tuple_js__WEBPACK_IMPORTED_MODULE_30__ =
            __webpack_require__(
              /*! ./parsers/tuple.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js",
            );
          /* harmony import */ var _parsers_undefined_js__WEBPACK_IMPORTED_MODULE_31__ =
            __webpack_require__(
              /*! ./parsers/undefined.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js",
            );
          /* harmony import */ var _parsers_union_js__WEBPACK_IMPORTED_MODULE_32__ =
            __webpack_require__(
              /*! ./parsers/union.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js",
            );
          /* harmony import */ var _parsers_unknown_js__WEBPACK_IMPORTED_MODULE_33__ =
            __webpack_require__(
              /*! ./parsers/unknown.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js",
            );
          /* harmony import */ var _zodToJsonSchema_js__WEBPACK_IMPORTED_MODULE_34__ =
            __webpack_require__(
              /*! ./zodToJsonSchema.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js",
            );

          /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ =
            _zodToJsonSchema_js__WEBPACK_IMPORTED_MODULE_34__.zodToJsonSchema;

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js":
        /*!**********************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js ***!
  \**********************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseDef: () => /* binding */ parseDef,
            /* harmony export */
          });
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_31__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var _parsers_any_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ./parsers/any.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js",
            );
          /* harmony import */ var _parsers_array_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./parsers/array.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js",
            );
          /* harmony import */ var _parsers_bigint_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! ./parsers/bigint.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js",
            );
          /* harmony import */ var _parsers_boolean_js__WEBPACK_IMPORTED_MODULE_3__ =
            __webpack_require__(
              /*! ./parsers/boolean.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js",
            );
          /* harmony import */ var _parsers_branded_js__WEBPACK_IMPORTED_MODULE_4__ =
            __webpack_require__(
              /*! ./parsers/branded.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js",
            );
          /* harmony import */ var _parsers_catch_js__WEBPACK_IMPORTED_MODULE_5__ =
            __webpack_require__(
              /*! ./parsers/catch.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js",
            );
          /* harmony import */ var _parsers_date_js__WEBPACK_IMPORTED_MODULE_6__ =
            __webpack_require__(
              /*! ./parsers/date.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js",
            );
          /* harmony import */ var _parsers_default_js__WEBPACK_IMPORTED_MODULE_7__ =
            __webpack_require__(
              /*! ./parsers/default.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js",
            );
          /* harmony import */ var _parsers_effects_js__WEBPACK_IMPORTED_MODULE_8__ =
            __webpack_require__(
              /*! ./parsers/effects.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js",
            );
          /* harmony import */ var _parsers_enum_js__WEBPACK_IMPORTED_MODULE_9__ =
            __webpack_require__(
              /*! ./parsers/enum.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js",
            );
          /* harmony import */ var _parsers_intersection_js__WEBPACK_IMPORTED_MODULE_10__ =
            __webpack_require__(
              /*! ./parsers/intersection.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js",
            );
          /* harmony import */ var _parsers_literal_js__WEBPACK_IMPORTED_MODULE_11__ =
            __webpack_require__(
              /*! ./parsers/literal.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js",
            );
          /* harmony import */ var _parsers_map_js__WEBPACK_IMPORTED_MODULE_12__ =
            __webpack_require__(
              /*! ./parsers/map.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js",
            );
          /* harmony import */ var _parsers_nativeEnum_js__WEBPACK_IMPORTED_MODULE_13__ =
            __webpack_require__(
              /*! ./parsers/nativeEnum.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js",
            );
          /* harmony import */ var _parsers_never_js__WEBPACK_IMPORTED_MODULE_14__ =
            __webpack_require__(
              /*! ./parsers/never.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js",
            );
          /* harmony import */ var _parsers_null_js__WEBPACK_IMPORTED_MODULE_15__ =
            __webpack_require__(
              /*! ./parsers/null.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js",
            );
          /* harmony import */ var _parsers_nullable_js__WEBPACK_IMPORTED_MODULE_16__ =
            __webpack_require__(
              /*! ./parsers/nullable.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js",
            );
          /* harmony import */ var _parsers_number_js__WEBPACK_IMPORTED_MODULE_17__ =
            __webpack_require__(
              /*! ./parsers/number.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js",
            );
          /* harmony import */ var _parsers_object_js__WEBPACK_IMPORTED_MODULE_18__ =
            __webpack_require__(
              /*! ./parsers/object.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js",
            );
          /* harmony import */ var _parsers_optional_js__WEBPACK_IMPORTED_MODULE_19__ =
            __webpack_require__(
              /*! ./parsers/optional.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js",
            );
          /* harmony import */ var _parsers_pipeline_js__WEBPACK_IMPORTED_MODULE_20__ =
            __webpack_require__(
              /*! ./parsers/pipeline.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js",
            );
          /* harmony import */ var _parsers_promise_js__WEBPACK_IMPORTED_MODULE_21__ =
            __webpack_require__(
              /*! ./parsers/promise.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js",
            );
          /* harmony import */ var _parsers_record_js__WEBPACK_IMPORTED_MODULE_22__ =
            __webpack_require__(
              /*! ./parsers/record.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js",
            );
          /* harmony import */ var _parsers_set_js__WEBPACK_IMPORTED_MODULE_23__ =
            __webpack_require__(
              /*! ./parsers/set.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js",
            );
          /* harmony import */ var _parsers_string_js__WEBPACK_IMPORTED_MODULE_24__ =
            __webpack_require__(
              /*! ./parsers/string.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js",
            );
          /* harmony import */ var _parsers_tuple_js__WEBPACK_IMPORTED_MODULE_25__ =
            __webpack_require__(
              /*! ./parsers/tuple.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js",
            );
          /* harmony import */ var _parsers_undefined_js__WEBPACK_IMPORTED_MODULE_26__ =
            __webpack_require__(
              /*! ./parsers/undefined.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js",
            );
          /* harmony import */ var _parsers_union_js__WEBPACK_IMPORTED_MODULE_27__ =
            __webpack_require__(
              /*! ./parsers/union.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js",
            );
          /* harmony import */ var _parsers_unknown_js__WEBPACK_IMPORTED_MODULE_28__ =
            __webpack_require__(
              /*! ./parsers/unknown.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js",
            );
          /* harmony import */ var _parsers_readonly_js__WEBPACK_IMPORTED_MODULE_29__ =
            __webpack_require__(
              /*! ./parsers/readonly.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js",
            );
          /* harmony import */ var _Options_js__WEBPACK_IMPORTED_MODULE_30__ =
            __webpack_require__(
              /*! ./Options.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js",
            );

          function parseDef(def, refs, forceResolution = false) {
            const seenItem = refs.seen.get(def);
            if (refs.override) {
              const overrideResult = refs.override?.(
                def,
                refs,
                seenItem,
                forceResolution,
              );
              if (
                overrideResult !==
                _Options_js__WEBPACK_IMPORTED_MODULE_30__.ignoreOverride
              ) {
                return overrideResult;
              }
            }
            if (seenItem && !forceResolution) {
              const seenSchema = get$ref(seenItem, refs);
              if (seenSchema !== undefined) {
                return seenSchema;
              }
            }
            const newItem = {
              def,
              path: refs.currentPath,
              jsonSchema: undefined,
            };
            refs.seen.set(def, newItem);
            const jsonSchema = selectParser(def, def.typeName, refs);
            if (jsonSchema) {
              addMeta(def, refs, jsonSchema);
            }
            newItem.jsonSchema = jsonSchema;
            return jsonSchema;
          }
          const get$ref = (item, refs) => {
            switch (refs.$refStrategy) {
              case "root":
                return { $ref: item.path.join("/") };
              case "relative":
                return { $ref: getRelativePath(refs.currentPath, item.path) };
              case "none":
              case "seen": {
                if (
                  item.path.length < refs.currentPath.length &&
                  item.path.every(
                    (value, index) => refs.currentPath[index] === value,
                  )
                ) {
                  console.warn(
                    `Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`,
                  );
                  return {};
                }
                return refs.$refStrategy === "seen" ? {} : undefined;
              }
            }
          };
          const getRelativePath = (pathA, pathB) => {
            let i = 0;
            for (; i < pathA.length && i < pathB.length; i++) {
              if (pathA[i] !== pathB[i]) break;
            }
            return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
          };
          const selectParser = (def, typeName, refs) => {
            switch (typeName) {
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodString:
                return (0,
                _parsers_string_js__WEBPACK_IMPORTED_MODULE_24__.parseStringDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNumber:
                return (0,
                _parsers_number_js__WEBPACK_IMPORTED_MODULE_17__.parseNumberDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodObject:
                return (0,
                _parsers_object_js__WEBPACK_IMPORTED_MODULE_18__.parseObjectDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodBigInt:
                return (0,
                _parsers_bigint_js__WEBPACK_IMPORTED_MODULE_2__.parseBigintDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodBoolean:
                return (0,
                _parsers_boolean_js__WEBPACK_IMPORTED_MODULE_3__.parseBooleanDef)();
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodDate:
                return (0,
                _parsers_date_js__WEBPACK_IMPORTED_MODULE_6__.parseDateDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodUndefined:
                return (0,
                _parsers_undefined_js__WEBPACK_IMPORTED_MODULE_26__.parseUndefinedDef)();
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNull:
                return (0,
                _parsers_null_js__WEBPACK_IMPORTED_MODULE_15__.parseNullDef)(
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodArray:
                return (0,
                _parsers_array_js__WEBPACK_IMPORTED_MODULE_1__.parseArrayDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodUnion:
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodDiscriminatedUnion:
                return (0,
                _parsers_union_js__WEBPACK_IMPORTED_MODULE_27__.parseUnionDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodIntersection:
                return (0,
                _parsers_intersection_js__WEBPACK_IMPORTED_MODULE_10__.parseIntersectionDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodTuple:
                return (0,
                _parsers_tuple_js__WEBPACK_IMPORTED_MODULE_25__.parseTupleDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodRecord:
                return (0,
                _parsers_record_js__WEBPACK_IMPORTED_MODULE_22__.parseRecordDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodLiteral:
                return (0,
                _parsers_literal_js__WEBPACK_IMPORTED_MODULE_11__.parseLiteralDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodEnum:
                return (0,
                _parsers_enum_js__WEBPACK_IMPORTED_MODULE_9__.parseEnumDef)(
                  def,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNativeEnum:
                return (0,
                _parsers_nativeEnum_js__WEBPACK_IMPORTED_MODULE_13__.parseNativeEnumDef)(
                  def,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNullable:
                return (0,
                _parsers_nullable_js__WEBPACK_IMPORTED_MODULE_16__.parseNullableDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodOptional:
                return (0,
                _parsers_optional_js__WEBPACK_IMPORTED_MODULE_19__.parseOptionalDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodMap:
                return (0,
                _parsers_map_js__WEBPACK_IMPORTED_MODULE_12__.parseMapDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodSet:
                return (0,
                _parsers_set_js__WEBPACK_IMPORTED_MODULE_23__.parseSetDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodLazy:
                return parseDef(def.getter()._def, refs);
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodPromise:
                return (0,
                _parsers_promise_js__WEBPACK_IMPORTED_MODULE_21__.parsePromiseDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNaN:
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodNever:
                return (0,
                _parsers_never_js__WEBPACK_IMPORTED_MODULE_14__.parseNeverDef)();
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodEffects:
                return (0,
                _parsers_effects_js__WEBPACK_IMPORTED_MODULE_8__.parseEffectsDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodAny:
                return (0,
                _parsers_any_js__WEBPACK_IMPORTED_MODULE_0__.parseAnyDef)();
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodUnknown:
                return (0,
                _parsers_unknown_js__WEBPACK_IMPORTED_MODULE_28__.parseUnknownDef)();
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodDefault:
                return (0,
                _parsers_default_js__WEBPACK_IMPORTED_MODULE_7__.parseDefaultDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodBranded:
                return (0,
                _parsers_branded_js__WEBPACK_IMPORTED_MODULE_4__.parseBrandedDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodReadonly:
                return (0,
                _parsers_readonly_js__WEBPACK_IMPORTED_MODULE_29__.parseReadonlyDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodCatch:
                return (0,
                _parsers_catch_js__WEBPACK_IMPORTED_MODULE_5__.parseCatchDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodPipeline:
                return (0,
                _parsers_pipeline_js__WEBPACK_IMPORTED_MODULE_20__.parsePipelineDef)(
                  def,
                  refs,
                );
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodFunction:
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodVoid:
              case zod__WEBPACK_IMPORTED_MODULE_31__.ZodFirstPartyTypeKind
                .ZodSymbol:
                return undefined;
              default:
                /* c8 ignore next */
                return ((_) => undefined)(typeName);
            }
          };
          const addMeta = (def, refs, jsonSchema) => {
            if (def.description) {
              jsonSchema.description = def.description;
              if (refs.markdownDescription) {
                jsonSchema.markdownDescription = def.description;
              }
            }
            return jsonSchema;
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js":
        /*!*************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js ***!
  \*************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseAnyDef: () => /* binding */ parseAnyDef,
            /* harmony export */
          });
          function parseAnyDef() {
            return {};
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseArrayDef: () =>
              /* binding */ parseArrayDef,
            /* harmony export */
          });
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseArrayDef(def, refs) {
            const res = {
              type: "array",
            };
            if (
              def.type?._def &&
              def.type?._def?.typeName !==
                zod__WEBPACK_IMPORTED_MODULE_2__.ZodFirstPartyTypeKind.ZodAny
            ) {
              res.items = (0,
              _parseDef_js__WEBPACK_IMPORTED_MODULE_1__.parseDef)(
                def.type._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath, "items"],
                },
              );
            }
            if (def.minLength) {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                res,
                "minItems",
                def.minLength.value,
                def.minLength.message,
                refs,
              );
            }
            if (def.maxLength) {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                res,
                "maxItems",
                def.maxLength.value,
                def.maxLength.message,
                refs,
              );
            }
            if (def.exactLength) {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                res,
                "minItems",
                def.exactLength.value,
                def.exactLength.message,
                refs,
              );
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                res,
                "maxItems",
                def.exactLength.value,
                def.exactLength.message,
                refs,
              );
            }
            return res;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js":
        /*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js ***!
  \****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseBigintDef: () =>
              /* binding */ parseBigintDef,
            /* harmony export */
          });
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );

          function parseBigintDef(def, refs) {
            const res = {
              type: "integer",
              format: "int64",
            };
            if (!def.checks) return res;
            for (const check of def.checks) {
              switch (check.kind) {
                case "min":
                  if (refs.target === "jsonSchema7") {
                    if (check.inclusive) {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "minimum",
                        check.value,
                        check.message,
                        refs,
                      );
                    } else {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "exclusiveMinimum",
                        check.value,
                        check.message,
                        refs,
                      );
                    }
                  } else {
                    if (!check.inclusive) {
                      res.exclusiveMinimum = true;
                    }
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "minimum",
                      check.value,
                      check.message,
                      refs,
                    );
                  }
                  break;
                case "max":
                  if (refs.target === "jsonSchema7") {
                    if (check.inclusive) {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "maximum",
                        check.value,
                        check.message,
                        refs,
                      );
                    } else {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "exclusiveMaximum",
                        check.value,
                        check.message,
                        refs,
                      );
                    }
                  } else {
                    if (!check.inclusive) {
                      res.exclusiveMaximum = true;
                    }
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "maximum",
                      check.value,
                      check.message,
                      refs,
                    );
                  }
                  break;
                case "multipleOf":
                  (0,
                  _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                    res,
                    "multipleOf",
                    check.value,
                    check.message,
                    refs,
                  );
                  break;
              }
            }
            return res;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseBooleanDef: () =>
              /* binding */ parseBooleanDef,
            /* harmony export */
          });
          function parseBooleanDef() {
            return {
              type: "boolean",
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseBrandedDef: () =>
              /* binding */ parseBrandedDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseBrandedDef(_def, refs) {
            return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              _def.type._def,
              refs,
            );
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseCatchDef: () =>
              /* binding */ parseCatchDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const parseCatchDef = (def, refs) => {
            return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.innerType._def,
              refs,
            );
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js":
        /*!**************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js ***!
  \**************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseDateDef: () => /* binding */ parseDateDef,
            /* harmony export */
          });
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );

          function parseDateDef(def, refs, overrideDateStrategy) {
            const strategy = overrideDateStrategy ?? refs.dateStrategy;
            if (Array.isArray(strategy)) {
              return {
                anyOf: strategy.map((item, i) => parseDateDef(def, refs, item)),
              };
            }
            switch (strategy) {
              case "string":
              case "format:date-time":
                return {
                  type: "string",
                  format: "date-time",
                };
              case "format:date":
                return {
                  type: "string",
                  format: "date",
                };
              case "integer":
                return integerDateParser(def, refs);
            }
          }
          const integerDateParser = (def, refs) => {
            const res = {
              type: "integer",
              format: "unix-time",
            };
            if (refs.target === "openApi3") {
              return res;
            }
            for (const check of def.checks) {
              switch (check.kind) {
                case "min":
                  (0,
                  _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                    res,
                    "minimum",
                    check.value, // This is in milliseconds
                    check.message,
                    refs,
                  );
                  break;
                case "max":
                  (0,
                  _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                    res,
                    "maximum",
                    check.value, // This is in milliseconds
                    check.message,
                    refs,
                  );
                  break;
              }
            }
            return res;
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseDefaultDef: () =>
              /* binding */ parseDefaultDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseDefaultDef(_def, refs) {
            return {
              ...(0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                _def.innerType._def,
                refs,
              ),
              default: _def.defaultValue(),
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseEffectsDef: () =>
              /* binding */ parseEffectsDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseEffectsDef(_def, refs) {
            return refs.effectStrategy === "input"
              ? (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                  _def.schema._def,
                  refs,
                )
              : {};
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js":
        /*!**************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js ***!
  \**************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseEnumDef: () => /* binding */ parseEnumDef,
            /* harmony export */
          });
          function parseEnumDef(def) {
            return {
              type: "string",
              enum: Array.from(def.values),
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js":
        /*!**********************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js ***!
  \**********************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseIntersectionDef: () =>
              /* binding */ parseIntersectionDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const isJsonSchema7AllOfType = (type) => {
            if ("type" in type && type.type === "string") return false;
            return "allOf" in type;
          };
          function parseIntersectionDef(def, refs) {
            const allOf = [
              (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.left._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath, "allOf", "0"],
                },
              ),
              (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.right._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath, "allOf", "1"],
                },
              ),
            ].filter((x) => !!x);
            let unevaluatedProperties =
              refs.target === "jsonSchema2019-09"
                ? { unevaluatedProperties: false }
                : undefined;
            const mergedAllOf = [];
            // If either of the schemas is an allOf, merge them into a single allOf
            allOf.forEach((schema) => {
              if (isJsonSchema7AllOfType(schema)) {
                mergedAllOf.push(...schema.allOf);
                if (schema.unevaluatedProperties === undefined) {
                  // If one of the schemas has no unevaluatedProperties set,
                  // the merged schema should also have no unevaluatedProperties set
                  unevaluatedProperties = undefined;
                }
              } else {
                let nestedSchema = schema;
                if (
                  "additionalProperties" in schema &&
                  schema.additionalProperties === false
                ) {
                  const { additionalProperties, ...rest } = schema;
                  nestedSchema = rest;
                } else {
                  // As soon as one of the schemas has additionalProperties set not to false, we allow unevaluatedProperties
                  unevaluatedProperties = undefined;
                }
                mergedAllOf.push(nestedSchema);
              }
            });
            return mergedAllOf.length
              ? {
                  allOf: mergedAllOf,
                  ...unevaluatedProperties,
                }
              : undefined;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseLiteralDef: () =>
              /* binding */ parseLiteralDef,
            /* harmony export */
          });
          function parseLiteralDef(def, refs) {
            const parsedType = typeof def.value;
            if (
              parsedType !== "bigint" &&
              parsedType !== "number" &&
              parsedType !== "boolean" &&
              parsedType !== "string"
            ) {
              return {
                type: Array.isArray(def.value) ? "array" : "object",
              };
            }
            if (refs.target === "openApi3") {
              return {
                type: parsedType === "bigint" ? "integer" : parsedType,
                enum: [def.value],
              };
            }
            return {
              type: parsedType === "bigint" ? "integer" : parsedType,
              const: def.value,
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js":
        /*!*************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js ***!
  \*************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseMapDef: () => /* binding */ parseMapDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );
          /* harmony import */ var _record_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./record.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js",
            );

          function parseMapDef(def, refs) {
            if (refs.mapStrategy === "record") {
              return (0,
              _record_js__WEBPACK_IMPORTED_MODULE_1__.parseRecordDef)(
                def,
                refs,
              );
            }
            const keys =
              (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.keyType._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath, "items", "items", "0"],
                },
              ) || {};
            const values =
              (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.valueType._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath, "items", "items", "1"],
                },
              ) || {};
            return {
              type: "array",
              maxItems: 125,
              items: {
                type: "array",
                items: [keys, values],
                minItems: 2,
                maxItems: 2,
              },
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js":
        /*!********************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js ***!
  \********************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseNativeEnumDef: () =>
              /* binding */ parseNativeEnumDef,
            /* harmony export */
          });
          function parseNativeEnumDef(def) {
            const object = def.values;
            const actualKeys = Object.keys(def.values).filter((key) => {
              return typeof object[object[key]] !== "number";
            });
            const actualValues = actualKeys.map((key) => object[key]);
            const parsedTypes = Array.from(
              new Set(actualValues.map((values) => typeof values)),
            );
            return {
              type:
                parsedTypes.length === 1
                  ? parsedTypes[0] === "string"
                    ? "string"
                    : "number"
                  : ["string", "number"],
              enum: actualValues,
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseNeverDef: () =>
              /* binding */ parseNeverDef,
            /* harmony export */
          });
          function parseNeverDef() {
            return {
              not: {},
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js":
        /*!**************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js ***!
  \**************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseNullDef: () => /* binding */ parseNullDef,
            /* harmony export */
          });
          function parseNullDef(refs) {
            return refs.target === "openApi3"
              ? {
                  enum: ["null"],
                  nullable: true,
                }
              : {
                  type: "null",
                };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js":
        /*!******************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js ***!
  \******************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseNullableDef: () =>
              /* binding */ parseNullableDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );
          /* harmony import */ var _union_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./union.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js",
            );

          function parseNullableDef(def, refs) {
            if (
              [
                "ZodString",
                "ZodNumber",
                "ZodBigInt",
                "ZodBoolean",
                "ZodNull",
              ].includes(def.innerType._def.typeName) &&
              (!def.innerType._def.checks || !def.innerType._def.checks.length)
            ) {
              if (refs.target === "openApi3") {
                return {
                  type: _union_js__WEBPACK_IMPORTED_MODULE_1__
                    .primitiveMappings[def.innerType._def.typeName],
                  nullable: true,
                };
              }
              return {
                type: [
                  _union_js__WEBPACK_IMPORTED_MODULE_1__.primitiveMappings[
                    def.innerType._def.typeName
                  ],
                  "null",
                ],
              };
            }
            if (refs.target === "openApi3") {
              const base = (0,
              _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.innerType._def,
                {
                  ...refs,
                  currentPath: [...refs.currentPath],
                },
              );
              if (base && "$ref" in base)
                return { allOf: [base], nullable: true };
              return base && { ...base, nullable: true };
            }
            const base = (0,
            _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.innerType._def,
              {
                ...refs,
                currentPath: [...refs.currentPath, "anyOf", "0"],
              },
            );
            return base && { anyOf: [base, { type: "null" }] };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js":
        /*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js ***!
  \****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseNumberDef: () =>
              /* binding */ parseNumberDef,
            /* harmony export */
          });
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );

          function parseNumberDef(def, refs) {
            const res = {
              type: "number",
            };
            if (!def.checks) return res;
            for (const check of def.checks) {
              switch (check.kind) {
                case "int":
                  res.type = "integer";
                  (0,
                  _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.addErrorMessage)(
                    res,
                    "type",
                    check.message,
                    refs,
                  );
                  break;
                case "min":
                  if (refs.target === "jsonSchema7") {
                    if (check.inclusive) {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "minimum",
                        check.value,
                        check.message,
                        refs,
                      );
                    } else {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "exclusiveMinimum",
                        check.value,
                        check.message,
                        refs,
                      );
                    }
                  } else {
                    if (!check.inclusive) {
                      res.exclusiveMinimum = true;
                    }
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "minimum",
                      check.value,
                      check.message,
                      refs,
                    );
                  }
                  break;
                case "max":
                  if (refs.target === "jsonSchema7") {
                    if (check.inclusive) {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "maximum",
                        check.value,
                        check.message,
                        refs,
                      );
                    } else {
                      (0,
                      _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                        res,
                        "exclusiveMaximum",
                        check.value,
                        check.message,
                        refs,
                      );
                    }
                  } else {
                    if (!check.inclusive) {
                      res.exclusiveMaximum = true;
                    }
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "maximum",
                      check.value,
                      check.message,
                      refs,
                    );
                  }
                  break;
                case "multipleOf":
                  (0,
                  _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                    res,
                    "multipleOf",
                    check.value,
                    check.message,
                    refs,
                  );
                  break;
              }
            }
            return res;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js":
        /*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js ***!
  \****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseObjectDef: () =>
              /* binding */ parseObjectDef,
            /* harmony export */
          });
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function decideAdditionalProperties(def, refs) {
            if (refs.removeAdditionalStrategy === "strict") {
              return def.catchall._def.typeName === "ZodNever"
                ? def.unknownKeys !== "strict"
                : ((0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                    def.catchall._def,
                    {
                      ...refs,
                      currentPath: [
                        ...refs.currentPath,
                        "additionalProperties",
                      ],
                    },
                  ) ?? true);
            } else {
              return def.catchall._def.typeName === "ZodNever"
                ? def.unknownKeys === "passthrough"
                : ((0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                    def.catchall._def,
                    {
                      ...refs,
                      currentPath: [
                        ...refs.currentPath,
                        "additionalProperties",
                      ],
                    },
                  ) ?? true);
            }
          }
          function parseObjectDef(def, refs) {
            const forceOptionalIntoNullable = refs.target === "openAi";
            const result = {
              type: "object",
              ...Object.entries(def.shape()).reduce(
                (acc, [propName, propDef]) => {
                  if (propDef === undefined || propDef._def === undefined)
                    return acc;
                  let propOptional = propDef.isOptional();
                  if (propOptional && forceOptionalIntoNullable) {
                    if (
                      propDef instanceof
                      zod__WEBPACK_IMPORTED_MODULE_1__.ZodOptional
                    ) {
                      propDef = propDef._def.innerType;
                    }
                    if (!propDef.isNullable()) {
                      propDef = propDef.nullable();
                    }
                    propOptional = false;
                  }
                  const parsedDef = (0,
                  _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                    propDef._def,
                    {
                      ...refs,
                      currentPath: [
                        ...refs.currentPath,
                        "properties",
                        propName,
                      ],
                      propertyPath: [
                        ...refs.currentPath,
                        "properties",
                        propName,
                      ],
                    },
                  );
                  if (parsedDef === undefined) return acc;
                  return {
                    properties: { ...acc.properties, [propName]: parsedDef },
                    required: propOptional
                      ? acc.required
                      : [...acc.required, propName],
                  };
                },
                { properties: {}, required: [] },
              ),
              additionalProperties: decideAdditionalProperties(def, refs),
            };
            if (!result.required.length) delete result.required;
            return result;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js":
        /*!******************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js ***!
  \******************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseOptionalDef: () =>
              /* binding */ parseOptionalDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const parseOptionalDef = (def, refs) => {
            if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
              return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.innerType._def,
                refs,
              );
            }
            const innerSchema = (0,
            _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.innerType._def,
              {
                ...refs,
                currentPath: [...refs.currentPath, "anyOf", "1"],
              },
            );
            return innerSchema
              ? {
                  anyOf: [
                    {
                      not: {},
                    },
                    innerSchema,
                  ],
                }
              : {};
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js":
        /*!******************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js ***!
  \******************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parsePipelineDef: () =>
              /* binding */ parsePipelineDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const parsePipelineDef = (def, refs) => {
            if (refs.pipeStrategy === "input") {
              return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.in._def,
                refs,
              );
            } else if (refs.pipeStrategy === "output") {
              return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                def.out._def,
                refs,
              );
            }
            const a = (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.in._def,
              {
                ...refs,
                currentPath: [...refs.currentPath, "allOf", "0"],
              },
            );
            const b = (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.out._def,
              {
                ...refs,
                currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"],
              },
            );
            return {
              allOf: [a, b].filter((x) => x !== undefined),
            };
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parsePromiseDef: () =>
              /* binding */ parsePromiseDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parsePromiseDef(def, refs) {
            return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.type._def,
              refs,
            );
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js":
        /*!******************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js ***!
  \******************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseReadonlyDef: () =>
              /* binding */ parseReadonlyDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const parseReadonlyDef = (def, refs) => {
            return (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
              def.innerType._def,
              refs,
            );
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js":
        /*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js ***!
  \****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseRecordDef: () =>
              /* binding */ parseRecordDef,
            /* harmony export */
          });
          /* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_3__ =
            __webpack_require__(
              /*! zod */ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs",
            );
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );
          /* harmony import */ var _string_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./string.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js",
            );
          /* harmony import */ var _branded_js__WEBPACK_IMPORTED_MODULE_2__ =
            __webpack_require__(
              /*! ./branded.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js",
            );

          function parseRecordDef(def, refs) {
            if (refs.target === "openAi") {
              console.warn(
                "Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.",
              );
            }
            if (
              refs.target === "openApi3" &&
              def.keyType?._def.typeName ===
                zod__WEBPACK_IMPORTED_MODULE_3__.ZodFirstPartyTypeKind.ZodEnum
            ) {
              return {
                type: "object",
                required: def.keyType._def.values,
                properties: def.keyType._def.values.reduce(
                  (acc, key) => ({
                    ...acc,
                    [key]:
                      (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                        def.valueType._def,
                        {
                          ...refs,
                          currentPath: [...refs.currentPath, "properties", key],
                        },
                      ) ?? {},
                  }),
                  {},
                ),
                additionalProperties: false,
              };
            }
            const schema = {
              type: "object",
              additionalProperties:
                (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                  def.valueType._def,
                  {
                    ...refs,
                    currentPath: [...refs.currentPath, "additionalProperties"],
                  },
                ) ?? {},
            };
            if (refs.target === "openApi3") {
              return schema;
            }
            if (
              def.keyType?._def.typeName ===
                zod__WEBPACK_IMPORTED_MODULE_3__.ZodFirstPartyTypeKind
                  .ZodString &&
              def.keyType._def.checks?.length
            ) {
              const { type, ...keyType } = (0,
              _string_js__WEBPACK_IMPORTED_MODULE_1__.parseStringDef)(
                def.keyType._def,
                refs,
              );
              return {
                ...schema,
                propertyNames: keyType,
              };
            } else if (
              def.keyType?._def.typeName ===
              zod__WEBPACK_IMPORTED_MODULE_3__.ZodFirstPartyTypeKind.ZodEnum
            ) {
              return {
                ...schema,
                propertyNames: {
                  enum: def.keyType._def.values,
                },
              };
            } else if (
              def.keyType?._def.typeName ===
                zod__WEBPACK_IMPORTED_MODULE_3__.ZodFirstPartyTypeKind
                  .ZodBranded &&
              def.keyType._def.type._def.typeName ===
                zod__WEBPACK_IMPORTED_MODULE_3__.ZodFirstPartyTypeKind
                  .ZodString &&
              def.keyType._def.type._def.checks?.length
            ) {
              const { type, ...keyType } = (0,
              _branded_js__WEBPACK_IMPORTED_MODULE_2__.parseBrandedDef)(
                def.keyType._def,
                refs,
              );
              return {
                ...schema,
                propertyNames: keyType,
              };
            }
            return schema;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js":
        /*!*************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js ***!
  \*************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseSetDef: () => /* binding */ parseSetDef,
            /* harmony export */
          });
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseSetDef(def, refs) {
            const items = (0,
            _parseDef_js__WEBPACK_IMPORTED_MODULE_1__.parseDef)(
              def.valueType._def,
              {
                ...refs,
                currentPath: [...refs.currentPath, "items"],
              },
            );
            const schema = {
              type: "array",
              uniqueItems: true,
              items,
            };
            if (def.minSize) {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                schema,
                "minItems",
                def.minSize.value,
                def.minSize.message,
                refs,
              );
            }
            if (def.maxSize) {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                schema,
                "maxItems",
                def.maxSize.value,
                def.maxSize.message,
                refs,
              );
            }
            return schema;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js":
        /*!****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js ***!
  \****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseStringDef: () =>
              /* binding */ parseStringDef,
            /* harmony export */ zodPatterns: () => /* binding */ zodPatterns,
            /* harmony export */
          });
          /* harmony import */ var _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../errorMessages.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js",
            );

          let emojiRegex = undefined;
          /**
           * Generated from the regular expressions found here as of 2024-05-22:
           * https://github.com/colinhacks/zod/blob/master/src/types.ts.
           *
           * Expressions with /i flag have been changed accordingly.
           */
          const zodPatterns = {
            /**
             * `c` was changed to `[cC]` to replicate /i flag
             */
            cuid: /^[cC][^\s-]{8,}$/,
            cuid2: /^[0-9a-z]+$/,
            ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
            /**
             * `a-z` was added to replicate /i flag
             */
            email:
              /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
            /**
             * Constructed a valid Unicode RegExp
             *
             * Lazily instantiate since this type of regex isn't supported
             * in all envs (e.g. React Native).
             *
             * See:
             * https://github.com/colinhacks/zod/issues/2433
             * Fix in Zod:
             * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
             */
            emoji: () => {
              if (emojiRegex === undefined) {
                emojiRegex = RegExp(
                  "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$",
                  "u",
                );
              }
              return emojiRegex;
            },
            /**
             * Unused
             */
            uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
            /**
             * Unused
             */
            ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
            ipv4Cidr:
              /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
            /**
             * Unused
             */
            ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
            ipv6Cidr:
              /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
            base64:
              /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
            base64url:
              /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
            nanoid: /^[a-zA-Z0-9_-]{21}$/,
            jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
          };
          function parseStringDef(def, refs) {
            const res = {
              type: "string",
            };
            if (def.checks) {
              for (const check of def.checks) {
                switch (check.kind) {
                  case "min":
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "minLength",
                      typeof res.minLength === "number"
                        ? Math.max(res.minLength, check.value)
                        : check.value,
                      check.message,
                      refs,
                    );
                    break;
                  case "max":
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "maxLength",
                      typeof res.maxLength === "number"
                        ? Math.min(res.maxLength, check.value)
                        : check.value,
                      check.message,
                      refs,
                    );
                    break;
                  case "email":
                    switch (refs.emailStrategy) {
                      case "format:email":
                        addFormat(res, "email", check.message, refs);
                        break;
                      case "format:idn-email":
                        addFormat(res, "idn-email", check.message, refs);
                        break;
                      case "pattern:zod":
                        addPattern(res, zodPatterns.email, check.message, refs);
                        break;
                    }
                    break;
                  case "url":
                    addFormat(res, "uri", check.message, refs);
                    break;
                  case "uuid":
                    addFormat(res, "uuid", check.message, refs);
                    break;
                  case "regex":
                    addPattern(res, check.regex, check.message, refs);
                    break;
                  case "cuid":
                    addPattern(res, zodPatterns.cuid, check.message, refs);
                    break;
                  case "cuid2":
                    addPattern(res, zodPatterns.cuid2, check.message, refs);
                    break;
                  case "startsWith":
                    addPattern(
                      res,
                      RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`),
                      check.message,
                      refs,
                    );
                    break;
                  case "endsWith":
                    addPattern(
                      res,
                      RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`),
                      check.message,
                      refs,
                    );
                    break;
                  case "datetime":
                    addFormat(res, "date-time", check.message, refs);
                    break;
                  case "date":
                    addFormat(res, "date", check.message, refs);
                    break;
                  case "time":
                    addFormat(res, "time", check.message, refs);
                    break;
                  case "duration":
                    addFormat(res, "duration", check.message, refs);
                    break;
                  case "length":
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "minLength",
                      typeof res.minLength === "number"
                        ? Math.max(res.minLength, check.value)
                        : check.value,
                      check.message,
                      refs,
                    );
                    (0,
                    _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                      res,
                      "maxLength",
                      typeof res.maxLength === "number"
                        ? Math.min(res.maxLength, check.value)
                        : check.value,
                      check.message,
                      refs,
                    );
                    break;
                  case "includes": {
                    addPattern(
                      res,
                      RegExp(escapeLiteralCheckValue(check.value, refs)),
                      check.message,
                      refs,
                    );
                    break;
                  }
                  case "ip": {
                    if (check.version !== "v6") {
                      addFormat(res, "ipv4", check.message, refs);
                    }
                    if (check.version !== "v4") {
                      addFormat(res, "ipv6", check.message, refs);
                    }
                    break;
                  }
                  case "base64url":
                    addPattern(res, zodPatterns.base64url, check.message, refs);
                    break;
                  case "jwt":
                    addPattern(res, zodPatterns.jwt, check.message, refs);
                    break;
                  case "cidr": {
                    if (check.version !== "v6") {
                      addPattern(
                        res,
                        zodPatterns.ipv4Cidr,
                        check.message,
                        refs,
                      );
                    }
                    if (check.version !== "v4") {
                      addPattern(
                        res,
                        zodPatterns.ipv6Cidr,
                        check.message,
                        refs,
                      );
                    }
                    break;
                  }
                  case "emoji":
                    addPattern(res, zodPatterns.emoji(), check.message, refs);
                    break;
                  case "ulid": {
                    addPattern(res, zodPatterns.ulid, check.message, refs);
                    break;
                  }
                  case "base64": {
                    switch (refs.base64Strategy) {
                      case "format:binary": {
                        addFormat(res, "binary", check.message, refs);
                        break;
                      }
                      case "contentEncoding:base64": {
                        (0,
                        _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                          res,
                          "contentEncoding",
                          "base64",
                          check.message,
                          refs,
                        );
                        break;
                      }
                      case "pattern:zod": {
                        addPattern(
                          res,
                          zodPatterns.base64,
                          check.message,
                          refs,
                        );
                        break;
                      }
                    }
                    break;
                  }
                  case "nanoid": {
                    addPattern(res, zodPatterns.nanoid, check.message, refs);
                  }
                  case "toLowerCase":
                  case "toUpperCase":
                  case "trim":
                    break;
                  default:
                    /* c8 ignore next */
                    ((_) => {})(check);
                }
              }
            }
            return res;
          }
          function escapeLiteralCheckValue(literal, refs) {
            return refs.patternStrategy === "escape"
              ? escapeNonAlphaNumeric(literal)
              : literal;
          }
          const ALPHA_NUMERIC = new Set(
            "ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789",
          );
          function escapeNonAlphaNumeric(source) {
            let result = "";
            for (let i = 0; i < source.length; i++) {
              if (!ALPHA_NUMERIC.has(source[i])) {
                result += "\\";
              }
              result += source[i];
            }
            return result;
          }
          // Adds a "format" keyword to the schema. If a format exists, both formats will be joined in an allOf-node, along with subsequent ones.
          function addFormat(schema, value, message, refs) {
            if (schema.format || schema.anyOf?.some((x) => x.format)) {
              if (!schema.anyOf) {
                schema.anyOf = [];
              }
              if (schema.format) {
                schema.anyOf.push({
                  format: schema.format,
                  ...(schema.errorMessage &&
                    refs.errorMessages && {
                      errorMessage: { format: schema.errorMessage.format },
                    }),
                });
                delete schema.format;
                if (schema.errorMessage) {
                  delete schema.errorMessage.format;
                  if (Object.keys(schema.errorMessage).length === 0) {
                    delete schema.errorMessage;
                  }
                }
              }
              schema.anyOf.push({
                format: value,
                ...(message &&
                  refs.errorMessages && { errorMessage: { format: message } }),
              });
            } else {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                schema,
                "format",
                value,
                message,
                refs,
              );
            }
          }
          // Adds a "pattern" keyword to the schema. If a pattern exists, both patterns will be joined in an allOf-node, along with subsequent ones.
          function addPattern(schema, regex, message, refs) {
            if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
              if (!schema.allOf) {
                schema.allOf = [];
              }
              if (schema.pattern) {
                schema.allOf.push({
                  pattern: schema.pattern,
                  ...(schema.errorMessage &&
                    refs.errorMessages && {
                      errorMessage: { pattern: schema.errorMessage.pattern },
                    }),
                });
                delete schema.pattern;
                if (schema.errorMessage) {
                  delete schema.errorMessage.pattern;
                  if (Object.keys(schema.errorMessage).length === 0) {
                    delete schema.errorMessage;
                  }
                }
              }
              schema.allOf.push({
                pattern: stringifyRegExpWithFlags(regex, refs),
                ...(message &&
                  refs.errorMessages && { errorMessage: { pattern: message } }),
              });
            } else {
              (0,
              _errorMessages_js__WEBPACK_IMPORTED_MODULE_0__.setResponseValueAndErrors)(
                schema,
                "pattern",
                stringifyRegExpWithFlags(regex, refs),
                message,
                refs,
              );
            }
          }
          // Mutate z.string.regex() in a best attempt to accommodate for regex flags when applyRegexFlags is true
          function stringifyRegExpWithFlags(regex, refs) {
            if (!refs.applyRegexFlags || !regex.flags) {
              return regex.source;
            }
            // Currently handled flags
            const flags = {
              i: regex.flags.includes("i"),
              m: regex.flags.includes("m"),
              s: regex.flags.includes("s"), // `.` matches newlines
            };
            // The general principle here is to step through each character, one at a time, applying mutations as flags require. We keep track when the current character is escaped, and when it's inside a group /like [this]/ or (also) a range like /[a-z]/. The following is fairly brittle imperative code; edit at your peril!
            const source = flags.i ? regex.source.toLowerCase() : regex.source;
            let pattern = "";
            let isEscaped = false;
            let inCharGroup = false;
            let inCharRange = false;
            for (let i = 0; i < source.length; i++) {
              if (isEscaped) {
                pattern += source[i];
                isEscaped = false;
                continue;
              }
              if (flags.i) {
                if (inCharGroup) {
                  if (source[i].match(/[a-z]/)) {
                    if (inCharRange) {
                      pattern += source[i];
                      pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
                      inCharRange = false;
                    } else if (
                      source[i + 1] === "-" &&
                      source[i + 2]?.match(/[a-z]/)
                    ) {
                      pattern += source[i];
                      inCharRange = true;
                    } else {
                      pattern += `${source[i]}${source[i].toUpperCase()}`;
                    }
                    continue;
                  }
                } else if (source[i].match(/[a-z]/)) {
                  pattern += `[${source[i]}${source[i].toUpperCase()}]`;
                  continue;
                }
              }
              if (flags.m) {
                if (source[i] === "^") {
                  pattern += `(^|(?<=[\r\n]))`;
                  continue;
                } else if (source[i] === "$") {
                  pattern += `($|(?=[\r\n]))`;
                  continue;
                }
              }
              if (flags.s && source[i] === ".") {
                pattern += inCharGroup
                  ? `${source[i]}\r\n`
                  : `[${source[i]}\r\n]`;
                continue;
              }
              pattern += source[i];
              if (source[i] === "\\") {
                isEscaped = true;
              } else if (inCharGroup && source[i] === "]") {
                inCharGroup = false;
              } else if (!inCharGroup && source[i] === "[") {
                inCharGroup = true;
              }
            }
            try {
              new RegExp(pattern);
            } catch {
              console.warn(
                `Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`,
              );
              return regex.source;
            }
            return pattern;
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseTupleDef: () =>
              /* binding */ parseTupleDef,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          function parseTupleDef(def, refs) {
            if (def.rest) {
              return {
                type: "array",
                minItems: def.items.length,
                items: def.items
                  .map((x, i) =>
                    (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                      x._def,
                      {
                        ...refs,
                        currentPath: [...refs.currentPath, "items", `${i}`],
                      },
                    ),
                  )
                  .reduce(
                    (acc, x) => (x === undefined ? acc : [...acc, x]),
                    [],
                  ),
                additionalItems: (0,
                _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                  def.rest._def,
                  {
                    ...refs,
                    currentPath: [...refs.currentPath, "additionalItems"],
                  },
                ),
              };
            } else {
              return {
                type: "array",
                minItems: def.items.length,
                maxItems: def.items.length,
                items: def.items
                  .map((x, i) =>
                    (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                      x._def,
                      {
                        ...refs,
                        currentPath: [...refs.currentPath, "items", `${i}`],
                      },
                    ),
                  )
                  .reduce(
                    (acc, x) => (x === undefined ? acc : [...acc, x]),
                    [],
                  ),
              };
            }
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js":
        /*!*******************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js ***!
  \*******************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseUndefinedDef: () =>
              /* binding */ parseUndefinedDef,
            /* harmony export */
          });
          function parseUndefinedDef() {
            return {
              not: {},
            };
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js":
        /*!***************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js ***!
  \***************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseUnionDef: () =>
              /* binding */ parseUnionDef,
            /* harmony export */ primitiveMappings: () =>
              /* binding */ primitiveMappings,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ../parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );

          const primitiveMappings = {
            ZodString: "string",
            ZodNumber: "number",
            ZodBigInt: "integer",
            ZodBoolean: "boolean",
            ZodNull: "null",
          };
          function parseUnionDef(def, refs) {
            if (refs.target === "openApi3") return asAnyOf(def, refs);
            const options =
              def.options instanceof Map
                ? Array.from(def.options.values())
                : def.options;
            // This blocks tries to look ahead a bit to produce nicer looking schemas with type array instead of anyOf.
            if (
              options.every(
                (x) =>
                  x._def.typeName in primitiveMappings &&
                  (!x._def.checks || !x._def.checks.length),
              )
            ) {
              // all types in union are primitive and lack checks, so might as well squash into {type: [...]}
              const types = options.reduce((types, x) => {
                const type = primitiveMappings[x._def.typeName]; //Can be safely casted due to row 43
                return type && !types.includes(type) ? [...types, type] : types;
              }, []);
              return {
                type: types.length > 1 ? types : types[0],
              };
            } else if (
              options.every(
                (x) => x._def.typeName === "ZodLiteral" && !x.description,
              )
            ) {
              // all options literals
              const types = options.reduce((acc, x) => {
                const type = typeof x._def.value;
                switch (type) {
                  case "string":
                  case "number":
                  case "boolean":
                    return [...acc, type];
                  case "bigint":
                    return [...acc, "integer"];
                  case "object":
                    if (x._def.value === null) return [...acc, "null"];
                  case "symbol":
                  case "undefined":
                  case "function":
                  default:
                    return acc;
                }
              }, []);
              if (types.length === options.length) {
                // all the literals are primitive, as far as null can be considered primitive
                const uniqueTypes = types.filter(
                  (x, i, a) => a.indexOf(x) === i,
                );
                return {
                  type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
                  enum: options.reduce((acc, x) => {
                    return acc.includes(x._def.value)
                      ? acc
                      : [...acc, x._def.value];
                  }, []),
                };
              }
            } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
              return {
                type: "string",
                enum: options.reduce(
                  (acc, x) => [
                    ...acc,
                    ...x._def.values.filter((x) => !acc.includes(x)),
                  ],
                  [],
                ),
              };
            }
            return asAnyOf(def, refs);
          }
          const asAnyOf = (def, refs) => {
            const anyOf = (
              def.options instanceof Map
                ? Array.from(def.options.values())
                : def.options
            )
              .map((x, i) =>
                (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                  x._def,
                  {
                    ...refs,
                    currentPath: [...refs.currentPath, "anyOf", `${i}`],
                  },
                ),
              )
              .filter(
                (x) =>
                  !!x &&
                  (!refs.strictUnions ||
                    (typeof x === "object" && Object.keys(x).length > 0)),
              );
            return anyOf.length ? { anyOf } : undefined;
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ parseUnknownDef: () =>
              /* binding */ parseUnknownDef,
            /* harmony export */
          });
          function parseUnknownDef() {
            return {};
          }

          /***/
        },

      /***/ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js":
        /*!*****************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js ***!
  \*****************************************************************************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ zodToJsonSchema: () =>
              /* binding */ zodToJsonSchema,
            /* harmony export */
          });
          /* harmony import */ var _parseDef_js__WEBPACK_IMPORTED_MODULE_0__ =
            __webpack_require__(
              /*! ./parseDef.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js",
            );
          /* harmony import */ var _Refs_js__WEBPACK_IMPORTED_MODULE_1__ =
            __webpack_require__(
              /*! ./Refs.js */ "./node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js",
            );

          const zodToJsonSchema = (schema, options) => {
            const refs = (0, _Refs_js__WEBPACK_IMPORTED_MODULE_1__.getRefs)(
              options,
            );
            const definitions =
              typeof options === "object" && options.definitions
                ? Object.entries(options.definitions).reduce(
                    (acc, [name, schema]) => ({
                      ...acc,
                      [name]:
                        (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                          schema._def,
                          {
                            ...refs,
                            currentPath: [
                              ...refs.basePath,
                              refs.definitionPath,
                              name,
                            ],
                          },
                          true,
                        ) ?? {},
                    }),
                    {},
                  )
                : undefined;
            const name =
              typeof options === "string"
                ? options
                : options?.nameStrategy === "title"
                  ? undefined
                  : options?.name;
            const main =
              (0, _parseDef_js__WEBPACK_IMPORTED_MODULE_0__.parseDef)(
                schema._def,
                name === undefined
                  ? refs
                  : {
                      ...refs,
                      currentPath: [
                        ...refs.basePath,
                        refs.definitionPath,
                        name,
                      ],
                    },
                false,
              ) ?? {};
            const title =
              typeof options === "object" &&
              options.name !== undefined &&
              options.nameStrategy === "title"
                ? options.name
                : undefined;
            if (title !== undefined) {
              main.title = title;
            }
            const combined =
              name === undefined
                ? definitions
                  ? {
                      ...main,
                      [refs.definitionPath]: definitions,
                    }
                  : main
                : {
                    $ref: [
                      ...(refs.$refStrategy === "relative"
                        ? []
                        : refs.basePath),
                      refs.definitionPath,
                      name,
                    ].join("/"),
                    [refs.definitionPath]: {
                      ...definitions,
                      [name]: main,
                    },
                  };
            if (refs.target === "jsonSchema7") {
              combined.$schema = "http://json-schema.org/draft-07/schema#";
            } else if (
              refs.target === "jsonSchema2019-09" ||
              refs.target === "openAi"
            ) {
              combined.$schema =
                "https://json-schema.org/draft/2019-09/schema#";
            }
            if (
              refs.target === "openAi" &&
              ("anyOf" in combined ||
                "oneOf" in combined ||
                "allOf" in combined ||
                ("type" in combined && Array.isArray(combined.type)))
            ) {
              console.warn(
                "Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.",
              );
            }
            return combined;
          };

          /***/
        },

      /***/ "./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs":
        /*!**********************************************************************!*\
  !*** ./node_modules/.pnpm/zod@3.24.1/node_modules/zod/lib/index.mjs ***!
  \**********************************************************************/
        /***/ (
          __unused_webpack___webpack_module__,
          __webpack_exports__,
          __webpack_require__,
        ) => {
          __webpack_require__.r(__webpack_exports__);
          /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ BRAND: () => /* binding */ BRAND,
            /* harmony export */ DIRTY: () => /* binding */ DIRTY,
            /* harmony export */ EMPTY_PATH: () => /* binding */ EMPTY_PATH,
            /* harmony export */ INVALID: () => /* binding */ INVALID,
            /* harmony export */ NEVER: () => /* binding */ NEVER,
            /* harmony export */ OK: () => /* binding */ OK,
            /* harmony export */ ParseStatus: () => /* binding */ ParseStatus,
            /* harmony export */ Schema: () => /* binding */ ZodType,
            /* harmony export */ ZodAny: () => /* binding */ ZodAny,
            /* harmony export */ ZodArray: () => /* binding */ ZodArray,
            /* harmony export */ ZodBigInt: () => /* binding */ ZodBigInt,
            /* harmony export */ ZodBoolean: () => /* binding */ ZodBoolean,
            /* harmony export */ ZodBranded: () => /* binding */ ZodBranded,
            /* harmony export */ ZodCatch: () => /* binding */ ZodCatch,
            /* harmony export */ ZodDate: () => /* binding */ ZodDate,
            /* harmony export */ ZodDefault: () => /* binding */ ZodDefault,
            /* harmony export */ ZodDiscriminatedUnion: () =>
              /* binding */ ZodDiscriminatedUnion,
            /* harmony export */ ZodEffects: () => /* binding */ ZodEffects,
            /* harmony export */ ZodEnum: () => /* binding */ ZodEnum,
            /* harmony export */ ZodError: () => /* binding */ ZodError,
            /* harmony export */ ZodFirstPartyTypeKind: () =>
              /* binding */ ZodFirstPartyTypeKind,
            /* harmony export */ ZodFunction: () => /* binding */ ZodFunction,
            /* harmony export */ ZodIntersection: () =>
              /* binding */ ZodIntersection,
            /* harmony export */ ZodIssueCode: () => /* binding */ ZodIssueCode,
            /* harmony export */ ZodLazy: () => /* binding */ ZodLazy,
            /* harmony export */ ZodLiteral: () => /* binding */ ZodLiteral,
            /* harmony export */ ZodMap: () => /* binding */ ZodMap,
            /* harmony export */ ZodNaN: () => /* binding */ ZodNaN,
            /* harmony export */ ZodNativeEnum: () =>
              /* binding */ ZodNativeEnum,
            /* harmony export */ ZodNever: () => /* binding */ ZodNever,
            /* harmony export */ ZodNull: () => /* binding */ ZodNull,
            /* harmony export */ ZodNullable: () => /* binding */ ZodNullable,
            /* harmony export */ ZodNumber: () => /* binding */ ZodNumber,
            /* harmony export */ ZodObject: () => /* binding */ ZodObject,
            /* harmony export */ ZodOptional: () => /* binding */ ZodOptional,
            /* harmony export */ ZodParsedType: () =>
              /* binding */ ZodParsedType,
            /* harmony export */ ZodPipeline: () => /* binding */ ZodPipeline,
            /* harmony export */ ZodPromise: () => /* binding */ ZodPromise,
            /* harmony export */ ZodReadonly: () => /* binding */ ZodReadonly,
            /* harmony export */ ZodRecord: () => /* binding */ ZodRecord,
            /* harmony export */ ZodSchema: () => /* binding */ ZodType,
            /* harmony export */ ZodSet: () => /* binding */ ZodSet,
            /* harmony export */ ZodString: () => /* binding */ ZodString,
            /* harmony export */ ZodSymbol: () => /* binding */ ZodSymbol,
            /* harmony export */ ZodTransformer: () => /* binding */ ZodEffects,
            /* harmony export */ ZodTuple: () => /* binding */ ZodTuple,
            /* harmony export */ ZodType: () => /* binding */ ZodType,
            /* harmony export */ ZodUndefined: () => /* binding */ ZodUndefined,
            /* harmony export */ ZodUnion: () => /* binding */ ZodUnion,
            /* harmony export */ ZodUnknown: () => /* binding */ ZodUnknown,
            /* harmony export */ ZodVoid: () => /* binding */ ZodVoid,
            /* harmony export */ addIssueToContext: () =>
              /* binding */ addIssueToContext,
            /* harmony export */ any: () => /* binding */ anyType,
            /* harmony export */ array: () => /* binding */ arrayType,
            /* harmony export */ bigint: () => /* binding */ bigIntType,
            /* harmony export */ boolean: () => /* binding */ booleanType,
            /* harmony export */ coerce: () => /* binding */ coerce,
            /* harmony export */ custom: () => /* binding */ custom,
            /* harmony export */ date: () => /* binding */ dateType,
            /* harmony export */ datetimeRegex: () =>
              /* binding */ datetimeRegex,
            /* harmony export */ default: () => /* binding */ z,
            /* harmony export */ defaultErrorMap: () => /* binding */ errorMap,
            /* harmony export */ discriminatedUnion: () =>
              /* binding */ discriminatedUnionType,
            /* harmony export */ effect: () => /* binding */ effectsType,
            /* harmony export */ enum: () => /* binding */ enumType,
            /* harmony export */ function: () => /* binding */ functionType,
            /* harmony export */ getErrorMap: () => /* binding */ getErrorMap,
            /* harmony export */ getParsedType: () =>
              /* binding */ getParsedType,
            /* harmony export */ instanceof: () => /* binding */ instanceOfType,
            /* harmony export */ intersection: () =>
              /* binding */ intersectionType,
            /* harmony export */ isAborted: () => /* binding */ isAborted,
            /* harmony export */ isAsync: () => /* binding */ isAsync,
            /* harmony export */ isDirty: () => /* binding */ isDirty,
            /* harmony export */ isValid: () => /* binding */ isValid,
            /* harmony export */ late: () => /* binding */ late,
            /* harmony export */ lazy: () => /* binding */ lazyType,
            /* harmony export */ literal: () => /* binding */ literalType,
            /* harmony export */ makeIssue: () => /* binding */ makeIssue,
            /* harmony export */ map: () => /* binding */ mapType,
            /* harmony export */ nan: () => /* binding */ nanType,
            /* harmony export */ nativeEnum: () => /* binding */ nativeEnumType,
            /* harmony export */ never: () => /* binding */ neverType,
            /* harmony export */ null: () => /* binding */ nullType,
            /* harmony export */ nullable: () => /* binding */ nullableType,
            /* harmony export */ number: () => /* binding */ numberType,
            /* harmony export */ object: () => /* binding */ objectType,
            /* harmony export */ objectUtil: () => /* binding */ objectUtil,
            /* harmony export */ oboolean: () => /* binding */ oboolean,
            /* harmony export */ onumber: () => /* binding */ onumber,
            /* harmony export */ optional: () => /* binding */ optionalType,
            /* harmony export */ ostring: () => /* binding */ ostring,
            /* harmony export */ pipeline: () => /* binding */ pipelineType,
            /* harmony export */ preprocess: () => /* binding */ preprocessType,
            /* harmony export */ promise: () => /* binding */ promiseType,
            /* harmony export */ quotelessJson: () =>
              /* binding */ quotelessJson,
            /* harmony export */ record: () => /* binding */ recordType,
            /* harmony export */ set: () => /* binding */ setType,
            /* harmony export */ setErrorMap: () => /* binding */ setErrorMap,
            /* harmony export */ strictObject: () =>
              /* binding */ strictObjectType,
            /* harmony export */ string: () => /* binding */ stringType,
            /* harmony export */ symbol: () => /* binding */ symbolType,
            /* harmony export */ transformer: () => /* binding */ effectsType,
            /* harmony export */ tuple: () => /* binding */ tupleType,
            /* harmony export */ undefined: () => /* binding */ undefinedType,
            /* harmony export */ union: () => /* binding */ unionType,
            /* harmony export */ unknown: () => /* binding */ unknownType,
            /* harmony export */ util: () => /* binding */ util,
            /* harmony export */ void: () => /* binding */ voidType,
            /* harmony export */ z: () => /* binding */ z,
            /* harmony export */
          });
          var util;
          (function (util) {
            util.assertEqual = (val) => val;
            function assertIs(_arg) {}
            util.assertIs = assertIs;
            function assertNever(_x) {
              throw new Error();
            }
            util.assertNever = assertNever;
            util.arrayToEnum = (items) => {
              const obj = {};
              for (const item of items) {
                obj[item] = item;
              }
              return obj;
            };
            util.getValidEnumValues = (obj) => {
              const validKeys = util
                .objectKeys(obj)
                .filter((k) => typeof obj[obj[k]] !== "number");
              const filtered = {};
              for (const k of validKeys) {
                filtered[k] = obj[k];
              }
              return util.objectValues(filtered);
            };
            util.objectValues = (obj) => {
              return util.objectKeys(obj).map(function (e) {
                return obj[e];
              });
            };
            util.objectKeys =
              typeof Object.keys === "function" // eslint-disable-line ban/ban
                ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
                : (object) => {
                    const keys = [];
                    for (const key in object) {
                      if (Object.prototype.hasOwnProperty.call(object, key)) {
                        keys.push(key);
                      }
                    }
                    return keys;
                  };
            util.find = (arr, checker) => {
              for (const item of arr) {
                if (checker(item)) return item;
              }
              return undefined;
            };
            util.isInteger =
              typeof Number.isInteger === "function"
                ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
                : (val) =>
                    typeof val === "number" &&
                    isFinite(val) &&
                    Math.floor(val) === val;
            function joinValues(array, separator = " | ") {
              return array
                .map((val) => (typeof val === "string" ? `'${val}'` : val))
                .join(separator);
            }
            util.joinValues = joinValues;
            util.jsonStringifyReplacer = (_, value) => {
              if (typeof value === "bigint") {
                return value.toString();
              }
              return value;
            };
          })(util || (util = {}));
          var objectUtil;
          (function (objectUtil) {
            objectUtil.mergeShapes = (first, second) => {
              return {
                ...first,
                ...second, // second overwrites first
              };
            };
          })(objectUtil || (objectUtil = {}));
          const ZodParsedType = util.arrayToEnum([
            "string",
            "nan",
            "number",
            "integer",
            "float",
            "boolean",
            "date",
            "bigint",
            "symbol",
            "function",
            "undefined",
            "null",
            "array",
            "object",
            "unknown",
            "promise",
            "void",
            "never",
            "map",
            "set",
          ]);
          const getParsedType = (data) => {
            const t = typeof data;
            switch (t) {
              case "undefined":
                return ZodParsedType.undefined;
              case "string":
                return ZodParsedType.string;
              case "number":
                return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
              case "boolean":
                return ZodParsedType.boolean;
              case "function":
                return ZodParsedType.function;
              case "bigint":
                return ZodParsedType.bigint;
              case "symbol":
                return ZodParsedType.symbol;
              case "object":
                if (Array.isArray(data)) {
                  return ZodParsedType.array;
                }
                if (data === null) {
                  return ZodParsedType.null;
                }
                if (
                  data.then &&
                  typeof data.then === "function" &&
                  data.catch &&
                  typeof data.catch === "function"
                ) {
                  return ZodParsedType.promise;
                }
                if (typeof Map !== "undefined" && data instanceof Map) {
                  return ZodParsedType.map;
                }
                if (typeof Set !== "undefined" && data instanceof Set) {
                  return ZodParsedType.set;
                }
                if (typeof Date !== "undefined" && data instanceof Date) {
                  return ZodParsedType.date;
                }
                return ZodParsedType.object;
              default:
                return ZodParsedType.unknown;
            }
          };

          const ZodIssueCode = util.arrayToEnum([
            "invalid_type",
            "invalid_literal",
            "custom",
            "invalid_union",
            "invalid_union_discriminator",
            "invalid_enum_value",
            "unrecognized_keys",
            "invalid_arguments",
            "invalid_return_type",
            "invalid_date",
            "invalid_string",
            "too_small",
            "too_big",
            "invalid_intersection_types",
            "not_multiple_of",
            "not_finite",
          ]);
          const quotelessJson = (obj) => {
            const json = JSON.stringify(obj, null, 2);
            return json.replace(/"([^"]+)":/g, "$1:");
          };
          class ZodError extends Error {
            get errors() {
              return this.issues;
            }
            constructor(issues) {
              super();
              this.issues = [];
              this.addIssue = (sub) => {
                this.issues = [...this.issues, sub];
              };
              this.addIssues = (subs = []) => {
                this.issues = [...this.issues, ...subs];
              };
              const actualProto = new.target.prototype;
              if (Object.setPrototypeOf) {
                // eslint-disable-next-line ban/ban
                Object.setPrototypeOf(this, actualProto);
              } else {
                this.__proto__ = actualProto;
              }
              this.name = "ZodError";
              this.issues = issues;
            }
            format(_mapper) {
              const mapper =
                _mapper ||
                function (issue) {
                  return issue.message;
                };
              const fieldErrors = { _errors: [] };
              const processError = (error) => {
                for (const issue of error.issues) {
                  if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                  } else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                  } else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                  } else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                  } else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                      const el = issue.path[i];
                      const terminal = i === issue.path.length - 1;
                      if (!terminal) {
                        curr[el] = curr[el] || { _errors: [] };
                        // if (typeof el === "string") {
                        //   curr[el] = curr[el] || { _errors: [] };
                        // } else if (typeof el === "number") {
                        //   const errorArray: any = [];
                        //   errorArray._errors = [];
                        //   curr[el] = curr[el] || errorArray;
                        // }
                      } else {
                        curr[el] = curr[el] || { _errors: [] };
                        curr[el]._errors.push(mapper(issue));
                      }
                      curr = curr[el];
                      i++;
                    }
                  }
                }
              };
              processError(this);
              return fieldErrors;
            }
            static assert(value) {
              if (!(value instanceof ZodError)) {
                throw new Error(`Not a ZodError: ${value}`);
              }
            }
            toString() {
              return this.message;
            }
            get message() {
              return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
            }
            get isEmpty() {
              return this.issues.length === 0;
            }
            flatten(mapper = (issue) => issue.message) {
              const fieldErrors = {};
              const formErrors = [];
              for (const sub of this.issues) {
                if (sub.path.length > 0) {
                  fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                  fieldErrors[sub.path[0]].push(mapper(sub));
                } else {
                  formErrors.push(mapper(sub));
                }
              }
              return { formErrors, fieldErrors };
            }
            get formErrors() {
              return this.flatten();
            }
          }
          ZodError.create = (issues) => {
            const error = new ZodError(issues);
            return error;
          };

          const errorMap = (issue, _ctx) => {
            let message;
            switch (issue.code) {
              case ZodIssueCode.invalid_type:
                if (issue.received === ZodParsedType.undefined) {
                  message = "Required";
                } else {
                  message = `Expected ${issue.expected}, received ${issue.received}`;
                }
                break;
              case ZodIssueCode.invalid_literal:
                message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
                break;
              case ZodIssueCode.unrecognized_keys:
                message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
                break;
              case ZodIssueCode.invalid_union:
                message = `Invalid input`;
                break;
              case ZodIssueCode.invalid_union_discriminator:
                message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
                break;
              case ZodIssueCode.invalid_enum_value:
                message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
                break;
              case ZodIssueCode.invalid_arguments:
                message = `Invalid function arguments`;
                break;
              case ZodIssueCode.invalid_return_type:
                message = `Invalid function return type`;
                break;
              case ZodIssueCode.invalid_date:
                message = `Invalid date`;
                break;
              case ZodIssueCode.invalid_string:
                if (typeof issue.validation === "object") {
                  if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                      message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                  } else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                  } else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                  } else {
                    util.assertNever(issue.validation);
                  }
                } else if (issue.validation !== "regex") {
                  message = `Invalid ${issue.validation}`;
                } else {
                  message = "Invalid";
                }
                break;
              case ZodIssueCode.too_small:
                if (issue.type === "array")
                  message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
                else if (issue.type === "string")
                  message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
                else if (issue.type === "number")
                  message = `Number must be ${
                    issue.exact
                      ? `exactly equal to `
                      : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `
                  }${issue.minimum}`;
                else if (issue.type === "date")
                  message = `Date must be ${
                    issue.exact
                      ? `exactly equal to `
                      : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `
                  }${new Date(Number(issue.minimum))}`;
                else message = "Invalid input";
                break;
              case ZodIssueCode.too_big:
                if (issue.type === "array")
                  message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
                else if (issue.type === "string")
                  message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
                else if (issue.type === "number")
                  message = `Number must be ${
                    issue.exact
                      ? `exactly`
                      : issue.inclusive
                        ? `less than or equal to`
                        : `less than`
                  } ${issue.maximum}`;
                else if (issue.type === "bigint")
                  message = `BigInt must be ${
                    issue.exact
                      ? `exactly`
                      : issue.inclusive
                        ? `less than or equal to`
                        : `less than`
                  } ${issue.maximum}`;
                else if (issue.type === "date")
                  message = `Date must be ${
                    issue.exact
                      ? `exactly`
                      : issue.inclusive
                        ? `smaller than or equal to`
                        : `smaller than`
                  } ${new Date(Number(issue.maximum))}`;
                else message = "Invalid input";
                break;
              case ZodIssueCode.custom:
                message = `Invalid input`;
                break;
              case ZodIssueCode.invalid_intersection_types:
                message = `Intersection results could not be merged`;
                break;
              case ZodIssueCode.not_multiple_of:
                message = `Number must be a multiple of ${issue.multipleOf}`;
                break;
              case ZodIssueCode.not_finite:
                message = "Number must be finite";
                break;
              default:
                message = _ctx.defaultError;
                util.assertNever(issue);
            }
            return { message };
          };

          let overrideErrorMap = errorMap;
          function setErrorMap(map) {
            overrideErrorMap = map;
          }
          function getErrorMap() {
            return overrideErrorMap;
          }

          const makeIssue = (params) => {
            const { data, path, errorMaps, issueData } = params;
            const fullPath = [...path, ...(issueData.path || [])];
            const fullIssue = {
              ...issueData,
              path: fullPath,
            };
            if (issueData.message !== undefined) {
              return {
                ...issueData,
                path: fullPath,
                message: issueData.message,
              };
            }
            let errorMessage = "";
            const maps = errorMaps
              .filter((m) => !!m)
              .slice()
              .reverse();
            for (const map of maps) {
              errorMessage = map(fullIssue, {
                data,
                defaultError: errorMessage,
              }).message;
            }
            return {
              ...issueData,
              path: fullPath,
              message: errorMessage,
            };
          };
          const EMPTY_PATH = [];
          function addIssueToContext(ctx, issueData) {
            const overrideMap = getErrorMap();
            const issue = makeIssue({
              issueData: issueData,
              data: ctx.data,
              path: ctx.path,
              errorMaps: [
                ctx.common.contextualErrorMap, // contextual error map is first priority
                ctx.schemaErrorMap, // then schema-bound map if available
                overrideMap, // then global override map
                overrideMap === errorMap ? undefined : errorMap, // then global default map
              ].filter((x) => !!x),
            });
            ctx.common.issues.push(issue);
          }
          class ParseStatus {
            constructor() {
              this.value = "valid";
            }
            dirty() {
              if (this.value === "valid") this.value = "dirty";
            }
            abort() {
              if (this.value !== "aborted") this.value = "aborted";
            }
            static mergeArray(status, results) {
              const arrayValue = [];
              for (const s of results) {
                if (s.status === "aborted") return INVALID;
                if (s.status === "dirty") status.dirty();
                arrayValue.push(s.value);
              }
              return { status: status.value, value: arrayValue };
            }
            static async mergeObjectAsync(status, pairs) {
              const syncPairs = [];
              for (const pair of pairs) {
                const key = await pair.key;
                const value = await pair.value;
                syncPairs.push({
                  key,
                  value,
                });
              }
              return ParseStatus.mergeObjectSync(status, syncPairs);
            }
            static mergeObjectSync(status, pairs) {
              const finalObject = {};
              for (const pair of pairs) {
                const { key, value } = pair;
                if (key.status === "aborted") return INVALID;
                if (value.status === "aborted") return INVALID;
                if (key.status === "dirty") status.dirty();
                if (value.status === "dirty") status.dirty();
                if (
                  key.value !== "__proto__" &&
                  (typeof value.value !== "undefined" || pair.alwaysSet)
                ) {
                  finalObject[key.value] = value.value;
                }
              }
              return { status: status.value, value: finalObject };
            }
          }
          const INVALID = Object.freeze({
            status: "aborted",
          });
          const DIRTY = (value) => ({ status: "dirty", value });
          const OK = (value) => ({ status: "valid", value });
          const isAborted = (x) => x.status === "aborted";
          const isDirty = (x) => x.status === "dirty";
          const isValid = (x) => x.status === "valid";
          const isAsync = (x) =>
            typeof Promise !== "undefined" && x instanceof Promise;

          /******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

          function __classPrivateFieldGet(receiver, state, kind, f) {
            if (kind === "a" && !f)
              throw new TypeError(
                "Private accessor was defined without a getter",
              );
            if (
              typeof state === "function"
                ? receiver !== state || !f
                : !state.has(receiver)
            )
              throw new TypeError(
                "Cannot read private member from an object whose class did not declare it",
              );
            return kind === "m"
              ? f
              : kind === "a"
                ? f.call(receiver)
                : f
                  ? f.value
                  : state.get(receiver);
          }

          function __classPrivateFieldSet(receiver, state, value, kind, f) {
            if (kind === "m")
              throw new TypeError("Private method is not writable");
            if (kind === "a" && !f)
              throw new TypeError(
                "Private accessor was defined without a setter",
              );
            if (
              typeof state === "function"
                ? receiver !== state || !f
                : !state.has(receiver)
            )
              throw new TypeError(
                "Cannot write private member to an object whose class did not declare it",
              );
            return (
              kind === "a"
                ? f.call(receiver, value)
                : f
                  ? (f.value = value)
                  : state.set(receiver, value),
              value
            );
          }

          typeof SuppressedError === "function"
            ? SuppressedError
            : function (error, suppressed, message) {
                var e = new Error(message);
                return (
                  (e.name = "SuppressedError"),
                  (e.error = error),
                  (e.suppressed = suppressed),
                  e
                );
              };

          var errorUtil;
          (function (errorUtil) {
            errorUtil.errToObj = (message) =>
              typeof message === "string" ? { message } : message || {};
            errorUtil.toString = (message) =>
              typeof message === "string"
                ? message
                : message === null || message === void 0
                  ? void 0
                  : message.message;
          })(errorUtil || (errorUtil = {}));

          var _ZodEnum_cache, _ZodNativeEnum_cache;
          class ParseInputLazyPath {
            constructor(parent, value, path, key) {
              this._cachedPath = [];
              this.parent = parent;
              this.data = value;
              this._path = path;
              this._key = key;
            }
            get path() {
              if (!this._cachedPath.length) {
                if (this._key instanceof Array) {
                  this._cachedPath.push(...this._path, ...this._key);
                } else {
                  this._cachedPath.push(...this._path, this._key);
                }
              }
              return this._cachedPath;
            }
          }
          const handleResult = (ctx, result) => {
            if (isValid(result)) {
              return { success: true, data: result.value };
            } else {
              if (!ctx.common.issues.length) {
                throw new Error("Validation failed but no issues detected.");
              }
              return {
                success: false,
                get error() {
                  if (this._error) return this._error;
                  const error = new ZodError(ctx.common.issues);
                  this._error = error;
                  return this._error;
                },
              };
            }
          };
          function processCreateParams(params) {
            if (!params) return {};
            const {
              errorMap,
              invalid_type_error,
              required_error,
              description,
            } = params;
            if (errorMap && (invalid_type_error || required_error)) {
              throw new Error(
                `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
              );
            }
            if (errorMap) return { errorMap: errorMap, description };
            const customMap = (iss, ctx) => {
              var _a, _b;
              const { message } = params;
              if (iss.code === "invalid_enum_value") {
                return {
                  message:
                    message !== null && message !== void 0
                      ? message
                      : ctx.defaultError,
                };
              }
              if (typeof ctx.data === "undefined") {
                return {
                  message:
                    (_a =
                      message !== null && message !== void 0
                        ? message
                        : required_error) !== null && _a !== void 0
                      ? _a
                      : ctx.defaultError,
                };
              }
              if (iss.code !== "invalid_type")
                return { message: ctx.defaultError };
              return {
                message:
                  (_b =
                    message !== null && message !== void 0
                      ? message
                      : invalid_type_error) !== null && _b !== void 0
                    ? _b
                    : ctx.defaultError,
              };
            };
            return { errorMap: customMap, description };
          }
          class ZodType {
            get description() {
              return this._def.description;
            }
            _getType(input) {
              return getParsedType(input.data);
            }
            _getOrReturnCtx(input, ctx) {
              return (
                ctx || {
                  common: input.parent.common,
                  data: input.data,
                  parsedType: getParsedType(input.data),
                  schemaErrorMap: this._def.errorMap,
                  path: input.path,
                  parent: input.parent,
                }
              );
            }
            _processInputParams(input) {
              return {
                status: new ParseStatus(),
                ctx: {
                  common: input.parent.common,
                  data: input.data,
                  parsedType: getParsedType(input.data),
                  schemaErrorMap: this._def.errorMap,
                  path: input.path,
                  parent: input.parent,
                },
              };
            }
            _parseSync(input) {
              const result = this._parse(input);
              if (isAsync(result)) {
                throw new Error("Synchronous parse encountered promise.");
              }
              return result;
            }
            _parseAsync(input) {
              const result = this._parse(input);
              return Promise.resolve(result);
            }
            parse(data, params) {
              const result = this.safeParse(data, params);
              if (result.success) return result.data;
              throw result.error;
            }
            safeParse(data, params) {
              var _a;
              const ctx = {
                common: {
                  issues: [],
                  async:
                    (_a =
                      params === null || params === void 0
                        ? void 0
                        : params.async) !== null && _a !== void 0
                      ? _a
                      : false,
                  contextualErrorMap:
                    params === null || params === void 0
                      ? void 0
                      : params.errorMap,
                },
                path:
                  (params === null || params === void 0
                    ? void 0
                    : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data,
                parsedType: getParsedType(data),
              };
              const result = this._parseSync({
                data,
                path: ctx.path,
                parent: ctx,
              });
              return handleResult(ctx, result);
            }
            "~validate"(data) {
              var _a, _b;
              const ctx = {
                common: {
                  issues: [],
                  async: !!this["~standard"].async,
                },
                path: [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data,
                parsedType: getParsedType(data),
              };
              if (!this["~standard"].async) {
                try {
                  const result = this._parseSync({
                    data,
                    path: [],
                    parent: ctx,
                  });
                  return isValid(result)
                    ? {
                        value: result.value,
                      }
                    : {
                        issues: ctx.common.issues,
                      };
                } catch (err) {
                  if (
                    (_b =
                      (_a =
                        err === null || err === void 0
                          ? void 0
                          : err.message) === null || _a === void 0
                        ? void 0
                        : _a.toLowerCase()) === null || _b === void 0
                      ? void 0
                      : _b.includes("encountered")
                  ) {
                    this["~standard"].async = true;
                  }
                  ctx.common = {
                    issues: [],
                    async: true,
                  };
                }
              }
              return this._parseAsync({ data, path: [], parent: ctx }).then(
                (result) =>
                  isValid(result)
                    ? {
                        value: result.value,
                      }
                    : {
                        issues: ctx.common.issues,
                      },
              );
            }
            async parseAsync(data, params) {
              const result = await this.safeParseAsync(data, params);
              if (result.success) return result.data;
              throw result.error;
            }
            async safeParseAsync(data, params) {
              const ctx = {
                common: {
                  issues: [],
                  contextualErrorMap:
                    params === null || params === void 0
                      ? void 0
                      : params.errorMap,
                  async: true,
                },
                path:
                  (params === null || params === void 0
                    ? void 0
                    : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data,
                parsedType: getParsedType(data),
              };
              const maybeAsyncResult = this._parse({
                data,
                path: ctx.path,
                parent: ctx,
              });
              const result = await (isAsync(maybeAsyncResult)
                ? maybeAsyncResult
                : Promise.resolve(maybeAsyncResult));
              return handleResult(ctx, result);
            }
            refine(check, message) {
              const getIssueProperties = (val) => {
                if (
                  typeof message === "string" ||
                  typeof message === "undefined"
                ) {
                  return { message };
                } else if (typeof message === "function") {
                  return message(val);
                } else {
                  return message;
                }
              };
              return this._refinement((val, ctx) => {
                const result = check(val);
                const setError = () =>
                  ctx.addIssue({
                    code: ZodIssueCode.custom,
                    ...getIssueProperties(val),
                  });
                if (
                  typeof Promise !== "undefined" &&
                  result instanceof Promise
                ) {
                  return result.then((data) => {
                    if (!data) {
                      setError();
                      return false;
                    } else {
                      return true;
                    }
                  });
                }
                if (!result) {
                  setError();
                  return false;
                } else {
                  return true;
                }
              });
            }
            refinement(check, refinementData) {
              return this._refinement((val, ctx) => {
                if (!check(val)) {
                  ctx.addIssue(
                    typeof refinementData === "function"
                      ? refinementData(val, ctx)
                      : refinementData,
                  );
                  return false;
                } else {
                  return true;
                }
              });
            }
            _refinement(refinement) {
              return new ZodEffects({
                schema: this,
                typeName: ZodFirstPartyTypeKind.ZodEffects,
                effect: { type: "refinement", refinement },
              });
            }
            superRefine(refinement) {
              return this._refinement(refinement);
            }
            constructor(def) {
              /** Alias of safeParseAsync */
              this.spa = this.safeParseAsync;
              this._def = def;
              this.parse = this.parse.bind(this);
              this.safeParse = this.safeParse.bind(this);
              this.parseAsync = this.parseAsync.bind(this);
              this.safeParseAsync = this.safeParseAsync.bind(this);
              this.spa = this.spa.bind(this);
              this.refine = this.refine.bind(this);
              this.refinement = this.refinement.bind(this);
              this.superRefine = this.superRefine.bind(this);
              this.optional = this.optional.bind(this);
              this.nullable = this.nullable.bind(this);
              this.nullish = this.nullish.bind(this);
              this.array = this.array.bind(this);
              this.promise = this.promise.bind(this);
              this.or = this.or.bind(this);
              this.and = this.and.bind(this);
              this.transform = this.transform.bind(this);
              this.brand = this.brand.bind(this);
              this.default = this.default.bind(this);
              this.catch = this.catch.bind(this);
              this.describe = this.describe.bind(this);
              this.pipe = this.pipe.bind(this);
              this.readonly = this.readonly.bind(this);
              this.isNullable = this.isNullable.bind(this);
              this.isOptional = this.isOptional.bind(this);
              this["~standard"] = {
                version: 1,
                vendor: "zod",
                validate: (data) => this["~validate"](data),
              };
            }
            optional() {
              return ZodOptional.create(this, this._def);
            }
            nullable() {
              return ZodNullable.create(this, this._def);
            }
            nullish() {
              return this.nullable().optional();
            }
            array() {
              return ZodArray.create(this);
            }
            promise() {
              return ZodPromise.create(this, this._def);
            }
            or(option) {
              return ZodUnion.create([this, option], this._def);
            }
            and(incoming) {
              return ZodIntersection.create(this, incoming, this._def);
            }
            transform(transform) {
              return new ZodEffects({
                ...processCreateParams(this._def),
                schema: this,
                typeName: ZodFirstPartyTypeKind.ZodEffects,
                effect: { type: "transform", transform },
              });
            }
            default(def) {
              const defaultValueFunc =
                typeof def === "function" ? def : () => def;
              return new ZodDefault({
                ...processCreateParams(this._def),
                innerType: this,
                defaultValue: defaultValueFunc,
                typeName: ZodFirstPartyTypeKind.ZodDefault,
              });
            }
            brand() {
              return new ZodBranded({
                typeName: ZodFirstPartyTypeKind.ZodBranded,
                type: this,
                ...processCreateParams(this._def),
              });
            }
            catch(def) {
              const catchValueFunc =
                typeof def === "function" ? def : () => def;
              return new ZodCatch({
                ...processCreateParams(this._def),
                innerType: this,
                catchValue: catchValueFunc,
                typeName: ZodFirstPartyTypeKind.ZodCatch,
              });
            }
            describe(description) {
              const This = this.constructor;
              return new This({
                ...this._def,
                description,
              });
            }
            pipe(target) {
              return ZodPipeline.create(this, target);
            }
            readonly() {
              return ZodReadonly.create(this);
            }
            isOptional() {
              return this.safeParse(undefined).success;
            }
            isNullable() {
              return this.safeParse(null).success;
            }
          }
          const cuidRegex = /^c[^\s-]{8,}$/i;
          const cuid2Regex = /^[0-9a-z]+$/;
          const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
          // const uuidRegex =
          //   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
          const uuidRegex =
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
          const nanoidRegex = /^[a-z0-9_-]{21}$/i;
          const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
          const durationRegex =
            /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
          // from https://stackoverflow.com/a/46181/1550155
          // old version: too slow, didn't support unicode
          // const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
          //old email regex
          // const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
          // eslint-disable-next-line
          // const emailRegex =
          //   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
          // const emailRegex =
          //   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          // const emailRegex =
          //   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
          const emailRegex =
            /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
          // const emailRegex =
          //   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
          // from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
          const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
          let emojiRegex;
          // faster, simpler, safer
          const ipv4Regex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
          const ipv4CidrRegex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
          // const ipv6Regex =
          // /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
          const ipv6Regex =
            /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
          const ipv6CidrRegex =
            /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
          // https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
          const base64Regex =
            /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
          // https://base64.guru/standards/base64url
          const base64urlRegex =
            /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
          // simple
          // const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
          // no leap year validation
          // const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
          // with leap year validation
          const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
          const dateRegex = new RegExp(`^${dateRegexSource}$`);
          function timeRegexSource(args) {
            // let regex = `\\d{2}:\\d{2}:\\d{2}`;
            let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
            if (args.precision) {
              regex = `${regex}\\.\\d{${args.precision}}`;
            } else if (args.precision == null) {
              regex = `${regex}(\\.\\d+)?`;
            }
            return regex;
          }
          function timeRegex(args) {
            return new RegExp(`^${timeRegexSource(args)}$`);
          }
          // Adapted from https://stackoverflow.com/a/3143231
          function datetimeRegex(args) {
            let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
            const opts = [];
            opts.push(args.local ? `Z?` : `Z`);
            if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
            regex = `${regex}(${opts.join("|")})`;
            return new RegExp(`^${regex}$`);
          }
          function isValidIP(ip, version) {
            if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
              return true;
            }
            if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
              return true;
            }
            return false;
          }
          function isValidJWT(jwt, alg) {
            if (!jwtRegex.test(jwt)) return false;
            try {
              const [header] = jwt.split(".");
              // Convert base64url to base64
              const base64 = header
                .replace(/-/g, "+")
                .replace(/_/g, "/")
                .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
              const decoded = JSON.parse(atob(base64));
              if (typeof decoded !== "object" || decoded === null) return false;
              if (!decoded.typ || !decoded.alg) return false;
              if (alg && decoded.alg !== alg) return false;
              return true;
            } catch (_a) {
              return false;
            }
          }
          function isValidCidr(ip, version) {
            if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
              return true;
            }
            if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
              return true;
            }
            return false;
          }
          class ZodString extends ZodType {
            _parse(input) {
              if (this._def.coerce) {
                input.data = String(input.data);
              }
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.string) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.string,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const status = new ParseStatus();
              let ctx = undefined;
              for (const check of this._def.checks) {
                if (check.kind === "min") {
                  if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_small,
                      minimum: check.value,
                      type: "string",
                      inclusive: true,
                      exact: false,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "max") {
                  if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_big,
                      maximum: check.value,
                      type: "string",
                      inclusive: true,
                      exact: false,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "length") {
                  const tooBig = input.data.length > check.value;
                  const tooSmall = input.data.length < check.value;
                  if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                      addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: true,
                        message: check.message,
                      });
                    } else if (tooSmall) {
                      addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: true,
                        message: check.message,
                      });
                    }
                    status.dirty();
                  }
                } else if (check.kind === "email") {
                  if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "email",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "emoji") {
                  if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                  }
                  if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "emoji",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "uuid") {
                  if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "uuid",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "nanoid") {
                  if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "nanoid",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "cuid") {
                  if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "cuid",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "cuid2") {
                  if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "cuid2",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "ulid") {
                  if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "ulid",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "url") {
                  try {
                    new URL(input.data);
                  } catch (_a) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "url",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "regex") {
                  check.regex.lastIndex = 0;
                  const testResult = check.regex.test(input.data);
                  if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "regex",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "trim") {
                  input.data = input.data.trim();
                } else if (check.kind === "includes") {
                  if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: {
                        includes: check.value,
                        position: check.position,
                      },
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "toLowerCase") {
                  input.data = input.data.toLowerCase();
                } else if (check.kind === "toUpperCase") {
                  input.data = input.data.toUpperCase();
                } else if (check.kind === "startsWith") {
                  if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: { startsWith: check.value },
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "endsWith") {
                  if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: { endsWith: check.value },
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "datetime") {
                  const regex = datetimeRegex(check);
                  if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: "datetime",
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "date") {
                  const regex = dateRegex;
                  if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: "date",
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "time") {
                  const regex = timeRegex(check);
                  if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_string,
                      validation: "time",
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "duration") {
                  if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "duration",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "ip") {
                  if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "ip",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "jwt") {
                  if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "jwt",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "cidr") {
                  if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "cidr",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "base64") {
                  if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "base64",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "base64url") {
                  if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      validation: "base64url",
                      code: ZodIssueCode.invalid_string,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else {
                  util.assertNever(check);
                }
              }
              return { status: status.value, value: input.data };
            }
            _regex(regex, validation, message) {
              return this.refinement((data) => regex.test(data), {
                validation,
                code: ZodIssueCode.invalid_string,
                ...errorUtil.errToObj(message),
              });
            }
            _addCheck(check) {
              return new ZodString({
                ...this._def,
                checks: [...this._def.checks, check],
              });
            }
            email(message) {
              return this._addCheck({
                kind: "email",
                ...errorUtil.errToObj(message),
              });
            }
            url(message) {
              return this._addCheck({
                kind: "url",
                ...errorUtil.errToObj(message),
              });
            }
            emoji(message) {
              return this._addCheck({
                kind: "emoji",
                ...errorUtil.errToObj(message),
              });
            }
            uuid(message) {
              return this._addCheck({
                kind: "uuid",
                ...errorUtil.errToObj(message),
              });
            }
            nanoid(message) {
              return this._addCheck({
                kind: "nanoid",
                ...errorUtil.errToObj(message),
              });
            }
            cuid(message) {
              return this._addCheck({
                kind: "cuid",
                ...errorUtil.errToObj(message),
              });
            }
            cuid2(message) {
              return this._addCheck({
                kind: "cuid2",
                ...errorUtil.errToObj(message),
              });
            }
            ulid(message) {
              return this._addCheck({
                kind: "ulid",
                ...errorUtil.errToObj(message),
              });
            }
            base64(message) {
              return this._addCheck({
                kind: "base64",
                ...errorUtil.errToObj(message),
              });
            }
            base64url(message) {
              // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
              return this._addCheck({
                kind: "base64url",
                ...errorUtil.errToObj(message),
              });
            }
            jwt(options) {
              return this._addCheck({
                kind: "jwt",
                ...errorUtil.errToObj(options),
              });
            }
            ip(options) {
              return this._addCheck({
                kind: "ip",
                ...errorUtil.errToObj(options),
              });
            }
            cidr(options) {
              return this._addCheck({
                kind: "cidr",
                ...errorUtil.errToObj(options),
              });
            }
            datetime(options) {
              var _a, _b;
              if (typeof options === "string") {
                return this._addCheck({
                  kind: "datetime",
                  precision: null,
                  offset: false,
                  local: false,
                  message: options,
                });
              }
              return this._addCheck({
                kind: "datetime",
                precision:
                  typeof (options === null || options === void 0
                    ? void 0
                    : options.precision) === "undefined"
                    ? null
                    : options === null || options === void 0
                      ? void 0
                      : options.precision,
                offset:
                  (_a =
                    options === null || options === void 0
                      ? void 0
                      : options.offset) !== null && _a !== void 0
                    ? _a
                    : false,
                local:
                  (_b =
                    options === null || options === void 0
                      ? void 0
                      : options.local) !== null && _b !== void 0
                    ? _b
                    : false,
                ...errorUtil.errToObj(
                  options === null || options === void 0
                    ? void 0
                    : options.message,
                ),
              });
            }
            date(message) {
              return this._addCheck({ kind: "date", message });
            }
            time(options) {
              if (typeof options === "string") {
                return this._addCheck({
                  kind: "time",
                  precision: null,
                  message: options,
                });
              }
              return this._addCheck({
                kind: "time",
                precision:
                  typeof (options === null || options === void 0
                    ? void 0
                    : options.precision) === "undefined"
                    ? null
                    : options === null || options === void 0
                      ? void 0
                      : options.precision,
                ...errorUtil.errToObj(
                  options === null || options === void 0
                    ? void 0
                    : options.message,
                ),
              });
            }
            duration(message) {
              return this._addCheck({
                kind: "duration",
                ...errorUtil.errToObj(message),
              });
            }
            regex(regex, message) {
              return this._addCheck({
                kind: "regex",
                regex: regex,
                ...errorUtil.errToObj(message),
              });
            }
            includes(value, options) {
              return this._addCheck({
                kind: "includes",
                value: value,
                position:
                  options === null || options === void 0
                    ? void 0
                    : options.position,
                ...errorUtil.errToObj(
                  options === null || options === void 0
                    ? void 0
                    : options.message,
                ),
              });
            }
            startsWith(value, message) {
              return this._addCheck({
                kind: "startsWith",
                value: value,
                ...errorUtil.errToObj(message),
              });
            }
            endsWith(value, message) {
              return this._addCheck({
                kind: "endsWith",
                value: value,
                ...errorUtil.errToObj(message),
              });
            }
            min(minLength, message) {
              return this._addCheck({
                kind: "min",
                value: minLength,
                ...errorUtil.errToObj(message),
              });
            }
            max(maxLength, message) {
              return this._addCheck({
                kind: "max",
                value: maxLength,
                ...errorUtil.errToObj(message),
              });
            }
            length(len, message) {
              return this._addCheck({
                kind: "length",
                value: len,
                ...errorUtil.errToObj(message),
              });
            }
            /**
             * Equivalent to `.min(1)`
             */
            nonempty(message) {
              return this.min(1, errorUtil.errToObj(message));
            }
            trim() {
              return new ZodString({
                ...this._def,
                checks: [...this._def.checks, { kind: "trim" }],
              });
            }
            toLowerCase() {
              return new ZodString({
                ...this._def,
                checks: [...this._def.checks, { kind: "toLowerCase" }],
              });
            }
            toUpperCase() {
              return new ZodString({
                ...this._def,
                checks: [...this._def.checks, { kind: "toUpperCase" }],
              });
            }
            get isDatetime() {
              return !!this._def.checks.find((ch) => ch.kind === "datetime");
            }
            get isDate() {
              return !!this._def.checks.find((ch) => ch.kind === "date");
            }
            get isTime() {
              return !!this._def.checks.find((ch) => ch.kind === "time");
            }
            get isDuration() {
              return !!this._def.checks.find((ch) => ch.kind === "duration");
            }
            get isEmail() {
              return !!this._def.checks.find((ch) => ch.kind === "email");
            }
            get isURL() {
              return !!this._def.checks.find((ch) => ch.kind === "url");
            }
            get isEmoji() {
              return !!this._def.checks.find((ch) => ch.kind === "emoji");
            }
            get isUUID() {
              return !!this._def.checks.find((ch) => ch.kind === "uuid");
            }
            get isNANOID() {
              return !!this._def.checks.find((ch) => ch.kind === "nanoid");
            }
            get isCUID() {
              return !!this._def.checks.find((ch) => ch.kind === "cuid");
            }
            get isCUID2() {
              return !!this._def.checks.find((ch) => ch.kind === "cuid2");
            }
            get isULID() {
              return !!this._def.checks.find((ch) => ch.kind === "ulid");
            }
            get isIP() {
              return !!this._def.checks.find((ch) => ch.kind === "ip");
            }
            get isCIDR() {
              return !!this._def.checks.find((ch) => ch.kind === "cidr");
            }
            get isBase64() {
              return !!this._def.checks.find((ch) => ch.kind === "base64");
            }
            get isBase64url() {
              // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
              return !!this._def.checks.find((ch) => ch.kind === "base64url");
            }
            get minLength() {
              let min = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                  if (min === null || ch.value > min) min = ch.value;
                }
              }
              return min;
            }
            get maxLength() {
              let max = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                  if (max === null || ch.value < max) max = ch.value;
                }
              }
              return max;
            }
          }
          ZodString.create = (params) => {
            var _a;
            return new ZodString({
              checks: [],
              typeName: ZodFirstPartyTypeKind.ZodString,
              coerce:
                (_a =
                  params === null || params === void 0
                    ? void 0
                    : params.coerce) !== null && _a !== void 0
                  ? _a
                  : false,
              ...processCreateParams(params),
            });
          };
          // https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
          function floatSafeRemainder(val, step) {
            const valDecCount = (val.toString().split(".")[1] || "").length;
            const stepDecCount = (step.toString().split(".")[1] || "").length;
            const decCount =
              valDecCount > stepDecCount ? valDecCount : stepDecCount;
            const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
            const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
            return (valInt % stepInt) / Math.pow(10, decCount);
          }
          class ZodNumber extends ZodType {
            constructor() {
              super(...arguments);
              this.min = this.gte;
              this.max = this.lte;
              this.step = this.multipleOf;
            }
            _parse(input) {
              if (this._def.coerce) {
                input.data = Number(input.data);
              }
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.number) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.number,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              let ctx = undefined;
              const status = new ParseStatus();
              for (const check of this._def.checks) {
                if (check.kind === "int") {
                  if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.invalid_type,
                      expected: "integer",
                      received: "float",
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "min") {
                  const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                  if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_small,
                      minimum: check.value,
                      type: "number",
                      inclusive: check.inclusive,
                      exact: false,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "max") {
                  const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                  if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_big,
                      maximum: check.value,
                      type: "number",
                      inclusive: check.inclusive,
                      exact: false,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "multipleOf") {
                  if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.not_multiple_of,
                      multipleOf: check.value,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "finite") {
                  if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.not_finite,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else {
                  util.assertNever(check);
                }
              }
              return { status: status.value, value: input.data };
            }
            gte(value, message) {
              return this.setLimit(
                "min",
                value,
                true,
                errorUtil.toString(message),
              );
            }
            gt(value, message) {
              return this.setLimit(
                "min",
                value,
                false,
                errorUtil.toString(message),
              );
            }
            lte(value, message) {
              return this.setLimit(
                "max",
                value,
                true,
                errorUtil.toString(message),
              );
            }
            lt(value, message) {
              return this.setLimit(
                "max",
                value,
                false,
                errorUtil.toString(message),
              );
            }
            setLimit(kind, value, inclusive, message) {
              return new ZodNumber({
                ...this._def,
                checks: [
                  ...this._def.checks,
                  {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                  },
                ],
              });
            }
            _addCheck(check) {
              return new ZodNumber({
                ...this._def,
                checks: [...this._def.checks, check],
              });
            }
            int(message) {
              return this._addCheck({
                kind: "int",
                message: errorUtil.toString(message),
              });
            }
            positive(message) {
              return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: false,
                message: errorUtil.toString(message),
              });
            }
            negative(message) {
              return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: false,
                message: errorUtil.toString(message),
              });
            }
            nonpositive(message) {
              return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: true,
                message: errorUtil.toString(message),
              });
            }
            nonnegative(message) {
              return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: true,
                message: errorUtil.toString(message),
              });
            }
            multipleOf(value, message) {
              return this._addCheck({
                kind: "multipleOf",
                value: value,
                message: errorUtil.toString(message),
              });
            }
            finite(message) {
              return this._addCheck({
                kind: "finite",
                message: errorUtil.toString(message),
              });
            }
            safe(message) {
              return this._addCheck({
                kind: "min",
                inclusive: true,
                value: Number.MIN_SAFE_INTEGER,
                message: errorUtil.toString(message),
              })._addCheck({
                kind: "max",
                inclusive: true,
                value: Number.MAX_SAFE_INTEGER,
                message: errorUtil.toString(message),
              });
            }
            get minValue() {
              let min = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                  if (min === null || ch.value > min) min = ch.value;
                }
              }
              return min;
            }
            get maxValue() {
              let max = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                  if (max === null || ch.value < max) max = ch.value;
                }
              }
              return max;
            }
            get isInt() {
              return !!this._def.checks.find(
                (ch) =>
                  ch.kind === "int" ||
                  (ch.kind === "multipleOf" && util.isInteger(ch.value)),
              );
            }
            get isFinite() {
              let max = null,
                min = null;
              for (const ch of this._def.checks) {
                if (
                  ch.kind === "finite" ||
                  ch.kind === "int" ||
                  ch.kind === "multipleOf"
                ) {
                  return true;
                } else if (ch.kind === "min") {
                  if (min === null || ch.value > min) min = ch.value;
                } else if (ch.kind === "max") {
                  if (max === null || ch.value < max) max = ch.value;
                }
              }
              return Number.isFinite(min) && Number.isFinite(max);
            }
          }
          ZodNumber.create = (params) => {
            return new ZodNumber({
              checks: [],
              typeName: ZodFirstPartyTypeKind.ZodNumber,
              coerce:
                (params === null || params === void 0
                  ? void 0
                  : params.coerce) || false,
              ...processCreateParams(params),
            });
          };
          class ZodBigInt extends ZodType {
            constructor() {
              super(...arguments);
              this.min = this.gte;
              this.max = this.lte;
            }
            _parse(input) {
              if (this._def.coerce) {
                try {
                  input.data = BigInt(input.data);
                } catch (_a) {
                  return this._getInvalidInput(input);
                }
              }
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.bigint) {
                return this._getInvalidInput(input);
              }
              let ctx = undefined;
              const status = new ParseStatus();
              for (const check of this._def.checks) {
                if (check.kind === "min") {
                  const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                  if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_small,
                      type: "bigint",
                      minimum: check.value,
                      inclusive: check.inclusive,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "max") {
                  const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                  if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_big,
                      type: "bigint",
                      maximum: check.value,
                      inclusive: check.inclusive,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else if (check.kind === "multipleOf") {
                  if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.not_multiple_of,
                      multipleOf: check.value,
                      message: check.message,
                    });
                    status.dirty();
                  }
                } else {
                  util.assertNever(check);
                }
              }
              return { status: status.value, value: input.data };
            }
            _getInvalidInput(input) {
              const ctx = this._getOrReturnCtx(input);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.bigint,
                received: ctx.parsedType,
              });
              return INVALID;
            }
            gte(value, message) {
              return this.setLimit(
                "min",
                value,
                true,
                errorUtil.toString(message),
              );
            }
            gt(value, message) {
              return this.setLimit(
                "min",
                value,
                false,
                errorUtil.toString(message),
              );
            }
            lte(value, message) {
              return this.setLimit(
                "max",
                value,
                true,
                errorUtil.toString(message),
              );
            }
            lt(value, message) {
              return this.setLimit(
                "max",
                value,
                false,
                errorUtil.toString(message),
              );
            }
            setLimit(kind, value, inclusive, message) {
              return new ZodBigInt({
                ...this._def,
                checks: [
                  ...this._def.checks,
                  {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                  },
                ],
              });
            }
            _addCheck(check) {
              return new ZodBigInt({
                ...this._def,
                checks: [...this._def.checks, check],
              });
            }
            positive(message) {
              return this._addCheck({
                kind: "min",
                value: BigInt(0),
                inclusive: false,
                message: errorUtil.toString(message),
              });
            }
            negative(message) {
              return this._addCheck({
                kind: "max",
                value: BigInt(0),
                inclusive: false,
                message: errorUtil.toString(message),
              });
            }
            nonpositive(message) {
              return this._addCheck({
                kind: "max",
                value: BigInt(0),
                inclusive: true,
                message: errorUtil.toString(message),
              });
            }
            nonnegative(message) {
              return this._addCheck({
                kind: "min",
                value: BigInt(0),
                inclusive: true,
                message: errorUtil.toString(message),
              });
            }
            multipleOf(value, message) {
              return this._addCheck({
                kind: "multipleOf",
                value,
                message: errorUtil.toString(message),
              });
            }
            get minValue() {
              let min = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                  if (min === null || ch.value > min) min = ch.value;
                }
              }
              return min;
            }
            get maxValue() {
              let max = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                  if (max === null || ch.value < max) max = ch.value;
                }
              }
              return max;
            }
          }
          ZodBigInt.create = (params) => {
            var _a;
            return new ZodBigInt({
              checks: [],
              typeName: ZodFirstPartyTypeKind.ZodBigInt,
              coerce:
                (_a =
                  params === null || params === void 0
                    ? void 0
                    : params.coerce) !== null && _a !== void 0
                  ? _a
                  : false,
              ...processCreateParams(params),
            });
          };
          class ZodBoolean extends ZodType {
            _parse(input) {
              if (this._def.coerce) {
                input.data = Boolean(input.data);
              }
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.boolean) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.boolean,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return OK(input.data);
            }
          }
          ZodBoolean.create = (params) => {
            return new ZodBoolean({
              typeName: ZodFirstPartyTypeKind.ZodBoolean,
              coerce:
                (params === null || params === void 0
                  ? void 0
                  : params.coerce) || false,
              ...processCreateParams(params),
            });
          };
          class ZodDate extends ZodType {
            _parse(input) {
              if (this._def.coerce) {
                input.data = new Date(input.data);
              }
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.date) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.date,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              if (isNaN(input.data.getTime())) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_date,
                });
                return INVALID;
              }
              const status = new ParseStatus();
              let ctx = undefined;
              for (const check of this._def.checks) {
                if (check.kind === "min") {
                  if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_small,
                      message: check.message,
                      inclusive: true,
                      exact: false,
                      minimum: check.value,
                      type: "date",
                    });
                    status.dirty();
                  }
                } else if (check.kind === "max") {
                  if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.too_big,
                      message: check.message,
                      inclusive: true,
                      exact: false,
                      maximum: check.value,
                      type: "date",
                    });
                    status.dirty();
                  }
                } else {
                  util.assertNever(check);
                }
              }
              return {
                status: status.value,
                value: new Date(input.data.getTime()),
              };
            }
            _addCheck(check) {
              return new ZodDate({
                ...this._def,
                checks: [...this._def.checks, check],
              });
            }
            min(minDate, message) {
              return this._addCheck({
                kind: "min",
                value: minDate.getTime(),
                message: errorUtil.toString(message),
              });
            }
            max(maxDate, message) {
              return this._addCheck({
                kind: "max",
                value: maxDate.getTime(),
                message: errorUtil.toString(message),
              });
            }
            get minDate() {
              let min = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                  if (min === null || ch.value > min) min = ch.value;
                }
              }
              return min != null ? new Date(min) : null;
            }
            get maxDate() {
              let max = null;
              for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                  if (max === null || ch.value < max) max = ch.value;
                }
              }
              return max != null ? new Date(max) : null;
            }
          }
          ZodDate.create = (params) => {
            return new ZodDate({
              checks: [],
              coerce:
                (params === null || params === void 0
                  ? void 0
                  : params.coerce) || false,
              typeName: ZodFirstPartyTypeKind.ZodDate,
              ...processCreateParams(params),
            });
          };
          class ZodSymbol extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.symbol) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.symbol,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return OK(input.data);
            }
          }
          ZodSymbol.create = (params) => {
            return new ZodSymbol({
              typeName: ZodFirstPartyTypeKind.ZodSymbol,
              ...processCreateParams(params),
            });
          };
          class ZodUndefined extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.undefined) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.undefined,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return OK(input.data);
            }
          }
          ZodUndefined.create = (params) => {
            return new ZodUndefined({
              typeName: ZodFirstPartyTypeKind.ZodUndefined,
              ...processCreateParams(params),
            });
          };
          class ZodNull extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.null) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.null,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return OK(input.data);
            }
          }
          ZodNull.create = (params) => {
            return new ZodNull({
              typeName: ZodFirstPartyTypeKind.ZodNull,
              ...processCreateParams(params),
            });
          };
          class ZodAny extends ZodType {
            constructor() {
              super(...arguments);
              // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
              this._any = true;
            }
            _parse(input) {
              return OK(input.data);
            }
          }
          ZodAny.create = (params) => {
            return new ZodAny({
              typeName: ZodFirstPartyTypeKind.ZodAny,
              ...processCreateParams(params),
            });
          };
          class ZodUnknown extends ZodType {
            constructor() {
              super(...arguments);
              // required
              this._unknown = true;
            }
            _parse(input) {
              return OK(input.data);
            }
          }
          ZodUnknown.create = (params) => {
            return new ZodUnknown({
              typeName: ZodFirstPartyTypeKind.ZodUnknown,
              ...processCreateParams(params),
            });
          };
          class ZodNever extends ZodType {
            _parse(input) {
              const ctx = this._getOrReturnCtx(input);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.never,
                received: ctx.parsedType,
              });
              return INVALID;
            }
          }
          ZodNever.create = (params) => {
            return new ZodNever({
              typeName: ZodFirstPartyTypeKind.ZodNever,
              ...processCreateParams(params),
            });
          };
          class ZodVoid extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.undefined) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.void,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return OK(input.data);
            }
          }
          ZodVoid.create = (params) => {
            return new ZodVoid({
              typeName: ZodFirstPartyTypeKind.ZodVoid,
              ...processCreateParams(params),
            });
          };
          class ZodArray extends ZodType {
            _parse(input) {
              const { ctx, status } = this._processInputParams(input);
              const def = this._def;
              if (ctx.parsedType !== ZodParsedType.array) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.array,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              if (def.exactLength !== null) {
                const tooBig = ctx.data.length > def.exactLength.value;
                const tooSmall = ctx.data.length < def.exactLength.value;
                if (tooBig || tooSmall) {
                  addIssueToContext(ctx, {
                    code: tooBig
                      ? ZodIssueCode.too_big
                      : ZodIssueCode.too_small,
                    minimum: tooSmall ? def.exactLength.value : undefined,
                    maximum: tooBig ? def.exactLength.value : undefined,
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                  });
                  status.dirty();
                }
              }
              if (def.minLength !== null) {
                if (ctx.data.length < def.minLength.value) {
                  addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                  });
                  status.dirty();
                }
              }
              if (def.maxLength !== null) {
                if (ctx.data.length > def.maxLength.value) {
                  addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                  });
                  status.dirty();
                }
              }
              if (ctx.common.async) {
                return Promise.all(
                  [...ctx.data].map((item, i) => {
                    return def.type._parseAsync(
                      new ParseInputLazyPath(ctx, item, ctx.path, i),
                    );
                  }),
                ).then((result) => {
                  return ParseStatus.mergeArray(status, result);
                });
              }
              const result = [...ctx.data].map((item, i) => {
                return def.type._parseSync(
                  new ParseInputLazyPath(ctx, item, ctx.path, i),
                );
              });
              return ParseStatus.mergeArray(status, result);
            }
            get element() {
              return this._def.type;
            }
            min(minLength, message) {
              return new ZodArray({
                ...this._def,
                minLength: {
                  value: minLength,
                  message: errorUtil.toString(message),
                },
              });
            }
            max(maxLength, message) {
              return new ZodArray({
                ...this._def,
                maxLength: {
                  value: maxLength,
                  message: errorUtil.toString(message),
                },
              });
            }
            length(len, message) {
              return new ZodArray({
                ...this._def,
                exactLength: {
                  value: len,
                  message: errorUtil.toString(message),
                },
              });
            }
            nonempty(message) {
              return this.min(1, message);
            }
          }
          ZodArray.create = (schema, params) => {
            return new ZodArray({
              type: schema,
              minLength: null,
              maxLength: null,
              exactLength: null,
              typeName: ZodFirstPartyTypeKind.ZodArray,
              ...processCreateParams(params),
            });
          };
          function deepPartialify(schema) {
            if (schema instanceof ZodObject) {
              const newShape = {};
              for (const key in schema.shape) {
                const fieldSchema = schema.shape[key];
                newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
              }
              return new ZodObject({
                ...schema._def,
                shape: () => newShape,
              });
            } else if (schema instanceof ZodArray) {
              return new ZodArray({
                ...schema._def,
                type: deepPartialify(schema.element),
              });
            } else if (schema instanceof ZodOptional) {
              return ZodOptional.create(deepPartialify(schema.unwrap()));
            } else if (schema instanceof ZodNullable) {
              return ZodNullable.create(deepPartialify(schema.unwrap()));
            } else if (schema instanceof ZodTuple) {
              return ZodTuple.create(
                schema.items.map((item) => deepPartialify(item)),
              );
            } else {
              return schema;
            }
          }
          class ZodObject extends ZodType {
            constructor() {
              super(...arguments);
              this._cached = null;
              /**
               * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
               * If you want to pass through unknown properties, use `.passthrough()` instead.
               */
              this.nonstrict = this.passthrough;
              // extend<
              //   Augmentation extends ZodRawShape,
              //   NewOutput extends util.flatten<{
              //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
              //       ? Augmentation[k]["_output"]
              //       : k extends keyof Output
              //       ? Output[k]
              //       : never;
              //   }>,
              //   NewInput extends util.flatten<{
              //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
              //       ? Augmentation[k]["_input"]
              //       : k extends keyof Input
              //       ? Input[k]
              //       : never;
              //   }>
              // >(
              //   augmentation: Augmentation
              // ): ZodObject<
              //   extendShape<T, Augmentation>,
              //   UnknownKeys,
              //   Catchall,
              //   NewOutput,
              //   NewInput
              // > {
              //   return new ZodObject({
              //     ...this._def,
              //     shape: () => ({
              //       ...this._def.shape(),
              //       ...augmentation,
              //     }),
              //   }) as any;
              // }
              /**
               * @deprecated Use `.extend` instead
               *  */
              this.augment = this.extend;
            }
            _getCached() {
              if (this._cached !== null) return this._cached;
              const shape = this._def.shape();
              const keys = util.objectKeys(shape);
              return (this._cached = { shape, keys });
            }
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.object) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.object,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const { status, ctx } = this._processInputParams(input);
              const { shape, keys: shapeKeys } = this._getCached();
              const extraKeys = [];
              if (
                !(
                  this._def.catchall instanceof ZodNever &&
                  this._def.unknownKeys === "strip"
                )
              ) {
                for (const key in ctx.data) {
                  if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                  }
                }
              }
              const pairs = [];
              for (const key of shapeKeys) {
                const keyValidator = shape[key];
                const value = ctx.data[key];
                pairs.push({
                  key: { status: "valid", value: key },
                  value: keyValidator._parse(
                    new ParseInputLazyPath(ctx, value, ctx.path, key),
                  ),
                  alwaysSet: key in ctx.data,
                });
              }
              if (this._def.catchall instanceof ZodNever) {
                const unknownKeys = this._def.unknownKeys;
                if (unknownKeys === "passthrough") {
                  for (const key of extraKeys) {
                    pairs.push({
                      key: { status: "valid", value: key },
                      value: { status: "valid", value: ctx.data[key] },
                    });
                  }
                } else if (unknownKeys === "strict") {
                  if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                      code: ZodIssueCode.unrecognized_keys,
                      keys: extraKeys,
                    });
                    status.dirty();
                  }
                } else if (unknownKeys === "strip");
                else {
                  throw new Error(
                    `Internal ZodObject error: invalid unknownKeys value.`,
                  );
                }
              } else {
                // run catchall validation
                const catchall = this._def.catchall;
                for (const key of extraKeys) {
                  const value = ctx.data[key];
                  pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(
                      new ParseInputLazyPath(ctx, value, ctx.path, key), //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                  });
                }
              }
              if (ctx.common.async) {
                return Promise.resolve()
                  .then(async () => {
                    const syncPairs = [];
                    for (const pair of pairs) {
                      const key = await pair.key;
                      const value = await pair.value;
                      syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                      });
                    }
                    return syncPairs;
                  })
                  .then((syncPairs) => {
                    return ParseStatus.mergeObjectSync(status, syncPairs);
                  });
              } else {
                return ParseStatus.mergeObjectSync(status, pairs);
              }
            }
            get shape() {
              return this._def.shape();
            }
            strict(message) {
              errorUtil.errToObj;
              return new ZodObject({
                ...this._def,
                unknownKeys: "strict",
                ...(message !== undefined
                  ? {
                      errorMap: (issue, ctx) => {
                        var _a, _b, _c, _d;
                        const defaultError =
                          (_c =
                            (_b = (_a = this._def).errorMap) === null ||
                            _b === void 0
                              ? void 0
                              : _b.call(_a, issue, ctx).message) !== null &&
                          _c !== void 0
                            ? _c
                            : ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                          return {
                            message:
                              (_d = errorUtil.errToObj(message).message) !==
                                null && _d !== void 0
                                ? _d
                                : defaultError,
                          };
                        return {
                          message: defaultError,
                        };
                      },
                    }
                  : {}),
              });
            }
            strip() {
              return new ZodObject({
                ...this._def,
                unknownKeys: "strip",
              });
            }
            passthrough() {
              return new ZodObject({
                ...this._def,
                unknownKeys: "passthrough",
              });
            }
            // const AugmentFactory =
            //   <Def extends ZodObjectDef>(def: Def) =>
            //   <Augmentation extends ZodRawShape>(
            //     augmentation: Augmentation
            //   ): ZodObject<
            //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
            //     Def["unknownKeys"],
            //     Def["catchall"]
            //   > => {
            //     return new ZodObject({
            //       ...def,
            //       shape: () => ({
            //         ...def.shape(),
            //         ...augmentation,
            //       }),
            //     }) as any;
            //   };
            extend(augmentation) {
              return new ZodObject({
                ...this._def,
                shape: () => ({
                  ...this._def.shape(),
                  ...augmentation,
                }),
              });
            }
            /**
             * Prior to zod@1.0.12 there was a bug in the
             * inferred type of merged objects. Please
             * upgrade if you are experiencing issues.
             */
            merge(merging) {
              const merged = new ZodObject({
                unknownKeys: merging._def.unknownKeys,
                catchall: merging._def.catchall,
                shape: () => ({
                  ...this._def.shape(),
                  ...merging._def.shape(),
                }),
                typeName: ZodFirstPartyTypeKind.ZodObject,
              });
              return merged;
            }
            // merge<
            //   Incoming extends AnyZodObject,
            //   Augmentation extends Incoming["shape"],
            //   NewOutput extends {
            //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
            //       ? Augmentation[k]["_output"]
            //       : k extends keyof Output
            //       ? Output[k]
            //       : never;
            //   },
            //   NewInput extends {
            //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
            //       ? Augmentation[k]["_input"]
            //       : k extends keyof Input
            //       ? Input[k]
            //       : never;
            //   }
            // >(
            //   merging: Incoming
            // ): ZodObject<
            //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
            //   Incoming["_def"]["unknownKeys"],
            //   Incoming["_def"]["catchall"],
            //   NewOutput,
            //   NewInput
            // > {
            //   const merged: any = new ZodObject({
            //     unknownKeys: merging._def.unknownKeys,
            //     catchall: merging._def.catchall,
            //     shape: () =>
            //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
            //     typeName: ZodFirstPartyTypeKind.ZodObject,
            //   }) as any;
            //   return merged;
            // }
            setKey(key, schema) {
              return this.augment({ [key]: schema });
            }
            // merge<Incoming extends AnyZodObject>(
            //   merging: Incoming
            // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
            // ZodObject<
            //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
            //   Incoming["_def"]["unknownKeys"],
            //   Incoming["_def"]["catchall"]
            // > {
            //   // const mergedShape = objectUtil.mergeShapes(
            //   //   this._def.shape(),
            //   //   merging._def.shape()
            //   // );
            //   const merged: any = new ZodObject({
            //     unknownKeys: merging._def.unknownKeys,
            //     catchall: merging._def.catchall,
            //     shape: () =>
            //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
            //     typeName: ZodFirstPartyTypeKind.ZodObject,
            //   }) as any;
            //   return merged;
            // }
            catchall(index) {
              return new ZodObject({
                ...this._def,
                catchall: index,
              });
            }
            pick(mask) {
              const shape = {};
              util.objectKeys(mask).forEach((key) => {
                if (mask[key] && this.shape[key]) {
                  shape[key] = this.shape[key];
                }
              });
              return new ZodObject({
                ...this._def,
                shape: () => shape,
              });
            }
            omit(mask) {
              const shape = {};
              util.objectKeys(this.shape).forEach((key) => {
                if (!mask[key]) {
                  shape[key] = this.shape[key];
                }
              });
              return new ZodObject({
                ...this._def,
                shape: () => shape,
              });
            }
            /**
             * @deprecated
             */
            deepPartial() {
              return deepPartialify(this);
            }
            partial(mask) {
              const newShape = {};
              util.objectKeys(this.shape).forEach((key) => {
                const fieldSchema = this.shape[key];
                if (mask && !mask[key]) {
                  newShape[key] = fieldSchema;
                } else {
                  newShape[key] = fieldSchema.optional();
                }
              });
              return new ZodObject({
                ...this._def,
                shape: () => newShape,
              });
            }
            required(mask) {
              const newShape = {};
              util.objectKeys(this.shape).forEach((key) => {
                if (mask && !mask[key]) {
                  newShape[key] = this.shape[key];
                } else {
                  const fieldSchema = this.shape[key];
                  let newField = fieldSchema;
                  while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                  }
                  newShape[key] = newField;
                }
              });
              return new ZodObject({
                ...this._def,
                shape: () => newShape,
              });
            }
            keyof() {
              return createZodEnum(util.objectKeys(this.shape));
            }
          }
          ZodObject.create = (shape, params) => {
            return new ZodObject({
              shape: () => shape,
              unknownKeys: "strip",
              catchall: ZodNever.create(),
              typeName: ZodFirstPartyTypeKind.ZodObject,
              ...processCreateParams(params),
            });
          };
          ZodObject.strictCreate = (shape, params) => {
            return new ZodObject({
              shape: () => shape,
              unknownKeys: "strict",
              catchall: ZodNever.create(),
              typeName: ZodFirstPartyTypeKind.ZodObject,
              ...processCreateParams(params),
            });
          };
          ZodObject.lazycreate = (shape, params) => {
            return new ZodObject({
              shape,
              unknownKeys: "strip",
              catchall: ZodNever.create(),
              typeName: ZodFirstPartyTypeKind.ZodObject,
              ...processCreateParams(params),
            });
          };
          class ZodUnion extends ZodType {
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              const options = this._def.options;
              function handleResults(results) {
                // return first issue-free validation if it exists
                for (const result of results) {
                  if (result.result.status === "valid") {
                    return result.result;
                  }
                }
                for (const result of results) {
                  if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                  }
                }
                // return invalid
                const unionErrors = results.map(
                  (result) => new ZodError(result.ctx.common.issues),
                );
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_union,
                  unionErrors,
                });
                return INVALID;
              }
              if (ctx.common.async) {
                return Promise.all(
                  options.map(async (option) => {
                    const childCtx = {
                      ...ctx,
                      common: {
                        ...ctx.common,
                        issues: [],
                      },
                      parent: null,
                    };
                    return {
                      result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                      }),
                      ctx: childCtx,
                    };
                  }),
                ).then(handleResults);
              } else {
                let dirty = undefined;
                const issues = [];
                for (const option of options) {
                  const childCtx = {
                    ...ctx,
                    common: {
                      ...ctx.common,
                      issues: [],
                    },
                    parent: null,
                  };
                  const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                  });
                  if (result.status === "valid") {
                    return result;
                  } else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                  }
                  if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                  }
                }
                if (dirty) {
                  ctx.common.issues.push(...dirty.ctx.common.issues);
                  return dirty.result;
                }
                const unionErrors = issues.map(
                  (issues) => new ZodError(issues),
                );
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_union,
                  unionErrors,
                });
                return INVALID;
              }
            }
            get options() {
              return this._def.options;
            }
          }
          ZodUnion.create = (types, params) => {
            return new ZodUnion({
              options: types,
              typeName: ZodFirstPartyTypeKind.ZodUnion,
              ...processCreateParams(params),
            });
          };
          /////////////////////////////////////////////////////
          /////////////////////////////////////////////////////
          //////////                                 //////////
          //////////      ZodDiscriminatedUnion      //////////
          //////////                                 //////////
          /////////////////////////////////////////////////////
          /////////////////////////////////////////////////////
          const getDiscriminator = (type) => {
            if (type instanceof ZodLazy) {
              return getDiscriminator(type.schema);
            } else if (type instanceof ZodEffects) {
              return getDiscriminator(type.innerType());
            } else if (type instanceof ZodLiteral) {
              return [type.value];
            } else if (type instanceof ZodEnum) {
              return type.options;
            } else if (type instanceof ZodNativeEnum) {
              // eslint-disable-next-line ban/ban
              return util.objectValues(type.enum);
            } else if (type instanceof ZodDefault) {
              return getDiscriminator(type._def.innerType);
            } else if (type instanceof ZodUndefined) {
              return [undefined];
            } else if (type instanceof ZodNull) {
              return [null];
            } else if (type instanceof ZodOptional) {
              return [undefined, ...getDiscriminator(type.unwrap())];
            } else if (type instanceof ZodNullable) {
              return [null, ...getDiscriminator(type.unwrap())];
            } else if (type instanceof ZodBranded) {
              return getDiscriminator(type.unwrap());
            } else if (type instanceof ZodReadonly) {
              return getDiscriminator(type.unwrap());
            } else if (type instanceof ZodCatch) {
              return getDiscriminator(type._def.innerType);
            } else {
              return [];
            }
          };
          class ZodDiscriminatedUnion extends ZodType {
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.object) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.object,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const discriminator = this.discriminator;
              const discriminatorValue = ctx.data[discriminator];
              const option = this.optionsMap.get(discriminatorValue);
              if (!option) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_union_discriminator,
                  options: Array.from(this.optionsMap.keys()),
                  path: [discriminator],
                });
                return INVALID;
              }
              if (ctx.common.async) {
                return option._parseAsync({
                  data: ctx.data,
                  path: ctx.path,
                  parent: ctx,
                });
              } else {
                return option._parseSync({
                  data: ctx.data,
                  path: ctx.path,
                  parent: ctx,
                });
              }
            }
            get discriminator() {
              return this._def.discriminator;
            }
            get options() {
              return this._def.options;
            }
            get optionsMap() {
              return this._def.optionsMap;
            }
            /**
             * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
             * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
             * have a different value for each object in the union.
             * @param discriminator the name of the discriminator property
             * @param types an array of object schemas
             * @param params
             */
            static create(discriminator, options, params) {
              // Get all the valid discriminator values
              const optionsMap = new Map();
              // try {
              for (const type of options) {
                const discriminatorValues = getDiscriminator(
                  type.shape[discriminator],
                );
                if (!discriminatorValues.length) {
                  throw new Error(
                    `A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`,
                  );
                }
                for (const value of discriminatorValues) {
                  if (optionsMap.has(value)) {
                    throw new Error(
                      `Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`,
                    );
                  }
                  optionsMap.set(value, type);
                }
              }
              return new ZodDiscriminatedUnion({
                typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
                discriminator,
                options,
                optionsMap,
                ...processCreateParams(params),
              });
            }
          }
          function mergeValues(a, b) {
            const aType = getParsedType(a);
            const bType = getParsedType(b);
            if (a === b) {
              return { valid: true, data: a };
            } else if (
              aType === ZodParsedType.object &&
              bType === ZodParsedType.object
            ) {
              const bKeys = util.objectKeys(b);
              const sharedKeys = util
                .objectKeys(a)
                .filter((key) => bKeys.indexOf(key) !== -1);
              const newObj = { ...a, ...b };
              for (const key of sharedKeys) {
                const sharedValue = mergeValues(a[key], b[key]);
                if (!sharedValue.valid) {
                  return { valid: false };
                }
                newObj[key] = sharedValue.data;
              }
              return { valid: true, data: newObj };
            } else if (
              aType === ZodParsedType.array &&
              bType === ZodParsedType.array
            ) {
              if (a.length !== b.length) {
                return { valid: false };
              }
              const newArray = [];
              for (let index = 0; index < a.length; index++) {
                const itemA = a[index];
                const itemB = b[index];
                const sharedValue = mergeValues(itemA, itemB);
                if (!sharedValue.valid) {
                  return { valid: false };
                }
                newArray.push(sharedValue.data);
              }
              return { valid: true, data: newArray };
            } else if (
              aType === ZodParsedType.date &&
              bType === ZodParsedType.date &&
              +a === +b
            ) {
              return { valid: true, data: a };
            } else {
              return { valid: false };
            }
          }
          class ZodIntersection extends ZodType {
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              const handleParsed = (parsedLeft, parsedRight) => {
                if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                  return INVALID;
                }
                const merged = mergeValues(parsedLeft.value, parsedRight.value);
                if (!merged.valid) {
                  addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                  });
                  return INVALID;
                }
                if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                  status.dirty();
                }
                return { status: status.value, value: merged.data };
              };
              if (ctx.common.async) {
                return Promise.all([
                  this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  }),
                  this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  }),
                ]).then(([left, right]) => handleParsed(left, right));
              } else {
                return handleParsed(
                  this._def.left._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  }),
                  this._def.right._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  }),
                );
              }
            }
          }
          ZodIntersection.create = (left, right, params) => {
            return new ZodIntersection({
              left: left,
              right: right,
              typeName: ZodFirstPartyTypeKind.ZodIntersection,
              ...processCreateParams(params),
            });
          };
          class ZodTuple extends ZodType {
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.array) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.array,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              if (ctx.data.length < this._def.items.length) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: this._def.items.length,
                  inclusive: true,
                  exact: false,
                  type: "array",
                });
                return INVALID;
              }
              const rest = this._def.rest;
              if (!rest && ctx.data.length > this._def.items.length) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: this._def.items.length,
                  inclusive: true,
                  exact: false,
                  type: "array",
                });
                status.dirty();
              }
              const items = [...ctx.data]
                .map((item, itemIndex) => {
                  const schema = this._def.items[itemIndex] || this._def.rest;
                  if (!schema) return null;
                  return schema._parse(
                    new ParseInputLazyPath(ctx, item, ctx.path, itemIndex),
                  );
                })
                .filter((x) => !!x); // filter nulls
              if (ctx.common.async) {
                return Promise.all(items).then((results) => {
                  return ParseStatus.mergeArray(status, results);
                });
              } else {
                return ParseStatus.mergeArray(status, items);
              }
            }
            get items() {
              return this._def.items;
            }
            rest(rest) {
              return new ZodTuple({
                ...this._def,
                rest,
              });
            }
          }
          ZodTuple.create = (schemas, params) => {
            if (!Array.isArray(schemas)) {
              throw new Error(
                "You must pass an array of schemas to z.tuple([ ... ])",
              );
            }
            return new ZodTuple({
              items: schemas,
              typeName: ZodFirstPartyTypeKind.ZodTuple,
              rest: null,
              ...processCreateParams(params),
            });
          };
          class ZodRecord extends ZodType {
            get keySchema() {
              return this._def.keyType;
            }
            get valueSchema() {
              return this._def.valueType;
            }
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.object) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.object,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const pairs = [];
              const keyType = this._def.keyType;
              const valueType = this._def.valueType;
              for (const key in ctx.data) {
                pairs.push({
                  key: keyType._parse(
                    new ParseInputLazyPath(ctx, key, ctx.path, key),
                  ),
                  value: valueType._parse(
                    new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key),
                  ),
                  alwaysSet: key in ctx.data,
                });
              }
              if (ctx.common.async) {
                return ParseStatus.mergeObjectAsync(status, pairs);
              } else {
                return ParseStatus.mergeObjectSync(status, pairs);
              }
            }
            get element() {
              return this._def.valueType;
            }
            static create(first, second, third) {
              if (second instanceof ZodType) {
                return new ZodRecord({
                  keyType: first,
                  valueType: second,
                  typeName: ZodFirstPartyTypeKind.ZodRecord,
                  ...processCreateParams(third),
                });
              }
              return new ZodRecord({
                keyType: ZodString.create(),
                valueType: first,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(second),
              });
            }
          }
          class ZodMap extends ZodType {
            get keySchema() {
              return this._def.keyType;
            }
            get valueSchema() {
              return this._def.valueType;
            }
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.map) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.map,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const keyType = this._def.keyType;
              const valueType = this._def.valueType;
              const pairs = [...ctx.data.entries()].map(
                ([key, value], index) => {
                  return {
                    key: keyType._parse(
                      new ParseInputLazyPath(ctx, key, ctx.path, [
                        index,
                        "key",
                      ]),
                    ),
                    value: valueType._parse(
                      new ParseInputLazyPath(ctx, value, ctx.path, [
                        index,
                        "value",
                      ]),
                    ),
                  };
                },
              );
              if (ctx.common.async) {
                const finalMap = new Map();
                return Promise.resolve().then(async () => {
                  for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (
                      key.status === "aborted" ||
                      value.status === "aborted"
                    ) {
                      return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                      status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                  }
                  return { status: status.value, value: finalMap };
                });
              } else {
                const finalMap = new Map();
                for (const pair of pairs) {
                  const key = pair.key;
                  const value = pair.value;
                  if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                  }
                  if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                  }
                  finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
              }
            }
          }
          ZodMap.create = (keyType, valueType, params) => {
            return new ZodMap({
              valueType,
              keyType,
              typeName: ZodFirstPartyTypeKind.ZodMap,
              ...processCreateParams(params),
            });
          };
          class ZodSet extends ZodType {
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.set) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.set,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const def = this._def;
              if (def.minSize !== null) {
                if (ctx.data.size < def.minSize.value) {
                  addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                  });
                  status.dirty();
                }
              }
              if (def.maxSize !== null) {
                if (ctx.data.size > def.maxSize.value) {
                  addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                  });
                  status.dirty();
                }
              }
              const valueType = this._def.valueType;
              function finalizeSet(elements) {
                const parsedSet = new Set();
                for (const element of elements) {
                  if (element.status === "aborted") return INVALID;
                  if (element.status === "dirty") status.dirty();
                  parsedSet.add(element.value);
                }
                return { status: status.value, value: parsedSet };
              }
              const elements = [...ctx.data.values()].map((item, i) =>
                valueType._parse(
                  new ParseInputLazyPath(ctx, item, ctx.path, i),
                ),
              );
              if (ctx.common.async) {
                return Promise.all(elements).then((elements) =>
                  finalizeSet(elements),
                );
              } else {
                return finalizeSet(elements);
              }
            }
            min(minSize, message) {
              return new ZodSet({
                ...this._def,
                minSize: {
                  value: minSize,
                  message: errorUtil.toString(message),
                },
              });
            }
            max(maxSize, message) {
              return new ZodSet({
                ...this._def,
                maxSize: {
                  value: maxSize,
                  message: errorUtil.toString(message),
                },
              });
            }
            size(size, message) {
              return this.min(size, message).max(size, message);
            }
            nonempty(message) {
              return this.min(1, message);
            }
          }
          ZodSet.create = (valueType, params) => {
            return new ZodSet({
              valueType,
              minSize: null,
              maxSize: null,
              typeName: ZodFirstPartyTypeKind.ZodSet,
              ...processCreateParams(params),
            });
          };
          class ZodFunction extends ZodType {
            constructor() {
              super(...arguments);
              this.validate = this.implement;
            }
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              if (ctx.parsedType !== ZodParsedType.function) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.function,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              function makeArgsIssue(args, error) {
                return makeIssue({
                  data: args,
                  path: ctx.path,
                  errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                  ].filter((x) => !!x),
                  issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                  },
                });
              }
              function makeReturnsIssue(returns, error) {
                return makeIssue({
                  data: returns,
                  path: ctx.path,
                  errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                  ].filter((x) => !!x),
                  issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                  },
                });
              }
              const params = { errorMap: ctx.common.contextualErrorMap };
              const fn = ctx.data;
              if (this._def.returns instanceof ZodPromise) {
                // Would love a way to avoid disabling this rule, but we need
                // an alias (using an arrow function was what caused 2651).
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const me = this;
                return OK(async function (...args) {
                  const error = new ZodError([]);
                  const parsedArgs = await me._def.args
                    .parseAsync(args, params)
                    .catch((e) => {
                      error.addIssue(makeArgsIssue(args, e));
                      throw error;
                    });
                  const result = await Reflect.apply(fn, this, parsedArgs);
                  const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                      error.addIssue(makeReturnsIssue(result, e));
                      throw error;
                    });
                  return parsedReturns;
                });
              } else {
                // Would love a way to avoid disabling this rule, but we need
                // an alias (using an arrow function was what caused 2651).
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const me = this;
                return OK(function (...args) {
                  const parsedArgs = me._def.args.safeParse(args, params);
                  if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                  }
                  const result = Reflect.apply(fn, this, parsedArgs.data);
                  const parsedReturns = me._def.returns.safeParse(
                    result,
                    params,
                  );
                  if (!parsedReturns.success) {
                    throw new ZodError([
                      makeReturnsIssue(result, parsedReturns.error),
                    ]);
                  }
                  return parsedReturns.data;
                });
              }
            }
            parameters() {
              return this._def.args;
            }
            returnType() {
              return this._def.returns;
            }
            args(...items) {
              return new ZodFunction({
                ...this._def,
                args: ZodTuple.create(items).rest(ZodUnknown.create()),
              });
            }
            returns(returnType) {
              return new ZodFunction({
                ...this._def,
                returns: returnType,
              });
            }
            implement(func) {
              const validatedFunc = this.parse(func);
              return validatedFunc;
            }
            strictImplement(func) {
              const validatedFunc = this.parse(func);
              return validatedFunc;
            }
            static create(args, returns, params) {
              return new ZodFunction({
                args: args
                  ? args
                  : ZodTuple.create([]).rest(ZodUnknown.create()),
                returns: returns || ZodUnknown.create(),
                typeName: ZodFirstPartyTypeKind.ZodFunction,
                ...processCreateParams(params),
              });
            }
          }
          class ZodLazy extends ZodType {
            get schema() {
              return this._def.getter();
            }
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              const lazySchema = this._def.getter();
              return lazySchema._parse({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
              });
            }
          }
          ZodLazy.create = (getter, params) => {
            return new ZodLazy({
              getter: getter,
              typeName: ZodFirstPartyTypeKind.ZodLazy,
              ...processCreateParams(params),
            });
          };
          class ZodLiteral extends ZodType {
            _parse(input) {
              if (input.data !== this._def.value) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  received: ctx.data,
                  code: ZodIssueCode.invalid_literal,
                  expected: this._def.value,
                });
                return INVALID;
              }
              return { status: "valid", value: input.data };
            }
            get value() {
              return this._def.value;
            }
          }
          ZodLiteral.create = (value, params) => {
            return new ZodLiteral({
              value: value,
              typeName: ZodFirstPartyTypeKind.ZodLiteral,
              ...processCreateParams(params),
            });
          };
          function createZodEnum(values, params) {
            return new ZodEnum({
              values,
              typeName: ZodFirstPartyTypeKind.ZodEnum,
              ...processCreateParams(params),
            });
          }
          class ZodEnum extends ZodType {
            constructor() {
              super(...arguments);
              _ZodEnum_cache.set(this, void 0);
            }
            _parse(input) {
              if (typeof input.data !== "string") {
                const ctx = this._getOrReturnCtx(input);
                const expectedValues = this._def.values;
                addIssueToContext(ctx, {
                  expected: util.joinValues(expectedValues),
                  received: ctx.parsedType,
                  code: ZodIssueCode.invalid_type,
                });
                return INVALID;
              }
              if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
                __classPrivateFieldSet(
                  this,
                  _ZodEnum_cache,
                  new Set(this._def.values),
                  "f",
                );
              }
              if (
                !__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(
                  input.data,
                )
              ) {
                const ctx = this._getOrReturnCtx(input);
                const expectedValues = this._def.values;
                addIssueToContext(ctx, {
                  received: ctx.data,
                  code: ZodIssueCode.invalid_enum_value,
                  options: expectedValues,
                });
                return INVALID;
              }
              return OK(input.data);
            }
            get options() {
              return this._def.values;
            }
            get enum() {
              const enumValues = {};
              for (const val of this._def.values) {
                enumValues[val] = val;
              }
              return enumValues;
            }
            get Values() {
              const enumValues = {};
              for (const val of this._def.values) {
                enumValues[val] = val;
              }
              return enumValues;
            }
            get Enum() {
              const enumValues = {};
              for (const val of this._def.values) {
                enumValues[val] = val;
              }
              return enumValues;
            }
            extract(values, newDef = this._def) {
              return ZodEnum.create(values, {
                ...this._def,
                ...newDef,
              });
            }
            exclude(values, newDef = this._def) {
              return ZodEnum.create(
                this.options.filter((opt) => !values.includes(opt)),
                {
                  ...this._def,
                  ...newDef,
                },
              );
            }
          }
          _ZodEnum_cache = new WeakMap();
          ZodEnum.create = createZodEnum;
          class ZodNativeEnum extends ZodType {
            constructor() {
              super(...arguments);
              _ZodNativeEnum_cache.set(this, void 0);
            }
            _parse(input) {
              const nativeEnumValues = util.getValidEnumValues(
                this._def.values,
              );
              const ctx = this._getOrReturnCtx(input);
              if (
                ctx.parsedType !== ZodParsedType.string &&
                ctx.parsedType !== ZodParsedType.number
              ) {
                const expectedValues = util.objectValues(nativeEnumValues);
                addIssueToContext(ctx, {
                  expected: util.joinValues(expectedValues),
                  received: ctx.parsedType,
                  code: ZodIssueCode.invalid_type,
                });
                return INVALID;
              }
              if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
                __classPrivateFieldSet(
                  this,
                  _ZodNativeEnum_cache,
                  new Set(util.getValidEnumValues(this._def.values)),
                  "f",
                );
              }
              if (
                !__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(
                  input.data,
                )
              ) {
                const expectedValues = util.objectValues(nativeEnumValues);
                addIssueToContext(ctx, {
                  received: ctx.data,
                  code: ZodIssueCode.invalid_enum_value,
                  options: expectedValues,
                });
                return INVALID;
              }
              return OK(input.data);
            }
            get enum() {
              return this._def.values;
            }
          }
          _ZodNativeEnum_cache = new WeakMap();
          ZodNativeEnum.create = (values, params) => {
            return new ZodNativeEnum({
              values: values,
              typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
              ...processCreateParams(params),
            });
          };
          class ZodPromise extends ZodType {
            unwrap() {
              return this._def.type;
            }
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              if (
                ctx.parsedType !== ZodParsedType.promise &&
                ctx.common.async === false
              ) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.promise,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              const promisified =
                ctx.parsedType === ZodParsedType.promise
                  ? ctx.data
                  : Promise.resolve(ctx.data);
              return OK(
                promisified.then((data) => {
                  return this._def.type.parseAsync(data, {
                    path: ctx.path,
                    errorMap: ctx.common.contextualErrorMap,
                  });
                }),
              );
            }
          }
          ZodPromise.create = (schema, params) => {
            return new ZodPromise({
              type: schema,
              typeName: ZodFirstPartyTypeKind.ZodPromise,
              ...processCreateParams(params),
            });
          };
          class ZodEffects extends ZodType {
            innerType() {
              return this._def.schema;
            }
            sourceType() {
              return this._def.schema._def.typeName ===
                ZodFirstPartyTypeKind.ZodEffects
                ? this._def.schema.sourceType()
                : this._def.schema;
            }
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              const effect = this._def.effect || null;
              const checkCtx = {
                addIssue: (arg) => {
                  addIssueToContext(ctx, arg);
                  if (arg.fatal) {
                    status.abort();
                  } else {
                    status.dirty();
                  }
                },
                get path() {
                  return ctx.path;
                },
              };
              checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
              if (effect.type === "preprocess") {
                const processed = effect.transform(ctx.data, checkCtx);
                if (ctx.common.async) {
                  return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted") return INVALID;
                    const result = await this._def.schema._parseAsync({
                      data: processed,
                      path: ctx.path,
                      parent: ctx,
                    });
                    if (result.status === "aborted") return INVALID;
                    if (result.status === "dirty") return DIRTY(result.value);
                    if (status.value === "dirty") return DIRTY(result.value);
                    return result;
                  });
                } else {
                  if (status.value === "aborted") return INVALID;
                  const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                  });
                  if (result.status === "aborted") return INVALID;
                  if (result.status === "dirty") return DIRTY(result.value);
                  if (status.value === "dirty") return DIRTY(result.value);
                  return result;
                }
              }
              if (effect.type === "refinement") {
                const executeRefinement = (acc) => {
                  const result = effect.refinement(acc, checkCtx);
                  if (ctx.common.async) {
                    return Promise.resolve(result);
                  }
                  if (result instanceof Promise) {
                    throw new Error(
                      "Async refinement encountered during synchronous parse operation. Use .parseAsync instead.",
                    );
                  }
                  return acc;
                };
                if (ctx.common.async === false) {
                  const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  });
                  if (inner.status === "aborted") return INVALID;
                  if (inner.status === "dirty") status.dirty();
                  // return value is ignored
                  executeRefinement(inner.value);
                  return { status: status.value, value: inner.value };
                } else {
                  return this._def.schema
                    ._parseAsync({
                      data: ctx.data,
                      path: ctx.path,
                      parent: ctx,
                    })
                    .then((inner) => {
                      if (inner.status === "aborted") return INVALID;
                      if (inner.status === "dirty") status.dirty();
                      return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                      });
                    });
                }
              }
              if (effect.type === "transform") {
                if (ctx.common.async === false) {
                  const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  });
                  if (!isValid(base)) return base;
                  const result = effect.transform(base.value, checkCtx);
                  if (result instanceof Promise) {
                    throw new Error(
                      `Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`,
                    );
                  }
                  return { status: status.value, value: result };
                } else {
                  return this._def.schema
                    ._parseAsync({
                      data: ctx.data,
                      path: ctx.path,
                      parent: ctx,
                    })
                    .then((base) => {
                      if (!isValid(base)) return base;
                      return Promise.resolve(
                        effect.transform(base.value, checkCtx),
                      ).then((result) => ({
                        status: status.value,
                        value: result,
                      }));
                    });
                }
              }
              util.assertNever(effect);
            }
          }
          ZodEffects.create = (schema, effect, params) => {
            return new ZodEffects({
              schema,
              typeName: ZodFirstPartyTypeKind.ZodEffects,
              effect,
              ...processCreateParams(params),
            });
          };
          ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
            return new ZodEffects({
              schema,
              effect: { type: "preprocess", transform: preprocess },
              typeName: ZodFirstPartyTypeKind.ZodEffects,
              ...processCreateParams(params),
            });
          };
          class ZodOptional extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType === ZodParsedType.undefined) {
                return OK(undefined);
              }
              return this._def.innerType._parse(input);
            }
            unwrap() {
              return this._def.innerType;
            }
          }
          ZodOptional.create = (type, params) => {
            return new ZodOptional({
              innerType: type,
              typeName: ZodFirstPartyTypeKind.ZodOptional,
              ...processCreateParams(params),
            });
          };
          class ZodNullable extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType === ZodParsedType.null) {
                return OK(null);
              }
              return this._def.innerType._parse(input);
            }
            unwrap() {
              return this._def.innerType;
            }
          }
          ZodNullable.create = (type, params) => {
            return new ZodNullable({
              innerType: type,
              typeName: ZodFirstPartyTypeKind.ZodNullable,
              ...processCreateParams(params),
            });
          };
          class ZodDefault extends ZodType {
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              let data = ctx.data;
              if (ctx.parsedType === ZodParsedType.undefined) {
                data = this._def.defaultValue();
              }
              return this._def.innerType._parse({
                data,
                path: ctx.path,
                parent: ctx,
              });
            }
            removeDefault() {
              return this._def.innerType;
            }
          }
          ZodDefault.create = (type, params) => {
            return new ZodDefault({
              innerType: type,
              typeName: ZodFirstPartyTypeKind.ZodDefault,
              defaultValue:
                typeof params.default === "function"
                  ? params.default
                  : () => params.default,
              ...processCreateParams(params),
            });
          };
          class ZodCatch extends ZodType {
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              // newCtx is used to not collect issues from inner types in ctx
              const newCtx = {
                ...ctx,
                common: {
                  ...ctx.common,
                  issues: [],
                },
              };
              const result = this._def.innerType._parse({
                data: newCtx.data,
                path: newCtx.path,
                parent: {
                  ...newCtx,
                },
              });
              if (isAsync(result)) {
                return result.then((result) => {
                  return {
                    status: "valid",
                    value:
                      result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                              return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                          }),
                  };
                });
              } else {
                return {
                  status: "valid",
                  value:
                    result.status === "valid"
                      ? result.value
                      : this._def.catchValue({
                          get error() {
                            return new ZodError(newCtx.common.issues);
                          },
                          input: newCtx.data,
                        }),
                };
              }
            }
            removeCatch() {
              return this._def.innerType;
            }
          }
          ZodCatch.create = (type, params) => {
            return new ZodCatch({
              innerType: type,
              typeName: ZodFirstPartyTypeKind.ZodCatch,
              catchValue:
                typeof params.catch === "function"
                  ? params.catch
                  : () => params.catch,
              ...processCreateParams(params),
            });
          };
          class ZodNaN extends ZodType {
            _parse(input) {
              const parsedType = this._getType(input);
              if (parsedType !== ZodParsedType.nan) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: ZodParsedType.nan,
                  received: ctx.parsedType,
                });
                return INVALID;
              }
              return { status: "valid", value: input.data };
            }
          }
          ZodNaN.create = (params) => {
            return new ZodNaN({
              typeName: ZodFirstPartyTypeKind.ZodNaN,
              ...processCreateParams(params),
            });
          };
          const BRAND = Symbol("zod_brand");
          class ZodBranded extends ZodType {
            _parse(input) {
              const { ctx } = this._processInputParams(input);
              const data = ctx.data;
              return this._def.type._parse({
                data,
                path: ctx.path,
                parent: ctx,
              });
            }
            unwrap() {
              return this._def.type;
            }
          }
          class ZodPipeline extends ZodType {
            _parse(input) {
              const { status, ctx } = this._processInputParams(input);
              if (ctx.common.async) {
                const handleAsync = async () => {
                  const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                  });
                  if (inResult.status === "aborted") return INVALID;
                  if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                  } else {
                    return this._def.out._parseAsync({
                      data: inResult.value,
                      path: ctx.path,
                      parent: ctx,
                    });
                  }
                };
                return handleAsync();
              } else {
                const inResult = this._def.in._parseSync({
                  data: ctx.data,
                  path: ctx.path,
                  parent: ctx,
                });
                if (inResult.status === "aborted") return INVALID;
                if (inResult.status === "dirty") {
                  status.dirty();
                  return {
                    status: "dirty",
                    value: inResult.value,
                  };
                } else {
                  return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                  });
                }
              }
            }
            static create(a, b) {
              return new ZodPipeline({
                in: a,
                out: b,
                typeName: ZodFirstPartyTypeKind.ZodPipeline,
              });
            }
          }
          class ZodReadonly extends ZodType {
            _parse(input) {
              const result = this._def.innerType._parse(input);
              const freeze = (data) => {
                if (isValid(data)) {
                  data.value = Object.freeze(data.value);
                }
                return data;
              };
              return isAsync(result)
                ? result.then((data) => freeze(data))
                : freeze(result);
            }
            unwrap() {
              return this._def.innerType;
            }
          }
          ZodReadonly.create = (type, params) => {
            return new ZodReadonly({
              innerType: type,
              typeName: ZodFirstPartyTypeKind.ZodReadonly,
              ...processCreateParams(params),
            });
          };
          function custom(
            check,
            params = {},
            /**
             * @deprecated
             *
             * Pass `fatal` into the params object instead:
             *
             * ```ts
             * z.string().custom((val) => val.length > 5, { fatal: false })
             * ```
             *
             */
            fatal,
          ) {
            if (check)
              return ZodAny.create().superRefine((data, ctx) => {
                var _a, _b;
                if (!check(data)) {
                  const p =
                    typeof params === "function"
                      ? params(data)
                      : typeof params === "string"
                        ? { message: params }
                        : params;
                  const _fatal =
                    (_b =
                      (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !==
                      null && _b !== void 0
                      ? _b
                      : true;
                  const p2 = typeof p === "string" ? { message: p } : p;
                  ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
                }
              });
            return ZodAny.create();
          }
          const late = {
            object: ZodObject.lazycreate,
          };
          var ZodFirstPartyTypeKind;
          (function (ZodFirstPartyTypeKind) {
            ZodFirstPartyTypeKind["ZodString"] = "ZodString";
            ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
            ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
            ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
            ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
            ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
            ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
            ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
            ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
            ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
            ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
            ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
            ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
            ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
            ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
            ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
            ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] =
              "ZodDiscriminatedUnion";
            ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
            ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
            ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
            ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
            ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
            ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
            ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
            ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
            ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
            ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
            ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
            ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
            ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
            ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
            ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
            ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
            ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
            ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
            ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
          })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
          const instanceOfType = (
            // const instanceOfType = <T extends new (...args: any[]) => any>(
            cls,
            params = {
              message: `Input not instance of ${cls.name}`,
            },
          ) => custom((data) => data instanceof cls, params);
          const stringType = ZodString.create;
          const numberType = ZodNumber.create;
          const nanType = ZodNaN.create;
          const bigIntType = ZodBigInt.create;
          const booleanType = ZodBoolean.create;
          const dateType = ZodDate.create;
          const symbolType = ZodSymbol.create;
          const undefinedType = ZodUndefined.create;
          const nullType = ZodNull.create;
          const anyType = ZodAny.create;
          const unknownType = ZodUnknown.create;
          const neverType = ZodNever.create;
          const voidType = ZodVoid.create;
          const arrayType = ZodArray.create;
          const objectType = ZodObject.create;
          const strictObjectType = ZodObject.strictCreate;
          const unionType = ZodUnion.create;
          const discriminatedUnionType = ZodDiscriminatedUnion.create;
          const intersectionType = ZodIntersection.create;
          const tupleType = ZodTuple.create;
          const recordType = ZodRecord.create;
          const mapType = ZodMap.create;
          const setType = ZodSet.create;
          const functionType = ZodFunction.create;
          const lazyType = ZodLazy.create;
          const literalType = ZodLiteral.create;
          const enumType = ZodEnum.create;
          const nativeEnumType = ZodNativeEnum.create;
          const promiseType = ZodPromise.create;
          const effectsType = ZodEffects.create;
          const optionalType = ZodOptional.create;
          const nullableType = ZodNullable.create;
          const preprocessType = ZodEffects.createWithPreprocess;
          const pipelineType = ZodPipeline.create;
          const ostring = () => stringType().optional();
          const onumber = () => numberType().optional();
          const oboolean = () => booleanType().optional();
          const coerce = {
            string: (arg) => ZodString.create({ ...arg, coerce: true }),
            number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
            boolean: (arg) =>
              ZodBoolean.create({
                ...arg,
                coerce: true,
              }),
            bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
            date: (arg) => ZodDate.create({ ...arg, coerce: true }),
          };
          const NEVER = INVALID;

          var z = /*#__PURE__*/ Object.freeze({
            __proto__: null,
            defaultErrorMap: errorMap,
            setErrorMap: setErrorMap,
            getErrorMap: getErrorMap,
            makeIssue: makeIssue,
            EMPTY_PATH: EMPTY_PATH,
            addIssueToContext: addIssueToContext,
            ParseStatus: ParseStatus,
            INVALID: INVALID,
            DIRTY: DIRTY,
            OK: OK,
            isAborted: isAborted,
            isDirty: isDirty,
            isValid: isValid,
            isAsync: isAsync,
            get util() {
              return util;
            },
            get objectUtil() {
              return objectUtil;
            },
            ZodParsedType: ZodParsedType,
            getParsedType: getParsedType,
            ZodType: ZodType,
            datetimeRegex: datetimeRegex,
            ZodString: ZodString,
            ZodNumber: ZodNumber,
            ZodBigInt: ZodBigInt,
            ZodBoolean: ZodBoolean,
            ZodDate: ZodDate,
            ZodSymbol: ZodSymbol,
            ZodUndefined: ZodUndefined,
            ZodNull: ZodNull,
            ZodAny: ZodAny,
            ZodUnknown: ZodUnknown,
            ZodNever: ZodNever,
            ZodVoid: ZodVoid,
            ZodArray: ZodArray,
            ZodObject: ZodObject,
            ZodUnion: ZodUnion,
            ZodDiscriminatedUnion: ZodDiscriminatedUnion,
            ZodIntersection: ZodIntersection,
            ZodTuple: ZodTuple,
            ZodRecord: ZodRecord,
            ZodMap: ZodMap,
            ZodSet: ZodSet,
            ZodFunction: ZodFunction,
            ZodLazy: ZodLazy,
            ZodLiteral: ZodLiteral,
            ZodEnum: ZodEnum,
            ZodNativeEnum: ZodNativeEnum,
            ZodPromise: ZodPromise,
            ZodEffects: ZodEffects,
            ZodTransformer: ZodEffects,
            ZodOptional: ZodOptional,
            ZodNullable: ZodNullable,
            ZodDefault: ZodDefault,
            ZodCatch: ZodCatch,
            ZodNaN: ZodNaN,
            BRAND: BRAND,
            ZodBranded: ZodBranded,
            ZodPipeline: ZodPipeline,
            ZodReadonly: ZodReadonly,
            custom: custom,
            Schema: ZodType,
            ZodSchema: ZodType,
            late: late,
            get ZodFirstPartyTypeKind() {
              return ZodFirstPartyTypeKind;
            },
            coerce: coerce,
            any: anyType,
            array: arrayType,
            bigint: bigIntType,
            boolean: booleanType,
            date: dateType,
            discriminatedUnion: discriminatedUnionType,
            effect: effectsType,
            enum: enumType,
            function: functionType,
            instanceof: instanceOfType,
            intersection: intersectionType,
            lazy: lazyType,
            literal: literalType,
            map: mapType,
            nan: nanType,
            nativeEnum: nativeEnumType,
            never: neverType,
            null: nullType,
            nullable: nullableType,
            number: numberType,
            object: objectType,
            oboolean: oboolean,
            onumber: onumber,
            optional: optionalType,
            ostring: ostring,
            pipeline: pipelineType,
            preprocess: preprocessType,
            promise: promiseType,
            record: recordType,
            set: setType,
            strictObject: strictObjectType,
            string: stringType,
            symbol: symbolType,
            transformer: effectsType,
            tuple: tupleType,
            undefined: undefinedType,
            union: unionType,
            unknown: unknownType,
            void: voidType,
            NEVER: NEVER,
            ZodIssueCode: ZodIssueCode,
            quotelessJson: quotelessJson,
            ZodError: ZodError,
          });

          /***/
        },

      /******/
    };
    /************************************************************************/
    /******/ // The module cache
    /******/ var __webpack_module_cache__ = {};
    /******/
    /******/ // The require function
    /******/ function __webpack_require__(moduleId) {
      /******/ // Check if module is in cache
      /******/ var cachedModule = __webpack_module_cache__[moduleId];
      /******/ if (cachedModule !== undefined) {
        /******/ return cachedModule.exports;
        /******/
      }
      /******/ // Create a new module (and put it into the cache)
      /******/ var module = (__webpack_module_cache__[moduleId] = {
        /******/ // no module.id needed
        /******/ // no module.loaded needed
        /******/ exports: {},
        /******/
      });
      /******/
      /******/ // Execute the module function
      /******/ __webpack_modules__[moduleId](
        module,
        module.exports,
        __webpack_require__,
      );
      /******/
      /******/ // Return the exports of the module
      /******/ return module.exports;
      /******/
    }
    /******/
    /************************************************************************/
    /******/ /* webpack/runtime/define property getters */
    /******/ (() => {
      /******/ // define getter functions for harmony exports
      /******/ __webpack_require__.d = (exports, definition) => {
        /******/ for (var key in definition) {
          /******/ if (
            __webpack_require__.o(definition, key) &&
            !__webpack_require__.o(exports, key)
          ) {
            /******/ Object.defineProperty(exports, key, {
              enumerable: true,
              get: definition[key],
            });
            /******/
          }
          /******/
        }
        /******/
      };
      /******/
    })();
    /******/
    /******/ /* webpack/runtime/hasOwnProperty shorthand */
    /******/ (() => {
      /******/ __webpack_require__.o = (obj, prop) =>
        Object.prototype.hasOwnProperty.call(obj, prop);
      /******/
    })();
    /******/
    /******/ /* webpack/runtime/make namespace object */
    /******/ (() => {
      /******/ // define __esModule on exports
      /******/ __webpack_require__.r = (exports) => {
        /******/ if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
          /******/ Object.defineProperty(exports, Symbol.toStringTag, {
            value: "Module",
          });
          /******/
        }
        /******/ Object.defineProperty(exports, "__esModule", { value: true });
        /******/
      };
      /******/
    })();
    /******/
    /************************************************************************/
    var __webpack_exports__ = {};
    // This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
    (() => {
      /*!*************************!*\
  !*** ./src/register.ts ***!
  \*************************/
      __webpack_require__.r(__webpack_exports__);
      /* harmony export */ __webpack_require__.d(__webpack_exports__, {
        /* harmony export */ MCP: () =>
          /* reexport safe */ _mcp__WEBPACK_IMPORTED_MODULE_0__.MCP,
        /* harmony export */
      });
      /* harmony import */ var _mcp__WEBPACK_IMPORTED_MODULE_0__ =
        __webpack_require__(/*! ./mcp */ "./src/mcp.ts");
      /* harmony import */ var _modelcontextprotocol_server_filesystem__WEBPACK_IMPORTED_MODULE_1__ =
        __webpack_require__(
          /*! ./@modelcontextprotocol/server-filesystem */ "./src/@modelcontextprotocol/server-filesystem/index.ts",
        );
      /* harmony import */ var _mcp_obsidian_index__WEBPACK_IMPORTED_MODULE_2__ =
        __webpack_require__(
          /*! ./mcp-obsidian/index */ "./src/mcp-obsidian/index.ts",
        );
    })();

    /******/ return __webpack_exports__;
    /******/
  })();
});
