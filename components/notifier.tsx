'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { registerNotifier, resolveMsg, type Toast, type ConfirmRequest } from '@/lib/notify';
import { useLanguage } from '@/contexts/language-context';
import type { Translations } from '@/lib/i18n/translations';

const MAX_TOASTS = 4;

const kindStyle = {
  success: { color: '#00A88F', Icon: CheckCircle2 },
  error: { color: '#FF6B6B', Icon: AlertCircle },
  info: { color: '#E8DCC0', Icon: Info },
} as const;

// Tempo na tela: erros e textos longos ficam mais tempo
function durationOf(toast: Toast, t: Translations) {
  const base = toast.kind === 'error' ? 7000 : toast.kind === 'info' ? 5000 : 3500;
  return Math.min(base + resolveMsg(toast.message, t).length * 30, 15000);
}

export function Notifier() {
  const { t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const dismiss = (id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  };

  useEffect(() => {
    const allTimers = timers.current;
    registerNotifier({
      onToast: (t) => {
        setToasts((list) => [...list, t].slice(-MAX_TOASTS));
        allTimers.set(t.id, setTimeout(() => dismiss(t.id), durationOf(t, tRef.current)));
      },
      onConfirm: (c) => {
        // Uma confirmação por vez: se já havia outra aberta, ela é cancelada
        setConfirmReq((prev) => {
          prev?.resolve(false);
          return c;
        });
      },
    });
    return () => {
      registerNotifier(null);
      allTimers.forEach(clearTimeout);
      allTimers.clear();
    };
  }, []);

  const answer = (ok: boolean) => {
    confirmReq?.resolve(ok);
    setConfirmReq(null);
  };

  useEffect(() => {
    if (!confirmReq) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmReq]);

  return (
    <>
      {/* Avisos */}
      <div
        className="fixed z-[100] bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const { color, Icon } = kindStyle[toast.kind];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg"
              style={{
                backgroundColor: '#1B3C45',
                borderColor: 'rgba(232, 220, 192, 0.2)',
                borderLeft: `4px solid ${color}`,
              }}
              role={toast.kind === 'error' ? 'alert' : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-line break-words" style={{ color: '#E8DCC0' }}>
                  {resolveMsg(toast.message, t)}
                </p>
                {toast.action && (
                  <Link
                    href={toast.action.href}
                    onClick={() => dismiss(toast.id)}
                    className="inline-block mt-2 text-sm font-medium underline"
                    style={{ color: '#00A88F' }}
                  >
                    {resolveMsg(toast.action.label ?? '', t)}
                  </Link>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="p-1 -m-1 rounded hover:bg-white/10"
                style={{ color: '#E8DCC0' }}
                aria-label={t.msg.closeNotice}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmação */}
      {confirmReq && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => answer(false)}
        >
          <div
            className="rounded-lg p-5 max-w-sm w-full border shadow-xl"
            style={{ backgroundColor: '#1B3C45', borderColor: 'rgba(232, 220, 192, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-describedby="revela-confirm-message"
          >
            <p
              id="revela-confirm-message"
              className="text-sm whitespace-pre-line mb-5"
              style={{ color: '#E8DCC0' }}
            >
              {resolveMsg(confirmReq.message, t)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => answer(false)}
                className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.05)',
                  color: '#E8DCC0',
                  borderColor: 'rgba(232, 220, 192, 0.15)',
                }}
              >
                {t.common.cancel}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => answer(true)}
                className="flex-1 px-3 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: confirmReq.danger ? '#C0392B' : '#00A88F',
                  color: '#FFFFFF',
                }}
              >
                {confirmReq.confirmLabel ? resolveMsg(confirmReq.confirmLabel, t) : t.msg.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
