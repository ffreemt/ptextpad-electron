const zmq = require("zeromq")

const zipLongest = (...args) => Array(Math.max(...args.map(a => a.length))).fill('').map((_, i) => args.map(a => a[i] === undefined ? '' : a[i]))

// const debug = require('debug')('debug')
const logger = require('tracer').colorConsole({
  // format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info', // set TRACER_DEBUG=debug
})

const file2lines = require('./src/file2lines')
const genRowdata = require('./src/genRowdata')

const file1 = './data/test-en.txt'
const file2 = './data/test-zh.txt'

const lines1 = file2lines(file1)
const lines2 = file2lines(file2)

// debug('file1: %O', lines1.slice(0, 3))
// debug('file2: %O', lines2.slice(0, 3))
logger.debug('file1: %j', lines1.slice(0, 3))
logger.debug('file2: %j', lines2.slice(0, 3))

const port = 5555

async function run() {
  const sock = new zmq.Request

  // sock.connect("tcp://127.0.0.1:3000")
  // console.log("Producer bound to port 3000")
  sock.connect(`tcp://127.0.0.1:${port}`)
  
  // console.log("sock (new zmq.Request) bound to port ", port)
  logger.debug("sock (new zmq.Request) bound to port %s", port)

  let msg = "4"
  msg = 'stop'
  msg = [
    ["ab", 4],
    ["abc", 14],
  ]
  msg = [lines1, lines2]
  await sock.send(JSON.stringify(msg))
  const [result] = await sock.receive()

  // console.log("%s", result)
  // debug("typeof: %s, %O", typeof JSON.parse(result), JSON.parse(result))
  
  // logger.debug("typeof: %s, %O", typeof JSON.parse(result), JSON.parse(result))
  
  const r = JSON.parse(result)
  
  // debug(r[0].slice(0, 4) , r[1].slice(0, 4))
  
  // logger.debug('\n%s,\n%j', r[0].slice(0, 14) , r[1].slice(0, 14))
  // logger.debug('%j', r.slice(0, 14))
  // const headers = ['text1', 'text2', 'metric']
  
  // const ali = r.map(row => zipLongest(headers, row)).map(el => Object.fromEntries(new Map(el)))
  const ali = genRowdata({ col1: r, isRow: true })
  
  logger.debug('\n\nali: \n\t%j', ali.slice(0, 7))
  
}

run()
