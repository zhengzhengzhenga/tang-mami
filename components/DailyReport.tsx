
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Utensils, 
  Droplets, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { GlucoseLog, MealLog, GlucoseTiming, MealType } from '../types';

interface DailyReportProps {
  glucoseLogs: GlucoseLog[];
  mealLogs: MealLog[];
  onBack: () => void;
}

const DailyReport: React.FC<DailyReportProps> = ({ glucoseLogs, mealLogs, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const isAbnormal = (val: number, time: any) => {
    if (time === GlucoseTiming.FASTING) return val >= 5.1;
    if (time === GlucoseTiming.POST_MEAL_1H) return val >= 10.0;
    if (time === GlucoseTiming.POST_MEAL_2H) return val >= 8.5;
    if (time === GlucoseTiming.BEFORE_SLEEP) return val >= 8.5;
    return false;
  };

  // 聚合并按时间排序当天的所有记录
  const dailyTimeline = useMemo(() => {
    const dayGlucose = glucoseLogs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === selectedDate);
    const dayMeals = mealLogs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === selectedDate);
    
    const timeline = [
      ...dayGlucose.map(g => ({ type: 'glucose' as const, data: g, time: new Date(g.timestamp) })),
      ...dayMeals.map(m => ({ type: 'meal' as const, data: m, time: new Date(m.timestamp) }))
    ];

    return timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [glucoseLogs, mealLogs, selectedDate]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">记录回顾</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <CalendarIcon size={18} className="text-rose-500" />
          <span>{selectedDate === new Date().toISOString().split('T')[0] ? '今日' : selectedDate}</span>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-6 relative ml-4 border-l-2 border-slate-100 pl-8 pb-8">
        {dailyTimeline.length > 0 ? dailyTimeline.map((item, idx) => (
          <div key={idx} className="relative">
            {/* 时间轴上的小圆点 */}
            <div className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 ${item.type === 'meal' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock size={12} /> {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              {item.type === 'meal' ? (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{item.data.type}</span>
                    <h4 className="font-bold text-slate-800 text-sm">{item.data.description}</h4>
                  </div>
                  {item.data.items && item.data.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.data.items.map((food: any) => (
                        <span key={food.id} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                          {food.name} {food.weight}g
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 text-[10px] text-slate-500 font-medium">
                    <span>碳水: <strong className="text-rose-500">{item.data.nutrients?.carbs || 0}g</strong></span>
                    <span>热量: <strong className="text-slate-700">{item.data.nutrients?.calories || 0}kcal</strong></span>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between ${isAbnormal(item.data.value, item.data.timing) ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isAbnormal(item.data.value, item.data.timing) ? 'bg-white text-rose-500' : 'bg-white text-emerald-500'}`}>
                      {isAbnormal(item.data.value, item.data.timing) ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isAbnormal(item.data.value, item.data.timing) ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.data.value} <span className="text-[10px] uppercase">{item.data.timing}</span>
                      </p>
                    </div>
                  </div>
                  {isAbnormal(item.data.value, item.data.timing) && (
                    <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">异常</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center opacity-40 -ml-4">
            <Info size={32} className="mx-auto mb-2" />
            <p className="text-sm font-bold">该日期暂无任何记录</p>
          </div>
        )}
      </div>
      
      <p className="text-[10px] text-slate-400 text-center px-6 leading-relaxed">
        对比饮食内容与其后的血糖变化，可以帮助您发现哪些食物对您的血糖影响较大，从而优化饮食结构。
      </p>
    </div>
  );
};

export default DailyReport;
