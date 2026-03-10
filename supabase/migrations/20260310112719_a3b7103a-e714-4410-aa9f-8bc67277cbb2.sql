
ALTER TABLE public.clients ADD COLUMN last_name text NOT NULL DEFAULT '';

-- Migrate existing data: first token = name, rest = last_name
UPDATE public.clients
SET
  last_name = CASE
    WHEN position(' ' in trim(name)) > 0
    THEN substring(trim(name) from position(' ' in trim(name)) + 1)
    ELSE ''
  END,
  name = CASE
    WHEN position(' ' in trim(name)) > 0
    THEN substring(trim(name) from 1 for position(' ' in trim(name)) - 1)
    ELSE trim(name)
  END
WHERE name != '';
