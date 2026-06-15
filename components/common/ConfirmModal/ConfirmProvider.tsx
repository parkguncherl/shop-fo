'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Button from '@/components/common/Button/Button';
import Modal from '@/components/common/Modal/Modal';
import styles from './ConfirmModal.module.scss';

type ConfirmTone = 'default' | 'danger';

interface ConfirmOptions {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ActiveConfirm extends Required<Omit<ConfirmOptions, 'description'>> {
  description?: string;
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const DEFAULT_OPTIONS: Omit<ActiveConfirm, 'message'> = {
  title: '확인',
  confirmText: '확인',
  cancelText: '취소',
  tone: 'default',
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirm | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const close = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setActiveConfirm(null);
  }, []);

  const confirm = useCallback<ConfirmContextValue>((options) => {
    resolverRef.current?.(false);

    setActiveConfirm({
      ...DEFAULT_OPTIONS,
      ...options,
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const isDanger = activeConfirm?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={Boolean(activeConfirm)}
        onClose={() => close(false)}
        title={activeConfirm?.title}
        size="sm"
        footer={
          activeConfirm && (
            <div className={styles.footer}>
              <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
                {activeConfirm.cancelText}
              </Button>
              <Button type="button" variant={isDanger ? 'danger' : 'primary'} size="sm" onClick={() => close(true)}>
                {activeConfirm.confirmText}
              </Button>
            </div>
          )
        }
      >
        {activeConfirm && (
          <div className={styles.content}>
            <div className={`${styles.icon} ${isDanger ? styles.danger : ''}`} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5M12 16.5v.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.copy}>
              <p className={styles.message}>{activeConfirm.message}</p>
              {activeConfirm.description && <p className={styles.description}>{activeConfirm.description}</p>}
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}
