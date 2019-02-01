// MIT License
//
// Copyright 2017-2019 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

require('jasmine-expect');
const init = require('./init')('main');
const eol = require('eol');
const jasmineDiffMatchers = require('jasmine-diff-matchers');

const backslashToSlash = require('../backslashToSlash');

describe('Machine', () => {
  let machine;

  beforeEach(() => {
    machine = init.createMachine();
    // show string diffs
    jasmine.addMatchers(jasmineDiffMatchers.diffChars);
  });

  it('should handle comments in include corectly', () => {
    const ans = 'a.builder\n';
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/" + "lib/a.builder" // comment`))).toEqual(ans);
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures//" + '//lib/a.builder' // comment`))).toEqual(ans);
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder"//comment+/comment+"some more comment"`))).toEqual(ans);
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/" + 'lib/a.builder' // comment with //`))).toEqual(ans);
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/lib/a.builder" // comment with some expr (1 | 0)`))).toEqual(ans);
    expect(eol.lf(machine.execute(`@include "${backslashToSlash(__dirname)}/../fixtures/" + 'lib/a.builder' // comment with " ' ( ] {`))).toEqual(ans);
  });

    it('should handle @while corectly #1', () => {
        const res = machine.execute(
            `
@if METER_PROTOCOL_REV == 2.02  // comment 1
  @set PERIODIC_DATA_PERIOD = 200 // comment 2
@else // comment 3
  @set METER_PROTOCOL_REV 1.07 // comment 4
  @set PERIODIC_DATA_PERIOD = 1
@end
@{PERIODIC_DATA_PERIOD} @{METER_PROTOCOL_REV}
`
        );

        expect(res).diffChars(
            `
1 1.07
`
        );
    });

});
