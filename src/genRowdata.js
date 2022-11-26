'use strict'
const zipLongest = (...args) => Array(Math.max(...args.map(a => a.length))).fill('').map((_, i) => args.map(a => a[i] === undefined ? '' : a[i]))

const headers = ['text1', 'text2', 'metric']
const genRowdata = (col1, col2 = [], col3 = []) => {
  const data = zipLongest(col1, col2, col3)
  return data.map(row => zipLongest(headers, row)).map(el => Object.fromEntries(new Map(el))) // refer to ag-grid-test.js
}

module.exports = genRowdata
