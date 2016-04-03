/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const fs = require('fs');
const AstParser = require('../../src/AstParser');

const PATH = __dirname + '/../fixtures/sample-2';

describe('AstParser', () => {
  const parser = new AstParser();

  it('should not allow multiple @else-s', () => {
    expect(() => parser.parse(fs.readFileSync(PATH + '/multi-else.nut', 'utf-8'))).toThrowAnyError();
  });

  it('should not allow unclosed @if-s', () => {
    expect(() => parser.parse(fs.readFileSync(PATH + '/unclosed-if.nut', 'utf-8'))).toThrowAnyError();
  });
});
