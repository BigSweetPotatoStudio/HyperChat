import React, { useState } from "react";
import { Button, Space, message, Input, Select, Divider, Card, Spin, Image } from "antd";
import { t } from "@/src/i18n";
import { FileImageOutlined, LoadingOutlined } from "@ant-design/icons";

import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { GPT_MODELS } from "../../../../common/data";

const { TextArea } = Input;

// 图像生成组件
const GenerateImagePanel = () => {
    const [prompt, setPrompt] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [modelName, setModelName] = useState<string>("dall-e-3");
    const [imageSize, setImageSize] = useState<string>("1024x1024");
    const [imageCount, setImageCount] = useState<number>(1);
    const [quality, setQuality] = useState<string>("standard");
    const [style, setStyle] = useState<string>("vivid");

    // 生成图像
    const handleGenerateImage = async () => {
        if (!prompt.trim()) {
            message.error(t`Please enter a prompt first`);
            return;
        }

        try {
            setGenerating(true);
            setImageUrls([]);

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

            // 调用API生成图像
            const { images } = await generateImage({
                model: openai.image(modelName),
                prompt: prompt,
                n: modelName === 'dall-e-3' ? Math.min(imageCount, 1) : imageCount, // DALL-E 3 一次只能生成一张
                size: imageSize as any,
                // quality: quality as any,
                // style: style,
            });

            // 保存生成的图像URL
            setImageUrls(images.map(f => f.base64) || []);
            message.success(t`Images generated successfully`);
        } catch (error) {
            console.error("Error generating images:", error);
            message.error(t`Failed to generate images: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    // 清除生成的图像
    const clearImages = () => {
        setImageUrls([]);
    };

    // 渲染图像尺寸选项
    const renderSizeOptions = () => {
        if (modelName === 'dall-e-3') {
            return (
                <>
                    <Select.Option value="1024x1024">{`1024x1024`}</Select.Option>
                    <Select.Option value="1792x1024">{`1792x1024`}</Select.Option>
                    <Select.Option value="1024x1792">{`1024x1792`}</Select.Option>
                </>
            );
        } else if (modelName === 'gpt-image-1') {
            return (
                <>
                    <Select.Option value="1024x1024">{`1024x1024`}</Select.Option>
                    <Select.Option value="1024x1536">{`1024x1536`}</Select.Option>
                    <Select.Option value="1536x1024">{`1536x1024`}</Select.Option>
                </>
            );
        } else {
            return (
                <>
                    <Select.Option value="256x256">{`256x256`}</Select.Option>
                    <Select.Option value="512x512">{`512x512`}</Select.Option>
                    <Select.Option value="1024x1024">{`1024x1024`}</Select.Option>
                </>
            );
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl mb-4">{t`Generate Images from Text by OpenAI`}</h2>
            <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                    {/* <div>
                        <span className="mr-2">{t`Style`}:</span>
                        <Select
                            onChange={(value) => setStyle(value)}
                            value={style}
                            style={{ width: 160 }}
                            disabled={generating}
                        >
                            <Select.Option value="vivid">{`Vivid`}</Select.Option>
                            <Select.Option value="natural">{`Natural`}</Select.Option>
                        </Select>
                    </div> */}


                </div>
                <TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t`Enter prompt to generate images (e.g. "A futuristic cityscape at sunset")`}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    disabled={generating}
                />

                <div>
                    <Divider orientation="left">{t`Options`}</Divider>
                    <div className="flex gap-2 flex-wrap">
                        <div>
                            <span className="mr-2">{t`Model`}:</span>
                            <Select
                                onChange={(value) => {
                                    setModelName(value);
                                    // 重置为默认尺寸
                                    if (value === 'dall-e-3') {
                                        setImageSize("1024x1024");
                                    } else if (value === 'dall-e-2') {
                                        setImageSize("1024x1024");
                                    } else if (value === 'gpt-image-1') {
                                        setImageSize("1024x1024");
                                    }
                                    // // DALL-E 3重置为标准质量
                                    // if (value === 'dall-e-3') {
                                    //     setQuality("standard");
                                    // }
                                }}
                                value={modelName}
                                style={{ width: 160 }}
                                disabled={generating}
                            >
                                <Select.Option value="dall-e-3">{`DALL-E 3`}</Select.Option>
                                <Select.Option value="dall-e-2">{`DALL-E 2`}</Select.Option>
                                <Select.Option value="gpt-image-1">{`GPT Image 1
`}</Select.Option>
                            </Select>
                        </div>

                        <div>
                            <span className="mr-2">{t`Size`}:</span>
                            <Select
                                onChange={(value) => setImageSize(value)}
                                value={imageSize}
                                style={{ width: 160 }}
                                disabled={generating}
                            >
                                {renderSizeOptions()}
                            </Select>
                        </div>

                        {/* {modelName === 'dall-e-3' && (
                            <>
                                <div>
                                    <span className="mr-2">{t`Quality`}:</span>
                                    <Select
                                        onChange={(value) => setQuality(value)}
                                        value={quality}
                                        style={{ width: 160 }}
                                        disabled={generating}
                                    >
                                        <Select.Option value="standard">{`Standard`}</Select.Option>
                                        <Select.Option value="hd">{`HD`}</Select.Option>
                                    </Select>
                                </div>


                            </>
                        )} */}


                        <div>
                            <span className="mr-2">{t`Count`}:</span>
                            <Select
                                onChange={(value) => setImageCount(value)}
                                value={imageCount}
                                style={{ width: 160 }}
                                disabled={generating}
                            >
                                <Select.Option value={1}>{`1`}</Select.Option>
                                <Select.Option value={2}>{`2`}</Select.Option>
                                <Select.Option value={3}>{`3`}</Select.Option>
                                <Select.Option value={4}>{`4`}</Select.Option>
                            </Select>
                        </div>


                        <Button
                            type="primary"
                            icon={generating ? <LoadingOutlined /> : <FileImageOutlined />}
                            onClick={handleGenerateImage}
                            loading={generating}
                            disabled={!prompt.trim() || generating}
                        >
                            {generating ? t`Generating...` : t`Generate Images`}
                        </Button>

                        {imageUrls.length > 0 && (
                            <Button onClick={clearImages}>
                                {t`Clear Images`}
                            </Button>
                        )}
                    </div>
                </div>

                {generating && (
                    <div className="mt-4 text-center">
                        <Spin tip={t`Generating images...`} />
                    </div>
                )}

                {imageUrls.length > 0 && (
                    <div className="mt-4">
                        <Divider orientation="left">{t`Generated Images`}</Divider>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {imageUrls.map((url, index) => (
                                <Card key={index} hoverable>
                                    <Image
                                        src={`data:image/png;base64,${url}`}
                                        alt={`Generated image ${index + 1}`}
                                        style={{ width: '100%', height: 'auto' }}
                                    />
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Space>
        </div>
    );
};

export default GenerateImagePanel;
