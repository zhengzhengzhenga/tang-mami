
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Mounting Failed:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif;">
        <h2 style="color: #f43f5e;">应用启动失败</h2>
        <p style="color: #64748b;">无法加载组件，请刷新页面重试。</p>
        <pre style="margin-top: 20px; padding: 10px; background: #f1f5f9; border-radius: 8px; font-size: 12px; overflow-x: auto;">${String(error)}</pre>
      </div>
    `;
  }
}
