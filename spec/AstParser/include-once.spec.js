// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const AstParser = require('../../src/AstParser');

describe('AstParser', () => {
  let p;

  beforeEach(() => {
    p = new AstParser();
  });

  it('should parse include-once #1', () => {
    const e = [
      {
        '_line': 1,
        'type': 'include',
        'value': '"source"',
        'once': false
      },
      {
        '_line': 2,
        'type': 'include',
        'value': 'something',
        'once': true
      }
    ];

    let r;

    r = p.parse(`@include "source"\n@include once something`);
    expect(r).toEqual(e);

    r = p.parse(`@include "source"\n@include   once something`);
    expect(r).toEqual(e);

    r = p.parse(`@include "source"\n@include once  something `);
    expect(r).toEqual(e);

    // console.error(JSON.stringify(r, null, '  ').replace(/\'/g, '\''));
  });

});
