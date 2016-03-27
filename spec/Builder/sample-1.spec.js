/**
 * Spec for Builder
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const fs = require('fs');
const Builder = require('../../src');

describe('Builder', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
    builder.debug = !!parseInt(process.env.SPEC_DEBUG);
    builder.localFileSearchDirs = [
      __dirname + '/fixtures/sample-1'
    ];
  });

  it('should process sample alright', (done) => {
    const content = fs.readFileSync(__dirname + '/fixtures/sample-1/input.nut');
    builder.sourceName = 'inout.nut';
    builder.build(content)
      .then(done, done.fail);
  });

});
