import { useState, useCallback } from 'react';
import axios from 'axios';
import { auth } from '@/lib/firebase/config';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseGroqOptions {
  initialMessages?: Message[];
  context?: 'dashboard' | 'assistant' | 'prediction' | 'routing' | 'alerts';
  customSystemPrompt?: string;
}

export const useGroq = ({ initialMessages = [], context = 'assistant', customSystemPrompt }: UseGroqOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || loading) return null;

    setError(null);
    setLoading(true);

    const userMessage: Message = { role: 'user', content: message.trim() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      const response = await axios.post('/api/ai/chat', {
        message: message.trim(),
        context,
        customSystemPrompt,
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const assistantMessage: Message = { role: 'assistant', content: response.data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage.content;
    } catch (err: any) {
      console.error('Groq AI error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to communicate with AI';
      setError(errorMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading, context, customSystemPrompt]);

  // For one-off generations without updating message state (useful for widgets)
  const generateOneOff = useCallback(async (message: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      const response = await axios.post('/api/ai/chat', {
        message,
        context,
        customSystemPrompt,
      }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      return response.data.reply;
    } catch (err: any) {
      console.error('Groq AI one-off error:', err);
      setError(err.response?.data?.error || 'Failed to generate response');
      return null;
    } finally {
      setLoading(false);
    }
  }, [context, customSystemPrompt]);

  const clearMessages = () => {
    setMessages(initialMessages);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    generateOneOff,
    clearMessages,
  };
};
