// -r esm
// import { expect } from "chai";
// import file2lines from "../src/file2lines";
// import consola from "consola";

const expect = require("chai").expect, assert = require('chai').assert;
const file2lines = require("../src/file2lines");
const genRowdata = require("../src/genRowdata");

const consola = require("consola");
consola.level = process.env.CONSOLA_DEBUG || 3; // set CONSOLA_DEBUG=4 to show debug

// yarn test -f "@1 genRowdata"
describe("@1 genRowdata: sanity test ", () => {
  context(" README.md ", () => {
    it("#1 ./README.md ", async () => {
      var result = await file2lines("README.md");
      consola.debug('result: %o', result);
      // expect(result.length).least(2);
      result = genRowdata(result)
      consola.debug('result1: %o', result);
      expect(result[0].text1).to.equal('# ptextpad-el')
    });
    
    it("#2 ./README.md ", async () => {
      var result = await file2lines("README.md", false);
      consola.debug('result: %o', result);
      // console.log(result)
      // expect(result.length).least(6);
      result = genRowdata(result)
      consola.debug('result1: %o', result);
      // expect(result[1].text1).to.equal('')
      assert(result[1], '')
    });
  });

});
