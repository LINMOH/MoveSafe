/**
 * 健康评估引擎 - 多学科加权算法
 * 实现生物指标、运动指标计算和关联性建议
 */

// 生物指标计算
export interface BiologicalMetrics {
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  bmr: number; // 基础代谢率 (kcal/day)
  tdee: number; // 每日总消耗 (kcal/day)
}

// 运动指标计算
export interface ExerciseMetrics {
  mhr: number; // 最大心率
  aerobicZone: {
    min: number; // 有氧运动区间下限 (60% MHR)
    max: number; // 有氧运动区间上限 (70% MHR)
  };
}

// 活动等级系数
export const ACTIVITY_LEVELS = {
  sedentary: 1.2,      // 久坐
  light: 1.375,       // 轻度活动
  moderate: 1.55,     // 中度活动
  active: 1.725,      // 活跃
  veryActive: 1.9     // 非常活跃
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

// BMI 分类标准
export const BMI_CATEGORIES = {
  underweight: { min: 0, max: 18.4, label: '消瘦', color: '#ff9800' },
  normal: { min: 18.5, max: 24.9, label: '正常', color: '#4caf50' },
  overweight: { min: 25, max: 29.9, label: '超重', color: '#ff9800' },
  obese: { min: 30, max: 100, label: '肥胖', color: '#f44336' }
} as const;

/**
 * 计算 BMI 并分类
 */
export function calculateBMI(height: number, weight: number): { bmi: number; category: keyof typeof BMI_CATEGORIES } {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  let category: keyof typeof BMI_CATEGORIES = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi >= 18.5 && bmi < 25) category = 'normal';
  else if (bmi >= 25 && bmi < 30) category = 'overweight';
  else category = 'obese';
  
  return { bmi: parseFloat(bmi.toFixed(1)), category };
}

/**
 * 计算基础代谢率 (BMR) - Mifflin-St Jeor 公式
 */
export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * 计算每日总消耗 (TDEE)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_LEVELS[activityLevel];
}

/**
 * 计算最大心率 (MHR)
 */
export function calculateMHR(age: number): number {
  return 220 - age;
}

/**
 * 计算有氧运动区间
 */
export function calculateAerobicZone(mhr: number): { min: number; max: number } {
  return {
    min: Math.round(mhr * 0.6),
    max: Math.round(mhr * 0.7)
  };
}

/**
 * 获取所有生物指标
 */
export function getBiologicalMetrics(
  height: number,
  weight: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: ActivityLevel
): BiologicalMetrics {
  const { bmi, category } = calculateBMI(height, weight);
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  
  return {
    bmi,
    bmiCategory: category,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee)
  };
}

/**
 * 获取所有运动指标
 */
export function getExerciseMetrics(age: number): ExerciseMetrics {
  const mhr = calculateMHR(age);
  const aerobicZone = calculateAerobicZone(mhr);
  
  return {
    mhr,
    aerobicZone
  };
}

/**
 * 关联性建议引擎
 */
export interface HealthRecommendation {
  type: 'warning' | 'suggestion' | 'success';
  title: string;
  description: string;
  reason: string;
  priority: number; // 1-5, 5为最高优先级
}

export function generateRecommendations(
  bmi: number,
  bmiCategory: keyof typeof BMI_CATEGORIES,
  age: number,
  tdee: number,
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  
  // 逻辑 A: BMI > 25 且年龄 > 45
  if (bmi > 25 && age > 45) {
    recommendations.push({
      type: 'warning',
      title: '关节保护建议',
      description: '建议以低冲击运动（游泳、快走、椭圆机）为主，预防膝关节受损。',
      reason: `您的BMI为${bmi}（${BMI_CATEGORIES[bmiCategory].label}），年龄${age}岁，属于关节损伤高风险人群。`,
      priority: 5
    });
  }
  
  // 逻辑 B: TDEE较高且处于夏季
  if (tdee > 2500 && season === 'summer') {
    recommendations.push({
      type: 'suggestion',
      title: '电解质补充建议',
      description: '建议增加电解质补充，特别是在高温天气进行高强度运动时。',
      reason: `您的每日总消耗为${tdee}kcal，夏季高温易导致电解质流失。`,
      priority: 4
    });
  }
  
  // 根据BMI分类的建议
  if (bmiCategory === 'underweight') {
    recommendations.push({
      type: 'suggestion',
      title: '增重建议',
      description: '建议增加营养摄入，结合力量训练增加肌肉量。',
      reason: `您的BMI为${bmi}，属于消瘦范围。`,
      priority: 3
    });
  } else if (bmiCategory === 'overweight' || bmiCategory === 'obese') {
    recommendations.push({
      type: 'warning',
      title: '减重建议',
      description: '建议控制饮食热量，结合有氧运动和力量训练。',
      reason: `您的BMI为${bmi}，属于${BMI_CATEGORIES[bmiCategory].label}范围。`,
      priority: 4
    });
  }
  
  // 年龄相关建议
  if (age > 50) {
    recommendations.push({
      type: 'suggestion',
      title: '中老年运动建议',
      description: '建议定期进行柔韧性训练和平衡训练，预防跌倒。',
      reason: `年龄${age}岁，需要关注关节柔韧性和平衡能力。`,
      priority: 3
    });
  }
  
  // 默认健康建议
  recommendations.push({
    type: 'success',
    title: '保持健康习惯',
    description: '建议每周进行150分钟中等强度有氧运动或75分钟高强度有氧运动。',
    reason: '符合世界卫生组织推荐的运动量标准。',
    priority: 2
  });
  
  // 按优先级排序
  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * 获取BMI颜色标签
 */
export function getBMIColor(bmiCategory: keyof typeof BMI_CATEGORIES): string {
  return BMI_CATEGORIES[bmiCategory].color;
}

/**
 * 获取BMI标签文本
 */
export function getBMILabel(bmiCategory: keyof typeof BMI_CATEGORIES): string {
  return BMI_CATEGORIES[bmiCategory].label;
}

/**
 * 计算理想体重范围
 */
export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const heightInMeters = height / 100;
  const minBMI = 18.5;
  const maxBMI = 24.9;
  
  return {
    min: Math.round(minBMI * heightInMeters * heightInMeters * 10) / 10,
    max: Math.round(maxBMI * heightInMeters * heightInMeters * 10) / 10
  };
}

/**
 * 计算减重/增重所需热量差
 */
export function calculateCalorieDeficitSurplus(
  currentWeight: number,
  targetWeight: number,
  timeframeWeeks: number = 8
): { dailyCalorieChange: number; weeklyWeightChange: number } {
  const weightDifference = targetWeight - currentWeight;
  const totalCalorieChange = weightDifference * 7700; // 1kg脂肪 ≈ 7700kcal
  const dailyCalorieChange = Math.round(totalCalorieChange / (timeframeWeeks * 7));
  const weeklyWeightChange = Math.round((dailyCalorieChange * 7) / 7700 * 100) / 100;
  
  return {
    dailyCalorieChange,
    weeklyWeightChange
  };
}