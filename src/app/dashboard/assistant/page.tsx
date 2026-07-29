'use client';

import { Cpu } from 'lucide-react';
import { useGroq } from '@/hooks/useGroq';
import { AIChat } from '@/components/AIChat';
import { useSimulation } from '@/components/dashboard/SimulationProvider';

export default function AssistantPage() {
  const { simulationState } = useSimulation();
  const { messages, loading, error, sendMessage } = useGroq({
    initialMessages: [
      { role: 'assistant', content: 'Hello! I am the FloodGuard AI Assistant. I am directly connected to the master flood simulation engine. Ask me anything about the current emergency status.' }
    ],
    context: 'assistant',
    customSystemPrompt: `You are the FloodGuard AI Assistant. The current simulation state is: ${JSON.stringify(simulationState)}. Answer questions based on this live context.`
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] transition-colors">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Direct interface to the Groq-powered LangGraph coordinator.</p>
        </div>
        <div className="flex space-x-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
            <Cpu size={14} className="mr-1.5 text-blue-500" /> Groq LLaMA3
          </div>
          <div className="bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400 rounded-lg px-3 py-1.5 flex items-center text-xs font-medium shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span> Connected
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <AIChat
          messages={messages}
          loading={loading}
          error={error}
          onSendMessage={sendMessage}
          placeholder="Ask the AI Assistant..."
          className="rounded-none border-0 flex-1"
        />
      </div>
    </div>
  );
}
