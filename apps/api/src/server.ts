import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from '@/config/env'
import router from '@/routes/index'
import { errorHandler } from '@/middlewares/errorHandler'
import { logger } from '@/utils/logger'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/v1', router)
app.use(errorHandler)

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Creeto API running')
})
