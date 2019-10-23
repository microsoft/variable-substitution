'use strict'

var escape = require('./escape')
var escapeXML = escape.escapeXML
var escapeXMLText = escape.escapeXMLText

var equality = require('./equal')
var equal = equality.equal
var nameEqual = equality.name
var attrsEqual = equality.attrs
var childrenEqual = equality.children

var clone = require('./clone')

/**
 * Element
 *
 * Attributes are in the element.attrs object. Children is a list of
 * either other Elements or Strings for text content.
 **/
function Element (name, attrs) {
  this.name = name
  this.parent = null
  this.children = []
  this.attrs = {}
  this.setAttrs(attrs)
}

/* Accessors */

/**
 * if (element.is('message', 'jabber:client')) ...
 **/
Element.prototype.is = function (name, xmlns) {
  return (this.getName() === name) &&
  (!xmlns || (this.getNS() === xmlns))
}

/* without prefix */
Element.prototype.getName = function () {
  if (this.name.indexOf(':') >= 0) {
    return this.name.substr(this.name.indexOf(':') + 1)
  } else {
    return this.name
  }
}

/**
 * retrieves the namespace of the current element, upwards recursively
 **/
Element.prototype.getNS = function () {
  if (this.name.indexOf(':') >= 0) {
    var prefix = this.name.substr(0, this.name.indexOf(':'))
    return this.findNS(prefix)
  }
  return this.findNS()
}

/**
 * find the namespace to the given prefix, upwards recursively
 **/
Element.prototype.findNS = function (prefix) {
  if (!prefix) {
    /* default namespace */
    if (this.attrs.xmlns) {
      return this.attrs.xmlns
    } else if (this.parent) {
      return this.parent.findNS()
    }
  } else {
    /* prefixed namespace */
    var attr = 'xmlns:' + prefix
    if (this.attrs[attr]) {
      return this.attrs[attr]
    } else if (this.parent) {
      return this.parent.findNS(prefix)
    }
  }
}

/**
 * Recursiverly gets all xmlns defined, in the form of {url:prefix}
 **/
Element.prototype.getXmlns = function () {
  var namespaces = {}

  if (this.parent) {
    namespaces = this.parent.getXmlns()
  }

  for (var attr in this.attrs) {
    var m = attr.match('xmlns:?(.*)')
    // eslint-disable-next-line  no-prototype-builtins
    if (this.attrs.hasOwnProperty(attr) && m) {
      namespaces[this.attrs[attr]] = m[1]
    }
  }
  return namespaces
}

Element.prototype.setAttrs = function (attrs) {
  if (typeof attrs === 'string') {
    this.attrs.xmlns = attrs
  } else if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      this.attrs[key] = attrs[key]
    }, this)
  }
}

/**
 * xmlns can be null, returns the matching attribute.
 **/
Element.prototype.getAttr = function (name, xmlns) {
  if (!xmlns) {
    return this.attrs[name]
  }

  var namespaces = this.getXmlns()

  if (!namespaces[xmlns]) {
    return null
  }

  return this.attrs[[namespaces[xmlns], name].join(':')]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChild = function (name, xmlns) {
  return this.getChildren(name, xmlns)[0]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChildren = function (name, xmlns) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.getName &&
      (child.getName() === name) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
  }
  return result
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildByAttr = function (attr, val, xmlns, recursive) {
  return this.getChildrenByAttr(attr, val, xmlns, recursive)[0]
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildrenByAttr = function (attr, val, xmlns, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.attrs &&
      (child.attrs[attr] === val) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
    if (recursive && child.getChildrenByAttr) {
      result.push(child.getChildrenByAttr(attr, val, xmlns, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getChildrenByFilter = function (filter, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (filter(child)) {
      result.push(child)
    }
    if (recursive && child.getChildrenByFilter) {
      result.push(child.getChildrenByFilter(filter, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getText = function () {
  var text = ''
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if ((typeof child === 'string') || (typeof child === 'number')) {
      text += child
    }
  }
  return text
}

Element.prototype.getChildText = function (name, xmlns) {
  var child = this.getChild(name, xmlns)
  return child ? child.getText() : null
}

/**
 * Return all direct descendents that are Elements.
 * This differs from `getChildren` in that it will exclude text nodes,
 * processing instructions, etc.
 */
Element.prototype.getChildElements = function () {
  return this.getChildrenByFilter(function (child) {
    return child instanceof Element
  })
}

/* Builder */

/** returns uppermost parent */
Element.prototype.root = function () {
  if (this.parent) {
    return this.parent.root()
  }
  return this
}
Element.prototype.tree = Element.prototype.root

/** just parent or itself */
Element.prototype.up = function () {
  if (this.parent) {
    return this.parent
  }
  return this
}

/** create child node and return it */
Element.prototype.c = function (name, attrs) {
  return this.cnode(new Element(name, attrs))
}

Element.prototype.cnode = function (child) {
  this.children.push(child)
  if (typeof child === 'object') {
    child.parent = this
  }
  return child
}

/** add text node and return element */
Element.prototype.t = function (text) {
  this.children.push(text)
  return this
}

/* Manipulation */

/**
 * Either:
 *   el.remove(childEl)
 *   el.remove('author', 'urn:...')
 */
Element.prototype.remove = function (el, xmlns) {
  var filter
  if (typeof el === 'string') {
    /* 1st parameter is tag name */
    filter = function (child) {
      return !(child.is &&
      child.is(el, xmlns))
    }
  } else {
    /* 1st parameter is element */
    filter = function (child) {
      return child !== el
    }
  }

  this.children = this.children.filter(filter)

  return this
}

Element.prototype.clone = function () {
  return clone(this)
}

Element.prototype.text = function (val) {
  if (val && this.children.length === 1) {
    this.children[0] = val
    return this
  }
  return this.getText()
}

Element.prototype.attr = function (attr, val) {
  if (typeof val !== 'undefined' || val === null) {
    if (!this.attrs) {
      this.attrs = {}
    }
    this.attrs[attr] = val
    return this
  }
  return this.attrs[attr]
}

/* Serialization */

Element.prototype.toString = function () {
  var s = ''
  this.write(function (c) {
    s += c
  })
  return s
}

Element.prototype.toJSON = function () {
  return {
    name: this.name,
    attrs: this.attrs,
    children: this.children.map(function (child) {
      return child && child.toJSON ? child.toJSON() : child
    })
  }
}

Element.prototype._addChildren = function (writer) {
  writer('>')
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    /* Skip null/undefined */
    if (child || (child === 0)) {
      if (child.write) {
        child.write(writer)
      } else if (typeof child === 'string') {
        writer(escapeXMLText(child))
      } else if (child.toString) {
        writer(escapeXMLText(child.toString(10)))
      }
    }
  }
  writer('</')
  writer(this.name)
  writer('>')
}

Element.prototype.write = function (writer) {
  writer('<')
  writer(this.name)
  for (var k in this.attrs) {
    var v = this.attrs[k]
    if (v != null) { // === null || undefined
      writer(' ')
      writer(k)
      writer('="')
      if (typeof v !== 'string') {
        v = v.toString()
      }
      writer(escapeXML(v))
      writer('"')
    }
  }
  if (this.children.length === 0) {
    writer('/>')
  } else {
    this._addChildren(writer)
  }
}

Element.prototype.nameEquals = function (el) {
  return nameEqual(this, el)
}

Element.prototype.attrsEquals = function (el) {
  return attrsEqual(this, el)
}

Element.prototype.childrenEquals = function (el) {
  return childrenEqual(this, el)
}

Element.prototype.equals = function (el) {
  return equal(this, el)
}

module.exports = Element
