import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { message as antdMessage } from 'antd'; // 用于显示全局消息

interface ProgressState {
  progressPercent: number;
  progressMessage: string;
  showProgress: boolean;
  indexingLoading: boolean;
  startProgress: () => void;
  updateProgressFromSSE: (data: any) => void; // 用于处理SSE数据
  completeProgressSSE: (data: any) => void; // 用于处理SSE完成事件
  errorProgressSSE: (customMessage?: string, sseErrorData?: any) => void; // 用于处理SSE错误事件
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressState | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [indexingLoading, setIndexingLoading] = useState<boolean>(false);

  const startProgress = useCallback(() => {
    setShowProgress(true);
    setIndexingLoading(true);
    setProgressMessage('开始构建向量索引...');
    setProgressPercent(0);
  }, []);

  const updateProgressFromSSE = useCallback((data: any) => {
    if (data.type === 'total') {
      setProgressMessage(`共有 ${data.value} 个产品需要处理...`);
    } else if (data.type === 'progress') {
      const percent = data.total > 0 ? (data.processed / data.total) * 100 : 0;
      setProgressPercent(percent);
      setProgressMessage(`正在处理: ${data.processed} / ${data.total} (产品ID: ${data.current_product_id}, 状态: ${data.status})`);
    }
  }, []);

  const completeProgressSSE = useCallback((data: any) => {
    const messageText = data.message || '向量索引构建完成！';
    setProgressMessage(messageText);
    setProgressPercent(100);
    setIndexingLoading(false);
    antdMessage.success(messageText);
    if (data.errors && data.errors.length > 0) {
      data.errors.forEach((err: string) => antdMessage.error(err, 10));
    }
    // 可以在几秒后自动隐藏进度条，或者提供一个关闭按钮
    // setTimeout(() => setShowProgress(false), 5000);
  }, []);

  const errorProgressSSE = useCallback((customMessage?: string, sseErrorData?: any) => {
    let messageText = customMessage || '处理时发生错误。';
    if (sseErrorData && sseErrorData.message) {
      messageText = `错误: ${sseErrorData.message}`;
    }
    setProgressMessage(messageText);
    antdMessage.error(messageText);
    setIndexingLoading(false);
    // setShowProgress(false); // 决定是否自动隐藏
  }, []);


  const resetProgress = useCallback(() => {
    setProgressPercent(0);
    setProgressMessage('');
    setShowProgress(false);
    setIndexingLoading(false);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        progressPercent,
        progressMessage,
        showProgress,
        indexingLoading,
        startProgress,
        updateProgressFromSSE,
        completeProgressSSE,
        errorProgressSSE,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressState => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress 必须在 ProgressProvider 内部使用');
  }
  return context;
};