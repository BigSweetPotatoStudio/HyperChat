import React from "react";
import { WorkspaceSidebar } from "../../components/WorkspaceSidebar";
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
    <WorkspaceSidebar
      workspace={workspace}
      fileTreeData={fileTreeData}
      showHidden={showHidden}
      onShowHiddenChange={onShowHiddenChange}
      onRefreshFileTree={onRefreshFileTree}
      onFileSelect={onFileSelect}
    />
  );
};