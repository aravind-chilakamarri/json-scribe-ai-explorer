
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { TabBar } from './TabBar';
import { JsonEditor } from './JsonEditor';
import { JsonViews } from './JsonViews';
import { Base64Tools } from './Base64Tools';
import { AiPanel } from './AiPanel';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Layout() {
  const { state, dispatch } = useApp();
  const [activeSection, setActiveSection] = useState<'json' | 'base64'>('json');

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
                >
                  JSON Tools
                </Button>
                <Button
                  onClick={() => setActiveSection('base64')}
                  variant={activeSection === 'base64' ? 'default' : 'outline'}
                  size="sm"
                >
                  Base64 Tools
                </Button>
              </div>
              <Button
                onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
                variant={state.aiPanelOpen ? 'default' : 'outline'}
                size="sm"
              >
                AI Q&A
              </Button>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-80px)]">
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeSection === 'json' && <TabBar />}
            
            <main className="flex-1 p-6 overflow-y-auto">
              {activeSection === 'json' ? (
                <div>
                  <JsonEditor />
                  <JsonViews />
                </div>
              ) : (
                <Base64Tools />
              )}
            </main>
          </div>

          <AiPanel />
        </div>
      </div>
    </div>
  );
}
