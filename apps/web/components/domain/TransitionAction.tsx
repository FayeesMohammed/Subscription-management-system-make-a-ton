import React, { useState } from 'react';
import { Button, Modal } from '@brightloop/ui';
import { PermittedAction } from '@/lib/lifecycle';
import { ArrowRight, AlertTriangle } from 'lucide-react';

interface Props {
  actions: PermittedAction[];
  onExecute: (action: PermittedAction) => Promise<void> | void;
  isLoading?: boolean;
}

export const TransitionAction: React.FC<Props> = ({ actions, onExecute, isLoading = false }) => {
  const [selectedAction, setSelectedAction] = useState<PermittedAction | null>(null);

  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#151b28] border border-[#242f44] text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        <span>No manual actions permitted at this stage (Lifecycle locked or system-managed)</span>
      </div>
    );
  }

  // Primary action is the main forward step
  const primaryAction = actions.find((a) => a.variant === 'primary') || actions[0];
  const secondaryActions = actions.filter((a) => a !== primaryAction);

  const handleConfirm = async () => {
    if (selectedAction) {
      await onExecute(selectedAction);
      setSelectedAction(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {primaryAction && (
          <Button
            variant={primaryAction.variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => setSelectedAction(primaryAction)}
            isLoading={isLoading}
          >
            {primaryAction.label}
          </Button>
        )}

        {secondaryActions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant === 'danger' ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setSelectedAction(action)}
            isLoading={isLoading}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <Modal
        isOpen={!!selectedAction}
        onClose={() => setSelectedAction(null)}
        title={selectedAction?.label || 'Confirm Lifecycle Transition'}
        description="Verify commercial and regulatory impact before advancing status."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAction(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={selectedAction?.variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirm}
              isLoading={isLoading}
            >
              Confirm Transition
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#08090d] border border-[#242f44]">
            <AlertTriangle className="w-5 h-5 text-[#fcee21] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">{selectedAction?.description}</p>
              <p className="mt-1 text-slate-400">
                This operation transitions the official state to{' '}
                <span className="font-mono font-bold text-white uppercase">
                  {selectedAction?.targetStatus}
                </span>
                . State transitions are audited with timestamp and user signature.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
