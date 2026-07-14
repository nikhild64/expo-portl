export type NotificationTemplateId =
  | 'visitorAtGate'
  | 'visitorStatusChanged'
  | 'complaintNew'
  | 'complaintStatusChanged'
  | 'complaintNewComment'
  | 'joinRequestNew'
  | 'duesCreated'
  | 'paymentCaptured'
  | 'paymentReminder'
  | 'pollPublished';

export type AppLocale = 'en' | 'hi';

export type NotificationTemplateParams = Record<string, string | number | undefined>;

type TemplateCatalog = Record<
  NotificationTemplateId,
  Record<string, string>
>;

const EN: TemplateCatalog = {
  visitorAtGate: {
    title: '{{visitorName}} at the gate',
    bodyPurpose: 'Purpose: {{purpose}}',
    bodyType: '{{visitorType}}',
  },
  visitorStatusChanged: {
    titleApproved: 'Visitor approved',
    titleRejected: 'Visitor rejected',
    titleFallback: 'Visitor update',
    statusApproved: 'approved',
    statusRejected: 'rejected',
    body: '{{visitorName}} was {{statusLabel}} by the resident.',
  },
  complaintNew: {
    title: 'New {{priority}}-priority complaint',
  },
  complaintStatusChanged: {
    title: 'Complaint {{status}}',
  },
  complaintNewComment: {
    title: 'New comment on: {{complaintTitle}}',
  },
  joinRequestNew: {
    title: 'New join request',
    body: '{{name}} requested to join your society.',
  },
  duesCreated: {
    title: 'Dues for {{period}}',
    body: 'Amount ₹{{amount}} • Due {{dueDate}}',
  },
  paymentCaptured: {
    title: 'Payment successful',
    body: 'INR {{amount}} received.',
  },
  paymentReminder: {
    title: 'Dues reminder',
    body: 'Please pay your pending society dues.',
  },
  pollPublished: {
    title: 'New poll: {{question}}',
    body: '{{category}} — cast your vote in Community.',
  },
};

const HI: TemplateCatalog = {
  visitorAtGate: {
    title: '{{visitorName}} गेट पर हैं',
    bodyPurpose: 'उद्देश्य: {{purpose}}',
    bodyType: '{{visitorType}}',
  },
  visitorStatusChanged: {
    titleApproved: 'आगंतुक स्वीकृत',
    titleRejected: 'आगंतुक अस्वीकृत',
    titleFallback: 'आगंतुक अपडेट',
    statusApproved: 'स्वीकृत',
    statusRejected: 'अस्वीकृत',
    body: '{{visitorName}} को निवासी द्वारा {{statusLabel}} किया गया।',
  },
  complaintNew: {
    title: 'नई {{priority}}-प्राथमिकता शिकायत',
  },
  complaintStatusChanged: {
    title: 'शिकायत {{status}}',
  },
  complaintNewComment: {
    title: 'नई टिप्पणी: {{complaintTitle}}',
  },
  joinRequestNew: {
    title: 'नया जॉइन अनुरोध',
    body: '{{name}} ने आपकी सोसायटी में शामिल होने का अनुरोध किया।',
  },
  duesCreated: {
    title: '{{period}} के लिए बकाया',
    body: 'राशि ₹{{amount}} • देय {{dueDate}}',
  },
  paymentCaptured: {
    title: 'भुगतान सफल',
    body: 'INR {{amount}} प्राप्त हुआ।',
  },
  paymentReminder: {
    title: 'बकाया अनुस्मारक',
    body: 'कृपया अपनी लंबित सोसायटी बकाया राशि का भुगतान करें।',
  },
  pollPublished: {
    title: 'नया मतदान: {{question}}',
    body: '{{category}} — समुदाय में अपना वोट दें।',
  },
};

const CATALOG: Record<AppLocale, TemplateCatalog> = { en: EN, hi: HI };

function interpolate(text: string, params: NotificationTemplateParams): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''));
}

function statusSuffix(status: string | undefined): 'Approved' | 'Rejected' | null {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return null;
}

function stringsFor(locale: AppLocale, template: NotificationTemplateId): Record<string, string> {
  return CATALOG[locale === 'hi' ? 'hi' : 'en'][template];
}

function resolveVisitorAtGate(locale: AppLocale, params: NotificationTemplateParams) {
  const s = stringsFor(locale, 'visitorAtGate');
  const title = interpolate(s.title, params);
  const body = params.purpose
    ? interpolate(s.bodyPurpose, params)
    : interpolate(s.bodyType, params);
  return { title, body };
}

function resolveVisitorStatusChanged(locale: AppLocale, params: NotificationTemplateParams) {
  const s = stringsFor(locale, 'visitorStatusChanged');
  const suffix = statusSuffix(String(params.status ?? ''));
  const title = suffix ? s[`title${suffix}`] : s.titleFallback;
  const statusLabel = suffix ? s[`status${suffix}`] : String(params.status ?? '');
  const body = interpolate(s.body, { ...params, statusLabel });
  return { title: title ?? s.titleFallback, body };
}

/** Resolve localized push/in-app text on the server (edge functions). */
export function localizeNotification(
  locale: AppLocale,
  template: NotificationTemplateId,
  params: NotificationTemplateParams,
  fallback: { title: string; body: string },
): { title: string; body: string } {
  try {
    switch (template) {
      case 'visitorAtGate':
        return resolveVisitorAtGate(locale, params);
      case 'visitorStatusChanged':
        return resolveVisitorStatusChanged(locale, params);
      case 'complaintNew':
        return {
          title: interpolate(stringsFor(locale, 'complaintNew').title, params),
          body: String(params.complaintTitle ?? fallback.body),
        };
      case 'complaintStatusChanged':
        return {
          title: interpolate(stringsFor(locale, 'complaintStatusChanged').title, params),
          body: String(params.complaintTitle ?? fallback.body),
        };
      case 'complaintNewComment':
        return {
          title: interpolate(stringsFor(locale, 'complaintNewComment').title, params),
          body: String(params.comment ?? fallback.body),
        };
      case 'joinRequestNew': {
        const s = stringsFor(locale, 'joinRequestNew');
        return { title: s.title, body: interpolate(s.body, params) };
      }
      case 'duesCreated': {
        const s = stringsFor(locale, 'duesCreated');
        const period = locale === 'hi' ? (params.periodHi ?? params.period ?? '') : (params.period ?? '');
        return {
          title: interpolate(s.title, { ...params, period }),
          body: interpolate(s.body, params),
        };
      }
      case 'paymentCaptured': {
        const s = stringsFor(locale, 'paymentCaptured');
        return { title: s.title, body: interpolate(s.body, params) };
      }
      case 'paymentReminder': {
        const s = stringsFor(locale, 'paymentReminder');
        return { title: s.title, body: s.body };
      }
      case 'pollPublished': {
        const s = stringsFor(locale, 'pollPublished');
        return {
          title: interpolate(s.title, params),
          body: interpolate(s.body, params),
        };
      }
      default:
        return fallback;
    }
  } catch {
    return fallback;
  }
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === 'hi' ? 'hi' : 'en';
}
