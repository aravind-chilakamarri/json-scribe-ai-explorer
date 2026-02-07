import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Plus, Minus, PenLine, Equal, ChevronDown, ChevronRight, FileJson, Upload } from 'lucide-react';

// ─── Diff types ──────────────────────────────────────────────────────────────

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffEntry {
  path: string;
  key: string;
  type: DiffType;
  depth: number;
  leftValue?: any;
  rightValue?: any;
  leftType?: string;
  rightType?: string;
  children?: DiffEntry[];
}

// ─── Deep diff algorithm ─────────────────────────────────────────────────────

function computeDiff(left: any, right: any, path = '', depth = 0): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const key = path.split('.').pop() || path || 'root';

  // Both null/undefined
  if (left == null && right == null) {
    return [{ path, key, type: 'unchanged', depth, leftValue: left, rightValue: right }];
  }

  // One is null
  if (left == null) {
    return [{ path, key, type: 'added', depth, rightValue: right, rightType: typeOf(right) }];
  }
  if (right == null) {
    return [{ path, key, type: 'removed', depth, leftValue: left, leftType: typeOf(left) }];
  }

  // Different types
  if (typeOf(left) !== typeOf(right)) {
    return [{
      path, key, type: 'changed', depth,
      leftValue: left, rightValue: right,
      leftType: typeOf(left), rightType: typeOf(right),
    }];
  }

  // Both arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const children: DiffEntry[] = [];
    const maxLen = Math.max(left.length, right.length);
    let hasChanges = false;

    for (let i = 0; i < maxLen; i++) {
      const childPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= left.length) {
        children.push({ path: childPath, key: `[${i}]`, type: 'added', depth: depth + 1, rightValue: right[i], rightType: typeOf(right[i]) });
        hasChanges = true;
      } else if (i >= right.length) {
        children.push({ path: childPath, key: `[${i}]`, type: 'removed', depth: depth + 1, leftValue: left[i], leftType: typeOf(left[i]) });
        hasChanges = true;
      } else {
        const childDiffs = computeDiff(left[i], right[i], childPath, depth + 1);
        children.push(...childDiffs);
        if (childDiffs.some(d => d.type !== 'unchanged')) hasChanges = true;
      }
    }

    return [{
      path, key,
      type: hasChanges ? 'changed' : 'unchanged',
      depth,
      leftValue: left, rightValue: right,
      leftType: 'array', rightType: 'array',
      children,
    }];
  }

  // Both objects
  if (typeof left === 'object' && typeof right === 'object') {
    const children: DiffEntry[] = [];
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    let hasChanges = false;

    for (const k of allKeys) {
      const childPath = path ? `${path}.${k}` : k;
      if (!(k in left)) {
        children.push({ path: childPath, key: k, type: 'added', depth: depth + 1, rightValue: right[k], rightType: typeOf(right[k]) });
        hasChanges = true;
      } else if (!(k in right)) {
        children.push({ path: childPath, key: k, type: 'removed', depth: depth + 1, leftValue: left[k], leftType: typeOf(left[k]) });
        hasChanges = true;
      } else {
        const childDiffs = computeDiff(left[k], right[k], childPath, depth + 1);
        children.push(...childDiffs);
        if (childDiffs.some(d => d.type !== 'unchanged')) hasChanges = true;
      }
    }

    return [{
      path, key,
      type: hasChanges ? 'changed' : 'unchanged',
      depth,
      leftValue: left, rightValue: right,
      leftType: 'object', rightType: 'object',
      children,
    }];
  }

  // Primitives
  if (left === right) {
    return [{ path, key, type: 'unchanged', depth, leftValue: left, rightValue: right }];
  }
  return [{
    path, key, type: 'changed', depth,
    leftValue: left, rightValue: right,
    leftType: typeof left, rightType: typeof right,
  }];
}

function typeOf(v: any): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

// ─── Stats from diff ─────────────────────────────────────────────────────────

function countDiffStats(entries: DiffEntry[]): { added: number; removed: number; changed: number; unchanged: number } {
  const stats = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  function walk(items: DiffEntry[]) {
    for (const e of items) {
      if (e.children) {
        walk(e.children);
      } else {
        stats[e.type]++;
      }
    }
  }
  walk(entries);
  return stats;
}

