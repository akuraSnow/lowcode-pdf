import React, { useState } from 'react';
import { Button, Balloon } from '@alifd/next';
import { 
  PlusOutlined, 
  CloseOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import './styles.css';

interface ActionItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions: ActionItem[];
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ actions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="floating-action-button">
      {isExpanded && (
        <div className="fab-actions">
          {actions.map((action, index) => (
            <Balloon.Tooltip key={action.key} trigger={<Button
              type="primary"
              className="fab-action-item"
              style={{
                transitionDelay: `${index * 30}ms`
              }}
              onClick={() => {
                action.onClick();
                setIsExpanded(false);
              }}
            >
              {action.icon}
            </Button>} align="l">
              {action.label}
            </Balloon.Tooltip>
          ))}
        </div>
      )}
      
      <Button
        type="primary"
        className="fab-main-button"
        onClick={toggleExpand}
        size="large"
      >
        {isExpanded ? <CloseOutlined /> : <PlusOutlined />}
      </Button>
    </div>
  );
};
