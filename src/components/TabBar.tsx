
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TabBar() {
  const { state, dispatch } = useApp();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  const addTab = () => {
    const newTab = {
      id: Date.now().toString(),
      name: `Tab ${state.tabs.length + 1}`,
      content: '{}',
      activeView: 'pretty' as const,
      isValid: true,
      parsedContent: {}
    };
    dispatch({ type: 'ADD_TAB', tab: newTab });
  };

  const removeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.tabs.length > 1) {
      dispatch({ type: 'REMOVE_TAB', tabId });
    }
  };

  const handleTabNameSubmit = (tabId: string, newName: string) => {
    if (newName.trim()) {
      dispatch({ type: 'UPDATE_TAB_NAME', tabId, name: newName.trim() });
    }
    setEditingTabId(null);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center px-4">
        <div className="flex space-x-1 overflow-x-auto">
          {state.tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center min-w-0 px-3 py-2 border-b-2 cursor-pointer transition-colors ${
                state.activeTabId === tab.id
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tabId: tab.id })}
            >
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  defaultValue={tab.name}
                  className="bg-transparent border-none outline-none text-sm w-20"
                  autoFocus
                  onBlur={(e) => handleTabNameSubmit(tab.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTabNameSubmit(tab.id, e.currentTarget.value);
                    }
                    if (e.key === 'Escape') {
                      setEditingTabId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="text-sm truncate max-w-24"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTabId(tab.id);
                  }}
                >
                  {tab.name}
                </span>
              )}
              {state.tabs.length > 1 && (
                <button
                  onClick={(e) => removeTab(tab.id, e)}
                  className="ml-2 p-1 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={addTab}
          variant="ghost"
          size="sm"
          className="ml-2 p-2"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}
