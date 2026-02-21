
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2,
  Info,
  ArrowRight,
  Droplets
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
    csvContent += "日期,时间,血糖值(mmol/L),测量时点,对应餐食类型,对应餐食内容,对应餐食营养\n";

    const glucoseRows = [...filteredData.glucose]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(g => {
        const linkedMeal = g.associatedMealId
          ? mealLogs.find(m => m.id === g.associatedMealId)
          : undefined;

        const mealType = linkedMeal?.type || g.mealType || '';
        const userMealDescription = linkedMeal?.description?.trim();
        const itemDescription = linkedMeal?.items?.map(i => `${i.name}${i.weight ? `(${i.weight}g)` : ''}`).join('、') || '';
        const mealDesc = linkedMeal
          ? (userMealDescription && userMealDescription !== '餐食记录' ? userMealDescription : itemDescription)
          : '';
        const mealNutrition = linkedMeal?.nutrients
          ? `碳水:${linkedMeal.nutrients.carbs}g; 热量:${linkedMeal.nutrients.calories}kcal; 蛋白质:${linkedMeal.nutrients.protein}g; 脂肪:${linkedMeal.nutrients.fats}g`
          : '';

        return {
          date: new Date(g.timestamp).toLocaleDateString(),
          time: new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: g.value,
          timing: g.timing,
          mealType,
          mealDesc,
          mealNutrition,
        };
      });

    glucoseRows.forEach(row => {
      csvContent += `${row.date},${row.time},${row.value},${row.timing},${row.mealType},${row.mealDesc},${row.mealNutrition}\n`;
    });

    // 创建下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `甜心孕记健康报告_${startDate}_至_${endDate}.csv`);
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
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-500 uppercase mb-1 flex items-center gap-1">
              <Droplets size={12} /> 血糖记录（含对应餐食内容）
            </p>
            <h4 className="text-2xl font-bold text-rose-700">{filteredData.glucose.length} <span className="text-[10px] font-medium">条</span></h4>
          </div>
        </div>
      </section>

      <button 
        onClick={handleExport}
        disabled={isExporting || filteredData.glucose.length === 0}
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
          导出的文件仅包含血糖记录，并在每条血糖记录中附带其对应的餐食类型、内容和营养信息（若有关联）。您可以将其发送给产科医生或营养师，作为临床复诊的重要参考资料。
        </p>
      </div>
    </div>
  );
};

export default DataExport;
