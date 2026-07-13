-- Allow residents to read their own vote; show all votes once a poll closes.
drop policy if exists "poll_votes_read_results" on poll_votes;

create policy "poll_votes_read_results"
on poll_votes for select
to authenticated
using (
  exists (
    select 1 from polls p
    where p.id = poll_votes.poll_id
      and p.society_id = (select my_society_id())
      and (
        p.show_results
        or (select my_role()) = 'admin'
        or poll_votes.profile_id = (select auth.uid())
        or p.ends_at < now()
      )
  )
);

-- Poll comment edit for own comments.
create policy "poll_comments_update_own"
on poll_comments for update
to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

-- One reaction per user per notice.
with ranked as (
  select
    notice_id,
    profile_id,
    emoji,
    row_number() over (partition by notice_id, profile_id order by emoji) as rn
  from notice_reactions
)
delete from notice_reactions nr
using ranked r
where nr.notice_id = r.notice_id
  and nr.profile_id = r.profile_id
  and nr.emoji = r.emoji
  and r.rn > 1;

alter table notice_reactions drop constraint notice_reactions_pkey;
alter table notice_reactions add primary key (notice_id, profile_id);
