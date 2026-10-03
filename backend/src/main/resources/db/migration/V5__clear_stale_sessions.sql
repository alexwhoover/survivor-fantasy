-- Existing session rows hold a serialized SecurityContext whose principal was a
-- com.example.demo.entity.User. V4 turned that class into a plain player record: it no
-- longer implements UserDetails or Serializable, so deserializing one of those rows
-- fails. Any browser still holding a SESSION cookie from before V4 would hit that on
-- its first request.
--
-- Nothing is lost by clearing them. Players don't sign in at all now, and the one
-- account that does — the site admin — can sign in again. Attributes go first because
-- they're the child rows.

DELETE FROM SPRING_SESSION_ATTRIBUTES;
DELETE FROM SPRING_SESSION;
