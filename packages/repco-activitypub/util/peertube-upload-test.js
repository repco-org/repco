import Repl from 'repl'
import { PeertubeClient } from '../dist/src/util/peertube.js'

const pt = new PeertubeClient("http://host.docker.internal:9000")
await pt.login("root", "peertube")
const channelId = await pt.createChannel("foochannel1")
await pt.uploadVideo(channelId, "testvideo2")

