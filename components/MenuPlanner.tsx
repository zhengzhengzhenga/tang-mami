
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
  Check,
  Apple,
  Search,
  Loader2
} from 'lucide-react';
import { MealType, FoodCategory } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

interface MenuPlannerProps {
  onBack: () => void;
}

/**
 * 食品交换份标准（基于1800kcal方案）
 * 每一份（单位）的热量约等于 90 千卡。
 */
const EXCHANGE_RATES: Record<string, { baseWeight: number, options: { name: string, weight: number }[] }> = {
  [FoodCategory.STAPLE]: {
    baseWeight: 25, 
    options: [
      { name: '大米/小米/糯米', weight: 25 },
      { name: '面粉/玉米面/燕麦', weight: 25 },
      { name: '荞麦米/莜面/糙米', weight: 25 },
      { name: '全麦面包', weight: 35 },
      { name: '土豆/马铃薯', weight: 100 },
      { name: '山药/芋头/藕', weight: 150 },
      { name: '红豆/绿豆/黑豆', weight: 25 }
    ]
  },
  [FoodCategory.PROTEIN]: {
    baseWeight: 50, 
    options: [
      { name: '猪/牛/羊瘦肉', weight: 50 },
      { name: '鸡胸肉/兔肉', weight: 50 },
      { name: '鱼肉/虾肉', weight: 80 },
      { name: '北豆腐', weight: 100 },
      { name: '南豆腐', weight: 150 },
      { name: '鸡蛋(约1个)', weight: 60 },
      { name: '豆浆', weight: 400 }
    ]
  },
  [FoodCategory.VEGETABLE]: {
    baseWeight: 500, 
    options: [
      { name: '绿叶菜(菠菜等)', weight: 500 },
      { name: '白萝卜/青椒/冬笋', weight: 400 },
      { name: '南瓜/菜花/丝瓜', weight: 350 },
      { name: '胡萝卜/西红柿', weight: 200 },
      { name: '菌菇/海带', weight: 500 }
    ]
  },
  'FRUIT': {
    baseWeight: 200, 
    options: [
      { name: '苹果/梨/桃', weight: 200 },
      { name: '橙子/橘子/柚子', weight: 200 },
      { name: '草莓', weight: 300 },
      { name: '猕猴桃/圣女果', weight: 200 },
      { name: '香蕉/芒果', weight: 150 }
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
  { type: MealType.BREAKFAST, staple: 50, protein: 60, vegetable: 100, other: 160 },
  { type: MealType.LUNCH, staple: 75, protein: 75, vegetable: 250, other: 15 },
  { type: MealType.DINNER, staple: 50, protein: 75, vegetable: 250, other: 10 }
];

const MenuPlanner: React.FC<MenuPlannerProps> = ({ onBack }) => {
  const [requirements, setRequirements] = useState<MealRequirement[]>(DEFAULT_REQUIREMENTS);
  const [activeTab, setActiveTab] = useState<MealType>(MealType.LUNCH);
  const [selectedFoods, setSelectedFoods] = useState<Record<string, {name: string, weightPerUnit: number}>>({});
  const [isAiEstimating, setIsAiEstimating] = useState<string | null>(null);
  const [aiMenu, setAiMenu] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeReq = useMemo(() => requirements.find(r => r.type === activeTab) || requirements[0], [requirements, activeTab]);

  const calculateDisplayWeight = (category: string, baseInput: number, weightPerUnit: number) => {
    const categoryConfig = EXCHANGE_RATES[category];
    if (!categoryConfig) return 0;
    return Math.round((baseInput / categoryConfig.baseWeight) * weightPerUnit);
  };

  const handleCustomFoodSearch = async (category: string, query: string) => {
    if (!query.trim()) return;
    
    const localMatch = EXCHANGE_RATES[category]?.options.find(o => o.name.includes(query) || query.includes(o.name));
    if (localMatch) {
      setSelectedFoods(prev => ({...prev, [category]: { name: localMatch.name, weightPerUnit: localMatch.weight }}));
      return;
    }

    setIsAiEstimating(category);
    // Corrected to create instance right before making an API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `你是一位妊娠期糖尿病营养专家。请分析食物 "${query}"，它属于 "${category}" 类别。请估算该食物提供 1 个“食品交换份”（即 90 千卡热量）时，对应的标准食用克重。请以 JSON 格式返回。`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "食物正式名称" },
              weight: { type: Type.NUMBER, description: "对应1份(90kcal)的克数" }
            },
            required: ["name", "weight"]
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.weight) {
        setSelectedFoods(prev => ({...prev, [category]: { name: result.name, weightPerUnit: result.weight }}));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiEstimating(null);
    }
  };

  const handleGenerateMenu = async () => {
    setIsGenerating(true);
    // Corrected to create instance right before making an API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `你是一位专家。请根据以下克重需求推荐一天的精细化菜单：
    早餐：主食 ${requirements[0].staple}g, 蛋白质 ${requirements[0].protein}g, 蔬菜 ${requirements[0].vegetable}g
    午餐：主食 ${requirements[1].staple}g, 蛋白质 ${requirements[1].protein}g, 蔬菜 ${requirements[1].vegetable}g
    晚餐：主食 ${requirements[2].staple}g, 蛋白质 ${requirements[2].protein}g, 蔬菜 ${requirements[2].vegetable}g
    要求回复简洁，Markdown 格式，中文。重点在于如何烹饪能保证升糖慢。`;

    try {
      const result = await ai.models.generateContent({ model, contents: prompt });
      setAiMenu(result.text || '暂无内容');
    } catch (e) {
      setAiMenu('生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-rose-500 transition-colors"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">智能配餐规划</h2>
        <button 
          onClick={handleGenerateMenu} 
          className="p-2 text-rose-500 bg-rose-50 rounded-xl active:scale-95 transition-all"
        >
          {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl">
        {DEFAULT_REQUIREMENTS.map(r => (
          <button 
            key={r.type}
            onClick={() => setActiveTab(r.type)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === r.type ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
          >
            {r.type}
          </button>
        ))}
      </div>

      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={18} className="text-rose-500" />
          <h3 className="font-bold text-slate-800 text-sm">设定基准克重需求</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <WeightInput label="主食基准 (g)" value={activeReq.staple} onChange={(v) => setRequirements(prev => prev.map(r => r.type === activeTab ? {...r, staple: parseFloat(v) || 0} : r))} icon={<Utensils size={14} className="text-amber-500" />} />
          <WeightInput label="蛋白质基准 (g)" value={activeReq.protein} onChange={(v) => setRequirements(prev => prev.map(r => r.type === activeTab ? {...r, protein: parseFloat(v) || 0} : r))} icon={<Zap size={14} className="text-blue-500" />} />
          <WeightInput label="蔬菜基准 (g)" value={activeReq.vegetable} onChange={(v) => setRequirements(prev => prev.map(r => r.type === activeTab ? {...r, vegetable: parseFloat(v) || 0} : r))} icon={<ChefHat size={14} className="text-emerald-500" />} />
          <WeightInput label="其他/油脂" value={activeReq.other} onChange={(v) => setRequirements(prev => prev.map(r => r.type === activeTab ? {...r, other: parseFloat(v) || 0} : r))} icon={<Info size={14} className="text-slate-500" />} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="px-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Scale size={16} className="text-rose-400" /> 食品等值换算
          </h3>
        </div>

        <div className="space-y-4">
          <ExchangeSection 
            category={FoodCategory.STAPLE} 
            baseValue={activeReq.staple} 
            currentSelection={selectedFoods[FoodCategory.STAPLE]}
            onSelect={(name, w) => setSelectedFoods(prev => ({...prev, [FoodCategory.STAPLE]: {name, weightPerUnit: w}}))}
            onSearch={(q) => handleCustomFoodSearch(FoodCategory.STAPLE, q)}
            isEstimating={isAiEstimating === FoodCategory.STAPLE}
            calculate={calculateDisplayWeight}
          />
          <ExchangeSection 
            category={FoodCategory.PROTEIN} 
            baseValue={activeReq.protein} 
            currentSelection={selectedFoods[FoodCategory.PROTEIN]}
            onSelect={(name, w) => setSelectedFoods(prev => ({...prev, [FoodCategory.PROTEIN]: {name, weightPerUnit: w}}))}
            onSearch={(q) => handleCustomFoodSearch(FoodCategory.PROTEIN, q)}
            isEstimating={isAiEstimating === FoodCategory.PROTEIN}
            calculate={calculateDisplayWeight}
          />
          <ExchangeSection 
            category={FoodCategory.VEGETABLE} 
            baseValue={activeReq.vegetable} 
            currentSelection={selectedFoods[FoodCategory.VEGETABLE]}
            onSelect={(name, w) => setSelectedFoods(prev => ({...prev, [FoodCategory.VEGETABLE]: {name, weightPerUnit: w}}))}
            onSearch={(q) => handleCustomFoodSearch(FoodCategory.VEGETABLE, q)}
            isEstimating={isAiEstimating === FoodCategory.VEGETABLE}
            calculate={calculateDisplayWeight}
          />
        </div>
      </section>

      {aiMenu && (
        <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 animate-in zoom-in-95 duration-300">
          <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2 font-bold"><Zap size={18} /> 专家推荐菜单</h3>
          <div className="prose prose-sm text-rose-900 leading-relaxed whitespace-pre-wrap text-[11px] font-medium">{aiMenu}</div>
          <button onClick={() => setAiMenu(null)} className="mt-4 text-[10px] font-black text-rose-400 uppercase tracking-widest">关闭报告</button>
        </section>
      )}
    </div>
  );
};

const WeightInput: React.FC<{ label: string, value: number, onChange: (v: string) => void, icon: React.ReactNode }> = ({ label, value, onChange, icon }) => (
  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
      {icon} {label}
    </div>
    <input 
      type="number" value={value || ''} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-black text-slate-800"
      placeholder="0"
    />
  </div>
);

const ExchangeSection: React.FC<{ 
  category: string, 
  baseValue: number, 
  currentSelection?: {name: string, weightPerUnit: number},
  onSelect: (n: string, w: number) => void,
  onSearch: (q: string) => void,
  isEstimating: boolean,
  calculate: (c: string, b: number, w: number) => number 
}> = ({ category, baseValue, currentSelection, onSelect, onSearch, isEstimating, calculate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const options = EXCHANGE_RATES[category]?.options || [];
  const activeFood = currentSelection || { name: options[0]?.name, weightPerUnit: options[0]?.weight };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
          {category === FoodCategory.STAPLE && <Utensils size={14} className="text-amber-500" />}
          {category === FoodCategory.PROTEIN && <Zap size={14} className="text-blue-500" />}
          {category === FoodCategory.VEGETABLE && <ChefHat size={14} className="text-emerald-500" />}
          {category}换算
        </h4>
        <div className="bg-rose-50 px-3 py-1 rounded-full border border-rose-100 flex items-baseline gap-1 shadow-sm">
          <span className="text-sm font-black text-rose-500">{calculate(category, baseValue, activeFood.weightPerUnit)}</span>
          <span className="text-[10px] font-black text-rose-400 uppercase">g</span>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-1 focus-within:ring-rose-200 transition-all">
        <input 
          type="text" 
          placeholder="搜索或输入其他食物" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold text-slate-600"
        />
        <button 
          onClick={() => onSearch(searchQuery)}
          disabled={isEstimating || !searchQuery}
          className="p-1.5 text-rose-500 hover:bg-white rounded-xl transition-all disabled:opacity-30 active:scale-90"
        >
          {isEstimating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {options.map(opt => (
          <button
            key={opt.name}
            onClick={() => {
              onSelect(opt.name, opt.weight);
              setSearchQuery('');
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
              activeFood.name === opt.name ? 'bg-rose-500 border-rose-500 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {opt.name}
          </button>
        ))}
        {currentSelection && !options.find(o => o.name === currentSelection.name) && (
          <button className="flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black bg-rose-500 border-rose-500 text-white shadow-md scale-105">
            {currentSelection.name} (AI)
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuPlanner;
