import React from 'react';
import { Card } from '@brightloop/ui';
import { MoneyDisplay } from './MoneyDisplay';

interface Props {
  subtotal: string;
  variantAdjustment?: string;
  discountAmount?: string;
  discountCode?: string;
  taxAmount: string;
  taxRatePercentage?: string;
  totalAmount: string;
  paidAmount?: string;
  outstandingBalance?: string;
  currency?: string;
  compact?: boolean;
}

export const PricingSummary: React.FC<Props> = ({
  subtotal,
  variantAdjustment,
  discountAmount,
  discountCode,
  taxAmount,
  taxRatePercentage = '18',
  totalAmount,
  paidAmount,
  outstandingBalance,
  currency = 'INR',
  compact = false,
}) => {
  return (
    <Card surface="elevated" className={`space-y-3 ${compact ? 'p-4' : 'p-5'}`}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#242f44] pb-2">
        Financial Breakdown
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span>Gross Subtotal</span>
          <MoneyDisplay amount={subtotal} currency={currency} size="sm" />
        </div>

        {variantAdjustment && Number(variantAdjustment) !== 0 && (
          <div className="flex items-center justify-between text-slate-300">
            <span>Variant Tier Adjustment</span>
            <MoneyDisplay
              amount={variantAdjustment}
              currency={currency}
              size="sm"
              color="muted"
            />
          </div>
        )}

        {discountAmount && Number(discountAmount) > 0 && (
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span>Applied Discount</span>
              {discountCode && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono font-bold">
                  {discountCode}
                </span>
              )}
            </span>
            <span className="font-mono font-bold">
              -<MoneyDisplay amount={discountAmount} currency={currency} size="sm" color="success" />
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-300">
          <span>Taxes & GST ({taxRatePercentage}%)</span>
          <MoneyDisplay amount={taxAmount} currency={currency} size="sm" />
        </div>
      </div>

      <div className="border-t border-[#242f44] pt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white uppercase tracking-wider">
          Total Commercial Value
        </span>
        <MoneyDisplay
          amount={totalAmount}
          currency={currency}
          size="lg"
          color="yellow"
        />
      </div>

      {(paidAmount !== undefined || outstandingBalance !== undefined) && (
        <div className="border-t border-[#242f44] pt-2.5 space-y-1.5 text-xs">
          {paidAmount !== undefined && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Settled (Paid)</span>
              <MoneyDisplay
                amount={paidAmount}
                currency={currency}
                size="sm"
                color={Number(paidAmount) > 0 ? 'success' : 'muted'}
              />
            </div>
          )}

          {outstandingBalance !== undefined && (
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>Outstanding Balance Due</span>
              <MoneyDisplay
                amount={outstandingBalance}
                currency={currency}
                size="md"
                color={Number(outstandingBalance) > 0 ? 'danger' : 'success'}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
