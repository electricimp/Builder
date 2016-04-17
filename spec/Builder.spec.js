/**
 * Builder spec
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

const Builder = require('../src');
const Machine = require('../src/Machine');

describe('Expression', () => {

  const builder = new Builder();
  builder.machine.generateLineControlStatements = true;

  it('should build something', () => {
    expect(builder.machine instanceof Machine).toBeTruthy();
    expect(builder.machine.execute('@{__FILE__}:@{__LINE__}'))
      .toBe('#line 1 "main"\nmain:1');
  });

});
