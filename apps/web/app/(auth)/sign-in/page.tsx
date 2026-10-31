'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-[#fcee21] border-t-transparent rounded-full animate-spin" />
        <span>Loading Brightloop Authentication...</span>
      </div>
    </div>
  );
}
