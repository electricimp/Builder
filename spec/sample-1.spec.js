/**
 * Spec for ImpBundler
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const ImpBundler = require('../src');

let bundler;

describe('ImpBundler', () => {

  beforeEach(() => {
    bundler = new ImpBundler();
    bundler.debug = true;
    bundler.localFileSearchDirs = [
      __dirname + '/fixtures/sample-1'
    ];
  });

  it('should process sample alright', (done) => {
    bundler.bundle('input.nut')
      .then((res) => {
        console.log(res);
      })
      .then(done, done.fail);
  });

});
