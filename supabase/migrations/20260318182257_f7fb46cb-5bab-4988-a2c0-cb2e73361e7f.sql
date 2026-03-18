
ALTER TABLE public.time_records
  ADD COLUMN start_time time WITHOUT TIME ZONE,
  ADD COLUMN end_time time WITHOUT TIME ZONE;
