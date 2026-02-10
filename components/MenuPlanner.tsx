
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Scale, 
  Utensils, 
  Zap, 
  RefreshCcw, 
  Info,
  ChevronRight,
  Calculator,
  ChefHat,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { MealType, FoodCategory } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MenuPlannerProps {
  onBack: () => void;
}

// 食品交换份标准（基于1800kcal方案和照片提供的信息）
const EXCHANGE_RATES: Record<string, { baseWeight: number, options: { name: string, weight: number }[] }> = {
  [FoodCategory.STAPLE]: {
    baseWeight: 25, // 以25g米/面为基准
    options: [
      { name: '大米/小米/面粉', weight: 25 },
      { name: '土豆/马铃薯', weight: 100 },
      { name: '鲜玉米(带棒)', weight: 200 },
      { name: '全麦面包', weight: 35 },
      { name: '山药/芋头', weight: 100 }
    ]
  },
  [FoodCategory.PROTEIN]: {
    baseWeight: 50, // 以50g瘦肉为基准
    options: [
      { name: '猪/牛/羊瘦肉', weight: 50 },
      { name: '鱼类', weight: 80 },
      { name: '虾/蟹肉', weight: 50 },
      { name: '北豆腐', weight: 100 },
      { name: '鸡蛋', weight: 60 }, // 约1个
      { name: '豆浆', weight: 150 }
    ]
  },
  [FoodCategory.VEGETABLE]: {
    baseWeight: 500, // 以500g绿叶菜为基准
    options: [
      { name: '绿叶菜(菠菜/芹菜等)', weight: 500 },
      { name: '白萝卜/青椒/冬笋', weight: 400 },
      { name: '南瓜/菜花/鲜豇豆', weight: 350 },
      { name: '扁豆/洋葱/胡萝卜', weight: 200 }
    ]
  },
  'DAIRY': {
    baseWeight: 160, // 以160ml牛奶为基准
    options: [
      { name: '全脂牛奶', weight: 160 },
      { name: '无糖酸奶', weight: 130 },
      { name: '奶粉', weight: 20 },
      { name: '奶酪', weight: 25 }
    ]
  }
};

interface MealRequirement {
  type: MealType;
  staple: number;
  protein: number;
  vegetable: number;
  other: number;
}

const DEFAULT_REQUIREMENTS: MealRequirement[] = [
  { type: MealType.BREAKFAST, staple: 50, protein: 50, vegetable: 100, other: 250 }, // 50g主食+1个蛋+奶
  { type: MealType.LUNCH, staple: 75, protein: 75, vegetable: 250, other: 15 },    // 75g主食+75g肉+250g菜+油
  { type: MealType.DINNER, staple: 50, protein: 75, vegetable: 250, other: 10 }    // 50g主食+75g肉+250g菜+油
];

