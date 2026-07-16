jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { language: 'en' },
}));

import i18n from '@/i18n';
import { parseNotificationData, resolveNotificationDisplay } from './notificationTemplates';

const t = ((key: string) => key) as any;

const fallback = { title: 'DB Title', body: 'DB Body' };

describe('parseNotificationData', () => {
  it('returns null for non-object values', () => {
    expect(parseNotificationData(null)).toBeNull();
    expect(parseNotificationData(undefined)).toBeNull();
    expect(parseNotificationData('bad')).toBeNull();
    expect(parseNotificationData(42)).toBeNull();
  });

  it('returns parsed notification data for objects', () => {
    const data = { template: 'paymentReminder', params: { amount: 100 }, url: '/dues' };
    expect(parseNotificationData(data)).toEqual(data);
  });
});

describe('resolveNotificationDisplay', () => {
  it('returns fallback when template is missing', () => {
    expect(resolveNotificationDisplay(t, fallback, null)).toEqual(fallback);
    expect(resolveNotificationDisplay(t, fallback, { url: '/home' })).toEqual(fallback);
  });

  it('resolves visitorAtGate with purpose or visitor type', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorAtGate',
        params: { visitorName: 'Alex', purpose: 'Delivery' },
      }),
    ).toEqual({
      title: 'notifications.templates.visitorAtGate.title',
      body: 'notifications.templates.visitorAtGate.bodyPurpose',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorAtGate',
        params: { visitorName: 'Alex', visitorType: 'guest' },
      }),
    ).toEqual({
      title: 'notifications.templates.visitorAtGate.title',
      body: 'notifications.templates.visitorAtGate.bodyType',
    });
  });

  it('resolves visitorStatusChanged for approved, rejected, and unknown statuses', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorStatusChanged',
        params: { visitorName: 'Alex', status: 'approved' },
      }),
    ).toEqual({
      title: 'notifications.templates.visitorStatusChanged.titleApproved',
      body: 'notifications.templates.visitorStatusChanged.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorStatusChanged',
        params: { visitorName: 'Alex', status: 'rejected' },
      }),
    ).toEqual({
      title: 'notifications.templates.visitorStatusChanged.titleRejected',
      body: 'notifications.templates.visitorStatusChanged.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorStatusChanged',
        params: { visitorName: 'Alex', status: 'pending' },
      }),
    ).toEqual({
      title: 'notifications.templates.visitorStatusChanged.titleFallback',
      body: 'notifications.templates.visitorStatusChanged.body',
    });
  });

  it('resolves complaint and join-request templates', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintNew',
        params: { priority: 'high', complaintTitle: 'Water leak' },
      }),
    ).toEqual({
      title: 'notifications.templates.complaintNew.title',
      body: 'Water leak',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintStatusChanged',
        params: { status: 'resolved', complaintTitle: 'Water leak' },
      }),
    ).toEqual({
      title: 'notifications.templates.complaintStatusChanged.title',
      body: 'Water leak',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintNewComment',
        params: { complaintTitle: 'Water leak', comment: 'On it' },
      }),
    ).toEqual({
      title: 'notifications.templates.complaintNewComment.title',
      body: 'On it',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'joinRequestNew',
        params: { name: 'Sam' },
      }),
    ).toEqual({
      title: 'notifications.templates.joinRequestNew.title',
      body: 'notifications.templates.joinRequestNew.body',
    });
  });

  it('resolves payment and poll templates', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'duesCreated',
        params: { period: 'Jan 2026', amount: '1500', dueDate: '2026-01-31' },
      }),
    ).toEqual({
      title: 'notifications.templates.duesCreated.title',
      body: 'notifications.templates.duesCreated.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'paymentCaptured',
        params: { amount: '1500' },
      }),
    ).toEqual({
      title: 'notifications.templates.paymentCaptured.title',
      body: 'notifications.templates.paymentCaptured.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'paymentReminder',
      }),
    ).toEqual({
      title: 'notifications.templates.paymentReminder.title',
      body: 'notifications.templates.paymentReminder.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'pollPublished',
        params: { question: 'Renovate lobby?', category: 'Maintenance' },
      }),
    ).toEqual({
      title: 'notifications.templates.pollPublished.title',
      body: 'notifications.templates.pollPublished.body',
    });
  });

  it('covers fallback parameters when params are empty or nullish', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorAtGate',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.visitorAtGate.title',
      body: 'notifications.templates.visitorAtGate.bodyType',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'visitorStatusChanged',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.visitorStatusChanged.titleFallback',
      body: 'notifications.templates.visitorStatusChanged.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintNew',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.complaintNew.title',
      body: '',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintStatusChanged',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.complaintStatusChanged.title',
      body: '',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'complaintNewComment',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.complaintNewComment.title',
      body: '',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'joinRequestNew',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.joinRequestNew.title',
      body: 'notifications.templates.joinRequestNew.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'duesCreated',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.duesCreated.title',
      body: 'notifications.templates.duesCreated.body',
    });

    i18n.language = 'hi';
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'duesCreated',
        params: { periodHi: 'जनवरी' },
      }),
    ).toEqual({
      title: 'notifications.templates.duesCreated.title',
      body: 'notifications.templates.duesCreated.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'duesCreated',
        params: { period: 'Jan' },
      }),
    ).toEqual({
      title: 'notifications.templates.duesCreated.title',
      body: 'notifications.templates.duesCreated.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'duesCreated',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.duesCreated.title',
      body: 'notifications.templates.duesCreated.body',
    });
    i18n.language = 'en';

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'paymentCaptured',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.paymentCaptured.title',
      body: 'notifications.templates.paymentCaptured.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'pollPublished',
        params: {},
      }),
    ).toEqual({
      title: 'notifications.templates.pollPublished.title',
      body: 'notifications.templates.pollPublished.body',
    });

    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'paymentReminder',
        params: undefined,
      }),
    ).toBeDefined();
  });

  it('returns fallback for unknown templates and translation errors', () => {
    expect(
      resolveNotificationDisplay(t, fallback, {
        template: 'unknown' as never,
        params: {},
      }),
    ).toEqual(fallback);

    const throwingT = (() => {
      throw new Error('missing key');
    }) as any;

    expect(
      resolveNotificationDisplay(throwingT, fallback, {
        template: 'paymentReminder',
      }),
    ).toEqual(fallback);
  });
});
