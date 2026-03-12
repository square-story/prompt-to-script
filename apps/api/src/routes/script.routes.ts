import { Router } from 'express'
import { scriptController } from '@/controllers/script.controller'

const router = Router()

router.post('/hooks',           scriptController.generateHooks)
router.post('/generate',        scriptController.generateScript)
router.patch('/:scriptId/approve', scriptController.approveScript)

export default router
