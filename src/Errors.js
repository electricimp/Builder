/**
 * ImpBundler errors
 * @author Mikhail Yurasov <me@yurasov.me>
 */

'use strict';

class ImpBundlerError extends Error {
  constructor(message, id) {
    super(message || 'ImpBundler erroor occured');
  }
}

module.exports.ImpBundlerError = ImpBundlerError;
