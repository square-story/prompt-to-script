import { Router } from 'express'
import multer from 'multer'
import { pipelineController } from '@/controllers/pipeline.controller'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

router.post('/run', upload.single('file'), pipelineController.run)

export default router

