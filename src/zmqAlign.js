/* zmqAlign
  input lines1, lines2: array
  output: Rowdata [{text1: , text2: , metri: ,}...]
 */
// refer to zmq-client.js
const zmq = require('zeromq')
const genRowdata = require('./genRowdata')

const logger = require('tracer').colorConsole({
  // format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // set TRACER_DEBUG=debug
})

// const port = 5555
const port = 7777

const zmqAlign = async (lines1, lines2) => {
  let res
  try {
    logger.debug('lines1: %j', lines1.slice(0, 3))
    logger.debug('lines2: %j', lines2.slice(0, 3))
  } catch (e) {
    logger.error(e)
    const text1 = e.name
    const text2 = e.message
    res = [{ text1, text2 }] 
    return res
  }
  const sock = new zmq.Request()
  sock.connect(`tcp://127.0.0.1:${port}`)
  logger.debug('sock (new zmq.Request) bound to port %s', port)

  await sock.send(JSON.stringify([lines1, lines2]))
  logger.debug(' sock.send ')
  
  let result
  try {
    const buffer = Buffer.from(await sock.receive())
    logger.debug(' sock.receive 1')
    
    result = buffer // ERROR:node_bindings.cc(146)] Fatal error in V8: v8_ArrayBuffer_NewBackingStore
  } catch (e) {
    logger.error(e)
    const text1 = e.name
    const text2 = e.message
    return [{ text1, text2 }]
  }
    
  logger.debug(' sock.receive ')

  try {
    res = JSON.parse(result)
    logger.debug(' JSON.parse ')
  } catch (e) {
    logger.error(e)
    const text1 = e.name
    const text2 = e.message
    res = [{ text1, text2 }]
  }

  const _ = genRowdata({ col1: res, isRow: true })
  
  // logger.debug(' to be returned to client: %j', _)
  logger.debug(' to be returned 0:5 ')
  _.map((el, idx) => { if (idx < 5) logger.debug(idx, el) })
    
  return _
}

module.exports = zmqAlign
