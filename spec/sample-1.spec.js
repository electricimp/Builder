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

  it('should process sample alright', () => {
    const res = builder.build('input.nut');
    console.log(res);
  });

});
