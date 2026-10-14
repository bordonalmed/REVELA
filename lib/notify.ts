// Avisos discretos (toasts) e confirmações no visual do Revela, no lugar de
// alert()/confirm() do navegador. Renderizados por <Notifier /> (app/layout.tsx).
//
// Mensagens podem ser texto pronto ou uma função que recebe as traduções do idioma
// atual: notify.success(t => t.msg.projectDeleted)

import type { Translations } from './i18n/translations';
import { getTranslations, type Language } from './i18n/translations';

export type Msg = string | ((t: Translations) => string);

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  label?: Msg;
  href: string;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: Msg;
  action?: ToastAction;
}

export interface ConfirmRequest {
  id: number;
  message: Msg;
  confirmLabel?: Msg;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

type Listener = {
  onToast: (t: Toast) => void;
  onConfirm: (c: ConfirmRequest) => void;
};

let listener: Listener | null = null;
let nextId = 1;

export function registerNotifier(l: Listener | null) {
  listener = l;
}

export function resolveMsg(m: Msg, t: Translations): string {
  return typeof m === 'function' ? m(t) : m;
}

// Usado só quando o Notifier não está montado (não deveria acontecer)
function fallbackText(m: Msg): string {
  let lang: Language = 'pt-BR';
  try {
    if (localStorage.getItem('revela-language') === 'en-US') lang = 'en-US';
  } catch {
    /* ignore */
  }
  return resolveMsg(m, getTranslations(lang));
}

function show(kind: ToastKind, message: Msg, action?: ToastAction) {
  if (typeof window === 'undefined') return;
  if (!listener) {
    window.alert(fallbackText(message));
    return;
  }
  listener.onToast({ id: nextId++, kind, message, action });
}

export const notify = {
  success: (message: Msg, action?: ToastAction) => show('success', message, action),
  error: (message: Msg, action?: ToastAction) => show('error', message, action),
  info: (message: Msg, action?: ToastAction) => show('info', message, action),
};

// Link padrão para mensagens de limite de plano
export const PLANS_ACTION: ToastAction = { label: (t) => t.msg.viewPlans, href: '/planos' };

export function confirmDialog(
  message: Msg,
  options: { confirmLabel?: Msg; danger?: boolean } = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!listener) return Promise.resolve(window.confirm(fallbackText(message)));
  const l = listener;
  return new Promise((resolve) => {
    l.onConfirm({
      id: nextId++,
      message,
      confirmLabel: options.confirmLabel,
      danger: options.danger ?? false,
      resolve,
    });
  });
}
