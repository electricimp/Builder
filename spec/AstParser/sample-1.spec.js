// Copyright (c) 2016-2019 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

require('jasmine-expect');

const fs = require('fs');
const path = require('path');
const eol = require('eol');
const AstParser = require('../../src/AstParser');

const FILE = __dirname + '/../fixtures/sample-1/input.nut';

describe('AstParser', () => {

  const parser = new AstParser();
  parser.file = path.basename(FILE);

  it('should do sample #1 alright', () => {
    const res = parser.parse(eol.lf(fs.readFileSync(FILE, 'utf-8')));
    expect(res).toEqual(require(FILE + '.json'));
    // console.log(JSON.stringify(res, null, '    '));
  });

});
