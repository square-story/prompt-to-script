import { Router } from 'express'

const router = Router()

router.post('/', async (req, res) => {
    const { name } = req.body
    res.status(201).json({message: `${name} project created successfully`})
})

export default router