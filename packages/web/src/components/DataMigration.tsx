import React, { useState } from 'react';
import { 
  Modal, 
  Button, 
  Steps, 
  Card, 
  Space, 
  Alert, 
  Descriptions, 
  Switch, 
  Select, 
  Input,
  Typography,
  Divider,
  Spin,
  Result
} from 'antd';
import { 
  DatabaseOutlined, 
  SyncOutlined
} from '@ant-design/icons';
import { call } from '../common/call';
import { t } from '../i18n';

const { Title, Text } = Typography;
const { Option } = Select;


interface MigrationResult {
  success: boolean;
  message: string;
  migrated: number;
  skipped: number;
  errors: number;
  details: {
    migrated: string[];
    skipped: { name: string; reason: string }[];
    errors: { name: string; error: string }[];
  };
  modelKeyMapping?: Map<string, string>;
}

interface CompleteMigrationResult {
  success: boolean;
  message: string;
  aiModels: {
    migrated: number;
    skipped: number;
    errors: number;
  };
  mcpConfig: {
    migrated: number;
    skipped: number;
    errors: number;
  };
  agents: {
    migrated: number;
    skipped: number;
    errors: number;
  };
  details: {
    aiModels: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
    mcpConfig: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
    agents: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
  };
}

interface DataMigrationProps {
  visible: boolean;
  onClose: () => void;
}

