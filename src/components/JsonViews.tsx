import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import ReactJson from 'react-json-view';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Expand, Shrink } from 'lucide-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom cell renderer for expandable objects/arrays
const ExpandableCellRenderer = (params: any) => {
  const value = params.value;
  const isExpandable = value && (typeof value === 'object' || Array.isArray(value));
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isExpandable) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  const childCount = Array.isArray(value) ? value.length : Object.keys(value).length;
  
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} nested data`}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="truncate">
          {Array.isArray(value) ? `Array` : 'Object'}
          <span className="ml-1 text-xs bg-gray-200 px-1 rounded">({childCount})</span>
        </span>
      </div>
      
      {isExpanded && (
        <div className="mt-2 ml-6 p-2 bg-gray-50 rounded border-l-2 border-blue-200">
          <ReactJson
            src={value}
            theme="rjv-default"
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
            collapsed={1}
            style={{
              backgroundColor: 'transparent',
              fontSize: '12px',
            }}
            name={false}
            quotesOnKeys={false}
            sortKeys={false}
          />
        </div>
      )}
    </div>
  );
};

// Detail cell renderer for master/detail view
const DetailCellRenderer = (params: any) => {
  const data = params.data;
  
  // Convert object/array to grid data
  const gridData = useMemo(() => {
    if (Array.isArray(data)) {
      return data.map((item, index) => ({ index, ...item }));
    } else if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => ({ key, value }));
    }
    return [];
  }, [data]);

  const columnDefs = useMemo(() => {
    if (gridData.length === 0) return [];
    
    const keys = Object.keys(gridData[0]);
    return keys.map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      flex: 1,
      sortable: true,
      resizable: true,
      filter: true,
      cellRenderer: (cellParams: any) => {
        const value = cellParams.value;
        if (value && (typeof value === 'object' || Array.isArray(value))) {
          return <ExpandableCellRenderer {...cellParams} />;
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
    }));
  }, [gridData]);

  return (
    <div className="ag-theme-alpine" style={{ height: 200, width: '100%' }}>
      <AgGridReact
        rowData={gridData}
        columnDefs={columnDefs}
        domLayout="autoHeight"
        masterDetail={true}
        detailCellRenderer={DetailCellRenderer}
        isRowMaster={(dataItem: any) => {
          return Object.values(dataItem).some(value => 
            value && (typeof value === 'object' || Array.isArray(value))
          );
        }}
        detailRowHeight={200}
        rowHeight={36}
        animateRows={true}
      />
    </div>
  );
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
      sortable: true,
      resizable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const value = params.value;
        if (value && (typeof value === 'object' || Array.isArray(value))) {
          return <ExpandableCellRenderer {...params} />;
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
      },
      autoHeight: true
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
        
        <div className="ag-theme-alpine border border-gray-200 rounded-lg" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            rowData={gridData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            defaultColDef={{
              flex: 1,
              sortable: true,
              resizable: true,
              filter: true,
              autoHeight: true
            }}
            domLayout="autoHeight"
            rowHeight={50}
            animateRows={true}
            rowSelection="single"
            onRowClicked={handleRowClicked}
            onCellKeyDown={handleCellKeyDown}
          />
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