const MenuPlanner: React.FC<MenuPlannerProps> = ({ onBack }) => {
  const [requirements, setRequirements] = useState<MealRequirement[]>(DEFAULT_REQUIREMENTS);
  const [activeTab, setActiveTab] = useState<MealType>(MealType.LUNCH);
  const [selectedFoods, setSelectedFoods] = useState<Record<string, string>>({});
  const [aiMenu, setAiMenu] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeReq = useMemo(() => requirements.find(r => r.type === activeTab) || requirements[0], [requirements, activeTab]);

  const calculateWeight = (category: string, baseInput: number, targetFoodName: string) => {
    const config = EXCHANGE_RATES[category];
    if (!config) return baseInput;
    const targetOption = config.options.find(o => o.name === targetFoodName);
    if (!targetOption) return baseInput;
    
    // 计算公式: (用户输入克重 / 基准克重) * 目标食物对应克重
    return Math.round((baseInput / config.baseWeight) * targetOption.weight);
  };

  const updateReq = (field: keyof MealRequirement, val: string) => {
    const num = parseFloat(val) || 0;
    setRequirements(prev => prev.map(r => r.type === activeTab ? { ...r, [field]: num } : r));
  };

  const handleGenerateMenu = async () => {
    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `你是一位妊娠期糖尿病营养专家。请根据以下克重需求为我推荐一天的菜单：
    早餐：主食 ${requirements[0].staple}g, 蛋白质 ${requirements[0].protein}g, 蔬菜 ${requirements[0].vegetable}g, 其他 ${requirements[0].other}g
    午餐：主食 ${requirements[1].staple}g, 蛋白质 ${requirements[1].protein}g, 蔬菜 ${requirements[1].vegetable}g, 其他 ${requirements[1].other}g
    晚餐：主食 ${requirements[2].staple}g, 蛋白质 ${requirements[2].protein}g, 蔬菜 ${requirements[2].vegetable}g, 其他 ${requirements[2].other}g
    
    要求：
    1. 遵循“干不宜稀”原则，主食推荐全麦、杂粮。
    2. 蔬菜每日需500g以上，以绿叶菜为主。
    3. 蛋白质推荐禽肉、鱼虾、豆制品。
    4. 给出具体的菜名和食材搭配。
    5. 回复请简洁明了，使用Markdown格式，且必须是中文。`;

    try {
      const result = await ai.models.generateContent({ model, contents: prompt });
      setAiMenu(result.text || '暂无内容');
    } catch (e) {
      setAiMenu('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-bold text-slate-900">智能配餐</h2>
        <button onClick={handleGenerateMenu} className="p-2 text-rose-500 bg-rose-50 rounded-xl">
          {isGenerating ? <RefreshCcw size={20} className="animate-spin" /> : <Zap size={20} />}
        </button>
      </div>

      {/* 顶部餐次切换 */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        {DEFAULT_REQUIREMENTS.map(r => (
          <button 
            key={r.type}
            onClick={() => setActiveTab(r.type)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === r.type ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
          >
            {r.type}
          </button>
        ))}
      </div>

      {/* 克重输入区 */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={18} className="text-rose-500" />
          <h3 className="font-bold text-slate-800">设定本餐需求 (以米饭/瘦肉为准)</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <WeightInput label="主食 (g)" value={activeReq.staple} onChange={(v) => updateReq('staple', v)} icon={<Utensils size={14} className="text-amber-500" />} />
          <WeightInput label="蛋白质 (g)" value={activeReq.protein} onChange={(v) => updateReq('protein', v)} icon={<Zap size={14} className="text-blue-500" />} />
          <WeightInput label="蔬菜 (g)" value={activeReq.vegetable} onChange={(v) => updateReq('vegetable', v)} icon={<ChefHat size={14} className="text-emerald-500" />} />
          <WeightInput label="其他/油 (g/ml)" value={activeReq.other} onChange={(v) => updateReq('other', v)} icon={<Info size={14} className="text-slate-500" />} />
        </div>
      </section>

      {/* 自动转换区 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Scale size={16} className="text-rose-400" /> 食品交换份预览
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">根据基准值自动转换</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <ExchangeCard 
            category={FoodCategory.STAPLE} 
            baseValue={activeReq.staple} 
            selected={selectedFoods[FoodCategory.STAPLE]} 
            onSelect={(name) => setSelectedFoods(prev => ({...prev, [FoodCategory.STAPLE]: name}))}
            calculate={calculateWeight}
          />
          <ExchangeCard 
            category={FoodCategory.PROTEIN} 
            baseValue={activeReq.protein} 
            selected={selectedFoods[FoodCategory.PROTEIN]} 
            onSelect={(name) => setSelectedFoods(prev => ({...prev, [FoodCategory.PROTEIN]: name}))}
            calculate={calculateWeight}
          />
          <ExchangeCard 
            category={FoodCategory.VEGETABLE} 
            baseValue={activeReq.vegetable} 
            selected={selectedFoods[FoodCategory.VEGETABLE]} 
            onSelect={(name) => setSelectedFoods(prev => ({...prev, [FoodCategory.VEGETABLE]: name}))}
            calculate={calculateWeight}
          />
        </div>
      </section>

      {/* AI 推荐结果展示 */}
      {aiMenu && (
        <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-rose-500" />
            <h3 className="font-bold text-rose-800">今日专家推荐菜谱</h3>
          </div>
          <div className="prose prose-sm text-rose-900 leading-relaxed whitespace-pre-wrap text-xs">
            {aiMenu}
          </div>
          <button onClick={() => setAiMenu(null)} className="w-full mt-4 py-2 text-[10px] font-bold text-rose-400 uppercase tracking-widest">收起推荐</button>
        </section>
      )}

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
          <Info size={12} className="inline mr-1" />
          温馨提示：食品交换份原则允许您在同类食物中灵活替换。例如25g大米可换成100g土豆，但热量保持基本一致，便于您丰富饮食多样性。
        </p>
      </div>
    </div>
  );
};

const WeightInput: React.FC<{ label: string, value: number, onChange: (v: string) => void, icon: React.ReactNode }> = ({ label, value, onChange, icon }) => (
  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {icon} {label}
    </div>
    <input 
      type="number" 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-bold text-slate-800"
      placeholder="0"
    />
  </div>
);

const ExchangeCard: React.FC<{ 
  category: string, 
  baseValue: number, 
  selected: string, 
  onSelect: (n: string) => void,
  calculate: (c: string, b: number, t: string) => number 
}> = ({ category, baseValue, selected, onSelect, calculate }) => {
  const options = EXCHANGE_RATES[category]?.options || [];
  const currentSelection = selected || options[0]?.name;

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-slate-800">{category} 转换</span>
        <div className="flex items-center gap-1 text-rose-500 font-bold">
          <span className="text-lg">{calculate(category, baseValue, currentSelection)}</span>
          <span className="text-[10px] font-medium text-slate-400">g</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {options.map(opt => (
          <button
            key={opt.name}
            onClick={() => onSelect(opt.name)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
              currentSelection === opt.name ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuPlanner;
