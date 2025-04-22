import React, { useEffect } from "react";
import { Editor } from "../../components/editor";
import { Button, Radio, Table } from "antd";
import { VarScopeList, Var, VarList } from "../../../../common/data";
import { EditIcon } from "lucide-react";
import { EditOutlined } from "@ant-design/icons";
import { t } from "../../i18n";

export const VariableList = () => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const [scope, setScope] = React.useState({
        name: undefined,
        key: undefined
    });
    useEffect(() => {
        (async () => {
            await VarScopeList.init();
            await VarList.init();
            refresh();
        })()
    }, []);


    return <div className="flex">
        <div className="w-full lg:w-1/4">
            {/*  <Radio.Group

            onChange={(e) => {
                setScope(e.target.value);
            }}
            value={scope}
            options={VarScopeList.get().data.map(x => {
                return {
                    ...x,
                    label: <span>{x.label} <EditIcon /></span>
                }
            })}
        /> */}
            <Table
                size="small"
                rowKey={"key"}
                title={() => {
                    return <div className="flex gap-1">
                        <Button size="small" onClick={() => {
                            setScope({
                                name: undefined,
                                key: undefined
                            });
                        }}>{t`Clear Select`}</Button>
                        <Button size="small" onClick={() => {

                        }}>{t`Add`}</Button>
                    </div>
                }}

                rowSelection={{
                    type: "radio", selectedRowKeys: [scope.key], onChange: (selectedRowKeys) => {
                        setScope(
                            VarScopeList.get().data.find(x => x.key == selectedRowKeys[0])
                        );
                    }
                }}
                columns={[
                    {
                        title: 'scope',
                        dataIndex: 'name',
                        render: (text, record) => {
                            return <span>{text}<EditOutlined /></span>
                        }
                    },
                ]}
                pagination={false}
                dataSource={VarScopeList.get().data}
            />
        </div>
        <div className="w-full lg:w-3/4">
            <Table
                size="small"
                rowKey={"key"}
                title={() => {
                    return <div className="flex gap-1">
                        <Button size="small" onClick={() => {

                        }}>{t`Add`}</Button>
                    </div>
                }}

                columns={[
                    {
                        title: 'name',
                        dataIndex: 'name',
                        width: 200,
                        render: (text, record) => {
                            return <span className="line-clamp-1">{text}</span>
                        }
                    },
                    {
                        title: 'value',
                        dataIndex: 'value',
                        render: (text, record) => {
                            return <span className="line-clamp-1">{text}</span>
                        }
                    },
                ]}
                pagination={false}
                dataSource={VarList.get().data.filter(x => {
                    if (scope?.name == null) {
                        return true;
                    } else {
                        return x.scope == scope.name;
                    }
                })}
            />
        </div>
    </div>
};

