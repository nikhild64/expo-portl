create index if not exists visitors_flat_status_idx on visitors(flat_id, status);
create index if not exists visitors_society_requested_idx on visitors(society_id, requested_at desc);
create index if not exists pre_approvals_code_idx on pre_approvals(upper(code));
create index if not exists notifications_profile_read_idx on notifications(profile_id, read_at);
create index if not exists payments_order_idx on payments(order_id);
create index if not exists complaints_society_status_idx on complaints(society_id, status);

create extension if not exists btree_gist with schema extensions;

create index if not exists amenity_bookings_amenity_range_idx
  on amenity_bookings using gist (amenity_id, tstzrange(start_at, end_at));

alter type payment_status add value if not exists 'flagged';
