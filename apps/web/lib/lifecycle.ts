import { SubscriptionStatus, InvoiceStatus, TenantRole } from '@brightloop/shared-types';
import { hasCapability } from './permissions.ts';

export interface PermittedAction {
  targetStatus: SubscriptionStatus | InvoiceStatus;
  label: string;
  description: string;
  variant: 'primary' | 'secondary' | 'danger';
  isSystemManaged?: boolean;
}

/**
 * Returns the permitted subscription lifecycle transitions for a given role.
 * Commercial lifecycle: DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
 */
export function getPermittedSubscriptionTransitions(
  currentStatus: SubscriptionStatus | string,
  role: TenantRole | string,
): PermittedAction[] {
  const norm = currentStatus.toLowerCase() as SubscriptionStatus;
  const canTransition = hasCapability(role, 'subscription:transition');
  const canClose = hasCapability(role, 'subscription:close');

  const actions: PermittedAction[] = [];

  switch (norm) {
    case SubscriptionStatus.DRAFT:
      if (canTransition) {
        actions.push({
          targetStatus: SubscriptionStatus.QUOTATION,
          label: 'Issue Quotation',
          description: 'Convert draft into a formal commercial quotation with validity terms.',
          variant: 'primary',
        });
      }
      break;

    case SubscriptionStatus.QUOTATION:
      if (canTransition || hasCapability(role, 'quotation:accept')) {
        actions.push({
          targetStatus: SubscriptionStatus.CONFIRMED,
          label: 'Accept & Confirm Quotation',
          description: 'Confirm commercial acceptance of terms and locked line items.',
          variant: 'primary',
        });
      }
      break;

    case SubscriptionStatus.CONFIRMED:
      if (canTransition) {
        actions.push({
          targetStatus: SubscriptionStatus.ACTIVE,
          label: 'Activate Subscription',
          description: 'Begin active billing service schedule.',
          variant: 'primary',
        });
      }
      break;

    case SubscriptionStatus.ACTIVE:
      if (canClose) {
        actions.push({
          targetStatus: SubscriptionStatus.CLOSED,
          label: 'Close Subscription',
          description: 'Finalize and close recurring billing agreement.',
          variant: 'danger',
        });
      }
      break;

    default:
      break;
  }

  // Early close affordance for non-closed states if authorized
  if (
    norm !== SubscriptionStatus.CLOSED &&
    norm !== SubscriptionStatus.CANCELED &&
    canClose &&
    norm !== SubscriptionStatus.ACTIVE // already handled above
  ) {
    actions.push({
      targetStatus: SubscriptionStatus.CLOSED,
      label: 'Early Close',
      description: 'Authorized administrative early termination.',
      variant: 'danger',
    });
  }

  return actions;
}

/**
 * Returns permitted invoice actions:
 * DRAFT -> CONFIRMED -> PAID / VOID
 */
export function getPermittedInvoiceTransitions(
  currentStatus: InvoiceStatus | string,
  role: TenantRole | string,
): PermittedAction[] {
  const norm = currentStatus.toLowerCase() as InvoiceStatus;
  const canConfirm = hasCapability(role, 'invoice:confirm');
  const canVoid = hasCapability(role, 'invoice:void');

  const actions: PermittedAction[] = [];

  switch (norm) {
    case InvoiceStatus.DRAFT:
      if (canConfirm) {
        actions.push({
          targetStatus: InvoiceStatus.CONFIRMED,
          label: 'Confirm & Lock Invoice',
          description: 'Lock invoice snapshot permanently. Confirmed invoices become immutable.',
          variant: 'primary',
        });
      }
      if (canVoid) {
        actions.push({
          targetStatus: InvoiceStatus.VOID,
          label: 'Void Draft',
          description: 'Cancel draft invoice.',
          variant: 'danger',
        });
      }
      break;

    case InvoiceStatus.CONFIRMED:
      // Note: Transition to PAID is driven by recording payments (settling outstanding balance)
      if (canVoid) {
        actions.push({
          targetStatus: InvoiceStatus.VOID,
          label: 'Void Invoice',
          description: 'Void confirmed invoice. Cannot be undone.',
          variant: 'danger',
        });
      }
      break;

    default:
      break;
  }

  return actions;
}

export function isInvoiceImmutable(status: InvoiceStatus | string): boolean {
  const norm = status.toLowerCase();
  return (
    norm === InvoiceStatus.CONFIRMED ||
    norm === InvoiceStatus.FINALIZED ||
    norm === InvoiceStatus.PAID ||
    norm === InvoiceStatus.VOID
  );
}
