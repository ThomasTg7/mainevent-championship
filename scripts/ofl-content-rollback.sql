-- Refuse rollback if content was edited after the rebrand; the surrounding transaction rolls back everything.
DO $$
DECLARE change record; current_value jsonb;
BEGIN
  FOR change IN SELECT a.* FROM audit_log a WHERE actor_id = 'maintenance:ofl-content'
    AND NOT EXISTS (SELECT 1 FROM audit_log r WHERE r.actor_id = 'maintenance:ofl-content-rollback' AND r.diff->>'sourceAuditId' = a.id::text)
    ORDER BY created_at DESC, id DESC
  LOOP
    CASE change.entity_type
      WHEN 'event' THEN
        SELECT jsonb_build_object('name', name, 'slug', slug, 'ticketPoints', ticket_points, 'ticketUrl', ticket_url) INTO current_value FROM events WHERE id = change.entity_id::uuid FOR UPDATE;
      WHEN 'post' THEN
        SELECT jsonb_build_object('title', title, 'slug', slug, 'excerpt', excerpt, 'body', body) INTO current_value FROM posts WHERE id = change.entity_id::uuid FOR UPDATE;
      WHEN 'setting' THEN
        SELECT value INTO current_value FROM site_settings WHERE key = change.entity_id FOR UPDATE;
      WHEN 'media' THEN
        SELECT to_jsonb(alt) INTO current_value FROM media WHERE id = change.entity_id::uuid FOR UPDATE;
      WHEN 'fighter' THEN
        SELECT to_jsonb(bio) INTO current_value FROM fighters WHERE id = change.entity_id::uuid FOR UPDATE;
      ELSE RAISE EXCEPTION 'Entidad de migración desconocida: %', change.entity_type;
    END CASE;
    IF current_value IS DISTINCT FROM change.diff->'after' THEN
      RAISE EXCEPTION 'El contenido % % cambió después de la migración; no se sobrescribirá', change.entity_type, change.entity_id;
    END IF;
    CASE change.entity_type
      WHEN 'event' THEN
        UPDATE events SET name = change.diff->'before'->>'name', slug = change.diff->'before'->>'slug',
          ticket_points = change.diff->'before'->>'ticketPoints', ticket_url = change.diff->'before'->>'ticketUrl', updated_at = now() WHERE id = change.entity_id::uuid;
      WHEN 'post' THEN
        UPDATE posts SET title = change.diff->'before'->>'title', slug = change.diff->'before'->>'slug',
          excerpt = change.diff->'before'->>'excerpt', body = change.diff->'before'->'body', updated_at = now() WHERE id = change.entity_id::uuid;
      WHEN 'setting' THEN
        UPDATE site_settings SET value = change.diff->'before', updated_at = now() WHERE key = change.entity_id;
      WHEN 'media' THEN
        UPDATE media SET alt = change.diff->'before' #>> '{}' WHERE id = change.entity_id::uuid;
      WHEN 'fighter' THEN
        UPDATE fighters SET bio = change.diff->'before' #>> '{}', updated_at = now() WHERE id = change.entity_id::uuid;
    END CASE;
    INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, diff)
      VALUES ('maintenance:ofl-content-rollback', 'restore', change.entity_type, change.entity_id, 'Restauró el contenido anterior a la migración OFL',
        jsonb_build_object('sourceAuditId', change.id, 'before', change.diff->'after', 'after', change.diff->'before'));
  END LOOP;
END $$;
