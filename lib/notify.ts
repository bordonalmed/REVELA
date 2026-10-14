// Avisos discretos (toasts) e confirmações no visual do Revela, no lugar de
// alert()/confirm() do navegador. Renderizados por <Notifier /> (app/layout.tsx).

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  href: string;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

export interface ConfirmRequest {
  id: number;
  message: string;
  confirmLabel: string;
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

function show(kind: ToastKind, message: string, action?: ToastAction) {
  if (typeof window === 'undefined') return;
  // Sem o Notifier montado (não deveria acontecer), cai no alert do navegador
  if (!listener) {
    window.alert(message);
    return;
  }
  listener.onToast({ id: nextId++, kind, message, action });
}

export const notify = {
  success: (message: string, action?: ToastAction) => show('success', message, action),
  error: (message: string, action?: ToastAction) => show('error', message, action),
  info: (message: string, action?: ToastAction) => show('info', message, action),
};

// Link padrão para mensagens de limite de plano
export const PLANS_ACTION: ToastAction = { label: 'Ver planos', href: '/planos' };

export function confirmDialog(
  message: string,
  options: { confirmLabel?: string; danger?: boolean } = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!listener) return Promise.resolve(window.confirm(message));
  const l = listener;
  return new Promise((resolve) => {
    l.onConfirm({
      id: nextId++,
      message,
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      danger: options.danger ?? false,
      resolve,
    });
  });
}
