-- Seed data for Delhi Technological University
INSERT INTO public.colleges (name, short_code, domain, primary_color)
VALUES (
    'Delhi Technological University',
    'DTU',
    'dtu.ac.in',
    '#aa3bff'
) ON CONFLICT (short_code) DO NOTHING;
