import React, { useState, useEffect } from "react";
import {
  Modal,
  Tree,
  Button,
  Input,
  Space,
  message,
  Spin,
  Empty,
  Typography,
  Alert,
} from "antd";
import {
  FolderOutlined,
  FileOutlined,
  HomeOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";

const { Text } = Typography;

interface ServerDirectoryNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: ServerDirectoryNode[];
  loaded?: boolean;
}

interface ServerDirectoryBrowserProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  title?: string;
  initialPath?: string;
}

/**
 * 服务器端目录浏览器组件
 * 类似 VS Code Web 版本的目录选择功能
 */
export function ServerDirectoryBrowser({
  visible,
  onClose,
  onSelect,
  title = "选择服务器目录",
  initialPath = "~",
}: ServerDirectoryBrowserProps) {
  const [treeData, setTreeData] = useState<ServerDirectoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);

  // 加载目录内容
  const loadDirectory = async (path: string): Promise<ServerDirectoryNode[]> => {
    try {
      const result = await call("listServerDirectory", { path });
      return result.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        loaded: item.type === "file",
        children: item.type === "directory" ? [] : undefined,
      }));
    } catch (error) {
      console.error("Failed to load directory:", error);
      message.error(`加载目录失败: ${path}`);
      return [];
    }
  };

  // 初始化加载根目录
  const initializeTree = async () => {
    setLoading(true);
    try {
      const homeDir = await loadDirectory(currentPath);
      setTreeData(homeDir);
      if (homeDir.length > 0) {
        setExpandedKeys([homeDir[0].path]);
      }
    } catch (error) {
      console.error("Failed to initialize tree:", error);
    } finally {
      setLoading(false);
    }
  };

  // 懒加载子目录
  const loadChildren = async (node: ServerDirectoryNode): Promise<ServerDirectoryNode[]> => {
    if (node.type === "file" || node.loaded) {
      return node.children || [];
    }

    try {
      const children = await loadDirectory(node.path);
      return children;
    } catch (error) {
      console.error("Failed to load children:", error);
      return [];
    }
  };

  // 更新树节点
  const updateTreeData = (
    data: ServerDirectoryNode[],
    key: string,
    children: ServerDirectoryNode[]
  ): ServerDirectoryNode[] => {
    return data.map((node) => {
      if (node.path === key) {
        return {
          ...node,
          children,
          loaded: true,
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
  };

  // 处理目录展开
  const handleExpand = async (expandedKeys: React.Key[], info: any) => {
    setExpandedKeys(expandedKeys as string[]);
    
    if (info.expanded && info.node.type === "directory" && !info.node.loaded) {
      const children = await loadChildren(info.node);
      setTreeData((prevData) => updateTreeData(prevData, info.node.path, children));
    }
  };

  // 处理目录选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node.type === "directory") {
      setSelectedPath(info.node.path);
    }
  };

  // 转换为 Tree 组件需要的格式
  const convertToTreeData = (nodes: ServerDirectoryNode[]): any[] => {
    return nodes.map((node) => ({
      title: (
        <Space>
          {node.type === "directory" ? <FolderOutlined /> : <FileOutlined />}
          <Text>{node.name}</Text>
        </Space>
      ),
      key: node.path,
      type: node.type,
      isLeaf: node.type === "file",
      children: node.children ? convertToTreeData(node.children) : undefined,
    }));
  };

  // 导航到父目录
  const navigateToParent = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    setCurrentPath(parentPath);
    await initializeTree();
  };

  // 导航到主目录
  const navigateToHome = async () => {
    setCurrentPath("~");
    await initializeTree();
  };

  // 刷新当前目录
  const refreshCurrentDirectory = async () => {
    await initializeTree();
  };

  // 确认选择
  const handleConfirm = () => {
    if (!selectedPath) {
      message.warning("请选择一个目录");
      return;
    }
    onSelect(selectedPath);
    onClose();
  };

  // 当对话框打开时初始化
  useEffect(() => {
    if (visible) {
      initializeTree();
    }
  }, [visible, currentPath]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确认选择
        </Button>,
      ]}
    >
      <div className="server-directory-browser">
        {/* 工具栏 */}
        <div className="mb-4">
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={navigateToHome}
              size="small"
            >
              主目录
            </Button>
            <Button
              icon={<FolderOpenOutlined />}
              onClick={navigateToParent}
              size="small"
              disabled={currentPath === "/" || currentPath === "~"}
            >
              上级目录
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshCurrentDirectory}
              size="small"
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 当前路径显示 */}
        <div className="mb-4">
          <Input
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onPressEnter={initializeTree}
            placeholder="输入路径..."
            addonBefore="当前路径:"
          />
        </div>

        {/* 选择的路径显示 */}
        {selectedPath && (
          <Alert
            message={`已选择: ${selectedPath}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 目录树 */}
        <div className="directory-tree" style={{ height: 400, overflow: "auto" }}>
          <Spin spinning={loading}>
            {treeData.length > 0 ? (
              <Tree
                showIcon
                treeData={convertToTreeData(treeData)}
                expandedKeys={expandedKeys}
                onExpand={handleExpand}
                onSelect={handleSelect}
                loadData={async (node: any) => {
                  if (node.type === "directory" && !node.loaded) {
                    const children = await loadChildren({
                      name: node.title.props.children[1].props.children,
                      path: node.key,
                      type: "directory",
                    });
                    setTreeData((prevData) => updateTreeData(prevData, node.key, children));
                  }
                }}
              />
            ) : (
              <Empty
                description="目录为空或无法访问"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Spin>
        </div>
      </div>
    </Modal>
  );
}

export default ServerDirectoryBrowser;