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

const restAlign = async (lines1, lines2, url = null, split2sents = false) => {
  let texts
  let text1
  let text2
  try {
    logger.debug('lines1.slice(0, 2): %j', lines1.slice(0, 2))
    logger.debug('lines2.slice(0, 2): %j', lines2.slice(0, 2))
    text1 = lines1.join('\n')
    text2 = lines2.join('\n')
    texts = [text1, text2]
  } catch (e) {
    logger.error(e)
    text1 = e.name
    text2 = e.message
    texts = [{ text1, text2 }]
    return texts
  }

  // const sock = new zmq.Request()
  // sock.connect(`tcp://127.0.0.1:${port}`)
  // logger.debug('sock (new zmq.Request) bound to port %s', port)
  // await sock.send(JSON.stringify([lines1, lines2]))
  // logger.debug(' sock.send ')

  if (!url) url = `http://forindo.net:${port}/post/`

  let data
  if (url.match('5555')) {
    data = { texts, split2sents }

    let rep
    try {
      // rep = await axios.post(`http://127.0.0.1:${port}/post/`, texts)
      // rep = await axios.post(`http://111.194.226.116:${port}/post/`, texts)
      rep = await axios.post(url, data)
    } catch (e) {
      logger.error(e)
      text1 = e.name
      text2 = e.message + '\n\t Is the server up running? Anything loaded?'
      // return [{ text1, text2 }]
      rep = { data: [[text1, text2, '']] }
    }

    let result
    result = rep.data
    const _ = genRowdata({ col1: result, isRow: true })

    // logger.debug(' to be returned to client: %j', _)
    logger.debug(' to be returned 0:5 ')
    // _.map((el, idx) => { if (idx < 10) logger.debug(idx, el); return null })

    // logger.debug('\n\t === %s', _)

    return _
  }

  // else
  // mlbee 7860
  data = { data: [text1, text2, false, false] }

  try {
    // rep = await axios.post(`http://127.0.0.1:${port}/post/`, texts)
    // rep = await axios.post(`http://111.194.226.116:${port}/post/`, texts)
    rep = await axios.post(url, data)
  } catch (e) {
    logger.error(e.name + ': ' + e.message)
    text1 = e.name
    text2 = e.message + '\n\t Is the server up running? Anything loaded?'
    // return [{ text1, text2 }]
    rep = { data: [[text1, text2, '']] }
  }

  // logger.debug('rep.data: ', rep.data)

  // rep.data: jdata, jdata.get('data')[0].get('data')
  result = rep.data.data[0].data

  // logger.debug('result: ', result)
  logger.debug('result[result.length - 1]: ' , result[result.length - 1])

  const _ = genRowdata({ col1: result, isRow: true })

  return _

}

module.exports = restAlign
