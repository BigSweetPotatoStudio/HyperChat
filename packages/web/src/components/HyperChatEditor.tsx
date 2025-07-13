import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Button, Space } from "antd";
import { FullscreenOutlined } from "@ant-design/icons";

// 自定义语言和主题配置
const LANGUAGE_ID = "HyperPromptLanguage";
const THEME_ID = "hyperChatCustomTheme";

// 注册自定义语言和主题
let isLanguageRegistered = false;

const registerLanguageAndTheme = () => {
  if (isLanguageRegistered) return;
  
  // 注册语言
  monaco.languages.register({ id: LANGUAGE_ID });
  
  // 设置语法高亮规则
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/{{.*}}/, "PromptVariable"],
      ],
    },
  });
  
  // 定义主题
  monaco.editor.defineTheme(THEME_ID, {
    base: "vs",
    inherit: false,
    rules: [
      { token: "PromptVariable", foreground: "FFA500", fontStyle: "bold" },
    ],
    colors: {
      "editor.foreground": "#000000",
    },
  });
  
  isLanguageRegistered = true;
};

export interface HyperChatEditorRef {
  setValue: (value: string) => void;
  focus: () => void;
  insertTextAtCursor: (text: string) => void;
  setIsFullscreen: (value: boolean) => void;
}

export interface HyperChatEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
  action?: React.ReactNode | false;
  autoHeight?: boolean;
  rows?: number;
  maxRows?: number;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  lineHeight?: number;
  fontSize?: number;
  submitType?: "enter" | "CtrlEnter";
  onDragFile?: (file: File) => void;
  onParseFile?: (file: File) => void;
  onKeyDown?: (e: { key: string }) => void;
}

