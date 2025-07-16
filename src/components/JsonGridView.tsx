import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface JsonGridItem {
  id: string;
  level: number;
  key: string;
  value: any;
  type: 'object' | 'array' | 'primitive';
  parentId?: string;
  isExpanded?: boolean;
  children?: JsonGridItem[];
}

interface JsonGridViewProps {
  data: any;
  searchQuery: string;
}

const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === searchQuery.toLowerCase()) {
      return (
        <span
          key={index}
          className="bg-yellow-300 text-black px-1 py-0.5 rounded font-semibold border border-yellow-400"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

const flattenJsonData = (data: any, searchQuery: string = ''): JsonGridItem[] => {
  const items: JsonGridItem[] = [];
  let idCounter = 0;

  const processValue = (value: any, key: string, level: number, parentId?: string): JsonGridItem[] => {
    const currentId = `item-${idCounter++}`;
    const result: JsonGridItem[] = [];

    if (Array.isArray(value)) {
      const item: JsonGridItem = {
        id: currentId,
        level,
        key,
        value: "",
        type: 'array',
        parentId,
        isExpanded: false,
        children: []
      };

      value.forEach((arrayItem, index) => {
        const childItems = processValue(arrayItem, `[${index}]`, level + 1, currentId);
        item.children!.push(...childItems);
      });

      result.push(item);
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      const item: JsonGridItem = {
        id: currentId,
        level,
        key,
        value: "",
        type: 'object',
        parentId,
        isExpanded: false,
        children: []
      };

      entries.forEach(([objKey, objValue]) => {
        const childItems = processValue(objValue, objKey, level + 1, currentId);
        item.children!.push(...childItems);
      });

      result.push(item);
    } else {
      const item: JsonGridItem = {
        id: currentId,
        level,
        key,
        value,
        type: 'primitive',
        parentId
      };
      result.push(item);
    }

    return result;
  };

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      items.push(...processValue(item, `[${index}]`, 0));
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      items.push(...processValue(value, key, 0));
    });
  } else {
    items.push(...processValue(data, 'root', 0));
  }

  return items;
};

export const JsonGridView: React.FC<JsonGridViewProps> = ({ data, searchQuery }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});

  const flatData = useMemo(() => flattenJsonData(data, searchQuery), [data, searchQuery]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getVisibleItems = (items: JsonGridItem[]): JsonGridItem[] => {
    const visible: JsonGridItem[] = [];

    const addItemsRecursively = (itemList: JsonGridItem[], currentLevel: number = 0) => {
      itemList.forEach(item => {
        // Apply search filter
        const matchesSearch = !searchQuery || 
          item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(item.value).toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesSearch) {
          visible.push({ ...item, level: currentLevel });
          
          if (item.children && expandedItems.has(item.id)) {
            addItemsRecursively(item.children, currentLevel + 1);
          }
        }
      });
    };

    addItemsRecursively(items);
    return visible;
  };

  const visibleItems = getVisibleItems(flatData);

  const renderValue = (item: JsonGridItem) => {
    if (item.type === 'primitive') {
      const value = item.value === null ? 'null' : String(item.value);
      const type = typeof item.value;
      
      let className = 'text-gray-800';
      if (type === 'string') className = 'text-green-600';
      else if (type === 'number') className = 'text-blue-600';
      else if (type === 'boolean') className = 'text-purple-600';
      else if (item.value === null) className = 'text-gray-500';

      return (
        <span className={className}>
          {type === 'string' && '"'}
          {highlightText(value, searchQuery)}
          {type === 'string' && '"'}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleExpanded(item.id)}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
        >
          <MoreHorizontal size={12} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <ScrollArea className="w-full h-96">
          <div className="min-w-max">
            <Table className="text-sm">
              <TableBody>
                {visibleItems.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="w-8 text-center text-gray-400 text-xs border-r border-gray-100">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border-r border-gray-100">
                      <div 
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${item.level * 20}px` }}
                      >
                        {item.type !== 'primitive' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                            className="h-5 w-5 p-0 text-gray-600 hover:text-gray-800"
                          >
                            {expandedItems.has(item.id) ? 
                              <ChevronDown size={12} /> : 
                              <ChevronRight size={12} />
                            }
                          </Button>
                        )}
                        <span className="text-blue-600 font-medium">
                          {highlightText(item.key, searchQuery)}
                        </span>
                      </div>
                    </TableCell>
                     <TableCell>
                       {renderValue(item)}
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
      
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Showing {visibleItems.length} items matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};