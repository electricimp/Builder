// MIT License
//
// Copyright 2016-2017 Electric Imp
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

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const Machine = require('./Machine');
const AstParser = require('./AstParser');
const Expression = require('./Expression');
const FileReader = require('./Readers/FileReader');
const HttpReader = require('./Readers/HttpReader');
const GithubReader = require('./Readers/GithubReader');
const EscapeFilter = require('./Filters/EscapeFilter.js');
const Base64Filter = require('./Filters/Base64Filter');
const myFilters = {
  MyFuncFilter: class {
    constructor() {
      this.name = "myFunc"
    }
    filter(input, args) {
      return "len: " + input.length;
    }
  }
}

/**
 * Main Builder class
 */
class Builder {

  constructor(opts) {
    this._filters = opts.filters || [];
    this._initGlobals();
    this._initMachine();
  }

  /**
   * Init global context
   * @private
   */
  _initGlobals() {
    // global context
    this._globals = {};

    // filters

    const escapeFilter = new EscapeFilter();
    this._globals[escapeFilter.name] = (args) => {
      return escapeFilter.filter(args.shift(), args);
    };

    const base64Filter = new Base64Filter();
    this._globals[base64Filter.name] = (args) => {
      return base64Filter.filter(args.shift(), args);
    };

    const myFuncFilter = new myFilters.MyFuncFilter();
    this._globals[myFuncFilter.name] = (args) => {
      return myFuncFilter.filter(args.shift(), args);
    };

    // user-defined filters
    let filterFiles = [];
    for (let file of this._filters) {
      const stat = fs.lstatSync(file);
      if (stat.isFile()) {
        filterFiles.push(file);
      } else if (stat.isDirectory()) {
        filterFiles = filterFiles.concat(glob.sync(`${file}/**/*.js`));
      } else {
        throw "Cannot stat path for filters: " + file;
      }
    }
    filterFiles = filterFiles.map(p => path.resolve(process.cwd(), p));
    let filters = [];
    for (let file of filterFiles) {
      const exports = require(file);
      if ('filters' in exports) {
        filters = filters.concat(exports.filter);
      }
      if (typeof exports === 'function') {
        filters.push(exports);
      }
    }
    for (let Filter of filters) {
      const filter = new Filter();
      this._globals[filter.name] = (args) => {
        return filter.filter(args.shift(), args);
      };
    }

    // arithmetic functions

    // create Math.* function
    const _createMathFunction = (name) => {
      return (args, context) => {
        if (args.length < 1) {
          throw new Error('Wrong number of arguments for ' + name + '()');
        }
        return Math[name].apply(Math, args);
      };
    };

    this._globals['abs'] = _createMathFunction('abs');
    this._globals['min'] = _createMathFunction('min');
    this._globals['max'] = _createMathFunction('max');
  }

  /**
   * Init machine
   * @private
   */
  _initMachine() {
    const fileReader = new FileReader();
    const httpReader = new HttpReader();
    const githubReader = new GithubReader();

    const expression = new Expression();
    const parser = new AstParser();
    const machine = new Machine();

    machine.readers.github = githubReader;
    machine.readers.http = httpReader;
    machine.readers.file = fileReader;

    machine.globals = this._globals;

    machine.expression = expression;
    machine.parser = parser;
    machine.logger = this.logger;
    machine.generateLineControlStatements = false;

    this._machine = machine;
  }

  /**
   * @return {Machine}
   */
  get machine() {
    return this._machine;
  }

  /**
   * @return {{debug(), info(), warning(), error()}}
   */
  get logger() {
    return this._logger || {
        debug: console.log,
        info: console.info,
        warning: console.warning,
        error: console.error
      };
  }

  /**
   * @param {{debug(), info(), warning(), error()}} value
   */
  set logger(value) {
    this._logger = value;
    // update loggers
    this.machine.logger = value;
  }
}

module.exports = Builder;
