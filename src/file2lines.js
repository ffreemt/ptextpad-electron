// Convert a file to list of paras/lines, readmove blank lines
// const fs = require('fs/promises')
'use strict'
const fs = require('fs')
const jschardet = require('jschardet')
const iconv = require('iconv-lite')

const file2lines = (fileName, removeBlanks = true) => {
  let content, text
  try {
    content = fs.readFileSync(fileName)
  } catch (err) {
    console.log(err.name)
    throw err.message
  }

  const encoding = jschardet.detect(content).encoding
  if (!encoding) {
    throw Error(`Unable to dectect encoding, detected ${encoding}`)
  }

  // convert to decoded
  try {
    text = iconv.decode(content, encoding)
  } catch (err) {
    console.log(err.name)
    throw err.message
  }
  content = undefined

  if (removeBlanks) {
    // lines = lines.filter(s => s.trim())
    return text.trim().split(/[\r\n]+/)
  }
  return text.trim().split('\n')
}

module.exports = file2lines
