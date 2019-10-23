'use strict'

var Element = require('./Element')

/**
 * JSX compatible API, use this function as pragma
 * https://facebook.github.io/jsx/
 *
 * @param  {string} name  name of the element
 * @param  {object} attrs object of attribute key/value pairs
 * @return {Element}      Element
 */
module.exports = function createElement (name, attrs /*, child1, child2, ... */) {
  var el = new Element(name, attrs)

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i]
    if (child) el.cnode(child)
  }

  return el
}
