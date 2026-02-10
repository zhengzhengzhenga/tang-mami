
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Utensils, 
  Droplets, 
  User as UserIcon, 
  ChevronRight, 
  Plus,
  MessageCircle,
  TrendingUp,
  Calendar,
  ClipboardList,
  ChefHat,
  Download
} from 'lucide-react';
import { GlucoseLog, MealLog, ExerciseLog, GlucoseTiming, MealType } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import GlucoseTracker from './components/GlucoseTracker.tsx';
import MealLogger from './components/MealLogger.tsx';
import AIAdvisor from './components/AIAdvisor.tsx';
import DailyReport from './components/DailyReport.tsx';
import MenuPlanner from './components/MenuPlanner.tsx';
import DataExport from './components/DataExport.tsx';

type View = 'dashboard' | 'glucose' | 'meals' | 'exercise' | 'chat' | 'profile' | 'daily' | 'planner' | 'export';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);

  // 模拟初始数据
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const initialGlucose: GlucoseLog[] = [
      { id: 'g1', value: 5.0, unit: 'mmol/L', timing: GlucoseTiming.FASTING, timestamp: new Date(`${todayStr}T07:30:00`) },
      { id: 'g2', value: 7.2, unit: 'mmol/L', timing: GlucoseTiming.POST_MEAL_1H, timestamp: new Date(`${todayStr}T09:15:00`) },
      { id: 'g3', value: 6.5, unit: 'mmol/L', timing: GlucoseTiming.POST_MEAL_2H, timestamp: new Date(`${todayStr}T10:15:00`) },
    ];
    
    const initialMeals: MealLog[] = [
      { 
        id: 'm1', 
        type: MealType.BREAKFAST, 
        description: '全麦面包配煎蛋', 
        timestamp: new Date(`${todayStr}T08:00:00`), 
        nutrients: { carbs: 30, calories: 280, protein: 15, fats: 8 },
        items: [
          { id: 'f1', category: '主食' as any, name: '全麦面包', weight: 50 },
          { id: 'f2', category: '蛋白质' as any, name: '鸡蛋', weight: 50 }
        ]
      }
    ];

    setGlucoseLogs(initialGlucose);
    setMealLogs(initialMeals);
  }, []);

  const handleAddMeal = (log: MealLog) => {
    setMealLogs(prev => {
      const exists = prev.find(l => l.id === log.id);
      if (exists) {
        return prev.map(l => l.id === log.id ? log : l);
      }
      return [log, ...prev];
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            glucoseLogs={glucoseLogs} 
            mealLogs={mealLogs} 
            exerciseLogs={exerciseLogs} 
            onNavigate={(v) => setCurrentView(v)}
          />
        );
      case 'glucose':
        return (
          <GlucoseTracker 
            logs={glucoseLogs} 
            mealLogs={mealLogs}
            onAddLog={(log) => setGlucoseLogs(prev => [log, ...prev])} 
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
      case 'planner':
        return (
          <MenuPlanner onBack={() => setCurrentView('dashboard')} />
        );
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

  return (
    <div className="min-h-screen pb-24 flex flex-col bg-slate-50 max-w-md mx-auto shadow-xl ring-1 ring-slate-200">
      <header className="p-6 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-rose-500">甜护宝</h1>
            <p className="text-xs text-slate-500 font-medium">妊娠期糖尿病健康管理</p>
          </div>
          <button 
            onClick={() => setCurrentView('profile')}
            className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100"
          >
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-x-hidden">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around items-center py-3 px-2 max-w-md mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
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
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-rose-500 transform scale-110' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
