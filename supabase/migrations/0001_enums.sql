create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type user_role as enum ('resident', 'guard', 'admin');
create type user_status as enum ('pending', 'active', 'blocked');
create type visitor_type as enum ('guest', 'delivery', 'cab', 'service');
create type visitor_status as enum ('pending', 'approved', 'rejected', 'expired', 'entered', 'exited');
create type notice_category as enum ('general', 'event', 'maintenance', 'emergency', 'financial');
create type poll_category as enum ('general', 'amenities', 'rules', 'events', 'finance');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type complaint_priority as enum ('low', 'medium', 'high', 'urgent');
create type complaint_status as enum ('new', 'assigned', 'in_progress', 'resolved', 'closed');
create type dues_status as enum ('due', 'paid', 'overdue', 'partial');
create type payment_status as enum ('created', 'captured', 'failed', 'refunded');
create type payment_purpose as enum ('dues', 'amenity', 'deposit', 'other');
create type complaint_update_kind as enum ('comment', 'status_change');
