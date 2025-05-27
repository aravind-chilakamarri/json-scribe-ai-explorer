
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function AiPanel() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeTab?.isValid) return;

    const userMessage = { role: 'user' as const, content: input };
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: userMessage });
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual GPT-4o API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = { 
        role: 'assistant' as const, 
        content: `I understand you're asking about the JSON data. Based on the current JSON structure, I can see ${Object.keys(activeTab.parsedContent || {}).length} top-level properties. What specific aspect would you like me to analyze?`
      };
      
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: aiResponse });
    } catch (error) {
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (!state.aiPanelOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">AI Q&A</h2>
        <Button
          onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
          variant="ghost"
          size="sm"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.chatHistory.length === 0 ? (
          <div className="text-gray-500 text-sm">
            Ask questions about your JSON data. I can help analyze structure, find patterns, and explain content.
          </div>
        ) : (
          state.chatHistory.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-4'
                  : 'bg-gray-100 mr-4'
              }`}
            >
              <div className="text-xs text-gray-600 mb-1">
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="text-sm">{message.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your JSON..."
            className="flex-1 p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !activeTab?.isValid}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !activeTab?.isValid}
            size="sm"
          >
            {isLoading ? '...' : 'Send'}
          </Button>
        </div>
        {state.chatHistory.length > 0 && (
          <Button
            onClick={() => dispatch({ type: 'CLEAR_CHAT' })}
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
          >
            Clear Chat
          </Button>
        )}
      </div>
    </div>
  );
}
