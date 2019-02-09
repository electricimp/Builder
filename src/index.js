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
const execSync = require('child_process').execSync

/**
 * Main Builder class
 */
class Builder {

  constructor(opts) {
    opts = opts || {};
    this._libs = [ path.resolve(__dirname + '/libs') + '/*.js' ].concat(opts.libs || []);
    this._initGlobals();
    this._initMachine();
  }

  /**
   * Init global context
   * @private
   */
  _initGlobals() {

    let libFiles = [];
    for (let file of this._libs) {
      let newFiles = [];

      if (glob.hasMagic(file)) {
        newFiles = newFiles.concat(glob.sync(file));

      } else {
        const stat = fs.lstatSync(file);

        if (stat.isFile()) {
          libFiles.push(file);

        } else if (stat.isDirectory()) {
          newFiles = newFiles.concat(glob.sync(`${file}/**/*.js`));

        } else {
          throw `lib path "${file}" is not a file or directory`;
        }
      }
      newFiles.sort();
      libFiles = libFiles.concat(newFiles);
    }
    const libs = libFiles.map(p => require(path.resolve(process.cwd(), p)));

    // global context
    this._globals = {};
    for (let lib of libs) {
      Object.assign(this._globals, lib);
    }

    // arithmetic functions

    // create Math.* function
    const _createMathFunction = (name) => {
      return function() {
        const args = [].slice.call(arguments);
        if (args.length < 1) {
          throw new Error('Wrong number of arguments for ' + name + '()');
        }
        return Math[name].apply(Math, args);
      };
    };

    this._globals['abs'] = _createMathFunction('abs');
    this._globals['min'] = _createMathFunction('min');
    this._globals['max'] = _createMathFunction('max');

    // Set GIT constants at build time
    try{
      //Parse output from git describe and turn it into a 32-bit bit field.
      var gitDescribe = execSync('git describe --always --long --dirty').toString()
      var int32Val = parseInt(gitDescribe.match(/^.*([0-9a-f]{7})/)[1], 16)

      // '-dirty' sets the top bit. the first 7 digits of revision ID are packed into
      //the next 7 nibbles. So 'develop-118-g3f4acbf-dirty' is translated to (1 << 31) | 0x3f4acbf.

      // In other words:
      //Bits 0 – 27: These encode the 7-digit Git revision ID of the firmware build. This is obtained using “git rev-parse --short HEAD”. For example, if this command reports a revision ID of “2cfc234”, this field will be 0x2CFC234 (470,170,100 in decimal).
      //Bits 28 – 31: The top 4 bits are flags. Currently only bit 31 is used to indicate there were uncommitted changes when the binary was built.

      if(gitDescribe.includes("dirty")){
          int32Val |= (1 << 31)   // Set a "dirty" bit.  NOTE - this will NOT appear if untracked files are in the repo, only if a tracked file is changed.
      }

      this._globals["__GIT_REV__"] = "0x" + (int32Val >>> 0).toString(16)

      // Set the git commit sha
      this._globals["__GIT_SHA__"] = execSync("git rev-parse HEAD").toString().trimRight()

    } catch(e){}  // Silently fail on error - git is not in the path or we aren't in a git repo
  }

  /**
   * Init machine
   * @private
   */
  _initMachine() {
    const fileReader = new FileReader();
    const httpReader = new HttpReader();
    const githubReader = new GithubReader();

    const parser = new AstParser();
    const machine = new Machine();
    const expression = new Expression(machine);

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
