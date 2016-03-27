/**
 * Spec for Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Builder = require('../../src');

let builder;

describe('Builder', () => {

  beforeEach(() => {
    builder = new Builder();
    builder.debug = !!parseInt(process.env.SPEC_DEBUG);
    builder.localFileSearchDirs = [
      __dirname + '/fixtures/sample-1'
    ];
  });

  it('should process sample alright', (done) => {
    builder.build('input.nut')
      .then(done, done.fail);
  });

});
