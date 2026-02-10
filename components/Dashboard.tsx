
import React from 'react';
import { 
  ChevronRight, 
  Droplets, 
  Utensils, 
  Activity as ActivityIcon,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChefHat,
  FileSpreadsheet
} from 'lucide-react';
import { GlucoseLog, MealLog, ExerciseLog, GlucoseTiming } from '../types.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface DashboardProps {
  glucoseLogs: GlucoseLog[];
  mealLogs: MealLog[];
  exerciseLogs: ExerciseLog[];
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ glucoseLogs, mealLogs, exerciseLogs, onNavigate }) => {
  const latestGlucose = glucoseLogs[0];
  const totalCarbsToday = mealLogs.filter(m => {
    const d = new Date(m.timestamp);
    return d.toDateString() === new Date().toDateString();
  }).reduce((acc, curr) => acc + (curr.nutrients?.carbs || 0), 0);
  
  const chartData = [...glucoseLogs]
    .filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: log.value,
    }));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-rose-500 p-4 rounded-3xl text-white shadow-lg shadow-rose-200">
          <p className="text-xs opacity-80 mb-1">最新血糖</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{latestGlucose?.value || '--'}</span>
            <span className="text-xs">{latestGlucose?.unit || 'mmol/L'}</span>
          </div>
          <p className="text-[10px] mt-2 bg-white/20 px-2 py-0.5 rounded-full inline-block font-bold">
            {latestGlucose?.timing || '暂无数据'}
          </p>
        </div>
        <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-lg shadow-emerald-200">
          <p className="text-xs opacity-80 mb-1">今日碳水</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{totalCarbsToday}</span>
            <span className="text-xs">g</span>
          </div>
          <p className="text-[10px] mt-2 bg-white/20 px-2 py-0.5 rounded-full inline-block font-bold">
            目标: ~150g
          </p>
        </div>
      </section>

      <section className="bg-emerald-600 p-5 rounded-3xl text-white shadow-lg shadow-emerald-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <FileSpreadsheet size={20} /> 导出健康报表
          </h3>
          <p className="text-xs opacity-80 leading-tight">将血糖与饮食汇总导出为 Excel</p>
        </div>
        <button 
          onClick={() => onNavigate('export')}
          className="bg-white text-emerald-600 px-4 py-2 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all"
        >
          立即导出
        </button>
      </section>

      <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="font-bold text-slate-800">今日趋势</h3>
          <button onClick={() => onNavigate('glucose')} className="text-xs text-rose-500 font-bold flex items-center">
            查看详情 <ChevronRight size={14} />
          </button>
        </div>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[3, 11]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <ReferenceArea y1={4.0} y2={6.7} fill="#10b981" fillOpacity={0.05} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              今日暂无数据，点击下方按钮开始记录
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <ShortcutItem 
          icon={<Droplets className="text-rose-500" />}
          label="记录血糖"
          desc="追踪餐前餐后血糖"
          onClick={() => onNavigate('glucose')}
        />
        <ShortcutItem 
          icon={<Utensils className="text-amber-500" />}
          label="记录饮食"
          desc="分类记录您的每一餐"
          onClick={() => onNavigate('meals')}
        />
      </section>
    </div>
  );
};

const ShortcutItem: React.FC<{ icon: React.ReactNode, label: string, desc: string, onClick: () => void }> = ({ icon, label, desc, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-bold text-slate-800 text-sm">{label}</p>
        <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
      </div>
    </div>
    <ChevronRight className="text-slate-300" size={18} />
  </button>
);

export default Dashboard;
