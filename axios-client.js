/* axios-client for getting data from sanic servet at port 5555   
 * (C:\mat-dir\playground\sanic-stuff\sanic-app.py)
 * refer to zmq-client.js
 */
// const zmq = require('zeromq')
const axios = require('axios')

const logger = require('tracer').colorConsole({
  // format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // set TRACER_DEBUG=debug
})

const file2lines = require('./src/file2lines')
const genRowdata = require('./src/genRowdata')
// const zmqAlign = require('./src/zmqAlign')

const file1 = './data/test-en.txt'
const file2 = './data/test-zh.txt'

const lines1 = file2lines(file1)
const lines2 = file2lines(file2)

// debug('file1: %O', lines1.slice(0, 3))
// debug('file2: %O', lines2.slice(0, 3))
logger.debug('file1: %j', lines1.slice(0, 3))
logger.debug('file2: %j', lines2.slice(0, 3))

const port = 5555
// const port = 7777

// async function run () {
const run = async () => {
  // logger.debug('sock (new zmq.Request) bound to port %s', port)
  logger.debug('axios to visit 127.0.0.1 port %s', port)

  let msg = '4'
  msg = 'stop'
  msg = [
    ['ab', 4],
    ['abc', 14]
  ]
  msg = [lines1, lines2]
  
  const texts = [lines1.join('\n'), lines2.join('\n')]
  
  // await sock.send(JSON.stringify(msg))
  // const [result] = await sock.receive()
  
  let res
  try {
    // let _ = await axios.post(`http://127.0.0.1:${port}/post`, msg)
    // let _ = await axios.post(`http://127.0.0.1:${port}/post/`, msg)
    // let _ = await axios.post(`http://127.0.0.1:${port}/post/`, ['a', 'b'])
    let _ = await axios.post(`http://127.0.0.1:${port}/post/`, texts)
    res = _.data
  } catch (e) {
    let text1 = e.name
    let text2 = e.message
    res = { text1, text2 }
    // throw e.name + ' ' + e.message
    // throw 'bummer...'
  } 
  
  logger.debug('res: ', res)
  
  // const r = JSON.parse(result)
  
  // let [col1, col2] = res.content
  // let [col1, col2] = res
  // logger.debug(col1.slice(0, 5))
  // logger.debug(col2.slice(0, 4))
  
  let ali
  try {
    ali = genRowdata({ col1: res, isRow: true })
  } catch (e) {
    text1 = e.name
    text2 = e.message
    metric = ''
    ali = [{ text1, text2, metric }]
  }
  try{
    logger.debug('\nrun - ali: \n\t%j', ali.slice(0, 7))
  } catch (e) {
    
  }
    
}

run()
// run1()
