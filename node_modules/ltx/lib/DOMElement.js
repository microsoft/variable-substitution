'use strict'

var inherits = require('inherits')
var Element = require('./Element')

function DOMElement (name, attrs) {
  Element.call(this, name, attrs)

  this.nodeType = 1
  this.nodeName = this.localName
}

inherits(DOMElement, Element)

DOMElement.prototype._getElement = function (name, attrs) {
  var element = new DOMElement(name, attrs)
  return element
}

Object.defineProperty(DOMElement.prototype, 'localName', {
  get: function () {
    return this.getName()
  }
})

Object.defineProperty(DOMElement.prototype, 'namespaceURI', {
  get: function () {
    return this.getNS()
  }
})

Object.defineProperty(DOMElement.prototype, 'parentNode', {
  get: function () {
    return this.parent
  }
})

Object.defineProperty(DOMElement.prototype, 'childNodes', {
  get: function () {
    return this.children
  }
})

Object.defineProperty(DOMElement.prototype, 'textContent', {
  get: function () {
    return this.getText()
  },
  set: function (value) {
    this.children.push(value)
  }
})

DOMElement.prototype.getElementsByTagName = function (name) {
  return this.getChildren(name)
}

DOMElement.prototype.getAttribute = function (name) {
  return this.getAttr(name)
}

DOMElement.prototype.setAttribute = function (name, value) {
  this.attr(name, value)
}

DOMElement.prototype.getAttributeNS = function (ns, name) {
  if (ns === 'http://www.w3.org/XML/1998/namespace') {
    return this.getAttr(['xml', name].join(':'))
  }
  return this.getAttr(name, ns)
}

DOMElement.prototype.setAttributeNS = function (ns, name, value) {
  var prefix
  if (ns === 'http://www.w3.org/XML/1998/namespace') {
    prefix = 'xml'
  } else {
    var nss = this.getXmlns()
    prefix = nss[ns] || ''
  }
  if (prefix) {
    this.attr([prefix, name].join(':'), value)
  }
}

DOMElement.prototype.removeAttribute = function (name) {
  this.attr(name, null)
}

DOMElement.prototype.removeAttributeNS = function (ns, name) {
  var prefix
  if (ns === 'http://www.w3.org/XML/1998/namespace') {
    prefix = 'xml'
  } else {
    var nss = this.getXmlns()
    prefix = nss[ns] || ''
  }
  if (prefix) {
    this.attr([prefix, name].join(':'), null)
  }
}

DOMElement.prototype.appendChild = function (el) {
  this.cnode(el)
}

DOMElement.prototype.removeChild = function (el) {
  this.remove(el)
}

DOMElement.createElement = function (name, attrs /*, child1, child2, ... */) {
  var el = new DOMElement(name, attrs)

  var children = Array.prototype.slice.call(arguments, 2)

  children.forEach(function (child) {
    el.appendChild(child)
  })
  return el
}

module.exports = DOMElement
