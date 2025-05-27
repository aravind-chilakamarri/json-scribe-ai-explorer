
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

export function Layout() {
  const { state, dispatch } = useApp();
  const [activeSection, setActiveSection] = useState<'json' | 'base64'>('json');

  const fadeTransition = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.15, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto bg-white shadow-sm">
        <header className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">JSON Toolkit</h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveSection('json')}
                  variant={activeSection === 'json' ? 'default' : 'outline'}
                  size="sm"
                  aria-label="Switch to JSON tools"
                >
                  JSON Tools
                </Button>
                <Button
                  onClick={() => setActiveSection('base64')}
                  variant={activeSection === 'base64' ? 'default' : 'outline'}
                  size="sm"
                  aria-label="Switch to Base64 tools"
                >
                  Base64 Tools
                </Button>
              </div>
              
              <div className="flex gap-2">
                <GitHubSync />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
                        variant={state.aiPanelOpen ? 'default' : 'outline'}
                        size="sm"
                        aria-label={state.aiPanelOpen ? 'Close AI Q&A panel' : 'Open AI Q&A panel'}
                      >
                        AI Q&A
                      </Button>
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

        <div className="flex h-[calc(100vh-80px)]">
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSection === 'json' && <TabBar />}
            
            <main className="flex-1 p-6 overflow-y-auto">
              <motion.div
                key={activeSection}
                variants={fadeTransition}
                initial="hidden"
                animate="visible"
              >
                {activeSection === 'json' ? (
                  <div>
                    <JsonEditor />
                    <JsonViews />
                  </div>
                ) : (
                  <Base64Tools />
                )}
              </motion.div>
            </main>
          </div>

          <AiPanel />
        </div>
      </div>
    </div>
  );
}
