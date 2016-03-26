/**
 * Spec for ImpBuilder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const ImpBuilder = require('../src');

let builder;

describe('ImpBuilder', () => {

  beforeEach(() => {
    builder = new ImpBuilder();
    builder.debug = true;
    builder.localFileSearchDirs = [
      __dirname + '/fixtures/sample-1'
    ];
  });

  it('should process sample alright', (done) => {
    builder.build('input.nut')
      .then((res) => {
        console.log(res);
      })
      .then(done, done.fail);
  });

});
