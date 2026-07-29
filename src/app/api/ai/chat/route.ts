import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/auth';
import { generateAIResponse } from '@/services/groq';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context, customSystemPrompt, jsonMode } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let systemPrompt = customSystemPrompt;

    if (!systemPrompt) {
      // Default system prompts based on context
      switch (context) {
        case 'dashboard':
          systemPrompt = `You are an AI assistant providing quick, professional insights on a disaster management dashboard.
Keep your response under 3 sentences. Highlight critical risks or suggest immediate actions.`;
          break;
        case 'prediction':
          systemPrompt = `You are a hydrological expert AI. The user is asking about flood predictions. 
Explain predictions clearly, mention confidence levels if uncertain, and avoid hallucinating data.`;
          break;
        case 'routing':
          systemPrompt = `You are an evacuation routing AI. Explain why the suggested route is safest based on flood data. Keep it concise.`;
          break;
        default:
          // Get latest flood prediction for default chatbot context
          let floodContext = '- No active flood prediction';
          try {
            const predictionSnapshot = await adminDb.collection('flood_predictions')
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();
              
            const latestPrediction = predictionSnapshot.empty ? null : predictionSnapshot.docs[0].data();
            if (latestPrediction) {
              floodContext = `- Risk Score: ${latestPrediction.riskScore}/100
- Severity: ${latestPrediction.severity}
- Flood Probability: ${(latestPrediction.floodProbability * 100).toFixed(1)}%`;
            }
          } catch (e) {
            console.error("Error fetching prediction context", e);
          }

          systemPrompt = `You are FloodGuard AI, an emergency response chatbot helping users during flood emergencies. 
          
Current flood status:
${floodContext}

Provide helpful, accurate, and concise responses about:
- Current flood risk and predictions
- Evacuation routes and shelters
- Safety instructions
- Emergency contacts

Keep responses brief (2-4 sentences) unless asked for details. Always prioritize user safety and do not hallucinate emergency information.`;
      }
    }

    const response = await generateAIResponse({
      systemPrompt,
      userPrompt: message,
      jsonMode,
      maxTokens: 400,
    });

    // Save conversation only for general assistant queries to avoid cluttering the DB with dashboard widget calls
    if (!context || context === 'assistant') {
      await adminDb.collection('chat_conversations').add({
        userId: session.uid,
        message,
        response,
        context: context || 'assistant',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      reply: response,
    });
  } catch (error: any) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
