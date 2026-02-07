
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, X } from 'lucide-react';

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
    <div className="border-b border-[#0071DC]/10 bg-[#E6F0FA]">
      <div className="flex items-center px-4">
        <div className="flex space-x-0.5 overflow-x-auto">
          {state.tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center min-w-0 px-4 py-2 border-b-2 cursor-pointer transition-all text-sm ${
                state.activeTabId === tab.id
                  ? 'border-[#FFC220] bg-white text-[#004F9A] font-semibold'
                  : 'border-transparent text-[#0071DC]/70 hover:text-[#004F9A] hover:bg-white/60'
              }`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tabId: tab.id })}
            >
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  defaultValue={tab.name}
                  className="bg-transparent border-none outline-none text-sm w-20 text-[#004F9A]"
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
                  className="truncate max-w-28"
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
                  className="ml-2 p-0.5 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addTab}
          className="ml-2 p-1.5 rounded-md text-[#0071DC]/60 hover:text-[#0071DC] hover:bg-white/60 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
