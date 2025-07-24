import React, { useState, useEffect } from "react";
import { Tree, Button, message, Dropdown, MenuProps } from "antd";
import {
  FolderOutlined,
  FileOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";
import { WorkspaceInfo, FileNode } from "../pages/workspace/types";

// FileNode 类型已移至 ../pages/workspace/types.ts

// WorkspaceInfo 类型已移至 ../pages/workspace/types.ts

interface FileTreeComponentProps {
  workspace: WorkspaceInfo;
  initialData: FileNode[];
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  onRefresh?: () => Promise<void>;
  onDataUpdate?: (data: FileNode[]) => void;
  onFileSelect?: (filePath: string, fileName: string) => void;
}

// 过滤隐藏文件的工具函数
const filterHiddenFiles = (items: FileNode[], showHidden: boolean): FileNode[] => {
  if (showHidden) return items;
  return items.filter(item => !item.isHidden);
};


// 更新树数据的工具函数（按照官方示例）
const updateTreeData = (list: any[], key: React.Key, children: any[]): any[] =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

export function FileTreeComponent({
  workspace,
  initialData,
  showHidden,
  onShowHiddenChange,
  onRefresh,
  onDataUpdate,
  onFileSelect
}: FileTreeComponentProps) {
  const [refreshing, setRefreshing] = useState(false);
  // 存储路径到文件节点的映射
  const [nodeMap, setNodeMap] = useState<Map<string, FileNode>>(new Map());
  // 右键菜单状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [rightClickedNode, setRightClickedNode] = useState<FileNode | null>(null);

  // 创建节点映射的辅助函数
  const createNodeMap = (nodes: FileNode[]): Map<string, FileNode> => {
    const map = new Map<string, FileNode>();
    const traverse = (items: FileNode[]) => {
      items.forEach(item => {
        map.set(item.path, item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(nodes);
    return map;
  };

  // 初始化树数据（过滤隐藏文件）
  const [treeData, setTreeData] = useState<any[]>([]);

  // 当初始数据或showHidden变化时更新组件状态
  useEffect(() => {
    const filteredData = filterHiddenFiles(initialData, showHidden);
    const newTreeData = filteredData.map(mapFileNodeToTreeNodeWithMenu);
    setTreeData(newTreeData);
    setNodeMap(createNodeMap(initialData)); // 使用原始数据创建映射
  }, [initialData, showHidden]);

  // 处理刷新操作
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    try {
      setRefreshing(true);
      await onRefresh();
      message.success(t`File tree refreshed successfully`);
    } catch (error) {
      console.error("Failed to refresh file tree:", error);
      message.error(t`Failed to refresh file tree`);
    } finally {
      setRefreshing(false);
    }
  };

  // 处理文件选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length === 0 || !onFileSelect) return;
    
    const selectedKey = selectedKeys[0] as string;
    const selectedNode = info.node;
    
    // 只处理文件类型的节点
    if (selectedNode.isLeaf) {
      // 从nodeMap中获取文件节点信息
      const fileNode = nodeMap.get(selectedKey);
      if (fileNode) {
        onFileSelect(selectedKey, fileNode.name);
      }
    }
  };

  // 右键菜单项点击处理
  const handleMenuClick = (action: string) => {
    if (!rightClickedNode) return;
    
    setContextMenuVisible(false);
    
    switch (action) {
      case 'copy-path':
        navigator.clipboard.writeText(rightClickedNode.path);
        message.success(t`Path copied to clipboard`);
        break;
      case 'copy-name':
        navigator.clipboard.writeText(rightClickedNode.name);
        message.success(t`File name copied to clipboard`);
        break;
      case 'open':
        if (rightClickedNode.type === 'file' && onFileSelect) {
          onFileSelect(rightClickedNode.path, rightClickedNode.name);
        }
        break;
      case 'reveal':
        // 可以在这里添加在文件管理器中显示的逻辑
        message.info(`${t`Reveal in file manager:`} ${rightClickedNode.path}`);
        break;
      default:
        break;
    }
  };

  // 创建右键菜单项
  const createContextMenu = (): MenuProps['items'] => {
    if (!rightClickedNode) return [];

    const isFile = rightClickedNode.type === 'file';
    const isDirectory = rightClickedNode.type === 'directory';

    return [
      {
        key: 'copy-path',
        icon: <CopyOutlined />,
        label: t`Copy Path`,
      },
      {
        key: 'copy-name',
        icon: <CopyOutlined />,
        label: t`Copy Name`,
      },
      ...(isFile ? [{
        key: 'open',
        icon: <FileOutlined />,
        label: t`Open File`,
      }] : []),
      ...(isDirectory ? [{
        key: 'reveal',
        icon: <FolderOpenOutlined />,
        label: t`Open in File Manager`,
      }] : []),
    ];
  };

  // 处理右键点击事件
  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setRightClickedNode(node);
    setContextMenuVisible(true);
  };

  // 将文件节点转换为树节点的函数（组件内部版本）
  const mapFileNodeToTreeNodeWithMenu = (item: FileNode) => ({
    title: (
      <span 
        style={{ opacity: item.isHidden ? 0.6 : 1 }}
        onContextMenu={(e) => handleRightClick(e, item)}
      >
        {item.name}
      </span>
    ),
    key: item.path,
    icon: item.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
    isLeaf: item.type === "file",
  });

  const onLoadData = ({ key, children }: any) =>
    new Promise<void>(async (resolve) => {
      if (children) {
        resolve();
        return;
      }

      try {
        const childrenData: FileNode[] = await call("getWorkspaceDirectoryList", {
          directoryPath: key
        });
        
        const filteredChildren = filterHiddenFiles(childrenData, showHidden);
        const treeChildren = filteredChildren.map(mapFileNodeToTreeNodeWithMenu);

        // 更新nodeMap
        setNodeMap(prevMap => {
          const newMap = new Map(prevMap);
          childrenData.forEach(child => {
            newMap.set(child.path, child);
          });
          return newMap;
        });

        setTreeData((origin) => updateTreeData(origin, key, treeChildren));
        resolve();
      } catch (error) {
        console.error("Failed to load directory children:", error);
        message.error(t`Failed to load directory contents`);
        resolve();
      }
    });

  return (
    <Dropdown
      menu={{
        items: createContextMenu(),
        onClick: ({ key }) => handleMenuClick(key),
      }}
      trigger={['contextMenu']}
      open={contextMenuVisible}
      onOpenChange={(visible) => {
        if (!visible) {
          setContextMenuVisible(false);
          setRightClickedNode(null);
        }
      }}
    >
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-xs text-gray-500">{t`Files`}</span>
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
              disabled={!onRefresh}
              title={t`Refresh file tree`}
              className="text-xs"
            />
            <Button
              type="text"
              size="small"
              icon={showHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => onShowHiddenChange(!showHidden)}
              title={showHidden ? t`Hide hidden files` : t`Show hidden files`}
              className="text-xs"
            />
          </div>
        </div>
        <Tree
          showIcon
          loadData={onLoadData}
          treeData={treeData}
          onSelect={handleSelect}
        />
      </div>
    </Dropdown>
  );
}