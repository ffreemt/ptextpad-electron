/* restAlign
  input texts = [text1: str, text2: str]
  output: Rowdata [{text1: ... , text2: ..., metri: .3 ,}...]
 */
// refer to zmq-client.js
// const zmq = require('zeromq')
const axios = require('axios')
const genRowdata = require('./genRowdata')

const logger = require('tracer').colorConsole({
  // format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // set TRACER_DEBUG=debug
})

const port = 5555

const restAlign = async (lines1, lines2) => {
  let texts
  try {
    logger.debug('lines1: %j', lines1.slice(0, 2))
    logger.debug('lines2: %j', lines2.slice(0, 2))
    texts = [lines1.join('\n'), lines2.join('\n')]
  } catch (e) {
    logger.error(e)
    const text1 = e.name
    const text2 = e.message
    texts = [{ text1, text2 }]
    return texts
  }

  // const sock = new zmq.Request()
  // sock.connect(`tcp://127.0.0.1:${port}`)
  // logger.debug('sock (new zmq.Request) bound to port %s', port)
  // await sock.send(JSON.stringify([lines1, lines2]))
  // logger.debug(' sock.send ')

  let rep
  try {
    // rep = await axios.post(`http://127.0.0.1:${port}/post/`, texts)
    rep = await axios.post(`http://forindo.net:${port}/post/`, texts)
  } catch (e) {
    logger.error(e.message)
    const text1 = e.name
    const text2 = e.message + '\n\t Is the server up running?'
    // return [{ text1, text2 }]
    const err = e.message
    rep = { err, data: [[text1, text2, '']] }
  }

  const result = rep.data

  const _ = genRowdata({ col1: result, isRow: true })

  // logger.debug(' to be returned to client: %j', _)
  logger.debug(' to be returned 0:5 ')
  // _.map((el, idx) => { if (idx < 10) logger.debug(idx, el); return null })
  _.forEach((el, idx) => { if (idx < 5) logger.debug(idx, el) })

  // logger.debug('\n\t === %s', _)

  return _
}

module.exports = restAlign
