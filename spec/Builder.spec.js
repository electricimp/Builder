/**
 * Builder spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');

describe('Builder', () => {

  const builder = new Builder();
  builder.machine.generateLineControlStatements = true;
  builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
  builder.machine.readers.github.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;

  it('should build something', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    expect(builder.machine.execute('@{__FILE__}:@{__LINE__}'))
      .toBe('#line 1 "main"\nmain:1');
  });

});
