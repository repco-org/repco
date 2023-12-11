import Repl from 'repl'
import { PeertubeClient } from '../dist/src/util/peertube.js'

const pt = new PeertubeClient()
await pt.login()
console.log('Welcome to the PeerTube repl!')
console.log('Use fetch(path, init) to perform API requests')
const repl = Repl.start()
repl.setupHistory('.peertube-repl-history', () => {})
repl.context['pt'] = pt
repl.context['fetch'] = pt.fetch.bind(pt)
