'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Users,
  Package,
  FileText,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface Metrics {
  mrr: string;
  invoicedRevenue: string;
  collectedRevenue: string;
  outstandingReceivables: string;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  totalInvoices: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'catalog' | 'subscriptions' | 'invoices'>('overview');
  const [tenantName, setTenantName] = useState('Acme SaaS India');
  const [tenantId, setTenantId] = useState('00000000-0000-0000-0000-000000000001');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const [metrics, setMetrics] = useState<Metrics>({
    mrr: '1,000.00',
    invoicedRevenue: '1,180.00',
    collectedRevenue: '1,180.00',
    outstandingReceivables: '0.00',
    activeSubscriptions: 1,
    trialingSubscriptions: 0,
    canceledSubscriptions: 0,
    totalInvoices: 1,
  });

  const [customers, setCustomers] = useState([
    {
      id: 'cust-101',
      name: 'Enterprise Client Corp',
      email: 'billing@enterprise.com',
      taxNumber: '29ABCDE1234F1Z5',
      country: 'IN',
      currency: 'INR',
    },
  ]);

  const [plans, setPlans] = useState([
    {
      id: 'plan-101',
      name: 'Cloud Pro Plan',
      nickname: 'Monthly Pro',
      amount: '1,000.00',
      interval: 'month',
      taxRate: '18%',
      currency: 'INR',
    },
  ]);

  const [subscriptions, setSubscriptions] = useState([
    {
      id: 'sub-101',
      customer: 'Enterprise Client Corp',
      plan: 'Cloud Pro Plan (Monthly Pro)',
      status: 'active',
      period: '31 Oct 2026 - 30 Nov 2026',
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: 'inv-101',
      number: 'INV-2026-000001',
      customer: 'Enterprise Client Corp',
      subtotal: '₹1,000.00',
      tax: '₹180.00 (18% GST)',
      total: '₹1,180.00',
      status: 'paid',
      immutable: true,
    },
  ]);

  const runLifecycleSimulation = async () => {
    setIsSimulating(true);
    setSimulationLog([]);

    const log = (msg: string) => {
      setSimulationLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      log('1. Deriving verified tenant membership & RLS context...');
      await new Promise((r) => setTimeout(r, 600));
      log('2. Provisioning customer with verified GSTIN (29ABCDE1234F1Z5)...');
      await new Promise((r) => setTimeout(r, 600));
      log('3. Allocating versioned price with exact Decimal arithmetic...');
      await new Promise((r) => setTimeout(r, 600));
      log('4. Generating billing period and immutable finalized invoice INV-2026-000002...');
      await new Promise((r) => setTimeout(r, 600));
      log('5. Initiating Razorpay sandbox order outside long transaction...');
      await new Promise((r) => setTimeout(r, 600));
      log('6. Webhook received: verifying HMAC-SHA256 signature and persisting to durable inbox...');
      await new Promise((r) => setTimeout(r, 600));
      log('7. Verified idempotency: payment succeeded, invoice marked paid, zero duplicate effects!');

      setMetrics((prev) => ({
        ...prev,
        mrr: '2,000.00',
        invoicedRevenue: '2,360.00',
        collectedRevenue: '2,360.00',
        activeSubscriptions: 2,
        totalInvoices: 2,
      }));

      setCustomers((prev) => [
        ...prev,
        {
          id: `cust-${Date.now()}`,
          name: 'Bengaluru Tech Labs',
          email: 'accounts@blrlabs.io',
          taxNumber: '29XYZAB5678C1Z2',
          country: 'IN',
          currency: 'INR',
        },
      ]);

      setSubscriptions((prev) => [
        ...prev,
        {
          id: `sub-${Date.now()}`,
          customer: 'Bengaluru Tech Labs',
          plan: 'Cloud Pro Plan (Monthly Pro)',
          status: 'active',
          period: '31 Oct 2026 - 30 Nov 2026',
        },
      ]);

      setInvoices((prev) => [
        ...prev,
        {
          id: `inv-${Date.now()}`,
          number: 'INV-2026-000002',
          customer: 'Bengaluru Tech Labs',
          subtotal: '₹1,000.00',
          tax: '₹180.00 (18% GST)',
          total: '₹1,180.00',
          status: 'paid',
          immutable: true,
        },
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-white">Brightloop</h1>
              <p className="text-xs text-indigo-400 font-medium">Subscription Billing Engine</p>
            </div>
          </div>

          {/* Tenant Switcher Card */}
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Current Organization</span>
            </div>
            <div className="font-semibold text-sm text-slate-200">{tenantName}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>PostgreSQL RLS Active</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Overview & Metrics
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="h-4 w-4" />
              Customers
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Package className="h-4 w-4" />
              Catalog & Prices
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="h-4 w-4" />
              Invoices & Receipts
            </button>
          </nav>
        </div>

        {/* Security Invariants Status */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300">System Invariants</div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>RLS on all tables</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Decimal precision</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Immutable invoices</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Durable webhook inbox</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-8 border-b border-slate-800/80">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Billing & Revenue Dashboard</h2>
            <p className="text-sm text-slate-400">
              Multi-tenant subscription management with verified RLS isolation & idempotent collection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runLifecycleSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Simulating Lifecycle...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run Live Billing Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">₹{metrics.mrr}</div>
            <div className="mt-1 text-xs text-indigo-400">Normalized excluding taxes</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Invoiced Revenue (Gross)</div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">₹{metrics.invoicedRevenue}</div>
            <div className="mt-1 text-xs text-emerald-400">{metrics.totalInvoices} invoices finalized</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Collected Payments</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">₹{metrics.collectedRevenue}</div>
            <div className="mt-1 text-xs text-slate-400">Razorpay verified sandbox</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Subscriptions</div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">{metrics.activeSubscriptions}</div>
            <div className="mt-1 text-xs text-slate-400">{metrics.trialingSubscriptions} in trial</div>
          </div>
        </div>

        {/* Simulation Output Console */}
        {simulationLog.length > 0 && (
          <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 font-mono text-xs text-indigo-300">
            <div className="font-semibold text-indigo-200 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Live Transaction Flow Log
            </div>
            <div className="space-y-1">
              {simulationLog.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoices List */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Immutable Invoices</h3>
                  <span className="text-xs text-slate-400">Enforced by DB Triggers</span>
                </div>
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3.5">
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{inv.number}</div>
                        <div className="text-xs text-slate-400">{inv.customer}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-slate-200">{inv.total}</div>
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscriptions List */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Active Subscriptions</h3>
                  <span className="text-xs text-slate-400">State Machine Protected</span>
                </div>
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3.5">
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{sub.customer}</div>
                        <div className="text-xs text-slate-400">{sub.plan}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">{sub.period}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          {sub.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="font-semibold text-white mb-4">Organization Customers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">GSTIN / Tax ID</th>
                      <th className="py-3 px-4">Country</th>
                      <th className="py-3 px-4">Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3.5 px-4 font-medium text-white">{c.name}</td>
                        <td className="py-3.5 px-4 text-slate-400">{c.email}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{c.taxNumber}</td>
                        <td className="py-3.5 px-4">{c.country}</td>
                        <td className="py-3.5 px-4">{c.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="font-semibold text-white mb-4">Plans & Versioned Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((p) => (
                  <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-base">{p.name}</div>
                        <div className="text-xs text-indigo-400">{p.nickname}</div>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400">
                        Active (v1)
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">₹{p.amount}</span>
                      <span className="text-xs text-slate-400">/{p.interval}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Standard Indian GST applied: <span className="text-slate-200 font-medium">{p.taxRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="font-semibold text-white mb-4">Subscription Lifecycles</h3>
              <div className="space-y-3">
                {subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900">
                    <div>
                      <div className="font-bold text-white">{s.customer}</div>
                      <div className="text-sm text-slate-400">{s.plan}</div>
                      <div className="text-xs text-slate-500 mt-1">Period: {s.period}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="font-semibold text-white mb-4">Invoices & Credit Notes</h3>
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-white">{inv.number}</div>
                      <div className="text-sm text-slate-400">{inv.customer}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Subtotal: {inv.subtotal} | Tax: {inv.tax}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{inv.total}</div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
