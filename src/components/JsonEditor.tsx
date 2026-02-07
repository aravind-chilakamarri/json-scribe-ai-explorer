
import React, { useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Upload, ChevronUp, ChevronDown, Eye, EyeOff, Code, ArrowLeftRight } from 'lucide-react';

export function JsonEditor() {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
  
  if (!activeTab) return null;

  const handleContentChange = (content: string) => {
    dispatch({ type: 'UPDATE_TAB_CONTENT', tabId: activeTab.id, content });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleContentChange(content);
      };
      reader.readAsText(file);
    }
  };

  const beautifyJson = () => {
    try {
      const parsed = JSON.parse(activeTab.content);
      const beautified = JSON.stringify(parsed, null, 2);
      handleContentChange(beautified);
      dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'pretty' });
    } catch (error) {
      console.error('Invalid JSON');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(activeTab.content);
      const minified = JSON.stringify(parsed);
      handleContentChange(minified);
      dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'minified' });
    } catch (error) {
      console.error('Invalid JSON');
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey)) {
        if (event.key === 'b') {
          event.preventDefault();
          beautifyJson();
        } else if (event.key === 'm') {
          event.preventDefault();
          minifyJson();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab.content]);

  const hasActiveView = activeTab.activeView === 'grid' || activeTab.activeView === 'tree' || activeTab.activeView === 'diff';

  return (
    <div className="flex-shrink-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Button onClick={beautifyJson} variant="outline" size="sm" className="h-8 text-xs">
          Beautify (⌘B)
        </Button>
        <Button onClick={minifyJson} variant="outline" size="sm" className="h-8 text-xs">
          Minify (⌘M)
        </Button>
        
        <div className="w-px h-5 bg-slate-200 mx-0.5" />
        
        <Button
          onClick={() => dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'grid' })}
          variant={activeTab.activeView === 'grid' ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
        >
          Grid View
        </Button>
        <Button
          onClick={() => dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'tree' })}
          variant={activeTab.activeView === 'tree' ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
        >
          Tree View
        </Button>
        <Button
          onClick={() => dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'diff' })}
          variant={activeTab.activeView === 'diff' ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
        >
          <ArrowLeftRight size={14} className="mr-1.5" />
          Diff
        </Button>
        
        <div className="w-px h-5 bg-slate-200 mx-0.5" />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <Upload size={14} className="mr-1.5" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Spacer pushes toggle to the right */}
        <div className="flex-1" />

        {/* Always-visible toggle to show/hide editor */}
        <Button
          variant={isCollapsed ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 text-xs gap-1.5"
        >
          {isCollapsed ? (
            <>
              <Eye size={14} />
              Show JSON
            </>
          ) : (
            <>
              <EyeOff size={14} />
              Hide JSON
            </>
          )}
        </Button>
      </div>

      {/* Editor area */}
      {!isCollapsed ? (
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
          <textarea
            value={activeTab.content}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`w-full p-4 font-mono text-sm border-none resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-transparent ${
              hasActiveView ? 'h-40 min-h-[8rem]' : 'h-72 min-h-[12rem]'
            }`}
            placeholder="Paste your JSON here..."
          />
        </div>
      ) : (
        /* Collapsed indicator bar */
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <Code size={14} />
          <span>JSON Editor hidden — click to show</span>
          <ChevronDown size={14} />
        </button>
      )}

      {!activeTab.isValid && (
        <div className="text-red-600 text-sm bg-red-50 p-2.5 rounded-lg mt-2 border border-red-100">
          Invalid JSON format
        </div>
      )}
    </div>
  );
}
