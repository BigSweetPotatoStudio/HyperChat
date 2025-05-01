import { BulbOutlined, QuestionCircleFilled } from "@ant-design/icons";
import { Button, Input, Space, Tooltip } from "antd";
import type { InputProps } from "antd/lib/input";
import React from "react";
import { t } from "../i18n";
import { Popconfirm } from "antd/lib";

export const InputAI = ({ value, onChange, aiGen, extInput, ...props }: {
    value?: any,
    onChange?: (value: string) => void
    aiGen?: (text?) => Promise<string>
    extInput?: boolean
} & InputProps) => {
    const [p, setP] = React.useState("");
    return <Space.Compact className="w-full">
        <Input
            {...props}
            className="w-full"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        {

            <Popconfirm title={<div>
                <span className="text-gray-500">{t`AI Generate`}</span>
                {extInput && <Input size="small" value={p} onChange={e => setP(e.target.value)}></Input>}
            </div>} onConfirm={async () => {
                if (aiGen) {
                    let res = await aiGen(p);
                    onChange(res);
                }
            }}>
                <Button><BulbOutlined className="text-yellow-300" /></Button>
            </Popconfirm>

        }


    </Space.Compact>;
}