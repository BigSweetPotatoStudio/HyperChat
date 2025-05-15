import React, { useEffect, useState, useRef } from "react";
import { Editor } from "../../components/editor";
import { Tabs, Button, Space, message, Select, Divider } from "antd";
import { t } from "@/src/i18n";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import { Divide } from "lucide-react";

import { experimental_transcribe as transcribe } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GPT_MODELS } from "../../../../common/data";
import GenerateSpeechPanel from "./generateSpeech";
import { TranscribePanel } from "./Transcribe";

export const ToolboxPage = () => {
    useEffect(() => {

    }, [])

    return <div className="h-full">
        <Tabs
            tabPosition={"left"}
            items={[
                {
                    label: t`transcribe`,
                    key: "transcribe",
                    children: <TranscribePanel />,
                },
                {
                    label: t`Generate Speech`,
                    key: "generateSpeech",
                    children: <GenerateSpeechPanel />,
                }
            ]}
        />
    </div>
};

