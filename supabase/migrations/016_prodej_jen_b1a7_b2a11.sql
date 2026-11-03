-- 016 — K prodeji jen B1 A7 (chata-1-suite-7) a B2 A11 (chata-2-suite-11), 3. 11. 2026
--
-- Potvrzeno uživatelem: /suites má ukazovat jen tyto dva apartmány. B1 A2 a B1 A9 se z prodeje
-- stahují (prodejní stránka 404, homepage počítá z DB). Pronájem B1 A2 (for_rent) beze změny.

UPDATE apartments
SET for_sale = false, updated_at = now()
WHERE slug IN ('chata-1-suite-2', 'chata-1-suite-9');
