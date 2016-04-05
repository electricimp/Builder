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

  it('should detect incorrect @if syntax', () => {
    try {
      parser.parse(
`@if
@endif`
      );
    } catch (e) {
      expect(e.message).toBe('Syntax error in @if (main:1)');
    }
  });

  it('should detect incorrect @elseif syntax', () => {
    try {
      parser.parse(
`@if 1
@elseif
@endif`
      );
    } catch (e) {
      expect(e.message).toBe('Syntax error in @elseif (main:2)');
    }
  });

});
