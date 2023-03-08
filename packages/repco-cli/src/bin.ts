import Dotenv from 'dotenv'
import { runAndPrintErrors } from './parse.js'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

runAndPrintErrors()
