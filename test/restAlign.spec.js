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
  // context(' ==== ', () => {

    test('#1  test-en.txt/test-zh.txt  ', async () => {
      let [lines1a, lines2a] = [lines1.slice(0,10), lines2.slice(0,10)]
      const result = await restAlign(lines1a, lines2a)
      consola.debug('result: %o', result)
      // console.log(result)
      expect(result.length).least(2)
    })

    test('#2 test-en.txt/test-zh.txt  ', async () => {
      const result = await restAlign(lines1, lines2)
      consola.debug('result: %o', result)
      // console.log(result)
      expect(result.length).least(2)
      expect(result.length).least(6)
    })
  // })

  test('#3 test-en.txt/test-zh.txt mlbee 7860 ', async () => {
      const result = await restAlign(lines1, lines2, 'http://forindo.net:7860/api/predict')
      consola.debug('result: %o', result)
      // console.log(result)

      expect(result.length).least(2)
      expect(result.length).least(6)

      /* ...
        [ 'Contents PreviousChapter', '上一章', 0.26 ],
        [ 'NextChapter', '下一章', 0.49 ],
        [ 'Homepage', '返回首页', 0.68 ]
      ]
      */

      console.log('==== ', result[result.length - 1])

      // { text1: 'Homepage', text2: '返回首页', metric: 0.68 }
      expect(result[result.length - 1].metric).least(0.68)

    })
})
