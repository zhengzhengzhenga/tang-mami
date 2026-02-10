
export enum MealType {
  BREAKFAST = '早餐',
  AM_SNACK = '上午加餐',
  LUNCH = '午餐',
  PM_SNACK = '下午加餐',
  DINNER = '晚餐',
  NIGHT_SNACK = '睡前加餐'
}

export enum FoodCategory {
  STAPLE = '主食',
  PROTEIN = '蛋白质',
  VEGETABLE = '蔬菜',
  OTHER = '其他'
}

export interface FoodItem {
  id: string;
  category: FoodCategory;
  name: string;
  weight: number; // 克
}

export enum GlucoseTiming {
  FASTING = '空腹',
  POST_MEAL_1H = '餐后1小时',
  POST_MEAL_2H = '餐后2小时',
  BEFORE_SLEEP = '睡前'
}

export interface GlucoseLog {
  id: string;
  value: number;
  unit: 'mmol/L' | 'mg/dL';
  timing: GlucoseTiming;
  mealType?: MealType; // 兜底餐次类型
  associatedMealId?: string; // 新增：关联的具体餐食ID
  timestamp: Date;
}

export interface MealLog {
  id: string;
  type: MealType;
  description: string;
  items?: FoodItem[];
  photoUrl?: string;
  nutrients?: {
    carbs: number;
    calories: number;
    protein: number;
    fats: number;
  };
  timestamp: Date;
}

export interface ExerciseLog {
  id: string;
  activity: string;
  duration: number; // 分钟
  intensity: '低' | '中' | '高';
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  weeksPregnant: number;
  targetRanges: {
    fasting: [number, number];
    postMeal1h: [number, number];
    postMeal2h: [number, number];
  };
}
