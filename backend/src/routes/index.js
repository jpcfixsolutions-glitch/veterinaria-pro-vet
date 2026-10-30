import { Router } from 'express'
import { authController, cashController, productController, saleController, settingsController, statisticsController, userController } from '../controllers/index.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/http.js'
const route = (handler) => asyncHandler(handler)
export const apiRouter = Router()
apiRouter.post('/auth/login', route(authController.login))
apiRouter.use(authenticate)
apiRouter.get('/products', route(productController.list)); apiRouter.post('/products', route(productController.save)); apiRouter.put('/products/:id', route(productController.save))
apiRouter.get('/users', route(userController.list)); apiRouter.post('/users', route(userController.save)); apiRouter.put('/users/:id', route(userController.save)); apiRouter.patch('/users/:id/status', route(userController.toggle))
apiRouter.get('/cash/current', route(cashController.current)); apiRouter.get('/cash/history', route(cashController.history)); apiRouter.post('/cash/open', route(cashController.open)); apiRouter.post('/cash/close', route(cashController.close))
apiRouter.post('/sales', route(saleController.create))
apiRouter.get('/statistics', route(statisticsController.get)); apiRouter.post('/expenses', route(statisticsController.createExpense))
apiRouter.get('/settings/:type', route(settingsController.list)); apiRouter.post('/settings/:type', route(settingsController.save)); apiRouter.put('/settings/:type/:id', route(settingsController.save)); apiRouter.get('/fixed-expenses', route(settingsController.fixedList)); apiRouter.post('/fixed-expenses', route(settingsController.fixedSave)); apiRouter.put('/fixed-expenses/:id', route(settingsController.fixedSave))
