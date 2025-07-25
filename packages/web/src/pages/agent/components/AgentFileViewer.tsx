/**
 * Agent文件查看器组件
 * 用于查看Agent目录中的文件内容
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Typography, message, Spin, Alert } from 'antd';
import { 
  FileOutlined, 
  ReloadOutlined, 
  DownloadOutlined,
  EditOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { call } from '../../../common/call';
import { Editor } from '@monaco-editor/react';

const { Title, Text } = Typography;

interface AgentFileViewerProps {
  filePath: string;
  fileName: string;
  agentPath: string;
}

interface FileContent {
  content: string;
  encoding: string;
  size: number;
  mimeType: string;
  isText: boolean;
  lastModified: number;
}

/**
 * Agent文件查看器组件
 */
const AgentFileViewer: React.FC<AgentFileViewerProps> = ({
  filePath,
  fileName,
  agentPath
}) => {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorLanguage, setEditorLanguage] = useState<string>('text');

  /**
   * 根据文件扩展名获取编辑器语言
   */
  const getEditorLanguage = useCallback((filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'markdown': 'markdown',
      'sql': 'sql',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'gitignore': 'shell'
    };
    
    return languageMap[ext] || 'text';
  }, []);

  /**
   * 加载文件内容
   */
  const loadFileContent = useCallback(async () => {
    if (!filePath) return;

    try {
      setLoading(true);
      setError(null);

      const response = await call('readFile', {
        path: filePath
      });

      if (typeof response === 'string') {
        setFileContent({
          content: response,
          encoding: 'utf-8'
        });
        setEditorLanguage(getEditorLanguage(fileName));
      } else {
        setError(t`Failed to load file`);
      }
    } catch (err) {
      console.error('Load file error:', err);
      setError(err instanceof Error ? err.message : t`Unknown error`);
    } finally {
      setLoading(false);
    }
  }, [filePath, agentPath, fileName, getEditorLanguage]);

  /**
   * 复制文件内容
   */
  const copyContent = useCallback(async () => {
    if (!fileContent) return;

    try {
      await navigator.clipboard.writeText(fileContent.content);
      message.success(t`Content copied to clipboard`);
    } catch (error) {
      console.error('Copy error:', error);
      message.error(t`Failed to copy content`);
    }
  }, [fileContent]);

  /**
   * 下载文件
   */
  const downloadFile = useCallback(() => {
    if (!fileContent) return;

    try {
      const blob = new Blob([fileContent.content], { 
        type: fileContent.mimeType || 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success(t`File downloaded`);
    } catch (error) {
      console.error('Download error:', error);
      message.error(t`Failed to download file`);
    }
  }, [fileContent, fileName]);

  /**
   * 格式化文件大小
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 初始化加载
  useEffect(() => {
    loadFileContent();
  }, [loadFileContent]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 文件信息头部 */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <FileOutlined />
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {fileName}
              </Title>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {filePath}
              </Text>
            </div>
          </Space>
          
          <Space>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadFileContent}
              loading={loading}
              title={t`Refresh`}
            />
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={copyContent}
              disabled={!fileContent}
              title={t`Copy content`}
            />
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={downloadFile}
              disabled={!fileContent}
              title={t`Download file`}
            />
          </Space>
        </Space>

        {/* 文件信息 */}
        {fileContent && (
          <div style={{ 
            marginTop: '8px',
            fontSize: '11px',
            color: '#666'
          }}>
            <Space size={16}>
              <span>📏 {formatFileSize(fileContent.size)}</span>
              <span>📅 {new Date(fileContent.lastModified).toLocaleString()}</span>
              <span>🔤 {fileContent.encoding}</span>
              <span>📄 {fileContent.mimeType}</span>
            </Space>
          </div>
        )}
      </div>

      {/* 文件内容 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <Spin size="large" tip={t`Loading file...`} />
          </div>
        ) : error ? (
          <div style={{ padding: '24px' }}>
            <Alert
              message={t`Failed to load file`}
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={loadFileContent}>
                  {t`Retry`}
                </Button>
              }
            />
          </div>
        ) : fileContent ? (
          fileContent.isText ? (
            <Editor
              height="100%"
              language={editorLanguage}
              value={fileContent.content}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                theme: 'vs-light'
              }}
            />
          ) : (
            <div style={{ 
              padding: '40px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <FileOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
              <Title level={4} type="secondary">
                {t`Binary file`}
              </Title>
              <Text type="secondary">
                {t`This file cannot be displayed as text`}
              </Text>
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={downloadFile}
                >
                  {t`Download to view`}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div style={{ 
            padding: '40px',
            textAlign: 'center',
            color: '#999'
          }}>
            <FileOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>{t`No file selected`}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFileViewer;