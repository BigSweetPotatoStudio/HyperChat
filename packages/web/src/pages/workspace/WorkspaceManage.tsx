import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Button,
  Space,
  Tag,
  message,
  Empty,
  Form,
  Drawer
} from 'antd';
import {
  FolderOpenOutlined,
  GlobalOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { call } from '../../common/call';
import { t } from '../../i18n';
import { getWorkspaceHistory, addToWorkspaceHistory } from '../../utils/storage';
import { Workspace } from './workspace';
import { WorkspaceOpenModal } from './WorkspaceOpenForm';
import { ServerDirectoryBrowser } from '../../components/ServerDirectoryBrowser';
import { AppHeader } from '../../components/AppHeader';
import { AppActions } from '../../components/AppActions';
import { AppSettings } from '../../components/AppSettings';
import { ProviderSettings } from '../../components/ProviderSettings';
import { MCPGatewaysSettings } from '../../components/MCPGatewaysSettings';
import { AppSettingsSchema, MCPGatewaySchema } from '@dadigua/hyperchat-shared';
import type { z } from 'zod';
import { useForceUpdate } from '../../hooks/useForceUpdate';

interface WorkspaceTab {
  key: string;
  path: string;
  name: string;
  isGlobal: boolean;
  closable: boolean;
}

interface WorkspaceHistoryItem {
  path: string;
  name: string;
  lastUsed: number;
}

export interface WorkspaceManageProps {
  // 这个组件现在是顶层组件，不需要额外的 props
}

export const WorkspaceManage: React.FC<WorkspaceManageProps> = () => {
  const refresh = useForceUpdate();
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [globalWorkspacePath, setGlobalWorkspacePath] = useState<string>('');

  // 模态框状态
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [workspaceHistory, setWorkspaceHistory] = useState<WorkspaceHistoryItem[]>([]);
  const [form] = Form.useForm();
  const [switching, setSwitching] = useState(false);

  // 应用设置状态
  const [appSettings, setAppSettings] = useState<z.infer<typeof AppSettingsSchema> | null>(null);
  const [drawerStates, setDrawerStates] = useState({
    modelConfig: false,
    appSettings: false,
    mcpGateways: false,
  });

  // 加载全局工作区路径
  const loadGlobalWorkspacePath = async () => {
    try {
      const path = await call("getGlobalWorkspacePath");
      setGlobalWorkspacePath(path);
    } catch (error) {
      console.error("Failed to load global workspace path:", error);
    }
  };

  // 加载当前工作区并创建初始标签页
  const loadCurrentWorkspace = async () => {
    try {
      const currentWorkspaceData = await call("getCurrentWorkspace");
      if (currentWorkspaceData) {
        const workspaceTab: WorkspaceTab = {
          key: currentWorkspaceData.path,
          path: currentWorkspaceData.path,
          name: currentWorkspaceData.name || (currentWorkspaceData.isGlobal ? t`Global Workspace` : 'Workspace'),
          isGlobal: currentWorkspaceData.isGlobal || false,
          closable: !currentWorkspaceData.isGlobal // 全局工作区不可关闭
        };

        setWorkspaceTabs([workspaceTab]);
        setActiveTabKey(workspaceTab.key);
      }
    } catch (error) {
      console.error("Failed to load current workspace:", error);
      message.error(t`Failed to load current workspace`);
    }
  };

  // 加载工作区历史记录
  const loadHistory = () => {
    setWorkspaceHistory(getWorkspaceHistory());
  };

  useEffect(() => {
    loadGlobalWorkspacePath();
    loadCurrentWorkspace();
    loadHistory();
  }, []);

  // 获取工作区名称
  const getWorkspaceName = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  // 添加新的工作区标签页
  const addWorkspaceTab = useCallback(async (workspacePath: string) => {
    // 检查是否已经存在该工作区的标签页
    const existingTab = workspaceTabs.find(tab => tab.path === workspacePath);
    if (existingTab) {
      setActiveTabKey(existingTab.key);
      message.info(t`Workspace is already open`);
      return;
    }

    try {
      // 切换到新工作区以加载其信息
      await call("switchWorkspace", { workspacePath, force: false });
      const workspaceData = await call("getCurrentWorkspace");

      if (workspaceData) {
        const newTab: WorkspaceTab = {
          key: workspaceData.path,
          path: workspaceData.path,
          name: workspaceData.name || getWorkspaceName(workspaceData.path),
          isGlobal: workspaceData.isGlobal || false,
          closable: true
        };

        setWorkspaceTabs(prev => [...prev, newTab]);
        setActiveTabKey(newTab.key);

        // 添加到历史记录
        addToWorkspaceHistory(workspacePath, newTab.name);
        loadHistory();

        message.success(t`Workspace added to new tab`);
      }
    } catch (error) {
      console.error("Failed to add workspace tab:", error);
      message.error(t`Failed to add workspace tab`);
    }
  }, [workspaceTabs]);

  // 打开新工作区
  const openWorkspace = async (values: { path: string }) => {
    setSwitching(true);
    try {
      await addWorkspaceTab(values.path);
      setOpenModalOpen(false);
      form.resetFields();
      setSelectedPath("");
    } catch (error) {
      console.error("Failed to open workspace:", error);
      message.error(t`Failed to open workspace`);
    } finally {
      setSwitching(false);
    }
  };

  // 选择服务器目录
  const handleServerDirectorySelect = async (path: string) => {
    try {
      form.setFieldsValue({ path });
      setSelectedPath(path);

      // 检查是否已经是工作区
      const isWorkspace = await call("isWorkspaceDirectory", { directoryPath: path });
      if (isWorkspace) {
        message.warning(t`This directory is already a workspace`);
      }

      setDirectoryBrowserOpen(false);
    } catch (error) {
      console.error("Failed to process selected directory:", error);
      message.error(t`Failed to process selected directory`);
    }
  };

  // 处理应用设置
  const handleAppSettings = async () => {
    try {
      // 加载应用设置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setDrawerStates(prev => ({ ...prev, appSettings: true }));
    } catch (error) {
      console.error("Failed to load app settings:", error);
      message.error(t`Failed to load app settings`);
    }
  };

  // 更新应用设置
  const updateAppSettings = async (updates: Partial<z.infer<typeof AppSettingsSchema>>) => {
    try {
      const updatedSettings = await call("updateAppSettings", {
        updates
      });
      setAppSettings(updatedSettings);
      message.success(t`App settings updated successfully`);

      // 如果更改了主题设置，应用到界面
      if (updates.appearance?.darkTheme !== undefined) {
        const darkReader = await import('darkreader');
        if (updates.appearance.darkTheme) {
          darkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10,
          });
        } else {
          darkReader.disable();
        }
      }
    } catch (error) {
      console.error("Failed to update app settings:", error);
      message.error(t`Failed to update app settings`);
    }
  };

  // 处理 MCP Gateways 设置
  const handleMCPGateways = async () => {
    try {
      // 加载应用设置以获取当前的 MCP Gateways 配置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setDrawerStates(prev => ({ ...prev, mcpGateways: true }));
    } catch (error) {
      console.error("Failed to load MCP gateways:", error);
      message.error(t`Failed to load MCP gateways`);
    }
  };

  // 更新 MCP Gateways 配置
  const updateMCPGateways = async (gateways: z.infer<typeof MCPGatewaySchema>[]) => {
    try {
      const updates = { mcpGateWays: gateways };
      await updateAppSettings(updates);

      // 刷新 MCP 路由以应用新的网关配置
      try {
        await call("refreshMcpRoutes");
        console.log('MCP routes refreshed successfully');
      } catch (routeError) {
        console.warn('Failed to refresh MCP routes, but settings were saved:', routeError);
        // 不阻止设置保存，只是警告路由刷新失败
      }

      message.success(t`MCP Gateways updated successfully`);
    } catch (error) {
      console.error("Failed to update MCP gateways:", error);
      message.error(t`Failed to update MCP gateways`);
    }
  };

  // 处理标签页切换
  const handleTabChange = async (activeKey: string) => {
    const targetTab = workspaceTabs.find(tab => tab.key === activeKey);
    if (targetTab) {
      try {
        // 切换到目标工作区
        await call("switchWorkspace", { workspacePath: targetTab.path, force: false });
        setActiveTabKey(activeKey);
      } catch (error) {
        console.error("Failed to switch workspace:", error);
        message.error(t`Failed to switch workspace`);
      }
    }
  };

  // 处理标签页编辑（添加/删除）
  const handleTabEdit = (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (action === 'add') {
      setOpenModalOpen(true);
    } else if (action === 'remove' && typeof targetKey === 'string') {
      const tabToRemove = workspaceTabs.find(tab => tab.key === targetKey);
      if (tabToRemove && !tabToRemove.closable) {
        message.warning(t`Cannot close global workspace`);
        return;
      }

      const newTabs = workspaceTabs.filter(tab => tab.key !== targetKey);
      setWorkspaceTabs(newTabs);

      // 如果关闭的是当前活动标签页，切换到其他标签页
      if (activeTabKey === targetKey) {
        const remainingTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
        if (remainingTab) {
          handleTabChange(remainingTab.key);
        } else {
          setActiveTabKey('');
        }
      }
    }
  };

  // 渲染工作区标签页标签
  const renderWorkspaceLabel = (tab: WorkspaceTab) => {
    return (
      <Space>
        {tab.isGlobal ? <GlobalOutlined /> : <FolderOpenOutlined />}
        <div style={{ textAlign: 'left' }}>
          <div>{tab.name}</div>
          <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
            {tab.path}
          </div>
        </div>
        {tab.isGlobal && <Tag color="blue">{t`Global`}</Tag>}
      </Space>
    );
  };

  // 生成标签页items
  const getTabItems = () => {
    return workspaceTabs.map(tab => ({
      key: tab.key,
      label: renderWorkspaceLabel(tab),
      closable: tab.closable,
      children: <Workspace key={tab.key} workspacePath={tab.path} />
    }));
  };

  return (
    <div className="workspace-manage h-full">
      <div className="h-full">
        <div style={{ height: '100%', padding: '0px' }}>
          {/* 应用头部和操作按钮
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <AppHeader />
            <AppActions
              onAIProviderClick={() => setDrawerStates(prev => ({ ...prev, modelConfig: true }))}
              onRefresh={refresh}
              onAppSettingsClick={handleAppSettings}
              onMCPGatewaysClick={handleMCPGateways}
            />
          </div> */}

          {/* 工作区标签页或空状态 */}
          <div style={{ height: 'calc(100% - 57px)' }}>
            {workspaceTabs.length > 0 ? (
              <Tabs
                tabBarExtraContent={{
                  left: <AppHeader />,
                  right: (
                    <AppActions
                      onAIProviderClick={() => setDrawerStates(prev => ({ ...prev, modelConfig: true }))}
                      onRefresh={refresh}
                      onAppSettingsClick={handleAppSettings}
                      onMCPGatewaysClick={handleMCPGateways}
                    />
                  )
                }}
                className="myFullTabs"
                type="editable-card"
                activeKey={activeTabKey}
                onChange={handleTabChange}
                onEdit={handleTabEdit}
                style={{ height: '100%' }}
                tabBarStyle={{
                  marginBottom: 8,
                  padding: '0 8px'
                }}
                tabBarGutter={16}
                centered={true}
                addIcon={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <PlusOutlined />
                    <span style={{ fontSize: '12px' }}>{t`Add`}</span>
                  </div>
                }
                items={getTabItems()}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Empty
                  description={t`No workspace loaded`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={() => setOpenModalOpen(true)}>
                    {t`Open Workspace`}
                  </Button>
                </Empty>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 工作区打开模态框 */}
      <WorkspaceOpenModal
        open={openModalOpen}
        onCreate={openWorkspace}
        onCancel={() => {
          setOpenModalOpen(false);
          form.resetFields();
          setSelectedPath("");
        }}
        selectedPath={selectedPath}
        onDirectoryBrowserOpen={() => setDirectoryBrowserOpen(true)}
        globalWorkspacePath={globalWorkspacePath}
        workspaceHistory={workspaceHistory}
        onPathSelect={setSelectedPath}
        onHistoryRemove={(path) => {
          const updatedHistory = workspaceHistory.filter(item => item.path !== path);
          setWorkspaceHistory(updatedHistory);
        }}
        switching={switching}
      />

      {/* 服务器目录浏览器 */}
      <ServerDirectoryBrowser
        visible={directoryBrowserOpen}
        onClose={() => setDirectoryBrowserOpen(false)}
        onSelect={handleServerDirectorySelect}
        title={t`Select Workspace Directory`}
        initialPath="~"
      />

      {/* 应用设置抽屉 */}
      <Drawer
        width={800}
        title={t`Application Settings`}
        open={drawerStates.appSettings}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, appSettings: false }));
          setAppSettings(null);
        }}
      >
        {appSettings && (
          <AppSettings
            settings={appSettings}
            onUpdate={updateAppSettings}
            onReset={async () => {
              try {
                const resetSettings = await call("resetAppSettings");
                setAppSettings(resetSettings);
              } catch (error) {
                console.error("Failed to reset app settings:", error);
                message.error(t`Failed to reset app settings`);
              }
            }}
          />
        )}
      </Drawer>

      {/* AI 提供商设置抽屉 */}
      <Drawer
        width={1000}
        title={t`AI Provider Settings`}
        open={drawerStates.modelConfig}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, modelConfig: false }));
        }}
        styles={{
          body: {
            padding: 0,
          }
        }}
      >
        <ProviderSettings />
      </Drawer>

      {/* MCP Gateways 设置抽屉 */}
      <Drawer
        width={800}
        title={t`MCP Gateways Settings`}
        open={drawerStates.mcpGateways}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, mcpGateways: false }));
          setAppSettings(null);
        }}
      >
        {appSettings && (
          <MCPGatewaysSettings
            gateways={(appSettings.mcpGateWays?.filter(gateway =>
              gateway.name && typeof gateway.name === 'string'
            ) || []) as Array<{
              name: string;
              description?: string;
              allowMCPs: string[];
              blockMCPTools: string[];
            }>}
            onUpdate={updateMCPGateways}
            availableMCPs={[]} // TODO: 获取可用的 MCP 列表
            mcpClients={[]} // TODO: 获取 MCP 客户端列表
          />
        )}
      </Drawer>
    </div>
  );
};