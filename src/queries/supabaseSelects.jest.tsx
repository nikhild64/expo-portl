import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  adminVisitorHistorySelect,
  complaintDetailSelect,
  complaintListSelect,
  complaintUpdatesSelect,
  flatSearchSelect,
  pendingResidentsSelect,
  residentDetailSelect,
  residentListByTowerSelect,
  residentListSelect,
  visitorDetailSelect,
} from './supabaseSelects';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

function createSmokeChain() {
  const chain: {
    eq: jest.Mock;
    order: jest.Mock;
    select: jest.Mock;
    single: jest.Mock;
  } = {
    eq: jest.fn(),
    order: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  return chain;
}

describe('supabaseSelects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(createSmokeChain());
  });

  it('complaintListSelect queries complaints', () => {
    complaintListSelect();
    expect(mockFrom).toHaveBeenCalledWith('complaints');
  });

  it('complaintDetailSelect queries complaints by id', () => {
    const chain = createSmokeChain();
    mockFrom.mockReturnValue(chain);
    complaintDetailSelect('complaint-1');
    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(chain.eq).toHaveBeenCalledWith('id', 'complaint-1');
    expect(chain.single).toHaveBeenCalled();
  });

  it('complaintUpdatesSelect queries complaint updates', () => {
    const chain = createSmokeChain();
    mockFrom.mockReturnValue(chain);
    complaintUpdatesSelect('complaint-1');
    expect(mockFrom).toHaveBeenCalledWith('complaint_updates');
    expect(chain.eq).toHaveBeenCalledWith('complaint_id', 'complaint-1');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('visitorDetailSelect queries visitors by id', () => {
    const chain = createSmokeChain();
    mockFrom.mockReturnValue(chain);
    visitorDetailSelect('visitor-1');
    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('id', 'visitor-1');
    expect(chain.single).toHaveBeenCalled();
  });

  it('flatSearchSelect queries flats', () => {
    flatSearchSelect();
    expect(mockFrom).toHaveBeenCalledWith('flats');
  });

  it('residentListSelect queries profiles', () => {
    residentListSelect();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('residentListByTowerSelect queries profiles with inner joins', () => {
    residentListByTowerSelect();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('residentDetailSelect queries profiles by id', () => {
    const chain = createSmokeChain();
    mockFrom.mockReturnValue(chain);
    residentDetailSelect('profile-1');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('id', 'profile-1');
    expect(chain.single).toHaveBeenCalled();
  });

  it('adminVisitorHistorySelect queries visitors', () => {
    adminVisitorHistorySelect();
    expect(mockFrom).toHaveBeenCalledWith('visitors');
  });

  it('pendingResidentsSelect queries pending profiles', () => {
    const chain = createSmokeChain();
    mockFrom.mockReturnValue(chain);
    pendingResidentsSelect();
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
  });
});
