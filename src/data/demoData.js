export const demoUsers = [
  { id: 'usr-admin-1', firstName: 'Mateo', lastName: 'Fernández', contact: '+54 9 11 5555-0101', username: 'admin', password: 'admin123', role: 'ADMIN', active: true },
  { id: 'usr-admin-2', firstName: 'Camila', lastName: 'Rossi', contact: 'camila@provet.com.ar', username: 'camila.admin', password: 'admin123', role: 'ADMIN', active: true },
]

export const demoProducts = [
  { id: 'PRD-1842', name: 'Alimento Royal Canin Adult Medium 15 kg', barcode: '7790187334012', supplier: 'Distribuidora Sur', laboratory: 'Royal Canin', cost: 46800, salePrice: 68500, stock: 12, minStock: 5 },
  { id: 'PRD-0921', name: 'Pipeta Frontline Plus perros 10–20 kg', barcode: '7798044472082', supplier: 'Vet Pharma', laboratory: 'Boehringer Ingelheim', cost: 12450, salePrice: 18900, stock: 8, minStock: 8 },
  { id: 'PRD-2104', name: 'Collar isabelino transparente N° 4', barcode: '7799214504886', supplier: 'Mascotas Mayorista', laboratory: 'Genérico', cost: 5200, salePrice: 8500, stock: 3, minStock: 4 },
  { id: 'PRD-0377', name: 'Vacuna Quíntuple Canina', barcode: '7798359330213', supplier: 'Vet Pharma', laboratory: 'Zoetis', cost: 9800, salePrice: 14500, stock: 0, minStock: 6 },
  { id: 'PRD-4108', name: 'Arena sanitaria aglomerante 4 kg', barcode: '7791806077586', supplier: 'Distribuidora Sur', laboratory: 'Fresh Step', cost: 6850, salePrice: 10900, stock: 18, minStock: 6 },
  { id: 'SRV-0018', name: 'Consulta clínica general', barcode: 'SERV-0018', supplier: 'Pro Vet', laboratory: 'Servicios', cost: 0, salePrice: 14500, stock: 999, minStock: 0 },
  { id: 'PRD-3310', name: 'Shampoo hipoalergénico 250 ml', barcode: '7799876543210', supplier: 'Mascotas Mayorista', laboratory: 'Holliday', cost: 4300, salePrice: 6900, stock: 5, minStock: 5 },
]

export const demoCashHistory = [
  {
    id: 'cash-2026-10-28', date: '2026-10-28T00:00:00.000Z', openedAt: '2026-10-28T11:30:00.000Z', closedAt: '2026-10-28T20:12:00.000Z', openedBy: 'Camila Rossi', closedBy: 'Camila Rossi', initialAmount: 60000, cashSales: 94300, virtualSales: 162500, totalSales: 256800, expectedCash: 154300, status: 'Cerrada',
    tickets: [{ id: 'TK-1048', createdAt: '2026-10-28T18:05:00.000Z', paymentMethod: 'Virtual', total: 48600, items: [{ name: 'Alimento Royal Canin Adult Medium 15 kg', quantity: 1, unitPrice: 68500 }] }, { id: 'TK-1049', createdAt: '2026-10-28T19:18:00.000Z', paymentMethod: 'Efectivo', total: 25800, items: [{ name: 'Arena sanitaria aglomerante 4 kg', quantity: 2, unitPrice: 10900 }, { name: 'Shampoo hipoalergénico 250 ml', quantity: 1, unitPrice: 6900 }] }],
  },
]
