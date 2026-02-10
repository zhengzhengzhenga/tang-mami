
import React, { useState, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  Camera, 
  Plus, 
  Trash2, 
  Loader2, 
  Utensils, 
  Info, 
  Edit3, 
  Save, 
  Scale, 
  ChevronDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { MealLog, MealType, FoodCategory, FoodItem } from '../types';
import { analyzeMeal } from '../services/geminiService';

interface MealLoggerProps {
  logs: MealLog[];
  onAddLog: (log: MealLog) => void;
  onBack: () => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ logs, onAddLog, onBack }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 核心表单状态
  const [mealType, setMealType] = useState<MealType>(MealType.LUNCH);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openForm = (log?: MealLog) => {
    if (log) {
      setEditingId(log.id);
      setMealType(log.type);
      setFoodItems(log.items || []);
      setDescription(log.description);
      setImagePreview(log.photoUrl || null);
      setAnalysisResult(log.nutrients ? { ...log.nutrients } : null);
      setSelectedDate(new Date(log.timestamp).toISOString().split('T')[0]);
    } else {
      setEditingId(null);
      setMealType(MealType.LUNCH);
      setFoodItems([{ id: Math.random().toString(), category: FoodCategory.STAPLE, name: '', weight: 0 }]);
      setDescription('');
      setImagePreview(null);
      setAnalysisResult(null);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
    setShowAdd(true);
  };

  const addFoodRow = () => {
    setFoodItems([...foodItems, { id: Math.random().toString(), category: FoodCategory.STAPLE, name: '', weight: 0 }]);
  };

  const removeFoodRow = (id: string) => {
    setFoodItems(foodItems.filter(item => item.id !== id));
  };

  const updateFoodItem = (id: string, updates: Partial<FoodItem>) => {
    setFoodItems(foodItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    const manualDesc = foodItems.map(i => `${i.category}: ${i.name} ${i.weight}g`).join(', ');
    const fullDesc = `${description} ${manualDesc}`.trim();
    if (!fullDesc && !imagePreview) return;
    
    setIsAnalyzing(true);
    try {
      const base64Image = imagePreview?.split(',')[1];
      const result = await analyzeMeal(fullDesc, base64Image);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const logDate = new Date(selectedDate);
    const now = new Date();
    // Keep current time if adding new, or keep original time if editing
    logDate.setHours(now.getHours(), now.getMinutes());

    const finalLog: MealLog = {
      id: editingId || Date.now().toString(),
      type: mealType,
      items: foodItems.filter(i => i.name || i.weight > 0),
      description: description || "餐食记录",
      photoUrl: imagePreview || undefined,
      nutrients: analysisResult ? {
        carbs: analysisResult.carbs || 0,
        calories: analysisResult.calories || 0,
        protein: analysisResult.protein || 0,
        fats: analysisResult.fats || 0
      } : undefined,
      timestamp: logDate
    };
    
    onAddLog(finalLog); 
    setShowAdd(false);
    setEditingId(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">{showAdd ? (editingId ? '修改饮食' : '新增饮食') : '饮食日记'}</h2>
        <div className="w-10"></div>
      </div>

      {!showAdd ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={() => openForm()}
              className="flex flex-col items-center justify-center p-4 bg-amber-500 text-white rounded-3xl font-bold gap-2 shadow-lg shadow-amber-100 active:scale-95 transition-all"
            >
              <Plus size={24} />
              <span className="text-sm">手动记录</span>
            </button>
            <button 
              onClick={() => {
                openForm();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex flex-col items-center justify-center p-4 bg-white border-2 border-amber-100 text-amber-600 rounded-3xl font-bold gap-2 active:scale-95 transition-all"
            >
              <Camera size={24} />
              <span className="text-sm">拍照识别</span>
            </button>
          </div>

          <div className="space-y-4">
            {logs.length > 0 ? logs.map(log => (
              <div key={log.id} className="bg-white overflow-hidden rounded-3xl border border-slate-100 shadow-sm relative group">
                <button 
                  onClick={() => openForm(log)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Edit3 size={16} />
                </button>
                {log.photoUrl && (
                  <img src={log.photoUrl} alt="Meal" className="w-full h-32 object-cover opacity-90" />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{log.type}</span>
                        <h4 className="font-bold text-slate-800 text-sm">{log.description}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  {log.items && log.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 mt-2">
                      {log.items.map(item => (
                        <span key={item.id} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                          {item.category}: {item.name} {item.weight}g
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-50">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">碳水</p>
                      <p className="font-bold text-rose-500 text-xs">{log.nutrients?.carbs || '--'}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">热量</p>
                      <p className="font-bold text-slate-700 text-xs">{log.nutrients?.calories || '--'}kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">蛋白质</p>
                      <p className="font-bold text-emerald-500 text-xs">{log.nutrients?.protein || '--'}g</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20">
                <Utensils size={48} className="mx-auto mb-2" />
                <p className="text-sm font-bold">快来记录第一顿美味吧</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">日期与餐次</label>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <CalendarIcon size={16} className="text-slate-400" />
                  <input 
                    type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(MealType).map(t => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                      mealType === t ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-700">食物明细</label>
                <button 
                  onClick={addFoodRow}
                  className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full"
                >
                  <Plus size={14} /> 添加项
                </button>
              </div>
              
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {foodItems.map((item, idx) => (
                  <div key={item.id} className="flex flex-col p-3 bg-slate-50 rounded-2xl gap-2 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <select 
                          value={item.category}
                          onChange={(e) => updateFoodItem(item.id, { category: e.target.value as FoodCategory })}
                          className="appearance-none bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg px-2 py-1.5 pr-6 focus:ring-1 focus:ring-amber-500"
                        >
                          {Object.values(FoodCategory).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      <input 
                        type="text"
                        placeholder={item.category === FoodCategory.OTHER ? "自定义名称" : "如: 糙米饭"}
                        value={item.name}
                        onChange={(e) => updateFoodItem(item.id, { name: e.target.value })}
                        className="flex-1 bg-white border border-slate-200 text-[11px] rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500"
                      />
                      <button onClick={() => removeFoodRow(item.id)} className="text-slate-300 hover:text-rose-400 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 w-full max-w-[120px]">
                      <Scale size={14} className="text-slate-400" />
                      <input 
                        type="number"
                        placeholder="重量"
                        value={item.weight || ''}
                        onChange={(e) => updateFoodItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0"
                      />
                      <span className="text-[10px] font-bold text-slate-400">g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">备注与图片</label>
              <div className="relative group">
                <input 
                  type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload}
                />
                {imagePreview ? (
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-md"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-full border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    <Camera size={20} />
                    <span className="text-xs font-medium">拍照或上传餐食图片</span>
                  </button>
                )}
              </div>
              <textarea
                placeholder="这一餐感觉如何？可以在这里简单记录..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 min-h-[80px] text-sm"
              />
            </div>

            {!analysisResult ? (
              <button
                disabled={isAnalyzing || (foodItems.length === 0 && !description && !imagePreview)}
                onClick={handleAnalyze}
                className="w-full py-4 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:bg-amber-100 transition-all shadow-sm"
              >
                {isAnalyzing ? <><Loader2 className="animate-spin" size={20} /> 分析中...</> : <><Utensils size={18}/> AI 营养评估</>}
              </button>
            ) : (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-3 text-amber-800">
                  <Info size={18} />
                  <h4 className="font-bold text-sm">营养预估</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">碳水</p>
                    <p className="text-lg font-bold text-rose-500">{analysisResult.carbs}g</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">热量</p>
                    <p className="text-lg font-bold text-slate-700">{analysisResult.calories}kcal</p>
                  </div>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed italic mb-3">"{analysisResult.advice}"</p>
                <button onClick={() => setAnalysisResult(null)} className="w-full py-2 text-[10px] font-bold text-amber-600 uppercase">重新评估</button>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowAdd(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-200"
              >
                {editingId ? '完成修改' : '确认记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLogger;
