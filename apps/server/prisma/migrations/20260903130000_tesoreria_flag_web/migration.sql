-- modulo:tesoreria nació como flag solo-Tauri (consignaciones desde el POS), pero el
-- panel de Tesorería vive en la web. El listado de flags del frontend filtra por
-- plataforma, así que un usuario TESORERIA veía "módulo no disponible" en el panel.
UPDATE "feature_flags"
   SET "plataformafeature_flags" = 'all'
 WHERE "codigofeature_flags" = 'modulo:tesoreria';
