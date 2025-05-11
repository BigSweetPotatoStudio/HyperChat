
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { Agents, AppSetting, VarList } from "../../../common/data";
import { v4 } from "uuid";
import { Button, Space } from "antd";
import { FullscreenOutlined } from "@ant-design/icons";
import { call } from "../common/call";
import { isOnBrowser } from "../common";

// Register a new language
monaco.languages.register({ id: "HyperPromptLanguage" });

// Register a tokens provider for the language
monaco.languages.setMonarchTokensProvider("HyperPromptLanguage", {
    tokenizer: {
        root: [
            [/{{.*}}/, "PromptVariable"], // Highlight {{...}} as a variable
            // [/[，。？！；：""''【】「」『』（）、]/, "ChinesePunctuation"]
        ],
    },
});
monaco.editor.defineTheme("hyperChatCustomTheme", {
    base: "vs",
    inherit: false,
    rules: [
        { token: "PromptVariable", foreground: "FFA500", fontStyle: "bold" },
        // { token: "ChinesePunctuation", foreground: "FFA500", fontStyle: "bold",  }, // 添加中文标点的样式
    ],
    colors: {
        "editor.foreground": "#000000",
    },
});

let monacoProviders = [];
export function enableCompletionItemProvider() {
    let varList = [...VarList.get().data?.map((v) => {
        let varName = v.scope + "." + v.name;
        return {
            ...v,
            varName
        }
    })];

    // Register a completion item provider for the new language
    monacoProviders.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
        provideCompletionItems: (model, position) => {


            var word = model.getWordUntilPosition(position);
            var range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };
            var suggestions = [
                // {
                //     label: "user.TsimpleText",
                //     kind: monaco.languages.CompletionItemKind.Text,
                //     insertText: "simpleText",
                //     range: range,
                // },
                ...Agents.get().data.map((agent) => {
                    return {
                        label: "agent." + agent.label,
                        kind: monaco.languages.CompletionItemKind.User,
                        insertText: agent.label,
                        range: range,
                        // 可以添加详细信息
                        detail: 'Agent',
                        documentation: `${agent.label} agent`
                    }
                }),
                ...varList.map((x) => {
                    return {
                        ...x,
                        kind: x.variableStrategy == "immediate" ? monaco.languages.CompletionItemKind.Text : monaco.languages.CompletionItemKind.Variable,
                        range: range,
                        label: x.varName,
                        insertText: x.variableStrategy == "immediate" ? x.value : `{{${x.varName}}}`,
                        detail: x.description || `${x.name} ${x.variableStrategy} ${x.variableType}`,
                        value: x.value,
                    }
                })
            ];
            return { suggestions: suggestions };
        },
    }));
    // Register a completion item provider for the new language
    monacoProviders.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
        // 指定触发字符，在用户输入@时立即触发补全
        triggerCharacters: ['@'],
        // replaceTriggerChar: true, // For example, if this configuration is enabled, @ will be replaced
        provideCompletionItems: (model, position, context, token) => {
            // 获取当前行文本
            const lineContent = model.getLineContent(position.lineNumber);
            const wordUntilPosition = model.getWordUntilPosition(position);

            // console.log("Current line content:", position, lineContent, wordUntilPosition);
            // 判断是否是@触发的补全
            const isAtTrigger = lineContent.charAt(position.column - 2) === '@';



            // 根据触发方式提供不同的建议
            if (isAtTrigger) {
                // 创建范围对象
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: wordUntilPosition.startColumn,
                    endColumn: wordUntilPosition.endColumn,
                };

                // const startColumn = wordUntilPosition.startColumn - 1; // -1 for the '@' character
                // const qrange = {
                //     startLineNumber: position.lineNumber,
                //     endLineNumber: position.lineNumber,
                //     startColumn: startColumn,
                //     endColumn: position.column,
                // };
                return {
                    suggestions: [
                        ...Agents.get().data.map((agent) => {
                            return {
                                label: agent.label,
                                kind: monaco.languages.CompletionItemKind.User,
                                insertText: agent.label,
                                range: range,
                                // 可以添加详细信息
                                detail: 'Agent',
                                documentation: `${agent.label} agent`
                            }
                        }),
                        // ...AppSetting.get().quicks?.map((quick) => {
                        //     return {
                        //         label: quick.label,
                        //         kind: monaco.languages.CompletionItemKind.Text,
                        //         insertText: quick.quick,

                        //         range: qrange,
                        //         // 可以添加详细信息
                        //         detail: 'Quick',
                        //         documentation: `${quick.label} quick`
                        //     }
                        // })
                    ]
                };
            }

            // 默认建议
            var suggestions = [

                // 其他默认建议...
            ];

            return { suggestions: suggestions };
        },


    }));


    monacoProviders.push(monaco.languages.registerHoverProvider("HyperPromptLanguage", {

        provideHover: async (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) {
                return;
            }
            const lineContent = model.getLineContent(position.lineNumber);

            const wordUntilPosition = model.getWordUntilPosition(position);
            // console.log("Current line content:", position, lineContent, wordUntilPosition);

            // Check if the cursor is on a variable {{...}}
            const variableMatch = lineContent.match(/{{([^{}]*)}}/g);
            if (variableMatch) {
                // Find which variable the cursor is on
                for (const match of variableMatch) {
                    const startIndex = lineContent.indexOf(match);
                    const endIndex = startIndex + match.length;

                    // Check if cursor position is within this variable
                    if (position.column > startIndex && position.column <= endIndex) {
                        const variableName = match.substring(2, match.length - 2);

                        // Find the corresponding quick in AppSetting
                        const v = varList.find((x) => x.varName == variableName);

                        let value = `**Variable:** ${variableName}\n\nNo found for this variable.`;

                        try {

                            if (v) {
                                if (v.variableType == "js") {
                                    value = await call("runCode", [{ code: v.code }]);
                                } else if (v.variableType == "webjs") {
                                    let code = `
                            (async () => {
                                ${v.code}
                               return await get()
                            })()
                                `;
                                    // console.log(code);
                                    value = await eval(code);
                                } else {
                                    value = `**Variable:** ${v.varName}\n\n${v.value}`;
                                }
                            }

                            return {
                                range: new monaco.Range(
                                    position.lineNumber,
                                    startIndex + 1,
                                    position.lineNumber,
                                    endIndex + 1
                                ),
                                contents: [
                                    {
                                        value: value
                                    }
                                ]
                            };
                        } catch (e) {

                            return {
                                range: new monaco.Range(
                                    position.lineNumber,
                                    startIndex + 1,
                                    position.lineNumber,
                                    endIndex + 1
                                ),
                                contents: [
                                    {
                                        value: "error: "
                                    },
                                    {
                                        value: e
                                    }
                                ]
                            };
                        }
                    }
                }
                const word = model.getWordAtPosition(position);
                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `**${word.word}** is a special term.` }
                    ]
                };
            }

        }
    }));
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
    maxRows,
    onSubmit,
    placeholder,
    lineHeight = 19,
    fontSize = 14,
    submitType = "CtrlEnter",
    onDragFile,
    onParseFile
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
}, ref) => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const monacoModelRef = React.useRef<monaco.editor.ITextModel>();
    const monacoProvidersRef = React.useRef<monaco.IDisposable[]>([]);
    const uid = useRef<string>("monaco-" + v4());

    // const minHeight = 100; // 最小高度
    // const paddingHeight = 10; // 额外的内边距高度
    // Split the value into lines and ensure it has at least the specified number of rows



    const [editorHeight, setEditorHeight] = useState<number>(lineHeight * rows); // 初始高度为 4 行的高度
    const cachegetLineCount = useRef<number>(undefined);
    // 在初始化编辑器后和内容变化时更新高度
    const updateEditorHeight = () => {
        // if (!autoHeight) return;
        if (monacoRef.current) {
            const model = monacoRef.current.getModel();
            if (model) {
                const lineCount = model.getLineCount();
                if (maxRows != null && lineCount >= maxRows) {
                    return;
                }
                if (cachegetLineCount.current == lineCount) {
                    return;
                }
                cachegetLineCount.current = lineCount;
                // 根据行数计算高度
                const newHeight = Math.max(lineHeight, lineCount * lineHeight);
                setEditorHeight(newHeight);

                // 通知编辑器重新布局
                setTimeout(() => {
                    monacoRef.current?.layout();
                }, 10);
            }
        }
    };

    // 在Editor对象创建后设置初始高度
    useEffect(() => {
        updateEditorHeight();
    }, [monacoRef.current]);
    // 添加全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);
    // 使用 useImperativeHandle 暴露方法给外部
    useImperativeHandle(ref, () => ({
        setIsFullscreen: (value: boolean) => {
            setIsFullscreen(!isFullscreen);
            // 当全屏状态变化时，通知编辑器刷新布局
            setTimeout(() => {
                monacoRef.current?.layout();
            }, 100);
        },
        setValue: (value: string) => {
            monacoModelRef.current.setValue(value);
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
                    // Set cursor position after the inserted text
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

            function validate(model) {
                let varList = [...VarList.get().data?.map((v) => {
                    let varName = v.scope + "." + v.name;
                    return {
                        ...v,
                        varName
                    }
                })];

                const markers = [];
                // Find all {{...}} variables in the text
                const text = model.getValue();
                const variableRegex = /{{([^{}]*)}}/g;
                let match;

                while ((match = variableRegex.exec(text)) !== null) {
                    const variableName = match[1];
                    const startPosition = model.getPositionAt(match.index);
                    const endPosition = model.getPositionAt(match.index + match[0].length);

                    // Check if the variable exists in AppSetting
                    const varExists = varList.find((x) => x.varName == variableName);

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
            let editor = monaco.editor.create(document.getElementById(uid.current), {
                theme: "hyperChatCustomTheme",
                model: model,
                language: "HyperPromptLanguage",
                minimap: { enabled: false }, // 禁用滚动预览条
                lineNumbers: 'off',
                lineDecorationsWidth: 0,
                scrollbar: scrollbar,
                scrollBeyondLastLine: false, // 禁止滚动超过最后一行

                lineHeight: lineHeight,
                fontSize: fontSize,
                // 添加自动换行设置
                // wordWrap: 'on', // 启用自动换行
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

            validate(model);

            if (submitType == "enter") {
                // 如果你仍然想保留单独 Enter 提交功能，可以使用 onKeyDown 事件而不是 addCommand
                editor.onKeyDown((e) => {
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
            const editorElement = editor.getContainerDomNode();
            if (editorElement) {
                editorElement.addEventListener('dragover', (e) => {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy'; // 显示复制图标
                });

                editorElement.addEventListener('drop', (e) => {
                    e.preventDefault(); // 阻止默认行为
                    e.stopPropagation();

                    // 处理拖拽的文件
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
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

                        // e.stopPropagation();
                        // const reader = new FileReader();

                        // reader.onload = (event) => {
                        //     if (event.target && typeof event.target.result === 'string') {
                        //         // 获取拖拽位置对应的编辑器位置
                        //         const position = editor.getTargetAtClientPoint(e.clientX, e.clientY);
                        //         if (position && position.position) {
                        //             // 在拖放位置插入文本
                        //             editor.executeEdits('', [{
                        //                 range: new monaco.Range(
                        //                     position.position.lineNumber,
                        //                     position.position.column,
                        //                     position.position.lineNumber,
                        //                     position.position.column
                        //                 ),
                        //                 text: event.target.result
                        //             }]);
                        //         } else {
                        //             // 如果无法确定位置，则在当前光标位置插入
                        //             const currentPosition = editor.getPosition();
                        //             if (currentPosition) {
                        //                 editor.executeEdits('', [{
                        //                     range: new monaco.Range(
                        //                         currentPosition.lineNumber,
                        //                         currentPosition.column,
                        //                         currentPosition.lineNumber,
                        //                         currentPosition.column
                        //                     ),
                        //                     text: event.target.result
                        //                 }]);
                        //             }
                        //         }
                        //     }
                        // };

                        // reader.readAsText(file);
                    } else if (e.dataTransfer.getData('text')) {
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
                    e.stopPropagation();
                    // console.log('Window paste event triggered', e.clipboardData.items);
                    const items = e.clipboardData.items;
                    let arr: any[] = Array.from(items);
                    for (const item of arr) {
                        if (item.kind === 'file') {
                            const file = item.getAsFile();
                            if (file && file.type.startsWith('image/')) {
                                (onParseFile) && onParseFile(file);
                            }
                        }
                    }
                }, true);
                // editorElement.addEventListener('paste', (e) => {
                //     console.log("Pasted data:", e.clipboardData.items);
                // });

                // editor.onDidPaste(async (e) => {
                //     let items = await navigator.clipboard.read();
                //     let arr: any[] = Array.from(items);
                //     for (const item of arr) {
                //         if (item.kind === 'file') {
                //             const file = item.getAsFile();
                //             if (file && file.type.startsWith('image/')) {
                //                 // const url = await uploadFile(file); // 你实现的上传函数
                //                 const insertText = `![图片描述]`;

                //                 // 插入到当前光标位置
                //                 const position = editor.getPosition();
                //                 editor.executeEdits('', [{
                //                     range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                //                     text: insertText,
                //                     forceMoveMarkers: true
                //                 }]);

                //                 // 聚焦回来
                //                 editor.focus();
                //             }
                //         }
                //     }
                // });

                // window.addEventListener('paste', (e) => {

                //     const activeElement = document.activeElement;

                //     // 判断是否是 Monaco 编辑器内部的 textarea
                //     if (!activeElement || activeElement.tagName !== 'TEXTAREA' || !editor.getDomNode().contains(activeElement)) {
                //         return; // 焦点不在编辑器上
                //     }

                //     const items = e.clipboardData.items;
                //     let arr: any[] = Array.from(items);
                //     for (const item of arr) {
                //         if (item.kind === 'file') {
                //             const file = item.getAsFile();
                //             if (file && file.type.startsWith('image/')) {
                //                 // const url = await uploadFile(file); // 你实现的上传函数
                //                 const insertText = `![图片描述]`;

                //                 // 插入到当前光标位置
                //                 const position = editor.getPosition();
                //                 editor.executeEdits('', [{
                //                     range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                //                     text: insertText,
                //                     forceMoveMarkers: true
                //                 }]);

                //                 // 聚焦回来
                //                 editor.focus();
                //             }
                //         }
                //     }
                // });

            }
            // // 添加操作栏项目
            // editor.addAction({
            //     id: 'bold-text',
            //     label: '加粗',
            //     keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
            //     contextMenuGroupId: 'formatting',
            //     run: (ed) => {
            //         const selection = ed.getSelection();
            //         const model = ed.getModel();
            //         if (selection && model) {
            //             const selectedText = model.getValueInRange(selection);
            //             const boldText = `**${selectedText}**`;
            //             ed.executeEdits('', [
            //                 { range: selection, text: boldText }
            //             ]);
            //         }
            //         return null;
            //     }
            // });

            // editor.addAction({
            //     id: 'insert-variable',
            //     label: '插入变量',
            //     contextMenuGroupId: 'variables',
            //     run: (ed) => {
            //         // 显示变量选择对话框或直接插入模板
            //         ed.executeEdits('', [
            //             {
            //                 range: ed.getSelection(),
            //                 text: '{{变量名}}'
            //             }
            //         ]);
            //         return null;
            //     }
            // });
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

