'use strict'

var escape = require('./escape').escapeXML

module.exports = function tagString (/* [literals], ...substitutions */) {
  var literals = arguments[0]

  var str = ''

  for (var i = 1; i < arguments.length; i++) {
    str += literals[i - 1]
    str += escape(arguments[i])
  }
  str += literals[literals.length - 1]

  return str
}
