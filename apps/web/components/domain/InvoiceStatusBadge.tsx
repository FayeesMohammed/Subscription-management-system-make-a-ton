import React from 'react';
import { Badge } from '@brightloop/ui';
import { InvoiceStatus } from '@brightloop/shared-types';
import { FileEdit, Lock, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  status: InvoiceStatus | string;
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const InvoiceStatusBadge: React.FC<Props> = ({ status, isOverdue, size = 'md' }) => {
  const norm = status.toLowerCase();

  if (isOverdue) {
    return (
      <Badge
        variant="overdue"
        size={size}
        icon={<AlertTriangle className="w-3 h-3" />}
      >
        Overdue
      </Badge>
    );
  }

  switch (norm) {
    case InvoiceStatus.DRAFT:
      return (
        <Badge
          variant="draft"
          size={size}
          icon={<FileEdit className="w-3 h-3" />}
        >
          Draft
        </Badge>
      );
    case InvoiceStatus.CONFIRMED:
    case InvoiceStatus.FINALIZED:
      return (
        <Badge
          variant="confirmed"
          size={size}
          icon={<Lock className="w-3 h-3" />}
        >
          Confirmed (Locked)
        </Badge>
      );
    case InvoiceStatus.PAID:
      return (
        <Badge
          variant="paid"
          size={size}
          icon={<ShieldCheck className="w-3 h-3" />}
        >
          Paid
        </Badge>
      );
    case InvoiceStatus.VOID:
      return (
        <Badge
          variant="void"
          size={size}
          icon={<XCircle className="w-3 h-3" />}
        >
          Void
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size={size}>
          {status}
        </Badge>
      );
  }
};
