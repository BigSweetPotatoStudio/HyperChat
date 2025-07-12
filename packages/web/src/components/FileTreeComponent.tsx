import React, { useState, useEffect } from "react";
import { Tree, Button, message } from "antd";
import {
  FolderOutlined,
  FileOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
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

// 将文件节点转换为树节点的函数
const mapFileNodeToTreeNode = (item: FileNode) => ({
  title: (
    <span style={{ opacity: item.isHidden ? 0.6 : 1 }}>
      {item.name}
    </span>
  ),
  key: item.path,
  icon: item.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
  isLeaf: item.type === "file",
});

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
  const [treeData, setTreeData] = useState(() => {
    const filteredData = filterHiddenFiles(initialData, showHidden);
    return filteredData.map(mapFileNodeToTreeNode);
  });

  // 当初始数据或showHidden变化时更新组件状态
  useEffect(() => {
    const filteredData = filterHiddenFiles(initialData, showHidden);
    const newTreeData = filteredData.map(mapFileNodeToTreeNode);
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
        const treeChildren = filteredChildren.map(mapFileNodeToTreeNode);

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
  );
}