// -r esm
// import { expect } from "chai";
// import foo from "../src/foo";
// import consola from "consola";

/* eslint-env mocha */
const expect = require('chai').expect
const file2lines = require('../src/file2lines')
const restAlign = require('../src/restAlign')

const consola = require('consola')
consola.level = process.env.CONSOLA_DEBUG || 3 // set CONSOLA_DEBUG=4 to show debug

const file1 = './data/test-en.txt'
const file2 = './data/test-zh.txt'

const lines1 = file2lines(file1)
const lines2 = file2lines(file2)

consola.debug('test-en.txt lines1: %j', lines1.slice(0, 2))
consola.debug('test-zh.txt lines2: %j', lines2.slice(0, 2))
    
// yarn test -f "@1 index"
describe('@1 restAlign: sanity test ', () => {
  context(' ==== ', () => {
    
    it('#1  test-en.txt/test-zh.txt  ', async () => {
      let [lines1a, lines2a] = [lines1.slice(0,10), lines2.slice(0,10)]
      const result = await restAlign(lines1a, lines2a)
      consola.debug('result: %o', result)
      // console.log(result)
      expect(result.length).least(2)
    })
    
    it('#2 test-en.txt/test-zh.txt  ', async () => {
      const result = await restAlign(lines1, lines2)
      consola.debug('result: %o', result)
      // console.log(result)
      expect(result.length).least(2)
      expect(result.length).least(6)
    })
  })
})
