
-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('operator', 'collaborator')),
  participant_id TEXT, -- references operator or collaborator id
  photo TEXT,
  color TEXT,
  online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('me', 'them')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (no auth yet - public app)
CREATE POLICY "Allow all access to conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed conversations
INSERT INTO public.conversations (id, name, type, participant_id, photo, color, online) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Juan Morales', 'operator', 'op-01', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', '210 80% 52%', true),
  ('00000000-0000-0000-0000-000000000002', 'Pablo Serrano', 'operator', 'op-02', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', '152 60% 42%', true),
  ('00000000-0000-0000-0000-000000000003', 'Miguel Ángel Rivas', 'operator', 'op-03', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', '25 95% 53%', false),
  ('00000000-0000-0000-0000-000000000004', 'Fincas Reunidas SL', 'collaborator', 'col-01', NULL, NULL, true),
  ('00000000-0000-0000-0000-000000000005', 'InmoGest BCN', 'collaborator', 'col-02', NULL, NULL, false),
  ('00000000-0000-0000-0000-000000000006', 'Correduría Andaluza', 'collaborator', 'col-03', NULL, NULL, false);

-- Seed messages
INSERT INTO public.chat_messages (conversation_id, text, sender, read, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Buenos días Juan, ¿puedes confirmar la visita al SRV-001 de hoy?', 'me', true, '2026-02-25T08:00:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'Buenos días! Sí, confirmo. Tengo el material preparado.', 'them', true, '2026-02-25T08:15:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'Perfecto. El cliente espera entre las 10 y las 11.', 'me', true, '2026-02-25T08:20:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'Entendido, estaré allí a las 10:00', 'them', true, '2026-02-25T08:25:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'Ya estoy en camino al SRV-001', 'them', false, '2026-02-25T09:30:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'He llegado al domicilio, empiezo el diagnóstico', 'them', false, '2026-02-25T10:05:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Pablo, tienes dos servicios agendados hoy: SRV-004 y SRV-007', 'me', true, '2026-02-25T07:30:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Sí, empiezo con el SRV-004 que es urgente', 'them', true, '2026-02-25T07:45:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Necesito una llave de paso de 3/4', 'them', false, '2026-02-25T08:45:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'Miguel Ángel, ¿cómo va el cuadro eléctrico de SRV-003?', 'me', true, '2026-02-22T11:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'Todo bien, casi terminado. Falta la prueba de diferenciales.', 'them', true, '2026-02-22T11:30:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'SRV-003 finalizado, subo las fotos ahora', 'them', true, '2026-02-22T13:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'Buenas tardes, tenemos un nuevo servicio para la Sra. Jiménez (SRV-007)', 'them', true, '2026-02-22T16:30:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'Recibido. Contactaremos con la clienta para agendar.', 'me', true, '2026-02-22T17:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', '¿Cuándo se puede agendar la visita del SRV-007?', 'them', false, '2026-02-24T16:00:00Z'),
  ('00000000-0000-0000-0000-000000000005', 'SRV-005 ha sido liquidado correctamente.', 'me', true, '2026-02-23T09:30:00Z'),
  ('00000000-0000-0000-0000-000000000005', 'Perfecto, gracias por la confirmación', 'them', true, '2026-02-23T10:00:00Z'),
  ('00000000-0000-0000-0000-000000000006', 'El SRV-003 se ha completado con NPS 9.', 'me', true, '2026-02-22T14:30:00Z'),
  ('00000000-0000-0000-0000-000000000006', 'El cliente está muy contento con el trabajo', 'them', true, '2026-02-22T15:00:00Z');
