import React, { useState } from 'react';
import { User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'login' | 'register';

const AuthScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      if (tab === 'login') {
        await signIn(username, password);
      } else {
        await signUp(username, password);
      }
    } catch {
      // error shown via context
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    clearError();
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50 to-slate-50 max-w-md mx-auto">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">甜护宝</h1>
          <p className="text-sm text-slate-500 mt-1">妊娠期健康伴侣</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'login' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'register' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                用户名
              </label>
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <UserIcon size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  className="flex-1 bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:ring-0 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                密码
              </label>
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <Lock size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? '至少 6 位' : '请输入密码'}
                  autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                  className="flex-1 bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:ring-0 text-sm font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  处理中...
                </>
              ) : tab === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            {tab === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
              className="ml-1 text-rose-500 font-bold"
            >
              {tab === 'login' ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
