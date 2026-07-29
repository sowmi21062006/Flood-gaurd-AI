import Groq from 'groq-sdk';
import crypto from 'crypto';

// Initialize the official Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key-for-build",
});

// Simple in-memory cache to reduce API calls for repeated identical prompts
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes cache

interface GenerateAIOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
}

export const generateAIResponse = async (options: GenerateAIOptions): Promise<string> => {
  const {
    systemPrompt,
    userPrompt,
    jsonMode = false,
    maxTokens = 500,
    temperature = 0.7,
    useCache = true,
  } = options;

  // Generate a unique hash for caching
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${systemPrompt}|${userPrompt}|${jsonMode}`)
    .digest('hex');

  // Check cache
  if (useCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('⚡ Using cached AI response');
      return cached.response;
    }
  }

  // Model fallback queue
  const models = ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b'];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`🤖 Generating AI response with model: ${model}`);
      
      const completionConfig: any = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: model,
        temperature,
        max_tokens: maxTokens,
      };

      if (jsonMode) {
        completionConfig.response_format = { type: 'json_object' };
      }

      // Add timeout logic (Groq SDK has built-in timeout, but we can wrap it if needed. 
      // Using standard await since SDK handles retries internally by default).
      const completion = await groq.chat.completions.create(completionConfig, { timeout: 15000 });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Empty response from AI');
      }

      // Save to cache
      if (useCache) {
        responseCache.set(cacheKey, {
          response: responseContent,
          timestamp: Date.now(),
        });
      }

      return responseContent;
    } catch (error: any) {
      console.error(`⚠️ Error with model ${model}:`, error.message);
      lastError = error;
      
      // If it's an auth error, don't retry with another model
      if (error.status === 401) {
        throw new Error('Invalid Groq API Key. Please check your environment variables.');
      }
      
      // If rate limited, we might want to wait or just fall back immediately
      if (error.status === 429) {
        console.warn('Rate limit exceeded, falling back to next model...');
      }
    }
  }

  // If all models fail
  console.error('❌ All Groq models failed to generate a response');
  throw new Error(`AI generation failed: ${lastError?.message || 'Unknown error'}`);
};
