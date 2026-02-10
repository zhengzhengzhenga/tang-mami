
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 为浏览器环境提供 process.env 的基础兼容，防止服务调用时崩溃
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("无法找到 root 节点");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React 渲染出错:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #e11d48; text-align: center; font-family: sans-serif;">
        <h2 style="margin-bottom: 10px;">应用启动失败</h2>
        <p style="font-size: 14px; color: #64748b;">请检查控制台输出或确保网络连接正常。</p>
        <div style="margin-top: 20px; font-size: 12px; color: #94a3b8; word-break: break-all;">
          ${String(error)}
        </div>
      </div>
    `;
  }
}
