ltx
===

`JavaScript XML library`

[![build status](https://img.shields.io/travis/node-xmpp/ltx/master.svg?style=flat-square)](https://travis-ci.org/node-xmpp/ltx/branches)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)

ltx is a fast XML builder, parser, serialization and manipulation library for JavaScript.

The builder is a convenient and succinct API to build XML documents represented in memory as JavaScript primitives that can be serialized to XML strings.

The parser can parse XML documents or streams and support [multiple parsers](#parsers).

Features:
* succinct API to build and manipulate XML objects
* parse XML strings
* parse XML streams
* [multiple parser backends](#parsers)
* [JSX](https://facebook.github.io/jsx/) compatible (with `ltx.createElement` pragma)
* [tagged template](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/template_strings) support `` ltx`<foo bar="${baz}">` ``

## Install

`npm install ltx`

## Parsers

By default ltx uses its own parser which is the fastest but doesn't support advanced XML features.
ltx supports third party parsers when such features are needed.

| parser                                                                                     | ops/sec | JS     | stream |
|--------------------------------------------------------------------------------------------|--------:|:------:|:------:|
| [sax-js](https://github.com/isaacs/sax-js)                                                 |  43,058 | ☑      | ☑      |
| [libxmljs](https://github.com/polotek/libxmljs)                                            |  56,763 | ☐      | ☐      |
| [saxes](https://github.com/lddubeau/saxes)                                                 |  62,246 | ☑      | ☑      |
| [node-xml](https://github.com/dylang/node-xml)                                             |  81,980 | ☑      | ☑      |
| [node-expat](https://github.com/node-xmpp/node-expat)                                      |  72,720 | ☐      | ☑      |
| **[ltx/lib/parsers/ltx](https://github.com/node-xmpp/ltx/blob/master/lib/parsers/ltx.js)** | 490,593 | ☑      | ☑      |

From [ltx/benchmarks/parsers.js](https://github.com/node-xmpp/ltx/blob/master/benchmarks/parsers.js), higher is better.
Node.js v10.11.0 - i5-2520M

## Benchmark

```
npm run benchmark
```

## Test

```
npm install
npm test
```
