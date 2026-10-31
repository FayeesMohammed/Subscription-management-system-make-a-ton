'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useToast } from '@/lib/toast';
import { MockScenario } from '@/mocks/repository';
import { Sliders, Check, ChevronDown, Sparkles, AlertCircle, Clock, Ban, Receipt } from 'lucide-react';

export const ScenarioSwitcher: React.FC = () => {
  const { scenario, switchScenario } = useApp();
  const { info } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const scenarios: { value: MockScenario; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'CONFIGURED_TENANT',
      label: 'Standard Tenant',
      desc: 'Full subscriptions, quotes, invoices & payments',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#fcee21]" />,
    },
    {
      value: 'EMPTY_TENANT',
      label: 'Empty Tenant',
      desc: 'Zero records to test first-run onboarding states',
      icon: <Sliders className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      value: 'QUOTE_NEAR_EXPIRY',
      label: 'Quote Near Expiry',
      desc: 'Commercial quote expiring in < 2 hours',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      value: 'OVERDUE_INVOICE',
      label: 'Overdue Receivables',
      desc: 'Confirmed invoices 15 days past due date',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      value: 'PARTIAL_PAYMENT',
      label: 'Partial Payment Ledger',
      desc: 'Partially settled invoice with remaining balance',
      icon: <Receipt className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      value: 'UNAVAILABLE_PLAN',
      label: 'Unavailable Plan',
      desc: 'Discontinued catalog plan constraint test',
      icon: <Ban className="w-3.5 h-3.5 text-slate-400" />,
    },
    {
      value: 'PORTAL_EMPTY',
      label: 'Portal Empty Customer',
      desc: 'Self-service account with 0 prior subscriptions',
      icon: <Sliders className="w-3.5 h-3.5 text-sky-400" />,
    },
  ];

  const current = scenarios.find((s) => s.value === scenario) || scenarios[0];

  const handleSelect = (sc: MockScenario, label: string) => {
    switchScenario(sc);
    setIsOpen(false);
    info(`Loaded Scenario: ${label}`, 'Deterministic fixture reset complete.');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e121a] hover:bg-[#161c28] border border-[#242f44] text-xs font-semibold text-slate-200 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-[#fcee21]"
        aria-label="Active test scenario selector"
      >
        <span className="p-0.5 rounded bg-[#161d2b] border border-[#242f44]">{current.icon}</span>
        <span className="hidden md:inline text-slate-400 font-normal">Scenario:</span>
        <span className="font-bold text-white max-w-[130px] truncate">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#242f44] bg-[#0c1017] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-[#1b2333] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deterministic Test Scenarios
            </span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto">
            {scenarios.map((sc) => {
              const isSelected = scenario === sc.value;
              return (
                <button
                  key={sc.value}
                  onClick={() => handleSelect(sc.value, sc.label)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-[#151c2a] border border-[#27354d]' : 'hover:bg-[#121620]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded bg-[#08090d] border border-[#242f44]">{sc.icon}</div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {sc.label}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">{sc.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#fcee21] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
