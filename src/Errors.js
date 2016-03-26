/**
 * ImpBuilder errors
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

class ImpBuilderError extends Error {
  constructor(message, id) {
    super(message || 'ImpBuilder error occured');
  }
}

class NotFountError extends ImpBuilderError {
  constructor(message, id) {
    super(message || 'File not found');
  }
}

module.exports.ImpBuilderError = ImpBuilderError;
module.exports.NotFountError = NotFountError;
