import React from 'react';
import { Badge } from '@brightloop/ui';
import { SubscriptionStatus } from '@brightloop/shared-types';
import { FileText, Send, CheckCircle2, Zap, Archive, AlertCircle } from 'lucide-react';

interface Props {
  status: SubscriptionStatus | string;
  size?: 'sm' | 'md';
}

export const SubscriptionStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  switch (norm) {
    case SubscriptionStatus.DRAFT:
      return (
        <Badge
          variant="draft"
          size={size}
          icon={<FileText className="w-3 h-3" />}
        >
          Draft
        </Badge>
      );
    case SubscriptionStatus.QUOTATION:
      return (
        <Badge
          variant="quotation"
          size={size}
          icon={<Send className="w-3 h-3" />}
        >
          Quotation
        </Badge>
      );
    case SubscriptionStatus.CONFIRMED:
      return (
        <Badge
          variant="confirmed"
          size={size}
          icon={<CheckCircle2 className="w-3 h-3" />}
        >
          Confirmed
        </Badge>
      );
    case SubscriptionStatus.ACTIVE:
      return (
        <Badge
          variant="active"
          size={size}
          icon={<Zap className="w-3 h-3" />}
        >
          Active
        </Badge>
      );
    case SubscriptionStatus.CLOSED:
      return (
        <Badge
          variant="closed"
          size={size}
          icon={<Archive className="w-3 h-3" />}
        >
          Closed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="neutral"
          size={size}
          icon={<AlertCircle className="w-3 h-3" />}
        >
          {status}
        </Badge>
      );
  }
};
