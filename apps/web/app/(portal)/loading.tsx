import React from 'react';

export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-[#0d111a] border border-[#242f44] space-y-3">
        <div className="h-6 w-60 bg-[#151b28] rounded-lg" />
        <div className="h-4 w-96 bg-[#10141f] rounded" />
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-[#0d111a] border border-[#242f44] space-y-3"
          >
            <div className="h-3 w-24 bg-[#182030] rounded" />
            <div className="h-7 w-28 bg-[#182030] rounded" />
            <div className="h-3 w-36 bg-[#10141f] rounded" />
          </div>
        ))}
      </div>

      {/* Content Section Skeleton */}
      <div className="rounded-xl border border-[#242f44] bg-[#0d111a] p-5 space-y-4">
        <div className="h-5 w-48 bg-[#151b28] rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[#151b28]/60 border border-[#1b2333] flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-44 bg-[#182030] rounded" />
                <div className="h-3 w-28 bg-[#10141f] rounded" />
              </div>
              <div className="h-8 w-24 bg-[#182030] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
