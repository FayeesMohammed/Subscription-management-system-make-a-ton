'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { MockScenario } from '@/mocks/repository';
import { Sliders, RefreshCw } from 'lucide-react';

export const ScenarioSwitcher: React.FC = () => {
  const { scenario, switchScenario } = useApp();

  const scenarios: { value: MockScenario; label: string }[] = [
    { value: 'CONFIGURED_TENANT', label: '1. Configured Tenant (Default)' },
    { value: 'EMPTY_TENANT', label: '2. Empty Tenant (Zero Data)' },
    { value: 'QUOTE_NEAR_EXPIRY', label: '3. Quote Near Expiry (< 2h)' },
    { value: 'UNAVAILABLE_PLAN', label: '4. Unavailable / Inactive Plan' },
    { value: 'PARTIAL_PAYMENT', label: '5. Partial Payment Ledger' },
    { value: 'OVERDUE_INVOICE', label: '6. Overdue Invoice Past Due' },
    { value: 'LOCKED_INVOICE', label: '7. Locked Confirmed Invoice' },
    { value: 'PORTAL_EMPTY', label: '8. Portal Customer No Records' },
  ];

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151b28] border border-[#242f44] text-xs">
      <Sliders className="w-3.5 h-3.5 text-[#fcee21]" />
      <span className="font-semibold text-slate-300 hidden md:inline">Scenario:</span>
      <select
        value={scenario}
        onChange={(e) => switchScenario(e.target.value as MockScenario)}
        className="bg-transparent font-medium text-slate-100 border-none focus:outline-none cursor-pointer text-xs"
        aria-label="Deterministic mock scenario selector"
      >
        {scenarios.map((sc) => (
          <option key={sc.value} value={sc.value} className="bg-[#0f131d] text-white">
            {sc.label}
          </option>
        ))}
      </select>
    </div>
  );
};
