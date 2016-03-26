/**
 * ImpBundler errors
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

class ImpBundlerError extends Error {
  constructor(message, id) {
    super(message || 'ImpBundler error occured');
  }
}

class NotFountError extends ImpBundlerError {
  constructor(message, id) {
    super(message || 'File not found');
  }
}

module.exports.ImpBundlerError = ImpBundlerError;
module.exports.NotFountError = NotFountError;
