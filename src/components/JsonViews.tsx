
import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import ReactJson from 'react-json-view';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Expand, Shrink } from 'lucide-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Recursive component for handling nested objects/arrays at any level
const NestedObjectRenderer = ({ value, depth = 0 }: { value: any; depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!value || (typeof value !== 'object' && !Array.isArray(value))) {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  const isArray = Array.isArray(value);
  const itemCount = isArray ? value.length : Object.keys(value).length;
  const maxDepth = 5; // Prevent infinite nesting
  
  if (depth >= maxDepth) {
    return (
      <span className="text-blue-600 text-xs">
        {isArray ? `Array(${itemCount})` : `Object(${itemCount})`} - Max depth reached
      </span>
    );
  }

  const renderExpandedContent = () => {
    if (isArray) {
      // Handle arrays
      if (value.length === 0) {
        return <div className="text-gray-500 text-sm p-2">Empty array</div>;
      }

      // Check if array contains objects with consistent structure
      const firstItem = value[0];
      if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
        const keys = Object.keys(firstItem);
        const allItemsHaveSameStructure = value.every(item => 
          typeof item === 'object' && item !== null && !Array.isArray(item) &&
          Object.keys(item).length === keys.length &&
          keys.every(key => key in item)
        );

        if (allItemsHaveSameStructure && keys.length > 0) {
          // Render as structured table with both horizontal and vertical scroll
          return (
            <div className="border border-gray-200 rounded mt-2">
              <ScrollArea className="w-full h-64">
                <div className="min-w-max">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        {keys.map(key => (
                          <TableHead key={key} className="h-8 px-3 text-xs font-medium border-r last:border-r-0 whitespace-nowrap min-w-[120px]">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {value.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          {keys.map(key => (
                            <TableCell key={key} className="px-3 py-2 border-r last:border-r-0 align-top min-w-[120px]">
                              <NestedObjectRenderer value={item[key]} depth={depth + 1} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          );
        }
      }

      // Fallback: render array items as rows with vertical scroll
      return (
        <div className="border border-gray-200 rounded mt-2">
          <ScrollArea className="w-full h-64">
            <div className="min-w-max">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 px-3 text-xs font-medium w-20 whitespace-nowrap">Index</TableHead>
                    <TableHead className="h-8 px-3 text-xs font-medium min-w-[200px] whitespace-nowrap">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {value.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-3 py-2 font-mono text-gray-600 w-20">{index}</TableCell>
                      <TableCell className="px-3 py-2 align-top min-w-[200px]">
                        <NestedObjectRenderer value={item} depth={depth + 1} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      );
    } else {
      // Handle objects with vertical scroll
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <div className="text-gray-500 text-sm p-2">Empty object</div>;
      }

      return (
        <div className="border border-gray-200 rounded mt-2">
          <ScrollArea className="w-full h-64">
            <div className="min-w-max">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 px-3 text-xs font-medium w-32 whitespace-nowrap">Key</TableHead>
                    <TableHead className="h-8 px-3 text-xs font-medium min-w-[200px] whitespace-nowrap">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(([key, val]) => (
                    <TableRow key={key} className="hover:bg-gray-50">
                      <TableCell className="px-3 py-2 font-mono text-blue-700 w-32 align-top">{key}</TableCell>
                      <TableCell className="px-3 py-2 align-top min-w-[200px]">
                        <NestedObjectRenderer value={val} depth={depth + 1} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 flex items-center p-1 hover:bg-blue-50 rounded"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${isArray ? 'array' : 'object'}`}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="text-blue-600 text-sm font-medium">
          {isArray ? 'Array' : 'Object'}
          <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
            {itemCount}
          </span>
        </span>
      </div>
      
      {isExpanded && (
        <div className="ml-6 mt-2">
          {renderExpandedContent()}
        </div>
      )}
    </div>
  );
};

// Enhanced cell renderer that uses the recursive component
const ExpandableCellRenderer = (params: any) => {
  const value = params.value;
  
  if (!value || (typeof value !== 'object' && !Array.isArray(value))) {
    return <span className="text-gray-700">{typeof value === 'string' ? value : JSON.stringify(value)}</span>;
  }

  return <NestedObjectRenderer value={value} depth={0} />;
};

export function JsonViews() {
  const { state } = useApp();
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);
  
  // Move all useMemo and useCallback hooks to top level
  const gridData = useMemo(() => {
    if (!activeTab?.parsedContent) return [];
    
    const data = activeTab.parsedContent;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    } else if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => ({ key, value }));
    }
    return [data];
  }, [activeTab?.parsedContent]);

  const columnDefs: ColDef[] = useMemo(() => {
    if (gridData.length === 0) return [];
    
    const keys = Object.keys(gridData[0]);
    return keys.map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      flex: 1,
      minWidth: 150,
      sortable: true,
      resizable: true,
      filter: true,
      cellRenderer: ExpandableCellRenderer,
      autoHeight: true,
      wrapText: true,
      cellStyle: { 
        lineHeight: '1.4',
        padding: '8px',
        whiteSpace: 'normal'
      }
    }));
  }, [gridData]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const handleExpandAll = useCallback(() => {
    if (gridApi) {
      gridApi.expandAll();
    }
  }, [gridApi]);

  const handleCollapseAll = useCallback(() => {
    if (gridApi) {
      gridApi.collapseAll();
    }
  }, [gridApi]);

  const toggleTreeExpansion = useCallback(() => {
    setIsTreeExpanded(!isTreeExpanded);
  }, [isTreeExpanded]);

  const handleRowClicked = useCallback((event: any) => {
    const keyboardEvent = event.event as KeyboardEvent;
    if (keyboardEvent?.key === 'Enter') {
      event.node.setExpanded(!event.node.expanded);
    }
  }, []);

  const handleCellKeyDown = useCallback((event: any) => {
    const keyboardEvent = event.event as KeyboardEvent;
    if (keyboardEvent?.key === 'ArrowLeft') {
      gridApi?.collapseAll();
    } else if (keyboardEvent?.key === 'ArrowRight') {
      gridApi?.expandAll();
    }
  }, [gridApi]);

  if (!activeTab || !activeTab.isValid || !activeTab.parsedContent) {
    return null;
  }

  const renderGridView = () => {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExpandAll}
                  variant="outline"
                  size="sm"
                  aria-label="Expand all rows"
                >
                  <Expand size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCollapseAll}
                  variant="outline"
                  size="sm"
                  aria-label="Collapse all rows"
                >
                  <Shrink size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
            <AgGridReact
              rowData={gridData}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              defaultColDef={{
                flex: 1,
                minWidth: 150,
                sortable: true,
                resizable: true,
                filter: true,
                autoHeight: true,
                wrapText: true,
                cellStyle: { 
                  lineHeight: '1.4',
                  padding: '8px 12px'
                }
              }}
              domLayout="autoHeight"
              rowHeight={60}
              animateRows={true}
              rowSelection="single"
              onRowClicked={handleRowClicked}
              onCellKeyDown={handleCellKeyDown}
              suppressHorizontalScroll={false}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTreeView = () => {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={toggleTreeExpansion}
            variant="outline"
            size="sm"
            aria-label={isTreeExpanded ? "Collapse all tree nodes" : "Expand all tree nodes"}
          >
            {isTreeExpanded ? <Shrink size={16} /> : <Expand size={16} />}
            {isTreeExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
        
        <div className="font-mono text-sm border border-gray-200 rounded-lg p-4 bg-white">
          <ReactJson
            src={activeTab.parsedContent}
            theme="rjv-default"
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
            collapsed={isTreeExpanded ? false : 1}
            style={{
              backgroundColor: 'transparent',
              fontSize: '14px',
            }}
            name={false}
            quotesOnKeys={false}
            sortKeys={false}
          />
        </div>
      </div>
    );
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.15, ease: "easeOut" }
    }
  };

  if (activeTab.activeView === 'grid') {
    return (
      <motion.div 
        className="mt-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        key={`grid-${activeTab.id}`}
      >
        <h3 className="text-lg font-medium mb-3 text-gray-900">Grid View</h3>
        {renderGridView()}
      </motion.div>
    );
  }

  if (activeTab.activeView === 'tree') {
    return (
      <motion.div 
        className="mt-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        key={`tree-${activeTab.id}`}
      >
        <h3 className="text-lg font-medium mb-3 text-gray-900">Tree View</h3>
        {renderTreeView()}
      </motion.div>
    );
  }

  return null;
}
