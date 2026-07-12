grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;

alter table societies enable row level security;
alter table towers enable row level security;
alter table flats enable row level security;
alter table profiles enable row level security;
alter table flat_residents enable row level security;
alter table family_members enable row level security;
alter table vehicles enable row level security;
alter table pre_approvals enable row level security;
alter table visitors enable row level security;
alter table notices enable row level security;
alter table notice_reactions enable row level security;
alter table notice_reads enable row level security;
alter table polls enable row level security;
alter table poll_votes enable row level security;
alter table poll_comments enable row level security;
alter table amenities enable row level security;
alter table amenity_bookings enable row level security;
alter table complaints enable row level security;
alter table complaint_updates enable row level security;
alter table staff enable row level security;
alter table service_providers enable row level security;
alter table dues enable row level security;
alter table payments enable row level security;
alter table push_tokens enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

alter table societies force row level security;
alter table towers force row level security;
alter table flats force row level security;
alter table profiles force row level security;
alter table flat_residents force row level security;
alter table family_members force row level security;
alter table vehicles force row level security;
alter table pre_approvals force row level security;
alter table visitors force row level security;
alter table notices force row level security;
alter table notice_reactions force row level security;
alter table notice_reads force row level security;
alter table polls force row level security;
alter table poll_votes force row level security;
alter table poll_comments force row level security;
alter table amenities force row level security;
alter table amenity_bookings force row level security;
alter table complaints force row level security;
alter table complaint_updates force row level security;
alter table staff force row level security;
alter table service_providers force row level security;
alter table dues force row level security;
alter table payments force row level security;
alter table push_tokens force row level security;
alter table notifications force row level security;
alter table audit_log force row level security;
