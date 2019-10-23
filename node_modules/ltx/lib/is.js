'use strict'

var Element = require('./Element')

module.exports.isNode = function is (el) {
  return el instanceof Element || typeof el === 'string'
}

module.exports.isElement = function isElement (el) {
  return el instanceof Element
}

module.exports.isText = function isText (el) {
  return typeof el === 'string'
}
