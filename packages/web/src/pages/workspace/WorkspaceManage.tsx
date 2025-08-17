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
import { AppSettingsSchema } from '@dadigua/hyperchat-shared';
import type { z } from 'zod';
import { useForceUpdate } from '../../hooks/useForceUpdate';

interface WorkspaceTab {
  key: string;
  path: string;
  name: string;
  isGlobal: boolean;
  closable: boolean;
  isPrimary: boolean;
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
  const [adding, setAdding] = useState(false);

  // 应用设置状态
  const [appSettings, setAppSettings] = useState<z.infer<typeof AppSettingsSchema> | null>(null);
  const [drawerStates, setDrawerStates] = useState({
    modelConfig: false,
    appSettings: false,
  });

  // 加载全局工作区路径
  const loadGlobalWorkspacePath = async () => {
    try {
      const path = await call("getGlobalWorkspacePath");
      setGlobalWorkspacePath(path);
    } catch (error) {
      console.error("Failed to load default workspace path:", error);
    }
  };

  // 加载初始工作区（先检查现有工作区列表）
  const loadInitialWorkspace = async () => {
    try {
      // 首先获取所有已加载的工作区列表
      const existingWorkspaces = await call("getAllWorkspaces");

      if (existingWorkspaces && existingWorkspaces.length > 0) {
        // 如果已有工作区，加载它们作为标签页
        const loadedTabs: WorkspaceTab[] = [];

        for (const workspaceInfo of existingWorkspaces) {
          const workspaceData = await call("getWorkspaceInfo", {
            workspacePath: workspaceInfo.path
          } as any);

          if (workspaceData) {
            const newTab: WorkspaceTab = {
              key: workspaceData.path,
              path: workspaceData.path,
              name: workspaceData.name,
              isGlobal: workspaceData.isGlobal,
              closable: workspaceInfo.isPrimary ? false : true,
              isPrimary: workspaceInfo.isPrimary || false
            };

            loadedTabs.push(newTab);
          }
        }

        // 一次性设置所有标签页
        if (loadedTabs.length > 0) {
          setWorkspaceTabs(loadedTabs);
          setActiveTabKey(loadedTabs[0].key);
        }
      } else if (globalWorkspacePath) {
        // 如果没有现有工作区，则初始化全局工作区
        await addWorkspaceTab(globalWorkspacePath);
      }
    } catch (error) {
      console.error("Failed to load initial workspace:", error);
      // 如果加载失败，尝试加载全局工作区作为后备
      if (globalWorkspacePath) {
        try {
          await addWorkspaceTab(globalWorkspacePath);
        } catch (fallbackError) {
          console.error("Failed to load fallback default workspace:", fallbackError);
          // 最终失败时不显示错误，让用户手动添加工作区
        }
      }
    }
  };

  // 加载工作区历史记录
  const loadHistory = () => {
    setWorkspaceHistory(getWorkspaceHistory());
  };

  useEffect(() => {
    const initializeApp = async () => {
      await loadGlobalWorkspacePath();
      loadHistory();
    };

    initializeApp();
  }, []);

  // 当全局工作区路径加载完成且还没有标签页时，加载初始工作区
  useEffect(() => {
    if (globalWorkspacePath && workspaceTabs.length === 0) {
      loadInitialWorkspace();
    }
  }, [globalWorkspacePath]);


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
      // 使用新的 addWorkspace 命令添加工作区到管理器
      const workspaceData = await call("addWorkspace", {
        workspacePath,
        forceCreate: false
      });

      if (workspaceData) {
        const newTab: WorkspaceTab = {
          key: workspaceData.path,
          path: workspaceData.path,
          name: workspaceData.name,
          isGlobal: workspaceData.isGlobal,
          closable: true, // 默认工作区不可关闭,
          isPrimary: workspaceData.isPrimary || false,
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

      // 如果工作区不存在，尝试强制创建
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('不是有效的工作区目录') || errorMessage.includes('工作区不存在')) {
        try {
          const workspaceData = await call("addWorkspace", {
            workspacePath,
            forceCreate: true
          });

          if (workspaceData) {
            const newTab: WorkspaceTab = {
              key: workspaceData.path,
              path: workspaceData.path,
              name: workspaceData.name,
              isGlobal: workspaceData.isGlobal,
              closable: true, // 默认工作区不可关闭,
              isPrimary: workspaceData.isPrimary || false,
            };

            setWorkspaceTabs(prev => [...prev, newTab]);
            setActiveTabKey(newTab.key);

            // 添加到历史记录
            addToWorkspaceHistory(workspacePath, newTab.name);
            loadHistory();

            message.success(t`Workspace created and added to new tab`);
          }
        } catch (createError) {
          console.error("Failed to create workspace:", createError);
          message.error(t`Failed to create workspace`);
        }
      } else {
        message.error(t`Failed to add workspace tab`);
      }
    }
  }, [workspaceTabs]);

  // 打开新工作区
  const openWorkspace = async (values: { path: string }) => {
    setAdding(true);
    try {
      await addWorkspaceTab(values.path);
      setOpenModalOpen(false);
      form.resetFields();
      setSelectedPath("");
    } catch (error) {
      console.error("Failed to open workspace:", error);
      message.error(t`Failed to open workspace`);
    } finally {
      setAdding(false);
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


  // 处理标签页切换
  const handleTabChange = async (activeKey: string) => {
    // 在多工作区架构中，标签页切换只需要更新UI状态
    // 每个 Workspace 组件会通过 workspacePath prop 自动加载对应的工作区数据
    setActiveTabKey(activeKey);
  };

  // 处理标签页编辑（添加/删除）
  const handleTabEdit = async (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (action === 'add') {
      setOpenModalOpen(true);
    } else if (action === 'remove' && typeof targetKey === 'string') {
      const tabToRemove = workspaceTabs.find(tab => tab.key === targetKey);
      if (tabToRemove && !tabToRemove.closable) {
        message.warning(t`Cannot close default workspace`);
        return;
      }

      try {
        // 通知后端卸载工作区
        await call("removeWorkspace", {
          workspacePath: targetKey
        });

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

        message.success(t`Workspace removed successfully`);
      } catch (error) {
        console.error("Failed to remove workspace:", error);
        message.error(t`Failed to remove workspace`);
      }
    }
  };

  // 渲染工作区标签页标签
  const renderWorkspaceLabel = (tab: WorkspaceTab) => {
    return (
      <Space>
        {tab.isPrimary ? <GlobalOutlined /> : <FolderOpenOutlined />}
        <div style={{ textAlign: 'left' }}>
          <div>{tab.name}</div>
          <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
            {tab.path}
          </div>
        </div>
        {tab.isPrimary && <Tag color="blue">{t`Default`}</Tag>}
      </Space>
    );
  };

  // 生成标签页items
  const getTabItems = () => {
    return workspaceTabs.map(tab => ({
      key: tab.key,
      label: renderWorkspaceLabel(tab),
      closable: tab.closable,
      children: <Workspace key={tab.key} workspacePath={tab.path} isPrimary={tab.isPrimary} />
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
          <div>
            {workspaceTabs.length > 0 ? (
              <Tabs
                tabBarExtraContent={{
                  left: <AppHeader />,
                  right: (
                    <AppActions
                      onAIProviderClick={() => setDrawerStates(prev => ({ ...prev, modelConfig: true }))}
                      onRefresh={refresh}
                      onAppSettingsClick={handleAppSettings}
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
        adding={adding}
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

    </div>
  );
};