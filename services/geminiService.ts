
import { GoogleGenAI, Type } from "@google/genai";
import { MealType } from "../types";

// Fix: Use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMeal = async (description: string, imageBase64?: string) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `分析这份针对妊娠期糖尿病（GDM）孕妇的餐食。
  描述：${description}。
  请估算营养成分，并根据GDM管理要求提供反馈建议。请确保所有返回的文本（advice, gi_rating）都是中文。`;

  const contents: any = { parts: [{ text: prompt }] };
  if (imageBase64) {
    contents.parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          carbs: { type: Type.NUMBER, description: "估算的碳水化合物（克）" },
          calories: { type: Type.NUMBER, description: "估算的热量（千卡）" },
          protein: { type: Type.NUMBER, description: "估算的蛋白质（克）" },
          fats: { type: Type.NUMBER, description: "估算的脂肪（克）" },
          advice: { type: Type.STRING, description: "针对GDM的健康建议" },
          gi_rating: { type: Type.STRING, description: "GI值评估（低、中、高）" }
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
      systemInstruction: "你是一位专业的妊娠期糖尿病（GDM）健康助手。你的目标是为怀孕的妈妈们提供关于饮食、运动和血糖控制的支持性和科学性建议。回答要积极鼓励且简明扼要，并始终提醒用户咨询医生进行临床决策。",
    }
  });

  const response = await chat.sendMessage({ message: query });
  return response.text;
};