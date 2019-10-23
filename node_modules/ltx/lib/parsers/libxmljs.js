'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var libxmljs = require('libxmljs')

function SaxLibxmljs () {
  EventEmitter.call(this)
  this.parser = new libxmljs.SaxPushParser()

  var that = this

  this.parser.on('startElementNS', function (name, attrs, prefix, uri, nss) {
    var a = {}
    attrs.forEach(function (attr) {
      var name = attr[0]
      if (attr[1]) name = attr[1] + ':' + name
      a[name] = attr[3]
    })
    nss.forEach(function (ns) {
      var name = 'xmlns'
      if (ns[0] !== null) {
        name += (':' + ns[0])
      }
      a[name] = ns[1]
    })
    that.emit('startElement', (prefix ? prefix + ':' : '') + name, a)
  })

  this.parser.on('endElementNS', function (name, prefix) {
    that.emit('endElement', (prefix ? prefix + ':' : '') + name)
  })

  this.parser.on('characters', function (str) {
    that.emit('text', str)
  })

  this.parser.on('cadata', function (str) {
    that.emit('text', str)
  })

  this.parser.on('error', function (err) {
    that.emit('error', err)
  })
}

inherits(SaxLibxmljs, EventEmitter)

SaxLibxmljs.prototype.write = function (data) {
  if (typeof data !== 'string') {
    data = data.toString()
  }
  this.parser.push(data)
}

SaxLibxmljs.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }
}

module.exports = SaxLibxmljs
