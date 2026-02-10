
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
  Apple
} from 'lucide-react';
import { MealType, FoodCategory } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MenuPlannerProps {
  onBack: () => void;
}

/**
 * 食品交换份标准（基于北京朝阳医院营养科提供的1800kcal方案）
 * 每一份（单位）的热量约等于 90 千卡。
 * 转换逻辑：(输入克重 / 该类别的基准克重) * 目标食物的一份克重 = 推荐食用克重
 */
const EXCHANGE_RATES: Record<string, { baseWeight: number, options: { name: string, weight: number }[] }> = {
  [FoodCategory.STAPLE]: {
    baseWeight: 25, // 以25g大米/面粉为1个单位
    options: [
      { name: '大米/小米/糯米', weight: 25 },
      { name: '面粉/玉米面/燕麦', weight: 25 },
      { name: '荞麦米/莜面/苦荞', weight: 25 },
      { name: '全麦面包', weight: 35 },
      { name: '马铃薯(土豆)', weight: 100 },
      { name: '鲜玉米(带心)', weight: 200 },
      { name: '山药/芋头/藕', weight: 150 },
      { name: '红豆/绿豆/杂豆', weight: 25 }
    ]
  },
  [FoodCategory.PROTEIN]: {
    baseWeight: 50, // 以50g瘦肉为1个单位
    options: [
      { name: '猪/牛/羊瘦肉', weight: 50 },
      { name: '鸡胸肉/兔肉', weight: 50 },
      { name: '里脊肉/酱牛肉', weight: 50 },
      { name: '鱼类', weight: 80 },
      { name: '虾/蟹肉/海蜇', weight: 50 },
      { name: '豆腐丝/干豆腐', weight: 50 },
      { name: '北豆腐', weight: 100 },
      { name: '南豆腐', weight: 150 },
      { name: '鸡蛋(约1个)', weight: 60 },
      { name: '海参(中等)', weight: 50 }
    ]
  },
  [FoodCategory.VEGETABLE]: {
    baseWeight: 500, // 以500g绿叶菜为1个单位
    options: [
      { name: '绿叶菜(菠菜/芹菜等)', weight: 500 },
      { name: '白萝卜/青椒/冬笋', weight: 400 },
      { name: '南瓜/菜花/丝瓜', weight: 350 },
      { name: '豇豆/蒜苗/洋葱/扁豆', weight: 250 },
      { name: '胡萝卜/西红柿', weight: 200 },
      { name: '菌菇/海带/紫菜', weight: 500 }
    ]
  },
  'FRUIT': {
    baseWeight: 200, // 以200g苹果/梨为1个单位
    options: [
      { name: '苹果/梨/桃', weight: 200 },
      { name: '橘子/橙子/柚子', weight: 200 },
      { name: '猕猴桃/葡萄/樱桃', weight: 200 },
      { name: '草莓', weight: 300 },
      { name: '西瓜', weight: 500 },
      { name: '香蕉/鲜荔枝/芒果', weight: 150 }
    ]
  },
  'DAIRY': {
    baseWeight: 160, // 以160ml牛奶为1个单位
    options: [
      { name: '全脂牛奶', weight: 160 },
      { name: '无糖酸奶', weight: 130 },
      { name: '豆浆', weight: 400 },
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
  other: number; // 包含水果或油脂
}

const DEFAULT_REQUIREMENTS: MealRequirement[] = [
  { type: MealType.BREAKFAST, staple: 50, protein: 60, vegetable: 100, other: 160 }, // 早餐: 2份主食+1个蛋+奶
  { type: MealType.LUNCH, staple: 75, protein: 75, vegetable: 250, other: 15 },    // 午餐: 3份主食+1.5份肉+0.5份菜+油
  { type: MealType.DINNER, staple: 50, protein: 75, vegetable: 250, other: 10 }    // 晚餐: 2份主食+1.5份肉+0.5份菜+油
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
    
    // 计算公式: (用户输入基准克重 / 基准单位克重) * 目标食物单位克重
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
    早餐：主食 ${requirements[0].staple}g, 蛋白质 ${requirements[0].protein}g, 蔬菜 ${requirements[0].vegetable}g, 其他(奶类) ${requirements[0].other}g
    午餐：主食 ${requirements[1].staple}g, 蛋白质 ${requirements[1].protein}g, 蔬菜 ${requirements[1].vegetable}g, 其他(油脂) ${requirements[1].other}g
    晚餐：主食 ${requirements[2].staple}g, 蛋白质 ${requirements[2].protein}g, 蔬菜 ${requirements[2].vegetable}g, 其他(油脂) ${requirements[2].other}g
    
    要求：
    1. 严格遵循“干不宜稀”原则（不推荐大米粥、小米粥），主食推荐杂粮、糙米。
    2. 蛋白质来源要丰富，优先推荐鸡胸肉、鱼虾、豆制品。
    3. 蔬菜总量建议维持在每天500g以上，强调深色绿叶菜。
    4. 结合当前设定的克重值进行推荐，并给出具体的烹饪建议。
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
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 pb-12 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-rose-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">智能配餐规划</h2>
        <button 
          onClick={handleGenerateMenu} 
          disabled={isGenerating}
          className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <RefreshCcw size={20} className="animate-spin" /> : <Zap size={20} />}
        </button>
      </div>

      {/* 顶部餐次切换 */}
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

      {/* 克重输入区 */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-rose-500" />
            <h3 className="font-bold text-slate-800 text-sm">设定基准克重</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">基准：米饭 / 瘦肉 / 绿叶菜</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <WeightInput label="主食基准 (g)" value={activeReq.staple} onChange={(v) => updateReq('staple', v)} icon={<Utensils size={14} className="text-amber-500" />} />
          <WeightInput label="蛋白质基准 (g)" value={activeReq.protein} onChange={(v) => updateReq('protein', v)} icon={<Zap size={14} className="text-blue-500" />} />
          <WeightInput label="蔬菜基准 (g)" value={activeReq.vegetable} onChange={(v) => updateReq('vegetable', v)} icon={<ChefHat size={14} className="text-emerald-500" />} />
          <WeightInput label="油脂/奶类/其他" value={activeReq.other} onChange={(v) => updateReq('other', v)} icon={<Info size={14} className="text-slate-500" />} />
        </div>
      </section>

      {/* 自动转换区 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Scale size={16} className="text-rose-400" /> 食品等值交换计算
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">克重随选而动</span>
        </div>

        <div className="space-y-3">
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
          <ExchangeCard 
            category="FRUIT" 
            baseValue={200} // 水果通常以1份(200g苹果)为日常参考
            selected={selectedFoods['FRUIT']} 
            onSelect={(name) => setSelectedFoods(prev => ({...prev, ['FRUIT']: name}))}
            calculate={calculateWeight}
            title="加餐水果"
          />
        </div>
      </section>

      {/* AI 推荐结果展示 */}
      {aiMenu && (
        <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-rose-500" />
              <h3 className="font-bold text-rose-800">全天饮食推荐方案</h3>
            </div>
            <button onClick={() => setAiMenu(null)} className="text-rose-400"><Trash2 size={16} /></button>
          </div>
          <div className="prose prose-sm text-rose-900 leading-relaxed whitespace-pre-wrap text-[11px]">
            {aiMenu}
          </div>
        </section>
      )}

      <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 shadow-sm">
        <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
          <Info size={12} className="inline mr-1" />
          <strong>什么是食品交换份？</strong> 同一类别的食物克重经过等效转换，其提供的热量基本相同。您可以根据口味喜好在同类中任意替换，例如想吃土豆时，只需将原本的米饭克重进行等比转换即可，方便多样化饮食。
        </p>
      </div>
    </div>
  );
};

const WeightInput: React.FC<{ label: string, value: number, onChange: (v: string) => void, icon: React.ReactNode }> = ({ label, value, onChange, icon }) => (
  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-rose-200 transition-all">
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
  calculate: (c: string, b: number, t: string) => number,
  title?: string
}> = ({ category, baseValue, selected, onSelect, calculate, title }) => {
  const options = EXCHANGE_RATES[category]?.options || [];
  const currentSelection = selected || options[0]?.name;

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {category === FoodCategory.STAPLE && <Utensils size={14} className="text-amber-500" />}
          {category === FoodCategory.PROTEIN && <Zap size={14} className="text-blue-500" />}
          {category === FoodCategory.VEGETABLE && <ChefHat size={14} className="text-emerald-500" />}
          {category === 'FRUIT' && <Apple size={14} className="text-rose-500" />}
          <span className="text-xs font-bold text-slate-800">{title || category} 替换方案</span>
        </div>
        <div className="flex items-baseline gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 mr-1">建议:</span>
          <span className="text-sm font-black text-rose-500">{calculate(category, baseValue, currentSelection)}</span>
          <span className="text-[10px] font-bold text-slate-400">g</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {options.map(opt => (
          <button
            key={opt.name}
            onClick={() => onSelect(opt.name)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-bold border-2 transition-all ${
              currentSelection === opt.name 
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100 scale-105' 
                : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
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
