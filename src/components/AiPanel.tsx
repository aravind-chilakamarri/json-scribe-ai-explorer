
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { X, Send, Sparkles, Trash2, MessageSquare, Lightbulb, Copy, Check } from 'lucide-react';
import { answerQuestion, suggestQuestions, buildContexts } from '@/lib/jsonAiEngine';

export function AiPanel() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build contexts from all valid tabs
  const contexts = useMemo(
    () => buildContexts(state.tabs),
    [state.tabs]
  );

  const suggestions = useMemo(
    () => suggestQuestions(contexts),
    [contexts]
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory]);

  // Focus input when panel opens
  useEffect(() => {
    if (state.aiPanelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.aiPanelOpen]);

  const handleSendMessage = async (message?: string) => {
    const text = (message || input).trim();
    if (!text) return;

    const userMessage = { role: 'user' as const, content: text };
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: userMessage });
    setInput('');
    setIsTyping(true);

    // Small delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

    const answer = answerQuestion(text, contexts);

    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      message: { role: 'assistant' as const, content: answer },
    });
    setIsTyping(false);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!state.aiPanelOpen) return null;

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const hasValidJson = contexts.length > 0;

  return (
    <div className="w-[26rem] border-l border-[#0071DC]/10 bg-white flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#0071DC]/10 bg-[#0071DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFC220] flex items-center justify-center">
            <Sparkles size={16} className="text-[#004F9A]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">JSON AI Assistant</h2>
            <p className="text-[11px] text-white/60">
              {contexts.length} tab{contexts.length !== 1 ? 's' : ''} loaded
            </p>
          </div>
        </div>
        <Button
          onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.chatHistory.length === 0 ? (
          <div className="space-y-5">
            {/* Welcome message */}
            <div className="bg-gradient-to-br from-[#E6F0FA] to-[#D4E8F9] rounded-xl p-4 border border-[#0071DC]/15">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-[#0071DC]" />
                <span className="text-sm font-semibold text-[#004F9A]">Ask me anything about your JSON</span>
              </div>
              <p className="text-xs text-[#0071DC]/80 leading-relaxed">
                I can read {contexts.length > 1 ? 'all your tabs' : 'your JSON'} and answer questions about values, structure, counts, patterns, and more.
              </p>
            </div>

            {/* Suggested questions */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={13} className="text-amber-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Try asking</span>
                </div>
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(s)}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasValidJson && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs text-amber-700">
                  Paste valid JSON in the editor to start asking questions.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {state.chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative group max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#0071DC] text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200'
                  }`}
                >
                  {/* Message content with markdown-like formatting */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).map((part, pi) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={pi} className="font-bold">{part.slice(2, -2)}</strong>;
                      }
                      if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                          <code
                            key={pi}
                            className={`px-1 py-0.5 rounded text-xs font-mono ${
                              message.role === 'user'
                                ? 'bg-[#0071DC]/30'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {part.slice(1, -1)}
                          </code>
                        );
                      }
                      if (part.startsWith('_') && part.endsWith('_')) {
                        return <em key={pi} className="italic opacity-80 text-xs">{part.slice(1, -1)}</em>;
                      }
                      return <React.Fragment key={pi}>{part}</React.Fragment>;
                    })}
                  </div>

                  {/* Copy button for assistant messages */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(message.content, index)}
                      className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full p-1 shadow-sm"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Copy size={12} className="text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={hasValidJson ? 'Ask about your JSON...' : 'Paste valid JSON first...'}
            className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071DC] focus:border-transparent transition-colors"
            disabled={isTyping || !hasValidJson}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isTyping || !input.trim() || !hasValidJson}
            size="sm"
            className="h-10 w-10 p-0 rounded-xl"
          >
            <Send size={16} />
          </Button>
        </div>

        {state.chatHistory.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'CLEAR_CHAT' })}
            className="flex items-center justify-center gap-1.5 mt-2 w-full py-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
