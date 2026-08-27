-- Split broad ALL management policies into write-only policies so public/staff
-- SELECT policies do not overlap unnecessarily.

drop policy if exists "staff write announcements" on public.announcements;
create policy "staff insert announcements" on public.announcements for insert with check ((select public.is_staff()));
create policy "staff update announcements" on public.announcements for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete announcements" on public.announcements for delete using ((select public.is_staff()));

drop policy if exists "admin settings write" on public.app_settings;
create policy "admin insert settings" on public.app_settings for insert with check ((select public.has_role('admin'::public.app_role)));
create policy "admin update settings" on public.app_settings for update using ((select public.has_role('admin'::public.app_role))) with check ((select public.has_role('admin'::public.app_role)));
create policy "admin delete settings" on public.app_settings for delete using ((select public.has_role('admin'::public.app_role)));

drop policy if exists "staff write authors" on public.authors;
create policy "staff insert authors" on public.authors for insert with check ((select public.is_staff()));
create policy "staff update authors" on public.authors for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete authors" on public.authors for delete using ((select public.is_staff()));

drop policy if exists "staff write lessons" on public.bible_plan_lessons;
create policy "staff insert lessons" on public.bible_plan_lessons for insert with check ((select public.is_staff()));
create policy "staff update lessons" on public.bible_plan_lessons for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete lessons" on public.bible_plan_lessons for delete using ((select public.is_staff()));

drop policy if exists "staff write plans" on public.bible_plans;
create policy "staff insert plans" on public.bible_plans for insert with check ((select public.is_staff()));
create policy "staff update plans" on public.bible_plans for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete plans" on public.bible_plans for delete using ((select public.is_staff()));

drop policy if exists "staff write categories" on public.devotional_categories;
create policy "staff insert categories" on public.devotional_categories for insert with check ((select public.is_staff()));
create policy "staff update categories" on public.devotional_categories for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete categories" on public.devotional_categories for delete using ((select public.is_staff()));

drop policy if exists "staff write devotionals" on public.devotionals;
create policy "staff insert devotionals" on public.devotionals for insert with check ((select public.is_staff()));
create policy "staff update devotionals" on public.devotionals for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete devotionals" on public.devotionals for delete using ((select public.is_staff()));

drop policy if exists "admin donation categories" on public.donation_categories;
create policy "admin insert donation categories" on public.donation_categories for insert with check ((select public.has_role('admin'::public.app_role)));
create policy "admin update donation categories" on public.donation_categories for update using ((select public.has_role('admin'::public.app_role))) with check ((select public.has_role('admin'::public.app_role)));
create policy "admin delete donation categories" on public.donation_categories for delete using ((select public.has_role('admin'::public.app_role)));

drop policy if exists "staff write events" on public.events;
create policy "staff insert events" on public.events for insert with check ((select public.is_staff()));
create policy "staff update events" on public.events for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete events" on public.events for delete using ((select public.is_staff()));

drop policy if exists "admin ministries" on public.ministries;
create policy "admin insert ministries" on public.ministries for insert with check ((select public.has_role('admin'::public.app_role)));
create policy "admin update ministries" on public.ministries for update using ((select public.has_role('admin'::public.app_role))) with check ((select public.has_role('admin'::public.app_role)));
create policy "admin delete ministries" on public.ministries for delete using ((select public.has_role('admin'::public.app_role)));

drop policy if exists "staff write sermons" on public.sermons;
create policy "staff insert sermons" on public.sermons for insert with check ((select public.is_staff()));
create policy "staff update sermons" on public.sermons for update using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete sermons" on public.sermons for delete using ((select public.is_staff()));
