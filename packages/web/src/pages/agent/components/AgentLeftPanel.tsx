/**
 * Agent左侧面板组件
 * 显示Agent目录的文件树结构
 */

import React, { useState, useCallback } from 'react';
import { Card, Tree, Button, Checkbox, Space, Typography, message } from 'antd';
import { FolderOutlined, FileOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { t } from '@dadigua/hyperchat-shared';
import { AgentLeftPanelProps, FileNode } from '../types';

const { Title } = Typography;

/**
 * 将FileNode转换为Ant Design Tree所需的TreeDataNode格式
 */
const convertToTreeData = (nodes: FileNode[]): TreeDataNode[] => {
  return nodes.map(node => ({
    title: node.name,
    key: node.path,
    icon: node.type === 'directory' ? <FolderOutlined /> : <FileOutlined />,
    isLeaf: node.type === 'file',
    children: node.children ? convertToTreeData(node.children) : undefined,
    // 添加自定义数据
    data: node
  }));
};

/**
 * Agent左侧面板组件
 */
const AgentLeftPanel: React.FC<AgentLeftPanelProps> = ({
  agentPath,
  agentName,
  fileTreeData = [],
  showHidden,
  onShowHiddenChange,
  onRefreshFileTree,
  onFileSelect
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * 刷新文件树
   */
  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      await onRefreshFileTree();
      message.success(t`File tree refreshed`);
    } catch (error) {
      console.error('Refresh file tree error:', error);
      message.error(t`Failed to refresh file tree`);
    } finally {
      setLoading(false);
    }
  }, [onRefreshFileTree]);

  /**
   * 处理文件选择
   */
  const handleSelect = useCallback((selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length === 0) return;
    
    const selectedKey = selectedKeys[0] as string;
    const selectedNode = info.node;
    
    // 只处理文件选择，忽略目录
    if (selectedNode.isLeaf && selectedNode.data) {
      const fileNode = selectedNode.data as FileNode;
      onFileSelect(fileNode.path, fileNode.name);
    }
  }, [onFileSelect]);

  // 转换文件树数据
  const treeData = convertToTreeData(fileTreeData);

  return (
    <Card 
      size="small"
      title={
        <Space>
          <FolderOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {t`Agent Files`}
          </Title>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={handleRefresh}
          title={t`Refresh file tree`}
        />
      }
      bodyStyle={{ padding: '8px 12px', height: 'calc(100vh - 120px)', overflow: 'auto' }}
      style={{ height: '100%', border: 'none' }}
    >
      {/* 控制选项 */}
      <div style={{ marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            📍 {agentPath}
          </div>
          <Checkbox
            checked={showHidden}
            onChange={(e) => onShowHiddenChange(e.target.checked)}
            style={{ fontSize: '12px' }}
          >
            <EyeOutlined /> {t`Show hidden files`}
          </Checkbox>
        </Space>
      </div>

      {/* 文件树 */}
      {treeData.length > 0 ? (
        <Tree
          treeData={treeData}
          defaultExpandAll={false}
          showLine={{ showLeafIcon: false }}
          showIcon
          onSelect={handleSelect}
          height={400}
          style={{ fontSize: '13px' }}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          color: '#999', 
          padding: '40px 20px',
          fontSize: '13px'
        }}>
          {loading ? (
            <div>
              <ReloadOutlined spin />
              <div style={{ marginTop: '8px' }}>{t`Loading...`}</div>
            </div>
          ) : (
            <div>
              <FolderOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>{t`No files found`}</div>
              <Button 
                type="link" 
                size="small" 
                onClick={handleRefresh}
                style={{ padding: '4px 0' }}
              >
                {t`Refresh`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 统计信息 */}
      {treeData.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 0', 
          borderTop: '1px solid #f0f0f0',
          fontSize: '11px',
          color: '#666'
        }}>
          {t`Total items:`} {treeData.length}
        </div>
      )}
    </Card>
  );
};

export default AgentLeftPanel;