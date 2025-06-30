import { LinkOutlined, SyncOutlined } from "@ant-design/icons";
import { Sender } from "@ant-design/x";
import { Button, Dropdown, Flex, Space, Tooltip, Upload } from "antd";
import React, { useContext, MutableRefObject } from "react";
import { t } from "../i18n";
import { Icon } from "./icon";
import { call } from "../common/call";
import { HeaderContext } from "../common/context";
import { v4 } from "uuid";
import { useForceUpdate } from "../hooks/useForceUpdate";

/**
 * MCP 资源项类型定义
 */
interface MCPResource {
  key: string;
  description?: string;
}

/**
 * MCP 提示项类型定义
 */
interface MCPPrompt {
  key: string;
  description: string;
}

/**
 * 当前聊天对象类型定义
 */
interface CurrentChat {
  current: {
    allowMCPs: string[];
  };
}

/**
 * MySender 组件的属性类型定义
 */
interface MySenderProps {
  /** 是否支持图片上传 */
  supportImage: boolean;
  /** 是否处于加载状态 */
  loading: boolean;
  /** 输入框的值 */
  value: string;
  /** 设置输入框值的方法 */
  setValue: (value: string) => void;
  /** 是否支持工具 */
  supportTool: boolean | null;
  /** MCP 资源引用 */
  resourcesRef: MutableRefObject<MCPResource[]>;
  /** MCP 提示引用 */
  promptsRef: MutableRefObject<MCPPrompt[]>;
  /** 请求处理回调 */
  onRequest: () => void;
  /** 当前聊天对象 */
  currentChat: CurrentChat;
  /** 取消回调 */
  onCancel: () => void;
  /** 提交回调 */
  onSubmit: (value: string) => void;
  /** 输入变化回调 */
  onChange: (value: string) => void;
  /** 提示点击回调 */
  onPromptClick: (info: { key: string }) => void;
  /** 资源点击回调 */
  onResourcesClick: (info: { key: string }) => void;
  /** 工具点击回调 */
  onToolClick: () => void;
}


/**
 * 发送消息组件
 * 提供消息输入、文件上传、MCP工具选择、资源和提示选择等功能
 * 
 * @param props MySenderProps 组件属性
 * @returns JSX.Element 渲染的发送器组件
 */
export function MySender({ 
    supportImage, 
    loading, 
    value, 
    setValue, 
    supportTool, 
    resourcesRef, 
    promptsRef, 
    onRequest, 
    currentChat,
    onCancel, 
    onSubmit, 
    onChange, 
    onPromptClick, 
    onResourcesClick, 
    onToolClick 
}: MySenderProps) {
    // 获取全局状态和 MCP 客户端
    const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
    const refresh = useForceUpdate();

    return (
        <Sender
            className="my-sender"
            footer={({ components }) => {
                const { SendButton, LoadingButton, SpeechButton } = components;
                return (
                    <Flex justify="space-between" align="center">
                        {/* 左侧工具栏 */}
                        <Flex align="center">
                            {/* 图片上传功能 */}
                            {supportImage && (
                                <>
                                    <Upload
                                        accept="image/*"
                                        fileList={[]}
                                        beforeUpload={async (file) => {
                                            // TODO: 实现图片上传逻辑
                                        }}
                                    >
                                        <Button
                                            type="text"
                                            icon={<LinkOutlined />}
                                            onClick={() => { }}
                                        />
                                    </Upload>
                                </>)}

                            {/* MCP 工具和连接状态显示 */}
                            <Tooltip title={t`MCP and Tools`} placement="bottom">
                                {supportTool == null || supportTool == true ? (
                                    <Space.Compact>
                                        <Button onClick={onToolClick} type="text" icon={<Icon name="mcp"></Icon>}>
                                            {(() => {
                                                // 计算当前聊天允许的 MCP 服务
                                                let set = new Set<string>();
                                                for (let tool_name of currentChat.current.allowMCPs) {
                                                    let [name, _] = tool_name.split(" > ");
                                                    set.add(name);
                                                }

                                                // 统计 MCP 连接状态
                                                let load = mcpClients.filter(
                                                    (v) => v.status == "connected",
                                                ).length;
                                                let all = mcpClients.filter(x => x.status !== "disabled").length;
                                                let curr = mcpClients.filter((v) => {
                                                    return v.status !== "disabled" && set.has(v.name);
                                                }).length;

                                                // 显示连接状态和数量
                                                return load == all ? (
                                                    <>
                                                        {`${curr} `}
                                                        <SyncOutlined spin />
                                                        {`(${load}/${all})`}
                                                    </>
                                                ) : (
                                                    curr
                                                );
                                            })()}
                                            
                                            {/* 显示工具数量 */}
                                            <Icon name="chuizi-copy"></Icon>
                                            {(() => {
                                                // 计算当前可用的工具数量
                                                let set = new Set<string>();
                                                for (let tool_name of currentChat.current.allowMCPs) {
                                                    let [name, _] = tool_name.split(" > ");
                                                    set.add(name);
                                                }

                                                let curr = mcpClients.filter((v) => {
                                                    return v.status !== "disabled" && set.has(v.name);
                                                });
                                                let toolLen = 0;
                                                for (let x of curr) {
                                                    toolLen += x.tools.length;
                                                }
                                                return toolLen;
                                            })()}
                                        </Button>
                                    </Space.Compact>
                                ) : (
                                    /* 不支持工具时的显示 */
                                    <Button
                                        type="text"
                                        icon={<Icon name="mcp"></Icon>}
                                        onClick={() => { }}
                                    >
                                        {t`LLM not support`}
                                    </Button>
                                )}
                            </Tooltip>

                            {/* MCP 资源下拉菜单 */}
                            <Tooltip title={t`Resources`} placement="bottom">
                                <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                        items: resourcesRef.current.map((x, i) => {
                                            return {
                                                key: x.key,
                                                label: !x.description
                                                    ? x.key
                                                    : `${x.key}--${x.description}`,
                                            };
                                        }),
                                        onClick: onResourcesClick,
                                    }}
                                    arrow
                                >
                                    <Button type="text" className="cursor-pointer">
                                        <Icon name="resources" />{" "}
                                        {resourcesRef.current.length}
                                    </Button>
                                </Dropdown>
                            </Tooltip>

                            {/* MCP 提示下拉菜单 */}
                            <Tooltip title={t`Prompts`} placement="bottom">
                                <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                        items: promptsRef.current.map((x, i) => {
                                            return {
                                                key: x.key,
                                                label: `${x.key} (${x.description})`,
                                            };
                                        }),
                                        onClick: onPromptClick,
                                    }}
                                    arrow
                                >
                                    <Button type="text" className="cursor-pointer">
                                        <Icon name="prompts" />{" "}
                                        {promptsRef.current.length}
                                    </Button>
                                </Dropdown>
                            </Tooltip>
                        </Flex>
                        
                        {/* 右侧发送按钮 */}
                        <Flex align="center">
                            {loading ? (
                                <LoadingButton type="default" />
                            ) : (
                                <SendButton type="primary" disabled={false} />
                            )}
                        </Flex>
                    </Flex>
                );
            }}
            actions={false}
            loading={loading}
            value={value}
            onChange={onChange}
            onCancel={onCancel}
            onSubmit={onSubmit}
            placeholder={t`Start inputting, You can use @ to call other agents, or quickly enter`}
        />
    );
}