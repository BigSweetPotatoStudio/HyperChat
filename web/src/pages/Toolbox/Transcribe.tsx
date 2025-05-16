import React, { useEffect, useState, useRef } from "react";
import { Editor } from "../../components/editor";
import { Tabs, Button, Space, message, Select, Divider, Spin } from "antd";
import { t } from "@/src/i18n";
import { AudioOutlined, AudioMutedOutlined, LoadingOutlined, ClearOutlined } from "@ant-design/icons";

import { Experimental_TranscriptionResult, experimental_transcribe as transcribe } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GPT_MODELS } from "../../../../common/data";
import { SelectFile } from "@/src/common/selectFile";

// 录音组件
export const TranscribePanel = () => {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const [modelName, setModelName] = useState<any>("whisper-1");
    const [result, setResult] = useState<Experimental_TranscriptionResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
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
        setResult(null);
        message.info(t`Recording cleared`);
    };

    const onFinish = async (values: any) => {
        if (audioBlob == null) {
            message.error(t`Please record audio first`);
            return;
        }

        try {
            setLoading(true);
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

            console.log(res);
            setResult(res);
            message.success(t`Transcription completed`);
        } catch (error) {
            console.error("Transcription error:", error);
            message.error(t`Transcription failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
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

                    <SelectFile
                        onFileChange={(file) => {
                            if (file) {
                                const url = URL.createObjectURL(file);
                                setAudioUrl(url);
                                setAudioBlob(file);
                            }
                        }}
                        filters={[
                            {
                                name: "Audio Files",
                                extensions: [".mp3", ".wav"],
                            },
                        ]}
                    />

                    {audioUrl && (
                        <Button
                            icon={<ClearOutlined />}
                            onClick={clearRecording}
                        >
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
                        <Button
                            onClick={onFinish}
                            disabled={!audioBlob || loading}
                            loading={loading}
                        >
                            {t`Transcribe`}
                        </Button>
                    </div>
                </div>
                <div>
                    <Divider orientation="left">
                        <Space>
                            {t`Result`}
                            {result && (
                                <Button
                                    type="text"
                                    icon={<ClearOutlined />}
                                    size="small"
                                    onClick={() => setResult(null)}
                                />
                            )}
                        </Space>
                    </Divider>

                    {loading ? (
                        <div className="flex justify-center items-center p-4">
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                            <span className="ml-2">{t`Transcribing...`}</span>
                        </div>
                    ) : (
                        <div className="p-2 min-h-[100px]">
                            {result?.language && <div>Lang: {result?.language}</div>}
                            <div>{
                                result?.segments?.length > 0 ? result?.segments.map((segment, index) => (
                                    <div key={index}>
                                        <><div>Start: {segment.startSecond} seconds</div>
                                            <div>End: {segment.endSecond} seconds</div></>
                                        <div>Text: {segment.text}</div>
                                    </div>
                                )) : (
                                    result?.text && <div>Text: {result?.text}</div>
                                )
                            }</div>
                        </div>
                    )}
                </div>

            </Space>
        </div>
    );
};

