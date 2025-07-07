import React, { useState } from "react";
import { Tabs, Card, Empty, Button, Space, Badge } from "antd";
import {
  FolderOutlined,
  FileTextOutlined,
  HistoryOutlined,
  BookOutlined,
  SettingOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { FileTreeComponent } from "./FileTreeComponent";
import { t } from "../i18n";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modified: number;
  extension?: string;
  isLeaf?: boolean;
  loaded?: boolean;
  isHidden?: boolean;
}

interface WorkspaceInfo {
  path: string;
  name: string;
  isGlobal?: boolean;
}

interface WorkspaceSidebarProps {
  workspace: WorkspaceInfo;
  fileTreeData?: FileNode[];
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  onRefreshFileTree?: () => Promise<void>;
  onFileSelect?: (filePath: string, fileName: string) => void;
  className?: string;
}

interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  type: 'file' | 'chat' | 'task';
  path?: string;
}

// 模拟待办事项数据
const mockTodos: TodoItem[] = [
  { id: '1', content: '完成登录功能', completed: false, priority: 'high' },
  { id: '2', content: '优化界面样式', completed: true, priority: 'medium' },
  { id: '3', content: '添加单元测试', completed: false, priority: 'low' },
];

// 模拟历史记录数据
const mockHistory: HistoryItem[] = [
  { id: '1', title: 'App.tsx', timestamp: Date.now() - 3600000, type: 'file', path: '/src/App.tsx' },
  { id: '2', title: '聊天记录', timestamp: Date.now() - 7200000, type: 'chat' },
  { id: '3', title: '任务执行', timestamp: Date.now() - 10800000, type: 'task' },
];

export function WorkspaceSidebar({
  workspace,
  fileTreeData,
  showHidden,
  onShowHiddenChange,
  onRefreshFileTree,
  onFileSelect,
  className = ""
}: WorkspaceSidebarProps) {
  const [activeTab, setActiveTab] = useState("files");
  const [todos, setTodos] = useState<TodoItem[]>(mockTodos);
  const [history] = useState<HistoryItem[]>(mockHistory);

  // 获取活动待办事项数量
  const getActiveTodosCount = () => {
    return todos.filter(todo => !todo.completed).length;
  };

  // 切换待办事项状态
  const toggleTodo = (id: string) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours} ${t`hours ago`}`;
    }
    return `${minutes} ${t`minutes ago`}`;
  };

  // 获取历史记录图标
  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileTextOutlined />;
      case 'chat':
        return <BellOutlined />;
      case 'task':
        return <SettingOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  // 渲染文件树标签页
  const renderFileTree = () => {
    if (!fileTreeData) {
      return (
        <Empty
          description={t`No file tree data`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: '20%' }}
        />
      );
    }

    return (
      <FileTreeComponent
        workspace={workspace}
        initialData={fileTreeData}
        showHidden={showHidden}
        onShowHiddenChange={onShowHiddenChange}
        onRefresh={onRefreshFileTree}
        onFileSelect={onFileSelect}
      />
    );
  };

  // 渲染待办事项标签页
  const renderTodos = () => {
    return (
      <div className="p-2">
        <div className="space-y-2">
          {todos.map(todo => (
            <div
              key={todo.id}
              className={`p-2 rounded border cursor-pointer transition-colors ${
                todo.completed ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => toggleTodo(todo.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="rounded"
                  />
                  <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                    {todo.content}
                  </span>
                </div>
                <Badge
                  color={
                    todo.priority === 'high' ? 'red' :
                    todo.priority === 'medium' ? 'orange' : 'green'
                  }
                  text={
                    todo.priority === 'high' ? t`High` :
                    todo.priority === 'medium' ? t`Medium` : t`Low`
                  }
                />
              </div>
            </div>
          ))}
        </div>
        {todos.length === 0 && (
          <Empty
            description={t`No todos yet`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '20%' }}
          />
        )}
      </div>
    );
  };

  // 渲染历史记录标签页
  const renderHistory = () => {
    return (
      <div className="p-2">
        <div className="space-y-2">
          {history.map(item => (
            <div
              key={item.id}
              className="p-2 rounded border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2">
                {getHistoryIcon(item.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{formatTime(item.timestamp)}</div>
                  {item.path && (
                    <div className="text-xs text-gray-400 truncate">{item.path}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {history.length === 0 && (
          <Empty
            description={t`No history yet`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '20%' }}
          />
        )}
      </div>
    );
  };

  // 渲染书签标签页
  const renderBookmarks = () => {
    return (
      <div className="p-2">
        <Empty
          description={t`No bookmarks yet`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: '20%' }}
        >
          <Button type="primary" size="small">
            {t`Add Bookmark`}
          </Button>
        </Empty>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'files',
      label: (
        <Space>
          <FolderOutlined />
          <span>{t`Files`}</span>
        </Space>
      ),
      children: renderFileTree(),
    },
    {
      key: 'todos',
      label: (
        <Space>
          <FileTextOutlined />
          <span>{t`Todos`}</span>
          {getActiveTodosCount() > 0 && (
            <Badge count={getActiveTodosCount()} size="small" />
          )}
        </Space>
      ),
      children: renderTodos(),
    },
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          <span>{t`History`}</span>
        </Space>
      ),
      children: renderHistory(),
    },
    {
      key: 'bookmarks',
      label: (
        <Space>
          <BookOutlined />
          <span>{t`Bookmarks`}</span>
        </Space>
      ),
      children: renderBookmarks(),
    },
  ];

  return (
    <Card
      title={t`Workspace View`}
      size="small"
      className={`h-full ${className}`}
      bodyStyle={{ padding: 0, height: 'calc(100% - 48px)' }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        items={tabItems}
        tabBarStyle={{ 
          margin: '0 8px',
          borderBottom: '1px solid #f0f0f0'
        }}
      />
    </Card>
  );
}