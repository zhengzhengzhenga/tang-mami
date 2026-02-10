
import { GoogleGenAI, Type } from "@google/genai";
import { MealType } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMeal = async (description: string, imageBase64?: string) => {
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
  const model = 'gemini-3-pro-preview';
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "你是一位妊娠期糖尿病助手。请提供科学建议并提醒用户咨询医生。",
    }
  });
  const response = await chat.sendMessage({ message: query });
  return response.text;
};
