import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Card, Button, Space, message, Modal, Spin, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { call } from '../common/call';
import { t } from '../i18n';

const { Text } = Typography;

interface FileEditorProps {
  filePath: string;
  workspacePath: string;
  fileName: string;
  onClose: () => void;
}

// 文件扩展名到Monaco编辑器语言的映射
const getLanguageFromExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Web技术
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // 配置文件
    'json': 'json',
    'jsonc': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    
    // 标记语言
    'md': 'markdown',
    'markdown': 'markdown',
    'xml': 'xml',
    
    // 编程语言
    'py': 'python',
    'python': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'kt': 'kotlin',
    'swift': 'swift',
    'scala': 'scala',
    'r': 'r',
    'lua': 'lua',
    'pl': 'perl',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'bat': 'bat',
    'cmd': 'bat',
    
    // 数据格式
    'sql': 'sql',
    'graphql': 'graphql',
    'gql': 'graphql',
    
    // 其他
    'dockerfile': 'dockerfile',
    'Dockerfile': 'dockerfile',
    'gitignore': 'gitignore',
    'env': 'shell',
    'txt': 'plaintext',
    'log': 'plaintext',
  };
  
  return languageMap[ext || ''] || 'plaintext';
};

export function FileEditor({ filePath, workspacePath, fileName, onClose }: FileEditorProps) {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const language = getLanguageFromExtension(fileName);

  // 加载文件内容
  const loadFileContent = useCallback(async () => {
    try {
      setLoading(true);
      const fileContent = await call('readWorkspaceFile', {
        filePath
      });
      setContent(fileContent || '');
      setOriginalContent(fileContent || '');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load file:', error);
      message.error(t`Failed to load file`);
    } finally {
      setLoading(false);
    }
  }, [workspacePath, filePath]);

  // 保存文件
  const saveFile = async () => {
    try {
      setSaving(true);
      await call('writeWorkspaceFile', {
        filePath,
        content
      });
      setOriginalContent(content);
      setHasChanges(false);
      message.success(t`File saved successfully`);
    } catch (error) {
      console.error('Failed to save file:', error);
      message.error(t`Failed to save file`);
    } finally {
      setSaving(false);
    }
  };

  // 处理编辑器内容变化
  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setHasChanges(newContent !== originalContent);
  };

  // 重新加载文件
  const reloadFile = () => {
    if (hasChanges) {
      Modal.confirm({
        title: t`Unsaved Changes`,
        content: t`You have unsaved changes. Are you sure you want to reload the file?`,
        onOk: loadFileContent,
      });
    } else {
      loadFileContent();
    }
  };

  // 关闭编辑器
  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: t`Unsaved Changes`,
        content: t`You have unsaved changes. Are you sure you want to close the file?`,
        onOk: onClose,
      });
    } else {
      onClose();
    }
  };

  // 初始加载
  useEffect(() => {
    loadFileContent();
  }, [loadFileContent]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          saveFile();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasChanges, saveFile]);

  return (
    <Card
      size="small"
      className="h-full"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Text strong>{fileName}</Text>
            {hasChanges && <Text type="secondary">•</Text>}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {language}
            </Text>
          </div>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={reloadFile}
              title={t`Reload file`}
            />
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={saveFile}
              loading={saving}
              disabled={!hasChanges}
              title="Ctrl+S"
            >
              {t`Save`}
            </Button>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleClose}
              title={t`Close`}
            />
          </Space>
        </div>
      }
      styles={{ body: { padding: 0, height: 'calc(100% - 48px)' } }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : (
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            formatOnPaste: true,
            formatOnType: true,
            renderWhitespace: 'selection',
            renderControlCharacters: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            glyphMargin: true,
            folding: true,
            foldingStrategy: 'auto',
          }}
        />
      )}
    </Card>
  );
}