import React, { useState, useRef } from "react";
import { Button, Space, message, Input, Select, Divider } from "antd";
import { t } from "@/src/i18n";
import { SoundOutlined, LoadingOutlined } from "@ant-design/icons";

import { experimental_generateSpeech as generateSpeech } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GPT_MODELS } from "../../../../common/data";

const { TextArea } = Input;

// 文本转语音组件
const GenerateSpeechPanel = () => {
    const [text, setText] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [modelName, setModelName] = useState<string>("tts-1");
    const [voice, setVoice] = useState<string>("alloy");

    // 生成语音
    const handleGenerateSpeech = async () => {
        if (!text.trim()) {
            message.error(t`Please enter text first`);
            return;
        }

        try {
            setGenerating(true);

            // 获取OpenAI配置
            const model = (await GPT_MODELS.init()).data.find(model => model.provider === "openai");
            if (!model) {
                message.error(t`Model not found, please check your OpenAI API key.`);
                setGenerating(false);
                return;
            }

            // 创建OpenAI实例
            let openai = createOpenAI({
                compatibility: 'strict',
                apiKey: model.apiKey,
            });

            // 调用API生成语音
            const { audio } = await generateSpeech({
                model: openai.speech(modelName),
                voice: voice,
                text: text,
            });

            // 将ArrayBuffer转换为Blob
            const blob = new Blob([audio.uint8Array], { type: audio.mimeType });

            // 创建URL
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            message.success(t`Speech generated successfully`);
        } catch (error) {
            console.error("Error generating speech:", error);
            message.error(t`Failed to generate speech: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    // 清除生成的音频
    const clearAudio = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl mb-4">{t`Generate Speech from Text by OpenAI`}</h2>
            <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t`Enter text to convert to speech`}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    disabled={generating}
                />

                <div>
                    <Divider orientation="left">{t`Options`}</Divider>
                    <div className="flex gap-2 flex-wrap">
                        <div>
                            <span className="mr-2">{t`Model`}:</span>
                            <Select
                                onChange={(value) => setModelName(value)}
                                value={modelName}
                                style={{ width: 160 }}
                                disabled={generating}
                            >
                                <Select.Option value="tts-1">{`tts-1`}</Select.Option>
                                <Select.Option value="tts-1-hd">{`tts-1-hd`}</Select.Option>
                                <Select.Option value="gpt-4o-mini-tts">{`gpt-4o-mini-tts`}</Select.Option>
                            </Select>
                        </div>

                        <div>
                            <span className="mr-2">{t`Voice`}:</span>
                            <Select
                                onChange={(value) => setVoice(value)}
                                value={voice}
                                style={{ width: 160 }}
                                disabled={generating}
                            >
                                <Select.Option value="alloy">{`alloy`}</Select.Option>
                                <Select.Option value="echo">{`echo`}</Select.Option>
                                <Select.Option value="fable">{`fable`}</Select.Option>
                                <Select.Option value="onyx">{`onyx`}</Select.Option>
                                <Select.Option value="nova">{`nova`}</Select.Option>
                                <Select.Option value="shimmer">{`shimmer`}</Select.Option>
                            </Select>
                        </div>

                        <Button
                            type="primary"
                            icon={generating ? <LoadingOutlined /> : <SoundOutlined />}
                            onClick={handleGenerateSpeech}
                            loading={generating}
                            disabled={!text.trim() || generating}
                        >
                            {generating ? t`Generating...` : t`Generate Speech`}
                        </Button>

                        {audioUrl && (
                            <Button onClick={clearAudio}>
                                {t`Clear Audio`}
                            </Button>
                        )}
                    </div>
                </div>

                {audioUrl && (
                    <div className="mt-4">
                        <Divider orientation="left">{t`Result`}</Divider>
                        <audio controls src={audioUrl} className="w-full"></audio>
                    </div>
                )}
            </Space>
        </div>
    );
};

export default GenerateSpeechPanel;