INSERT INTO `settings_catalog` (`id`, `type`, `name`, `description`, `active`, `created_at`, `updated_at`)
SELECT 'cfg-payment-cash', 'payment', 'Efectivo', 'Cobro en efectivo', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM `settings_catalog` WHERE `type` = 'payment')
UNION ALL
SELECT 'cfg-payment-transfer', 'payment', 'Virtual', 'Transferencia o billetera virtual', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM `settings_catalog` WHERE `type` = 'payment');
