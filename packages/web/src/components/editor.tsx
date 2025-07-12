
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { } from "@dadigua/hyperchat-shared/types";
import { v4 } from "uuid";
import { Button, Space } from "antd";
import { FullscreenOutlined } from "@ant-design/icons";
import { call } from "../common/call";
import { isOnBrowser } from "../common";
import { useForceUpdate } from "../hooks/useForceUpdate";

// Register a new language
monaco.languages.register({ id: "HyperPromptLanguage" });

// Register a tokens provider for the language
monaco.languages.setMonarchTokensProvider("HyperPromptLanguage", {
    tokenizer: {
        root: [
            [/{{.*}}/, "PromptVariable"],
        ],
    },
});
monaco.editor.defineTheme("hyperChatCustomTheme", {
    base: "vs",
    inherit: false,
    rules: [
        { token: "PromptVariable", foreground: "FFA500", fontStyle: "bold" },
    ],
    colors: {
        "editor.foreground": "#000000",
    },
});

let monacoProviders: monaco.IDisposable[] = [];
export function enableCompletionItemProvider() {
    // const varList = [...VarList.get().data?.map((v) => {
    //     const varName = v.scope + "." + v.name;
    //     return {
    //         ...v,
    //         varName
    //     }
    // })];

    // Register a completion item provider for the new language
    // monacoProviders.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
    //     provideCompletionItems: (model, position, context, token) => {
    //         const word = model.getWordUntilPosition(position);
    //         const range = {
    //             startLineNumber: position.lineNumber,
    //             endLineNumber: position.lineNumber,
    //             startColumn: word.startColumn,
    //             endColumn: word.endColumn,
    //         };
    //         const suggestions = [
    //             ...Agents.get().data.map((agent) => {
    //                 return {
    //                     label: "agent." + agent.name,
    //                     kind: monaco.languages.CompletionItemKind.User,
    //                     insertText: agent.name,
    //                     range: range,
    //                     detail: 'Agent',
    //                     documentation: `${agent.name} agent`
    //                 }
    //             }),
    //             ...varList.map((x) => {
    //                 return {
    //                     ...x,
    //                     kind: x.variableStrategy == "immediate" ? monaco.languages.CompletionItemKind.Text : monaco.languages.CompletionItemKind.Variable,
    //                     range: range,
    //                     label: x.varName,
    //                     insertText: x.variableStrategy == "immediate" ? (x.value || "") : `{{${x.varName}}}`,
    //                     detail: x.description || `${x.name} ${x.variableStrategy} ${x.variableType}`,
    //                     value: x.value,
    //                 }
    //             })
    //         ];
    //         return { suggestions: suggestions };
    //     },
    // }));
    // Register a completion item provider for the new language
    // monacoProviders.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
    //     triggerCharacters: ['@'],
    //     provideCompletionItems: (model, position, context, token) => {
    //         // 获取当前行文本
    //         const lineContent = model.getLineContent(position.lineNumber);
    //         const wordUntilPosition = model.getWordUntilPosition(position);

    //         const isAtTrigger = lineContent.charAt(position.column - 2) === '@';
    //         if (isAtTrigger) {
    //             const range = {
    //                 startLineNumber: position.lineNumber,
    //                 endLineNumber: position.lineNumber,
    //                 startColumn: wordUntilPosition.startColumn,
    //                 endColumn: wordUntilPosition.endColumn,
    //             };

    //             return {
    //                 suggestions: [
    //                     ...Agents.get().data.map((agent) => {
    //                         return {
    //                             label: agent.name,
    //                             kind: monaco.languages.CompletionItemKind.User,
    //                             insertText: agent.name,
    //                             range: range,
    //                             detail: 'Agent',
    //                             documentation: `${agent.name} agent`
    //                         }
    //                     }),
    //                 ]
    //             };
    //         }

    //         return { suggestions: [] };
    //     },


    // }));


    // monacoProviders.push(monaco.languages.registerHoverProvider("HyperPromptLanguage", {

    //     provideHover: async (model, position, token, context) => {
    //         const word = model.getWordAtPosition(position);
    //         if (!word) {
    //             return;
    //         }
    //         const lineContent = model.getLineContent(position.lineNumber);

    //         const wordUntilPosition = model.getWordUntilPosition(position);

    //         // Check if the cursor is on a variable {{...}}
    //         const variableMatch = lineContent.match(/{{([^{}]*)}}/g);
    //         if (variableMatch) {
    //             // Find which variable the cursor is on
    //             for (const match of variableMatch) {
    //                 const startIndex = lineContent.indexOf(match);
    //                 const endIndex = startIndex + match.length;

    //                 // Check if cursor position is within this variable
    //                 if (position.column > startIndex && position.column <= endIndex) {
    //                     const variableName = match.substring(2, match.length - 2);

    //                     const v = varList.find((x) => x.varName == variableName);

    //                     let value = `**Variable:** ${variableName}\n\nNo found for this variable.`;

    //                     try {

    //                         if (v) {
    //                             if (v.variableType == "js") {
    //                                 const result = await call("runCode", { code: v.code || "" });
    //                                 value = String(result || "");
    //                             } else if (v.variableType == "webjs") {
    //                                 let code = `
    //                         (async () => {
    //                             ${v.code || ""}
    //                            return await get()
    //                         })()
    //                             `;
    //                                 const result = await eval(code);
    //                                 value = String(result || "");
    //                             } else {
    //                                 value = `**Variable:** ${v.varName}\n\n${v.value || ""}`;
    //                             }
    //                         }

    //                         return {
    //                             range: new monaco.Range(
    //                                 position.lineNumber,
    //                                 startIndex + 1,
    //                                 position.lineNumber,
    //                                 endIndex + 1
    //                             ),
    //                             contents: [
    //                                 {
    //                                     value: value
    //                                 }
    //                             ]
    //                         };
    //                     } catch (e) {

    //                         return {
    //                             range: new monaco.Range(
    //                                 position.lineNumber,
    //                                 startIndex + 1,
    //                                 position.lineNumber,
    //                                 endIndex + 1
    //                             ),
    //                             contents: [
    //                                 {
    //                                     value: "error: "
    //                                 },
    //                                 {
    //                                     value: String(e)
    //                                 }
    //                             ]
    //                         };
    //                     }
    //                 }
    //             }
    //             const word = model.getWordAtPosition(position);
    //             return {
    //                 range: new monaco.Range(position.lineNumber, word?.startColumn || 1, position.lineNumber, word?.endColumn || 1),
    //                 contents: [
    //                     { value: `**${word?.word || 'unknown'}** is a special term.` }
    //                 ]
    //             };
    //         }
    //         return undefined;
    //     }
    // }));
}
export function disableCompletionItemProvider() {
    monacoProviders.forEach(provider => provider.dispose());
}


