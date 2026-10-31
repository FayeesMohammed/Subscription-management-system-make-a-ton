'use client';

import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  surface?: 'dark' | 'light';
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  surface = 'dark',
}: TableProps<T>) {
  const isLight = surface === 'light';

  const containerBg = isLight ? 'bg-white border-slate-200' : 'bg-[#0d111a] border-[#242f44]';
  const thBg = isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-[#08090d] text-slate-300 border-[#242f44]';
  const trBorder = isLight ? 'border-slate-100 hover:bg-slate-50/80' : 'border-[#1b2333] hover:bg-[#151b28]/60';
  const tdText = isLight ? 'text-slate-800' : 'text-slate-200';

  return (
    <div className={`w-full overflow-x-auto rounded-xl border ${containerBg} shadow-sm`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className={`text-xs uppercase tracking-wider font-bold border-b ${thBg}`}>
          <tr>
            {columns.map((col, index) => {
              const alignClass =
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
              return (
                <th
                  key={index}
                  scope="col"
                  className={`px-4 py-3.5 select-none ${alignClass} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1b2333]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#fcee21]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors ${trBorder} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, cIndex) => {
                  const alignClass =
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                  return (
                    <td
                      key={cIndex}
                      className={`px-4 py-3 whitespace-nowrap ${tdText} ${alignClass} ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? (item[col.accessorKey] as unknown as React.ReactNode)
                        : null}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