// ─── Format value for display ────────────────────────────────────────────────

function shortValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value.length > 60 ? `"${value.slice(0, 57)}..."` : `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return `{${Object.keys(value).length} keys}`;
  return String(value);
}

// ─── Diff row component ──────────────────────────────────────────────────────

function DiffRow({ entry, showUnchanged }: { entry: DiffEntry; showUnchanged: boolean }) {
  const [expanded, setExpanded] = useState(entry.type !== 'unchanged');
  const hasChildren = entry.children && entry.children.length > 0;

  if (entry.type === 'unchanged' && !showUnchanged && !hasChildren) return null;

  const bgClass = {
    added: 'bg-green-50 hover:bg-green-100/80',
    removed: 'bg-red-50 hover:bg-red-100/80',
    changed: 'bg-amber-50 hover:bg-amber-100/80',
    unchanged: 'bg-white hover:bg-slate-50',
  }[entry.type];

  const borderClass = {
    added: 'border-l-green-500',
    removed: 'border-l-red-500',
    changed: 'border-l-amber-500',
    unchanged: 'border-l-transparent',
  }[entry.type];

  const Icon = {
    added: Plus,
    removed: Minus,
    changed: PenLine,
    unchanged: Equal,
  }[entry.type];

  const iconColor = {
    added: 'text-green-600',
    removed: 'text-red-600',
    changed: 'text-amber-600',
    unchanged: 'text-slate-400',
  }[entry.type];

  return (
    <>
      <tr className={`${bgClass} border-l-4 ${borderClass} transition-colors`}>
        {/* Icon */}
        <td className="w-8 text-center py-2.5 px-2 align-top">
          <Icon size={14} className={iconColor} />
        </td>

        {/* Path / Key */}
        <td className="py-2.5 px-3 align-top" style={{ paddingLeft: `${entry.depth * 16 + 12}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-700 p-0.5"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <span className="font-medium text-sm text-slate-800">{entry.key}</span>
            {hasChildren && (
              <span className="text-xs text-slate-400 font-mono">
                {typeOf(entry.leftValue ?? entry.rightValue) === 'array'
                  ? `[${(entry.leftValue ?? entry.rightValue)?.length ?? 0}]`
                  : `{${Object.keys(entry.leftValue ?? entry.rightValue ?? {}).length}}`}
              </span>
            )}
          </div>
        </td>

        {/* Left value */}
        <td className="py-2.5 px-3 align-top border-l border-slate-200 min-w-[180px]">
          {entry.type === 'added' ? (
            <span className="text-slate-300 text-sm italic">--</span>
          ) : hasChildren ? (
            <span className="text-xs text-slate-400">{shortValue(entry.leftValue)}</span>
          ) : (
            <span className={`text-sm font-mono ${entry.type === 'removed' ? 'text-red-700 font-medium' : entry.type === 'changed' ? 'text-amber-700 line-through decoration-amber-400' : 'text-slate-600'}`}>
              {shortValue(entry.leftValue)}
            </span>
          )}
        </td>

        {/* Right value */}
        <td className="py-2.5 px-3 align-top border-l border-slate-200 min-w-[180px]">
          {entry.type === 'removed' ? (
            <span className="text-slate-300 text-sm italic">--</span>
          ) : hasChildren ? (
            <span className="text-xs text-slate-400">{shortValue(entry.rightValue)}</span>
          ) : (
            <span className={`text-sm font-mono ${entry.type === 'added' ? 'text-green-700 font-medium' : entry.type === 'changed' ? 'text-amber-700 font-medium' : 'text-slate-600'}`}>
              {shortValue(entry.rightValue)}
            </span>
          )}
        </td>
      </tr>

      {/* Children */}
      {expanded && hasChildren && entry.children!.map((child, i) => (
        <DiffRow key={child.path + i} entry={child} showUnchanged={showUnchanged} />
      ))}
    </>
  );
}

// ─── Main diff view ──────────────────────────────────────────────────────────

