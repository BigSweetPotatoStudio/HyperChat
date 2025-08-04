import React, { useState, useEffect, useRef } from "react";
import {
  message,
  Splitter,
  Empty,
} from "antd";
import { call } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t } from "../../i18n";
import { MCPManagementRef } from "../../components/MCPManagement";
import { AgentManagementRef } from "../../components/AgentManagement";
// WorkspaceLeftPanel removed in simplified layout
import { WorkspaceMiddlePanel } from "./WorkspaceMiddlePanel";
import { WorkspaceRightPanel } from "./WorkspaceRightPanel";
import {
  WorkspaceInfo,
  CurrentWorkspaceDetails,
  ChatTab,
  type PanelSizes,
} from "./types";
import { getPanelSizes, savePanelSizes, addAgentRecentUsage } from "../../utils/storage";
import { AgentConfig } from "@dadigua/hyperchat-shared";
// AppHeader, AppActions, AppSettings 等组件已移到父组件 WorkspaceManage


// 类型定义已移至 ./types.ts

// 重新导出常用类型供其他组件使用
export type { WorkspaceInfo, CurrentWorkspaceDetails, ChatTab } from "./types";

interface WorkspaceProps {
  workspacePath: string;
}

export function Workspace({ workspacePath }: WorkspaceProps) {
  const refresh = useForceUpdate();

  // 通用错误处理函数
  const handleError = (error: unknown, errorMessage: string) => {
    console.error(errorMessage, error);
    message.error(errorMessage);
  };

  // 只从context获取真正需要在Layout中管理的状态


  // 当前工作区状态（基于传入的 workspacePath）
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceInfo | null>(null);
  const [currentWorkspaceDetails, setCurrentWorkspaceDetails] = useState<CurrentWorkspaceDetails | null>(null);
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>("");

  // 管理组件引用
  const agentManagementRef = useRef<AgentManagementRef | null>(null);
  const mcpManagementRef = useRef<MCPManagementRef | null>(null);

  // 防抖计时器 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);


  // 面板尺寸状态 - 两列布局：中间面板和右侧面板
  const [panelSizes, setPanelSizes] = useState<number[]>(() => {
    // 初始化时使用默认尺寸（移除左侧面板后调整）
    return [75, 25]; // 对应75%、25%（中间面板，右侧面板）
  });


  // 加载指定路径的工作区信息
  const loadWorkspace = async (targetWorkspacePath: string) => {
    try {
      // 直接使用 getWorkspaceInfo 获取指定工作区的信息
      const workspaceData = await call("getWorkspaceInfo", {
        workspacePath: targetWorkspacePath
      } as any);

      if (workspaceData) {
        const currentWorkspaceInfo: WorkspaceInfo = {
          path: workspaceData.path,
          name: workspaceData.name,
          description: workspaceData.description,
          created: workspaceData.created,
          agentsCount: workspaceData.agentsCount,
          mcpServersCount: 0, // 在新架构中不再有工作区级别的MCP服务器计数
          isGlobal: workspaceData.isGlobal,
        };

        setCurrentWorkspace(currentWorkspaceInfo);
      }
    } catch (error) {
      handleError(error, "Failed to load workspace");
    }
  };

  // 加载指定工作区的详细信息
  const loadWorkspaceDetails = async (workspace: WorkspaceInfo) => {
    try {
      const details: CurrentWorkspaceDetails = {
        agents: [],
        mcpClients: {} as Record<string, any>,
        fileTreeData: undefined
      };

      // 加载根目录文件列表（懒加载）
      console.log("Loading file tree for workspace:", workspace.path, "isGlobal:", workspace.isGlobal);
      const rootItems = await call("getWorkspaceDirectoryList", {
        workspacePath: workspace.path,
        directoryPath: ""
      });
      console.log("File tree loaded:", rootItems?.length, "items");
      details.fileTreeData = rootItems;

      // 加载 Agents（获取摘要信息）
      const agentList = await call("getWorkspaceAgentsSummary", {
        workspacePath: workspace.path
      });
      details.agents = agentList as Array<{
        config: AgentConfig & { scope?: "global" | "workspace" };
        chatLogsCount: number;
        lastChatTime?: number;
      }>;

      // 加载 MCP 客户端
      const mcpList = await call("getWorkspaceMcpClients", {
        workspacePath: workspace.path
      });

      // 将数组转换为对象格式，使用 name 作为 key
      if (mcpList && Array.isArray(mcpList)) {
        mcpList.forEach((client) => {
          if (client && client.serverName) {
            (details.mcpClients as Record<string, any>)[client.serverName as string] = client;
          }
        });
      }

      setCurrentWorkspaceDetails(details);
    } catch (error) {
      handleError(error, "Failed to load workspace details");
    }
  };

  // 在新架构中，工作区切换逻辑已移到父组件 WorkspaceManage



  // 应用设置和 MCP 网关设置功能已移到父组件 WorkspaceManage



  // 目录选择逻辑已移到父组件 WorkspaceManage

  // 刷新工作区详情
  const refreshWorkspaceDetails = async (refreshType?: 'agents' | 'mcp' | 'all') => {
    const type = refreshType || 'all';

    if (currentWorkspace && currentWorkspaceDetails) {
      try {
        const updatedDetails = { ...currentWorkspaceDetails };

        // 根据刷新类型选择性刷新数据
        if (type === 'agents' || type === 'all') {
          // 刷新 Agents
          const rawAgentList = await call("getWorkspaceAgentsSummary", {
            workspacePath: workspacePath
          });
          updatedDetails.agents = rawAgentList as Array<{
            config: AgentConfig & { scope?: "global" | "workspace" };
            chatLogsCount: number;
            lastChatTime?: number;
          }>;
        }

        if (type === 'mcp' || type === 'all') {
          // 刷新 MCP 客户端
          const mcpList = await call("getWorkspaceMcpClients", {
            workspacePath: workspacePath
          });

          // 将数组转换为对象格式
          updatedDetails.mcpClients = {} as Record<string, any>;
          if (mcpList && Array.isArray(mcpList)) {
            mcpList.forEach((client) => {
              if (client && client.serverName) {
                (updatedDetails.mcpClients as Record<string, any>)[client.serverName as string] = client;
              }
            });
          }
        }

        setCurrentWorkspaceDetails(updatedDetails);
      } catch (error) {
        console.error("Failed to refresh workspace details:", error);
        throw error;
      }
    }
  };


  // 处理面板尺寸变化（2栏布局）
  const handlePanelSizeChange = (sizes: number[]) => {
    if (currentWorkspace && sizes.length >= 2) {
      // 直接更新状态数组
      setPanelSizes(sizes);

      // 构建保存到localStorage的对象格式（保持兼容性）
      const sizesToSave: PanelSizes = {
        left: '0%',                      // 左侧面板已移除
        middle: `${sizes[0] || 75}%`,    // 中间面板（聊天区域）
        right: `${sizes[1] || 25}%`      // 右侧面板（管理区域）
      };

      // 保存到localStorage（使用防抖，避免频繁保存）
      const workspaceKey = currentWorkspace.path;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        savePanelSizes(workspaceKey, sizesToSave);
      }, 500); // 500ms 防抖
    }
  };


  // 当 workspacePath prop 变化时，加载对应的工作区
  useEffect(() => {
    if (workspacePath) {
      loadWorkspace(workspacePath);
    }
  }, [workspacePath]);

  // 当工作区加载完成后，自动加载详情
  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceDetails(currentWorkspace);
      // 加载当前工作区的面板尺寸（2栏布局）
      const workspaceKey = currentWorkspace.path;
      const sizes = getPanelSizes(workspaceKey);
      // 将百分比字符串转换为数字，适配2栏布局
      const middleNum = parseInt(sizes.middle) || 75; // 中间面板默认75%
      const rightNum = parseInt(sizes.right) || 25;   // 右侧面板默认25%
      setPanelSizes([middleNum, rightNum]);
      // 初始化默认聊天标签页
      initDefaultChatTab(currentWorkspace);
    }
  }, [currentWorkspace]);

  // 在多工作区架构中，工作区信息通过 workspacePath prop 传入


  // 获取当前工作区详情
  const getCurrentDetails = (): CurrentWorkspaceDetails => {
    return currentWorkspaceDetails || {
      agents: [],
      mcpClients: {},
      fileTreeData: undefined
    };
  };

  // 标签页切换逻辑已移到父组件 WorkspaceManage

  // 打开Agent聊天
  const openAgentChat = (agent: { config: AgentConfig; chatLogsCount: number; lastChatTime?: number }, chatLog?: { key: string; label?: string }) => {
    const workspace = currentWorkspace;
    if (!workspace) return;

    // 记录 agent 使用
    addAgentRecentUsage(workspace.path, agent.config.name);

    // 如果有聊天记录，使用聊天记录的key确保唯一性
    const tabKey = chatLog ? `${workspace.path}-${agent.config.name}-${chatLog.key}` : `${workspace.path}-${agent.config.name}`;
    const existingTab = chatTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setActiveTabKey(tabKey);
    } else {
      // 创建新的聊天标签页
      const tabTitle = chatLog ? `${agent.config.name} - ${chatLog.label?.slice(0, 10) || chatLog.key}` : agent.config.name;
      const newTab: ChatTab = {
        key: tabKey,
        title: tabTitle,
        type: 'chat',
        agentName: agent.config.name,
        workspacePath: workspace.path,
        closable: true,
        chatLogToLoad: chatLog, // 传递聊天记录数据
      };
      setChatTabs(prev => [...prev, newTab]);
      setActiveTabKey(tabKey);
    }
  };



  // 初始化默认欢迎标签页
  const initDefaultChatTab = (workspace: WorkspaceInfo) => {
    const defaultTabKey = `${workspace.path}-welcome`;
    const hasDefaultTab = chatTabs.some(tab => tab.key === defaultTabKey);

    if (!hasDefaultTab) {
      const defaultTab: ChatTab = {
        key: defaultTabKey,
        title: t`Welcome`,
        type: 'welcome',
        workspacePath: workspace.path,
        closable: false,
      };
      setChatTabs([defaultTab]);
      if (!chatTabs.find(tab => tab.key === activeTabKey)) {
        setActiveTabKey(defaultTabKey);
      }
    }
  };

  // 工作区标签页和显示逻辑已移到父组件 WorkspaceManage

  // 渲染工作区内容
  const renderWorkspaceContent = () => {
    const workspace = currentWorkspace;
    const details = getCurrentDetails();

    if (!workspace) {
      return (
        <Empty
          description={t`Loading workspace...`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // 获取MCP客户端列表
    const mcpClients = Object.values(details.mcpClients).sort((a, b) => a.order - b.order);
    return (
      <div className="h-full">
        <Splitter
          style={{ height: '100%' }}
          onResize={handlePanelSizeChange}
        >
          {/* 中间面板：聊天界面 */}
          <Splitter.Panel
            size={panelSizes[0] || 75}
            min="50%"
          >
            <WorkspaceMiddlePanel
              workspace={workspace}
              chatTabs={chatTabs}
              activeTabKey={activeTabKey}
              agents={details.agents || []}
              mcpClients={mcpClients}
              agentManagementRef={agentManagementRef}
              onTabChange={setActiveTabKey}
              onTabRemove={(targetKey) => {
                const newTabs = chatTabs.filter(tab => tab.key !== targetKey);
                setChatTabs(newTabs);

                // 如果关闭的是当前活动标签页，切换到其他标签页
                if (activeTabKey === targetKey) {
                  const lastTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                  const newActiveTab = lastTab ? lastTab.key : "";
                  setActiveTabKey(newActiveTab);
                }
              }}
              onOpenAgentChat={openAgentChat}
              onFileClose={(tabKey) => {
                const newTabs = chatTabs.filter(t => t.key !== tabKey);
                setChatTabs(newTabs);
              }}
            />
          </Splitter.Panel>

          {/* 右侧面板：Agents 和 MCP 管理 */}
          <Splitter.Panel
            size={panelSizes[1] || 25}
            min="20%"
            max="50%"
          >
            <WorkspaceRightPanel
              workspace={workspace}
              workspaceKey={workspace.path}
              agents={details.agents || []}
              mcpClients={mcpClients}
              agentManagementRef={agentManagementRef}
              mcpManagementRef={mcpManagementRef}
              onRefreshAgents={async () => { await refreshWorkspaceDetails('agents'); }}
              onRefreshMCP={async () => { await refreshWorkspaceDetails('mcp'); }}
              onOpenChat={openAgentChat}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    );
  };


  return (
    <div className="workspace-page h-full">
      <div className="h-full">
        <div style={{ height: '100%', padding: '0px' }}>
          {/* 直接渲染工作区内容，AppHeader 和 AppActions 已移到父组件 WorkspaceManage */}
          {renderWorkspaceContent()}
        </div>
      </div>

      {/* 在新架构中，工作区切换和管理功能以及所有抽屉组件都已移到父组件 WorkspaceManage */}

    </div>
  );
}