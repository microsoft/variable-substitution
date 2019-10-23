'use strict'

module.exports = [
  'sax-js',
  'node-xml',
  'libxmljs',
  'node-expat',
  'ltx',
  'saxes'
].map(function (name) {
  return require('./' + name)
})
