ALTER TABLE public.services ADD COLUMN internal_notes text NOT NULL DEFAULT '';
ALTER TABLE public.services ADD COLUMN collaborator_notes text NOT NULL DEFAULT '';