export const Editor = forwardRef(({
    value = "",
    onChange = (value: string) => { },
    style = {},
    className = "",
    action = false,
    autoHeight = false,
    rows = 1,
    maxRows = Number.MAX_VALUE,
    onSubmit,
    placeholder,
    lineHeight = 19,
    fontSize = 14,
    submitType = "CtrlEnter",
    onDragFile,
    onParseFile,
    onKeyDown
}: {
    value?: string,
    onChange?: (value: string) => void,
    style?: React.CSSProperties,
    className?: string,
    action?: React.ReactNode | false,
    autoHeight?: boolean,
    rows?: number,
    maxRows?: number,
    onSubmit?: (value: string) => void,
    placeholder?: string,
    lineHeight?: number,
    fontSize?: number,
    submitType?: "enter" | "CtrlEnter",
    onDragFile?: (file: File) => void,
    onParseFile?: (file: File) => void,
    onKeyDown?: (e: { key: string }) => void,
}, ref) => {
    const refresh = useForceUpdate();
    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const monacoModelRef = React.useRef<monaco.editor.ITextModel>();
    const monacoProvidersRef = React.useRef<monaco.IDisposable[]>([]);
    const uid = useRef<string>("monaco-" + v4());




    const [editorHeight, setEditorHeight] = useState<number>(lineHeight * rows);
    const cachegetLineCount = useRef<number>(undefined);
    const updateEditorHeight = () => {
        if (monacoRef.current) {
            const model = monacoRef.current.getModel();
            if (model) {
                const lineCount = model.getLineCount();
                if (maxRows == null) {
                    return;
                }

                if (cachegetLineCount.current == lineCount) {
                    return;
                }
                cachegetLineCount.current = lineCount;

                const newHeight = Math.min(lineHeight * maxRows, lineCount * lineHeight);
                setEditorHeight((prev) => {
                    if (prev == newHeight) {
                        return prev;
                    }
                    setTimeout(() => {
                        monacoRef.current?.layout();
                    }, 10);
                    return newHeight;
                });
            }
        }
    };

    useEffect(() => {
        updateEditorHeight();
    }, [monacoRef.current]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    useImperativeHandle(ref, () => ({
        setIsFullscreen: (value: boolean) => {
            setIsFullscreen(!isFullscreen);
            setTimeout(() => {
                monacoRef.current?.layout();
            }, 100);
        },
        setValue: (value: string) => {
            monacoModelRef.current?.setValue(value);
        },
        focus: () => {
            if (monacoRef.current) {
                monacoRef.current.focus();
            }
        },
        insertTextAtCursor: (text: string) => {
            if (monacoRef.current) {
                const position = monacoRef.current.getPosition();
                if (position) {
                    monacoRef.current.executeEdits('', [{
                        range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            position.lineNumber,
                            position.column
                        ),
                        text: text
                    }]);
                    monacoRef.current.setPosition({
                        lineNumber: position.lineNumber,
                        column: position.column + text.length
                    });
                }
            }
        }
    }));

    useEffect(() => {

        (async () => {
            if (monacoRef.current) {
                return; // 如果已经有编辑器实例，就不再创建
            }

            if (document.getElementById(uid.current) == null) {
                return;
            }

            function validate(model: monaco.editor.ITextModel) {
                let varList: any[] = [
                    //     ...VarList.get().data?.map((v) => {
                    //     let varName = v.scope + "." + v.name;
                    //     return {
                    //         ...v,
                    //         varName
                    //     }
                    // })
                ];

                const markers: monaco.editor.IMarkerData[] = [];
                // Find all {{...}} variables in the text
                const text = model.getValue();
                const variableRegex = /{{([^{}]*)}}/g;
                let match;

                while ((match = variableRegex.exec(text)) !== null) {
                    const variableName = match[1];
                    const startPosition = model.getPositionAt(match.index);
                    const endPosition = model.getPositionAt(match.index + match[0].length);

                    // Check if the variable exists in AppSetting
                    const varExists = varList.find((x: any) => x.varName == variableName);

                    if (!varExists) {
                        markers.push({
                            message: `Variable "${variableName}" not found!`,
                            severity: monaco.MarkerSeverity.Warning,
                            startLineNumber: startPosition.lineNumber,
                            startColumn: startPosition.column,
                            endLineNumber: endPosition.lineNumber,
                            endColumn: endPosition.column,
                        });
                    }

                    // Check if variable name is empty
                    if (variableName.trim() === '') {
                        markers.push({
                            message: "Empty variable name",
                            severity: monaco.MarkerSeverity.Error,
                            startLineNumber: startPosition.lineNumber,
                            startColumn: startPosition.column,
                            endLineNumber: endPosition.lineNumber,
                            endColumn: endPosition.column,
                        });
                    }
                }

                monaco.editor.setModelMarkers(model, "owner", markers);
            }

            if (autoHeight) {
                if (rows) {
                    const lines = value.split("\n");
                    while (lines.length < rows) {
                        lines.push("");
                    }
                    value = lines.join("\n");
                }
            }
            value && onChange && onChange(value);
            const uri = monaco.Uri.parse("inmemory://" + uid.current);
            let model = monaco.editor.createModel(value, "HyperPromptLanguage", uri);

            let scrollbar = {
                horizontal: 'hidden',
            } as any;
            // if (autoHeight) {
            //     scrollbar = {
            //         horizontal: 'hidden',
            //         vertical: 'hidden',
            //         alwaysConsumeMouseWheel: false // 禁止鼠标滚轮事件  
            //     }
            // }
            const editorElement = document.getElementById(uid.current);
            if (!editorElement) return;
            let editor = monaco.editor.create(editorElement, {
                theme: "hyperChatCustomTheme",
                model: model,
                language: "HyperPromptLanguage",
                // 禁用 sticky scroll
                stickyScroll: {
                    enabled: false
                },
                minimap: { enabled: false }, // 禁用滚动预览条
                lineNumbers: 'off',
                lineDecorationsWidth: 0,
                scrollbar: scrollbar,
                scrollBeyondLastLine: false, // 禁止滚动超过最后一行

                lineHeight: lineHeight,
                fontSize: fontSize,
                // 添加自动换行设置
                wordWrap: 'on', // 启用自动换行
                // wrappingStrategy: 'advanced', // 更智能的换行策略
                // wordWrapBreakBeforeCharacters: ',.!?，。！？', // 在这些字符前换行
                // wordWrapBreakAfterCharacters: ' \t、【】《》', // 在这些字符后换行
                wordSeparators: `~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?~！@#￥%……&*（）——-=+【{】}\\|；：'"，。、《》？`, // 包含中英文标点

                // quickSuggestions: {
                //     other: true,
                //     comments: false,
                //     strings: false
                // },
                // suggestOnTriggerCharacters: false, // 在手动触发时才显示建议
                // acceptSuggestionOnEnter: "smart",

                accessibilitySupport: "off", // 禁用辅助功能支持

                roundedSelection: true, // 启用圆角选择
                fixedOverflowWidgets: true, // 修复溢出部件
                fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'", // 设置字体为 JetBrains Mono
                // wordSeparators: `\`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?、，。；：'"【】《》？！￥…（）`,
                unicodeHighlight: {
                    ambiguousCharacters: false,
                    invisibleCharacters: false,
                    nonBasicASCII: false
                },

                dropIntoEditor: {
                    enabled: false, // 禁用拖拽到编辑器中
                }, // 允许拖拽到编辑器中
                // readOnly: false // Enable editing
            });
            const lh = editor.getOption(monaco.editor.EditorOption.fontSize);
            console.log("Line fontSize:", lh);
            if (value != undefined) {
                model.setValue(value); // 设置初始值
            }
            validate(model);

            if (submitType == "enter") {
                // 如果你仍然想保留单独 Enter 提交功能，可以使用 onKeyDown 事件而不是 addCommand
                editor.onKeyDown((e) => {
                    // 检查是否应该触发自定义的 onKeyDown 事件（历史记录导航）
                    if (onKeyDown && (e.keyCode === monaco.KeyCode.UpArrow || e.keyCode === monaco.KeyCode.DownArrow)) {
                        const position = editor.getPosition();
                        const model = editor.getModel();

                        if (position && model) {
                            const isFirstLine = position.lineNumber === 1;
                            const isLastLine = position.lineNumber === model.getLineCount();

                            // 只有在第一行按上箭头或最后一行按下箭头时才触发历史记录导航
                            const shouldTriggerHistory =
                                (e.keyCode === monaco.KeyCode.UpArrow && isFirstLine) ||
                                (e.keyCode === monaco.KeyCode.DownArrow && isLastLine);

                            if (shouldTriggerHistory) {
                                // 创建一个简化的键盘事件对象
                                const reactKeyboardEvent = {
                                    key: e.browserEvent.key,
                                };
                                onKeyDown(reactKeyboardEvent);
                            }
                        }
                    }

                    if (e.keyCode === monaco.KeyCode.Enter && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
                        // 检查建议面板是否可见
                        const suggestWidgetVisible = document.querySelector('.suggest-widget.visible') !== null;
                        if (!suggestWidgetVisible) {
                            // 如果不可见才提交
                            const currentValue = editor.getModel()?.getValue() ?? "";
                            onSubmit && onSubmit(currentValue);
                            e.preventDefault();
                        }
                    }
                });

                editor.addCommand(
                    monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                    () => {
                        // const currentValue = editor.getModel()?.getValue() ?? "";
                        const position = editor.getPosition();
                        if (position) {
                            // const lineContent = editor.getModel().getLineContent(position.lineNumber);
                            const insertText = "\n";
                            editor.executeEdits("", [{
                                range: new monaco.Range(
                                    position.lineNumber,
                                    position.column,
                                    position.lineNumber,
                                    position.column
                                ),
                                text: insertText
                            }]);
                            // Move cursor to new position
                            editor.setPosition({
                                lineNumber: position.lineNumber + 1,
                                column: 1
                            });
                        }
                    }
                );
            } else {
                // 对于 CtrlEnter 模式，也需要处理 onKeyDown 事件
                editor.onKeyDown((e) => {
                    // 检查是否应该触发自定义的 onKeyDown 事件（历史记录导航）
                    if (onKeyDown && (e.keyCode === monaco.KeyCode.UpArrow || e.keyCode === monaco.KeyCode.DownArrow)) {
                        const position = editor.getPosition();
                        const model = editor.getModel();

                        if (position && model) {
                            const isFirstLine = position.lineNumber === 1;
                            const isLastLine = position.lineNumber === model.getLineCount();

                            // 只有在第一行按上箭头或最后一行按下箭头时才触发历史记录导航
                            const shouldTriggerHistory =
                                (e.keyCode === monaco.KeyCode.UpArrow && isFirstLine) ||
                                (e.keyCode === monaco.KeyCode.DownArrow && isLastLine);

                            if (shouldTriggerHistory) {
                                // 创建一个简化的键盘事件对象
                                const reactKeyboardEvent = {
                                    key: e.browserEvent.key,
                                };
                                onKeyDown(reactKeyboardEvent);
                            }
                        }
                    }
                });

                editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                    () => {
                        const currentValue = editor.getModel()?.getValue() ?? "";
                        // 更新内容
                        onSubmit && onSubmit(currentValue);
                    }
                );
            }




            // 添加拖拽事件监听
            const dragEditorElement = editor.getContainerDomNode();
            if (dragEditorElement) {
                dragEditorElement.addEventListener('dragover', (e) => {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation();
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy'; // 显示复制图标
                    }
                });

                dragEditorElement.addEventListener('drop', (e) => {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation();

                    // 处理拖拽的文件
                    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                        const file: any = e.dataTransfer.files[0];
                        console.log("Dropped file:", file);
                        // e.preventDefault();
                        if (isOnBrowser) {
                            onDragFile && onDragFile(file);
                        } else {
                            const text = file.path;
                            const position = editor.getTargetAtClientPoint(e.clientX, e.clientY);

                            if (position && position.position) {
                                editor.executeEdits('', [{
                                    range: new monaco.Range(
                                        position.position.lineNumber,
                                        position.position.column,
                                        position.position.lineNumber,
                                        position.position.column
                                    ),
                                    text: text
                                }]);
                            }
                        }



                        // reader.readAsText(file);
                    } else if (e.dataTransfer?.getData('text')) {
                        // 处理拖拽的文本
                        const text = e.dataTransfer.getData('text');
                        const position = editor.getTargetAtClientPoint(e.clientX, e.clientY);

                        if (position && position.position) {
                            editor.executeEdits('', [{
                                range: new monaco.Range(
                                    position.position.lineNumber,
                                    position.position.column,
                                    position.position.lineNumber,
                                    position.position.column
                                ),
                                text: text
                            }]);
                        }
                    }
                });
                // editorElement.removeEventListener("paste")

                window.addEventListener('paste', (e) => {
                    // 1. 检查焦点是否在编辑器内
                    if (!editor.hasTextFocus()) return;

                    // e.stopPropagation();
                    // console.log('Window paste event triggered', e.clipboardData.items);
                    const items = e.clipboardData?.items;
                    let arr: any[] = Array.from(items || []);
                    for (const item of arr) {
                        if (item.kind === 'file') {
                            e.stopPropagation();
                            const file = item.getAsFile();
                            if (file && file.type.startsWith('image/')) {
                                (onParseFile) && onParseFile(file);
                            }
                        }
                    }
                }, true);





            }


            monacoRef.current = editor;
            model.onDidChangeContent(() => {
                validate(model);
                const newValue = model.getValue();
                onChange(newValue);
                updateEditorHeight(); // 更新编辑器高度
            });

            monacoModelRef.current = model;
            refresh();
        })();

        return () => {
            monacoProvidersRef.current.forEach(provider => provider.dispose());
            monacoRef.current?.dispose();
            monacoModelRef.current?.dispose();
        }

    }, [monacoRef, monacoProvidersRef])

    // const fullscreenStyle: React.CSSProperties = isFullscreen ? {
    //     position: 'fixed',
    //     top: 0,
    //     left: 0,
    //     width: '100vw',
    //     height: '100vh',
    //     zIndex: 1000,
    //     backgroundColor: 'white',
    //     ...style
    // } : style;


    return <div className={"my-editor"} style={{
        ...style,
    }} onClick={() => {
        if (monacoRef.current) {
            monacoRef.current.focus();
        }
    }}>
        <div style={{ height: autoHeight ? editorHeight : style.height, }} className={className + " " + "h-full w-full"} id={uid.current} >
        </div>
        {value == "" && placeholder && (
            <div className="line-clamp-1" style={{
                position: 'absolute',
                top: "50%",
                left: "20px",
                transform: "translate(0%, -50%)",
                color: '#999999',
                pointerEvents: 'none',
                zIndex: 1
            }}>
                {placeholder}
            </div>
        )}
        {action && <div className="editor-toolbar" style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            fontSize: fontSize,
        }}>
            <Space.Compact>
                <Button
                    size="small"
                    icon={<FullscreenOutlined />}
                    onClick={() => {
                        setIsFullscreen(!isFullscreen);
                    }}
                >
                </Button>
            </Space.Compact>
        </div>}
    </div>
});

