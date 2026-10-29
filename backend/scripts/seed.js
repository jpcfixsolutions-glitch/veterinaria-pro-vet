import bcrypt from 'bcrypt'
import { db } from '../src/config/db.js'
import { products, users } from '../src/models/index.js'
const now = new Date().toISOString(); const passwordHash = await bcrypt.hash('admin123', 12)
await db.insert(users).values({ id: 'usr-admin-1', firstName: 'Mateo', lastName: 'Fernández', contact: '+54 9 11 5555-0101', username: 'admin', passwordHash, role: 'ADMIN', active: true, createdAt: now, updatedAt: now }).onConflictDoNothing()
await db.insert(products).values([{ id: 'PRD-1842', name: 'Alimento Royal Canin Adult Medium 15 kg', barcode: '7790187334012', supplier: 'Distribuidora Sur', laboratory: 'Royal Canin', cost: 46800, salePrice: 68500, stock: 12, minStock: 5, active: true, createdAt: now, updatedAt: now }, { id: 'PRD-0921', name: 'Pipeta Frontline Plus perros 10–20 kg', barcode: '7798044472082', supplier: 'Vet Pharma', laboratory: 'Boehringer Ingelheim', cost: 12450, salePrice: 18900, stock: 8, minStock: 8, active: true, createdAt: now, updatedAt: now }, { id: 'PRD-2104', name: 'Collar isabelino transparente N° 4', barcode: '7799214504886', supplier: 'Mascotas Mayorista', laboratory: 'Genérico', cost: 5200, salePrice: 8500, stock: 3, minStock: 4, active: true, createdAt: now, updatedAt: now }]).onConflictDoNothing()
console.log('Datos iniciales creados: admin / admin123')
