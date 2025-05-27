
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface JsonTab {
  id: string;
  name: string;
  content: string;
  activeView: 'pretty' | 'minified' | 'grid' | 'tree';
  isValid: boolean;
  parsedContent?: any;
}

interface AppState {
  tabs: JsonTab[];
  activeTabId: string | null;
  aiPanelOpen: boolean;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

type AppAction =
  | { type: 'ADD_TAB'; tab: JsonTab }
  | { type: 'REMOVE_TAB'; tabId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | { type: 'UPDATE_TAB_CONTENT'; tabId: string; content: string }
  | { type: 'UPDATE_TAB_VIEW'; tabId: string; view: JsonTab['activeView'] }
  | { type: 'UPDATE_TAB_NAME'; tabId: string; name: string }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'ADD_CHAT_MESSAGE'; message: { role: 'user' | 'assistant'; content: string } }
  | { type: 'CLEAR_CHAT' };

const initialState: AppState = {
  tabs: [{
    id: '1',
    name: 'Tab 1',
    content: '{"welcome": "Paste or upload your JSON here", "features": ["Beautify", "Minify", "Grid View", "Tree View", "AI Q&A"]}',
    activeView: 'pretty',
    isValid: true,
    parsedContent: {"welcome": "Paste or upload your JSON here", "features": ["Beautify", "Minify", "Grid View", "Tree View", "AI Q&A"]}
  }],
  activeTabId: '1',
  aiPanelOpen: false,
  chatHistory: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TAB':
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabId: action.tab.id
      };
    case 'REMOVE_TAB':
      const newTabs = state.tabs.filter(tab => tab.id !== action.tabId);
      const newActiveTabId = state.activeTabId === action.tabId 
        ? (newTabs.length > 0 ? newTabs[0].id : null)
        : state.activeTabId;
      return {
        ...state,
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.tabId };
    case 'UPDATE_TAB_CONTENT':
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === action.tabId 
            ? { 
                ...tab, 
                content: action.content,
                isValid: isValidJson(action.content),
                parsedContent: parseJsonSafely(action.content)
              }
            : tab
        )
      };
    case 'UPDATE_TAB_VIEW':
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === action.tabId ? { ...tab, activeView: action.view } : tab
        )
      };
    case 'UPDATE_TAB_NAME':
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === action.tabId ? { ...tab, name: action.name } : tab
        )
      };
    case 'TOGGLE_AI_PANEL':
      return { ...state, aiPanelOpen: !state.aiPanelOpen };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.message]
      };
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] };
    default:
      return state;
  }
}

function isValidJson(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function parseJsonSafely(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
