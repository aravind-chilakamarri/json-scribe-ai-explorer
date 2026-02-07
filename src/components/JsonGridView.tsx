import React, { useState, useMemo, useCallback, createContext, useContext } from 'react';
import { ChevronDown, ChevronRight, Minus } from 'lucide-react';

// ─── Highlight helper ───────────────────────────────────────────────────────
const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return <>{text}</>;
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-gray-900 px-0.5 rounded">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

// ─── Global expand context (for Expand All / Collapse All) ──────────────────
interface GridContextType {
  expandAllSignal: number;   // increments to expand all
  collapseAllSignal: number; // increments to collapse all
  searchQuery: string;
}
const GridContext = createContext<GridContextType>({
  expandAllSignal: 0,
  collapseAllSignal: 0,
  searchQuery: '',
});

// ─── Collect all keys from an array of objects ──────────────────────────────
function collectKeys(arr: any[]): string[] {
  const set = new Set<string>();
  arr.forEach(item => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      Object.keys(item).forEach(k => set.add(k));
    }
  });
  return Array.from(set);
}

// ─── Check if an array is "table-friendly" (array of objects) ───────────────
function isTableArray(arr: any[]): boolean {
  if (arr.length === 0) return false;
  return arr.some(item => typeof item === 'object' && item !== null && !Array.isArray(item));
}

// ─── Type badge ─────────────────────────────────────────────────────────────
function TypeBadge({ type, count }: { type: 'object' | 'array'; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono">
      <span className="text-slate-500">
        {type === 'array' ? `[${count}]` : `{${count}}`}
      </span>
    </span>
  );
}

