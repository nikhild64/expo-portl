import type { TFunction } from 'i18next';

import i18n from '@/i18n';

export type NotificationTemplateId =
  | 'visitorAtGate'
  | 'visitorStatusChanged'
  | 'complaintNew'
  | 'complaintStatusChanged'
  | 'complaintNewComment'
  | 'joinRequestNew'
  | 'duesCreated'
  | 'paymentCaptured'
  | 'paymentReminder';

export type NotificationTemplateParams = Record<string, string | number | undefined>;

export type NotificationData = {
  template?: NotificationTemplateId;
  params?: NotificationTemplateParams;
  url?: string;
  [key: string]: unknown;
};

const TEMPLATE_PREFIX = 'notifications.templates';

function statusSuffix(status: string | undefined): 'Approved' | 'Rejected' | null {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return null;
}

function resolveVisitorAtGate(t: TFunction, params: NotificationTemplateParams) {
  const title = t(`${TEMPLATE_PREFIX}.visitorAtGate.title`, {
    visitorName: params.visitorName ?? '',
  });
  const body = params.purpose
    ? t(`${TEMPLATE_PREFIX}.visitorAtGate.bodyPurpose`, { purpose: params.purpose })
    : t(`${TEMPLATE_PREFIX}.visitorAtGate.bodyType`, { visitorType: params.visitorType ?? '' });
  return { title, body };
}

function resolveVisitorStatusChanged(t: TFunction, params: NotificationTemplateParams) {
  const suffix = statusSuffix(String(params.status ?? ''));
  const title = suffix
    ? t(`${TEMPLATE_PREFIX}.visitorStatusChanged.title${suffix}`)
    : t(`${TEMPLATE_PREFIX}.visitorStatusChanged.titleFallback`);
  const statusLabel = suffix
    ? t(`${TEMPLATE_PREFIX}.visitorStatusChanged.status${suffix}`)
    : String(params.status ?? '');
  const body = t(`${TEMPLATE_PREFIX}.visitorStatusChanged.body`, {
    visitorName: params.visitorName ?? '',
    statusLabel,
  });
  return { title, body };
}

function resolveComplaintNew(t: TFunction, params: NotificationTemplateParams) {
  return {
    title: t(`${TEMPLATE_PREFIX}.complaintNew.title`, { priority: params.priority ?? 'medium' }),
    body: String(params.complaintTitle ?? ''),
  };
}

function resolveComplaintStatusChanged(t: TFunction, params: NotificationTemplateParams) {
  return {
    title: t(`${TEMPLATE_PREFIX}.complaintStatusChanged.title`, { status: params.status ?? '' }),
    body: String(params.complaintTitle ?? ''),
  };
}

function resolveComplaintNewComment(t: TFunction, params: NotificationTemplateParams) {
  return {
    title: t(`${TEMPLATE_PREFIX}.complaintNewComment.title`, { complaintTitle: params.complaintTitle ?? '' }),
    body: String(params.comment ?? ''),
  };
}

function resolveJoinRequestNew(t: TFunction, params: NotificationTemplateParams) {
  return {
    title: t(`${TEMPLATE_PREFIX}.joinRequestNew.title`),
    body: t(`${TEMPLATE_PREFIX}.joinRequestNew.body`, { name: params.name ?? '' }),
  };
}

function resolveDuesCreated(t: TFunction, params: NotificationTemplateParams) {
  const period =
    i18n.language?.startsWith('hi')
      ? String(params.periodHi ?? params.period ?? '')
      : String(params.period ?? '');
  return {
    title: t(`${TEMPLATE_PREFIX}.duesCreated.title`, { period }),
    body: t(`${TEMPLATE_PREFIX}.duesCreated.body`, {
      amount: params.amount ?? '',
      dueDate: params.dueDate ?? '',
    }),
  };
}

function resolvePaymentCaptured(t: TFunction, params: NotificationTemplateParams) {
  return {
    title: t(`${TEMPLATE_PREFIX}.paymentCaptured.title`),
    body: t(`${TEMPLATE_PREFIX}.paymentCaptured.body`, { amount: params.amount ?? '' }),
  };
}

function resolvePaymentReminder(t: TFunction) {
  return {
    title: t(`${TEMPLATE_PREFIX}.paymentReminder.title`),
    body: t(`${TEMPLATE_PREFIX}.paymentReminder.body`),
  };
}

/** Localize in-app notification title/body from template metadata, with English DB fallback. */
export function resolveNotificationDisplay(
  t: TFunction,
  fallback: { title: string; body: string | null },
  data: NotificationData | null | undefined,
): { title: string; body: string | null } {
  const template = data?.template;
  if (!template) return fallback;

  const params = data?.params ?? {};

  try {
    switch (template) {
      case 'visitorAtGate':
        return resolveVisitorAtGate(t, params);
      case 'visitorStatusChanged':
        return resolveVisitorStatusChanged(t, params);
      case 'complaintNew':
        return resolveComplaintNew(t, params);
      case 'complaintStatusChanged':
        return resolveComplaintStatusChanged(t, params);
      case 'complaintNewComment':
        return resolveComplaintNewComment(t, params);
      case 'joinRequestNew':
        return resolveJoinRequestNew(t, params);
      case 'duesCreated':
        return resolveDuesCreated(t, params);
      case 'paymentCaptured':
        return resolvePaymentCaptured(t, params);
      case 'paymentReminder':
        return resolvePaymentReminder(t);
      default:
        return fallback;
    }
  } catch {
    return fallback;
  }
}

export function parseNotificationData(raw: unknown): NotificationData | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as NotificationData;
}
