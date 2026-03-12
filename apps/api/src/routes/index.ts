import { Router } from 'express'
import factCheckRoutes from '@/routes/factcheck.routes'
import scriptRoutes    from '@/routes/script.routes'
import projectRoutes   from '@/routes/project.routes'
import pipelineRoutes  from '@/routes/pipeline.routes'

const router = Router()

router.use('/factcheck', factCheckRoutes)
router.use('/scripts',   scriptRoutes)
router.use('/projects',projectRoutes)
router.use('/pipeline', pipelineRoutes)

export default router
