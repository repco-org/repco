import express from 'express'
import apiRoutes from './routes/api.js'
import frontendRoutes from './routes/frontend.js'

const router = express.Router()
router.use('/api', apiRoutes)
router.use('/', frontendRoutes)

export default router