export function DataMigration({ visible, onClose }: DataMigrationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [force, setForce] = useState(false);
  const [targetScope, setTargetScope] = useState<'global' | 'workspace'>('global');
  const [customPaths, setCustomPaths] = useState({
    agent: '',
    model: '',
    mcp: ''
  });
  const [migrationResults, setMigrationResults] = useState<{
    complete?: CompleteMigrationResult;
    aiModels?: MigrationResult;
    agents?: MigrationResult;
    mcpConfig?: MigrationResult;
  }>({});

  const defaultPaths = {
    agent: '~/Documents/HyperChat/gpts_list.json',
    model: '~/Documents/HyperChat/gpt_models.json',
    mcp: '~/Documents/HyperChat/mcp.json'
  };

  const handleReset = () => {
    setCurrentStep(0);
    setMigrationResults({});
    setDryRun(true);
    setForce(false);
    setTargetScope('global');
    setCustomPaths({ agent: '', model: '', mcp: '' });
  };

  const handleMigrateAll = async () => {
    setLoading(true);
    try {
      const result = await call('migration.migrateAll', {
        agentSourcePath: customPaths.agent || undefined,
        modelSourcePath: customPaths.model || undefined,
        mcpSourcePath: customPaths.mcp || undefined,
        targetScope,
        dryRun,
        force
      }) as CompleteMigrationResult;

      setMigrationResults({ complete: result });
      setCurrentStep(dryRun ? 1 : 2);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setLoading(false);
    }
  };


  const renderConfigStep = () => (
    <Card title={t`Migration Configuration`}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 基本设置 */}
        <div>
          <Title level={5}>{t`Basic Settings`}</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>{t`Mode`}:</Text>
              <Space style={{ marginLeft: 16 }}>
                <Switch 
                  checked={dryRun} 
                  onChange={setDryRun}
                  checkedChildren={t`Dry Run`}
                  unCheckedChildren={t`Real Migration`}
                />
                <Text type="secondary">
                  {dryRun ? t`Preview only, no actual changes` : t`Perform actual migration`}
                </Text>
              </Space>
            </div>
            
            <div>
              <Text strong>{t`Force Override`}:</Text>
              <Space style={{ marginLeft: 16 }}>
                <Switch 
                  checked={force} 
                  onChange={setForce}
                />
                <Text type="secondary">
                  {t`Override existing items with same name`}
                </Text>
              </Space>
            </div>

            <div>
              <Text strong>{t`Target Scope`}:</Text>
              <Select 
                value={targetScope} 
                onChange={setTargetScope}
                style={{ marginLeft: 16, width: 150 }}
              >
                <Option value="global">{t`Global`}</Option>
                <Option value="workspace">{t`Workspace`}</Option>
              </Select>
            </div>
          </Space>
        </div>

        <Divider />

        {/* 文件路径设置 */}
        <div>
          <Title level={5}>{t`Source File Paths`}</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>{t`Agent Data`}:</Text>
              <Input
                placeholder={defaultPaths.agent}
                value={customPaths.agent}
                onChange={(e) => setCustomPaths(prev => ({ ...prev, agent: e.target.value }))}
                style={{ marginTop: 4 }}
              />
            </div>
            
            <div>
              <Text strong>{t`AI Models Data`}:</Text>
              <Input
                placeholder={defaultPaths.model}
                value={customPaths.model}
                onChange={(e) => setCustomPaths(prev => ({ ...prev, model: e.target.value }))}
                style={{ marginTop: 4 }}
              />
            </div>

            <div>
              <Text strong>{t`MCP Config Data`}:</Text>
              <Input
                placeholder={defaultPaths.mcp}
                value={customPaths.mcp}
                onChange={(e) => setCustomPaths(prev => ({ ...prev, mcp: e.target.value }))}
                style={{ marginTop: 4 }}
              />
            </div>
          </Space>
        </div>

        <Alert
          message={t`Migration Information`}
          description={t`This will migrate your old HyperChat data (AI models, MCP configs, and Agents) to the new format. Make sure to backup your data before proceeding.`}
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );

  const renderResultStep = () => {
    const result = migrationResults.complete;
    if (!result) return null;

    const totalMigrated = result.aiModels.migrated + result.mcpConfig.migrated + result.agents.migrated;
    const totalSkipped = result.aiModels.skipped + result.mcpConfig.skipped + result.agents.skipped;
    const totalErrors = result.aiModels.errors + result.mcpConfig.errors + result.agents.errors;

    return (
      <Card title={dryRun ? t`Migration Preview` : t`Migration Results`}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 总体结果 */}
          <Result
            status={result.success ? "success" : "warning"}
            title={result.message}
            subTitle={
              <Space direction="vertical">
                <Text>
                  {`${t`Total migrated`}: ${totalMigrated}, ${t`Skipped`}: ${totalSkipped}, ${t`Errors`}: ${totalErrors}`}
                </Text>
                {dryRun && <Text type="secondary">{t`This is a preview. Enable "Real Migration" to perform actual changes.`}</Text>}
              </Space>
            }
          />

          {/* 详细统计 */}
          <div>
            <Title level={5}>{t`Migration Details`}</Title>
            <Descriptions bordered size="small">
              <Descriptions.Item label={t`AI Models`} span={1}>
                <Space>
                  <Text type="success">{`${t`Migrated`}: ${result.aiModels.migrated}`}</Text>
                  <Text type="warning">{`${t`Skipped`}: ${result.aiModels.skipped}`}</Text>
                  <Text type="danger">{`${t`Errors`}: ${result.aiModels.errors}`}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t`MCP Config`} span={1}>
                <Space>
                  <Text type="success">{`${t`Migrated`}: ${result.mcpConfig.migrated}`}</Text>
                  <Text type="warning">{`${t`Skipped`}: ${result.mcpConfig.skipped}`}</Text>
                  <Text type="danger">{`${t`Errors`}: ${result.mcpConfig.errors}`}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t`Agents`} span={1}>
                <Space>
                  <Text type="success">{`${t`Migrated`}: ${result.agents.migrated}`}</Text>
                  <Text type="warning">{`${t`Skipped`}: ${result.agents.skipped}`}</Text>
                  <Text type="danger">{`${t`Errors`}: ${result.agents.errors}`}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 错误详情 */}
          {totalErrors > 0 && (
            <Alert
              message={t`Migration Errors`}
              description={
                <div>
                  {result.details.aiModels.errors.map((error, idx) => (
                    <div key={`ai-${idx}`}>
                      {`${t`AI Model Error`}: ${error.name} - ${error.error}`}
                    </div>
                  ))}
                  {result.details.mcpConfig.errors.map((error, idx) => (
                    <div key={`mcp-${idx}`}>
                      {`${t`MCP Error`}: ${error.name} - ${error.error}`}
                    </div>
                  ))}
                  {result.details.agents.errors.map((error, idx) => (
                    <div key={`agent-${idx}`}>
                      {`${t`Agent Error`}: ${error.name} - ${error.error}`}
                    </div>
                  ))}
                </div>
              }
              type="error"
              showIcon
            />
          )}
        </Space>
      </Card>
    );
  };

  const steps = [
    {
      title: t`Configure`,
      content: renderConfigStep(),
    },
    {
      title: t`Preview`,
      content: renderResultStep(),
    },
    {
      title: t`Complete`,
      content: renderResultStep(),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DatabaseOutlined />
          {t`Data Migration`}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>
            {t`Close`}
          </Button>
          
          {currentStep === 0 && (
            <Button 
              type="primary" 
              loading={loading}
              onClick={handleMigrateAll}
              icon={<SyncOutlined />}
            >
              {dryRun ? t`Preview Migration` : t`Start Migration`}
            </Button>
          )}
          
          {currentStep === 1 && dryRun && (
            <Space>
              <Button onClick={handleReset}>
                {t`Back to Configure`}
              </Button>
              <Button 
                type="primary" 
                loading={loading}
                onClick={() => {
                  setDryRun(false);
                  handleMigrateAll();
                }}
                icon={<SyncOutlined />}
              >
                {t`Execute Migration`}
              </Button>
            </Space>
          )}

          {currentStep === 2 && (
            <Button type="primary" onClick={handleReset}>
              {t`Start New Migration`}
            </Button>
          )}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Steps current={currentStep} items={steps.map(step => ({ title: step.title }))} />
        <div style={{ marginTop: 24 }}>
          {steps[currentStep].content}
        </div>
      </Spin>
    </Modal>
  );
}