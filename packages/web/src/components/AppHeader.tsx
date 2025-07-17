import React, { useState, useEffect } from 'react';
import { Tag, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { callElectron, msg_receive } from '../common/call';

interface UpdateData {
  info?: {
    version: string;
    releaseName: string;
    releaseNotes: string | Array<{ note: string }>;
  };
}

interface AppHeaderProps {
  style?: React.CSSProperties;
}

export function AppHeader({ style }: AppHeaderProps) {
  const navigate = useNavigate();
  const [updateData, setUpdateData] = useState<UpdateData>({});
  const { appSettings } = useAppSettings();

  // 监听更新消息
  useEffect(() => {
    const unsubscribe = msg_receive("message-from-main", (res: any) => {
      // 处理更新通知
      if (res.type == "UpdateMsg" && res.data.status == 1) {
        setUpdateData(res.data);
      }

      // 处理更新下载完成消息
      if (res.type == "UpdateMsg" && res.data.status == 4) {
        Modal.confirm({
          title: "Update",
          content:
            "The new version has been downloaded, do you want to restart and update?",
          icon: <ExclamationCircleFilled />,
          okText: "Restart And Update",
          onOk() {
            callElectron("quitAndInstall");
          },
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogoClick = () => {
    navigate("/Workspace");
  };

  const handleUpdateClick = () => {
    Modal.confirm({
      title: t`A new version is available`,
      width: "80%",
      style: {
        maxWidth: 1024,
      },
      content: (
        <div>
          <div>current version: {appSettings?.version || 'Unknown'}</div>
          <div>latest version: {updateData.info?.version}</div>
          {updateData.info?.releaseName != updateData.info?.version && (
            <div>title: {updateData.info?.releaseName}</div>
          )}
          <div>
            changelog:{" "}
            {typeof updateData.info?.releaseNotes == "string" ? (
              <div
                style={{ color: "gray" }}
                dangerouslySetInnerHTML={{
                  __html: updateData.info?.releaseNotes || '',
                }}
              ></div>
            ) : (
              updateData.info?.releaseNotes?.map((x, index) => {
                return (
                  <div
                    key={index}
                    dangerouslySetInnerHTML={{ __html: x.note }}
                  ></div>
                );
              })
            )}
          </div>
        </div>
      ),
      okText: t`Download And Update`,
      onOk: async () => {
        callElectron("checkUpdateDownload");
      },
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", ...style }}>
      <img
        onClick={handleLogoClick}
        src="./assets/favicon.ico"
        style={{ width: 32, height: 32, marginRight: 16, cursor: "pointer" }}
        alt="HyperChat Logo"
      />
      <span style={{ fontSize: 18, fontWeight: "bold" }}>
        HyperChat
        <span style={{ fontSize: 14, fontWeight: "normal", marginLeft: 8 }}>
          ({appSettings?.version || 'Unknown'})
          {/* 有新版本时显示更新标签 */}
          {updateData?.info && (
            <Tag
              className=" text-red-600"
              onClick={handleUpdateClick}
              style={{ cursor: 'pointer' }}
            >
              {`New`}
            </Tag>
          )}
        </span>
      </span>
    </div>
  );
}