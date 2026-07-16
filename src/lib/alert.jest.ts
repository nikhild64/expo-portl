jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import {
  errorMessage,
  inferDialogTone,
  registerAlertImpl,
  resolveDialogButtons,
  unregisterAlertImpl,
  alert,
  alertError,
  alertSuccess,
  alertWarning,
  alertConfirm,
  alertConfirmDestructive,
  confirmSignOut,
  alertFlatRequired,
} from './alert';

describe('alert helpers', () => {
  afterEach(() => {
    unregisterAlertImpl(() => undefined);
  });

  it('defaults to a single OK button', () => {
    expect(resolveDialogButtons()).toEqual([{ text: 'common.ok' }]);
    expect(resolveDialogButtons([])).toEqual([{ text: 'common.ok' }]);
    expect(resolveDialogButtons([{ text: 'Cancel' }])).toEqual([{ text: 'Cancel' }]);
  });

  it('infers dialog tone from buttons and title', () => {
    expect(inferDialogTone('Delete item?', undefined, [{ style: 'destructive', text: 'Delete' }])).toBe(
      'destructive',
    );
    expect(inferDialogTone('Continue?')).toBe('confirm');
    expect(inferDialogTone('Saved')).toBe('info');
  });

  it('normalizes error messages', () => {
    expect(errorMessage(new Error('Boom'), 'fallback')).toBe('Boom');
    expect(errorMessage('plain', 'fallback')).toBe('fallback');
  });

  it('dispatches through a registered alert implementation', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);

    alert('Title', 'Message');
    expect(impl).toHaveBeenCalledWith('Title', 'Message', undefined, undefined);
  });

  it('unregisters only the matching implementation', () => {
    const impl = jest.fn();
    const other = jest.fn();
    registerAlertImpl(impl);
    unregisterAlertImpl(other);
    alert('Still there');
    expect(impl).toHaveBeenCalled();
  });

  it('unregisters the implementation', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    unregisterAlertImpl(impl);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    alert('Title');
    expect(impl).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[alert] DialogProvider is not mounted');
    warn.mockRestore();
  });

  it('triggers alertError, alertSuccess, alertWarning, alertConfirm with correct parameters', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);

    alertError('Title', new Error('Fail'));
    expect(impl).toHaveBeenLastCalledWith('Title', 'Fail', undefined, { tone: 'error' });

    alertError('Title', 'string error', 'Fallback');
    expect(impl).toHaveBeenLastCalledWith('Title', 'Fallback', undefined, { tone: 'error' });

    alertSuccess('Title', 'Success message');
    expect(impl).toHaveBeenLastCalledWith('Title', 'Success message', undefined, { tone: 'success' });

    alertWarning('Title', 'Warning message');
    expect(impl).toHaveBeenLastCalledWith('Title', 'Warning message', undefined, { tone: 'warning' });

    alertConfirm('Title', 'Confirm message');
    expect(impl).toHaveBeenLastCalledWith('Title', 'Confirm message', undefined, { tone: 'confirm' });
  });

  it('triggers alertConfirmDestructive with default labels', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    const onConfirm = jest.fn();

    alertConfirmDestructive('Delete?', 'Are you sure?', onConfirm);
    expect(impl).toHaveBeenCalledWith(
      'Delete?',
      'Are you sure?',
      [
        { text: 'common.cancel', style: 'cancel' },
        { text: 'common.delete', style: 'destructive', onPress: expect.any(Function) },
      ],
      { tone: 'confirm' },
    );

    const buttons = impl.mock.calls[0]?.[2] as any[];
    buttons[1]?.onPress();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('triggers alertConfirmDestructive with custom labels', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    const onConfirm = jest.fn();

    alertConfirmDestructive('Confirm?', 'Sure?', onConfirm, { cancelLabel: 'No', confirmLabel: 'Yes' });
    expect(impl).toHaveBeenCalledWith(
      'Confirm?',
      'Sure?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: expect.any(Function) },
      ],
      { tone: 'confirm' },
    );
  });

  it('triggers confirmSignOut', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    const t = ((key: string) => key) as any;
    const signOut = jest.fn();

    confirmSignOut(t, signOut);
    expect(impl).toHaveBeenCalledWith(
      'settings.signOutConfirm',
      'settings.signOutMsg',
      [
        { text: 'common.cancel', style: 'cancel' },
        { text: 'common.signOut', style: 'destructive', onPress: expect.any(Function) },
      ],
      { tone: 'confirm' },
    );

    const buttons = impl.mock.calls[0]?.[2] as any[];
    buttons[1]?.onPress();
    expect(signOut).toHaveBeenCalled();
  });

  it('triggers confirmSignOut with custom keys', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    const t = ((key: string) => key) as any;
    const signOut = jest.fn();

    confirmSignOut(t, signOut, { titleKey: 'customTitle', messageKey: 'customMessage' });
    expect(impl).toHaveBeenCalledWith(
      'customTitle',
      'customMessage',
      [
        { text: 'common.cancel', style: 'cancel' },
        { text: 'common.signOut', style: 'destructive', onPress: expect.any(Function) },
      ],
      { tone: 'confirm' },
    );
  });

  it('triggers alertFlatRequired', () => {
    const impl = jest.fn();
    registerAlertImpl(impl);
    const t = ((key: string) => key) as any;

    alertFlatRequired(t, 'msgKey');
    expect(impl).toHaveBeenCalledWith(
      'alert.titles.flatRequired',
      'msgKey',
      undefined,
      { tone: 'warning' },
    );
  });
});
