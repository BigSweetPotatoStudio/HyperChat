import React from "react";
import { Card } from "antd";
import { FileTreeComponent } from "../../components/FileTreeComponent";
import { WorkspaceLeftPanelProps } from "./types";

export const WorkspaceLeftPanel: React.FC<WorkspaceLeftPanelProps> = ({
  workspace,
  fileTreeData,
  showHidden,
  onShowHiddenChange,
  onRefreshFileTree,
  onFileSelect,
}) => {
  return (
    <Card
      title="文件"
      size="small"
      className="h-full"
      styles={{ body: { padding: '8px', height: 'calc(100% - 40px)', overflow: 'auto' } }}
    >
      <FileTreeComponent
        workspace={workspace}
        initialData={fileTreeData || []}
        showHidden={showHidden}
        onShowHiddenChange={onShowHiddenChange}
        onRefresh={onRefreshFileTree}
        onFileSelect={onFileSelect}
      />
    </Card>
  );
};