-- Nettoyage des catégories en double
-- Garder seulement les catégories uniques les plus récentes

-- Supprimer les anciens doublons (IDs plus petits)
DELETE FROM categories WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY id DESC) as rn
    FROM categories
  ) t WHERE rn > 1
);

-- Vérifier les catégories restantes
SELECT * FROM categories ORDER BY name;