'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

function dismissKeyForEmail(email: string) {
  return `revela_plan_email_hint_dismissed_${email.trim().toLowerCase()}`;
}

export interface PlanEntitlementAlertsProps {
  email?: string | null;
  entitlementLoading?: boolean;
  entitlementFetchError?: boolean;
  showPurchaseEmailHint?: boolean;
  compact?: boolean;
}

export function PlanEntitlementAlerts({
  email = '',
  entitlementLoading = false,
  entitlementFetchError = false,
  showPurchaseEmailHint = false,
  compact = false,
}: PlanEntitlementAlertsProps) {
  const { t } = useLanguage();
  const [emailHintDismissed, setEmailHintDismissed] = useState(true);

  useEffect(() => {
    if (!email) {
      setEmailHintDismissed(true);
      return;
    }
    setEmailHintDismissed(
      typeof window !== 'undefined' &&
        window.localStorage.getItem(dismissKeyForEmail(email)) === '1',
    );
  }, [email]);

  const dismissEmailHint = () => {
    if (email && typeof window !== 'undefined') {
      window.localStorage.setItem(dismissKeyForEmail(email), '1');
    }
    setEmailHintDismissed(true);
  };

  if (entitlementLoading) return null;

  const showEmailHint = showPurchaseEmailHint && !emailHintDismissed;

  if (!entitlementFetchError && !showEmailHint) return null;

  return (
    <div className={compact ? 'space-y-1 mt-1.5' : 'space-y-2'}>
      {entitlementFetchError && (
        <div
          role="status"
          className="rounded-lg border px-3 py-2 text-xs sm:text-sm"
          style={{
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            borderColor: 'rgba(234, 179, 8, 0.35)',
            color: '#fde68a',
          }}
        >
          {t.planAlerts.fetchError}
        </div>
      )}

      {showEmailHint && (
        <div
          role="status"
          className="rounded-lg border px-3 py-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#bae6fd',
          }}
        >
          <p className="flex-1 leading-relaxed">
            {t.planAlerts.emailMismatch}
            {email && (
              <span className="block mt-1 opacity-90">
                {t.planAlerts.loggedInAs} <strong>{email}</strong>
              </span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/contato"
              className="underline hover:opacity-80 whitespace-nowrap"
              style={{ color: '#7dd3fc' }}
            >
              {t.planAlerts.contactSupport}
            </Link>
            <button
              type="button"
              onClick={dismissEmailHint}
              className="px-2 py-1 rounded border text-[11px] sm:text-xs hover:opacity-80"
              style={{
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#E8DCC0',
              }}
            >
              {t.planAlerts.dismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
