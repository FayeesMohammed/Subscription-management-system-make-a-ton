'use client';

import React, { useState } from 'react';
import { Button, Card, Modal, Input, Textarea } from '@brightloop/ui';
import { useToast } from '@/lib/toast';
import {
  FileSignature,
  Receipt,
  Download,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCheck2,
  Server,
  Users,
  Lock,
  Printer,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  HelpCircle,
  FileText,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface CustomerPortalViewProps {
  isPreview?: boolean;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ isPreview = false }) => {
  const { success, info } = useToast();

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<'subs' | 'quotes' | 'invoices' | 'profile'>('subs');

  // Modals
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedInvoicePdf, setSelectedInvoicePdf] = useState<string | null>(null);
  const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState<string | null>(null);
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);
  const [isCsmModalOpen, setIsCsmModalOpen] = useState(false);

  // Quote Acceptance State
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  const [signerName, setSignerName] = useState('Elena Rostova');
  const [signerTitle, setSignerTitle] = useState('VP Financial Operations & Billing Controller');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [signing, setSigning] = useState(false);

  // Expansion Request State
  const [expansionSeats, setExpansionSeats] = useState('10');
  const [expansionNotes, setExpansionNotes] = useState('');
  const [requestingExpansion, setRequestingExpansion] = useState(false);

  // CSM Contact State
  const [csmMessage, setCsmMessage] = useState('');
  const [csmSubject, setCsmSubject] = useState('Contract Amendment Inquiry');
  const [sendingCsm, setSendingCsm] = useState(false);

  const handleSignQuote = async () => {
    if (!agreedTerms) return;
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      setQuoteAccepted(true);
      setIsQuoteModalOpen(false);
      success('Quotation Accepted & Signed', 'QUOTE-2026-018 has been confirmed and scheduled for provisioning.');
    }, 600);
  };

  const handleDownloadZip = () => {
    success('Consolidated YTD Archive Generated', 'Downloading Brightloop_ApexHorizon_YTD_2026.zip containing 8 signed PDF statements.');
  };

  const handleSendCsm = (e: React.FormEvent) => {
    e.preventDefault();
    setSendingCsm(true);
    setTimeout(() => {
      setSendingCsm(false);
      setIsCsmModalOpen(false);
      setCsmMessage('');
      success('Inquiry Dispatched to CSM', 'Marcus Vance (Dedicated CSM) has received your request and will respond within 2 hours.');
    }, 500);
  };

  const handleRequestExpansion = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingExpansion(true);
    setTimeout(() => {
      setRequestingExpansion(false);
      setIsExpansionModalOpen(false);
      success('Expansion Quote Requested', `Account Engineering has received your request for +${expansionSeats} user licenses.`);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Customer Top Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#242f44] pb-6">
        <div className="space-y-2">
          {/* Yellow Read-Only Self-Service Pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#fcee21]/15 text-[#fcee21] border border-[#fcee21]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fcee21] animate-pulse" />
            <span>CUSTOMER_PORTAL (READ-ONLY SELF-SERVICE)</span>
          </div>

          {/* Account Standing */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200">Account in Good Standing</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Commercial Tier 1</span>
          </div>

          {/* Company Title & Details */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Apex Horizon Technologies Ltd.
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              Signed in as <span className="text-slate-200 font-bold">Elena Rostova</span> (Billing Administrator) /{' '}
              <span className="text-slate-300 font-semibold">CLIENT-ID: AH-8849-NY</span>
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Receipt className="w-4 h-4 text-slate-400" />}
            onClick={() => setIsStatementModalOpen(true)}
          >
            Latest Statement
          </Button>

          {!quoteAccepted ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileSignature className="w-4 h-4 text-black" />}
              onClick={() => setIsQuoteModalOpen(true)}
              className="font-bold shadow-md shadow-[#fcee21]/10"
            >
              Review Pending Quote
            </Button>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Quotes Up To Date
            </span>
          )}
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscriptions */}
        <Card surface="dark" className="p-4 border border-[#242f44] relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              ACTIVE SUBSCRIPTIONS
            </span>
            <RefreshCw className="w-4 h-4 text-[#fcee21]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-1.5">2 Plans</p>
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="text-slate-300">Next cycle renewal: Nov 15, 2026</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Provisioned &amp; Online
            </p>
          </div>
        </Card>

        {/* Card 2: Open Invoices */}
        <Card surface="dark" className="p-4 border border-[#242f44] relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              OPEN INVOICES
            </span>
            <CreditCard className="w-4 h-4 text-[#fcee21]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#fcee21] mt-1.5">$3,850.00</p>
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="text-slate-300">1 Pending • Due in 12 days</p>
            <p className="text-[11px] text-slate-400 font-mono">Net 30 • ACH Autopay Scheduled</p>
          </div>
        </Card>

        {/* Card 3: Pending Quotations */}
        <Card surface="dark" className="p-4 border border-[#242f44] relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              PENDING QUOTATIONS
            </span>
            <FileSignature className="w-4 h-4 text-[#fcee21]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-1.5">
            {quoteAccepted ? '0 Pending' : '1 Awaiting Sign'}
          </p>
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="text-slate-300">
              {quoteAccepted ? 'All proposals processed' : 'Data Pipeline Expansion add-on'}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[#fcee21]" />
              {quoteAccepted ? 'Contract active' : 'Expires in 6 calendar days'}
            </p>
          </div>
        </Card>

        {/* Card 4: Total Year-To-Date */}
        <Card surface="dark" className="p-4 border border-[#242f44] relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              TOTAL YEAR-TO-DATE
            </span>
            <Building2 className="w-4 h-4 text-[#fcee21]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white mt-1.5">$46,200.00</p>
          <div className="mt-1 space-y-0.5 text-xs">
            <p className="text-slate-300">CY 2026 Settled Volume</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Zero disputed line items
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Action Required Alert Banner */}
      {!quoteAccepted && (
        <div className="rounded-xl border border-[#2b384e] bg-[#0c1017] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            {/* Square Electric Yellow Icon Badge */}
            <div className="w-11 h-11 rounded-xl bg-[#fcee21] text-black flex items-center justify-center shrink-0 shadow-sm font-bold">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#fcee21] text-black">
                  ACTION REQUIRED
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  REF: QUOTE-2026-018
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Data Pipeline Expansion Quotation Ready for Review
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Brightloop Account Engineering has prepared your requested high-capacity streaming pipeline at{' '}
                <span className="text-[#fcee21] font-bold font-mono">$1,400.00 / month</span>. Valid through{' '}
                <span className="text-white font-semibold">November 8, 2026</span> (6 days remaining).
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setIsQuoteModalOpen(true)}
            >
              Preview PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileCheck2 className="w-4 h-4 text-black" />}
              onClick={() => setIsQuoteModalOpen(true)}
              className="font-bold shadow-md shadow-[#fcee21]/10"
            >
              Review &amp; Sign Quotation
            </Button>
          </div>
        </div>
      )}

      {/* 4. Navigation Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        <button
          onClick={() => setActiveTab('subs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'subs'
              ? 'bg-[#fcee21] text-black font-bold shadow-sm'
              : 'bg-[#121722] text-slate-300 hover:text-white border border-[#242f44]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeTab === 'subs' ? 'bg-black' : 'bg-[#fcee21]'
            }`}
          />
          <span>Active Subscriptions (2)</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'quotes'
              ? 'bg-[#fcee21] text-black font-bold shadow-sm'
              : 'bg-[#121722] text-slate-300 hover:text-white border border-[#242f44]'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          <span>Pending Quotes ({quoteAccepted ? 0 : 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-[#fcee21] text-black font-bold shadow-sm'
              : 'bg-[#121722] text-slate-300 hover:text-white border border-[#242f44]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoices &amp; Receipts (8)</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-[#fcee21] text-black font-bold shadow-sm'
              : 'bg-[#121722] text-slate-300 hover:text-white border border-[#242f44]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company Profile &amp; Billing Contact</span>
        </button>
      </div>

      {/* 5. Active Subscriptions Section */}
      {(activeTab === 'subs' || activeTab === 'profile') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242f44] pb-2">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Active Subscriptions
              </h2>
              <p className="text-xs text-slate-400">
                Live recurring plans linked to Apex Horizon Technologies Ltd.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              2 CONTRACTS CURRENT
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subscription Card 1 */}
            <Card surface="dark" className="border border-[#242f44] p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACTIVE
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      SUB-2026-CORE-01
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-extrabold font-mono text-white">
                      $3,200.00
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono">
                      / month billed
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Enterprise Core Platform — Annual Subscription
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plan: Enterprise Dedicated Cloud (Monthly cadence)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-[#1b2333] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      ACTIVATED DATE
                    </span>
                    <span className="font-mono text-slate-200 font-medium">Jan 15, 2026</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      NEXT RENEWAL
                    </span>
                    <span className="font-mono text-[#fcee21] font-bold">Nov 15, 2026</span>
                  </div>
                </div>

                {/* Provisioning Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    INCLUDED PROVISIONING
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-md bg-[#131926] border border-[#242f44] text-slate-200 flex items-center gap-1.5 font-medium">
                      <Server className="w-3.5 h-3.5 text-[#fcee21]" />
                      10 Dedicated Instances
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#131926] border border-[#242f44] text-slate-200 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      24/7 SLA Guarantee (99.98%)
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#131926] border border-[#242f44] text-slate-200 flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      50 User Licenses
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#1b2333] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Protected by Master Agreement MA-2025-88
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlanDetailsOpen('CORE-01')}
                  >
                    View Plan Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsExpansionModalOpen(true)}
                  >
                    Request License Expansion
                  </Button>
                </div>
              </div>
            </Card>

            {/* Subscription Card 2 */}
            <Card surface="dark" className="border border-[#242f44] p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACTIVE
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      SUB-2026-API-ADDON
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-extrabold font-mono text-white">
                      $650.00
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono">
                      / month billed
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    High-Volume API Add-On
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plan: 5M Request Tier (Monthly cadence)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-[#1b2333] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      ACTIVATED DATE
                    </span>
                    <span className="font-mono text-slate-200 font-medium">Apr 01, 2026</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      NEXT RENEWAL
                    </span>
                    <span className="font-mono text-[#fcee21] font-bold">Nov 15, 2026</span>
                  </div>
                </div>

                {/* Metering Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      CURRENT MONTH CONSUMPTION
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      3,842,100 / 5,000,000 reqs <span className="text-[#fcee21]">(76%)</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-[#131926] rounded-full overflow-hidden border border-[#242f44]">
                    <div className="h-full bg-[#fcee21] rounded-full transition-all" style={{ width: '76%' }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Zero overage penalty tier</span>
                    <span className="text-emerald-400 font-semibold">Within Allocation</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#1b2333] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Rate limit: 2,500 req/sec peak
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlanDetailsOpen('API-ADDON')}
                  >
                    View Plan Details
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsExpansionModalOpen(true);
                    }}
                  >
                    Upgrade Tier
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. Invoices & Receipts Section */}
      {(activeTab === 'invoices' || activeTab === 'profile' || activeTab === 'subs') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242f44] pb-2">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Invoices &amp; Receipts
              </h2>
              <p className="text-xs text-slate-400">
                Direct cryptographic PDF invoices and receipts issued for your organization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                Showing latest 3 of 8 total
              </span>
              <button
                onClick={handleDownloadZip}
                className="text-xs font-semibold text-slate-300 hover:text-[#fcee21] flex items-center gap-1.5 transition-colors p-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Consolidated YTD (.zip)</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto rounded-xl border border-[#242f44] bg-[#0c1017]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#242f44] bg-[#08090d] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">INVOICE #</th>
                  <th className="py-3 px-4">DATE ISSUED</th>
                  <th className="py-3 px-4">BILLING PERIOD</th>
                  <th className="py-3 px-4 text-right">AMOUNT</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">PDF DOCUMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2333]">
                {/* Row 1: Pending */}
                <tr className="text-slate-200 hover:bg-[#121824]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">INV-2026-0982</span>
                        <span className="text-[11px] text-slate-400 font-sans block">
                          Standard Recurring Billing
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Oct 15, 2026</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Oct 15 – Nov 14, 2026</td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white text-sm">
                    $3,850.00
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950/70 border border-amber-700/80 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      DUE NOV 14
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedInvoicePdf('INV-2026-0982')}
                    >
                      Download PDF
                    </Button>
                  </td>
                </tr>

                {/* Row 2: Paid */}
                <tr className="text-slate-200 hover:bg-[#121824]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">INV-2026-0844</span>
                        <span className="text-[11px] text-slate-400 font-sans block">
                          Settled via ACH Transfer
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Sep 15, 2026</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Sep 15 – Oct 14, 2026</td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white text-sm">
                    $3,850.00
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      PAID
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedInvoicePdf('INV-2026-0844')}
                    >
                      Download PDF
                    </Button>
                  </td>
                </tr>

                {/* Row 3: Paid */}
                <tr className="text-slate-200 hover:bg-[#121824]/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">INV-2026-0710</span>
                        <span className="text-[11px] text-slate-400 font-sans block">
                          Settled via ACH Transfer
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Aug 15, 2026</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">Aug 15 – Sep 14, 2026</td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white text-sm">
                    $3,850.00
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      PAID
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedInvoicePdf('INV-2026-0710')}
                    >
                      Download PDF
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Three-Column Entity & Support Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Column 1: Registered Entity */}
        <Card surface="dark" className="p-4 border border-[#242f44] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            REGISTERED ENTITY
          </span>
          <div className="space-y-0.5 text-xs text-slate-200">
            <p className="font-bold text-white text-sm">Apex Horizon Technologies Ltd.</p>
            <p className="text-slate-300">550 Madison Avenue, 20th Floor</p>
            <p className="text-slate-300">New York, NY 10022, United States</p>
            <p className="text-slate-400 font-mono pt-1 text-[11px]">Tax ID: US-EIN-94-3991044</p>
          </div>
        </Card>

        {/* Column 2: Billing Representative */}
        <Card surface="dark" className="p-4 border border-[#242f44] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            BILLING REPRESENTATIVE
          </span>
          <div className="space-y-0.5 text-xs text-slate-200">
            <p className="font-bold text-white text-sm">Elena Rostova</p>
            <p className="text-slate-300">VP Financial Operations &amp; Billing Controller</p>
            <p className="pt-1">
              <a
                href="mailto:billing@apexhorizon.tech"
                className="text-[#fcee21] font-mono hover:underline text-[11px]"
              >
                billing@apexhorizon.tech
              </a>
            </p>
            <p className="text-slate-400 font-mono text-[11px]">Direct Phone: +1 (212) 555-8194</p>
          </div>
        </Card>

        {/* Column 3: Security & Support Guardrail */}
        <Card surface="dark" className="p-4 border border-[#242f44] space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#fcee21] block">
              SECURITY &amp; SUPPORT GUARDRAIL
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              This workspace operates under Customer Self-Service Isolation. Need billing modifications or contract revisions?
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#1b2333]">
            <div className="text-[11px]">
              <span className="text-slate-400 block">Dedicated CSM:</span>
              <span className="font-bold text-white font-mono">Marcus Vance</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-slate-300" />}
              onClick={() => setIsCsmModalOpen(true)}
            >
              Contact CSM
            </Button>
          </div>
        </Card>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Quote Review & Digital Sign-Off Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title="Quotation Review — REF: QUOTE-2026-018"
        description="Verify commercial terms, line item allocation, and authorize digital sign-off."
        maxWidth="2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuoteModalOpen(false)}
              disabled={signing}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileCheck2 className="w-4 h-4 text-black" />}
              onClick={handleSignQuote}
              isLoading={signing}
              disabled={!agreedTerms || !signerName}
              className="font-bold"
            >
              Authorize &amp; Digitally Sign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#08090d] border border-[#242f44] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Data Pipeline Expansion Add-On
              </span>
              <span className="text-lg font-mono font-extrabold text-[#fcee21]">$1,400.00 / month</span>
            </div>
            <p className="text-xs text-slate-300">
              High-throughput streaming ingestion pipeline with automated idempotent webhooks, dedicated Redis buffer, and 99.99% SLA.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400 border-t border-[#1b2333]">
              <span>Cadence: Monthly</span>
              <span>•</span>
              <span>Billing Term: Net 30</span>
              <span>•</span>
              <span>Valid Through: Nov 8, 2026</span>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="p-3.5 rounded-lg bg-[#0d111a] border border-[#242f44] space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>High-Capacity Streaming Pipeline (10M msgs/day):</span>
              <span className="font-mono">$1,200.00</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Multi-AZ Redis Buffer Standby:</span>
              <span className="font-mono">$200.00</span>
            </div>
            <div className="flex justify-between text-white font-bold pt-1.5 border-t border-[#1b2333] text-sm">
              <span>Total Monthly Commitment:</span>
              <span className="font-mono text-[#fcee21]">$1,400.00 / month</span>
            </div>
          </div>

          {/* Authorized Signatory Input */}
          <div className="p-4 rounded-xl bg-[#0d111a] border border-[#242f44] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#fcee21] flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5" />
              Digital Commercial Authorization
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Authorized Officer Name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
              />
              <Input
                label="Signatory Corporate Title"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                required
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#242f44] bg-[#151b28] text-[#fcee21] focus:ring-[#fcee21]"
              />
              <span>
                I confirm that I am authorized to bind Apex Horizon Technologies Ltd. to the commercial monthly commitment of $1,400.00.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Invoice / Statement PDF Viewer Modal */}
      <Modal
        isOpen={Boolean(selectedInvoicePdf || isStatementModalOpen)}
        onClose={() => {
          setSelectedInvoicePdf(null);
          setIsStatementModalOpen(false);
        }}
        title={`Tax Invoice & Cryptographic PDF Statement — ${selectedInvoicePdf || 'INV-2026-0982'}`}
        description="Official statutory fiscal document and tax receipt."
        maxWidth="2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoicePdf(null);
                setIsStatementModalOpen(false);
              }}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4 text-black" />}
              onClick={() => window.print()}
            >
              Print / Save PDF
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 rounded-xl bg-[#08090d] border border-[#242f44]">
            <div>
              <span className="text-base font-black tracking-tight text-white block">BRIGHTLOOP</span>
              <span className="text-[10px] font-mono font-bold text-[#fcee21]">RECURRING BILLING OS</span>
              <p className="text-xs text-slate-400 mt-1">Brightloop Financial Systems Pvt. Ltd.</p>
              <p className="text-[11px] font-mono text-slate-500">GSTIN / TAX-ID: US-EIN-12-8829104</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-400 block">Statement #</span>
              <span className="text-base font-extrabold font-mono text-[#fcee21]">
                {selectedInvoicePdf || 'INV-2026-0982'}
              </span>
              <span className="text-xs font-mono text-slate-400 block mt-1">Issued: Oct 15, 2026</span>
              <span className="text-xs font-mono text-amber-400 block">Due: Nov 14, 2026</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d111a] border border-[#242f44] text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Billed To Entity:
            </span>
            <p className="font-bold text-white text-sm mt-0.5">Apex Horizon Technologies Ltd.</p>
            <p className="text-slate-400 font-mono text-[11px]">
              550 Madison Ave, New York, NY 10022 • Tax ID: US-EIN-94-3991044
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#242f44]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#151b28] text-slate-300 font-semibold border-b border-[#242f44]">
                <tr>
                  <th className="py-2 px-3">Service Line Item</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Rate</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2333] text-slate-200">
                <tr>
                  <td className="py-2 px-3 font-semibold text-white">
                    Enterprise Core Platform — Dedicated Cloud
                  </td>
                  <td className="py-2 px-3 text-right font-mono">1</td>
                  <td className="py-2 px-3 text-right font-mono">$3,200.00</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">$3,200.00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-white">
                    High-Volume API Add-On (5M Tier)
                  </td>
                  <td className="py-2 px-3 text-right font-mono">1</td>
                  <td className="py-2 px-3 text-right font-mono">$650.00</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">$650.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Gross Subtotal:</span>
              <span className="font-mono">$3,850.00</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tax / Statutory Deductions:</span>
              <span className="font-mono">$0.00 (Export Exempt)</span>
            </div>
            <div className="flex justify-between text-white font-extrabold text-sm pt-1 border-t border-[#1b2333]">
              <span>Net Settlement Amount:</span>
              <span className="font-mono text-[#fcee21]">$3,850.00</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Plan Details Modal */}
      <Modal
        isOpen={Boolean(isPlanDetailsOpen)}
        onClose={() => setIsPlanDetailsOpen(null)}
        title={
          isPlanDetailsOpen === 'CORE-01'
            ? 'Enterprise Core Platform — Architecture & SLA'
            : 'High-Volume API Add-On — Quotas & Rates'
        }
        description="Provisioning configuration, encryption standards, and performance specifications."
        maxWidth="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsPlanDetailsOpen(null)}>
            Done
          </Button>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          {isPlanDetailsOpen === 'CORE-01' ? (
            <>
              <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
                <span className="font-bold text-white block">Dedicated Infrastructure Stack</span>
                <p>• 10 Dedicated AWS/GCP Instances across us-east-1 and us-west-2.</p>
                <p>• Multi-Region Active-Active Failover with zero-downtime replication.</p>
                <p>• FIPS 140-2 Level 3 Hardware Security Modules for cryptographic key storage.</p>
              </div>
              <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
                <span className="font-bold text-white block">Guaranteed SLA Commitments</span>
                <p>• 99.98% Service Level Agreement with automated billing credits on breach.</p>
                <p>• 15-minute priority critical incident response time.</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-[#08090d] border border-[#242f44] space-y-1">
                <span className="font-bold text-white block">API Tier Parameters</span>
                <p>• 5,000,000 requests per billing month included in base fee.</p>
                <p>• Peak burst capability up to 2,500 requests / second.</p>
                <p>• Zero overage penalty: Throttle protection kicks in before charge escalation.</p>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Request License Expansion / Upgrade Modal */}
      <Modal
        isOpen={isExpansionModalOpen}
        onClose={() => setIsExpansionModalOpen(false)}
        title="Request Subscription Expansion / Tier Upgrade"
        description="Notify Brightloop Account Engineering for seat adjustments or infrastructure tier changes."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpansionModalOpen(false)}
              disabled={requestingExpansion}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestExpansion}
              isLoading={requestingExpansion}
            >
              Submit Expansion Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleRequestExpansion} className="space-y-3">
          <Input
            label="Additional User Licenses Requested"
            type="number"
            value={expansionSeats}
            onChange={(e) => setExpansionSeats(e.target.value)}
            placeholder="10"
            required
            hint="Licenses added at $45.00/seat/month prorated"
          />
          <Textarea
            label="Special Requirements or Project Timeline"
            value={expansionNotes}
            onChange={(e) => setExpansionNotes(e.target.value)}
            placeholder="e.g. Onboarding 10 additional data engineers starting next sprint..."
          />
        </form>
      </Modal>

      {/* Contact Dedicated CSM Modal */}
      <Modal
        isOpen={isCsmModalOpen}
        onClose={() => setIsCsmModalOpen(false)}
        title="Direct Message Dedicated CSM — Marcus Vance"
        description="Inquiries regarding contract revisions, payment instruments, or enterprise SLAs."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCsmModalOpen(false)}
              disabled={sendingCsm}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendCsm}
              isLoading={sendingCsm}
              disabled={!csmMessage}
            >
              Send Priority Inquiry
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendCsm} className="space-y-3">
          <Input
            label="Inquiry Subject"
            value={csmSubject}
            onChange={(e) => setCsmSubject(e.target.value)}
            required
          />
          <Textarea
            label="Message for Marcus Vance"
            value={csmMessage}
            onChange={(e) => setCsmMessage(e.target.value)}
            placeholder="Describe your requested adjustments or questions..."
            required
          />
        </form>
      </Modal>
    </div>
  );
};
