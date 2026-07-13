alter table complaints
  add column assigned_service_provider_id uuid references service_providers(id) on delete set null,
  add constraint complaints_single_assignee check (
    assigned_to is null or assigned_service_provider_id is null
  );

create index idx_complaints_service_provider
on complaints(assigned_service_provider_id, status)
where assigned_service_provider_id is not null;
