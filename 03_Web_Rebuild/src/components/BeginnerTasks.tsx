import React from 'react';
import { MissionLog } from './MissionLog';

/**
 * 兼容性封装：导出 BeginnerTasks，底层重构使用全新的 MissionLog (智脑推演任务链)
 */
export const BeginnerTasks: React.FC = () => {
  return <MissionLog />;
};
