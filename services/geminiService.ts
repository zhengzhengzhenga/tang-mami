
import { GoogleGenAI, Type } from "@google/genai";
import { MealType } from "../types.ts";

export const analyzeMeal = async (description: string, imageBase64?: string) => {
  // 每次调用时实例化，确保获取最新的 API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `分析这份针对妊娠期糖尿病（GDM）孕妇的餐食。描述：${description}。请以 JSON 格式预估营养成分并提供专业建议。`;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          carbs: { type: Type.NUMBER, description: "碳水 (g)" },
          calories: { type: Type.NUMBER, description: "热量 (kcal)" },
          protein: { type: Type.NUMBER, description: "蛋白质 (g)" },
          fats: { type: Type.NUMBER, description: "脂肪 (g)" },
          advice: { type: Type.STRING, description: "健康反馈" },
          gi_rating: { type: Type.STRING, description: "GI等级" }
        },
        required: ["carbs", "calories", "advice"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getHealthAdvisorResponse = async (query: string, history: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "你是一位专门服务于妊娠期糖尿病孕妇的营养与健康专家。请提供温暖、专业且科学的建议。如果涉及医疗决策，务必提醒用户咨询医生。",
    }
  });
  const response = await chat.sendMessage({ message: query });
  return response.text;
};
