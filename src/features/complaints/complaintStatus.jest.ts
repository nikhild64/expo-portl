import {
  adminComplaintPrimaryAction,
  complaintStatusLabel,
  complaintStatusTone,
} from './complaintStatus';

const t = (key: string) => key;

describe('complaintStatus', () => {
  it('maps complaint statuses to labels', () => {
    expect(complaintStatusLabel('new', t)).toBe('resident.complaints.timeline.new');
    expect(complaintStatusLabel('resolved', t)).toBe('resident.complaints.timeline.resolved');
    expect(complaintStatusLabel('closed', t)).toBe('common.closed');
  });

  it('returns admin primary actions for actionable statuses', () => {
    expect(adminComplaintPrimaryAction('assigned', t)).toMatchObject({
      status: 'in_progress',
      icon: 'arrow_forward',
    });
    expect(adminComplaintPrimaryAction('resolved', t)).toMatchObject({ status: 'closed' });
    expect(adminComplaintPrimaryAction('new', t)).toBeNull();
  });

  it('maps complaint statuses to pill tones', () => {
    expect(complaintStatusTone('new')).toBe('info');
    expect(complaintStatusTone('in_progress')).toBe('warning');
    expect(complaintStatusTone('closed')).toBe('success');
  });
});
