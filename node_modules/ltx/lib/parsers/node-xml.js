'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var xml = require('node-xml')
var unescapeXML = require('../escape').unescapeXML

/**
 * This cannot be used as long as node-xml starts parsing only after
 * setTimeout(f, 0)
 */
var SaxNodeXML = module.exports = function SaxNodeXML () {
  EventEmitter.call(this)
  var self = this
  this.parser = new xml.SaxParser(function (handler) {
    handler.onStartElementNS(function (elem, attrs, prefix, uri, namespaces) {
      var i
      var attrsHash = {}
      if (prefix) {
        elem = prefix + ':' + elem
      }
      for (i = 0; i < attrs.length; i++) {
        var attr = attrs[i]
        attrsHash[attr[0]] = unescapeXML(attr[1])
      }
      for (i = 0; i < namespaces.length; i++) {
        var namespace = namespaces[i]
        var k = !namespace[0] ? 'xmlns' : 'xmlns:' + namespace[0]
        attrsHash[k] = unescapeXML(namespace[1])
      }
      self.emit('startElement', elem, attrsHash)
    })
    handler.onEndElementNS(function (elem, prefix) {
      if (prefix) {
        elem = prefix + ':' + elem
      }
      self.emit('endElement', elem)
    })
    handler.onCharacters(function (str) {
      self.emit('text', str)
    })
    handler.onCdata(function (str) {
      self.emit('text', str)
    })
    handler.onError(function (e) {
      self.emit('error', e)
    })
  // TODO: other events, esp. entityDecl (billion laughs!)
  })
}

inherits(SaxNodeXML, EventEmitter)

SaxNodeXML.prototype.write = function (data) {
  this.parser.parseString(data)
}

SaxNodeXML.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }
}