// ─── Primitive value renderer ───────────────────────────────────────────────
function PrimitiveValue({ value, searchQuery }: { value: any; searchQuery: string }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic text-sm">null</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-purple-600 font-medium text-sm">{String(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="text-blue-600 font-mono text-sm">{highlightText(String(value), searchQuery)}</span>;
  }
  // string
  return <span className="text-emerald-700 text-sm">{highlightText(String(value), searchQuery)}</span>;
}

// ─── Recursive value renderer ───────────────────────────────────────────────
function GridValue({ value, depth }: { value: any; depth: number }) {
  const { expandAllSignal, collapseAllSignal, searchQuery } = useContext(GridContext);
  const [manualExpand, setManualExpand] = useState<boolean | null>(null);

  // React to expand/collapse all signals
  const [lastExpandSignal, setLastExpandSignal] = useState(expandAllSignal);
  const [lastCollapseSignal, setLastCollapseSignal] = useState(collapseAllSignal);

  let autoExpand: boolean | null = null;
  if (expandAllSignal !== lastExpandSignal) {
    autoExpand = true;
  }
  if (collapseAllSignal !== lastCollapseSignal) {
    autoExpand = false;
  }

  React.useEffect(() => {
    if (expandAllSignal !== lastExpandSignal) {
      setManualExpand(true);
      setLastExpandSignal(expandAllSignal);
    }
  }, [expandAllSignal, lastExpandSignal]);

  React.useEffect(() => {
    if (collapseAllSignal !== lastCollapseSignal) {
      setManualExpand(false);
      setLastCollapseSignal(collapseAllSignal);
    }
  }, [collapseAllSignal, lastCollapseSignal]);

  const isExpanded = autoExpand ?? manualExpand ?? (depth < 1);
  const toggle = useCallback(() => setManualExpand(prev => !(prev ?? depth < 1)), [depth]);

  // Primitive
  if (value === null || value === undefined || typeof value !== 'object') {
    return <PrimitiveValue value={value} searchQuery={searchQuery} />;
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400 text-sm font-mono">[ ]</span>;
    }

    return (
      <div className="w-full">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium py-0.5"
        >
          {isExpanded
            ? <ChevronDown size={14} className="text-slate-500" />
            : <ChevronRight size={14} className="text-slate-500" />
          }
          <TypeBadge type="array" count={value.length} />
        </button>
        {isExpanded && (
          <div className="mt-1.5">
            <ArrayGrid data={value} depth={depth + 1} />
          </div>
        )}
      </div>
    );
  }

  // Object
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <span className="text-gray-400 text-sm font-mono">{"{ }"}</span>;
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium py-0.5"
      >
        {isExpanded
          ? <ChevronDown size={14} className="text-slate-500" />
          : <ChevronRight size={14} className="text-slate-500" />
        }
        <TypeBadge type="object" count={entries.length} />
      </button>
      {isExpanded && (
        <div className="mt-1.5">
          <ObjectGrid data={value} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

// ─── Object Grid: key → value table ─────────────────────────────────────────
function ObjectGrid({ data, depth }: { data: Record<string, any>; depth: number }) {
  const { searchQuery } = useContext(GridContext);
  const entries = Object.entries(data);
  const borderColor = depth === 0 ? 'border-slate-300' : 'border-slate-200';

  return (
    <table className={`w-full border-collapse border ${borderColor} text-sm`}>
      <tbody>
        {entries.map(([key, value], i) => (
          <tr key={key} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/50 transition-colors`}>
            <td
              className={`border ${borderColor} px-3 py-2 font-medium text-blue-700 whitespace-nowrap align-top w-[1%]`}
            >
              {highlightText(key, searchQuery)}
            </td>
            <td className={`border ${borderColor} px-3 py-2 align-top`}>
              <GridValue value={value} depth={depth} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Array Grid: if objects → spreadsheet table; else → indexed list ────────
function ArrayGrid({ data, depth }: { data: any[]; depth: number }) {
  const { searchQuery } = useContext(GridContext);
  const borderColor = depth === 0 ? 'border-slate-300' : 'border-slate-200';

  // Check if array of objects → render as spreadsheet table with column headers
  if (isTableArray(data)) {
    const columns = collectKeys(data);

    return (
      <div className="overflow-auto max-h-[32rem]">
        <table className={`w-full border-collapse border ${borderColor} text-sm`}>
          <thead>
            <tr className="bg-slate-100 sticky top-0 z-10">
              <th className={`border ${borderColor} px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[1%] whitespace-nowrap`}>
                #
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className={`border ${borderColor} px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => {
              if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                return (
                  <tr key={rowIdx} className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/50 transition-colors`}>
                    <td className={`border ${borderColor} px-3 py-2 text-xs text-slate-400 font-mono text-center align-top`}>
                      {rowIdx}
                    </td>
                    {columns.map(col => (
                      <td key={col} className={`border ${borderColor} px-3 py-2 align-top`}>
                        <GridValue value={item[col]} depth={depth} />
                      </td>
                    ))}
                  </tr>
                );
              }
              // Non-object item in a mixed array
              return (
                <tr key={rowIdx} className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/50`}>
                  <td className={`border ${borderColor} px-3 py-2 text-xs text-slate-400 font-mono text-center align-top`}>
                    {rowIdx}
                  </td>
                  <td colSpan={columns.length} className={`border ${borderColor} px-3 py-2 align-top`}>
                    <GridValue value={item} depth={depth} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Array of primitives or mixed → simple indexed table
  return (
    <table className={`w-full border-collapse border ${borderColor} text-sm`}>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/50 transition-colors`}>
            <td className={`border ${borderColor} px-3 py-2 text-xs text-slate-400 font-mono text-center align-top w-[1%] whitespace-nowrap`}>
              {i}
            </td>
            <td className={`border ${borderColor} px-3 py-2 align-top`}>
              <GridValue value={item} depth={depth} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Root component ─────────────────────────────────────────────────────────
interface JsonGridViewProps {
  data: any;
  searchQuery: string;
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

export const JsonGridView: React.FC<JsonGridViewProps> = ({
  data,
  searchQuery,
  expandAllSignal = 0,
  collapseAllSignal = 0,
}) => {
  const ctx = useMemo(
    () => ({ expandAllSignal, collapseAllSignal, searchQuery }),
    [expandAllSignal, collapseAllSignal, searchQuery]
  );

  if (data === null || data === undefined) {
    return <div className="text-sm text-gray-400 p-4">No data</div>;
  }

  return (
    <GridContext.Provider value={ctx}>
      <div className="rounded-lg border border-slate-300 bg-white shadow-sm overflow-auto max-h-[36rem]">
        {Array.isArray(data) ? (
          <ArrayGrid data={data} depth={0} />
        ) : typeof data === 'object' ? (
          <ObjectGrid data={data} depth={0} />
        ) : (
          <div className="p-3">
            <PrimitiveValue value={data} searchQuery={searchQuery} />
          </div>
        )}
      </div>
    </GridContext.Provider>
  );
};
