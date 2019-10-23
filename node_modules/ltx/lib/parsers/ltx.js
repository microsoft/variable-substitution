'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var unescapeXML = require('../escape').unescapeXML

var STATE_TEXT = 0
var STATE_IGNORE_COMMENT = 1
var STATE_IGNORE_INSTRUCTION = 2
var STATE_TAG_NAME = 3
var STATE_TAG = 4
var STATE_ATTR_NAME = 5
var STATE_ATTR_EQ = 6
var STATE_ATTR_QUOT = 7
var STATE_ATTR_VALUE = 8
var STATE_CDATA = 9
var STATE_IGNORE_CDATA = 10

var SaxLtx = module.exports = function SaxLtx () {
  EventEmitter.call(this)

  var state = STATE_TEXT
  var remainder
  var tagName
  var attrs
  var endTag
  var selfClosing
  var attrQuote
  var attrQuoteChar
  var recordStart = 0
  var attrName

  this._handleTagOpening = function (endTag, tagName, attrs) {
    if (!endTag) {
      this.emit('startElement', tagName, attrs)
      if (selfClosing) {
        this.emit('endElement', tagName)
      }
    } else {
      this.emit('endElement', tagName)
    }
  }

  this.write = function (data) {
    if (typeof data !== 'string') {
      data = data.toString()
    }
    var pos = 0

    /* Anything from previous write()? */
    if (remainder) {
      data = remainder + data
      pos += remainder.length
      remainder = null
    }

    function endRecording () {
      if (typeof recordStart === 'number') {
        var recorded = data.substring(recordStart, pos)
        recordStart = undefined
        return recorded
      }
    }

    for (; pos < data.length; pos++) {
      if (state === STATE_TEXT) {
        // if we're looping through text, fast-forward using indexOf to
        // the next '<' character
        var lt = data.indexOf('<', pos)
        if (lt !== -1 && pos !== lt) {
          pos = lt
        }
      } else if (state === STATE_ATTR_VALUE) {
        // if we're looping through an attribute, fast-forward using
        // indexOf to the next end quote character
        var quot = data.indexOf(attrQuoteChar, pos)
        if (quot !== -1) {
          pos = quot
        }
      } else if (state === STATE_IGNORE_COMMENT) {
        // if we're looping through a comment, fast-forward using
        // indexOf to the first end-comment character
        var endcomment = data.indexOf('-->', pos)
        if (endcomment !== -1) {
          pos = endcomment + 2 // target the '>' character
        }
      } else if (state === STATE_IGNORE_CDATA) {
        // if we're looping through a CDATA, fast-forward using
        // indexOf to the first end-CDATA character ]]>
        var endCDATA = data.indexOf(']]>', pos)
        if (endCDATA !== -1) {
          pos = endCDATA + 2 // target the '>' character
        }
      }

      var c = data.charCodeAt(pos)
      switch (state) {
        case STATE_TEXT:
          if (c === 60 /* < */) {
            var text = endRecording()
            if (text) {
              this.emit('text', unescapeXML(text))
            }
            state = STATE_TAG_NAME
            recordStart = pos + 1
            attrs = {}
          }
          break
        case STATE_CDATA:
          if (c === 93 /* ] */ && data.substr(pos + 1, 2) === ']>') {
            var cData = endRecording()
            if (cData) {
              this.emit('text', cData)
            }
            state = STATE_TEXT
          }
          break
        case STATE_TAG_NAME:
          if (c === 47 /* / */ && recordStart === pos) {
            recordStart = pos + 1
            endTag = true
          } else if (c === 33 /* ! */) {
            if (data.substr(pos + 1, 7) === '[CDATA[') {
              recordStart = pos + 8
              state = STATE_CDATA
            } else {
              recordStart = undefined
              state = STATE_IGNORE_COMMENT
            }
          } else if (c === 63 /* ? */) {
            recordStart = undefined
            state = STATE_IGNORE_INSTRUCTION
          } else if (c <= 32 || c === 47 /* / */ || c === 62 /* > */) {
            tagName = endRecording()
            pos--
            state = STATE_TAG
          }
          break
        case STATE_IGNORE_COMMENT:
          if (c === 62 /* > */) {
            var prevFirst = data.charCodeAt(pos - 1)
            var prevSecond = data.charCodeAt(pos - 2)
            if ((prevFirst === 45 /* - */ && prevSecond === 45 /* - */) ||
                (prevFirst === 93 /* ] */ && prevSecond === 93 /* ] */)) {
              state = STATE_TEXT
            }
          }
          break
        case STATE_IGNORE_INSTRUCTION:
          if (c === 62 /* > */) {
            var prev = data.charCodeAt(pos - 1)
            if (prev === 63 /* ? */) {
              state = STATE_TEXT
            }
          }
          break
        case STATE_TAG:
          if (c === 62 /* > */) {
            this._handleTagOpening(endTag, tagName, attrs)
            tagName = undefined
            attrs = undefined
            endTag = undefined
            selfClosing = undefined
            state = STATE_TEXT
            recordStart = pos + 1
          } else if (c === 47 /* / */) {
            selfClosing = true
          } else if (c > 32) {
            recordStart = pos
            state = STATE_ATTR_NAME
          }
          break
        case STATE_ATTR_NAME:
          if (c <= 32 || c === 61 /* = */) {
            attrName = endRecording()
            pos--
            state = STATE_ATTR_EQ
          }
          break
        case STATE_ATTR_EQ:
          if (c === 61 /* = */) {
            state = STATE_ATTR_QUOT
          }
          break
        case STATE_ATTR_QUOT:
          if (c === 34 /* " */ || c === 39 /* ' */) {
            attrQuote = c
            attrQuoteChar = c === 34 ? '"' : "'"
            state = STATE_ATTR_VALUE
            recordStart = pos + 1
          }
          break
        case STATE_ATTR_VALUE:
          if (c === attrQuote) {
            var value = unescapeXML(endRecording())
            attrs[attrName] = value
            attrName = undefined
            state = STATE_TAG
          }
          break
      }
    }

    if (typeof recordStart === 'number' &&
      recordStart <= data.length) {
      remainder = data.slice(recordStart)
      recordStart = 0
    }
  }
}
inherits(SaxLtx, EventEmitter)

SaxLtx.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }

  /* Uh, yeah */
  this.write = function () {}
}
