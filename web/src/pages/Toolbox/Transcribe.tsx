import React, { useEffect, useState, useRef } from "react";
import { Editor } from "../../components/editor";
import { Tabs, Button, Space, message, Select, Divider } from "antd";
import { t } from "@/src/i18n";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import { Divide } from "lucide-react";

import { experimental_transcribe as transcribe } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GPT_MODELS } from "../../../../common/data";

// 录音组件
export const TranscribePanel = () => {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const [modelName, setModelName] = useState<any>("whisper-1");
    const [result, setResult] = useState<string | null>("");
    // 开始录音
    const startRecording = async () => {
        try {
            chunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setRecording(true);
            message.success(t`Recording started`);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            message.error(t`Failed to access microphone`);
        }
    };

    // 停止录音
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            // 关闭麦克风
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
            setRecording(false);
            message.success(t`Recording completed`);
        }
    };

    // 清除录音
    const clearRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
    };

    const onFinish = async (values: any) => {
        if(audioBlob == null) {
            message.error(t`Please record audio first`);
            return;
        }
        const model = (await GPT_MODELS.init()).data.find(model => model.provider === "openai");
        if (!model) {
            message.error(t`Model not found, please check your OpenAI API key.`);
            return;
        }
        let openai = createOpenAI({
            compatibility: 'strict', // strict mode, enable when using the OpenAI API,
            // baseURL: this.options.baseURL,
            apiKey: model.apiKey,
        });

        const res = await transcribe({
            model: openai.transcription(modelName),
            audio: await audioBlob.arrayBuffer(),
        });

        console.log(res.text);
        setResult(res.text);
        message.success(t`Transcription completed`);
    }

    return (
        <div className="p-4">
            <h2 className="text-xl mb-4">{t`Transcribe Audio to Text by OpenAI`}</h2>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                    <Button
                        type="primary"
                        icon={recording ? <AudioMutedOutlined /> : <AudioOutlined />}
                        onClick={recording ? stopRecording : startRecording}
                        danger={recording}
                    >
                        {recording ? t`Stop Recording` : t`Start Recording`}
                    </Button>

                    {audioUrl && (
                        <Button onClick={clearRecording}>
                            {t`Clear Recording`}
                        </Button>
                    )}
                </Space>

                {audioUrl && (
                    <div className="mt-4">
                        <h3>{t`Preview`}</h3>
                        <audio controls src={audioUrl} className="w-full"></audio>
                    </div>
                )}
                <div>
                    <Divider orientation="left">{t`Options`}</Divider>
                    <div className="flex gap-2">
                        <Select onChange={(value) => setModelName(value)} value={modelName} style={{ width: 200 }}>
                            <Select.Option value="whisper-1">{`whisper-1`}</Select.Option>
                            <Select.Option value="gpt-4o-mini-transcribe">{`gpt-4o-mini-transcribe`}</Select.Option>
                            <Select.Option value="gpt-4o-transcribe">{`gpt-4o-transcribe`}</Select.Option>
                        </Select>
                        <Button onClick={onFinish}>{t`Transcribe`}</Button>
                    </div>
                </div>
                <div>
                    <Divider orientation="left">{t`Result`}</Divider>

                    <div>
                        {
                            result
                        }
                    </div>

                </div>

            </Space>
        </div>
    );
};

