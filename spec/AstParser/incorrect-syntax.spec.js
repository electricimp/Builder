/**
 * Spec for AST Parser
 * @author Mikhail Yurasov <mikhail@electricimp.com>
 */

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let parser;

  beforeEach(() => {
    parser = new AstParser();
  });

  //noinspection Eslint
  it('should detect incorrect @if syntax', () => {
    let res;

    expect(() => res = parser.parse(
      `@if
@endif`
    )).toThrowAnyError();

    console.error(JSON.stringify(res).replace(/\"/g, '\''));
    console.error(JSON.stringify(res, null, '  '));
  });
});
