'use strict'

var escapeXMLTable = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&apos;'
}

function escapeXMLReplace (match) {
  return escapeXMLTable[match]
}

var unescapeXMLTable = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'"
}

function unescapeXMLReplace (match) {
  if (match[1] === '#') {
    var num
    if (match[2] === 'x') {
      num = parseInt(match.slice(3), 16)
    } else {
      num = parseInt(match.slice(2), 10)
    }
    // https://www.w3.org/TR/xml/#NT-Char defines legal XML characters:
    // #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
    if (num === 0x9 || num === 0xA || num === 0xD ||
        (num >= 0x20 && num <= 0xD7FF) ||
        (num >= 0xE000 && num <= 0xFFFD) ||
        (num >= 0x10000 && num <= 0x10FFFF)) {
      return String.fromCodePoint(num)
    }
    throw new Error('Illegal XML character 0x' + num.toString(16))
  }
  if (unescapeXMLTable[match]) {
    return unescapeXMLTable[match] || match
  }
  throw new Error('Illegal XML entity ' + match)
}

exports.escapeXML = function escapeXML (s) {
  return s.replace(/&|<|>|"|'/g, escapeXMLReplace)
}

exports.unescapeXML = function unescapeXML (s) {
  var result = ''
  var start = -1
  var end = -1
  var previous = 0
  while ((start = s.indexOf('&', previous)) !== -1 && (end = s.indexOf(';', start + 1)) !== -1) {
    result = result +
      s.substring(previous, start) +
      unescapeXMLReplace(s.substring(start, end + 1))
    previous = end + 1
  }

  // shortcut if loop never entered:
  // return the original string without creating new objects
  if (previous === 0) return s

  // push the remaining characters
  result = result + s.substring(previous)

  return result
}

exports.escapeXMLText = function escapeXMLText (s) {
  return s.replace(/&|<|>/g, escapeXMLReplace)
}

exports.unescapeXMLText = function unescapeXMLText (s) {
  return s.replace(/&(amp|#38|lt|#60|gt|#62);/g, unescapeXMLReplace)
}
