import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  message,
  Modal,
  Table,
  Popconfirm,
  Select,
  Switch,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

import type { AIModelConfigItem, ProviderConfig, KnownProvider } from '@hyperchat/shared/jsonSchemas/appSettingsSchema';
import { useAISettings } from "../contexts/AppSettingsContext";
import { t } from '../i18n';

const { Title, Text } = Typography;
const { Option } = Select;

// 模型编辑接口
interface ModelFormData {
  name?: string;
  model: string;
  type: 'llm' | 'embedding';
  toolMode: 'standard' | 'compatible';
  supportImage: boolean;
  supportTool: boolean;
  // Unknown provider specific fields
  apiKey?: string;
  baseURL?: string;
}

// 提供商图标组件
const ProviderIcon: React.FC<{ iconType: string; className?: string }> = ({ iconType, className = "w-6 h-6" }) => {
  const iconMap: Record<string, { bg: string; text: string; content: string }> = {
    openai: { bg: 'bg-[#1a1a1a]', text: 'text-white', content: 'O' },
    anthropic: { bg: 'bg-[#D2691E]', text: 'text-white', content: 'A' },
    openrouter: { bg: 'bg-[#5d5fef]', text: 'text-white', content: 'O' },
    gemini: { bg: 'bg-[#4285f4]', text: 'text-white', content: 'G' },
    qwen: { bg: 'bg-[#ff6a00]', text: 'text-white', content: 'Q' },
    deepseek: { bg: 'bg-blue-600', text: 'text-white', content: '深' },
    doubao: { bg: 'bg-[#1890ff]', text: 'text-white', content: '豆' },
    xai: { bg: 'bg-[#1da1f2]', text: 'text-white', content: 'X' },
    glm: { bg: 'bg-[#2c5aa0]', text: 'text-white', content: '智' },
    ollama: { bg: 'bg-[#4ade80]', text: 'text-white', content: '🦙' },
    custom: { bg: 'bg-[#6b7280]', text: 'text-white', content: '其' },
  };

  const icon = iconMap[iconType] || iconMap.custom;

  return (
    <div className={`${className} rounded-full ${icon?.bg || 'bg-gray-500'} flex items-center justify-center ${icon?.text || 'text-white'} text-xs`}>
      {icon?.content || '?'}
    </div>
  );
};

