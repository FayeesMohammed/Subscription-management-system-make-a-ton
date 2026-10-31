import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#151b28] border border-[#242f44]" />
          <div className="h-6 w-36 bg-[#151b28] rounded-lg" />
          <div className="h-3 w-56 bg-[#10141f] rounded" />
        </div>

        <div className="p-6 rounded-xl bg-[#0b0e14] border border-[#1b2230] space-y-4">
          <div className="h-10 w-full bg-[#121722] rounded-lg" />
          <div className="h-10 w-full bg-[#121722] rounded-lg" />
          <div className="h-10 w-full bg-[#182030] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
