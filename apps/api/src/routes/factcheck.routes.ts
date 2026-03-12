import { Router } from 'express'
import multer from 'multer'
import { factCheckController } from '@/controllers/factcheck.controller'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

router.post('/run', upload.single('file'), factCheckController.run)

export default router
