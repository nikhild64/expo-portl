import type { QueryData } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/** Typed select builders — use `QueryData<ReturnType<...>>` for inferred row shapes. */

export function complaintListSelect() {
  return supabase.from('complaints').select('*, flat:flats(number, towers(name))');
}

export type ComplaintWithFlat = QueryData<ReturnType<typeof complaintListSelect>>[number];

export function complaintDetailSelect(id: string) {
  return supabase
    .from('complaints')
    .select(
      '*, raised_by_profile:profiles!complaints_raised_by_fkey(full_name), flat:flats(number, towers(name)), assigned:profiles!complaints_assigned_to_fkey(full_name, phone, avatar_url, role), assigned_service_provider:service_providers!complaints_assigned_service_provider_id_fkey(name, phone, category)',
    )
    .eq('id', id)
    .single();
}

export type ComplaintDetail = QueryData<ReturnType<typeof complaintDetailSelect>>;

export function complaintUpdatesSelect(complaintId: string) {
  return supabase
    .from('complaint_updates')
    .select('*, profile:profiles(full_name)')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });
}

export type ComplaintUpdateWithProfile = QueryData<ReturnType<typeof complaintUpdatesSelect>>[number];

export function visitorDetailSelect(id: string) {
  return supabase.from('visitors').select('*, flats(number, towers(name))').eq('id', id).single();
}

export type VisitorDetail = QueryData<ReturnType<typeof visitorDetailSelect>>;

export function flatSearchSelect() {
  return supabase
    .from('flats')
    .select('id, number, towers!inner(name), flat_residents(is_head, profiles(full_name))');
}

export type FlatSearchRow = QueryData<ReturnType<typeof flatSearchSelect>>[number];

export function residentListSelect() {
  return supabase.from('profiles').select(
    '*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))',
  );
}

export type ResidentWithFlats = QueryData<ReturnType<typeof residentListSelect>>[number];

export function residentListByTowerSelect() {
  return supabase.from('profiles').select(
    '*, flat_residents!inner(flat_id,is_head,is_owner, flats!inner(id,number,tower_id, towers(id,name)))',
  );
}

export type ResidentWithFlatsByTower = QueryData<ReturnType<typeof residentListByTowerSelect>>[number];

export function residentDetailSelect(id: string) {
  return supabase
    .from('profiles')
    .select('*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))')
    .eq('id', id)
    .single();
}

export type ResidentDetail = QueryData<ReturnType<typeof residentDetailSelect>>;

export function adminVisitorHistorySelect() {
  return supabase
    .from('visitors')
    .select('*, flats(number, towers(name)), profiles!visitors_guard_id_fkey(full_name)');
}

export type AdminVisitorHistoryRow = QueryData<ReturnType<typeof adminVisitorHistorySelect>>[number];

export function pendingResidentsSelect() {
  return supabase
    .from('profiles')
    .select('*, flat_residents(flat_id,is_head,is_owner, flats(id,number,tower_id, towers(id,name)))')
    .eq('status', 'pending');
}

export type PendingResidentRow = QueryData<ReturnType<typeof pendingResidentsSelect>>[number];
