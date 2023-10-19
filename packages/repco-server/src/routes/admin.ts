import express from 'express'
import { ServerError } from '../error.js'

export const router = express.Router()

const ADMIN_TOKEN = process.env.REPCO_ADMIN_TOKEN

// check auth
router.use((req, res, next) => {
    if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 16) {
        res.locals.log.warn('ADMIN_TOKEN is not set or too short (min 16 characters needed). Admin access disabled.')
        return next(new ServerError(403, 'Unauthorized'))
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ServerError(403, 'Unauthorized'))
    }

    const token = authHeader.substring(7)
    if (token != ADMIN_TOKEN) {
        return next(new ServerError(403, 'Unauthorized'))
    }

    next()
})

router.get('/test', async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    res.send({ ok: true })
})

router.post('/test', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})


// create repo
router.post('/repo', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})
// list repos
router.get('/repo', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})


// create datasource
router.post('/repo/:repodid/ds', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})

// modify datasource
router.put('/repo/:repodid/ds/:dsuid', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})
// get datasource
router.get('/repo/:repodid/ds/:dsuid', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})
// list datasources
router.get('/repo/:repodid/ds', async (req, res) => {
    const body = req.body
    console.log('received body', body)
    res.send({ ok: true })
})



