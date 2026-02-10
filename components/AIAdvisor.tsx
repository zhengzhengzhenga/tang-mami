
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Loader2, Bot, User } from 'lucide-react';
import { getHealthAdvisorResponse } from '../services/geminiService';

interface AIAdvisorProps {
  onBack: () => void;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "您好！我是您的甜护宝助手。今天有什么关于血糖管理的问题想咨询我吗？" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getHealthAdvisorResponse(userMsg, messages);
      setMessages(prev => [...prev, { role: 'bot', text: response || "抱歉，我暂时无法处理该请求，请重试。" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "连接 AI 助手失败，请检查您的网络。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">专家咨询</h2>
        <div className="w-10"></div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-rose-500 text-white rounded-tr-none shadow-md shadow-rose-100' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] flex gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="p-4 bg-white rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <Loader2 className="animate-spin text-indigo-400" size={18} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 p-2 bg-white rounded-3xl border border-slate-100 shadow-lg ring-1 ring-slate-50">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="咨询饮食、运动或症状..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4"
        />
        <button 
          onClick={handleSend}
          disabled={!input || isLoading}
          className="bg-indigo-500 text-white p-3 rounded-2xl disabled:opacity-50 active:scale-90 transition-all shadow-md shadow-indigo-100"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
        AI 建议仅供参考。临床决策请务必咨询您的产科医生。
      </p>
    </div>
  );
};

export default AIAdvisor;
