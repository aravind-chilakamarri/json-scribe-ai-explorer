
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { TabBar } from './TabBar';
import { JsonEditor } from './JsonEditor';
import { JsonViews } from './JsonViews';
import { Base64Tools } from './Base64Tools';
import { AiPanel } from './AiPanel';
import { GitHubSync } from './GitHubSync';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Sparkles } from 'lucide-react';

export function Layout() {
  const { state, dispatch } = useApp();
  const [activeSection, setActiveSection] = useState<'json' | 'base64' | 'regression'>('json');

  const fadeTransition = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.15, ease: "easeOut" }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[hsl(210,20%,97%)]">
      {/* Header with brand blue */}
      <header className="flex-shrink-0 bg-[#0071DC] px-6 py-2.5 shadow-md">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Braces size={22} className="text-[#FFC220]" />
              <h1 className="text-lg font-bold text-white tracking-tight">JSON Toolkit</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Section toggle */}
            <div className="flex gap-1 bg-white/15 p-0.5 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setActiveSection('json')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSection === 'json'
                    ? 'bg-[#FFC220] text-[#004F9A] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                JSON Tools
              </button>
              <button
                onClick={() => setActiveSection('base64')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSection === 'base64'
                    ? 'bg-[#FFC220] text-[#004F9A] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Base64 Tools
              </button>
              <button
                onClick={() => setActiveSection('regression')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSection === 'regression'
                    ? 'bg-[#FFC220] text-[#004F9A] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Regression Tools
              </button>
            </div>
            
            <div className="w-px h-6 bg-white/20" />
            
            <div className="flex gap-2">
              <GitHubSync />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        state.aiPanelOpen
                          ? 'bg-[#FFC220] text-[#004F9A] shadow-sm'
                          : 'bg-white/15 text-white hover:bg-white/25'
                      }`}
                    >
                      <Sparkles size={14} />
                      AI Q&A
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {state.aiPanelOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main area fills remaining height */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {activeSection === 'json' && <TabBar />}
          
          <main className="flex-1 px-6 py-5 overflow-y-auto">
            <motion.div
              key={activeSection}
              variants={fadeTransition}
              initial="hidden"
              animate="visible"
              className="h-full flex flex-col"
            >
              {activeSection === 'json' ? (
                <div className="flex flex-col gap-5 h-full">
                  <JsonEditor />
                  <div className="flex-1 min-h-0">
                    <JsonViews />
                  </div>
                </div>
              ) : activeSection === 'base64' ? (
                <Base64Tools />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
                  <div className="w-16 h-16 rounded-2xl bg-[#0071DC]/10 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0071DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#004F9A] mb-2">Regression Tools</h2>
                    <p className="text-sm text-slate-500 max-w-md">
                      Coming soon. This section will house regression testing tools.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </main>
        </div>

        <AiPanel />
      </div>
    </div>
  );
}
