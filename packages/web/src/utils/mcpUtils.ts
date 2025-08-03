import { IMCPClient } from '@dadigua/hyperchat-shared';

/**
 * MCP 权限转换工具函数
 */

/**
 * 从 TreeSelect 选中值转换为 allowMCPs 和 blockMCPTools
 * @param selectedValues TreeSelect 组件的选中值数组
 * @param mcpClients MCP 客户端列表
 * @returns { allowMCPs: string[], blockMCPTools: string[] }
 */
export const convertTreeSelectionToMCPConfig = (
  selectedValues: string[], 
  mcpClients: IMCPClient[] | Record<string, IMCPClient>
) => {
  const mcpClientNames = new Set<string>();
  const blockMCPTools = new Set<string>();

  // 第一步：确定允许的 MCP 客户端
  Object.values(mcpClients || {}).forEach((client) => {
    // 如果选中了客户端名称，则允许该 MCP 客户端
    if (selectedValues.includes(client.serverName)) {
      mcpClientNames.add(client.serverName);
      return;
    }

    // 检查该客户端下是否有选中的工具
    const hasSelectedTools = client.tools.some((tool) =>
      selectedValues.includes(tool.displayName)
    );

    // 如果选中了该客户端下的任何工具，也要允许该 MCP 客户端
    if (hasSelectedTools) {
      mcpClientNames.add(client.serverName);
    }
  });

  // 第二步：对于允许的 MCP 客户端，找出未被选中的工具（阻止列表）
  Object.values(mcpClients || {}).forEach((client) => {
    if (mcpClientNames.has(client.serverName)) {
      client.tools.forEach((tool) => {
        if (!selectedValues.includes(tool.displayName)) {
          // 该工具在允许的 MCP 客户端中但未被选中，加入阻止列表
          blockMCPTools.add(tool.displayName);
        }
      });
    }
  });

  return {
    allowMCPs: Array.from(mcpClientNames),
    blockMCPTools: Array.from(blockMCPTools)
  };
};

/**
 * 从 allowMCPs 和 blockMCPTools 转换为 TreeSelect 选中值
 * @param allowMCPs 允许的 MCP 客户端名称列表
 * @param blockMCPTools 阻止的 MCP 工具显示名称列表
 * @param mcpClients MCP 客户端列表
 * @returns string[] TreeSelect 组件的选中值数组
 */
export const convertMCPConfigToTreeSelection = (
  allowMCPs: string[], 
  blockMCPTools: string[], 
  mcpClients: IMCPClient[] | Record<string, IMCPClient>
) => {
  const combinedSelection = new Set([...allowMCPs]);

  // 遍历允许的 MCP 客户端，添加未被阻止的工具
  Object.values(mcpClients || {}).forEach((client) => {
    if (allowMCPs.includes(client.serverName)) {
      client.tools.forEach((tool) => {
        // 如果工具不在阻止列表中，则添加到选中项
        if (!blockMCPTools.includes(tool.displayName)) {
          combinedSelection.delete(tool.clientName);
          combinedSelection.add(tool.displayName);
        }
      });
    }
  });

  return Array.from(combinedSelection);
};

/**
 * 过滤 MCP 工具列表，根据 allowMCPs 和 blockMCPTools 进行过滤
 * @param mcpClients MCP 客户端列表
 * @param allowMCPs 允许的 MCP 客户端名称列表，为空表示允许所有
 * @param blockMCPTools 阻止的 MCP 工具显示名称列表，为空表示不阻止任何工具
 * @returns 过滤后的工具列表
 */
export const filterMCPTools = (
  mcpClients: IMCPClient[] | Record<string, IMCPClient>,
  allowMCPs?: string[],
  blockMCPTools?: string[]
) => {
  const tools: any[] = [];

  Object.values(mcpClients || {}).forEach((client) => {
    client.tools.forEach((tool) => {
      // 检查 MCP 客户端名称（白名单模式）
      const mcpAllowed = !allowMCPs || allowMCPs.length === 0 || allowMCPs.includes(tool.clientName);
      
      // 检查工具是否被阻止（黑名单模式）
      const toolBlocked = blockMCPTools && blockMCPTools.length > 0 && blockMCPTools.includes(tool.displayName);
      
      // MCP 允许且工具未被阻止
      if (mcpAllowed && !toolBlocked) {
        tools.push(tool);
      }
    });
  });

  return tools;
};