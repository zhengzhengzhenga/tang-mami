import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Droplets, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  ChevronDown,
  Info,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { GlucoseLog, GlucoseTiming, MealLog, MealType } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  LabelList
} from 'recharts';

interface GlucoseTrackerProps {
  logs: GlucoseLog[];
  mealLogs: MealLog[];
  onAddLog: (log: GlucoseLog) => void;
  onDeleteLog: (id: string) => void;
  onBack: () => void;
}

type TabType = 'history' | 'trend';
type PeriodType = 'day' | 'week' | 'month' | 'custom';

const toDateTimeLocalString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const GlucoseTracker: React.FC<GlucoseTrackerProps> = ({ logs, mealLogs, onAddLog, onDeleteLog, onBack }) => {
  const [view, setView] = useState<TabType>('history');
  const [showAdd, setShowAdd] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogTime, setEditingLogTime] = useState<Date | null>(null);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() - 6, 0, 0, 0);
    return toDateTimeLocalString(d);
  });
  const [customEnd, setCustomEnd] = useState(() => toDateTimeLocalString(new Date()));
  const [showPointLabels, setShowPointLabels] = useState(false);
  const [showTimingLabels, setShowTimingLabels] = useState(false);
  
  // 当前在日历视图下查看详情的日期
  const [focusedDateStr, setFocusedDateStr] = useState(new Date().toISOString().split('T')[0]);

  // 新增记录表单状态
  const [value, setValue] = useState('');
  const [timing, setTiming] = useState<GlucoseTiming>(GlucoseTiming.POST_MEAL_1H);
  const [associatedMealId, setAssociatedMealId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 日历显示的月份
  const [calendarDate, setCalendarDate] = useState(new Date());

  const openAddForm = (log?: GlucoseLog) => {
    if (log) {
      setEditingLogId(log.id);
      setEditingLogTime(new Date(log.timestamp));
      setValue(String(log.value));
      setTiming(log.timing);
      setAssociatedMealId(log.associatedMealId);
      setSelectedDate(new Date(log.timestamp).toISOString().split('T')[0]);
    } else {
      setEditingLogId(null);
      setEditingLogTime(null);
      setValue('');
      setTiming(GlucoseTiming.POST_MEAL_1H);
      setAssociatedMealId(undefined);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
    setShowAdd(true);
  };

  const getGlucoseStatus = (val: number, time: GlucoseTiming): 'normal' | 'low' | 'high' => {
    if (time === GlucoseTiming.FASTING) {
      if (val < 3.3) return 'low';
      if (val > 5.3) return 'high';
      return 'normal';
    }

    if (time === GlucoseTiming.POST_MEAL_1H) {
      if (val > 7.8) return 'high';
      return 'normal';
    }

    if (time === GlucoseTiming.POST_MEAL_2H) {
      if (val < 4.4) return 'low';
      if (val > 6.7) return 'high';
      return 'normal';
    }

    if (time === GlucoseTiming.BEFORE_SLEEP) {
      if (val > 8.5) return 'high';
      return 'normal';
    }

    return 'normal';
  };
  
  const isAbnormal = (val: number, time: GlucoseTiming) => getGlucoseStatus(val, time) !== 'normal';

  const isPostMeal = timing === GlucoseTiming.POST_MEAL_1H || timing === GlucoseTiming.POST_MEAL_2H;

  // 获取表单所选日期的所有可用饮食记录
  const availableMeals = useMemo(() => {
    return mealLogs.filter(m => {
      const d = new Date(m.timestamp);
      return d.toISOString().split('T')[0] === selectedDate;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [mealLogs, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    
    const logDate = new Date(selectedDate);
    const baseTime = editingLogTime ?? new Date();
    logDate.setHours(baseTime.getHours(), baseTime.getMinutes());

    const selectedMeal = availableMeals.find(m => m.id === associatedMealId);

    const newLog: GlucoseLog = {
      id: editingLogId || Date.now().toString(),
      value: parseFloat(value),
      unit: 'mmol/L',
      timing,
      associatedMealId: isPostMeal ? associatedMealId : undefined,
      mealType: isPostMeal ? (selectedMeal?.type) : undefined,
      timestamp: logDate
    };
    
    onAddLog(newLog);
    setShowAdd(false);
    setValue('');
    setEditingLogId(null);
    setEditingLogTime(null);
    setAssociatedMealId(undefined);
    setFocusedDateStr(selectedDate);
  };

  // 构造日历格点
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const dayGlucose = logs.filter(l => {
        const d = new Date(l.timestamp);
        return d.toISOString().split('T')[0] === dateStr;
      });

      const dayMeals = mealLogs.filter(l => {
        const d = new Date(l.timestamp);
        return d.toISOString().split('T')[0] === dateStr;
      });

      const hasAbnormal = dayGlucose.some(l => isAbnormal(l.value, l.timing));
      days.push({ 
        day: i, 
        hasGlucose: dayGlucose.length > 0, 
        hasMeals: dayMeals.length > 0,
        hasAbnormal, 
        dateStr 
      });
    }
    return days;
  }, [calendarDate, logs, mealLogs]);

  // 聚合指定日期的混合时间轴
  const dailyTimeline = useMemo(() => {
    const dayGlucose = logs.filter(l => {
      const d = new Date(l.timestamp);
      return d.toISOString().split('T')[0] === focusedDateStr;
    });

    const dayMeals = mealLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d.toISOString().split('T')[0] === focusedDateStr;
    });

    const combined = [
      ...dayGlucose.map(g => ({ type: 'glucose' as const, data: g, time: new Date(g.timestamp) })),
      ...dayMeals.map(m => ({ type: 'meal' as const, data: m, time: new Date(m.timestamp) }))
    ];

    return combined.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [logs, mealLogs, focusedDateStr]);

  // 趋势图数据处理
  const filteredChartData = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    let customStartDate: Date | null = null;
    let customEndDate: Date | null = null;
    if (period === 'day') cutoff.setHours(0, 0, 0, 0);
    else if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else {
      customStartDate = customStart ? new Date(customStart) : null;
      customEndDate = customEnd ? new Date(customEnd) : null;
    }

    const isSameCustomDate =
      customStartDate && customEndDate &&
      customStartDate.toDateString() === customEndDate.toDateString();

    return [...logs]
      .filter(l => {
        const ts = new Date(l.timestamp);
        if (period !== 'custom') return ts >= cutoff;
        if (!customStartDate || Number.isNaN(customStartDate.getTime())) return false;
        if (!customEndDate || Number.isNaN(customEndDate.getTime())) return false;
        return ts >= customStartDate && ts <= customEndDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(l => ({
        axisLabel: period === 'day' || (period === 'custom' && isSameCustomDate)
          ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(l.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
        fullDateTime: new Date(l.timestamp).toLocaleString([], {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        value: l.value,
        timing: l.timing
      }));
  }, [logs, period, customStart, customEnd]);

  const changeMonth = (offset: number) => {
    setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + offset)));
  };

  const getMealFoodDetail = (meal?: MealLog) => {
    if (!meal?.items || meal.items.length === 0) return '';
    return meal.items
      .filter(i => i.name)
      .map(i => `${i.name}${i.weight ? `(${i.weight}g)` : ''}`)
      .join('、');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-rose-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setView('history')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'history' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
          >
            综合日历
          </button>
          <button 
            onClick={() => setView('trend')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'trend' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
          >
            趋势分析
          </button>
        </div>
        <button 
          onClick={() => openAddForm()} 
          className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-50 bg-white p-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">{editingLogId ? '修改血糖' : '记录血糖'}</h2>
            <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="text-center">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">血糖数值 (mmol/L)</label>
              <input 
                type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="0.0" autoFocus
                className="w-full text-5xl font-bold text-rose-500 bg-transparent border-none text-center focus:ring-0"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">记录日期</label>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <CalendarIcon size={18} className="text-slate-400" />
                <input 
                  type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-bold text-slate-600 w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">测量时间点</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(GlucoseTiming).map(t => (
                  <button
                    key={t} type="button" onClick={() => {
                      setTiming(t);
                      if (t === GlucoseTiming.FASTING || t === GlucoseTiming.BEFORE_SLEEP) {
                        setAssociatedMealId(undefined);
                      }
                    }}
                    className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all ${
                      timing === t ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-50 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {isPostMeal && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700">对应具体哪一餐？</label>
                {availableMeals.length > 0 ? (
                  <div className="space-y-2">
                    {availableMeals.map(m => (
                      <button
                        key={m.id} type="button" onClick={() => setAssociatedMealId(m.id)}
                        className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex justify-between items-center ${
                          associatedMealId === m.id ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-50 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${associatedMealId === m.id ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'}`}>
                            <Utensils size={16} />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${associatedMealId === m.id ? 'text-amber-800' : 'text-slate-700'}`}>
                              {m.description || m.type}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {m.type} · {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        {associatedMealId === m.id && <CheckCircle2 className="text-amber-500" size={18} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                      该日期暂未找到饮食记录。为了更精准地追踪，请先在“饮食”模块记录后再关联。
                    </p>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 mt-4 active:scale-95 transition-all">
              {editingLogId ? '保存修改' : '保存记录'}
            </button>
          </form>
        </div>
      ) : view === 'history' ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-slate-800">{calendarDate.getFullYear()}年 {calendarDate.getMonth() + 1}月</h3>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500"><ChevronLeft size={16}/></button>
                <button onClick={() => changeMonth(1)} className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <span key={d} className="text-[10px] font-bold text-slate-300 uppercase">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isSelected = day?.dateStr === focusedDateStr;
                return (
                  <button 
                    key={idx} 
                    disabled={!day}
                    onClick={() => day && setFocusedDateStr(day.dateStr)}
                    className={`aspect-square flex flex-col items-center justify-center relative rounded-xl transition-all ${isSelected ? 'bg-rose-50 ring-2 ring-rose-200' : 'hover:bg-slate-50'}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-bold ${isSelected ? 'text-rose-600' : (day.hasGlucose || day.hasMeals) ? 'text-slate-800' : 'text-slate-300'}`}>{day.day}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          {day.hasGlucose && (
                            <div className={`w-1 h-1 rounded-full ${day.hasAbnormal ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}></div>
                          )}
                          {day.hasMeals && (
                            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 px-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" /> 
                {focusedDateStr === new Date().toISOString().split('T')[0] ? '今日回顾' : `${focusedDateStr} 详情`}
              </div>
            </h3>
            
            <div className="space-y-4 relative ml-4 border-l-2 border-slate-100 pl-6 pb-4">
              {dailyTimeline.length > 0 ? dailyTimeline.map((item, idx) => {
                let mealDesc = "";
                let mealFoodDetail = "";
                if (item.type === 'glucose' && item.data.associatedMealId) {
                  const linkedMeal = mealLogs.find(m => m.id === item.data.associatedMealId);
                  if (linkedMeal) {
                    mealDesc = linkedMeal.description;
                    mealFoodDetail = getMealFoodDetail(linkedMeal);
                  }
                }

                return (
                  <div key={idx} className="relative animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className={`absolute -left-[33px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-50 ${item.type === 'meal' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                        {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {item.type === 'meal' ? (
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                            <Utensils size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-50 text-amber-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">{item.data.type}</span>
                              <h4 className="font-bold text-slate-800 text-xs">{item.data.description}</h4>
                            </div>
                            {getMealFoodDetail(item.data) && (
                              <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                                {getMealFoodDetail(item.data)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className={`p-3 rounded-2xl border shadow-sm flex items-center justify-between ${
                            getGlucoseStatus(item.data.value, item.data.timing) === 'high'
                              ? 'bg-rose-50 border-rose-100'
                              : getGlucoseStatus(item.data.value, item.data.timing) === 'low'
                                ? 'bg-sky-50 border-sky-100'
                                : 'bg-emerald-50 border-emerald-100'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${
                                getGlucoseStatus(item.data.value, item.data.timing) === 'high'
                                  ? 'bg-white text-rose-500 shadow-sm'
                                  : getGlucoseStatus(item.data.value, item.data.timing) === 'low'
                                    ? 'bg-white text-sky-500 shadow-sm'
                                    : 'bg-white text-emerald-500 shadow-sm'
                              }`}>
                                {isAbnormal(item.data.value, item.data.timing) ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                              </div>
                              <div>
                                <p className={`text-lg font-bold flex items-baseline gap-1 ${
                                  getGlucoseStatus(item.data.value, item.data.timing) === 'high'
                                    ? 'text-rose-600'
                                    : getGlucoseStatus(item.data.value, item.data.timing) === 'low'
                                      ? 'text-sky-600'
                                      : 'text-emerald-600'
                                }`}>
                                  {item.data.value} 
                                  <span className="text-[9px] uppercase font-bold text-slate-400">{item.data.timing}</span>
                                </p>
                                {(mealFoodDetail || mealDesc) && (
                                  <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                    <Utensils size={10} className="text-amber-500" /> {mealFoodDetail || mealDesc}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getGlucoseStatus(item.data.value, item.data.timing) === 'high' && (
                                <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">偏高</span>
                              )}
                              {getGlucoseStatus(item.data.value, item.data.timing) === 'low' && (
                                <span className="bg-sky-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">偏低</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openAddForm(item.data)}
                              className="px-2 py-1 text-[10px] rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center gap-1"
                            >
                              <Edit3 size={12} /> 修改
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('确认删除这条血糖记录吗？')) {
                                  onDeleteLog(item.data.id);
                                }
                              }}
                              className="px-2 py-1 text-[10px] rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center gap-1"
                            >
                              <Trash2 size={12} /> 删除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 opacity-30 -ml-4 flex flex-col items-center">
                  <CalendarIcon size={40} className="mb-2" />
                  <p className="text-xs font-bold">该日期暂无记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex justify-center bg-slate-100 p-1 rounded-2xl w-fit">
              {(['day', 'week', 'month', 'custom'] as const).map(p => (
                <button 
                  key={p} onClick={() => setPeriod(p)}
                  className={`px-6 py-1.5 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                >
                  {p === 'day' ? '今日' : p === 'week' ? '本周' : p === 'month' ? '本月' : '自定义'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPointLabels(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${showPointLabels ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-500 border-slate-200'}`}
            >
              {showPointLabels ? '隐藏数值' : '显示数值'}
            </button>
            <button
              type="button"
              onClick={() => setShowTimingLabels(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${showTimingLabels ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200'}`}
            >
              {showTimingLabels ? '隐藏时间点' : '显示时间点'}
            </button>
          </div>

          {period === 'custom' && (
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 gap-2">
              <label className="text-[11px] font-bold text-slate-500">开始时间</label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
              />
              <label className="text-[11px] font-bold text-slate-500 mt-1">结束时间</label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
              />
            </div>
          )}

          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm h-80">
            {filteredChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="axisLabel"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    domain={[3, 11]}
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    label={{ value: 'mmol/L', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDateTime || ''}
                    formatter={(value: number) => [`${value} mmol/L`, '血糖']}
                  />
                  <ReferenceLine y={3.3} stroke="#38bdf8" strokeDasharray="3 3" label={{ position: 'right', value: '3.3', fill: '#38bdf8', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={5.3} stroke="#14b8a6" strokeDasharray="3 3" label={{ position: 'right', value: '5.3', fill: '#14b8a6', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={6.7} stroke="#14b8a6" strokeDasharray="3 3" label={{ position: 'right', value: '6.7', fill: '#14b8a6', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={7.8} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: '7.8', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                  <Line 
                    type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={4} 
                    dot={(props: any) => {
                      const status = getGlucoseStatus(props.payload.value, props.payload.timing);
                      const fill = status === 'high' ? '#f59e0b' : status === 'low' ? '#38bdf8' : '#14b8a6';
                      return <circle cx={props.cx} cy={props.cy} r={4} fill={fill} stroke="#fff" strokeWidth={2} />;
                    }}
                    activeDot={(props: any) => {
                      const status = getGlucoseStatus(props.payload.value, props.payload.timing);
                      const fill = status === 'high' ? '#f59e0b' : status === 'low' ? '#38bdf8' : '#14b8a6';
                      return <circle cx={props.cx} cy={props.cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />;
                    }}
                  >
                    {showPointLabels && (
                      <LabelList dataKey="value" position="top" fill="#0f766e" fontSize={10} fontWeight={700} />
                    )}
                    {showTimingLabels && (
                      <LabelList dataKey="timing" position="bottom" fill="#64748b" fontSize={9} fontWeight={600} />
                    )}
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                <TrendingUp size={48} />
                <p className="text-sm font-medium">暂无足够趋势数据</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlucoseTracker;