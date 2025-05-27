
import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import ReactJson from 'react-json-view';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function JsonViews() {
  const { state } = useApp();
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);
  
  if (!activeTab || !activeTab.isValid || !activeTab.parsedContent) {
    return null;
  }

  const renderGridView = (data: any) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // Auto-generate columns from JSON keys
      const columns = useMemo(() => {
        const keys = Object.keys(data[0]);
        return keys.map((key) => ({
          accessorKey: key,
          header: key,
          cell: (info: any) => {
            const value = info.getValue();
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
          },
        }));
      }, [data]);

      const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
      });

      return (
        <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-gray-200">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row, index) => (
                <TableRow 
                  key={row.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    } else if (typeof data === 'object' && data !== null) {
      // Object view as key-value pairs
      const entries = Object.entries(data);
      const tableData = entries.map(([key, value]) => ({ key, value }));
      
      const columns = [
        {
          accessorKey: 'key',
          header: 'Key',
          cell: (info: any) => info.getValue(),
        },
        {
          accessorKey: 'value',
          header: 'Value',
          cell: (info: any) => {
            const value = info.getValue();
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
          },
        },
      ];

      const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
      });

      return (
        <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-gray-200">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row, index) => (
                <TableRow 
                  key={row.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    return <div className="text-gray-500">Grid view not available for this data type</div>;
  };

  const renderTreeView = (data: any) => {
    return (
      <div className="font-mono text-sm">
        <ReactJson
          src={data}
          theme="rjv-default"
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={false}
          collapsed={1} // Expand Level 1 nodes by default
          style={{
            backgroundColor: 'transparent',
            fontSize: '14px',
          }}
        />
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
        {renderTreeView(activeTab.parsedContent)}
      </div>
    );
  }

  return null;
}
