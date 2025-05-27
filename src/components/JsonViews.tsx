
import React from 'react';
import { useApp } from '../contexts/AppContext';

export function JsonViews() {
  const { state } = useApp();
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
  
  if (!activeTab || !activeTab.isValid || !activeTab.parsedContent) {
    return null;
  }

  const renderGridView = (data: any) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {keys.map((key) => (
                  <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  {keys.map((key) => (
                    <td key={key} className="px-4 py-2 text-sm text-gray-900 border-b">
                      {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (typeof data === 'object' && data !== null) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Key</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b">{key}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 border-b">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <div className="text-gray-500">Grid view not available for this data type</div>;
  };

  const renderTreeView = (data: any, level = 0) => {
    if (typeof data !== 'object' || data === null) {
      return <span className="text-gray-600">{JSON.stringify(data)}</span>;
    }

    if (Array.isArray(data)) {
      return (
        <div>
          <span className="text-blue-600">[</span>
          <div className="ml-4">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <span className="text-gray-400">{index}:</span> {renderTreeView(item, level + 1)}
              </div>
            ))}
          </div>
          <span className="text-blue-600">]</span>
        </div>
      );
    }

    return (
      <div>
        <span className="text-blue-600">{'{'}</span>
        <div className="ml-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="my-1">
              <span className="text-purple-600">"{key}"</span>
              <span className="text-gray-400">: </span>
              {renderTreeView(value, level + 1)}
            </div>
          ))}
        </div>
        <span className="text-blue-600">{'}'}</span>
      </div>
    );
  };

  if (activeTab.activeView === 'grid') {
    return (
      <div className="mt-4 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Grid View</h3>
        {renderGridView(activeTab.parsedContent)}
      </div>
    );
  }

  if (activeTab.activeView === 'tree') {
    return (
      <div className="mt-4 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Tree View</h3>
        <div className="font-mono text-sm">
          {renderTreeView(activeTab.parsedContent)}
        </div>
      </div>
    );
  }

  return null;
}
