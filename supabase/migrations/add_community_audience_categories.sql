-- Adds audience/grade-band categories alongside the existing topic-based
-- ones (ask, classroom, curriculum, tech, wins) from add_community_forum.sql
-- — teachers often want to find people at the same grade band, not just the
-- same topic. Seed threads are attributed to the real "Sparkurio" official
-- account (profiles.is_official = true), not invented educator personas —
-- deliberately, to avoid the same fabricated-identity problem found and
-- removed from the homepage's "Featured educators" / "Community activity"
-- sections.
INSERT INTO community_categories (slug, name, description, icon, sort_order) VALUES
  ('early-elementary',      'Early Elementary (K–2)',                     'Routines, reading readiness, and the day-to-day of the earliest grades.',        'heart',       5),
  ('upper-elementary',      'Upper Elementary (3–5)',                     'Group work, reworked lessons, and what actually lands with 3rd–5th graders.',   'flag',        6),
  ('middle-school',         'Middle School (6–8)',                        'Engagement, honesty, and everything else that comes with 6th–8th grade.',       'brain',       7),
  ('high-school',           'High School (9–12)',                         'AI, grading, and the bigger questions of teaching teenagers.',                   'cap',         8),
  ('homeschool',            'Homeschool',                                 'Curriculum choices, myths, and the realities of teaching your own kids.',       'homeschool',  9),
  ('instructional-coaches', 'Instructional Coaches / Curriculum Leaders', 'Coaching conversations, best practices, and leading change without the pushback.', 'coaches', 10)
ON CONFLICT (slug) DO NOTHING;
