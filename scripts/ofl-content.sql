-- Run inside a transaction. IDs, relationships, media files and real ticket URLs are preserved.
CREATE OR REPLACE FUNCTION pg_temp.ofl_text(value text) RETURNS text LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT regexp_replace(value, '\mGuerra[[:space:]]+Campal\M', 'OFL', 'gi');
$$;

-- statement-breakpoint
WITH changed AS (
  SELECT id, jsonb_build_object('name', name, 'slug', slug, 'ticketPoints', ticket_points, 'ticketUrl', ticket_url) AS before
  FROM events WHERE name ~* 'Guerra[[:space:]]+Campal' OR slug LIKE '%guerra-campal%' OR ticket_points ~* 'Guerra[[:space:]]+Campal'
), updated AS (
  UPDATE events e SET name = pg_temp.ofl_text(name), slug = replace(slug, 'guerra-campal', 'ofl'),
    ticket_points = pg_temp.ofl_text(ticket_points),
    ticket_url = CASE WHEN ticket_url LIKE 'https://www.example.com/%' THEN replace(ticket_url, 'guerra-campal', 'ofl') ELSE ticket_url END,
    updated_at = now()
  FROM changed c WHERE e.id = c.id
  RETURNING e.id, c.before, jsonb_build_object('name', e.name, 'slug', e.slug, 'ticketPoints', e.ticket_points, 'ticketUrl', e.ticket_url) AS after
)
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
SELECT 'maintenance:ofl-content', 'update', 'event', id::text, 'Actualizó la identidad del contenido a OFL', jsonb_build_object('before', before, 'after', after) FROM updated;

-- statement-breakpoint
WITH changed AS (
  SELECT id, jsonb_build_object('title', title, 'slug', slug, 'excerpt', excerpt, 'body', body) AS before
  FROM posts WHERE title ~* 'Guerra[[:space:]]+Campal' OR excerpt ~* 'Guerra[[:space:]]+Campal' OR body::text ~* 'Guerra[[:space:]]+Campal|/eventos/guerra-campal-|/noticias/[^" ]*guerra-campal' OR slug LIKE '%guerra-campal%'
), updated AS (
  UPDATE posts p SET title = pg_temp.ofl_text(title), slug = replace(slug, 'guerra-campal', 'ofl'), excerpt = pg_temp.ofl_text(excerpt),
    body = regexp_replace(pg_temp.ofl_text(body::text), '(/(?:eventos|noticias)/[^" ]*)guerra-campal', '\1ofl', 'g')::jsonb,
    updated_at = now()
  FROM changed c WHERE p.id = c.id
  RETURNING p.id, c.before, jsonb_build_object('title', p.title, 'slug', p.slug, 'excerpt', p.excerpt, 'body', p.body) AS after
)
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
SELECT 'maintenance:ofl-content', 'update', 'post', id::text, 'Actualizó la identidad del contenido a OFL', jsonb_build_object('before', before, 'after', after) FROM updated;

-- statement-breakpoint
WITH changed AS (
  SELECT key, value AS before FROM site_settings WHERE value::text ~* 'Guerra[[:space:]]+Campal'
), updated AS (
  UPDATE site_settings s SET value = pg_temp.ofl_text(value::text)::jsonb, updated_at = now()
  FROM changed c WHERE s.key = c.key RETURNING s.key, c.before, s.value AS after
)
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
SELECT 'maintenance:ofl-content', 'update', 'setting', key, 'Actualizó la identidad del contenido a OFL', jsonb_build_object('before', before, 'after', after) FROM updated;

-- statement-breakpoint
WITH changed AS (
  SELECT id, alt AS before FROM media WHERE alt ~* 'Guerra[[:space:]]+Campal'
), updated AS (
  UPDATE media m SET alt = pg_temp.ofl_text(alt) FROM changed c WHERE m.id = c.id RETURNING m.id, c.before, m.alt AS after
)
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
SELECT 'maintenance:ofl-content', 'update', 'media', id::text, 'Actualizó la identidad del contenido a OFL', jsonb_build_object('before', before, 'after', after) FROM updated;

-- statement-breakpoint
WITH changed AS (
  SELECT id, bio AS before FROM fighters WHERE bio ~* 'Guerra[[:space:]]+Campal'
), updated AS (
  UPDATE fighters f SET bio = pg_temp.ofl_text(bio), updated_at = now() FROM changed c WHERE f.id = c.id RETURNING f.id, c.before, f.bio AS after
)
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
SELECT 'maintenance:ofl-content', 'update', 'fighter', id::text, 'Actualizó la identidad del contenido a OFL', jsonb_build_object('before', before, 'after', after) FROM updated;
