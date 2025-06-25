import { LinkOutlined, SyncOutlined } from "@ant-design/icons";
import { Sender } from "@ant-design/x";
import { Button, Dropdown, Flex, Space, Tooltip, Upload } from "antd";
import React, { useContext } from "react";
import { t } from "../i18n";
import { Icon } from "./icon";
import { call } from "../common/call";
import { HeaderContext } from "../common/context";
import { v4 } from "uuid";


export function MySender({ supportImage, loading, value, setValue, supportTool, resourcesRef, promptsRef, onRequest, currentChat,
    onCancel, onSubmit, onChange, onPromptClick, onResourcesClick, onToolClick }) {
    const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };

    return (
        <Sender
            className="my-sender"
            footer={({ components }) => {
                const { SendButton, LoadingButton, SpeechButton } = components;
                return (
                    <Flex justify="space-between" align="center">
                        <Flex align="center">

                            {supportImage && (
                                <>
                                    <Upload
                                        accept="image/*"
                                        fileList={[]}
                                        beforeUpload={async (file) => {

                                        }}
                                    >
                                        <Button
                                            type="text"
                                            icon={<LinkOutlined />}
                                            onClick={() => { }}
                                        />
                                    </Upload>
                                    {/* <Divider type="vertical" /> */}
                                </>)}

                            <Tooltip title={t`MCP and Tools`} placement="bottom">

                                {supportTool == null || supportTool == true ? (
                                    <Space.Compact>
                                        <Button onClick={onToolClick} type="text" icon={<Icon name="mcp"></Icon>}>


                                            {(() => {
                                                let set = new Set();
                                                for (let tool_name of currentChat.current.allowMCPs) {
                                                    let [name, _] = tool_name.split(" > ");
                                                    set.add(name);
                                                }

                                                let load = mcpClients.filter(
                                                    (v) => v.status == "connected",
                                                ).length;
                                                let all = mcpClients.filter(x => x.status !== "disabled").length;
                                                let curr = mcpClients.filter((v) => {
                                                    return v.status !== "disabled" && set.has(v.name);
                                                }).length;

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
                                            <Icon name="chuizi-copy"></Icon>{

                                                (() => {
                                                    let set = new Set();
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
                                                    return (
                                                        <>
                                                            {toolLen}
                                                        </>
                                                    )
                                                })()
                                            }
                                        </Button>

                                    </Space.Compact>
                                ) : (
                                    <>  <Button
                                        type="text"
                                        icon={<Icon name="mcp"></Icon>}
                                        onClick={() => { }}
                                    >{t`LLM not support`}</Button>  </>
                                )}

                            </Tooltip>
                            {/* <Divider type="vertical" /> */}
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
                        <Flex align="center">
                            {/* <Button type="text" style={{
                    fontSize: 18,
                    color: token.colorText,
                  }} icon={<ApiOutlined />} />

                  <Divider type="vertical" /> */}
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