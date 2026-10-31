import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#242f44] pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-[#151b28] rounded-lg" />
            <div className="h-5 w-24 bg-[#182030] rounded-full" />
          </div>
          <div className="h-4 w-72 bg-[#10141f] rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-[#151b28] rounded-lg" />
          <div className="h-9 w-32 bg-[#182030] rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[#0d111a] border border-[#242f44] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#182030] rounded" />
              <div className="w-7 h-7 rounded-lg bg-[#151b28]" />
            </div>
            <div className="h-7 w-32 bg-[#182030] rounded" />
            <div className="h-3 w-24 bg-[#10141f] rounded" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-80 bg-[#151b28] rounded-lg border border-[#242f44]" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-[#151b28] rounded-lg" />
          <div className="h-8 w-20 bg-[#151b28] rounded-lg" />
          <div className="h-8 w-20 bg-[#151b28] rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="w-full rounded-xl border border-[#242f44] bg-[#0d111a] overflow-hidden">
        <div className="h-11 bg-[#08090d] border-b border-[#242f44] px-4 flex items-center gap-6">
          <div className="h-3 w-32 bg-[#182030] rounded" />
          <div className="h-3 w-24 bg-[#182030] rounded" />
          <div className="h-3 w-24 bg-[#182030] rounded" />
          <div className="h-3 w-20 bg-[#182030] rounded ml-auto" />
        </div>
        <div className="divide-y divide-[#1b2333]">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-14 px-4 flex items-center gap-6">
              <div className="h-4 w-40 bg-[#151b28] rounded" />
              <div className="h-4 w-28 bg-[#151b28] rounded" />
              <div className="h-4 w-24 bg-[#151b28] rounded" />
              <div className="h-4 w-20 bg-[#151b28] rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
