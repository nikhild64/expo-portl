alter table payments
  add column if not exists reference_ids uuid[];
