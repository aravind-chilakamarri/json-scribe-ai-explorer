
import React, { useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export function JsonEditor() {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={beautifyJson} variant="outline" size="sm">
          Beautify (⌘B)
        </Button>
        <Button onClick={minifyJson} variant="outline" size="sm">
          Minify (⌘M)
        </Button>
        <Button
          onClick={() => dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'grid' })}
          variant={activeTab.activeView === 'grid' ? 'default' : 'outline'}
          size="sm"
        >
          Grid View
        </Button>
        <Button
          onClick={() => dispatch({ type: 'UPDATE_TAB_VIEW', tabId: activeTab.id, view: 'tree' })}
          variant={activeTab.activeView === 'tree' ? 'default' : 'outline'}
          size="sm"
        >
          Tree View
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
        >
          <Upload size={16} className="mr-1" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="border border-gray-200 rounded-lg">
        <textarea
          value={activeTab.content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-64 p-4 font-mono text-sm border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          placeholder="Paste your JSON here..."
        />
      </div>

      {!activeTab.isValid && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          Invalid JSON format
        </div>
      )}
    </div>
  );
}
