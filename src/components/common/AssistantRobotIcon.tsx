import React from 'react';

interface AssistantRobotIconProps {
  className?: string;
}

export const AssistantRobotIcon: React.FC<AssistantRobotIconProps> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`block ${className}`}
    style={{
      backgroundColor: 'currentColor',
      maskImage: "url('/estudy-ai-icon.png')",
      maskMode: 'alpha',
      maskPosition: 'center',
      maskRepeat: 'no-repeat',
      maskSize: 'contain',
      WebkitMaskImage: "url('/estudy-ai-icon.png')",
      WebkitMaskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
    }}
  />
);
