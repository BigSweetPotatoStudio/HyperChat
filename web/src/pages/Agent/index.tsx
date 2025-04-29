import React, { useEffect, useState } from "react";
import { Editor } from "../../components/editor";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { AgentData, Agents } from "../../../../common/data";
import { SortableItem } from "../chat/sortableItem";
import { Button, Card, Divider, Tabs, Tag, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, FunctionOutlined, SettingFilled, SwapOutlined } from "@ant-design/icons";
import { Icon } from "../../components/icon";
import { t } from "../../i18n";
import { Link } from "react-router-dom";
import { getFirstCharacter } from "../../common";

export const AgentPage = () => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    useEffect(() => {
        (async () => {
            await Agents.init();
            Agents.get().data = Agents.get().data.filter(x => x.type != "builtin");
            refresh();
        })();
    }, []);


    const [botSearchValue, setBotSearchValue] = useState("");
    const sensors = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        },
    });

    return <div className="h-full">
        <Tabs type="card" tabBarExtraContent={{
            right: <div className=" flex gap-1">
                <Link to="/Agent/Create">
                    <Button icon={<Icon name="bx-bot"></Icon>}>{t`CreatAgent`}</Button>
                </Link>


                <Link to="/Task/List">
                    <Button icon={<Icon name="task"></Icon>}>{t`TaskList`}</Button>
                </Link>

                <Button icon={<SettingFilled></SettingFilled>}></Button>
            </div>
        }}>
            <Tabs.TabPane tab="Design" key="Design">
                <div>
                    <AgentCard item={{
                        key: "agentAdmin",
                        label: "Agent Admin",
                        tags: ["admin", "builtin"],
                        description: "Agent Admin",
                        version: 2,
                    } as any}></AgentCard>
                </div>
                <Divider />
                <div className="flex items-center">
                    <div className="flex flex-wrap">

                        {(Agents.get()
                            .data).filter(
                                (x) =>
                                    x.subAgents?.length > 0
                            ).filter(
                                (x) =>
                                    botSearchValue == "" ||
                                    x.label
                                        .toLowerCase()
                                        .includes(botSearchValue),
                            )
                            .map((item) => (
                                <AgentCard
                                    key={item.key}
                                    item={item}
                                    onClick={(item) => {

                                    }}
                                    onEdit={() => {

                                    }}
                                    onRemove={() => {

                                    }}
                                />
                            ))}
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="flex flex-wrap">

                        {(Agents.get()
                            .data).filter(
                                (x) =>
                                    x.subAgents == null || x.subAgents?.length == 0
                            ).filter(
                                (x) =>
                                    botSearchValue == "" ||
                                    x.label
                                        .toLowerCase()
                                        .includes(botSearchValue),
                            )
                            .map((item) => (
                                <AgentCard
                                    key={item.key}
                                    item={item}
                                    onClick={(item) => {

                                    }}
                                    onEdit={() => {

                                    }}
                                    onRemove={() => {

                                    }}
                                />
                            ))}
                    </div>
                </div>
            </Tabs.TabPane>
        </Tabs>


    </div>
};

export function AgentCard({ item, onClick, onRemove, onEdit }:
    {
        item: AgentData,
        onClick?: (item: AgentData) => void,
        onRemove?: (item: AgentData) => void,
        onEdit?: (item: AgentData) => void
    }
) {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const [hover, setHover] = useState(false);
    useEffect(() => {
        // if (item.version == null) {

        //     item.tags = item.tags || [];
        //     if (item.callable) {
        //         item.tags.push("callable");
        //     }
        //     item.tags.push("custom");
        //     refresh();
        // }
    }, []);
    let Icon = <div
        key={item.key}
        className="relative m-1 h-24 w-24 cursor-pointer overflow-hidden rounded-md border border-gray-200"
    >
        <Tooltip title={item.description}>
            <div
                className="relative h-full w-full"
                style={{
                    backgroundColor: hover ? "rgba(0, 0, 0, 0.05)" : "transparent",
                }}
                onMouseEnter={() => {
                    setHover(true);
                }}
                onMouseLeave={() => {
                    setHover(false);
                }}
                onClick={() => {
                    onClick && onClick(item);
                }}
            >
                <div className="flex h-4/5 w-full items-center justify-center">
                    <div className="text-xl">{getFirstCharacter(item.label)}</div>
                </div>
                <div className="absolute left-0 top-0 z-10">
                    {item.callable && (
                        <FunctionOutlined className="text-blue-400" />
                    )}
                    {item.type == "builtin" && (
                        <span className="text-red-400" >{item.type}</span>
                    )}
                </div>
                {item.type != "builtin" && <div
                    style={{
                        display: hover ? "block" : "none",
                    }}
                    className="absolute right-0 top-0 z-10"
                >
                    <DeleteOutlined
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove && onRemove(item);
                        }}
                        className="ml-2 cursor-pointer text-red-400 hover:text-red-800"
                    />
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit && onEdit(item);
                        }}
                    >
                        <EditOutlined className="ml-2 cursor-pointer text-blue-400 hover:text-blue-800" />
                    </span>
                </div>
                }
                <div className="absolute bottom-0 line-clamp-2 w-full bg-slate-600 text-center text-sm text-slate-50">
                    {item.label}
                </div>
            </div>
        </Tooltip>
    </div>

    if (item.subAgents == null || item.subAgents?.length == 0) {
        return Icon

    } else {
        return <div className=" flex border p-1 h-40 w-64 overflow-auto rounded-md">
            <div className=" text-center">
                {Icon}
                {/* <Button size="small" type="dashed">{t`Chat`}</Button> */}
            </div>
            <div>
                {/* <div>
                <div>{t`tags:`}</div>
                <div>
                    {
                        item?.tags?.map((tag) => {
                            return <Tag>{tag}</Tag>
                        })
                    }
                </div>
            </div> */}
                <div>
                    <div>{t`subAgents:`}</div>
                    <div>
                        {
                            item?.subAgents?.map((key) => {
                                let find = Agents.get().data.find(x => x.key == key);
                                if (!find) {
                                    return undefined
                                }
                                return <Tag className="text-sky-400">{find.label}</Tag>
                            })
                        }
                    </div>

                </div>
            </div>
        </div>
    }
}