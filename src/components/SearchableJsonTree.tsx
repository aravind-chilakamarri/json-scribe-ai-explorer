import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SearchableJsonTreeProps {
  data: any;
  searchQuery: string;
}

interface JsonNodeProps {
  data: any;
  keyName?: string;
  level?: number;
  searchQuery: string;
  isLast?: boolean;
}

const highlightMatches = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === searchQuery.toLowerCase()) {
      return (
        <span
          key={index}
          className="bg-yellow-300 text-black px-1 py-0.5 rounded font-semibold border border-yellow-400"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

const hasSearchMatch = (data: any, searchQuery: string): boolean => {
  if (!searchQuery) return false;
  
  const search = (obj: any, query: string): boolean => {
    if (typeof obj === 'string') {
      return obj.toLowerCase().includes(query.toLowerCase());
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj).toLowerCase().includes(query.toLowerCase());
    }
    if (Array.isArray(obj)) {
      return obj.some(item => search(item, query));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).some(([key, value]) => 
        key.toLowerCase().includes(query.toLowerCase()) || search(value, query)
      );
    }
    return false;
  };
  
  return search(data, searchQuery);
};

const JsonNode: React.FC<JsonNodeProps> = ({ data, keyName, level = 0, searchQuery, isLast = true }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if there's a search match
    return searchQuery ? hasSearchMatch(data, searchQuery) : level < 2;
  });

  React.useEffect(() => {
    if (searchQuery && hasSearchMatch(data, searchQuery)) {
      setIsExpanded(true);
    }
  }, [searchQuery, data]);

  const indent = level * 20;
  const isArray = Array.isArray(data);
  const isObject = typeof data === 'object' && data !== null && !isArray;
  const isPrimitive = !isArray && !isObject;

  const renderPrimitive = () => {
    const value = data === null ? 'null' : String(data);
    const type = typeof data;
    
    let colorClass = 'text-gray-800';
    if (type === 'string') colorClass = 'text-green-600';
    else if (type === 'number') colorClass = 'text-blue-600';
    else if (type === 'boolean') colorClass = 'text-purple-600';
    else if (data === null) colorClass = 'text-gray-500';

    return (
      <span className={colorClass}>
        {type === 'string' && '"'}
        {highlightMatches(value, searchQuery)}
        {type === 'string' && '"'}
      </span>
    );
  };

  const renderKey = () => {
    if (!keyName) return null;
    return (
      <span className="text-blue-800 font-medium">
        "{highlightMatches(keyName, searchQuery)}": 
      </span>
    );
  };

  if (isPrimitive) {
    return (
      <div className="flex items-start" style={{ paddingLeft: indent }}>
        {renderKey()}
        <span className="ml-1">{renderPrimitive()}</span>
        {!isLast && <span className="text-gray-400">,</span>}
      </div>
    );
  }

  const entries = isArray ? data.map((item, idx) => [idx, item]) : Object.entries(data);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  return (
    <div>
      <div 
        className="flex items-start cursor-pointer hover:bg-gray-50 py-0.5 px-1 rounded"
        style={{ paddingLeft: indent }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="mr-1 text-gray-600 hover:text-gray-800 p-0.5">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {renderKey()}
        <span className="ml-1 text-gray-600">
          {openBracket}
          {!isExpanded && (
            <>
              <span className="text-gray-400 mx-1">
                {entries.length} {isArray ? 'items' : 'keys'}
              </span>
              {closeBracket}
            </>
          )}
        </span>
        {!isLast && !isExpanded && <span className="text-gray-400">,</span>}
      </div>
      
      {isExpanded && (
        <>
          {entries.map(([key, value], index) => (
            <JsonNode
              key={key}
              data={value}
              keyName={isArray ? undefined : String(key)}
              level={level + 1}
              searchQuery={searchQuery}
              isLast={index === entries.length - 1}
            />
          ))}
          <div 
            className="text-gray-600"
            style={{ paddingLeft: indent }}
          >
            {closeBracket}
            {!isLast && <span className="text-gray-400">,</span>}
          </div>
        </>
      )}
    </div>
  );
};

export const SearchableJsonTree: React.FC<SearchableJsonTreeProps> = ({ data, searchQuery }) => {
  const matchCount = useMemo(() => {
    if (!searchQuery) return 0;
    
    let count = 0;
    const countMatches = (obj: any, query: string) => {
      if (typeof obj === 'string') {
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = obj.match(regex);
        if (matches) count += matches.length;
      } else if (typeof obj === 'number' || typeof obj === 'boolean') {
        const text = String(obj);
        if (text.toLowerCase().includes(query.toLowerCase())) count++;
      } else if (Array.isArray(obj)) {
        obj.forEach(item => countMatches(item, query));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (key.toLowerCase().includes(query.toLowerCase())) count++;
          countMatches(value, query);
        });
      }
    };
    
    countMatches(data, searchQuery);
    return count;
  }, [data, searchQuery]);

  return (
    <div className="font-mono text-sm">
      {searchQuery && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-800">
              Search Results: {matchCount} match{matchCount !== 1 ? 'es' : ''} found for "{searchQuery}"
            </span>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
        <JsonNode data={data} searchQuery={searchQuery} />
      </div>
    </div>
  );
};