export function ProviderSettings() {
  const [apiKeyForm] = Form.useForm();
  const [modelForm] = Form.useForm();
  const [providerForm] = Form.useForm();

  // 从 Context 获取 AI 设置
  const { aiSettings, updateAISettings } = useAISettings();

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [view, setView] = useState<'providers' | 'models'>('providers');

  // Modal states
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfigItem | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);

  const [loading, setLoading] = useState(false);

  // 获取提供商的模型数量
  const getProviderModelCount = (provider: ProviderConfig): number => {
    if (!aiSettings) return 0;
    const models = aiSettings.models?.filter(model => model.provider === provider.key) || [];
    return models.length;
  };

  // 检查提供商是否有API Key（从Provider数据读取，而非模型数据）
  const hasProviderApiKey = (provider: ProviderConfig): boolean => {
    if (!aiSettings) return false;
    
    // Unknown 提供商总是允许进入，因为每个模型单独配置 API Key
    if (provider.key === 'unknown') {
      return true;
    }
    
    if (provider.isBuiltIn && provider.key) {
      return !!aiSettings.builtinApiKeys?.[provider.key]?.apiKey;
    } else {
      return !!provider.apiKey;
    }
  };

  // 获取提供商的模型列表
  const getProviderModels = (provider: ProviderConfig): AIModelConfigItem[] => {
    if (!aiSettings) return [];
    return aiSettings.models?.filter(model => model.provider === provider.key) || [];
  };

  // 刷新数据
  const refresh = async () => {
    try {
      if (!aiSettings) return;
      
      // 获取所有提供商（内置 + 自定义）
      const builtinProviders = getBuiltinProviders();
      const allProviders = [...builtinProviders, ...(aiSettings.customProviders || [])];
      setProviders(allProviders);
    } catch (error) {
      console.error('刷新配置失败:', error);
    }
  };

  // 获取内置提供商列表
  const getBuiltinProviders = (): ProviderConfig[] => {
    return [
      { key: 'openai', label: 'OpenAI', baseURL: 'https://api.openai.com/v1', icon: 'openai', description: 'OpenAI GPT models', hasApiKey: true, isBuiltIn: true },
      { key: 'anthropic', label: 'Anthropic', baseURL: 'https://api.anthropic.com/v1', icon: 'anthropic', description: 'Claude models', hasApiKey: true, isBuiltIn: true },
      { key: 'openrouter', label: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', icon: 'openrouter', description: 'Multi-provider AI gateway', hasApiKey: true, isBuiltIn: true },
      { key: 'gemini', label: 'Google Gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta', icon: 'gemini', description: 'Google Gemini models', hasApiKey: true, isBuiltIn: true },
      { key: 'qwen', label: 'Qwen', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', icon: 'qwen', description: 'Alibaba Qwen models', hasApiKey: true, isBuiltIn: true },
      { key: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com', icon: 'deepseek', description: 'DeepSeek models', hasApiKey: true, isBuiltIn: true },
      { key: 'doubao', label: 'Doubao', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', icon: 'doubao', description: 'ByteDance Doubao models', hasApiKey: true, isBuiltIn: true },
      { key: 'xai', label: 'xAI', baseURL: 'https://api.x.ai/v1', icon: 'xai', description: 'xAI Grok models', hasApiKey: true, isBuiltIn: true },
      { key: 'glm', label: 'GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4', icon: 'glm', description: 'Zhipu GLM models', hasApiKey: true, isBuiltIn: true },
      { key: 'ollama', label: 'Ollama', baseURL: 'http://localhost:11434/v1', icon: 'ollama', description: 'Local Ollama models', hasApiKey: false, isBuiltIn: true },
      { key: 'unknown', label: 'Unknown Provider', baseURL: '', icon: 'custom', description: 'OpenAI compatible provider, configure apiKey and baseURL per model', hasApiKey: false, isBuiltIn: true }
    ];
  };

  useEffect(() => {
    refresh();
  }, [aiSettings]);

  // 处理提供商点击 - 如果有API Key则进入模型管理，否则配置API Key
  const handleProviderClick = (provider: ProviderConfig) => {
    if (hasProviderApiKey(provider)) {
      setSelectedProvider(provider);
      setView('models');
    } else {
      handleAddApiKey(provider);
    }
  };

  // 添加自定义提供商
  const handleAddProvider = () => {
    setEditingProvider(null);
    providerForm.resetFields();
    setIsProviderModalOpen(true);
  };

  // 编辑提供商
  const handleEditProvider = (provider: ProviderConfig) => {
    if (provider.isBuiltIn) {
      message.error(t`Built-in providers cannot be edited`);
      return;
    }
    setEditingProvider(provider);
    providerForm.setFieldsValue({
      key: provider.key,
      label: provider.label,
      baseURL: provider.baseURL,
      description: provider.description,
    });
    setIsProviderModalOpen(true);
  };

  // 删除提供商（内置不能删除，非内置则彻底删除并移除相关模型）
  const handleDeleteProvider = async (provider: ProviderConfig) => {
    if (provider.isBuiltIn) {
      // 内置提供商不能删除
      message.error(t`Built-in providers cannot be deleted`);
      return;
    }

    try {
      // 删除自定义提供商及其下所有模型
      if (!aiSettings) return;
      
      const updatedCustomProviders = aiSettings.customProviders?.filter(p => p.key !== provider.key) || [];
      const updatedModels = aiSettings.models?.filter(model => model.provider !== provider.key) || [];
      
      await updateAISettings({
        customProviders: updatedCustomProviders,
        models: updatedModels
      });
      
      message.success(t`Provider and all related models deleted successfully`);
      // Context 会自动更新 aiSettings，只需要更新 providers 状态
      refresh();
    } catch (error) {
      message.error(t`Failed to delete provider`);
      console.error('Delete provider failed:', error);
    }
  };

  // 保存提供商（新增或编辑）
  // values: 表单提交的提供商信息
  const handleSaveProvider = async (values: any) => {
    setLoading(true);
    try {
      if (!aiSettings) return;
      
      if (editingProvider) {
        // 编辑现有提供商
        const updatedCustomProviders = aiSettings.customProviders?.map(p => 
          p.key === editingProvider.key
            ? { ...p, label: values.label, baseURL: values.baseURL, description: values.description }
            : p
        ) || [];
        
        await updateAISettings({
          customProviders: updatedCustomProviders
        });
        
        message.success(t`Provider updated successfully`);
      } else {
        // 添加新提供商
        const newProvider: ProviderConfig = {
          key: values.key as KnownProvider,
          label: values.label,
          baseURL: values.baseURL,
          description: values.description,
          hasApiKey: true,
          isBuiltIn: false
        };
        
        const updatedCustomProviders = [...(aiSettings.customProviders || []), newProvider];
        
        await updateAISettings({
          customProviders: updatedCustomProviders
        });
        
        message.success(t`Provider added successfully`);
      }

      refresh();
      setIsProviderModalOpen(false);
    } catch (error) {
      message.error(t`Failed to save provider`);
      console.error('Save provider failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 配置API Key
  const handleAddApiKey = (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    apiKeyForm.resetFields();

    // 获取已保存的 API Key 信息
    let apiKeyInfo: { apiKey?: string; baseURL?: string } | null = null;
    if (aiSettings) {
      if (provider.isBuiltIn && provider.key) {
        apiKeyInfo = aiSettings.builtinApiKeys?.[provider.key] || null;
      } else {
        apiKeyInfo = { apiKey: provider.apiKey, baseURL: provider.baseURL };
      }
    }

    apiKeyForm.setFieldsValue({
      provider: provider.key,
      baseURL: apiKeyInfo?.baseURL || provider.baseURL,
      apiKey: apiKeyInfo?.apiKey || '',
    });
    setIsApiKeyModalOpen(true);
  };

  /**
   * 保存API Key配置到对应的Provider（而不是模型）
   * @param values 表单提交的API Key和BaseURL
   */
  const handleSaveApiKey = async (values: any) => {
    if (!selectedProvider || !aiSettings) return;
    setLoading(true);
    try {
      if (selectedProvider.isBuiltIn) {
        // 内置提供商，保存到 builtinApiKeys
        const finalBaseURL = values.baseURL || selectedProvider.baseURL;
        const updatedBuiltinApiKeys = {
          ...(aiSettings.builtinApiKeys || {}),
          [selectedProvider.key!]: {
            apiKey: values.apiKey,
            baseURL: finalBaseURL
          }
        };
        
        await updateAISettings({
          builtinApiKeys: updatedBuiltinApiKeys
        });
      } else {
        // 自定义提供商，更新提供商配置
        const updatedCustomProviders = aiSettings.customProviders?.map(p =>
          p.key === selectedProvider.key
            ? { ...p, apiKey: values.apiKey }
            : p
        ) || [];
        
        await updateAISettings({
          customProviders: updatedCustomProviders
        });
      }
      
      message.success(t`API Key configured successfully!`);
      refresh();
      setIsApiKeyModalOpen(false);
    } catch (error) {
      message.error(t`Failed to save configuration`);
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加/编辑模型
  const handleAddModel = () => {
    setEditingModel(null);
    modelForm.resetFields();
    modelForm.setFieldsValue({
      type: 'llm',
      toolMode: 'standard',
      supportImage: true,
      supportTool: true,
    });
    setIsModelModalOpen(true);
  };

  const handleEditModel = (model: AIModelConfigItem) => {
    setEditingModel(model);
    modelForm.resetFields();
    const formValues: any = {
      name: model.name,
      model: model.model,
      type: model.type,
      toolMode: model.toolMode,
      supportImage: model.supportImage ?? true, // 默认值为 true
      supportTool: model.supportTool ?? true, // 默认值为 true
    };
    
    // 对于 unknown 提供商，添加 apiKey 和 baseURL 字段
    if (model.provider === 'unknown') {
      formValues.apiKey = model.apiKey || '';
      formValues.baseURL = model.baseURL || '';
    }
    
    modelForm.setFieldsValue(formValues);
    setIsModelModalOpen(true);
  };

  const handleSaveModel = async (values: ModelFormData) => {
    if (!selectedProvider || !aiSettings) return;

    setLoading(true);
    try {
      // 如果名称为空，使用模型ID作为名称
      const finalName = values.name?.trim() || values.model;

      let updatedModels = [...(aiSettings.models || [])];

      if (editingModel) {
        // 编辑现有模型
        const index = updatedModels.findIndex(m => m.key === editingModel.key);
        if (index >= 0) {
          const existingModel = updatedModels[index];
          if (!existingModel) return;
          const updatedModel: AIModelConfigItem = {
            ...existingModel,
            name: finalName,
            model: values.model,
            type: values.type,
            toolMode: values.toolMode,
            supportImage: values.supportImage,
            supportTool: values.supportTool,
            // Update apiKey and baseURL for unknown provider
            apiKey: selectedProvider.key === 'unknown' ? (values.apiKey || '') : existingModel.apiKey,
            baseURL: selectedProvider.key === 'unknown' ? (values.baseURL || '') : existingModel.baseURL,
          };

          updatedModels[index] = updatedModel;
        }
      } else {
        // 添加新模型
        const newModel: AIModelConfigItem = {
          key: selectedProvider.key + ':' + values.model, // 使用提供商key和模型id生成唯一key
          name: finalName,
          model: values.model,
          apiKey: selectedProvider.key === 'unknown' ? (values.apiKey || '') : '', // Unknown provider uses per-model apiKey
          baseURL: selectedProvider.key === 'unknown' ? (values.baseURL || '') : '', // Unknown provider uses per-model baseURL
          provider: selectedProvider.key as KnownProvider,
          supportImage: values.supportImage,
          supportTool: values.supportTool,
          type: values.type,
          toolMode: values.toolMode,
        };
        updatedModels.push(newModel);
      }

      await updateAISettings({
        models: updatedModels
      });
      
      refresh();
      setIsModelModalOpen(false);
      message.success(editingModel ? t`Model updated successfully!` : t`Model added successfully!`);
    } catch (error) {
      message.error(t`Failed to save model`);
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除模型
  const handleDeleteModel = async (model: AIModelConfigItem) => {
    try {
      if (!aiSettings) return;
      
      const updatedModels = aiSettings.models?.filter(m => m.key !== model.key) || [];
      
      await updateAISettings({
        models: updatedModels
      });
      
      refresh();
      message.success(t`Model deleted successfully!`);
    } catch (error) {
      message.error(t`Failed to delete model`);
      console.error('Delete failed:', error);
    }
  };

  // 设置默认模型
  const handleSetDefaultModel = async (model: AIModelConfigItem) => {
    try {
      if (!aiSettings) return;
      
      await updateAISettings({
        defaultModel: model.key
      });
      
      refresh();
      message.success(t`Default model set successfully!`);
    } catch (error) {
      message.error(t`Failed to set default model`);
      console.error('Set default failed:', error);
    }
  };

  // 模型表格列配置
  const modelColumns = [
    {
      title: t`Name`,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AIModelConfigItem) => (
        <Space>
          <span>{name}</span>
          {aiSettings?.defaultModel === record.key && <Tag color="gold">{t`Default`}</Tag>}
        </Space>
      ),
    },
    {
      title: t`Model`,
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: t`Type`,
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'llm' ? 'blue' : 'green'}>
          {type?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: t`Features`,
      key: 'features',
      render: (_: any, record: AIModelConfigItem) => (
        <Space>
          {record.supportImage && <Tag color="purple">{t`Image`}</Tag>}
          {record.supportTool && <Tag color="cyan">{t`Tools`}</Tag>}
        </Space>
      ),
    },
    {
      title: t`Actions`,
      key: 'actions',
      render: (_: any, record: AIModelConfigItem) => (
        <Space>
          {aiSettings?.defaultModel !== record.key && record.type === "llm" && (
            <Button
              size="small"
              type="link"
              onClick={() => handleSetDefaultModel(record)}
            >
              {t`Set Default`}
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditModel(record)}
          >
            {t`Edit`}
          </Button>
          <Popconfirm
            title={t`Are you sure to delete this model?`}
            onConfirm={() => handleDeleteModel(record)}
            okText={t`Yes`}
            cancelText={t`No`}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              {t`Delete`}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 渲染提供商视图
  const renderProvidersView = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={3}>{t`AI Provider Settings`}</Title>
          <Text type="secondary">
            {t`Configure API keys for different AI providers. Click a provider to manage its models.`}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddProvider}
        >
          {t`Add Provider`}
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {providers.map((provider) => (
          <Col xs={24} sm={12} md={8} lg={6} key={provider.key}>
            <Card
              className="h-full"
              hoverable
              size='small'
              styles={{ body: { padding: '16px' } }}
              extra={
                <Space>
                  {!provider.isBuiltIn && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProvider(provider);
                      }}
                    />
                  )}
                  {!provider.isBuiltIn && (
                    <Popconfirm
                      title={t`Delete this provider?`}
                      description={t`This will permanently delete the provider and all its models`}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteProvider(provider);
                      }}
                      okText={t`Yes`}
                      cancelText={t`No`}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        title={t`Delete Provider`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  )}
                </Space>
              }
              onClick={() => handleProviderClick(provider)}
              actions={[
                hasProviderApiKey(provider) ? (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckOutlined className="mr-1" />
                    <span>{getProviderModelCount(provider)} {t`models`}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500">
                    <PlusOutlined className="mr-1" />
                    <span>{t`Add API Key`}</span>
                  </div>
                )
              ]}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <ProviderIcon iconType={provider.icon || 'custom'} />
                </div>
                <Title level={5} className="mb-2">{provider.label}</Title>
                <Text type="secondary" className="text-sm mb-3">
                  {provider.description}
                </Text>
                <div className='flex flex-wrap justify-center gap-2'>
                  {
                    // hasProviderApiKey(provider) && (
                    //   <Tag color="green" className="mb-2">
                    //     {t`Active`}
                    //   </Tag>
                    // )
                  }
                  {provider.isBuiltIn ? (
                    <Tag color="blue" className="mb-2">
                      {t`Built-in`}
                    </Tag>
                  ) : (
                    <Tag color="orange" className="mb-2">
                      {t`Custom`}
                    </Tag>
                  )}
                </div>

              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  // 渲染模型管理视图
  const renderModelsView = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setView('providers')}
            className="mr-4"
          />
          <div className="flex items-center">
            {selectedProvider?.icon}
            <Title level={3} className="ml-2 mb-0">
              {selectedProvider?.label} {t`Models`}
            </Title>
          </div>
        </div>
        <Space>
          {/* Unknown 提供商不显示 API Key 按钮，因为每个模型单独配置 */}
          {selectedProvider?.key !== 'unknown' && (
            <Button
              icon={<SettingOutlined />}
              onClick={() => handleAddApiKey(selectedProvider!)}
            >
              {t`API Key`}
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddModel}
          >
            {t`Add Model`}
          </Button>
        </Space>
      </div>

      <Table
        columns={modelColumns}
        dataSource={selectedProvider ? getProviderModels(selectedProvider) : []}
        rowKey="key"
        pagination={false}
        locale={{
          emptyText: t`No models configured. Click "Add Model" to create one.`
        }}
      />
    </div>
  );

  return (
    <div className="p-6">
      {view === 'providers' ? renderProvidersView() : renderModelsView()}

      {/* API Key 配置 Modal */}
      <Modal
        title={selectedProvider ? `${t`Configure`} ${selectedProvider.label} API Key` : ''}
        open={isApiKeyModalOpen}
        onCancel={() => setIsApiKeyModalOpen(false)}
        footer={null}
        width={500}
      >
        {selectedProvider && (
          <Form
            form={apiKeyForm}
            layout="vertical"
            onFinish={handleSaveApiKey}
            autoComplete="off"
          >
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                {selectedProvider.icon}
                <Title level={5} className="ml-2 mb-0">{selectedProvider.label}</Title>
              </div>
              <Text type="secondary">{selectedProvider.description}</Text>
            </div>

            <Form.Item name="provider" style={{ display: 'none' }}>
              <Input />
            </Form.Item>

            {selectedProvider.isBuiltIn && (
              <Form.Item 
                name="baseURL" 
                label={t`Base URL`}
                rules={[
                  { type: 'url', message: t`Please enter a valid URL` }
                ]}
              >
                <Input placeholder={t`e.g., https://api.example.com/v1`} />
              </Form.Item>
            )}

            {!selectedProvider.isBuiltIn && (
              <Form.Item
                name="baseURL"
                label={t`Base URL`}
                rules={[
                  { required: true, message: t`Please enter Base URL` },
                  { type: 'url', message: t`Please enter a valid URL` }
                ]}
              >
                <Input
                  placeholder={t`e.g., https://api.example.com/v1`}
                />
              </Form.Item>
            )}

            <Form.Item
              name="apiKey"
              label={t`API Key`}
              rules={[
                { required: true, message: t`Please enter API Key` },
              ]}
            >
              <Input.Password
                placeholder={t`Enter your API Key`}
                autoComplete="new-password"
              />
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsApiKeyModalOpen(false)}>
                {t`Cancel`}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t`Save`}
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* 模型编辑 Modal */}
      <Modal
        title={editingModel ? t`Edit Model` : t`Add Model`}
        open={isModelModalOpen}
        onCancel={() => setIsModelModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={modelForm}
          layout="vertical"
          onFinish={handleSaveModel}
          autoComplete="off"
        >
          <Form.Item
            name="model"
            label={t`Model ID`}
            rules={[{ required: true, message: t`Please enter model ID` }]}
          >
            <Input placeholder={t`e.g., gpt-4.1`} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t`Model Name`}
          >
            <Input placeholder={t`Optional, will use Model ID if empty`} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t`Model Type`}
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio.Button value="llm">LLM</Radio.Button>
              <Radio.Button value="embedding">Embedding</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="toolMode"
            label={t`Tool Mode`}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="standard">{t`Standard`}</Option>
              <Option value="compatible">{t`Compatible`}</Option>
            </Select>
          </Form.Item>

          {/* Unknown provider specific fields */}
          {selectedProvider?.key === 'unknown' && (
            <>
              <Form.Item
                name="apiKey"
                label={t`API Key`}
                rules={[{ required: true, message: t`Please enter API Key` }]}
              >
                <Input.Password placeholder={t`Enter API Key for this model`} />
              </Form.Item>
              <Form.Item
                name="baseURL"
                label={t`Base URL`}
                rules={[
                  { required: true, message: t`Please enter Base URL` },
                  { type: 'url', message: t`Please enter a valid URL` }
                ]}
              >
                <Input placeholder={t`e.g., https://api.example.com/v1`} />
              </Form.Item>
            </>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="supportImage" label={t`Support Images`} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supportTool" label={t`Support Tools`} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>


          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModelModalOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingModel ? t`Update` : t`Add`}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 提供商管理 Modal */}
      <Modal
        title={editingProvider ? t`Edit Provider` : t`Add Provider`}
        open={isProviderModalOpen}
        onCancel={() => setIsProviderModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form
          form={providerForm}
          layout="vertical"
          onFinish={handleSaveProvider}
          autoComplete="off"
        >
          <Form.Item
            name="key"
            label={t`Provider Key`}
            help={editingProvider ? t`Provider key cannot be changed` : t`Unique identifier for this provider (letters and numbers only)`}
            rules={[
              { required: true, message: t`Please enter provider key` },
              {
                pattern: /^[a-zA-Z0-9]+$/,
                message: t`Only letters and numbers are allowed`
              },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  // 检查key是否唯一（编辑时排除自己）
                  const existingProvider = providers.find(p =>
                    p.key === value && (!editingProvider || p.key !== editingProvider.key)
                  );
                  if (existingProvider) {
                    throw new Error(t`Provider key already exists`);
                  }
                }
              }
            ]}
          >
            <Input
              placeholder={t`e.g., custom-openai`}
              disabled={!!editingProvider} // 编辑时禁用key修改
            />
          </Form.Item>
          <Form.Item
            name="label"
            label={t`Provider Name`}
            rules={[{ required: true, message: t`Please enter provider name` }]}
          >
            <Input placeholder={t`e.g., Custom OpenAI`} />
          </Form.Item>
          <Form.Item
            name="baseURL"
            label={t`Base URL`}
            rules={[
              { required: true, message: t`Please enter Base URL` },
              { type: 'url', message: t`Please enter a valid URL` }
            ]}
          >
            <Input
              placeholder={t`e.g., https://api.example.com/v1`}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t`Description`}
          >
            <Input.TextArea
              placeholder={t`e.g., My custom OpenAI provider`}
              rows={2}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsProviderModalOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingProvider ? t`Update` : t`Add`}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
