import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Droplets,
  Scale,
  User as UserIcon,
  TrendingUp,
  Calendar,
  ChefHat,
  Download,
  LogOut
} from 'lucide-react';
import { GlucoseLog, MealLog, ExerciseLog, WeightLog } from './types';
import Dashboard from './components/Dashboard';
import GlucoseTracker from './components/GlucoseTracker';
import MealLogger from './components/MealLogger';
import AIAdvisor from './components/AIAdvisor';
import DailyReport from './components/DailyReport';
import MenuPlanner from './components/MenuPlanner';
import DataExport from './components/DataExport';
import WeightTracker from './components/WeightTracker';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  fetchGlucoseLogs,
  fetchMealLogs,
  fetchExerciseLogs,
  fetchWeightLogs,
  upsertGlucoseLog,
  deleteGlucoseLog,
  upsertMealLog,
  upsertWeightLog,
} from './services/supabaseDataService';

type View = 'dashboard' | 'glucose' | 'meals' | 'weight' | 'exercise' | 'chat' | 'profile' | 'daily' | 'planner' | 'export';

const MainApp: React.FC = () => {
  const { user, username, signOut, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const userId = user?.id ?? '';

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      fetchGlucoseLogs(userId),
      fetchMealLogs(userId),
      fetchExerciseLogs(userId),
      fetchWeightLogs(userId).catch((err) => {
        console.error('Fetch weight logs failed:', err);
        return [];
      }),
    ])
      .then(([g, m, e, w]) => {
        if (!cancelled) {
          setGlucoseLogs(g);
          setMealLogs(m);
          setExerciseLogs(e);
          setWeightLogs(w);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const syncGlucose = useCallback(
    async (log: GlucoseLog) => {
      if (!userId) return;
      try {
        await upsertGlucoseLog(log, userId);
      } catch (err) {
        console.error('Sync glucose failed:', err);
      }
    },
    [userId]
  );

  const syncMeal = useCallback(
    async (log: MealLog) => {
      if (!userId) return;
      try {
        await upsertMealLog(log, userId);
      } catch (err) {
        console.error('Sync meal failed:', err);
      }
    },
    [userId]
  );

  const handleSaveGlucose = useCallback(
    (log: GlucoseLog) => {
      setGlucoseLogs((prev) => {
        const exists = prev.find((l) => l.id === log.id);
        if (exists) {
          return prev
            .map((l) => (l.id === log.id ? log : l))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        return [log, ...prev];
      });
      syncGlucose(log);
    },
    [syncGlucose]
  );

  const handleDeleteGlucose = useCallback(
    async (id: string) => {
      setGlucoseLogs((prev) => prev.filter((l) => l.id !== id));
      if (!userId) return;
      try {
        await deleteGlucoseLog(id, userId);
      } catch (err) {
        console.error('Delete glucose failed:', err);
      }
    },
    [userId]
  );

  const handleAddMeal = useCallback(
    (log: MealLog) => {
      setMealLogs((prev) => {
        const exists = prev.find((l) => l.id === log.id);
        if (exists) return prev.map((l) => (l.id === log.id ? log : l));
        return [log, ...prev];
      });
      syncMeal(log);
    },
    [syncMeal]
  );

  const handleAddWeight = useCallback(
    (log: WeightLog) => {
      setWeightLogs((prev) => {
        const exists = prev.find((l) => l.id === log.id);
        if (exists) {
          return prev
            .map((l) => (l.id === log.id ? log : l))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        return [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
      if (userId) {
        upsertWeightLog(log, userId).catch((err) => {
          console.error('Sync weight failed:', err);
          alert(`体重保存到云端失败：${err?.message || '请先检查 Supabase 是否已创建 weight_logs 表及 RLS 策略'}`);
        });
      }
    },
    [userId]
  );

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            glucoseLogs={glucoseLogs}
            mealLogs={mealLogs}
            exerciseLogs={exerciseLogs}
            weightLogs={weightLogs}
            onNavigate={(v) => setCurrentView(v)}
          />
        );
      case 'glucose':
        return (
          <GlucoseTracker
            logs={glucoseLogs}
            mealLogs={mealLogs}
            onAddLog={handleSaveGlucose}
            onDeleteLog={handleDeleteGlucose}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'meals':
        return (
          <MealLogger
            logs={mealLogs}
            onAddLog={handleAddMeal}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'daily':
        return (
          <DailyReport
            glucoseLogs={glucoseLogs}
            mealLogs={mealLogs}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'weight':
        return (
          <WeightTracker
            logs={weightLogs}
            onAddLog={handleAddWeight}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'planner':
        return <MenuPlanner onBack={() => setCurrentView('dashboard')} />;
      case 'export':
        return (
          <DataExport
            glucoseLogs={glucoseLogs}
            mealLogs={mealLogs}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'chat':
        return <AIAdvisor onBack={() => setCurrentView('dashboard')} />;
      case 'profile':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                  <UserIcon size={28} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{username ?? '用户'}</h3>
                  <p className="text-xs text-slate-500">妊娠期健康伴侣</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p>功能即将推出！</p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mt-4 text-rose-500 font-medium"
            >
              返回首页
            </button>
          </div>
        );
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 max-w-md mx-auto">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100" />
          <p className="text-sm text-slate-500">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 flex flex-col bg-slate-50 max-w-md mx-auto shadow-xl ring-1 ring-slate-200">
      <header className="p-6 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">甜心孕记</h1>
            <p className="text-sm text-slate-500">妊娠期健康伴侣</p>
          </div>
          <button
            onClick={() => setCurrentView('profile')}
            className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100"
          >
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">{renderView()}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t flex justify-around items-center py-3 px-2 max-w-md mx-auto shadow-2xl z-20">
        <NavButton
          active={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
          icon={<TrendingUp size={20} />}
          label="首页"
        />
        <NavButton
          active={currentView === 'planner'}
          onClick={() => setCurrentView('planner')}
          icon={<ChefHat size={20} />}
          label="配餐"
        />
        <NavButton
          active={currentView === 'glucose'}
          onClick={() => setCurrentView('glucose')}
          icon={<Droplets size={20} />}
          label="血糖"
        />
        <NavButton
          active={currentView === 'meals'}
          onClick={() => setCurrentView('meals')}
          icon={<Utensils size={20} />}
          label="饮食"
        />
        <NavButton
          active={currentView === 'weight'}
          onClick={() => setCurrentView('weight')}
          icon={<Scale size={20} />}
          label="体重"
        />
        <NavButton
          active={currentView === 'export'}
          onClick={() => setCurrentView('export')}
          icon={<Download size={20} />}
          label="导出"
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? 'text-rose-500 transform scale-110' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
  </button>
);

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 max-w-md mx-auto">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100" />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MainApp />;
};

export default function AppWithProvider() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
