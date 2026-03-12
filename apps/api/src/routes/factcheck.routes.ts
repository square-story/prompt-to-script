import { Router } from 'express'
import { factCheckController } from '@/controllers/factcheck.controller'

const router = Router()

router.post('/run', factCheckController.run)

export default router
