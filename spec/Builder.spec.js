/**
 * Builder spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');

describe('Builder', () => {

  let builder;

  beforeEach(() => {
    builder = new Builder();
    builder.machine.readers.github.username = process.env.SPEC_GITHUB_USERNAME;
    builder.machine.readers.github.password = process.env.SPEC_GITHUB_PASSWORD || process.env.SPEC_GITHUB_TOKEN;
  });

  it('should build something', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    builder.machine.generateLineControlStatements = true;
    expect(builder.machine.execute('@{__FILE__}:@{__LINE__}'))
      .toBe('#line 1 "main"\nmain:1');
  });

  it('should execute "escape" filter #1', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    const res = builder.machine.execute(`"@{'"'|escape}"`);
    expect(res).toBe(`"\\""`);
  });

});