export const HyperChatEditor = forwardRef<HyperChatEditorRef, HyperChatEditorProps>(({
  value = "",
  onChange = () => {},
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
}, ref) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const [editorHeight, setEditorHeight] = useState<number>(lineHeight * rows);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cacheLineCount = useRef<number>(0);

  // 计算编辑器高度
  const updateEditorHeight = useCallback(() => {
    if (!autoHeight || !editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const lineCount = model.getLineCount();
    if (cacheLineCount.current === lineCount) return;
    
    cacheLineCount.current = lineCount;
    const newHeight = Math.min(lineHeight * maxRows, Math.max(lineHeight * rows, lineCount * lineHeight));
    
    setEditorHeight(prevHeight => {
      if (prevHeight !== newHeight) {
        // 延迟布局更新，确保DOM更新完成
        setTimeout(() => {
          editorRef.current?.layout();
        }, 10);
      }
      return newHeight;
    });
  }, [autoHeight, lineHeight, maxRows, rows]);

  // 暴露的方法
  useImperativeHandle(ref, () => ({
    setValue: (newValue: string) => {
      editorRef.current?.setValue(newValue);
    },
    focus: () => {
      editorRef.current?.focus();
    },
    insertTextAtCursor: (text: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      
      const position = editor.getPosition();
      if (!position) return;
      
      editor.executeEdits('', [{
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        text: text
      }]);
      
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column + text.length
      });
    },
    setIsFullscreen: (fullscreen: boolean) => {
      setIsFullscreen(fullscreen);
      setTimeout(() => {
        editorRef.current?.layout();
      }, 100);
    }
  }));

  // 处理编辑器挂载
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // 设置键盘事件处理
    editor.onKeyDown((e) => {
      // 处理历史记录导航
      if (onKeyDown && (e.keyCode === monaco.KeyCode.UpArrow || e.keyCode === monaco.KeyCode.DownArrow)) {
        const position = editor.getPosition();
        const model = editor.getModel();

        if (position && model) {
          const isFirstLine = position.lineNumber === 1;
          const isLastLine = position.lineNumber === model.getLineCount();

          const shouldTriggerHistory =
            (e.keyCode === monaco.KeyCode.UpArrow && isFirstLine) ||
            (e.keyCode === monaco.KeyCode.DownArrow && isLastLine);

          if (shouldTriggerHistory) {
            onKeyDown({ key: e.browserEvent.key });
          }
        }
      }

      // 处理提交事件
      if (submitType === "enter") {
        if (e.keyCode === monaco.KeyCode.Enter && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
          // 检查建议面板是否可见
          const suggestWidgetVisible = document.querySelector('.suggest-widget.visible') !== null;
          if (!suggestWidgetVisible && onSubmit) {
            const currentValue = editor.getModel()?.getValue() ?? "";
            onSubmit(currentValue);
            e.preventDefault();
          }
        }
      }
    });

    // 添加命令
    if (submitType === "enter") {
      // Shift+Enter 插入换行
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          const position = editor.getPosition();
          if (position) {
            editor.executeEdits("", [{
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: "\n"
            }]);
            editor.setPosition({
              lineNumber: position.lineNumber + 1,
              column: 1
            });
          }
        }
      );
    } else {
      // Ctrl+Enter 提交
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          if (onSubmit) {
            const currentValue = editor.getModel()?.getValue() ?? "";
            onSubmit(currentValue);
          }
        }
      );
    }

    // 设置拖拽事件
    const containerElement = editor.getContainerDomNode();
    if (containerElement) {
      containerElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      });

      containerElement.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (onDragFile) {
            onDragFile(file);
          } else {
            // 默认行为：插入文件路径
            const position = editor.getTargetAtClientPoint(e.clientX, e.clientY);
            if (position?.position) {
              editor.executeEdits('', [{
                range: new monaco.Range(
                  position.position.lineNumber,
                  position.position.column,
                  position.position.lineNumber,
                  position.position.column
                ),
                text: (file as any).path || file.name
              }]);
            }
          }
        }
      });

      // 粘贴图片处理
      window.addEventListener('paste', (e) => {
        if (!editor.hasTextFocus()) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            e.stopPropagation();
            const file = item.getAsFile();
            if (file && onParseFile) {
              onParseFile(file);
            }
          }
        }
      }, true);
    }
  };

  // 处理内容变化
  const handleEditorChange = (newValue: string | undefined) => {
    const currentValue = newValue || "";
    onChange(currentValue);
    updateEditorHeight();
  };

  // 注册语言和主题
  useEffect(() => {
    registerLanguageAndTheme();
  }, []);

  // 监听高度变化
  useEffect(() => {
    updateEditorHeight();
  }, [updateEditorHeight, value]);

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: THEME_ID,
    language: LANGUAGE_ID,
    minimap: { enabled: false },
    lineNumbers: 'off',
    lineDecorationsWidth: 0,
    scrollBeyondLastLine: false,
    lineHeight: lineHeight,
    fontSize: fontSize,
    wordWrap: 'on',
    wordSeparators: `~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?~！@#￥%……&*（）——-=+【{】}\\|；：'"，。、《》？`,
    accessibilitySupport: "off",
    roundedSelection: true,
    fixedOverflowWidgets: true,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'",
    unicodeHighlight: {
      ambiguousCharacters: false,
      invisibleCharacters: false,
      nonBasicASCII: false
    },
    dropIntoEditor: { enabled: false },
    stickyScroll: { enabled: false },
    scrollbar: {
      horizontal: 'hidden',
      ...(autoHeight ? { vertical: 'hidden', alwaysConsumeMouseWheel: false } : {})
    }
  };

  return (
    <div 
      className={`hyperchat-editor ${className}`}
      style={{ 
        position: 'relative',
        ...style,
      }}
      onClick={() => editorRef.current?.focus()}
    >
      <div style={{ height: autoHeight ? editorHeight : style.height || 200 }}>
        <Editor
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
        />
      </div>
      
      {/* Placeholder */}
      {value === "" && placeholder && (
        <div
          className="line-clamp-1"
          style={{
            position: 'absolute',
            top: "50%",
            left: "20px",
            transform: "translate(0%, -50%)",
            color: '#999999',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {placeholder}
        </div>
      )}
      
      {/* Action buttons */}
      {action && (
        <div
          className="editor-toolbar"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            fontSize: fontSize,
          }}
        >
          <Space.Compact>
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Space.Compact>
        </div>
      )}
    </div>
  );
});

HyperChatEditor.displayName = 'HyperChatEditor';

export default HyperChatEditor;