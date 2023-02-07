import express from 'express'
import apiRoutes from './routes/api.js'
import { enableFrontend, router as frontendRoutes } from './routes/frontend.js'

// Enable frontend. This could be put behind a environement variable.
enableFrontend()

const router = express.Router()
router.use('/api', apiRoutes)
router.use('/', frontendRoutes)

export default router
