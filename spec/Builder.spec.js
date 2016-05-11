/**
 * Builder spec
 * @author Mikhail Yurasov <me@yurasov.me>
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

  it('should execute "escape" filter', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    const res = builder.machine.execute(`"@{'"'|escape}"`);
    expect(res).toBe(`"\\""`);
  });

  it('should execute "base64" filter', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    const res = builder.machine.execute(`@{"abc"|base64}`);
    expect(res).toBe(`YWJj`);
  });

});
