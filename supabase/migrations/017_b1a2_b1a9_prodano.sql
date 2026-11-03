-- 017 — B1 A2 (chata-1-suite-2) a B1 A9 (chata-1-suite-9) jsou prodané, 3. 11. 2026
-- Potvrzeno uživatelem. Z prodeje stažené už migrací 016, tady jen stav.

UPDATE apartments
SET status = 'sold', updated_at = now()
WHERE slug IN ('chata-1-suite-2', 'chata-1-suite-9');
