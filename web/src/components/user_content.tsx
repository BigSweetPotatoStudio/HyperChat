import React, { useEffect } from "react";
import * as monaco from "monaco-editor";
import { Agents, AppSetting } from "../../../common/data";

export const Editor = () => {
    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();
    const monacoModelRef = React.useRef<monaco.editor.ITextModel>();
    const monacoProvidersRef = React.useRef<monaco.IDisposable[]>([]);
    useEffect(() => {

        (async () => {
            if (monacoRef.current) {
                return; // 如果已经有编辑器实例，就不再创建
            }

            if (document.getElementById("editor-container") == null) {
                return;
            }
            await Agents.init();
            await AppSetting.init();


            // Register a new language
            monaco.languages.register({ id: "HyperPromptLanguage" });

            // Register a tokens provider for the language
            monaco.languages.setMonarchTokensProvider("HyperPromptLanguage", {
                tokenizer: {
                    root: [
                        [/{{.*}}/, "PromptVariable"], // Highlight {{...}} as a variable
                    ],
                },
            });
            monaco.editor.defineTheme("myCoolTheme", {
                base: "vs",
                inherit: false,
                rules: [
                    { token: "PromptVariable", foreground: "FFA500", fontStyle: "bold" },
                ],
                colors: {
                    "editor.foreground": "#000000",
                },
            });
            // Register a completion item provider for the new language
            monacoProvidersRef.current.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
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
                        //     label: "simpleText",
                        //     kind: monaco.languages.CompletionItemKind.Text,
                        //     insertText: "simpleText",
                        //     range: range,
                        // },
                        ...Agents.get().data.map((agent) => {
                            return {
                                label: agent.label,
                                kind: monaco.languages.CompletionItemKind.Text,
                                insertText: agent.label,
                                range: range,
                                // 可以添加详细信息
                                detail: 'Agent',
                                documentation: `${agent.label} agent`
                            }
                        }),
                        ...AppSetting.get().quicks?.map((quick) => {
                            return {
                                label: "q" + quick.label,
                                kind: monaco.languages.CompletionItemKind.Text,
                                insertText: `{{${quick.label}}}`,
                                range: range,
                                // 可以添加详细信息
                                detail: 'Quick',
                                documentation: `${quick.label} quick`
                            }
                        })
                    ];
                    return { suggestions: suggestions };
                },
            }));
            // Register a completion item provider for the new language
            monacoProvidersRef.current.push(monaco.languages.registerCompletionItemProvider("HyperPromptLanguage", {
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

            monacoProvidersRef.current.push(monaco.languages.registerHoverProvider("HyperPromptLanguage", {

                provideHover: (model, position) => {

                    const lineContent = model.getLineContent(position.lineNumber);
                    const wordUntilPosition = model.getWordUntilPosition(position);
                    console.log("Current line content:", position, lineContent, wordUntilPosition);
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
                                const quick = AppSetting.get().quicks?.find(q => q.label === variableName);

                                return {
                                    range: new monaco.Range(
                                        position.lineNumber,
                                        startIndex + 1,
                                        position.lineNumber,
                                        endIndex + 1
                                    ),
                                    contents: [
                                        {
                                            value: quick
                                                ? `**Variable:** ${variableName}\n\n${quick.quick}`
                                                : `**Variable:** ${variableName}\n\nNo found for this variable.`
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
            }));

            function validate(model) {
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
                    const quickExists = AppSetting.get().quicks?.some(q => q.label === variableName);
                    
                    if (!quickExists) {
                        markers.push({
                            message: `Variable "${variableName}" not found in quick settings`,
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



            const uri = monaco.Uri.parse("inmemory://test");
            let model = monaco.editor.createModel(getCode(), "HyperPromptLanguage", uri);
            monacoRef.current = monaco.editor.create(document.getElementById("editor-container"), {
                theme: "myCoolTheme",
                model: model,
                language: "HyperPromptLanguage",
                // readOnly: true
            });
            validate(model);
            
            model.onDidChangeContent(() => {
                validate(model);
            });
            monacoModelRef.current = model;

            function getCode() {
                return [
                   
                    "[Sun Mar 7 16:02:00 2004] [notice] Apache/1.3.29 (Unix) configured -- resuming normal operations",
                    "[Sun Mar 7 16:02:00 2004] [info] Server built: Feb 27 2004 13:56:37",
                    "[Sun Mar 7 16:02:00 2004] [notice] Accept mutex: sysvsem (Default: sysvsem)",
                    "{{123}}",
                    "{{俄罗斯方块}}",
                    "[Sun Mar 7 16:05:49 2004] [info] [client xx.xx.xx.xx] (104)Connection reset by peer: client stopped connection before send body completed",
                    "[Sun Mar 7 16:45:56 2004] [info] [client xx.xx.xx.xx] (104)Connection reset by peer: client stopped connection before send body completed",
                    "[Sun Mar 7 17:13:50 2004] [info] [client xx.xx.xx.xx] (104)Connection reset by peer: client stopped connection before send body completed",
                    "[Sun Mar 7 17:21:44 2004] [info] [client xx.xx.xx.xx] (104)Connection reset by peer: client stopped connection before send body completed",
                ].join("\n");
            }
        })();

        return () => {
            monacoProvidersRef.current.forEach(provider => provider.dispose());
            monacoRef.current?.dispose();
            monacoModelRef.current?.dispose();
        }

    }, [monacoRef, monacoProvidersRef])
    return <div className="h-full" id="editor-container"></div>
};

