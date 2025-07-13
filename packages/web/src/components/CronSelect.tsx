import React, { useState, useRef } from 'react';
import { Input, Dropdown, Menu, Button } from 'antd';
import { ClockCircleOutlined, DownOutlined } from '@ant-design/icons';
import { t } from '../i18n';

interface CronSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

// Cron 表达式模板
const CRON_TEMPLATES = [
  { value: "* * * * *", label: t`Every minute` },
  { value: "*/5 * * * *", label: t`Every 5 minutes` },
  { value: "*/15 * * * *", label: t`Every 15 minutes` },
  { value: "*/30 * * * *", label: t`Every 30 minutes` },
  { value: "0 * * * *", label: t`Every hour` },
  { value: "0 */2 * * *", label: t`Every 2 hours` },
  { value: "0 */6 * * *", label: t`Every 6 hours` },
  { value: "0 0 * * *", label: t`Every day at midnight` },
  { value: "0 8 * * *", label: t`Every day at 8:00 AM` },
  { value: "0 12 * * *", label: t`Every day at noon` },
  { value: "0 18 * * *", label: t`Every day at 6:00 PM` },
  { value: "0 0 * * 1", label: t`Every Monday at midnight` },
  { value: "0 0 * * 0", label: t`Every Sunday at midnight` },
  { value: "0 0 1 * *", label: t`On the 1st of every month` },
  { value: "0 0 15 * *", label: t`On the 15th of every month` },
];

/**
 * Cron 选择组件
 * 支持输入和从预设模板选择
 */
export const CronSelect: React.FC<CronSelectProps> = ({
  value,
  onChange,
  placeholder = t`Enter cron expression`,
  style,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const inputRef = useRef<any>(null);

  // 处理菜单项点击
  const handleMenuClick = (e: any) => {
    onChange?.(e.key);
    setDropdownVisible(false);
    // 聚焦输入框
    inputRef.current?.focus();
  };

  // 渲染下拉菜单
  const menu = (
    <Menu onClick={handleMenuClick} style={{ maxHeight: 300, overflow: 'auto' }}>
      {CRON_TEMPLATES.map((template) => (
        <Menu.Item key={template.value}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{template.label}</span>
            <span style={{ marginLeft: 16, color: '#888', fontSize: '12px' }}>
              {template.value}
            </span>
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      style={style}
      prefix={<ClockCircleOutlined />}
      suffix={
        <Dropdown
          overlay={menu}
          trigger={['click']}
          visible={dropdownVisible}
          onVisibleChange={setDropdownVisible}
          placement="bottomRight"
        >
          <Button
            type="text"
            size="small"
            icon={<DownOutlined />}
            style={{ marginRight: -8 }}
          />
        </Dropdown>
      }
    />
  );
};

export default CronSelect;