export function JsonDiffView() {
  const { state } = useApp();
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

  const [rightJson, setRightJson] = useState('');
  const [rightParsed, setRightParsed] = useState<any>(null);
  const [rightError, setRightError] = useState('');
  const [compareTabId, setCompareTabId] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [inputMode, setInputMode] = useState<'paste' | 'tab'>('paste');

  const otherTabs = state.tabs.filter(t => t.id !== state.activeTabId && t.isValid);

  // Parse pasted JSON
  const handleRightJsonChange = (value: string) => {
    setRightJson(value);
    setCompareTabId(null);
    try {
      const parsed = JSON.parse(value);
      setRightParsed(parsed);
      setRightError('');
    } catch {
      setRightParsed(null);
      setRightError(value.trim() ? 'Invalid JSON' : '');
    }
  };

  // Select a tab to compare
  const handleSelectTab = (tabId: string) => {
    setCompareTabId(tabId);
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab?.parsedContent) {
      setRightParsed(tab.parsedContent);
      setRightJson(tab.content);
      setRightError('');
    }
  };

  const leftData = activeTab?.parsedContent;
  const rightData = compareTabId
    ? state.tabs.find(t => t.id === compareTabId)?.parsedContent
    : rightParsed;

  const diffResult = useMemo(() => {
    if (!leftData || !rightData) return null;
    return computeDiff(leftData, rightData);
  }, [leftData, rightData]);

  const stats = useMemo(() => {
    if (!diffResult) return null;
    return countDiffStats(diffResult);
  }, [diffResult]);

  const isIdentical = stats && stats.added === 0 && stats.removed === 0 && stats.changed === 0;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Source selector */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileJson size={16} className="text-blue-600" />
            <span className="font-medium">Left:</span>
            <span className="text-slate-800">{activeTab?.name ?? 'Current tab'}</span>
          </div>

          <ArrowLeftRight size={16} className="text-slate-400" />

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Right:</span>
            <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setInputMode('paste')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  inputMode === 'paste' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Paste JSON
              </button>
              {otherTabs.length > 0 && (
                <button
                  onClick={() => setInputMode('tab')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    inputMode === 'tab' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  From Tab
                </button>
              )}
            </div>
          </div>
        </div>

        {inputMode === 'paste' ? (
          <div className="relative">
            <textarea
              value={compareTabId ? '' : rightJson}
              onChange={(e) => handleRightJsonChange(e.target.value)}
              placeholder="Paste the second JSON here to compare..."
              className="w-full h-28 p-3 text-sm font-mono border border-slate-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {rightError && (
              <span className="absolute bottom-2 right-2 text-xs text-red-500 bg-white px-1.5 py-0.5 rounded">
                {rightError}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {otherTabs.map(tab => (
              <Button
                key={tab.id}
                variant={compareTabId === tab.id ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleSelectTab(tab.id)}
              >
                {tab.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Diff result */}
      {diffResult && stats && (
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {/* Stats bar */}
          <div className="flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              {isIdentical ? (
                <span className="text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  Identical JSON
                </span>
              ) : (
                <>
                  {stats.added > 0 && (
                    <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                      <Plus size={12} /> {stats.added} added
                    </span>
                  )}
                  {stats.removed > 0 && (
                    <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                      <Minus size={12} /> {stats.removed} removed
                    </span>
                  )}
                  {stats.changed > 0 && (
                    <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                      <PenLine size={12} /> {stats.changed} changed
                    </span>
                  )}
                  {stats.unchanged > 0 && (
                    <span className="text-slate-500">{stats.unchanged} unchanged</span>
                  )}
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showUnchanged}
                onChange={(e) => setShowUnchanged(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show unchanged
            </label>
          </div>

          {/* Diff table */}
          <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-300 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 sticky top-0 z-10">
                  <th className="w-8 py-2.5 px-2 border-b border-slate-200" />
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    Path
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-l border-slate-200 min-w-[180px]">
                    Left (Current)
                  </th>
                  <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-l border-slate-200 min-w-[180px]">
                    Right (Compare)
                  </th>
                </tr>
              </thead>
              <tbody>
                {diffResult.map((entry, i) => (
                  <DiffRow key={entry.path + i} entry={entry} showUnchanged={showUnchanged} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!diffResult && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400 space-y-2">
            <ArrowLeftRight size={40} className="mx-auto text-slate-300" />
            <p className="text-sm font-medium">Paste a second JSON or select a tab to compare</p>
            <p className="text-xs">The current tab's JSON will be used as the left side</p>
          </div>
        </div>
      )}
    </div>
  );
}
