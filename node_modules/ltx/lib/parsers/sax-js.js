'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var sax = require('sax')

var SaxSaxjs = module.exports = function SaxSaxjs () {
  EventEmitter.call(this)
  this.parser = sax.parser(true)

  var that = this
  this.parser.onopentag = function (a) {
    that.emit('startElement', a.name, a.attributes)
  }
  this.parser.onclosetag = function (name) {
    that.emit('endElement', name)
  }
  this.parser.ontext = function (str) {
    that.emit('text', str)
  }
  this.parser.onend = function () {
    that.emit('end')
  }
  this.parser.onerror = function (e) {
    that.emit('error', e)
  }
}

inherits(SaxSaxjs, EventEmitter)

SaxSaxjs.prototype.write = function (data) {
  if (typeof data !== 'string') {
    data = data.toString()
  }
  this.parser.write(data)
}

SaxSaxjs.prototype.end = function (data) {
  if (data) {
    this.parser.write(data)
  }
  this.parser.close()
}
