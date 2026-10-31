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
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={`skeleton-row-${rowIndex}`} className="border-[#1b2333]">
                {columns.map((col, colIndex) => (
                  <td key={`skeleton-cell-${colIndex}`} className="px-4 py-4">
                    <div
                      className={`h-4 rounded-md bg-[#182030] animate-pulse ${
                        colIndex === 0
                          ? 'w-3/4'
                          : colIndex === columns.length - 1
                          ? 'w-1/2'
                          : 'w-2/3'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))
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
