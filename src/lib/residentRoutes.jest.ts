import {
  residentApprovalHref,
  residentHref,
  residentNotificationHref,
  residentPreApprovalQrHref,
  residentTabGroup,
} from './residentRoutes';

describe('residentRoutes', () => {
  it('detects the active resident tab group', () => {
    expect(residentTabGroup(['(resident)', '(community)', 'notices'])).toBe('(community)');
    expect(residentTabGroup(['(resident)', 'index'])).toBe('(menu)');
  });

  it('routes approval detail through the approvals stack when already there', () => {
    const segments = ['(resident)', '(approvals)'];
    expect(residentApprovalHref('v-1', segments)).toEqual({
      pathname: '/(resident)/(approvals)/[id]',
      params: { id: 'v-1' },
    });
  });

  it('routes approval detail through home when not on approvals tab', () => {
    expect(residentApprovalHref('v-1', ['(resident)', '(home)'])).toEqual({
      pathname: '/(resident)/(home)/approvals/[id]',
      params: { id: 'v-1' },
    });
  });

  it('routes pre-approval QR through the active stack', () => {
    expect(residentPreApprovalQrHref('pa-1', ['(resident)', '(home)'])).toEqual({
      pathname: '/(resident)/(home)/preapprove/[id]/qr',
      params: { id: 'pa-1' },
    });
    expect(residentPreApprovalQrHref('pa-1', ['(resident)', '(approvals)'])).toEqual({
      pathname: '/(resident)/(approvals)/preapprove/[id]/qr',
      params: { id: 'pa-1' },
    });
  });

  it('rewrites notification deep links for cold start and active tabs', () => {
    expect(residentNotificationHref('/(resident)/(approvals)/v-1', [])).toEqual({
      pathname: '/(resident)/(home)/approvals/[id]',
      params: { id: 'v-1' },
    });

    expect(residentNotificationHref('/(resident)/(menu)/complaints/c-1', ['(resident)', '(home)'])).toBe(
      '/(resident)/(home)/complaints/c-1',
    );

    expect(residentNotificationHref('/(resident)/(community)/notices/n-1', ['(resident)', '(home)'])).toEqual({
      pathname: '/(resident)/(home)/notices/[id]',
      params: { id: 'n-1' },
    });

    expect(residentNotificationHref('/(resident)/(community)/notices/n-1', ['(resident)', '(community)'])).toEqual({
      pathname: '/(resident)/(community)/notices/[id]',
      params: { id: 'n-1' },
    });

    expect(residentNotificationHref('/(resident)/(payments)', ['(resident)', '(menu)'])).toBe(
      '/(resident)/(menu)/payments',
    );
  });

  it('builds hrefs under the active tab group', () => {
    expect(residentHref(['(resident)', '(payments)'], 'dues')).toBe('/(resident)/(payments)/dues');
  });
});
