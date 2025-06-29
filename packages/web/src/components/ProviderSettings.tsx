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
  ArrowLeftOutlined
} from '@ant-design/icons';

import { AI_MODELS, AIModelConfigItem, PROVIDER_CONFIGS, ProviderConfig } from '../../../core/src/shared/data.mjs';
import { ProviderManager } from '../../../core/src/shared/providers.mjs';
import { v4 } from 'uuid';
import { t } from '../i18n';

const { Title, Text } = Typography;
const { Option } = Select;

// 模型编辑接口
interface ModelFormData {
  name: string;
  model: string;
  type: 'llm' | 'embedding';
  toolMode: 'standard' | 'compatible';
  supportImage: boolean;
  supportTool: boolean;
  isDefault: boolean;
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
    <div className={`${className} rounded-full ${icon.bg} flex items-center justify-center ${icon.text} text-xs`}>
      {icon.content}
    </div>
  );
};

export function ProviderSettings() {
  const [apiKeyForm] = Form.useForm();
  const [modelForm] = Form.useForm();
  const [providerForm] = Form.useForm();

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
    const models = AI_MODELS.get().data.filter(model => model.provider === provider.value);
    return models.length;
  };

  // 检查提供商是否有API Key（从Provider数据读取，而非模型数据）
  const hasProviderApiKey = (provider: ProviderConfig): boolean => {
    return ProviderManager.hasProviderApiKey(provider.key);
  };

  // 获取提供商的模型列表
  const getProviderModels = (provider: ProviderConfig): AIModelConfigItem[] => {
    return AI_MODELS.get().data.filter(model => model.provider === provider.value);
  };

  // 刷新数据
  const refresh = async () => {
    await AI_MODELS.init();
    await PROVIDER_CONFIGS.init();

    // 获取所有可用的提供商
    const allProviders = ProviderManager.getAllProviders();
    setProviders(allProviders);
  };

  useEffect(() => {
    refresh();
  }, []);

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
      label: provider.label,
      baseURL: provider.baseURL,
      description: provider.description,
    });
    setIsProviderModalOpen(true);
  };

  // 删除提供商（内置则禁用，非内置则彻底删除并移除相关模型）
  const handleDeleteProvider = async (provider: ProviderConfig) => {
    if (provider.isBuiltIn) {
      // 禁用内置提供商（仅隐藏，不会删除数据）
      const success = ProviderManager.toggleBuiltinProvider(provider.key, true);
      if (success) {
        message.success(t`Provider disabled successfully`);
        await refresh();
      } else {
        message.error(t`Failed to disable provider`);
      }
    } else {
      // 删除自定义提供商及其下所有模型
      const success = ProviderManager.removeCustomProvider(provider.key);
      if (success) {
        // 过滤掉该提供商下的所有模型
        const currentModels = AI_MODELS.get().data;
        const filteredModels = currentModels.filter(model => model.provider !== provider.value);
        AI_MODELS.set({ data: filteredModels });
        await AI_MODELS.save();
        message.success(t`Provider and all related models deleted successfully`);
        await refresh();
      } else {
        message.error(t`Failed to delete provider`);
      }
    }
  };

  // 保存提供商（新增或编辑）
  // values: 表单提交的提供商信息
  const handleSaveProvider = async (values: any) => {
    setLoading(true);
    try {
      if (editingProvider) {
        // 编辑现有提供商
        const success = ProviderManager.updateCustomProvider(editingProvider.key, {
          label: values.label,
          baseURL: values.baseURL,
          description: values.description,
        });
        if (success) {
          message.success(t`Provider updated successfully`);
        } else {
          message.error(t`Failed to update provider`);
        }
      } else {
        // 添加新提供商
        ProviderManager.createOpenAICompatibilityProvider(
          values.label,
          v4(), // 使用UUID作为value
          values.baseURL,
          values.description
        );
        message.success(t`Provider added successfully`);
      }

      await PROVIDER_CONFIGS.save();
      await refresh();
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
    const apiKeyInfo = ProviderManager.getProviderApiKey(provider.key);

    apiKeyForm.setFieldsValue({
      provider: provider.value,
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
    if (!selectedProvider) return;
    setLoading(true);
    try {
      // 处理 baseURL
      const finalBaseURL = selectedProvider.value === 'other' ? values.baseURL : selectedProvider.baseURL;
      // 更新 provider 的 apiKey 和 baseURL
      const success = ProviderManager.updateProviderApiKey(selectedProvider.key, {
        apiKey: values.apiKey,
        baseURL: finalBaseURL,
      });
      if (success) {
        message.success(t`API Key configured successfully!`);
      } else {
        message.error(t`Failed to save API Key`);
      }
      await PROVIDER_CONFIGS.save();
      await refresh();
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
      isDefault: false,
    });
    setIsModelModalOpen(true);
  };

  const handleEditModel = (model: AIModelConfigItem) => {
    setEditingModel(model);
    modelForm.resetFields();
    modelForm.setFieldsValue({
      name: model.name,
      model: model.model,
      type: model.type,
      toolMode: model.toolMode,
      supportImage: model.supportImage,
      supportTool: model.supportTool,
      isDefault: false, // 暂时设为false，后续可以实现默认模型逻辑
    });
    setIsModelModalOpen(true);
  };

  const handleSaveModel = async (values: ModelFormData) => {
    if (!selectedProvider) return;

    setLoading(true);
    try {
      if (editingModel) {
        // 编辑现有模型
        const index = AI_MODELS.get().data.findIndex(m => m.key === editingModel.key);
        if (index >= 0) {
          AI_MODELS.get().data[index] = {
            ...AI_MODELS.get().data[index],
            name: values.name,
            model: values.model,
            type: values.type,
            toolMode: values.toolMode,
            supportImage: values.supportImage,
            supportTool: values.supportTool,
          };
        }
      } else {
        // 添加新模型 - 从 Provider 获取 apiKey 和 baseURL
        const providerApiInfo = ProviderManager.getProviderApiKey(selectedProvider.key);
        const newModel: AIModelConfigItem = {
          key: v4(),
          name: values.name,
          model: values.model,
          apiKey: providerApiInfo?.apiKey || '',
          baseURL: providerApiInfo?.baseURL || selectedProvider.baseURL,
          provider: selectedProvider.value,
          supportImage: values.supportImage,
          supportTool: values.supportTool,
          type: values.type,
          toolMode: values.toolMode,
          isStrict: false,
        };
        AI_MODELS.get().data.push(newModel);
      }

      await AI_MODELS.save();
      await refresh();

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
      const index = AI_MODELS.get().data.findIndex(m => m.key === model.key);
      if (index >= 0) {
        AI_MODELS.get().data.splice(index, 1);
        await AI_MODELS.save();
        await refresh();
        message.success(t`Model deleted successfully!`);
      }
    } catch (error) {
      message.error(t`Failed to delete model`);
      console.error('Delete failed:', error);
    }
  };

  // 模型表格列配置
  const modelColumns = [
    {
      title: t`Name`,
      dataIndex: 'name',
      key: 'name',
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
              bodyStyle={{ padding: '16px' }}
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
                  <Popconfirm
                    title={provider.isBuiltIn ? t`Disable this provider?` : t`Delete this provider?`}
                    description={provider.isBuiltIn ? t`This will hide the provider from the list` : t`This will permanently delete the provider and all its models`}
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
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
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
                  {hasProviderApiKey(provider) && (
                    <Tag color="green" className="mb-2">
                      {t`Active`}
                    </Tag>
                  )}
                  {!provider.isBuiltIn && (
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
          <Button
            icon={<SettingOutlined />}
            onClick={() => handleAddApiKey(selectedProvider!)}
          >
            {t`API Key`}
          </Button>
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

            {selectedProvider.value !== 'other' && (
              <Form.Item name="baseURL" style={{ display: 'none' }}>
                <Input />
              </Form.Item>
            )}

            {selectedProvider.value === 'other' && (
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
            name="name"
            label={t`Model Name`}
            rules={[{ required: true, message: t`Please enter model name` }]}
          >
            <Input placeholder={t`e.g., GPT-4 Turbo`} />
          </Form.Item>

          <Form.Item
            name="model"
            label={t`Model ID`}
            rules={[{ required: true, message: t`Please enter model ID` }]}
          >
            <Input placeholder={t`e.g., gpt-4-turbo-preview`} />
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supportImage" valuePropName="checked">
                <Switch /> <span className="ml-2">{t`Support Images`}</span>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supportTool" valuePropName="checked">
                <Switch /> <span className="ml-2">{t`Support Tools`}</span>
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
