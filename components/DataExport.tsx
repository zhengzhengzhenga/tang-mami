
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  // Added missing icons
  Droplets,
  Utensils
} from 'lucide-react';
import { GlucoseLog, MealLog } from '../types';

interface DataExportProps {
  glucoseLogs: GlucoseLog[];
  mealLogs: MealLog[];
  onBack: () => void;
}

const DataExport: React.FC<DataExportProps> = ({ glucoseLogs, mealLogs, onBack }) => {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(lastWeek);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredGlucose = glucoseLogs.filter(log => {
      const d = new Date(log.timestamp);
      return d >= start && d <= end;
    });

    const filteredMeals = mealLogs.filter(log => {
      const d = new Date(log.timestamp);
      return d >= start && d <= end;
    });

    return { glucose: filteredGlucose, meals: filteredMeals };
  }, [glucoseLogs, mealLogs, startDate, endDate]);

  const handleExport = () => {
    setIsExporting(true);
    
    // 构建 CSV 内容
    // 包含 UTF-8 BOM，让 Excel 能正确识别中文
    let csvContent = "\uFEFF";
    csvContent += "日期,时间,类型,项目/数值,详细内容/测量时点,单位/关联餐次\n";

    // 混合并排序所有记录
    const combined = [
      ...filteredData.glucose.map(g => ({
        date: new Date(g.timestamp).toLocaleDateString(),
        time: new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "血糖",
        value: g.value,
        detail: g.timing,
        extra: g.mealType || ""
      })),
      ...filteredData.meals.map(m => ({
        date: new Date(m.timestamp).toLocaleDateString(),
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "饮食",
        value: m.description,
        detail: m.type,
        extra: m.nutrients ? `碳水:${m.nutrients.carbs}g` : ""
      }))
    ].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`).getTime();
      const dateB = new Date(`${b.date} ${b.time}`).getTime();
      return dateA - dateB;
    });

    combined.forEach(row => {
      csvContent += `${row.date},${row.time},${row.type},${row.value},${row.detail},${row.extra}\n`;
    });

    // 创建下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `甜护宝健康报告_${startDate}_至_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-rose-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">报告导出</h2>
        <div className="w-10"></div>
      </div>

      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-2xl">
          <FileSpreadsheet size={24} />
          <div>
            <h3 className="font-bold text-sm">选择导出范围</h3>
            <p className="text-[10px] opacity-80">导出文件格式为 .csv (Excel可打开)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">开始日期</label>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <CalendarIcon size={18} className="text-slate-400" />
              <input 
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-bold text-slate-600 w-full"
              />
            </div>
          </div>

          <div className="flex justify-center text-slate-300">
            <ArrowRight size={20} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">截止日期</label>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <CalendarIcon size={18} className="text-slate-400" />
              <input 
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-bold text-slate-600 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 px-1">即将导出的内容清单</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-500 uppercase mb-1 flex items-center gap-1">
              <Droplets size={12} /> 血糖记录
            </p>
            <h4 className="text-2xl font-bold text-rose-700">{filteredData.glucose.length} <span className="text-[10px] font-medium">条</span></h4>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-500 uppercase mb-1 flex items-center gap-1">
              <Utensils size={12} /> 饮食记录
            </p>
            <h4 className="text-2xl font-bold text-amber-700">{filteredData.meals.length} <span className="text-[10px] font-medium">条</span></h4>
          </div>
        </div>
      </section>

      <button 
        onClick={handleExport}
        disabled={isExporting || (filteredData.glucose.length === 0 && filteredData.meals.length === 0)}
        className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-bold shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
      >
        {isExporting ? (
          <><CheckCircle2 size={20} className="animate-pulse" /> 正在生成报告...</>
        ) : (
          <><Download size={20} /> 立即导出 Excel 报表</>
        )}
      </button>

      <div className="p-4 bg-slate-100 rounded-2xl flex items-start gap-3">
        <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          导出的文件包含完整的日期、时间、血糖数值（含测量时点）以及饮食内容。您可以将其发送给产科医生或营养师，作为临床复诊的重要参考资料。
        </p>
      </div>
    </div>
  );
};

export default DataExport;
