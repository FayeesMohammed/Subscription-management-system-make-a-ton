import React from 'react';
import { Input, InputProps } from '@brightloop/ui';

export interface MoneyInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currency = 'INR',
  ...props
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow numbers and at most one decimal point
    if (/^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      leftAddon={<span className="font-mono font-bold text-[#fcee21]">{currencySymbol}</span>}
      className="font-mono text-right font-medium"
      {...props}
    />
  );
};
