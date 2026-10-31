'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0 border-r border-[#242f44] animate-in slide-in-from-left duration-200',
    right: 'right-0 border-l border-[#242f44] animate-in slide-in-from-right duration-200',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 bottom-0 w-80 max-w-full bg-[#08090d] p-5 shadow-2xl z-10 flex flex-col ${positionStyles[position]}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#242f44]">
          {title && (
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-[#151b28] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{children}</div>
      </div>
    </div>
  );
};
