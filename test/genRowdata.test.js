// -r esm
// import { expect } from "chai";
// import file2lines from "../src/file2lines";
// import consola from "consola";
/* eslint-env mocha */

const expect = require('chai').expect; const assert = require('chai').assert
// const assert = require('assert');

// const logger = require('tracer').colorConsole({
// format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
// dateformat: 'HH:MM:ss.L',
// level: process.env.TRACER_DEBUG || 'info'
// })

const file2lines = require('../src/file2lines')
const genRowdata = require('../src/genRowdata')

const consola = require('consola')
consola.level = process.env.CONSOLA_DEBUG || 4 // set CONSOLA_DEBUG=4 to show debug

// yarn test -f "@1 genRowdata"
describe('@1 genRowdata: sanity test ', () => {
  context(' README.md ', () => {
    it('#1 ./README.md ', async () => {
      let result = await file2lines('README.md')
      consola.debug('result: %o', result)
      // expect(result.length).least(2);
      result = genRowdata({ col1: result })
      consola.debug('result1: %o', result)
      expect(result[0].text1).to.equal('# ptextpad-el')
    })

    it('#2 ./README.md ', async () => {
      let result = await file2lines('README.md', false)
      consola.debug('result: %o', result)
      // console.log(result)
      // expect(result.length).least(6);
      result = genRowdata({ col1: result })
      consola.debug('result1: %o', result)

      // expect(result[1].text1).to.equal('')
      assert(result[1], '')
    })
  })
})

describe('@2 isRow = true ', () => {
  it('#1 assert true ', () => {
    const col1 = [
      ['a', 'b', 0.5],
      ['c', 'd', 0.6]
    ]
    const res = genRowdata({ col1, isRow: true })
    assert(res[0].text1, 'a')
    assert(res[1].metric, 0.6)
  })
})
