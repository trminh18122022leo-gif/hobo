export interface LLMProvider {
  name: string;
  call(prompt: string, systemPrompt: string): Promise<string>;
}

class GeminiProvider implements LLMProvider {
  name = 'Gemini';
  async call(prompt: string, systemPrompt: string): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });
    
    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

class GroqProvider implements LLMProvider {
  name = 'Groq';
  async call(prompt: string, systemPrompt: string): Promise<string> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not set');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export class LLMRouter {
  private providers: LLMProvider[] = [];
  private cache = new Map<string, {result: string, expiresAt: number}>();
  
  constructor() {
    if (process.env.GEMINI_API_KEY) this.providers.push(new GeminiProvider());
    if (process.env.GROQ_API_KEY) this.providers.push(new GroqProvider());
  }
  
  async complete(systemPrompt: string, userPrompt: string, cacheKey?: string): Promise<string | null> {
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result;
      }
    }
    
    for (const provider of this.providers) {
      try {
        const result = await provider.call(userPrompt, systemPrompt);
        if (cacheKey) {
          this.cache.set(cacheKey, {
            result,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }
        return result;
      } catch (e) {
        console.error(`${provider.name} failed:`, e);
      }
    }
    
    return null;
  }
}

export const llmRouter = new LLMRouter();

export const SYSTEM_PROMPT = 'Bạn là cố vấn học bổng. Chỉ dùng thông tin trong phần DỮ LIỆU. Tuyệt đối không suy đoán điều kiện không có trong dữ liệu. Với mỗi điều kiện bạn nhắc tới, phải trích nguyên văn vào trường evidence. Nếu dữ liệu không nói rõ, ghi evidence là null và nói rõ là chưa rõ. Chỉ trả JSON đúng schema, không thêm chữ nào khác.';

export function buildScholarshipPrompt(profile: any, opportunities: any[]): {system: string, user: string} {
  const user = `DỮ LIỆU:\nProfile: ${JSON.stringify(profile)}\nOpportunities: ${JSON.stringify(opportunities)}`;
  return { system: SYSTEM_PROMPT, user };
}
