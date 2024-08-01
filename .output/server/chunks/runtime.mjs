import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import http, { Server as Server$1 } from 'node:http';
import https, { Server } from 'node:https';
import { promises, existsSync } from 'fs';
import { dirname as dirname$1, resolve as resolve$1, join } from 'path';
import { PrismaClient } from '@prisma/client';
import { promises as promises$1 } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getIcons } from '@iconify/utils';
import { createConsola as createConsola$1 } from 'consola/core';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  const _value = value.trim();
  if (
    // eslint-disable-next-line unicorn/prefer-at
    value[0] === '"' && value.endsWith('"') && !value.includes("\\")
  ) {
    return _value.slice(1, -1);
  }
  if (_value.length <= 9) {
    const _lval = _value.toLowerCase();
    if (_lval === "true") {
      return true;
    }
    if (_lval === "false") {
      return false;
    }
    if (_lval === "undefined") {
      return void 0;
    }
    if (_lval === "null") {
      return null;
    }
    if (_lval === "nan") {
      return Number.NaN;
    }
    if (_lval === "infinity") {
      return Number.POSITIVE_INFINITY;
    }
    if (_lval === "-infinity") {
      return Number.NEGATIVE_INFINITY;
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = {};
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map((_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const defaults = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults, ...options };
  } else {
    options = defaults;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

class WordArray {
  constructor(words, sigBytes) {
    words = this.words = words || [];
    this.sigBytes = sigBytes === void 0 ? words.length * 4 : sigBytes;
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray([...this.words]);
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16), (bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  constructor() {
    this._data = new WordArray();
    this._nDataBytes = 0;
    this._minBufferSize = 0;
    this.blockSize = 512 / 32;
  }
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [
  1779033703,
  -1150833019,
  1013904242,
  -1521486534,
  1359893119,
  -1694144372,
  528734635,
  1541459225
];
const K = [
  1116352408,
  1899447441,
  -1245643825,
  -373957723,
  961987163,
  1508970993,
  -1841331548,
  -1424204075,
  -670586216,
  310598401,
  607225278,
  1426881987,
  1925078388,
  -2132889090,
  -1680079193,
  -1046744716,
  -459576895,
  -272742522,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  -1740746414,
  -1473132947,
  -1341970488,
  -1084653625,
  -958395405,
  -710438585,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  -2117940946,
  -1838011259,
  -1564481375,
  -1474664885,
  -1035236496,
  -949202525,
  -778901479,
  -694614492,
  -200395387,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  -2067236844,
  -1933114872,
  -1866530822,
  -1538233109,
  -1090935817,
  -965641998
];
const W = [];
class SHA256 extends Hasher {
  constructor() {
    super(...arguments);
    this._hash = new WordArray([...H]);
  }
  reset() {
    super.reset();
    this._hash = new WordArray([...H]);
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(
      nBitsTotal / 4294967296
    );
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).slice(0, 10);
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function rawHeaders(headers) {
  const rawHeaders2 = [];
  for (const key in headers) {
    if (Array.isArray(headers[key])) {
      for (const h of headers[key]) {
        rawHeaders2.push(key, h);
      }
    } else {
      rawHeaders2.push(key, headers[key]);
    }
  }
  return rawHeaders2;
}
function mergeFns(...functions) {
  return function(...args) {
    for (const fn of functions) {
      fn(...args);
    }
  };
}
function createNotImplementedError(name) {
  throw new Error(`[unenv] ${name} is not implemented yet!`);
}

let defaultMaxListeners = 10;
let EventEmitter$1 = class EventEmitter {
  __unenv__ = true;
  _events = /* @__PURE__ */ Object.create(null);
  _maxListeners;
  static get defaultMaxListeners() {
    return defaultMaxListeners;
  }
  static set defaultMaxListeners(arg) {
    if (typeof arg !== "number" || arg < 0 || Number.isNaN(arg)) {
      throw new RangeError(
        'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + "."
      );
    }
    defaultMaxListeners = arg;
  }
  setMaxListeners(n) {
    if (typeof n !== "number" || n < 0 || Number.isNaN(n)) {
      throw new RangeError(
        'The value of "n" is out of range. It must be a non-negative number. Received ' + n + "."
      );
    }
    this._maxListeners = n;
    return this;
  }
  getMaxListeners() {
    return _getMaxListeners(this);
  }
  emit(type, ...args) {
    if (!this._events[type] || this._events[type].length === 0) {
      return false;
    }
    if (type === "error") {
      let er;
      if (args.length > 0) {
        er = args[0];
      }
      if (er instanceof Error) {
        throw er;
      }
      const err = new Error(
        "Unhandled error." + (er ? " (" + er.message + ")" : "")
      );
      err.context = er;
      throw err;
    }
    for (const _listener of this._events[type]) {
      (_listener.listener || _listener).apply(this, args);
    }
    return true;
  }
  addListener(type, listener) {
    return _addListener(this, type, listener, false);
  }
  on(type, listener) {
    return _addListener(this, type, listener, false);
  }
  prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  }
  once(type, listener) {
    return this.on(type, _wrapOnce(this, type, listener));
  }
  prependOnceListener(type, listener) {
    return this.prependListener(type, _wrapOnce(this, type, listener));
  }
  removeListener(type, listener) {
    return _removeListener(this, type, listener);
  }
  off(type, listener) {
    return this.removeListener(type, listener);
  }
  removeAllListeners(type) {
    return _removeAllListeners(this, type);
  }
  listeners(type) {
    return _listeners(this, type, true);
  }
  rawListeners(type) {
    return _listeners(this, type, false);
  }
  listenerCount(type) {
    return this.rawListeners(type).length;
  }
  eventNames() {
    return Object.keys(this._events);
  }
};
function _addListener(target, type, listener, prepend) {
  _checkListener(listener);
  if (target._events.newListener !== void 0) {
    target.emit("newListener", type, listener.listener || listener);
  }
  if (!target._events[type]) {
    target._events[type] = [];
  }
  if (prepend) {
    target._events[type].unshift(listener);
  } else {
    target._events[type].push(listener);
  }
  const maxListeners = _getMaxListeners(target);
  if (maxListeners > 0 && target._events[type].length > maxListeners && !target._events[type].warned) {
    target._events[type].warned = true;
    const warning = new Error(
      `[unenv] Possible EventEmitter memory leak detected. ${target._events[type].length} ${type} listeners added. Use emitter.setMaxListeners() to increase limit`
    );
    warning.name = "MaxListenersExceededWarning";
    warning.emitter = target;
    warning.type = type;
    warning.count = target._events[type]?.length;
    console.warn(warning);
  }
  return target;
}
function _removeListener(target, type, listener) {
  _checkListener(listener);
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  const lenBeforeFilter = target._events[type].length;
  target._events[type] = target._events[type].filter((fn) => fn !== listener);
  if (lenBeforeFilter === target._events[type].length) {
    return target;
  }
  if (target._events.removeListener) {
    target.emit("removeListener", type, listener.listener || listener);
  }
  if (target._events[type].length === 0) {
    delete target._events[type];
  }
  return target;
}
function _removeAllListeners(target, type) {
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  if (target._events.removeListener) {
    for (const _listener of target._events[type]) {
      target.emit("removeListener", type, _listener.listener || _listener);
    }
  }
  delete target._events[type];
  return target;
}
function _wrapOnce(target, type, listener) {
  let fired = false;
  const wrapper = (...args) => {
    if (fired) {
      return;
    }
    target.removeListener(type, wrapper);
    fired = true;
    return args.length === 0 ? listener.call(target) : listener.apply(target, args);
  };
  wrapper.listener = listener;
  return wrapper;
}
function _getMaxListeners(target) {
  return target._maxListeners ?? EventEmitter$1.defaultMaxListeners;
}
function _listeners(target, type, unwrap) {
  let listeners = target._events[type];
  if (typeof listeners === "function") {
    listeners = [listeners];
  }
  return unwrap ? listeners.map((l) => l.listener || l) : listeners;
}
function _checkListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError(
      'The "listener" argument must be of type Function. Received type ' + typeof listener
    );
  }
}

const EventEmitter = globalThis.EventEmitter || EventEmitter$1;

class _Readable extends EventEmitter {
  __unenv__ = true;
  readableEncoding = null;
  readableEnded = true;
  readableFlowing = false;
  readableHighWaterMark = 0;
  readableLength = 0;
  readableObjectMode = false;
  readableAborted = false;
  readableDidRead = false;
  closed = false;
  errored = null;
  readable = false;
  destroyed = false;
  static from(_iterable, options) {
    return new _Readable(options);
  }
  constructor(_opts) {
    super();
  }
  _read(_size) {
  }
  read(_size) {
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  isPaused() {
    return true;
  }
  unpipe(_destination) {
    return this;
  }
  unshift(_chunk, _encoding) {
  }
  wrap(_oldStream) {
    return this;
  }
  push(_chunk, _encoding) {
    return false;
  }
  _destroy(_error, _callback) {
    this.removeAllListeners();
  }
  destroy(error) {
    this.destroyed = true;
    this._destroy(error);
    return this;
  }
  pipe(_destenition, _options) {
    return {};
  }
  compose(stream, options) {
    throw new Error("[unenv] Method not implemented.");
  }
  [Symbol.asyncDispose]() {
    this.destroy();
    return Promise.resolve();
  }
  // eslint-disable-next-line require-yield
  async *[Symbol.asyncIterator]() {
    throw createNotImplementedError("Readable.asyncIterator");
  }
  iterator(options) {
    throw createNotImplementedError("Readable.iterator");
  }
  map(fn, options) {
    throw createNotImplementedError("Readable.map");
  }
  filter(fn, options) {
    throw createNotImplementedError("Readable.filter");
  }
  forEach(fn, options) {
    throw createNotImplementedError("Readable.forEach");
  }
  reduce(fn, initialValue, options) {
    throw createNotImplementedError("Readable.reduce");
  }
  find(fn, options) {
    throw createNotImplementedError("Readable.find");
  }
  findIndex(fn, options) {
    throw createNotImplementedError("Readable.findIndex");
  }
  some(fn, options) {
    throw createNotImplementedError("Readable.some");
  }
  toArray(options) {
    throw createNotImplementedError("Readable.toArray");
  }
  every(fn, options) {
    throw createNotImplementedError("Readable.every");
  }
  flatMap(fn, options) {
    throw createNotImplementedError("Readable.flatMap");
  }
  drop(limit, options) {
    throw createNotImplementedError("Readable.drop");
  }
  take(limit, options) {
    throw createNotImplementedError("Readable.take");
  }
  asIndexedPairs(options) {
    throw createNotImplementedError("Readable.asIndexedPairs");
  }
}
const Readable = globalThis.Readable || _Readable;

class _Writable extends EventEmitter {
  __unenv__ = true;
  writable = true;
  writableEnded = false;
  writableFinished = false;
  writableHighWaterMark = 0;
  writableLength = 0;
  writableObjectMode = false;
  writableCorked = 0;
  closed = false;
  errored = null;
  writableNeedDrain = false;
  destroyed = false;
  _data;
  _encoding = "utf-8";
  constructor(_opts) {
    super();
  }
  pipe(_destenition, _options) {
    return {};
  }
  _write(chunk, encoding, callback) {
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return;
    }
    if (this._data === void 0) {
      this._data = chunk;
    } else {
      const a = typeof this._data === "string" ? Buffer.from(this._data, this._encoding || encoding || "utf8") : this._data;
      const b = typeof chunk === "string" ? Buffer.from(chunk, encoding || this._encoding || "utf8") : chunk;
      this._data = Buffer.concat([a, b]);
    }
    this._encoding = encoding;
    if (callback) {
      callback();
    }
  }
  _writev(_chunks, _callback) {
  }
  _destroy(_error, _callback) {
  }
  _final(_callback) {
  }
  write(chunk, arg2, arg3) {
    const encoding = typeof arg2 === "string" ? this._encoding : "utf-8";
    const cb = typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    this._write(chunk, encoding, cb);
    return true;
  }
  setDefaultEncoding(_encoding) {
    return this;
  }
  end(arg1, arg2, arg3) {
    const callback = typeof arg1 === "function" ? arg1 : typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return this;
    }
    const data = arg1 === callback ? void 0 : arg1;
    if (data) {
      const encoding = arg2 === callback ? void 0 : arg2;
      this.write(data, encoding, callback);
    }
    this.writableEnded = true;
    this.writableFinished = true;
    this.emit("close");
    this.emit("finish");
    return this;
  }
  cork() {
  }
  uncork() {
  }
  destroy(_error) {
    this.destroyed = true;
    delete this._data;
    this.removeAllListeners();
    return this;
  }
  compose(stream, options) {
    throw new Error("[h3] Method not implemented.");
  }
}
const Writable = globalThis.Writable || _Writable;

const __Duplex = class {
  allowHalfOpen = true;
  _destroy;
  constructor(readable = new Readable(), writable = new Writable()) {
    Object.assign(this, readable);
    Object.assign(this, writable);
    this._destroy = mergeFns(readable._destroy, writable._destroy);
  }
};
function getDuplex() {
  Object.assign(__Duplex.prototype, Readable.prototype);
  Object.assign(__Duplex.prototype, Writable.prototype);
  return __Duplex;
}
const _Duplex = /* @__PURE__ */ getDuplex();
const Duplex = globalThis.Duplex || _Duplex;

class Socket extends Duplex {
  __unenv__ = true;
  bufferSize = 0;
  bytesRead = 0;
  bytesWritten = 0;
  connecting = false;
  destroyed = false;
  pending = false;
  localAddress = "";
  localPort = 0;
  remoteAddress = "";
  remoteFamily = "";
  remotePort = 0;
  autoSelectFamilyAttemptedAddresses = [];
  readyState = "readOnly";
  constructor(_options) {
    super();
  }
  write(_buffer, _arg1, _arg2) {
    return false;
  }
  connect(_arg1, _arg2, _arg3) {
    return this;
  }
  end(_arg1, _arg2, _arg3) {
    return this;
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  setTimeout(_timeout, _callback) {
    return this;
  }
  setNoDelay(_noDelay) {
    return this;
  }
  setKeepAlive(_enable, _initialDelay) {
    return this;
  }
  address() {
    return {};
  }
  unref() {
    return this;
  }
  ref() {
    return this;
  }
  destroySoon() {
    this.destroy();
  }
  resetAndDestroy() {
    const err = new Error("ERR_SOCKET_CLOSED");
    err.code = "ERR_SOCKET_CLOSED";
    this.destroy(err);
    return this;
  }
}

class IncomingMessage extends Readable {
  __unenv__ = {};
  aborted = false;
  httpVersion = "1.1";
  httpVersionMajor = 1;
  httpVersionMinor = 1;
  complete = true;
  connection;
  socket;
  headers = {};
  trailers = {};
  method = "GET";
  url = "/";
  statusCode = 200;
  statusMessage = "";
  closed = false;
  errored = null;
  readable = false;
  constructor(socket) {
    super();
    this.socket = this.connection = socket || new Socket();
  }
  get rawHeaders() {
    return rawHeaders(this.headers);
  }
  get rawTrailers() {
    return [];
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  get headersDistinct() {
    return _distinct(this.headers);
  }
  get trailersDistinct() {
    return _distinct(this.trailers);
  }
}
function _distinct(obj) {
  const d = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key) {
      d[key] = (Array.isArray(value) ? value : [value]).filter(
        Boolean
      );
    }
  }
  return d;
}

class ServerResponse extends Writable {
  __unenv__ = true;
  statusCode = 200;
  statusMessage = "";
  upgrading = false;
  chunkedEncoding = false;
  shouldKeepAlive = false;
  useChunkedEncodingByDefault = false;
  sendDate = false;
  finished = false;
  headersSent = false;
  strictContentLength = false;
  connection = null;
  socket = null;
  req;
  _headers = {};
  constructor(req) {
    super();
    this.req = req;
  }
  assignSocket(socket) {
    socket._httpMessage = this;
    this.socket = socket;
    this.connection = socket;
    this.emit("socket", socket);
    this._flush();
  }
  _flush() {
    this.flushHeaders();
  }
  detachSocket(_socket) {
  }
  writeContinue(_callback) {
  }
  writeHead(statusCode, arg1, arg2) {
    if (statusCode) {
      this.statusCode = statusCode;
    }
    if (typeof arg1 === "string") {
      this.statusMessage = arg1;
      arg1 = void 0;
    }
    const headers = arg2 || arg1;
    if (headers) {
      if (Array.isArray(headers)) ; else {
        for (const key in headers) {
          this.setHeader(key, headers[key]);
        }
      }
    }
    this.headersSent = true;
    return this;
  }
  writeProcessing() {
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  appendHeader(name, value) {
    name = name.toLowerCase();
    const current = this._headers[name];
    const all = [
      ...Array.isArray(current) ? current : [current],
      ...Array.isArray(value) ? value : [value]
    ].filter(Boolean);
    this._headers[name] = all.length > 1 ? all : all[0];
    return this;
  }
  setHeader(name, value) {
    this._headers[name.toLowerCase()] = value;
    return this;
  }
  getHeader(name) {
    return this._headers[name.toLowerCase()];
  }
  getHeaders() {
    return this._headers;
  }
  getHeaderNames() {
    return Object.keys(this._headers);
  }
  hasHeader(name) {
    return name.toLowerCase() in this._headers;
  }
  removeHeader(name) {
    delete this._headers[name.toLowerCase()];
  }
  addTrailers(_headers) {
  }
  flushHeaders() {
  }
  writeEarlyHints(_headers, cb) {
    if (typeof cb === "function") {
      cb();
    }
  }
}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Error extends Error {
  constructor(message, opts = {}) {
    super(message, opts);
    __publicField$2(this, "statusCode", 500);
    __publicField$2(this, "fatal", false);
    __publicField$2(this, "unhandled", false);
    __publicField$2(this, "statusMessage");
    __publicField$2(this, "data");
    __publicField$2(this, "cause");
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
__publicField$2(H3Error, "__h3_error__", true);
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function parse(multipartBodyBuffer, boundary) {
  let lastline = "";
  let state = 0 /* INIT */;
  let buffer = [];
  const allParts = [];
  let currentPartHeaders = [];
  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const currByte = multipartBodyBuffer[i];
    const newLineChar = currByte === 10 || currByte === 13;
    if (!newLineChar) {
      lastline += String.fromCodePoint(currByte);
    }
    const newLineDetected = currByte === 10 && prevByte === 13;
    if (0 /* INIT */ === state && newLineDetected) {
      if ("--" + boundary === lastline) {
        state = 1 /* READING_HEADERS */;
      }
      lastline = "";
    } else if (1 /* READING_HEADERS */ === state && newLineDetected) {
      if (lastline.length > 0) {
        const i2 = lastline.indexOf(":");
        if (i2 > 0) {
          const name = lastline.slice(0, i2).toLowerCase();
          const value = lastline.slice(i2 + 1).trim();
          currentPartHeaders.push([name, value]);
        }
      } else {
        state = 2 /* READING_DATA */;
        buffer = [];
      }
      lastline = "";
    } else if (2 /* READING_DATA */ === state) {
      if (lastline.length > boundary.length + 4) {
        lastline = "";
      }
      if ("--" + boundary === lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        allParts.push(process$1(part, currentPartHeaders));
        buffer = [];
        currentPartHeaders = [];
        lastline = "";
        state = 3 /* READING_PART_SEPARATOR */;
      } else {
        buffer.push(currByte);
      }
      if (newLineDetected) {
        lastline = "";
      }
    } else if (3 /* READING_PART_SEPARATOR */ === state && newLineDetected) {
      state = 1 /* READING_HEADERS */;
    }
  }
  return allParts;
}
function process$1(data, headers) {
  const dataObj = {};
  const contentDispositionHeader = headers.find((h) => h[0] === "content-disposition")?.[1] || "";
  for (const i of contentDispositionHeader.split(";")) {
    const s = i.split("=");
    if (s.length !== 2) {
      continue;
    }
    const key = (s[0] || "").trim();
    if (key === "name" || key === "filename") {
      const _value = (s[1] || "").trim().replace(/"/g, "");
      dataObj[key] = Buffer.from(_value, "latin1").toString("utf8");
    }
  }
  const contentType = headers.find((h) => h[0] === "content-type")?.[1] || "";
  if (contentType) {
    dataObj.type = contentType;
  }
  dataObj.data = Buffer.from(data);
  return dataObj;
}

async function validateData(data, fn) {
  try {
    const res = await fn(data);
    if (res === false) {
      throw createValidationError();
    }
    if (res === true) {
      return data;
    }
    return res ?? data;
  } catch (error) {
    throw createValidationError(error);
  }
}
function createValidationError(validateError) {
  throw createError$1({
    status: 400,
    statusMessage: "Validation Error",
    message: validateError?.message || "Validation Error",
    data: validateError
  });
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function getRouterParams(event, opts = {}) {
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decode(params[key]);
    }
  }
  return params;
}
function getValidatedRouterParams(event, validate, opts = {}) {
  const routerParams = getRouterParams(event, opts);
  return validateData(routerParams, validate);
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError$1({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
async function readBody(event, options = {}) {
  const request = event.node.req;
  if (hasProp(request, ParsedBodySymbol)) {
    return request[ParsedBodySymbol];
  }
  const contentType = request.headers["content-type"] || "";
  const body = await readRawBody(event);
  let parsed;
  if (contentType === "application/json") {
    parsed = _parseJSON(body, options.strict ?? true);
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    parsed = _parseURLEncodedBody(body);
  } else if (contentType.startsWith("text/")) {
    parsed = body;
  } else {
    parsed = _parseJSON(body, options.strict ?? false);
  }
  request[ParsedBodySymbol] = parsed;
  return parsed;
}
async function readValidatedBody(event, validate) {
  const _body = await readBody(event, { strict: true });
  return validateData(_body, validate);
}
async function readMultipartFormData(event) {
  const contentType = getRequestHeader(event, "content-type");
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return;
  }
  const boundary = contentType.match(/boundary=([^;]*)(;|$)/i)?.[1];
  if (!boundary) {
    return;
  }
  const body = await readRawBody(event, false);
  if (!body) {
    return;
  }
  return parse(body, boundary);
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}
function _parseJSON(body = "", strict) {
  if (!body) {
    return void 0;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError$1({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body"
    });
  }
}
function _parseURLEncodedBody(body) {
  const form = new URLSearchParams(body);
  const parsedForm = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm;
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start, cookiesString.length));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders(
    getProxyRequestHeaders(event),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    for (const [key, value] of Object.entries(input)) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Event {
  constructor(req, res) {
    __publicField(this, "__is_event__", true);
    // Context
    __publicField(this, "node");
    // Node
    __publicField(this, "web");
    // Web
    __publicField(this, "context", {});
    // Shared
    // Request
    __publicField(this, "_method");
    __publicField(this, "_path");
    __publicField(this, "_headers");
    __publicField(this, "_requestBody");
    // Response
    __publicField(this, "_handled", false);
    // Hooks
    __publicField(this, "_onBeforeResponseCalled");
    __publicField(this, "_onAfterResponseCalled");
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$1({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const { pathname } = parseURL(info.url || "/");
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$1({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$1({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

const s=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function mergeFetchOptions(input, defaults, Headers = globalThis.Headers) {
  const merged = {
    ...defaults,
    ...input
  };
  if (defaults?.params && input?.params) {
    merged.params = {
      ...defaults?.params,
      ...input?.params
    };
  }
  if (defaults?.query && input?.query) {
    merged.query = {
      ...defaults?.query,
      ...input?.query
    };
  }
  if (defaults?.headers && input?.headers) {
    merged.headers = new Headers(defaults?.headers || {});
    for (const [key, value] of new Headers(input?.headers || {})) {
      merged.headers.set(key, value);
    }
  }
  return merged;
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  //  Gateway Timeout
]);
const nullBodyResponses$1 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch$1(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: mergeFetchOptions(_options, globalOptions.defaults, Headers),
      response: void 0,
      error: void 0
    };
    context.options.method = context.options.method?.toUpperCase();
    if (context.options.onRequest) {
      await context.options.onRequest(context);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query || context.options.params) {
        context.request = withQuery(context.request, {
          ...context.options.params,
          ...context.options.query
        });
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(
        () => controller.abort(),
        context.options.timeout
      );
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await context.options.onRequestError(context);
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = context.response.body && !nullBodyResponses$1.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await context.options.onResponse(context);
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await context.options.onResponseError(context);
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}) => createFetch$1({
    ...globalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch || createNodeFetch();
const Headers$1 = globalThis.Headers || s;
const AbortController = globalThis.AbortController || i;
createFetch$1({ fetch, Headers: Headers$1, AbortController });

const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createCall(handle) {
  return function callHandle(context) {
    const req = new IncomingMessage();
    const res = new ServerResponse(req);
    req.url = context.url || "/";
    req.method = context.method || "GET";
    req.headers = {};
    if (context.headers) {
      const headerEntries = typeof context.headers.entries === "function" ? context.headers.entries() : Object.entries(context.headers);
      for (const [name, value] of headerEntries) {
        if (!value) {
          continue;
        }
        req.headers[name.toLowerCase()] = value;
      }
    }
    req.headers.host = req.headers.host || context.host || "localhost";
    req.connection.encrypted = // @ts-ignore
    req.connection.encrypted || context.protocol === "https";
    req.body = context.body || null;
    req.__unenv__ = context.context;
    return handle(req, res).then(() => {
      let body = res._data;
      if (nullBodyResponses.has(res.statusCode) || req.method.toUpperCase() === "HEAD") {
        body = null;
        delete res._headers["content-length"];
      }
      const r = {
        body,
        headers: res._headers,
        status: res.statusCode,
        statusText: res.statusMessage
      };
      req.destroy();
      res.destroy();
      return r;
    });
  };
}

function createFetch(call, _fetch = global.fetch) {
  return async function ufetch(input, init) {
    const url = input.toString();
    if (!url.startsWith("/")) {
      return _fetch(url, init);
    }
    try {
      const r = await call({ url, ...init });
      return new Response(r.body, {
        status: r.status,
        statusText: r.statusText,
        headers: Object.fromEntries(
          Object.entries(r.headers).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.join(",") : String(value) || ""
          ])
        )
      });
    } catch (error) {
      return new Response(error.toString(), {
        status: Number.parseInt(error.statusCode || error.code) || 500,
        statusText: error.statusText
      });
    }
  };
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /{{(.*?)}}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const defineAppConfig = (config) => config;

const appConfig0 = defineAppConfig({
  ui: {}
});

const inlineAppConfig = {
  "nuxt": {},
  "icon": {
    "provider": "iconify",
    "class": "",
    "aliases": {},
    "iconifyApiEndpoint": "https://api.iconify.design",
    "localApiEndpoint": "/api/_nuxt_icon",
    "fallbackToApi": true,
    "cssSelectorPrefix": "i-",
    "cssWherePseudo": true,
    "mode": "css",
    "attrs": {
      "aria-hidden": true
    },
    "collections": [
      "academicons",
      "akar-icons",
      "ant-design",
      "arcticons",
      "basil",
      "bi",
      "bitcoin-icons",
      "bpmn",
      "brandico",
      "bx",
      "bxl",
      "bxs",
      "bytesize",
      "carbon",
      "catppuccin",
      "cbi",
      "charm",
      "ci",
      "cib",
      "cif",
      "cil",
      "circle-flags",
      "circum",
      "clarity",
      "codicon",
      "covid",
      "cryptocurrency",
      "cryptocurrency-color",
      "dashicons",
      "devicon",
      "devicon-plain",
      "ei",
      "el",
      "emojione",
      "emojione-monotone",
      "emojione-v1",
      "entypo",
      "entypo-social",
      "eos-icons",
      "ep",
      "et",
      "eva",
      "f7",
      "fa",
      "fa-brands",
      "fa-regular",
      "fa-solid",
      "fa6-brands",
      "fa6-regular",
      "fa6-solid",
      "fad",
      "fe",
      "feather",
      "file-icons",
      "flag",
      "flagpack",
      "flat-color-icons",
      "flat-ui",
      "flowbite",
      "fluent",
      "fluent-emoji",
      "fluent-emoji-flat",
      "fluent-emoji-high-contrast",
      "fluent-mdl2",
      "fontelico",
      "fontisto",
      "formkit",
      "foundation",
      "fxemoji",
      "gala",
      "game-icons",
      "geo",
      "gg",
      "gis",
      "gravity-ui",
      "gridicons",
      "grommet-icons",
      "guidance",
      "healthicons",
      "heroicons",
      "heroicons-outline",
      "heroicons-solid",
      "hugeicons",
      "humbleicons",
      "ic",
      "icomoon-free",
      "icon-park",
      "icon-park-outline",
      "icon-park-solid",
      "icon-park-twotone",
      "iconamoon",
      "iconoir",
      "icons8",
      "il",
      "ion",
      "iwwa",
      "jam",
      "la",
      "lets-icons",
      "line-md",
      "logos",
      "ls",
      "lucide",
      "mage",
      "majesticons",
      "maki",
      "map",
      "marketeq",
      "material-symbols",
      "material-symbols-light",
      "mdi",
      "mdi-light",
      "medical-icon",
      "memory",
      "meteocons",
      "mi",
      "mingcute",
      "mono-icons",
      "mynaui",
      "nimbus",
      "nonicons",
      "noto",
      "noto-v1",
      "octicon",
      "oi",
      "ooui",
      "openmoji",
      "oui",
      "pajamas",
      "pepicons",
      "pepicons-pencil",
      "pepicons-pop",
      "pepicons-print",
      "ph",
      "pixelarticons",
      "prime",
      "ps",
      "quill",
      "radix-icons",
      "raphael",
      "ri",
      "rivet-icons",
      "si-glyph",
      "simple-icons",
      "simple-line-icons",
      "skill-icons",
      "solar",
      "streamline",
      "streamline-emojis",
      "subway",
      "svg-spinners",
      "system-uicons",
      "tabler",
      "tdesign",
      "teenyicons",
      "token",
      "token-branded",
      "topcoat",
      "twemoji",
      "typcn",
      "uil",
      "uim",
      "uis",
      "uit",
      "uiw",
      "unjs",
      "vaadin",
      "vs",
      "vscode-icons",
      "websymbol",
      "weui",
      "whh",
      "wi",
      "wpf",
      "zmdi",
      "zondicons"
    ]
  },
  "ui": {
    "primary": "green",
    "gray": "cool",
    "colors": [
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
      "rose",
      "primary"
    ],
    "strategy": "merge"
  }
};

const appConfig = defuFn(appConfig0, inlineAppConfig);

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "d1a5f0b3-5d3b-4239-bf45-699c222dd486",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {},
  "icon": {
    "serverKnownCssClasses": []
  }
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
const _sharedAppConfig = _deepFreeze(klona(appConfig));
function useAppConfig(event) {
  {
    return _sharedAppConfig;
  }
}
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
function checkBufferSupport() {
  if (typeof Buffer === void 0) {
    throw new TypeError("[unstorage] Buffer is not supported!");
  }
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  checkBufferSupport();
  const base64 = Buffer.from(value).toString("base64");
  return BASE64_PREFIX + base64;
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  checkBufferSupport();
  return Buffer.from(value.slice(BASE64_PREFIX.length), "base64");
}

const storageKeyProperties = [
  "hasItem",
  "getItem",
  "getItemRaw",
  "setItem",
  "setItemRaw",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    options: {},
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return Array.from(data.keys());
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      for (const mount of mounts) {
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        const keys = rawKeys.map((key) => mount.mountpoint + normalizeKey$1(key)).filter((key) => !maskedMounts.some((p) => key.startsWith(p)));
        allKeys.push(...keys);
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      return base ? allKeys.filter((key) => key.startsWith(base) && !key.endsWith("$")) : allKeys.filter((key) => !key.endsWith("$"));
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    }
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        const dirFiles = await readdirRecursive(entryPath, ignore);
        files.push(...dirFiles.map((f) => entry.name + "/" + f));
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.\:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const fsDriver = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys() {
      return readdirRecursive(r("."), opts.ignore);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', fsDriver({"driver":"fsLite","base":"/Users/viandwi24/projects/code-challenges/fluffare/.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[nitro] [cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          const promise = useStorage().setItem(cacheKey, entry).catch((error) => {
            console.error(`[nitro] [cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event && event.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[nitro] [cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length > 0 ? hash(args, {}) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      const _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        variableHeaders[header] = incomingEvent.node.req.headers[header];
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            for (const header in headers2) {
              this.setHeader(header, headers2[header]);
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(event);
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        event.node.res.setHeader(name, value);
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function normalizeError(error) {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "/";
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}
function _captureError(error, type) {
  console.error(`[nitro] [${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function defineNitroPlugin(def) {
  return def;
}

var _a;
const prismaClientSingleton = () => {
  return new PrismaClient();
};
const prisma = (_a = globalThis.prismaGlobal) != null ? _a : prismaClientSingleton();

const _j21GtAME8z = defineNitroPlugin(async (nitroApp) => {
  console.log(`[nitro:db] connecting to database`);
  await prisma.$connect();
  console.log(`[nitro:db] connected to database`);
});

const script = "\"use strict\";(()=>{const a=window,e=document.documentElement,c=window.localStorage,d=[\"dark\",\"light\"],n=c&&c.getItem&&c.getItem(\"nuxt-color-mode\")||\"system\";let l=n===\"system\"?f():n;const i=e.getAttribute(\"data-color-mode-forced\");i&&(l=i),r(l),a[\"__NUXT_COLOR_MODE__\"]={preference:n,value:l,getColorScheme:f,addColorScheme:r,removeColorScheme:u};function r(o){const t=\"\"+o+\"\",s=\"\";e.classList?e.classList.add(t):e.className+=\" \"+t,s&&e.setAttribute(\"data-\"+s,o)}function u(o){const t=\"\"+o+\"\",s=\"\";e.classList?e.classList.remove(t):e.className=e.className.replace(new RegExp(t,\"g\"),\"\"),s&&e.removeAttribute(\"data-\"+s)}function m(o){return a.matchMedia(\"(prefers-color-scheme\"+o+\")\")}function f(){if(a.matchMedia&&m(\"\").media!==\"not all\"){for(const o of d)if(m(\":\"+o).matches)return o}return\"light\"}})();";

const _QaAlsj6sU9 = (function(nitro) {
  nitro.hooks.hook("render:html", (htmlContext) => {
    htmlContext.head.push(`<script>${script}<\/script>`);
  });
});

const plugins = [
  _j21GtAME8z,
_QaAlsj6sU9
];

const errorHandler = (async function errorhandler(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const errorObject = {
    url: event.path,
    statusCode,
    statusMessage,
    message,
    stack: "",
    // TODO: check and validate error.data for serialisation into query
    data: error.data
  };
  if (error.unhandled || error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      error.unhandled && "[unhandled]",
      error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (event.handled) {
    return;
  }
  setResponseStatus(event, errorObject.statusCode !== 200 && errorObject.statusCode || 500, errorObject.statusMessage);
  if (isJsonRequest(event)) {
    setResponseHeader(event, "Content-Type", "application/json");
    return send(event, JSON.stringify(errorObject));
  }
  const reqHeaders = getRequestHeaders(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (!res) {
    const { template } = await import('./_/error-500.mjs');
    if (event.handled) {
      return;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  if (event.handled) {
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : void 0, res.statusText);
  return send(event, html);
});

const assets = {
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"10be-n8egyE9tcb7sKGr/pYCaQ4uWqxI\"",
    "mtime": "2024-08-01T03:05:11.898Z",
    "size": 4286,
    "path": "../public/favicon.ico"
  },
  "/_nuxt/-uxhSgYg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1631-yaQOfvD0xHKEr5k8y+e+EExjWWI\"",
    "mtime": "2024-08-01T03:05:11.861Z",
    "size": 5681,
    "path": "../public/_nuxt/-uxhSgYg.js"
  },
  "/_nuxt/2oJWbEOo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"789-+iCeOzLuHlDG5t8d0RITM3VvOOc\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 1929,
    "path": "../public/_nuxt/2oJWbEOo.js"
  },
  "/_nuxt/3TATJI7h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d8b-HpKsazZ8KT0d6K3TjjLdiHbbz+s\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 3467,
    "path": "../public/_nuxt/3TATJI7h.js"
  },
  "/_nuxt/B-lZjTdr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1da8-fg4rHzZ/E6u3piWb2uq5EWc5j1M\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 7592,
    "path": "../public/_nuxt/B-lZjTdr.js"
  },
  "/_nuxt/B2Cf9XSq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bf7-Ut41oUsDxg6IlTbIqAdI9fSoaUM\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 3063,
    "path": "../public/_nuxt/B2Cf9XSq.js"
  },
  "/_nuxt/B4VqtPa2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bc2-FFWilShQrZ0UqXkQS00cA+xjBBI\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 3010,
    "path": "../public/_nuxt/B4VqtPa2.js"
  },
  "/_nuxt/B4a-eVb9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"123e-B2Bw8+KJMlTL0RsX2SMRAwAbseU\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 4670,
    "path": "../public/_nuxt/B4a-eVb9.js"
  },
  "/_nuxt/B5uW3Zvf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1426-b+0brQ7m3c7yYnF6PoVu4IbAldE\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 5158,
    "path": "../public/_nuxt/B5uW3Zvf.js"
  },
  "/_nuxt/B7alP455.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"aee-9EKjvN/q//wNbc8W18/tqO1jD3M\"",
    "mtime": "2024-08-01T03:05:11.847Z",
    "size": 2798,
    "path": "../public/_nuxt/B7alP455.js"
  },
  "/_nuxt/B8ssZoUh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2d00-Ki6Fi93tlBSjrosFaub4rI+Jygk\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 11520,
    "path": "../public/_nuxt/B8ssZoUh.js"
  },
  "/_nuxt/BGLI1Hdo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8c6-U3tu106BhA0ohqRnZpm25L0J/kQ\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 2246,
    "path": "../public/_nuxt/BGLI1Hdo.js"
  },
  "/_nuxt/BLuZWbUW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c6d-0fP+/NT9+q+lKtaxKud30y3ngDk\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 3181,
    "path": "../public/_nuxt/BLuZWbUW.js"
  },
  "/_nuxt/BM0lOnkR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c0a-PEP0D38+h48DKNsfxeVYcDyeT9Q\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 3082,
    "path": "../public/_nuxt/BM0lOnkR.js"
  },
  "/_nuxt/BR1Zycn9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7e7b-BdhdZJQRTyFWe8qkp6Sc9C0FbKE\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 32379,
    "path": "../public/_nuxt/BR1Zycn9.js"
  },
  "/_nuxt/BRk-K-rg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2907-aYhvtcV+64mWuitoBECCP0wJdzM\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 10503,
    "path": "../public/_nuxt/BRk-K-rg.js"
  },
  "/_nuxt/BTpWsGps.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"543-sQEkIMDBr8Jh8chsJPORikFk5+0\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 1347,
    "path": "../public/_nuxt/BTpWsGps.js"
  },
  "/_nuxt/BVk7jri9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3256a4-ojIAmAkCyCisewaMP4SW2dLwKcw\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 3298980,
    "path": "../public/_nuxt/BVk7jri9.js"
  },
  "/_nuxt/BWBTHuhh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ca9-Q1aScj4PbQ7EHcUmxOC8CtM7uug\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 3241,
    "path": "../public/_nuxt/BWBTHuhh.js"
  },
  "/_nuxt/BXYnMxBe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fc2-hW7T9WiV3cVvQMd6ffbYOPcvB54\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 4034,
    "path": "../public/_nuxt/BXYnMxBe.js"
  },
  "/_nuxt/BY6pwuIY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"82b-AyvDvoYyw8igU1NCUT7GkJZ6kPk\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 2091,
    "path": "../public/_nuxt/BY6pwuIY.js"
  },
  "/_nuxt/BYtUz8ZP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1529-oiLspIRPXr8Uyhuc17u1KtVTjCE\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 5417,
    "path": "../public/_nuxt/BYtUz8ZP.js"
  },
  "/_nuxt/B_i9asfM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dbb-nQry+E22ioGls6NYUIRiw+0Affc\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 3515,
    "path": "../public/_nuxt/B_i9asfM.js"
  },
  "/_nuxt/Bc5xkKR1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2f0e-Z9SuzMsQGUkp8QXPxJ5khrCwb7Q\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 12046,
    "path": "../public/_nuxt/Bc5xkKR1.js"
  },
  "/_nuxt/Bcfr9h_d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14a8-GPQjL16lnrX4BeeqjBGgSwu82Ic\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 5288,
    "path": "../public/_nuxt/Bcfr9h_d.js"
  },
  "/_nuxt/BfHzdStZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2be-g792U4zRsFwzkQLxDa9iGXcWEkI\"",
    "mtime": "2024-08-01T03:05:11.848Z",
    "size": 702,
    "path": "../public/_nuxt/BfHzdStZ.js"
  },
  "/_nuxt/BfLuTCmN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1294-OnY7XkMZOa3R97Y9uesy1vSXqCw\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 4756,
    "path": "../public/_nuxt/BfLuTCmN.js"
  },
  "/_nuxt/Bu--Yiue.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11f-354G0z4elswA5zZShphnuDbhhxg\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 287,
    "path": "../public/_nuxt/Bu--Yiue.js"
  },
  "/_nuxt/BuapDI9Y.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1066-ZTLCqGhpLyFxqkACq/g8tJX1ICM\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 4198,
    "path": "../public/_nuxt/BuapDI9Y.js"
  },
  "/_nuxt/BupSXVCO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"be2-qQLRRDoFAddDhY8Dhd5OkBqu5pk\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 3042,
    "path": "../public/_nuxt/BupSXVCO.js"
  },
  "/_nuxt/BygKL3ZF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9ca-9cT4tiTHcqFGL+8rQeJa37QFtpg\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 2506,
    "path": "../public/_nuxt/BygKL3ZF.js"
  },
  "/_nuxt/BypH-vXm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"446-yOSuwLe18nuAsAdPtiVkwyhRMOQ\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 1094,
    "path": "../public/_nuxt/BypH-vXm.js"
  },
  "/_nuxt/BzLXusWr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2357-8T3X4+NFhlc98O4HAfz+TCdUd/4\"",
    "mtime": "2024-08-01T03:05:11.849Z",
    "size": 9047,
    "path": "../public/_nuxt/BzLXusWr.js"
  },
  "/_nuxt/Bzb7OGdO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19ff-466EWM0++4fRrdZQuchujsmGT2s\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 6655,
    "path": "../public/_nuxt/Bzb7OGdO.js"
  },
  "/_nuxt/C-lWTHUW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b88-SSdotQ9RiyfdlQXwxyw+JxhzHnc\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 7048,
    "path": "../public/_nuxt/C-lWTHUW.js"
  },
  "/_nuxt/C2lY0Gyl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"43f-PZ2gclbcDr1sFmY5wcbxyOf8YLo\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 1087,
    "path": "../public/_nuxt/C2lY0Gyl.js"
  },
  "/_nuxt/C75U4IDy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"eda-JH5rDxgd1hvt6zNwI6ZRGXlSS4E\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 3802,
    "path": "../public/_nuxt/C75U4IDy.js"
  },
  "/_nuxt/C9L3yaDO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15aa-511cjZ9C4coQnl68BChowuDrPE0\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 5546,
    "path": "../public/_nuxt/C9L3yaDO.js"
  },
  "/_nuxt/C9S4s3Lf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10c1-Paf8sjx+0suOQ3dBFxuVRyDmAC8\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 4289,
    "path": "../public/_nuxt/C9S4s3Lf.js"
  },
  "/_nuxt/CCBS_C5_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13d2-8DFIxHSB2WFP66vceOldbUKWZ7s\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 5074,
    "path": "../public/_nuxt/CCBS_C5_.js"
  },
  "/_nuxt/CH3D0bkU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9b77-cQTG27m+nVEuWzNYFRuDhhgQuZk\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 39799,
    "path": "../public/_nuxt/CH3D0bkU.js"
  },
  "/_nuxt/CHtERVvM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1174-CkZshg21STm9wtA2ZE3mLwhFJVo\"",
    "mtime": "2024-08-01T03:05:11.850Z",
    "size": 4468,
    "path": "../public/_nuxt/CHtERVvM.js"
  },
  "/_nuxt/CMnFOFgk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a7f-jRGGdbU+QHLeKa3kLRrHyltHMw4\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 2687,
    "path": "../public/_nuxt/CMnFOFgk.js"
  },
  "/_nuxt/CTNlIIiR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2051-MQ+BxghboLrMh/hfiHUFgQDb+Vg\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 8273,
    "path": "../public/_nuxt/CTNlIIiR.js"
  },
  "/_nuxt/CV9EbfTh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"244c-/BZ9Xuouua1RaL2wYsuTq2FHlM0\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 9292,
    "path": "../public/_nuxt/CV9EbfTh.js"
  },
  "/_nuxt/CXKOl_mN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ee9-8di62sYZ5vBTTTal/Al2BIxUDV0\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 3817,
    "path": "../public/_nuxt/CXKOl_mN.js"
  },
  "/_nuxt/C_scCXcs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15d4-8DrW4RXM9xkyW/wGfHEY52G7wRs\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 5588,
    "path": "../public/_nuxt/C_scCXcs.js"
  },
  "/_nuxt/CfnpWUYo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"efc-eaEuuNS8+J+2bFeK2xhyun4N2aw\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 3836,
    "path": "../public/_nuxt/CfnpWUYo.js"
  },
  "/_nuxt/Ckkbw-AO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b09-Kz5+I3IXp0c+EGaYLY6TXGLJ/YM\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 2825,
    "path": "../public/_nuxt/Ckkbw-AO.js"
  },
  "/_nuxt/CmpEVLcd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"595a-N97F4r7t5Ozcj3vlzFhPdYxEb2M\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 22874,
    "path": "../public/_nuxt/CmpEVLcd.js"
  },
  "/_nuxt/CoVIpJ9u.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fa53-3y7JVM0j3nqj073pfq1WT6OWsmg\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 260691,
    "path": "../public/_nuxt/CoVIpJ9u.js"
  },
  "/_nuxt/CrrKwR0a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a58-n3IRESXRCLImjvsv9kN782N8mxg\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 2648,
    "path": "../public/_nuxt/CrrKwR0a.js"
  },
  "/_nuxt/CsWCPd8z.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"108a-Ya9QmYgHxHR9GxjMC1ZfJq77Ymg\"",
    "mtime": "2024-08-01T03:05:11.851Z",
    "size": 4234,
    "path": "../public/_nuxt/CsWCPd8z.js"
  },
  "/_nuxt/CtfUNDSC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"414-6aAcwCNzydhvrizY33+EUJy6caw\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 1044,
    "path": "../public/_nuxt/CtfUNDSC.js"
  },
  "/_nuxt/CtmAtnde.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1413-lNhsWiM3mHP4FheZ97dkJ+YLGoo\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 5139,
    "path": "../public/_nuxt/CtmAtnde.js"
  },
  "/_nuxt/CuFlys0T.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1030-mdCY37hNPSve9QCh/CzhtCPIE+0\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 4144,
    "path": "../public/_nuxt/CuFlys0T.js"
  },
  "/_nuxt/CyVeKkvQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b57-05/3zLzb2lBGW3QVydckLHqWyWM\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 2903,
    "path": "../public/_nuxt/CyVeKkvQ.js"
  },
  "/_nuxt/CzF1MCbP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d31-MY0Dfvi8CXEyRHvO1KMPB/ijxkU\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 3377,
    "path": "../public/_nuxt/CzF1MCbP.js"
  },
  "/_nuxt/D0UiDa5C.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c9d-Spf1Yd7yXyJySMOHTHiEYnO++UY\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 3229,
    "path": "../public/_nuxt/D0UiDa5C.js"
  },
  "/_nuxt/D2PfwrvU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"843-B1x85s/HJ8nCz7+99sKM/ew3X1w\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 2115,
    "path": "../public/_nuxt/D2PfwrvU.js"
  },
  "/_nuxt/D2Z7JJdl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"941-vhj9aCy08XU4sF1fKakaTS5zFZU\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 2369,
    "path": "../public/_nuxt/D2Z7JJdl.js"
  },
  "/_nuxt/D7lU1fdU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"292f-d976Cw3g1tMn89+rOD4Kh5MTxHM\"",
    "mtime": "2024-08-01T03:05:11.852Z",
    "size": 10543,
    "path": "../public/_nuxt/D7lU1fdU.js"
  },
  "/_nuxt/D9yiNO04.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"184b-z+TliMthjcTffmqGVHTvQqOHF6I\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 6219,
    "path": "../public/_nuxt/D9yiNO04.js"
  },
  "/_nuxt/DB0RB20n.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"222e-GL1+8MhP83ea5azmqpORa8LBjFg\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 8750,
    "path": "../public/_nuxt/DB0RB20n.js"
  },
  "/_nuxt/DDpSJMW6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ce3-RnxiMdRF8UA6epSuXtH0qnm9dno\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 7395,
    "path": "../public/_nuxt/DDpSJMW6.js"
  },
  "/_nuxt/DDrv2Hr-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2135-V8kvSSmYpWzH1+d20uZEw4K0EqM\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 8501,
    "path": "../public/_nuxt/DDrv2Hr-.js"
  },
  "/_nuxt/DIovg4uR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1190-+bx3tcumLw9fTAd/XhxrTsY8U1s\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 4496,
    "path": "../public/_nuxt/DIovg4uR.js"
  },
  "/_nuxt/DLPipH_Q.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"358e-WB/y6FDDquJ/7xo7r+oMx6dwnKE\"",
    "mtime": "2024-08-01T03:05:11.853Z",
    "size": 13710,
    "path": "../public/_nuxt/DLPipH_Q.js"
  },
  "/_nuxt/DLs3tTet.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"808-QMD7oBiiPevYuH3ust8Bu4ptMiI\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 2056,
    "path": "../public/_nuxt/DLs3tTet.js"
  },
  "/_nuxt/DOAuugfS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ea9-/9dODoCkRvJ3BCzST/o7wLoOMXo\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 7849,
    "path": "../public/_nuxt/DOAuugfS.js"
  },
  "/_nuxt/DOk3G3cc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1fa6-YvVRsmwhpa0R0ioKCvzqHwTlLQs\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 8102,
    "path": "../public/_nuxt/DOk3G3cc.js"
  },
  "/_nuxt/DRC6TkPh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3849-vZov1LRlOXLurYjw9KqOsMw7FmQ\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 14409,
    "path": "../public/_nuxt/DRC6TkPh.js"
  },
  "/_nuxt/DVG02705.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"81b-JDhDUXzST7UrmhfQaJ1uC7yAgVo\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 2075,
    "path": "../public/_nuxt/DVG02705.js"
  },
  "/_nuxt/DVYH6Lj_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e65-rtLYswSm46sbJlxpNzZGAmFvXU8\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 3685,
    "path": "../public/_nuxt/DVYH6Lj_.js"
  },
  "/_nuxt/DWGz5Zuj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12a2-CIuQYWrbEpZvM/BPuxl2V9MgIuI\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 4770,
    "path": "../public/_nuxt/DWGz5Zuj.js"
  },
  "/_nuxt/DWKy_tIz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"aae-3fR1mnK32N3eaVxtezNbwPaF0+M\"",
    "mtime": "2024-08-01T03:05:11.854Z",
    "size": 2734,
    "path": "../public/_nuxt/DWKy_tIz.js"
  },
  "/_nuxt/D_OY6ada.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"efc-b4l17F3X9Pa6rT6ZncU1T+VbQEw\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 3836,
    "path": "../public/_nuxt/D_OY6ada.js"
  },
  "/_nuxt/DeYg-96x.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26a1-UUVjqTJiGPnbqTdhLlRVKvJMIRQ\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 9889,
    "path": "../public/_nuxt/DeYg-96x.js"
  },
  "/_nuxt/Dgyr3wWZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4321-tRXoynCiuXqzUUDFUcV3TWgXsFc\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 17185,
    "path": "../public/_nuxt/Dgyr3wWZ.js"
  },
  "/_nuxt/Dj1bnOkD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26be2-3HylyExAgsJOsG86sz480dhCakw\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 158690,
    "path": "../public/_nuxt/Dj1bnOkD.js"
  },
  "/_nuxt/DmdQbaLT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"102b-I7yvctqVkCU68qLssquW2B8Hg6Q\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 4139,
    "path": "../public/_nuxt/DmdQbaLT.js"
  },
  "/_nuxt/DoFvH58O.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e2f-HYgrAmVTX1zWAWl4WApitU5aBOg\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 3631,
    "path": "../public/_nuxt/DoFvH58O.js"
  },
  "/_nuxt/DrPL5nvQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a34b-luYfNk4ndxFGVNrppb9LH3DXuHU\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 41803,
    "path": "../public/_nuxt/DrPL5nvQ.js"
  },
  "/_nuxt/DrRCxMg5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"681-2zzuma1gN8DUV5mXozUsO4tqq58\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 1665,
    "path": "../public/_nuxt/DrRCxMg5.js"
  },
  "/_nuxt/Dt4nT6Uu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4a7-6IF9dIHPs+GRrtaVTkeS7xo6Daw\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 1191,
    "path": "../public/_nuxt/Dt4nT6Uu.js"
  },
  "/_nuxt/DvSxYeG4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d8c-BHOkw+5Z5GTkSWSocGVpU7RNRRk\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 7564,
    "path": "../public/_nuxt/DvSxYeG4.js"
  },
  "/_nuxt/DyKutqhl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"499b-PqhvoNrkqmTpvVwnPGTTOa668eI\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 18843,
    "path": "../public/_nuxt/DyKutqhl.js"
  },
  "/_nuxt/Dz9xVu_4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"80a2-OdUGAsxFmMWrKIiovdEJ7jz9nGI\"",
    "mtime": "2024-08-01T03:05:11.855Z",
    "size": 32930,
    "path": "../public/_nuxt/Dz9xVu_4.js"
  },
  "/_nuxt/FNqbgIOG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cf7-IIapvjcnqyx2o9ZggE/K1N9L91o\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 3319,
    "path": "../public/_nuxt/FNqbgIOG.js"
  },
  "/_nuxt/TextViewerMarkdown.DmXeUNvS.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"470c-fN4IJYVsCvb0+ydSObtyNi2K56E\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 18188,
    "path": "../public/_nuxt/TextViewerMarkdown.DmXeUNvS.css"
  },
  "/_nuxt/UMmp-gVE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1136-FWoZClR4rQ/m6PAnI83R/wWkoXY\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 4406,
    "path": "../public/_nuxt/UMmp-gVE.js"
  },
  "/_nuxt/VuadG5SK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ddd-7lR/aAKneU4Vz0WOhLlaobFOTLU\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 7645,
    "path": "../public/_nuxt/VuadG5SK.js"
  },
  "/_nuxt/ZlaFEk-P.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1795-v9J/XrNW2+fpH4htgwEEPeVn1Qw\"",
    "mtime": "2024-08-01T03:05:11.856Z",
    "size": 6037,
    "path": "../public/_nuxt/ZlaFEk-P.js"
  },
  "/_nuxt/codicon.DCmgc-ay.ttf": {
    "type": "font/ttf",
    "etag": "\"139d4-58fQ8Ohjcapek6AgDzlcXTeWfi4\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 80340,
    "path": "../public/_nuxt/codicon.DCmgc-ay.ttf"
  },
  "/_nuxt/editor.GV1GbXjP.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1f29b-ZLGEWGL4XDDaywFl4WxKyrq3dYI\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 127643,
    "path": "../public/_nuxt/editor.GV1GbXjP.css"
  },
  "/_nuxt/entry.CHj6Egbx.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3fce0-I3cvMxdk+hd5RrmSvcXK8taABME\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 261344,
    "path": "../public/_nuxt/entry.CHj6Egbx.css"
  },
  "/_nuxt/error-404.CjGVuf6H.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"de4-SLOwa5sHvQIi2t5fYZEgfDusMUc\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 3556,
    "path": "../public/_nuxt/error-404.CjGVuf6H.css"
  },
  "/_nuxt/error-500.DFBAsgKS.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"75c-I8wgoT19gdl/gPtizNKXfkn+TtQ\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 1884,
    "path": "../public/_nuxt/error-500.DFBAsgKS.css"
  },
  "/_nuxt/gRuQeaLk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ade-BqRIALxkdPGtSrLQWLoe1sFJ0oU\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 2782,
    "path": "../public/_nuxt/gRuQeaLk.js"
  },
  "/_nuxt/gWk44Pyi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1fe-x7Sva15UEGhQufq6Cil2ysGoCWM\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 510,
    "path": "../public/_nuxt/gWk44Pyi.js"
  },
  "/_nuxt/index.DJbKZ8rG.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"b7-Upm9OcBMiN2wfa0tMjguTr9i1uo\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 183,
    "path": "../public/_nuxt/index.DJbKZ8rG.css"
  },
  "/_nuxt/m09vb5r-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a7b-ndw+LZxVcsrqUjzDwkK3jhq2YhI\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 2683,
    "path": "../public/_nuxt/m09vb5r-.js"
  },
  "/_nuxt/mq-KkNWq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2480-fxE1QBcbmOSoL0Hfo3kBfDRcyA4\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 9344,
    "path": "../public/_nuxt/mq-KkNWq.js"
  },
  "/_nuxt/mqtvlzVQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ff2-kY9tADYq4gD9DJqBvMOYs81OFM4\"",
    "mtime": "2024-08-01T03:05:11.857Z",
    "size": 16370,
    "path": "../public/_nuxt/mqtvlzVQ.js"
  },
  "/_nuxt/ul-Lp4lw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"97f-kjzBJO+VFOdnpnLALf0tM6MUBVc\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 2431,
    "path": "../public/_nuxt/ul-Lp4lw.js"
  },
  "/_nuxt/yf5bffbF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7dd-nqHoMPVQej6qBGTuXjwWM0Lmb+4\"",
    "mtime": "2024-08-01T03:05:11.858Z",
    "size": 2013,
    "path": "../public/_nuxt/yf5bffbF.js"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-1fNGWyBHeK3FxLmHZL01oqoqs/g\"",
    "mtime": "2024-08-01T03:05:11.618Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/_nuxt/nuxt-monaco-editor/metadata.d.ts": {
    "type": "video/mp2t",
    "etag": "\"e1c-KR+CusNW39xWhtVcTpu2Qo8udNk\"",
    "mtime": "2024-08-01T03:05:11.742Z",
    "size": 3612,
    "path": "../public/_nuxt/nuxt-monaco-editor/metadata.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/metadata.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3b61-qhNNMCR6pP7sDhAaXxN4iLRwDig\"",
    "mtime": "2024-08-01T03:05:11.732Z",
    "size": 15201,
    "path": "../public/_nuxt/nuxt-monaco-editor/metadata.js"
  },
  "/_nuxt/builds/meta/d1a5f0b3-5d3b-4239-bf45-699c222dd486.json": {
    "type": "application/json",
    "etag": "\"8b-fwLRuQFRghZWwQncuFraBssP6mo\"",
    "mtime": "2024-08-01T03:05:11.616Z",
    "size": 139,
    "path": "../public/_nuxt/builds/meta/d1a5f0b3-5d3b-4239-bf45-699c222dd486.json"
  },
  "/_nuxt/nuxt-monaco-editor/vs/nls.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d0d-I4Uya4ZQAwD0yPBqNPbeMI20Lug\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 7437,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/nls.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/_.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c4a-ZOFQ7Lbb2tArMKFGh+HhXpPfz2w\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 3146,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/_.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/monaco.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ecd-YyC5pNKk9uGWgy64I3UK8+xMnhY\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 3789,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/monaco.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/edcore.main.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3df-6rMnrjw3CpU4H3xoZHOKmHlddNc\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 991,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/edcore.main.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/editor.all.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fe7-zfIC9ks7jXGK0HvGNMmOCEynbbc\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 4071,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/editor.all.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/editor.api.d.ts": {
    "type": "video/mp2t",
    "etag": "\"51de6-8r0u5Gz/IG0cAubngBrv0PY+DgA\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 335334,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/editor.api.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/editor.api.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b11-8OQ04fC3rQ2T6DgFNgQGiiJHQK8\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 2833,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/editor.api.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/editor.main.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"111-ZahMRjGyRXO68Hw0/sB1RqLYc9s\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 273,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/editor.main.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/editor.worker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"422-a25mCAEkNlFHwh2geJglpelZ2h8\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 1058,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/editor.worker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/browser.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a03-QC8wynBjNn45nBtS0zbYYyiWPcU\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 2563,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/browser.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/canIUse.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"698-sua1aGdkfnIhLZ4oiDMa8CRlbrs\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 1688,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/canIUse.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/contextmenu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/contextmenu.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/defaultWorkerFactory.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1777-s9oSRzRsC4A3O56AqjfhXm7TXlk\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 6007,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/defaultWorkerFactory.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/dnd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2cd-WR0ubCOGeFsWWDwImwkMXuZgVOQ\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 717,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/dnd.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/dom.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d7c3-shzk0TBm8e9l1I/0+EujqvUfwJ8\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 55235,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/dom.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/event.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"366-JHNldDVPix6dpJNf5p8L4CSoshc\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 870,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/event.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/fastDomNode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1eb9-Kmp0eq2A1rQ5TWAPosNyN4YxYi8\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 7865,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/fastDomNode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/fonts.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3a7-plkOWf3quqxKfw9PHg7xN1MKbnk\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 935,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/fonts.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/formattedTextRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1742-6fKQiZQvjdJLWuy6+we0D0fYV14\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 5954,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/formattedTextRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/globalPointerMoveMonitor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"db4-b559om4zbOqT/q993HdaM+WbVfw\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 3508,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/globalPointerMoveMonitor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/history.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.767Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/history.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/iframe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dba-QNJHT6uD0LjNh509IO8KopnTxXA\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 3514,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/iframe.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/keyboardEvent.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"142d-oLIzzMsxvLXQvYbFsdaIMJ/KyGo\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 5165,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/keyboardEvent.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/markdownRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7f4b-20iPWKQsE29uytkR76XKohASnBI\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 32587,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/markdownRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/mouseEvent.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1959-0/VZcbi5rv0sTaqm+bHB/iiFv1U\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 6489,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/mouseEvent.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/performance.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"265e-iQ2hjJjPCeM8ZtY/J4BuJWwDrmM\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 9822,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/performance.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/pixelRatio.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f89-Akr4GgUk3U61qJoUMNr92sayJiY\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 3977,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/pixelRatio.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/touch.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ffd-fv4lr+w1q3PhaqXtu66SouOt4Xc\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 12285,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/touch.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/trustedTypes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"48a-XjZ/f3sEZIkqNKN02vukqbaNxp0\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 1162,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/trustedTypes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/window.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2cf-yiZecyIapcsgBwkVSYpmAE60QUM\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 719,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/window.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"326-ZE1mA8C/O8WdHHD5fcxI4CM70DA\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 806,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5b63-ydpQIn4DAv/ISC1Zu9VA/lOSg3U\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 23395,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/abap/abap.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"359-VqELVX/UkvfYNGDHDSMO5dWQGu0\"",
    "mtime": "2024-08-01T03:05:11.743Z",
    "size": 857,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a97-YayZLxDYfYx7miHy97u4IRVbdN4\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 6807,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/apex/apex.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"333-5yqHwjYr96dnKkxUWmhhJ47oSdY\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 819,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6bf-eqosdIeFPzoTpIIBX/MRXHMZEo8\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 1727,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/azcli/azcli.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/actions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1379-Nlu5WI0kx83scZr3EryvEAi+Vvc\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 4985,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/actions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/arrays.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4011-DwJ758/016mEaPag5hgUT2lpNH0\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 16401,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/arrays.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/arraysFind.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17a8-LbumGgMsi4v2T3hGDBYZMJJFMwU\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 6056,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/arraysFind.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/assert.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"79d-AFJcUz8t/sfJasOcKULT5AXas3w\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 1949,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/assert.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/async.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6db2-bsYmr1usSXVlbA0n3l5c0DeZyEs\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 28082,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/async.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/buffer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a2b-Y4QiUBRXlZW2Dze01ch0Q9KfwiM\"",
    "mtime": "2024-08-01T03:05:11.768Z",
    "size": 2603,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/buffer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/cache.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5ee-LMr9vfZpR2HjpPlZs79Jw3F9pr4\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 1518,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/cache.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/cancellation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ef1-4UJ4zcd1tL1a2ubwrj6ZipXYtGk\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 3825,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/cancellation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/charCode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/charCode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/codicons.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9ca-e+7LTXgFarn6rj0C5O7g2B8d4uE\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 2506,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/codicons.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/codiconsLibrary.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"71cf-oZaTSFO7fzpGSu3/KSbglX6/Mno\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 29135,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/codiconsLibrary.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/codiconsUtil.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"252-ym8Dj7zWsdDLKl3k1z0192SWdbo\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 594,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/codiconsUtil.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/collections.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"461-AT070fIp6mCq0Iwe0DCnwBE6GpM\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 1121,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/collections.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/color.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4496-Yct8ajDxm8MvJVAxNSvu6yH25Vg\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 17558,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/color.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/comparers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e2a-ar1b3kBbdDjTH2HL4qrmJcOYVVA\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 3626,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/comparers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/dataTransfer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fd8-BrOPa+AgAY0eBkRDRALWNTCvmhI\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 4056,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/dataTransfer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/decorators.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"395-XFuXhkiu20ho+SBNneYHG45yuDM\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 917,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/decorators.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/equals.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ed-sVEG/B9LQPgPdaegoAjyh747Mbk\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 1005,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/equals.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/errorMessage.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bd3-WPfffIl1GSguF6LjvIjww1rjxaM\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 3027,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/errorMessage.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/errors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11dc-sBUwm1TdtlgINW7HIaFmQok1pTE\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 4572,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/errors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/event.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bd02-H8FyJmj8cvUyw92JNR1QW8UPKkw\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 48386,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/event.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/extpath.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1571-nVJOoHEk5zerpjj0B0O141Zt/bQ\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 5489,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/extpath.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/filters.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"749a-kDjHxGQ0ZlPyCr0axCnJ22ZtPB8\"",
    "mtime": "2024-08-01T03:05:11.769Z",
    "size": 29850,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/filters.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/functional.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3d9-0vMlwu52ST+TKfCswTd+xRESkDw\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 985,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/functional.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/fuzzyScorer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"164d-EjK79zbPTNBcHCFmiEz9PA79ve0\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 5709,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/fuzzyScorer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/glob.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"587b-vryzHb98gkHF/Pm3mpYMvTa4fSQ\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 22651,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/glob.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/hash.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"270b-gv2i/XNlm7vOi+zeba1OdszRnC0\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 9995,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/hash.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/hierarchicalKind.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"428-P0SXSfnEz6WoS/mHzn76WbcUrtY\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 1064,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/hierarchicalKind.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/history.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"919-iQCj5B9Gimg3in7++DNr7jBbVzg\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 2329,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/history.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/hotReload.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c26-5U8vHHBa6hCZqcFx8rR8m8XKeGk\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 3110,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/hotReload.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/htmlContent.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1822-7/wtZwr7shPYfcvttGSZI9GZ+XA\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 6178,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/htmlContent.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/iconLabels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f84-4vDaFHFyJizhMO4Pkm+pC+aLzv4\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 3972,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/iconLabels.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/idGenerator.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"253-gyZfLYil8hx36SHMIjdFsszmWYw\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 595,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/idGenerator.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/ime.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"381-+uAmPIUHxY92qq/HV9SVD6sBatg\"",
    "mtime": "2024-08-01T03:05:11.770Z",
    "size": 897,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/ime.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/iterator.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1090-Ez60mL3HlACl07eMU2RpxKTRf9w\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 4240,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/iterator.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/jsonSchema.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/jsonSchema.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/keyCodes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7e4c-+qJVY3zYfdUjwpfz/tAptGv+zWM\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 32332,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/keyCodes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/keybindingLabels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1775-0t0WwYtVEaXVm1Wf2ZrDppgGBEg\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 6005,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/keybindingLabels.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/keybindings.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f3-+C76AqDrB4t+KyxkZHmNvQawINE\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 5107,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/keybindings.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/labels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"157-ACQSNHNgaMDGW5poz062Zl/gGCw\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 343,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/labels.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/lazy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4ce-kXrIpi30R5cpISa6AR306HP0PMc\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 1230,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/lazy.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/lifecycle.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29d1-iWczNi43TOQHIk1DEwweBwtoncA\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 10705,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/lifecycle.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/linkedList.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e0c-Vs7iYrzOYaL7njxnvF0qRFsblnM\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 3596,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/linkedList.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/linkedText.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7a7-kdw13lin3rLldi39/1Gii6byv0A\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 1959,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/linkedText.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/map.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fcd-Mp86eU5O6jZNphxTKKD3cb+3+Lg\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 16333,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/map.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/marshalling.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"71b-JmIM4KYgSobIJc2da1KUMMmr6jY\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1819,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/marshalling.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/marshallingIds.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/marshallingIds.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/mime.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e3-qWdpQjsKTZQUaf9hU+4KVpaToQ4\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 227,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/mime.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/navigator.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"46e-xkRElqf3usgN60dCPb9vnPG7gHQ\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1134,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/navigator.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/network.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23ac-cjaVnrJZiRTiFezPSnDhEmTByZo\"",
    "mtime": "2024-08-01T03:05:11.771Z",
    "size": 9132,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/network.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/numbers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"59e-yNKhE/FXxfGlybHidXaPjglAZrs\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1438,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/numbers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/objects.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14d5-2v4iKN+en9C4KOqQW/D/gAbkdCc\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 5333,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/objects.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observable.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4d2-nEQrN8gnpxXrCCn+hbNnHdDKy4E\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1234,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observable.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/paging.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/paging.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/path.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d0d4-wPyazXYQ0kiEV6UKNRCp9Y2eY3A\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 53460,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/path.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/platform.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bc8-KyaEqXBv18VJiTsFIx6NIIEGRPE\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 7112,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/platform.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/process.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"815-0cs2RWMC9ufnJX1rwmacmZEpf2w\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 2069,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/process.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/range.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"691-50YVUqnweKnRO8hPc2cXJL6nTI8\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1681,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/range.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/resources.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c96-KN019fap6+jgo3MyhT37/9HWY7w\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 11414,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/resources.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/scrollable.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3484-fPEqUKOm/Wiiqu/WlxHQZpp2h0w\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 13444,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/scrollable.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/search.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a07-yA2TBtr6o5NjmgzFPrPbwCj/ajY\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 2567,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/search.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/sequence.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/sequence.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/severity.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"70d-pGMkm//iJiQjo3jqrcVGtgY29Eo\"",
    "mtime": "2024-08-01T03:05:11.772Z",
    "size": 1805,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/severity.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/stopwatch.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"468-BX2XL+gEAPRPM9nl4YuGgbk2OTU\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 1128,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/stopwatch.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/strings.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13fad-Zlu8PEh95cqSI6CBBpyV7C2D+e8\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 81837,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/strings.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/symbols.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1df-IzXQhtn0oeH+DqR7jOkC0w4iE14\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 479,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/symbols.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/ternarySearchTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4ea6-hpXbXL5yCTcc0jUnQJL2NF/k8tU\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 20134,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/ternarySearchTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/tfIdf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b52-DweLpF+HqzcXUXE1e+X8paht+LA\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 6994,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/tfIdf.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/themables.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cf6-Fh6ru8x5afuTs9FNK+qXMPkcNq4\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 3318,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/themables.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/types.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f80-lOC1exNb1/N+DramrO9cyY4oZMs\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 3968,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/types.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/uint.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2eb-+Es965cixj6d7ChNfU7Z/WcTzk8\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 747,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/uint.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/uri.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"57e7-lfCWi2QiPxyS/Ay+uIE470TzO+g\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 22503,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/uri.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/uuid.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"715-vEdNxNhMi9WgB7Esr0WZlunrYbE\"",
    "mtime": "2024-08-01T03:05:11.773Z",
    "size": 1813,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/uuid.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"327-fsaKj44raWUikFGcRcyyGl0+VfA\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 807,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c02-OISNPTXapaeD1aEuE/EYCp+rtsU\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 3074,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bat/bat.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"326-qYIkN7QNKkqZhDAgxK7rVLs+cOE\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 806,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f09-ziwN3Rb3lSqijvnSiTu4AmiyxwI\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 3849,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/bicep/bicep.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"357-dNwZl5LTazPnHd+QMqGtgNcOEB8\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 855,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3823-WPr6irFLcjw+6Akekkp/6vMjvgU\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 14371,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/clojure/clojure.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33b-vajcJOQFcAo8I/tDhO9TDKdTbgg\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 827,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f64-yuECdJQyPbwAM7EhNuqBTiXdhAY\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 3940,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cameligo/cameligo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"478-tfBGHTnhZIsWL2eYZn+9sOULAC4\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 1144,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"21bb-RzZw+/VFwBrohjbErhMMsRsAdqw\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 8635,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cpp/cpp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"38f-pzVjWp5J3ANJE3CUdDSOukwmX60\"",
    "mtime": "2024-08-01T03:05:11.774Z",
    "size": 911,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1731-XWtVan3eQtR/Xf5H/dMctOPblCs\"",
    "mtime": "2024-08-01T03:05:11.751Z",
    "size": 5937,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/coffee/coffee.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"341-QsQUBb5VDZHj270+oUsmIsHA3qc\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 833,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ced-o5MhX+5xYNLD479ddu2Kij63qiE\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 7405,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csharp/csharp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31d-RO86IjnkaWUOR1PBPb3BvoZoOgg\"",
    "mtime": "2024-08-01T03:05:11.750Z",
    "size": 797,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"84b-L7vd0KT2aJ1gX4NnQwcgq+d8AKc\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 2123,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/csp/csp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"338-lLGuruy5oK6aK9a55axnVhBEVVY\"",
    "mtime": "2024-08-01T03:05:11.751Z",
    "size": 824,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"197a-4LgBKPBRIjaHzJw34aV81rWbNrw\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 6522,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/css/css.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"344-3irj9ggw7sJVBgnhvADc38yXTEI\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 836,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15cb-e/3/tYAipCd03XAFmznjXOmYKz0\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 5579,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/cypher/cypher.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"35a-EuUFuFQn3Z7MrppOPacsebz919c\"",
    "mtime": "2024-08-01T03:05:11.751Z",
    "size": 858,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1af8-DEzZey4CQtcwokuZoTZZxQMgGdo\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 6904,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dart/dart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36b-zz8mP7NCmwDlUbu3IrqbxJc1shI\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 875,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d7c-yiCf6BUvcwogXECulWcQSHgqL3Q\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 3452,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/dockerfile/dockerfile.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"324-ivZlUHNxw40DIkxSATTPR2L70H0\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 804,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20a7-l2oTEED3o8pP6IYby7LF3K56O/A\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 8359,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ecl/ecl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"342-Qn4/NLd87pcDhXJtHOS9U5w7L7E\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 834,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4ad9-s7n3vGSYALQlYkcLr/INRQuKcP4\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 19161,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/elixir/elixir.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33e-P5mb6DGxEp7f4h75tENid6SEFgI\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 830,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c6f-JqPTQ7DRCWz/riHWPbJFC2+P9pc\"",
    "mtime": "2024-08-01T03:05:11.775Z",
    "size": 3183,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/flow9/flow9.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f30-PMcmD1aje31Rk2i1II9+kUB4VJ8\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 3888,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a9dd-4CO6ki4sFrJzZCAZ+zhSLQfpgdE\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 43485,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/freemarker2/freemarker2.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"366-KHkx5KY/KGY1CxllMewquRzlwGU\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 870,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1348-TnJurWUSzyirUsuYLUm2tGJk04s\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 4936,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/fsharp/fsharp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"30e-W2Ya5EU0v7MxmKOxXYe4Lr1QizY\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 782,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"132d-UrPvojCi97Orpwm4CIbw3RuN5QI\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 4909,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/go/go.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"376-85FCepjIh2nSvc9vjkkQaYvgg64\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 886,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1064-P83+k5IK6xnLm2rKejyjhckEukY\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 4196,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/graphql/graphql.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"398-ielSibYWKfXNH/rSBbA/jg/ro0Q\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 920,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2dab-zDBRt24z6pL7IGNZEpQGKjE1tU8\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 11691,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/handlebars/handlebars.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"342-A36TpeQ7tzir9/1O1EKFP7zmwPs\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 834,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15f9-wghO2MngZUPHjikBh9iZrgMYsJk\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 5625,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/hcl/hcl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.830Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3cf-B9rYSD3Ewga0cqxb4f3A66id7To\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 975,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22c1-tmANZ4YA7P34xyzpdwYRapmgpu0\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 8897,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/html/html.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"384-jxGPLUdS3MpALufh5Jt7iWdO/Tg\"",
    "mtime": "2024-08-01T03:05:11.752Z",
    "size": 900,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"827-7HoaXbs1pz/SRR1Crz1aZg5lnpA\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 2087,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ini/ini.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.830Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"362-O7s3DJnBtbOCmsIVHNF27YIgnws\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 866,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15cc-CepYwzMHopVPSXATKwExk52IhCY\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 5580,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/java/java.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.830Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3d4-KgGTfeaLgarVThplch1olTuS24g\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 980,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6ae-B8wwsNIDTzJiDdDhwMiyWci6Yaw\"",
    "mtime": "2024-08-01T03:05:11.776Z",
    "size": 1710,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/javascript/javascript.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.831Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32c-dHsStKABJDOpOX0U3aHKDf/t1sU\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 812,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b24-ixPHtx7Iw2mPke+NIAsqDtAaFDM\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 11044,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/julia/julia.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"374-6lrg0L9OVac90rTv+4sXqxMcQWU\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 884,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1625-k1MavSdbIQHH1iA1LYi8pyt0wrw\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 5669,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/kotlin/kotlin.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.830Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"351-OWlbWiuNl6eziVdLFb7XIdXchHk\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 849,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"152e-Cnq4JW/W0RH1TWC5GRV3lBefZmQ\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 5422,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/less/less.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"324-g9S6xns0ckCIedyP3akSkAg6ZyM\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 804,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1089-ihI9d1RGz+68FnhNR4ePTEZHkqg\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 4233,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lexon/lexon.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36d-M98LeHrGJSTaKpXA/BcVkb2E7rU\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 877,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1918-Le/erqgpo+Z6Zb7Es8lSfQtLhlU\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 6424,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/liquid/liquid.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31d-kbfQE/HsyvBxR2gEFDy7cXXFr0Q\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 797,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f0a-mF6oUBtnbpiL2+xxGxAv6lOtVmw\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 3850,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/lua/lua.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"345-pap3R7mnfFo2S+R0bN0welVY9K0\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 837,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11d9-PuPhQn63Cfb8++aRK+WzE6CPu4E\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 4569,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/m3/m3.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"38a-s1suZZGmX0HSlClOBfssEEsjPDE\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 906,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ba6-Z4musq0+F/ZKAkrNZZdeqAOt614\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 7078,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/markdown/markdown.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31d-jwO8t+326b+XHLRVm0d+2BufsnU\"",
    "mtime": "2024-08-01T03:05:11.753Z",
    "size": 797,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c6b-+g+7+px4PTorpdoHEyWSpkT49/A\"",
    "mtime": "2024-08-01T03:05:11.777Z",
    "size": 7275,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mdx/mdx.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"362-oJBIO5nE9ue2XTnuIiv30et8Ny8\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 866,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11ce-4dXDJToqZWj9N5TI24jb7SIK7BE\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 4558,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mips/mips.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"335-Q/E8C33mt7xZyq6Pb7Mf2IElZf0\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 821,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1cca-JavqzUs9twSZcr80BPIRPFoz1mQ\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 7370,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/msdax/msdax.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34c-PPe5m9IkJ0C+YSyLluVV5zKXDOM\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f4c-9cw8RdhAdh1oGRUe2PC0V1MwzRw\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 3916,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/objective-c/objective-c.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"327-sn05JG0ZgN+0jL9HCunEsDWlvNs\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 807,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40c3-dSyG/d58+7b/2dvW/P61rXQ1+10\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 16579,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/mysql/mysql.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"377-A15UNx4QJtzKrY2KF1hijTkujF0\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 887,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1411-vReCxQf7P0H8ZRuKMngbMrxDNlM\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 5137,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascal/pascal.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"349-Uv8PwJB23kHWRWmoCOiA+Ohn6xw\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 841,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e60-IZ/iZfbbp1EebPqqeNleQ9bxs9Q\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 3680,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pascaligo/pascaligo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"329-6T0vRFEt/sjmOn9P6AqchBe/iDk\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 809,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33b7-5NDMY4RFELPtVTYLC4h+CD0ZGTo\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 13239,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/perl/perl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"340-22DNMZVf7ID70hefzXwZo0nFzlw\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 832,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"48ed-abDd0PJ2F2/lRJHNwjFFr5c0NIQ\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 18669,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pgsql/pgsql.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"365-JrBiOc6zV5+wz/4Yf7fMjFnkNeQ\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 869,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3265-PEFjzUtt2U8Jv254ql4x9RRnoqQ\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 12901,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/php/php.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"302-wUGE9/B7i21feTGM31ZkUx5syh4\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 770,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cdd-wAyQL8XuTK6jgzJau4wV+VXH8lQ\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 3293,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pla/pla.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"357-dBmukgnQEWZqSvee+0trSetWGCQ\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 855,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4d14-niaHsGrbyCpzQHixVpKUEUFcI5Y\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 19732,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/postiats/postiats.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36b-/N0MDLuvCpN+Uq/jB7WHkcT8VLw\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 875,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"563e-2j53jrZRHOcinTpDC2KY9oiOUHY\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 22078,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powerquery/powerquery.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"374-MiqsF73h1lOK1WuHdkOuq5buKK0\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 884,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16bd-rxcZi1T9QFJbLdXO38rDpPKX6Wk\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 5821,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/powershell/powershell.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.832Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34c-RNH2xh6U9otLgEAJftrYn2yvaYA\"",
    "mtime": "2024-08-01T03:05:11.778Z",
    "size": 844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3334-9h4XIqQ61xWo4Vy5YERmi4amW+I\"",
    "mtime": "2024-08-01T03:05:11.754Z",
    "size": 13108,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/protobuf/protobuf.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32f-mMMb1gh1Do0olxrbEatOjt/xVi4\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 815,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"21ea-KIbe8U3stXcvmf8l5S7W1uFdnOo\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 8682,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/pug/pug.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"384-nSwJ0+E3DURsZchL6sEhy+FyX0I\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 900,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e4a-aTKeiq1a6AzOi3jEdtBZp8rYhvs\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 7754,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/python/python.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"330-w0L89L+GBpEztT0zYRvqCL1CIu8\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 816,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1434-cUJBvPcljBF8ZjUZbMe5JQ+5aqU\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 5172,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/qsharp/qsharp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"334-aKbRh8r/VVgcC4Gv9SJMyHx/2Ls\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 820,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1460-jPwUgafLlSdlGNL/Na0OGLlEw28\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 5216,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/r/r.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"350-VCykil8sNPZ87GgU5BAQLdhOnFU\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 848,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3911-6E9IfgtzpKwm9vwqsTNaU3IPjNs\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 14609,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/razor/razor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"326-tgCsvjNqcx6KEHBlXk+Z/aIO8n0\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 806,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1629-IuqpHI60OtgmPL/XHqqZVYLgKuc\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 5673,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redis/redis.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"33f-0heWLpVGgMFyux2QcUJwkpkZyJA\"",
    "mtime": "2024-08-01T03:05:11.779Z",
    "size": 831,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4174-qk9LVAu1BG9RvDitpiuv8KxePUk\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 16756,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/redshift/redshift.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"385-Y184cHYsp13a7MzlyMG55SwO34A\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 901,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"168b-Jd7GDG1/ROu5VJg3EPS2UhaszNA\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 5771,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/restructuredtext/restructuredtext.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36b-bYlSLvdIloOra532Q6S6a6vWVmo\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 875,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3d77-MEbYaaVw+UqkcgIMMbBAt7GGVp8\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 15735,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/ruby/ruby.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32d-bONonL0GBiC8+CRIF18lIL0vFkw\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 813,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a25-c/kjo0Y/TvFA087ZMkQ35VGxov4\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 6693,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/rust/rust.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31d-Gm/uQr+H3xJUddDi4br7zOWxSf0\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 797,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c9d-g/zRj65EwJ0d0AKXMqsQlJMq9H0\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 3229,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sb/sb.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3b9-WezobhHQwv3JsZ1ZsZIUpf9VIFI\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 953,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b73-9Dv3zm+9qWVxdfkG7yTk/NytSco\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 11123,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scala/scala.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34c-hVlHp0sL9m9zSL7VaW64VnbvtFc\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"adc-z+b+NBxOSusErEMIVSWa6FDf+CU\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 2780,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scheme/scheme.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"359-vRSIae2PgAvn20g4AdsfcfNsMBs\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 857,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2511-VUHZISgjrEMaQu0ttQlWeJDbhE4\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 9489,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/scss/scss.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"332-JFVOxiWt4bZrZcj/jiJ3dW+aZyE\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 818,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1329-HPo5qFk2IanXljQdSoSFCR1wIx0\"",
    "mtime": "2024-08-01T03:05:11.780Z",
    "size": 4905,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/shell/shell.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"347-ZgOxUlkCONg7mqEw9r0pkSJ9Nok\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 839,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6756-Jo0usPpH18njHQ+EyCD/WUFvhfY\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 26454,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/solidity/solidity.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"339-AwAWy9q2tAoivOdy3blN27BmoJw\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 825,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1258-e19dKIqhgQm6GWQ1AUkPd1iwmdg\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 4696,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sophia/sophia.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.833Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"334-gVj+M5R6U9ofxWP1tX5F5KxYFXc\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 820,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1108-0NPCBwLVAgwk+4K8Dut6vhaXAvA\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 4360,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sparql/sparql.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"316-VZfdKfNh/kGjP2pVkp4DSUSbMdY\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 790,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3e69-R3evtYsr1+fTf3oVDNqBx34vhgc\"",
    "mtime": "2024-08-01T03:05:11.755Z",
    "size": 15977,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/sql/sql.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36f-BnJlcjv5G1AoKs50nRzsSEhuRew\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 879,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2949-eeG569a9i5Hg8sDxhKvDXPA2c1Y\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 10569,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/st/st.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34c-Ud9OH2l77Jd+EaXkcRBR6x4jRO4\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1db0-yTJeEalAHFbJ64mdWiN1Qj18X+g\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 7600,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/swift/swift.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4e9-Tt4oaZDjoBMJzpgbwGTF9NYj5So\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 1257,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2f23-19BnidCGJpLJe91DEgnaYVnLSEw\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 12067,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/systemverilog/systemverilog.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"343-oAKHEOS7O+Qak3UMBKq9ugoPdA0\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 835,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"155b-7hzBgDsabLBmu8dg9f20HaURxtA\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 5467,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/tcl/tcl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"344-RVmQVeL6QOmP+ubn01CpfXno+0Q\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 836,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29b6-WIMwLD4eE84YdqU52zh97f36tRY\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 10678,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/twig/twig.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"394-L9HIyYcnPVYZ5oXoYDa3sODJTuU\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 916,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2421-jV6gJ/atJ0lW5AchmFHuwPOEeAo\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 9249,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typescript/typescript.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"339-oEfgMSEXxfXQiwH8XRXDbFrVCSw\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 825,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10d5-LnVY6x1jPDNEB4j74Xm8Wwee/Eo\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 4309,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/typespec/typespec.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31e-R10v7DUJ5TmTz472WuV038oe4QE\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 798,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2229-3LK/ZL36y4tD5H/BbJyPyrkL8As\"",
    "mtime": "2024-08-01T03:05:11.781Z",
    "size": 8745,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/vb/vb.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"341-CdaSAingvg4QrPgI7D98HECvRqs\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 833,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"27af-eGF1Sy6Yy2mGOjiE4gMc+4LdpRk\"",
    "mtime": "2024-08-01T03:05:11.756Z",
    "size": 10159,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/wgsl/wgsl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"490-3po9QhyOiB3d1hy58KetQysAHX4\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 1168,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ffb-40Jyn0rF1OrwNgi814AflO+AS74\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 4091,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/xml/xml.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"370-T2yLTd2eGr4yAeiPfruE0UiEo8c\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 880,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bd8-q+PFCo0nSp6stC6UmwXrDSxMkYw\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 7128,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/basic-languages/yaml/yaml.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/coreCommands.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/coreCommands.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/coreCommands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"125d7-nKUyTmbaEEjqnEfOy/fAw+s/vqw\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 75223,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/coreCommands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/dnd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cfc-HrZeCsUMltUBGX+uxCw7aEdUGSM\"",
    "mtime": "2024-08-01T03:05:11.783Z",
    "size": 3324,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/dnd.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorBrowser.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"58f-bu6/FDI1dsjHhaMSfOl1tJO4TxM\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 1423,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorBrowser.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorDom.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c79-QV2pS3pRBWZ1nRqkL1WyboHnXV0\"",
    "mtime": "2024-08-01T03:05:11.783Z",
    "size": 11385,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorDom.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorExtensions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4684-b5wkYZBgkXat64Mc5x2oTlkBk8s\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 18052,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/editorExtensions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/observableUtilities.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3cb-YIzPyDJqRqYYSTz8doJWJUB03g4\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 971,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/observableUtilities.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/stableEditorScroll.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c06-JYA35DGSPDsQ+TfbD7XIz53XIUo\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 3078,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/stableEditorScroll.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"73fd-gEEApIAEr433pElqyt2OqUJpuzg\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 29693,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursorCommon.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3009-UbfZwzcnYAy98xo1/9YrNNrUNoE\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 12297,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursorCommon.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursorEvents.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursorEvents.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/editorAction.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3cb-XX0JpL0sOSiklcPs8ecgZHPgGw4\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 971,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/editorAction.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/editorCommon.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f8-hc4g36TV5IxEURdSqoYcW3soDcs\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 504,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/editorCommon.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/editorContextKeys.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b95-Gfhv5FAmBkqMGi+qugHCUGjpW4g\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 11157,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/editorContextKeys.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/editorFeatures.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a3-hEGQFk2b1DoLmHd05qzgfSJRFjw\"",
    "mtime": "2024-08-01T03:05:11.784Z",
    "size": 675,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/editorFeatures.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/editorTheme.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a4-Ne4qmskHjdy5ssgVmhhOfclXc3Y\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 676,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/editorTheme.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/encodedTokenAttributes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ce9-IJUHbQfII/w+l/Z1BsMlBVkzAXQ\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 3305,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/encodedTokenAttributes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languageFeatureRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17ab-kP736mVCT1jiJuYo5xGAMG8Xnf8\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 6059,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languageFeatureRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languageSelector.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f3a-V5mZVBrgYLKel2ecoO4bqfi3Tlg\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 3898,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languageSelector.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40f4-2TlV1METDYE7oZ16m4IWZ/b7jQU\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 16628,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"127e-LLgC/I4ZbM0h6UlRwTskBGseYC0\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 4734,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/modelLineProjectionData.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3365-5bbx9Aritj4UfKGuphq1Vr4zcAY\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 13157,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/modelLineProjectionData.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/standaloneStrings.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9f3-gIFO66ke8/ZXD5huZCLtMJQzqXc\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 2547,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/standaloneStrings.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelBracketPairs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"76e-59X8TMDJja0nA0NrlwAnMyaMBT8\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 1902,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelBracketPairs.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelEvents.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"189d-2yvLe+ClS/iwcPrYVoIWw9wyT+w\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 6301,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelEvents.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelGuides.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6ce-ks9D5IulEvsSd07sbUBb+4yCImk\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 1742,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/textModelGuides.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokenizationRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"107b-DCGTi4wkTRXtVmVYA0ZK8RA2HNw\"",
    "mtime": "2024-08-01T03:05:11.786Z",
    "size": 4219,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokenizationRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokenizationTextModelPart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokenizationTextModelPart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewEventHandler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1894-2+apWqgFoUf5C2QpC+2O7UsS3aQ\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 6292,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewEventHandler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewEvents.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1576-Dtx407ed4tCOofTGBZzY4Ct0DrI\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 5494,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewEvents.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11cb-aPQvVOscSn/Yyg5LuLo73jXM6sY\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 4555,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModelEventDispatcher.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2da2-xcU/5dX233L5f8VdLyIxQJXf3YQ\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 11682,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModelEventDispatcher.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/css/css.worker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"131322-kqPYmx1gIYn70HmPinMNeK4K3Ms\"",
    "mtime": "2024-08-01T03:05:11.785Z",
    "size": 1250082,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/css/css.worker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/css/cssMode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10e25-1OZhTvKOJsrWQ2mRCtka+vXZMg4\"",
    "mtime": "2024-08-01T03:05:11.744Z",
    "size": 69157,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/css/cssMode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/css/monaco.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/css/monaco.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/css/monaco.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1203-nvyieKcwBr3n4geEnzUiD8dst/A\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 4611,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/css/monaco.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/html/html.worker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a5b77-TuPXMBdaAry2mOgECQP+iujCF24\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 678775,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/html/html.worker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/html/htmlMode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1121d-HDYUOF9HuYxjrDE8SM/wWdI0eRk\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 70173,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/html/htmlMode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/html/monaco.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/html/monaco.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/html/monaco.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1454-o7rooeB2cBsN1Z9yYegTDmRn01Q\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 5204,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/html/monaco.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/json/json.worker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"45e79-o73OPBXm4ye6fID84vZEIBf2AnM\"",
    "mtime": "2024-08-01T03:05:11.783Z",
    "size": 286329,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/json/json.worker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/json/jsonMode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"169b7-3+dVbIjcJi8w03W7cL62R8mQC2M\"",
    "mtime": "2024-08-01T03:05:11.783Z",
    "size": 92599,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/json/jsonMode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/json/monaco.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/json/monaco.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/json/monaco.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e2e-/bXh8V2b5+SJ0DDN85NZbF1XaF8\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 3630,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/json/monaco.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/typescript/monaco.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/typescript/monaco.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/typescript/monaco.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2701-zePyH622ZM25qhTGCNmXZFXdoFM\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 9985,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/typescript/monaco.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/typescript/ts.worker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"aac179-0NN86ETw7KQj9/nW3ru8xOD0GMQ\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 11190649,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/typescript/ts.worker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/language/typescript/tsMode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ab3f-wSdvl7+ZMLPlDomi88uVggNSPVQ\"",
    "mtime": "2024-08-01T03:05:11.782Z",
    "size": 43839,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/language/typescript/tsMode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/dompurify/dompurify.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e241-geWwsjeOkJd89f2E4bB+pbfkXKM\"",
    "mtime": "2024-08-01T03:05:11.744Z",
    "size": 57921,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/dompurify/dompurify.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/widget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8b6-f06DSzv8Nh10HWfIP5iOXEe6XyI\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 2230,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/widget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/diff/diff.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c705-JzMpl41B7QV3TCXZqbgqmyQS6ms\"",
    "mtime": "2024-08-01T03:05:11.744Z",
    "size": 50949,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/diff/diff.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/diff/diffChange.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"51f-l8iA/0DM7FeHhShLhKPSC/7EciA\"",
    "mtime": "2024-08-01T03:05:11.787Z",
    "size": 1311,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/diff/diffChange.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/marked/marked.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"18575-bXuPoQVVDUdv10SLVxKWOJQMUNE\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 99701,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/marked/marked.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/naturalLanguage/korean.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3050-+lrD4tleHyh1mS+f2DK9ncp0AuI\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 12368,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/naturalLanguage/korean.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/worker/simpleWorker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"41f0-omyP8fopbEAy2s9pbS4uX8aTLOU\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 16880,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/worker/simpleWorker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/autorun.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1cd8-WU0xpodQ+8f2lzdvNqMkN2hx28Q\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 7384,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/autorun.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/base.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2195-YK5dADmQ1uZiq2WFYlmCc7G65uI\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 8597,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/base.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/debugName.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d24-bVJT/zK1VL9FjcrAFajAN7B/s+0\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 3364,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/debugName.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/derived.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31bf-nuLdaQ6M941zlfKhrgy8xqMia2M\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 12735,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/derived.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/logging.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1fd3-jJfqbHOwcmO9nir18aWpXWyv/OQ\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 8147,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/logging.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/promise.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"89b-po/ScFWLTWOu0WZ3TTID/ZKxL6A\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 2203,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/promise.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2af9-gmW0MBwYIJAVpE78PxbmxdEZeOc\"",
    "mtime": "2024-08-01T03:05:11.788Z",
    "size": 11001,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/common/observableInternal/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/charWidthReader.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fa0-RwmAReiMLmSLaDQLN7wZlP2IdpA\"",
    "mtime": "2024-08-01T03:05:11.744Z",
    "size": 4000,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/charWidthReader.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/domFontInfo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"591-2pjU8z80TonqLEfCPZwIcVf9dFA\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 1425,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/domFontInfo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/editorConfiguration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2f43-FcM+ltBpNXmyCOGhp3TMFmdIFao\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 12099,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/editorConfiguration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/elementSizeObserver.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10ab-/LCTIYHRD2/e7ARFDks0YMnO4rA\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 4267,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/elementSizeObserver.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/fontMeasurements.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2866-11zS3G5TaWybwt1lCObeWFPGpdY\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 10342,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/fontMeasurements.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/migrateOptions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20ad-0+UuKowmemPMK8tqOsjlWF7+dcA\"",
    "mtime": "2024-08-01T03:05:11.789Z",
    "size": 8365,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/migrateOptions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/tabFocus.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"429-8ZLJEncD//m8+spJ540p4nJDLgw\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 1065,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/config/tabFocus.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/mouseHandler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7a6a-8vhkiSfh4jGqZ8NSithz9nZ8wJY\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 31338,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/mouseHandler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/mouseTarget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b7e2-J6IEUaZk23Af2SAKqrPEwpJ0RNw\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 47074,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/mouseTarget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/pointerHandler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a30-D+kwfrYPIFPwD/0MKdkR3/T3v2A\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 6704,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/pointerHandler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaHandler.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"454-V7obZokFlCYXWFqDn0qutCSLI8c\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 1108,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaHandler.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaHandler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"acd4-ymfBdWB4Z5jlweePRJPxtf386GQ\"",
    "mtime": "2024-08-01T03:05:11.790Z",
    "size": 44244,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaHandler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaInput.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7c2c-IXTMlJmLOKv2y1jJxjNTH0N552k\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 31788,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaInput.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaState.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32be-iqpRra+bZhNTc/Ikjh/RVS66Ai4\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 12990,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/controller/textAreaState.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/abstractCodeEditorService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f1-WWrxRz9gXTtF8vHn/mXDNky3DV8\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 5105,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/abstractCodeEditorService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/bulkEditService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a31-/nT0ag2sXoacv4paep4MMwIpwXg\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 2609,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/bulkEditService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/codeEditorService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"203-Dp6hmCvpBAmD52Lr+7O3NrlPx+c\"",
    "mtime": "2024-08-01T03:05:11.791Z",
    "size": 515,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/codeEditorService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/editorWorkerService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"506f-ArEPCca/1wY3HFijPvbZpVNYZKo\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 20591,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/editorWorkerService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/markerDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7bb-umeNm74l9Dd48Vfs7L5VLd64N7c\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 1979,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/markerDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/openerService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25d2-tcJgFemtk0hLd9K6oj4RemH/v0Q\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 9682,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/openerService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/webWorker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c8c-ZUFkL2Qc8TaeXtsM0dc/Q6l4qAY\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 3212,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/webWorker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/domLineBreaksComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3638-m4cdez983q8eHz14JiKaOP6g178\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 13880,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/domLineBreaksComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/dynamicViewOverlay.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e2-cmnWWA6Af/B6usAs/LDRgA+eqOs\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 482,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/dynamicViewOverlay.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/renderingContext.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ed4-maW8j5ck+nLHwBsBitCKenTapA4\"",
    "mtime": "2024-08-01T03:05:11.757Z",
    "size": 3796,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/renderingContext.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a47-HH0gob6J7zpYCoeyderJjRKpZh4\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 10823,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewLayer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4bd5-5nLgbIewBnzVlXBiSxEVQrvnFAo\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 19413,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewLayer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewOverlays.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c49-aXRAJzZAUwhP7ib/jxnXzqTPIWE\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 7241,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewOverlays.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewPart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"643-5OSZMgM8Rq/nxjhqHhp0P4KBr0g\"",
    "mtime": "2024-08-01T03:05:11.792Z",
    "size": 1603,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewPart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewUserInputEvents.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10fc-CrBH8tLgK7AEhrqz8unsmSbdo4g\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 4348,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/view/viewUserInputEvents.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/replaceCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dd2-pok3pdX3xjLexgkg0jSIdgx7A5Y\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 3538,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/replaceCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/shiftCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3386-S5SMU3mSYypLzEdFa7X5iiE92sA\"",
    "mtime": "2024-08-01T03:05:11.744Z",
    "size": 13190,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/shiftCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/surroundSelectionCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"95b-/gYsWQU+62SE58vmEA4TjA8gers\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 2395,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/surroundSelectionCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/trimTrailingWhitespaceCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10ed-6X/YT2R3xACP7FlygDzMZRJxetw\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 4333,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/commands/trimTrailingWhitespaceCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/diffEditor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4d4-NA4fZjSD0qZviMpmy7/7dUNf9b8\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 1236,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/diffEditor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorConfiguration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorConfiguration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorConfigurationSchema.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3d4d-Bx9rzuKeHIhn+nBmnevTPv5exvY\"",
    "mtime": "2024-08-01T03:05:11.793Z",
    "size": 15693,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorConfigurationSchema.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorOptions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b756-cJY+KvcVuXOb8tXVaY9mYa4hqMg\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 178006,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorOptions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorZoom.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3b7-/oXuuvMwT1+67HZf5Mgq1iItcSg\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 951,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/editorZoom.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/config/fontInfo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19cc-7OF88ys1Xn4m//5BX3zFX34Tc1c\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 6604,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/config/fontInfo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/characterClassifier.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"73d-ZcqjbdKOOWelbDUPvXyehc+PkoM\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 1853,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/characterClassifier.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/cursorColumns.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1219-xVPOtdpU5RIzHS3Ix0mGAzTWNk8\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 4633,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/cursorColumns.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/dimension.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/dimension.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/editOperation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40e-z014hSIbA7UdT/aPEMJfD9YOaV0\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 1038,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/editOperation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/editorColorRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5908-qsqZ2fjJBjbhj1kjS3B3kTu0n6I\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 22792,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/editorColorRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/eolCounter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"61c-NYVuVpCgzxq+Rv5XPqTgClS+NFw\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 1564,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/eolCounter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/indentation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5ee-sMugd0P1q8L//rgvkpyMlODgSJA\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 1518,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/indentation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/lineRange.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31d5-8m90DXFFbZBc3fd8+FyDvLmMw14\"",
    "mtime": "2024-08-01T03:05:11.794Z",
    "size": 12757,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/lineRange.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/offsetRange.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a82-hmLBV/q3ZyzmwJog+q+NDVZNXXY\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 6786,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/offsetRange.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/position.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fb9-ty1ppEOIrmZplYNavMiYJ2rHyZI\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 4025,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/position.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/positionToOffset.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"39d-q1xrzLtZWW0motg7jvJ5U9Qt+j8\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 925,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/positionToOffset.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/range.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ac4-rAx47X2xJrExNXlMG0XCR5u1vLQ\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 15044,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/range.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/rgba.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"41e-CXaSXHRJpXJ+Ijaqqsp5GP7t1QI\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 1054,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/rgba.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/selection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"154b-58KtTI94IctZth0EWUbgcfoPnOc\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 5451,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/selection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/stringBuilder.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10db-qxKeLi8y+ZAYSetmssNBW6xMh3k\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 4315,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/stringBuilder.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textChange.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25b8-/X9iGO/ACyVHpauwhZToU+VB7GE\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 9656,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textChange.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textEdit.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e14-FipeLcWKYPphAltSSe2HhFrsaCE\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 3604,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textEdit.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textLength.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"99f-z51DJJpbcNBatGY1GfoHwfQyoXg\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 2463,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textLength.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textModelDefaults.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"299-PjXAubv2JS5mDDe2/one1lA0qnk\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 665,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/textModelDefaults.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/wordCharacterClassifier.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c98-RkcFTkTyQNFv9hzAOd96TiB8ZVo\"",
    "mtime": "2024-08-01T03:05:11.795Z",
    "size": 3224,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/wordCharacterClassifier.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/core/wordHelper.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1190-iq59FkJuGi2OcrpJZytIlVobFaQ\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 4496,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/core/wordHelper.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a231-FywDvkND/ssOYyrNPuLx9RivKY0\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 41521,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorAtomicMoveOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"197c-qGibBm+ZW9ErgOwu/oIc2HJcZO4\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 6524,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorAtomicMoveOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorCollection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22e3-Ix/eFQ4CgGUHCUm0hpQgNPp8m80\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 8931,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorCollection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorColumnSelection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1608-La0X4O82v6NmarJlqSwgTku0v1U\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 5640,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorColumnSelection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorContext.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29f-fPuQWxr5KPMEwiOXk7ieavAuYkQ\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 671,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorContext.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorDeleteOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ab1-P+JijVXEAxcutCFNAne/KK+7/tM\"",
    "mtime": "2024-08-01T03:05:11.796Z",
    "size": 10929,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorDeleteOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorMoveCommands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8530-oYvQnWLzFTbd24aVHMO7biBulws\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 34096,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorMoveCommands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorMoveOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3bbf-uvCOe0jii8xn+BynyJxzOkKvKS8\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 15295,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorMoveOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorTypeOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c127-dOtkYzlk7hzY9ApwG/7aFG+ZK8Q\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 49447,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorTypeOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorWordOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"897b-SaGXnfvWll2hwfd89H7hkhuBhJw\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 35195,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/cursorWordOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/oneCursor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bdf-veJyVmOaqc22brRc/slOdU5DtOg\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 7135,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/cursor/oneCursor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/documentDiffProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/documentDiffProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/legacyLinesDiffComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6181-dnGaCt6j901WyqEzoqu2xRg6u7g\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 24961,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/legacyLinesDiffComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/linesDiffComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40d-5FN28MEwvvTNPdhqzCBNLP2VUqc\"",
    "mtime": "2024-08-01T03:05:11.797Z",
    "size": 1037,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/linesDiffComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/linesDiffComputers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29c-vGRzhDVqwhhawDxlGWFVUxuD2hU\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 668,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/linesDiffComputers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/rangeMapping.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17d9-iZjwx4YH4xia5fey1iAk4YzZOaI\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 6105,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/rangeMapping.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/autoIndent.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4523-4d0uFLgb8APKIzp9j2n0O3dBvNM\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 17699,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/autoIndent.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/defaultDocumentColorsComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"178e-mQzb06Q7EcbC0T/X4sWRdsn6/2A\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 6030,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/defaultDocumentColorsComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/enterAction.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a3a-pJMfFXG2ismjyispSz3ZHnxlxCM\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 2618,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/enterAction.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/language.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ff-TPAkYHU+AxdYte34PZY236MRkBM\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 511,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/language.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/languageConfiguration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14b5-uXeoeZZFJ8DgsNOhjIKSqJt9VCo\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 5301,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/languageConfiguration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/languageConfigurationRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3c1b-IG97leAzXLsNRkO0VN53ZbKYILI\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 15387,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/languageConfigurationRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/linkComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3454-8b/XxtbzpLMLhV2KZZXbnmjCSTU\"",
    "mtime": "2024-08-01T03:05:11.798Z",
    "size": 13396,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/linkComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/modesRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8c5-uE2ryBjNt8BpzxMGCOjmoafnVNQ\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 2245,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/modesRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/nullTokenize.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"53d-fDw200hmb8aBzzm9hLqsM3f+o5M\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 1341,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/nullTokenize.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a9b-DBd3brT1V7hCUS8O9E2Q0geJp80\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 2715,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/textToHtmlTokenizer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1665-r9uRFm0UZeP8IU8d1ZzWTF8/slc\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 5733,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/textToHtmlTokenizer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/decorationProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/decorationProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/editStack.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"38bd-wV7Bk4Cf88Rc+s7+VLz8kjjz76g\"",
    "mtime": "2024-08-01T03:05:11.799Z",
    "size": 14525,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/editStack.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/fixedArray.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"89d-PoChARuPDmdeNylgmOapOb7TMrY\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 2205,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/fixedArray.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/guidesTextModelPart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4f9b-uxcpIWfhtzHpTzac2RRmJyhZNzQ\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 20379,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/guidesTextModelPart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/indentationGuesser.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e57-+4B+kPd15i+7zrkaYYaASvsdQxQ\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 7767,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/indentationGuesser.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/intervalTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8a8f-vK4jUxEbOhsYFwV0QBAaCw5Wfg8\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 35471,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/intervalTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/mirrorTextModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"138c-Xmj/Aibo0ZZTcgy8JkzmcsWvDnI\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 5004,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/mirrorTextModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/prefixSumComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e25-GOdsMGLJqPOSATmO419yIFXBtqc\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 7717,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/prefixSumComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16a48-Th958iVfNP0Apl+4tJ+ehlAg+0o\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 92744,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelPart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"300-JjWahvkfcYpNTc+tMNDpBISXCdc\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 768,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelPart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelSearch.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5105-3EAwCW/VQ8Ps1FZm4fyu5oY4Ztk\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 20741,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelSearch.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelText.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"394-E4ZAo/tJkDWoDj0mfmHZ93krCbk\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 916,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelText.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4938-lTbBcE/z/QTF2GcS+SiKP9t3GyA\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 18744,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/textModelTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/tokenizationTextModelPart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6279-fJhZ1rbSINu66TauqPIXJroyGH8\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 25209,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/tokenizationTextModelPart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3fb-c9JYdAo6/1lsHIBrc5QFRwXbZxI\"",
    "mtime": "2024-08-01T03:05:11.800Z",
    "size": 1019,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorBaseApi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6f3-gW99236gqvexenn1Bvh9FbXGK8U\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 1779,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorBaseApi.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorSimpleWorker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"53d0-GaGvJLMr/n7IfC6GDFGt9M1q3sQ\"",
    "mtime": "2024-08-01T03:05:11.758Z",
    "size": 21456,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorSimpleWorker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorWorker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"207-+OG63+bibn64CzZQVLLvmxhtdb8\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 519,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorWorker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorWorkerHost.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/editorWorkerHost.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/findSectionHeaders.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d52-n5gOX0uxkAQAfrTQV+Pb62GXRAQ\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 3410,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/findSectionHeaders.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/getIconClasses.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"127d-UaBTvnCY/CVIGhpl2QuASQ/MyfM\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 4733,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/getIconClasses.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeatureDebounce.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"172a-9KwhW1ehoPktSftRXGyw1ZaM45Q\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 5930,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeatureDebounce.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeatures.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"210-8BK2avjsZbf7pXCjpTsOr7XOu2U\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 528,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeatures.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeaturesService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e2b-bn26Hh4Ehsf3xORiQTPG9KeDSEU\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 3627,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageFeaturesService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1433-XEygM6NJ/NIuossk/MIJ6vKwFgY\"",
    "mtime": "2024-08-01T03:05:11.801Z",
    "size": 5171,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languageService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languagesAssociations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"21b7-Xv/Od+5Nwkm2j7A3uy4mAL2Hy64\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 8631,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languagesAssociations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languagesRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25d0-hXI5rldYiRL5oCr3jbODGL8F4SU\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 9680,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/languagesRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/markerDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"211-ymRTV1/Lc8e/4AR0TdF4hHsewTk\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 529,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/markerDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/markerDecorationsService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29df-WKpweSgWAqpKqvXIXDV0SWC8f7c\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 10719,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/markerDecorationsService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/model.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f9-Q7wnECr3G/EVUpQrxLlnmjUBsHQ\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 505,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/model.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/modelService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5724-VQmnhFhmfYYbe8UBg1RW777Oud0\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 22308,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/modelService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/resolverService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a1-WrpJe5dvsM0UINUHGglro+GC6qU\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 161,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/resolverService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensDto.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ae0-Pv8u9Nral84PJUHkdS3gn6AGZAA\"",
    "mtime": "2024-08-01T03:05:11.802Z",
    "size": 2784,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensDto.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensProviderStyling.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3aa2-EA+ff/yIjZiKM7w7aJszWd9sUiY\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 15010,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensProviderStyling.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensStyling.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"219-RMaMtFyIfPuYxLEh8mRNMVWCcnI\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 537,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensStyling.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensStylingService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a84-JWqOHzSFMGipuFR8rVMWzPrkfV4\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 2692,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/semanticTokensStylingService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/textResourceConfiguration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"121-v7zER9VnX9wOhnymePCMbq8aBZg\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 289,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/textResourceConfiguration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/treeViewsDnd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"354-nGOuKN4JLwAhN43ee0Ki9EOuqPQ\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 852,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/treeViewsDnd.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/treeViewsDndService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2fb-5I7RXSERLccIduSDRknCLtQqZmg\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 763,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/treeViewsDndService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/services/unicodeTextModelHighlighter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"230a-3VtB64t5QDqmutOaYYhYdOgSoGM\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 8970,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/services/unicodeTextModelHighlighter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/standalone/standaloneEnums.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b8bb-r6XJ23RyeTfteMh//VZdnxlOJg8\"",
    "mtime": "2024-08-01T03:05:11.759Z",
    "size": 47291,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/standalone/standaloneEnums.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousMultilineTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"30d-1BuKJHzpTJ1fvNvTYXbpMci2J4w\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 781,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousMultilineTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousMultilineTokensBuilder.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"280-gT93Vj7oRXIt3MmsMEpNqoBlgVE\"",
    "mtime": "2024-08-01T03:05:11.759Z",
    "size": 640,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousMultilineTokensBuilder.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousTokensEditing.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f5-NoHBE/6BBn3/BW/A2/JcMbcwyHw\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 5109,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousTokensEditing.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousTokensStore.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2318-Xk2/+HimV+jQzztlmizIyImnnko\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 8984,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/contiguousTokensStore.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/lineTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2d5d-JMOvj2VylngzpP1O9dCkhZAMmvU\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 11613,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/lineTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/sparseMultilineTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5d7b-wzdp0UoU3FZUsR+2HaFeOGP5ZtQ\"",
    "mtime": "2024-08-01T03:05:11.803Z",
    "size": 23931,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/sparseMultilineTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/sparseTokensStore.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2146-do7Gw+ZIEXeUH8HRJ5Nde6+Y9n0\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 8518,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/tokens/sparseTokensStore.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/lineDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"200a-izdQBv30AFR01k1Wsrglnbz1mhE\"",
    "mtime": "2024-08-01T03:05:11.759Z",
    "size": 8202,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/lineDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/linePart.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3a3-MhQ0+OTbaoI3C5qJxhwqnGaCWdk\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 931,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/linePart.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/linesLayout.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7b4f-OBtr9x+JhIOxAt4Suyg+nI3Unwc\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 31567,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/linesLayout.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLayout.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ea5-yVm75B/JpDYzNhfjICEA5m8UTME\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 16037,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLayout.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLineRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a885-1aGCUdPsaV9Vb67ztwLvvnlc7eg\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 43141,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLineRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLinesViewportData.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5ca-BFzxUTl4QG2KhkCO/i7oAhfwLUk\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 1482,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewLayout/viewLinesViewportData.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/glyphLanesModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"858-9svNHHd9kn3ZZobH+jL0OzfOjAE\"",
    "mtime": "2024-08-01T03:05:11.759Z",
    "size": 2136,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/glyphLanesModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/minimapTokensColorTracker.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8f8-PCJNBuoE6l4+MJhAKn03r5IaG+Y\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 2296,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/minimapTokensColorTracker.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/modelLineProjection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3a5b-YhVIPgey2x3lChR7aRUi1+NPzcY\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 14939,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/modelLineProjection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/monospaceLineBreaksComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"59f6-bJyEri/kMhMt849ySb5zUnAXUnU\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 23030,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/monospaceLineBreaksComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/overviewZoneManager.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"174b-2osX4WSM/KOctxx1KcRtZNcrRXQ\"",
    "mtime": "2024-08-01T03:05:11.804Z",
    "size": 5963,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/overviewZoneManager.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewContext.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"356-ci9pYw5EOKtBEEX/qVcjbCRXHYE\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 854,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewContext.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23dc-/zP3o6dl4d3ax6NLUG2Fg5giDKE\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 9180,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelImpl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d948-TT/+tBUPBBJTyDhJ57S/tcWC/Yw\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 55624,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelImpl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelLines.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c787-dXKUbNeHVQwKDZ/hHFCIzoXCbuw\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 51079,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/viewModel/viewModelLines.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/colorizer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a01-HbEiMJ9yrh8TK9NvDBLAegy67f8\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 6657,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/colorizer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standalone-tokens.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"8b1-Am9Rc5or1+dnaLRgW46rnz78Ykw\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 2225,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standalone-tokens.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneCodeEditor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4309-vxW2jTfFDDLJKyfZ4Jzjg8nK6dY\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 17161,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneCodeEditor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneCodeEditorService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11ad-YxASjI0QWAqF8VN/CadgvbieQ3Q\"",
    "mtime": "2024-08-01T03:05:11.807Z",
    "size": 4525,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneCodeEditorService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneEditor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4dea-OSKPYM6BKDwly7I1Ycn5nUi8pcA\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 19946,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneEditor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneLanguages.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6aaa-VpD015tRGxq/HrRi25ko0dHS1qA\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 27306,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneLanguages.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneLayoutService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fbd-Jk//ERQ6+P3RGOaUIGQs9Hps784\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 4029,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneLayoutService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneServices.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9087-Lk7sB0vRk3BxHAO82vYG+5nmmX4\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 36999,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneServices.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneThemeService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36bd-VQaMdoLtEd3xc7l/Kxrv/w3/AnQ\"",
    "mtime": "2024-08-01T03:05:11.806Z",
    "size": 14013,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/standaloneThemeService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/standaloneTheme.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"203-AIUo4VLvB9Aaxs9vKUItQUOIr2I\"",
    "mtime": "2024-08-01T03:05:11.805Z",
    "size": 515,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/standaloneTheme.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/themes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2dd3-xQHkG84PS4m1tPSZilFqVDhcWTk\"",
    "mtime": "2024-08-01T03:05:11.759Z",
    "size": 11731,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/themes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibilityService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"139f-Jb/VIcR357pHSznOpZhBazNtNSY\"",
    "mtime": "2024-08-01T03:05:11.862Z",
    "size": 5023,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibilityService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibleView.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibleView.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibleViewRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3b4-ZNlFfQfgbEm1Nhh5G+RxC/zHCbg\"",
    "mtime": "2024-08-01T03:05:11.862Z",
    "size": 948,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/browser/accessibleViewRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/common/accessibility.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ac-QFs0ZW3wriCyDLddr/YrtW9OxPY\"",
    "mtime": "2024-08-01T03:05:11.807Z",
    "size": 684,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/accessibility/common/accessibility.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/accessibilitySignal/browser/accessibilitySignalService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3b21-3sDPNi7SxYzqy1rXeTKZCrnAuTo\"",
    "mtime": "2024-08-01T03:05:11.837Z",
    "size": 15137,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/accessibilitySignal/browser/accessibilitySignalService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionList.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"325f-d+h7KuNPI/M/A/+sboJrB2N9UZM\"",
    "mtime": "2024-08-01T03:05:11.837Z",
    "size": 12895,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionList.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1102-owuOGbZqvbuifc/CR5ztbQRWg2A\"",
    "mtime": "2024-08-01T03:05:11.862Z",
    "size": 4354,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b93-pzSQ9ipIOye4hGDly1JXQT3rn2A\"",
    "mtime": "2024-08-01T03:05:11.862Z",
    "size": 11155,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/browser/actionWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/action/common/action.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"28d-Zo92Ge5OXFHbkIGz3Fw8Tlr/AAY\"",
    "mtime": "2024-08-01T03:05:11.863Z",
    "size": 653,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/action/common/action.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/action/common/actionCommonCategories.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"314-Mv5M//DkOpt2SNel48TDF6GGP34\"",
    "mtime": "2024-08-01T03:05:11.838Z",
    "size": 788,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/action/common/actionCommonCategories.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/common/actionWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actionWidget/common/actionWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/menuEntryActionViewItem.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"5c3-8bUr+OuhvhywBlvumbbi2SjSS2w\"",
    "mtime": "2024-08-01T03:05:11.863Z",
    "size": 1475,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/menuEntryActionViewItem.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/menuEntryActionViewItem.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5954-ARC2ig7KnjvFlvCuZCtAMrPSDMA\"",
    "mtime": "2024-08-01T03:05:11.863Z",
    "size": 22868,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/menuEntryActionViewItem.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/toolbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"37cd-Rf6YfMiVyuUwt38SsecZ2qgLcOY\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 14285,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actions/browser/toolbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actions/common/actions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"574c-Djk8t7t9/7GrZ2C6n6xLsOaJ+Ng\"",
    "mtime": "2024-08-01T03:05:11.863Z",
    "size": 22348,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actions/common/actions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/actions/common/menuService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4746-/4cdPWGGXXsic2GMUbrhtwn2Q1I\"",
    "mtime": "2024-08-01T03:05:11.838Z",
    "size": 18246,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/actions/common/menuService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/clipboard/browser/clipboardService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23f1-G0evPG1PYbDyKrsRd02E3K2hFUg\"",
    "mtime": "2024-08-01T03:05:11.838Z",
    "size": 9201,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/clipboard/browser/clipboardService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/clipboard/common/clipboardService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f5-rYLQZYrMoeZKmwf9pJOPlFO6Gco\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 501,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/clipboard/common/clipboardService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/commands/common/commands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d28-0D7G+WoS5MtVwg9y6uyanlMgbos\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 3368,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/commands/common/commands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configuration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d9d-naRftKVWn0flxWA3fUy50xGh7Zk\"",
    "mtime": "2024-08-01T03:05:11.838Z",
    "size": 3485,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configuration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurationModels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6f33-dcycszObkRsiZbivcmixfBCoH48\"",
    "mtime": "2024-08-01T03:05:11.864Z",
    "size": 28467,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurationModels.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurationRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4416-05F8gQUHTsndIvakC4InluG8Dk8\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 17430,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurationRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6d8-d+KioS/MrwPCU65HV7lyw6rSNcg\"",
    "mtime": "2024-08-01T03:05:11.864Z",
    "size": 1752,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/configuration/common/configurations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/browser/contextKeyService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3c6f-xIzVlHKyEslH34p6qo5EgJ4um3A\"",
    "mtime": "2024-08-01T03:05:11.838Z",
    "size": 15471,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/browser/contextKeyService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/contextkey.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d2f0-JPowjzmJjvieMHBxl6IdiILZyJo\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 54000,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/contextkey.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/contextkeys.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7a7-vCuXBWJzQ52+toMxc0sGWfMzm1Y\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 1959,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/contextkeys.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/scanner.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2e3c-UicjD4rwmlBjWrz0RbDKMh4OcVc\"",
    "mtime": "2024-08-01T03:05:11.864Z",
    "size": 11836,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextkey/common/scanner.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextMenuHandler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a65-MZfpWPYiZTulCHW3yr0tsXsfvqE\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 6757,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextMenuHandler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextMenuService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"141e-iu7UVfvrSbXiOz3sxxob3VJYnMA\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 5150,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextMenuService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextView.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"243-a6D94JZYgjW/Ve10unwcHU0R1Vc\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 579,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextView.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextViewService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cef-nOYHm3ALItIvZDsZ4vKb1DK3VKk\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 3311,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/contextview/browser/contextViewService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/dialogs/common/dialogs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8f-Nq2T1oSuf+0LM6qWa2YDwq71jaU\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 143,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/dialogs/common/dialogs.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/dnd/browser/dnd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"415-kGDS2t0PyRQMvJ/6BuZFhZ3veWQ\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 1045,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/dnd/browser/dnd.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/editor/common/editor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"327-UrEY11em6JvE8KlpCjSup1G83Vg\"",
    "mtime": "2024-08-01T03:05:11.841Z",
    "size": 807,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/editor/common/editor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/environment/common/environment.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"99-6bscL0lcq5RQC9Q4D3twDewc+pw\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 153,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/environment/common/environment.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/files/common/files.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"114-pWvaIoxWBIP+CVAq/Jvz4AECqwA\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 276,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/files/common/files.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/extensions/common/extensions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5fd-41RHWE0Vg1ENu0WbnauLvPQwkrI\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 1533,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/extensions/common/extensions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/history/browser/contextScopedHistoryWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"180f-Z9Dm7+8nT2p05XgW4dB5xRxjOQo\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 6159,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/history/browser/contextScopedHistoryWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/history/browser/historyWidgetKeybindingHint.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2da-+qWvrAubhewB69+aUSNU/p/9yWc\"",
    "mtime": "2024-08-01T03:05:11.866Z",
    "size": 730,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/history/browser/historyWidgetKeybindingHint.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/jsonschemas/common/jsonContributionRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4db-rhtdupPjyaO4NVpcTFd7mleUwOA\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 1243,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/jsonschemas/common/jsonContributionRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/hover/browser/hover.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1185-40LLy0mJ4d4btI6byrfWnfdW6uI\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 4485,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/hover/browser/hover.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/descriptors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26e-EF2eLpsMtHQ+/IDLYhNtrwZ5h+I\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 622,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/descriptors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/extensions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"325-+PS3WB6sSXWMj80nT304xLo+iM8\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 805,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/extensions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/graph.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ab8-n2cshzOkjH9qrHPcmPrCSyGAIJw\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 2744,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/graph.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/instantiation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"65e-iVk9XqJo4NwCfqu6clQYCd/Eg7o\"",
    "mtime": "2024-08-01T03:05:11.865Z",
    "size": 1630,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/instantiation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/instantiationService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"42a3-irJnOQeNKDsokEZNvK2Mo3PCmJA\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 17059,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/instantiationService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/serviceCollection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"304-H8OjoPXNbX2YJ4+tG4xxX1gVfqU\"",
    "mtime": "2024-08-01T03:05:11.866Z",
    "size": 772,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/instantiation/common/serviceCollection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/abstractKeybindingService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3a47-+CFY83dF1iiVr2tXIOjkFcNNPn4\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 14919,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/abstractKeybindingService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/baseResolvedKeybinding.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9ee-8oF13RCDpoEZYGisWDCFab1eHXg\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 2542,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/baseResolvedKeybinding.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybinding.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f7-gQLY6M03L3qvmX8jQNyURWYeUHo\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 503,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybinding.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybindingResolver.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2db7-5Tma0pqwxikXbVZ4DLsIetTdQEU\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 11703,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybindingResolver.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybindingsRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1029-uf+vxSp8DZmQXkuhE6qHyPZWB0s\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 4137,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/keybindingsRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/resolvedKeybindingItem.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"646-Rbv2kIbbgi7M2wAeNSwgN26D7eQ\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 1606,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/resolvedKeybindingItem.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2023-6vBFYKLSRm30WVKOfGGSKg/qMb0\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 8227,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/label/common/label.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8d-liVLTNJcS4lLgYK8SGWwhjUYUXM\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 141,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/label/common/label.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/list/browser/listService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e1f7-Zy+SGYeechHz2HAloy1v+Xnl7W8\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 57847,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/list/browser/listService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/layout/browser/layoutService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ef-1qN3FjEdTSiIz8csZA68CRuPXvI\"",
    "mtime": "2024-08-01T03:05:11.839Z",
    "size": 495,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/layout/browser/layoutService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/log/common/log.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1243-nKUOS5A1gCL36hayKiyMEjr3vQg\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 4675,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/log/common/log.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/log/common/logService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"553-D/HZ0f7eq4CuKitXlgO4gzvGip0\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 1363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/log/common/logService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/markers/common/markerService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29ba-EKjDpMD/xlWfzNbmiPUUvnQttLo\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 10682,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/markers/common/markerService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/markers/common/markers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1267-WxKMELxOGHs5gPzGfI+RQh7cFyc\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 4711,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/markers/common/markers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/notification/common/notification.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11e-ceqzzUtdUnOdQfZqfToOpbo4obQ\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 286,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/notification/common/notification.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/observable/common/platformObservableUtils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2e2-O4Gg/ciQlK2frl+BXHu+fXXJa28\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 738,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/observable/common/platformObservableUtils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/opener/browser/link.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1e7-EGJNqQca7TTKzi6PdN/rzlWOpkg\"",
    "mtime": "2024-08-01T03:05:11.867Z",
    "size": 487,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/opener/browser/link.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/opener/browser/link.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"121b-OOVXdHRYen/I+HvRRf5YUDQP6YM\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 4635,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/opener/browser/link.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/opener/common/opener.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"514-I6fcAWtmN8tACQErbCkjlTX1kpQ\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 1300,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/opener/common/opener.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/progress/common/progress.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"234-ojFnifQadOruiPQ9HSDzDlu2fcI\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 564,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/progress/common/progress.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/policy/common/policy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/policy/common/policy.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/commandsQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4b77-dj89jZ2F2J0NZEcN49xDw8GvEmg\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 19319,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/commandsQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/helpQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fde-8XurNDOGJA7VVUJsmDlbRTLqqms\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 4062,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/helpQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/pickerQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3452-BFTVmZHSG8ocOhsC4kzhD1bEgUY\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 13394,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/pickerQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2f8f-VW9NDihOpwnLqOrERnzqQaIbulM\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 12175,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInput.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9068-7yZIN/W+Hxx1phkZc3tuWmRkEeM\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 36968,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInput.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputActions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"254c-UQcpitRDelFifgYq8aikbibDblE\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 9548,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputActions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputBox.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f63-FOHVKKBKhjwDWrdrFKoLCrDudeQ\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 3939,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputBox.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7d53-OIe8DBbxwWqeeLnQOYytM9l/x3E\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 32083,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2168-0nVMfxHKX5VbHJ3E/h4Ssk9kvec\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 8552,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ecfc-CFaWyY5TkUD+GfchDibQWkdhkzU\"",
    "mtime": "2024-08-01T03:05:11.868Z",
    "size": 60668,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputUtils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f96-KMjuTWg3GuNS8n7hI3PzapgsXb4\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 3990,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/quickInputUtils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/common/quickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"98e-ODKWpQ4talr2VvZ25AriPP57mHc\"",
    "mtime": "2024-08-01T03:05:11.860Z",
    "size": 2446,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/common/quickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/common/quickInput.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ca9-o0c8VgkdUBhhBll1/r8ZUIC+R6E\"",
    "mtime": "2024-08-01T03:05:11.870Z",
    "size": 3241,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/common/quickInput.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/registry/common/platform.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36b-dB1432J59GFYiao7rwiB6QEtMVU\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 875,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/registry/common/platform.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/severityIcon/browser/severityIcon.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4ca-O8aCpk+/KpL8fPenvHUO+9Oki+Y\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 1226,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/severityIcon/browser/severityIcon.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/storage/common/storage.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f84-MHaWR05fbsl2m6GJXdQx8WqRDGQ\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 8068,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/storage/common/storage.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/telemetry/common/gdprTypings.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b-uHjBGncSjnTDzxXJPvLO3fKqCzg\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 11,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/telemetry/common/gdprTypings.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/telemetry/common/telemetry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f5-ZrcpuXyQEpTiR/TbqYhItV2ETkc\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 501,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/telemetry/common/telemetry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/browser/defaultStyles.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c97-DJT7O1L7smDP0Dqp2OPvERNdpAI\"",
    "mtime": "2024-08-01T03:05:11.859Z",
    "size": 11415,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/browser/defaultStyles.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/browser/iconsStyleSheet.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e9b-N92xD3k3XyDE1GAkn90lQIkNxGs\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 3739,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/browser/iconsStyleSheet.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colorRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34a-jI5UdlQh2EAbVDGSQtUhyuH0L/8\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 842,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colorRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colorUtils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20c3-z7rImwxLhIk63uFRw/NlV45Bwg4\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 8387,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colorUtils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/iconRegistry.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"207e-sVOL240NeePynqYqekM4xGh21N8\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 8318,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/iconRegistry.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/theme.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3a8-+/Eq7YMB5VKyPGvPCGBiaPKsmTg\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 936,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/theme.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/themeService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8ac-zcUxZtdkXCOTRTq7c+SyHY01Yk8\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 2220,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/themeService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/workspace/common/workspace.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1428-59lsPfteHHYaivWNDsgY62emzNk\"",
    "mtime": "2024-08-01T03:05:11.870Z",
    "size": 5160,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/workspace/common/workspace.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/workspace/common/workspaceTrust.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"213-swxGex+13UaT4a19ant5zfT0vHI\"",
    "mtime": "2024-08-01T03:05:11.841Z",
    "size": 531,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/workspace/common/workspaceTrust.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/undoRedo/common/undoRedo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4e9-sisWLJRpbSsFW1h+1+XtIFWfVwg\"",
    "mtime": "2024-08-01T03:05:11.840Z",
    "size": 1257,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/undoRedo/common/undoRedo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/undoRedo/common/undoRedoService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bda0-P9+i1F1usnvzR/elbMVkrqMC5oY\"",
    "mtime": "2024-08-01T03:05:11.869Z",
    "size": 48544,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/undoRedo/common/undoRedoService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionViewItems.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3600-CVb0H5UZc6lhiQnG0Qe/fU4iKms\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 13824,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionViewItems.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionbar.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a7d-NV6bu5sxgGB4IWn3d8AGSo9UTWA\"",
    "mtime": "2024-08-01T03:05:11.745Z",
    "size": 2685,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionbar.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"490d-YeCa5I9hJaLVDSyHlAIYs+jxjZ0\"",
    "mtime": "2024-08-01T03:05:11.807Z",
    "size": 18701,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/actionbar/actionbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/aria/aria.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1d8-r4RHtmOfRPnPFt+qF2G8TH8yJGY\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 472,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/aria/aria.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/aria/aria.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bc7-i37KmPDT5ZCbIy149jG1kKva0bI\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 3015,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/aria/aria.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/breadcrumbs/breadcrumbsWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3dc-oo4gnffNJXt+x/1fboiXGgMtz/k\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 988,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/breadcrumbs/breadcrumbsWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/breadcrumbs/breadcrumbsWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22-eXPOlXr5K+PgEyxSvOkoZn7+qoE\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 34,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/breadcrumbs/breadcrumbsWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/button/button.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1236-QIfuWJG0kxbf2KSMbdm5mfwLNDc\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 4662,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/button/button.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/button/button.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"238f-upM8vo716+53/Z3gt3pPET5W2Iw\"",
    "mtime": "2024-08-01T03:05:11.807Z",
    "size": 9103,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/button/button.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codiconStyles.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1aa-KL8borS1vVHgRTqziHsSU7VeRlo\"",
    "mtime": "2024-08-01T03:05:11.807Z",
    "size": 426,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codiconStyles.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/contextview/contextview.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1fc-xfLclfWtMlim5W506Z3TC1OFVtc\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 508,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/contextview/contextview.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/contextview/contextview.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3bb8-JagHvAansgrTMA1sXmSr8pUIczc\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 15288,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/contextview/contextview.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/countBadge/countBadge.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2b8-3ITWWmzHRi6H/yQhCgH0UVtWFT4\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 696,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/countBadge/countBadge.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/countBadge/countBadge.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"639-KJTAn7PtAHNlaRCUzyRe7kipt+U\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 1593,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/countBadge/countBadge.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dialog/dialog.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"f54-la6VlEUIx0Zkv6TlOq7WCsHLT5U\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 3924,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dialog/dialog.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dialog/dialog.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17-EiMAzijWx9qF5bQvw+E5dsF2EuI\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 23,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dialog/dialog.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdown.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4f6-Iuj4xwfYp3Oh5uEfNiKzGH01irg\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 1270,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdown.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdown.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"160f-WkWAQ2hTzltk1kZKQPsp3dPCvWo\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 5647,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdown.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdownActionViewItem.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1340-fy52StDJxynTtbZa0S1FdegU4Q4\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 4928,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/dropdown/dropdownActionViewItem.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInput.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"85a-Sqg/yfFECF1R4dKQZYB+oloqYMI\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 2138,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInput.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInput.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"337e-aQdPqID+MspWMJdMPWEq2jyWL5o\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 13182,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInput.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInputToggles.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a59-wtEzVhuN4vj6EiwhTbCRcvYhrLI\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 2649,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/findInputToggles.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/replaceInput.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d0c-7LJo+IPWEeWIgsXiTewAOLCgDZ0\"",
    "mtime": "2024-08-01T03:05:11.808Z",
    "size": 7436,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/findinput/replaceInput.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/highlightedlabel/highlightedLabel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14d4-bKhXjNyWXt8NltTYYJUGn0aIy4U\"",
    "mtime": "2024-08-01T03:05:11.760Z",
    "size": 5332,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/highlightedlabel/highlightedLabel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hover.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"189-5VPF44Ran0qP6bqhcBaIpPgyyzI\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 393,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hover.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegate.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegate.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegate2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"495-DWMpaaiZjfOI/6Xjt0h226uM0BQ\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 1173,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegate2.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegateFactory.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"612-RmuEHpAwQ+9P1JDmk7o5Se2CRic\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 1554,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverDelegateFactory.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"f2e-XIBzyapwH2nvEY+UAOmDC+6UZHQ\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 3886,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fad-3gwjjQ7LQjE/zlqhHLGzmw4IMaQ\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 4013,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/hover/hoverWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconLabel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3508-HgL9PC5PZ9PMkXoMDFoiS6UJ6T4\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 13576,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconLabel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconLabels.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"560-etUdLpLpNxPxGgkVVpwQwsXhnFA\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 1376,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconLabels.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconlabel.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"de9-EkCp0l7W4pX4XymXlPBLpMLr1Ww\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 3561,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/iconLabel/iconlabel.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/inputbox/inputBox.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"8b1-k+IlTy4r5QJtsEtYOQzItpXMOGM\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 2225,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/inputbox/inputBox.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/inputbox/inputBox.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"57d2-c3jt5GM/LurheKBxcAbMaO7zqW0\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 22482,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/inputbox/inputBox.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/keybindingLabel/keybindingLabel.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3c5-oXp3LzwLi3mxG7cXxyS/JtAIm1g\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 965,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/keybindingLabel/keybindingLabel.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/keybindingLabel/keybindingLabel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"164c-7Gu9YmHLg06uUZm/hP+B8+DJkq8\"",
    "mtime": "2024-08-01T03:05:11.809Z",
    "size": 5708,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/keybindingLabel/keybindingLabel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/list.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"75b-uhVxlIEWa8j3uxPdNsFDUHMBMjA\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 1883,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/list.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/list.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e1-QVK6Fh0Y5rzuey7gDQJFSHSAHBs\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 481,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/list.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listPaging.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"121a-LDjKZLCe8GbRFB1JE6m39PTpGTw\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 4634,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listPaging.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listView.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c976-jFirOVmSrD+iL/BXvawaZ8t5slc\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 51574,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listView.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fcb6-Q+ioovsKprrYjwj9rt4pTNcbfXI\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 64694,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/listWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/rangeMap.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13b4-8dOH/69f6ATaDSfRfEYR65Soe+U\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 5044,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/rangeMap.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/rowCache.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f6b-QqijPq1Dt0GK5UbJ/kqE4OTmFgs\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 3947,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/rowCache.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/splice.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"251-RYS1rgrTf45+SBG12U+ST/Cq5A8\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 593,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/list/splice.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/menu/menu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"afa0-GTm6vH9Lq158EkEXMNkldYAaGRE\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 44960,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/menu/menu.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/mouseCursor/mouseCursor.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"18e-Twz1GNwFhiSuI7qfVMrZix0zwhg\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 398,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/mouseCursor/mouseCursor.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/mouseCursor/mouseCursor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c8-cnPQLtGGhUuUOZn9oPDbt6FjPbQ\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 456,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/mouseCursor/mouseCursor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/progressbar/progressbar.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7c4-zx7dTvfqQX5nfactLR3HyIHKlRA\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 1988,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/progressbar/progressbar.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/progressbar/progressbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fb0-iRAubSwNjWNThMyYCoFYKqnRe8o\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 4016,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/progressbar/progressbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/resizable/resizable.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b7c-gr7JEAUqbPzKGka1DetiVXOTcr0\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 7036,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/resizable/resizable.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/sash/sash.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"ce9-w1AKYyAIRoW6HeI0jFyzCR9OM1Y\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 3305,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/sash/sash.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/sash/sash.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4c3e-pJQLYoXm89ejjigCUdvWmBx6YTU\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 19518,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/sash/sash.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/abstractScrollbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23d7-awI25EAOFCiNF01Opx926fj14GQ\"",
    "mtime": "2024-08-01T03:05:11.810Z",
    "size": 9175,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/abstractScrollbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/horizontalScrollbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1104-DLWciS40Ik/MTen145a4Jk0JlL4\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 4356,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/horizontalScrollbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollableElement.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6396-L/Npiuany/PVCHCDw4A/2gGs+uc\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 25494,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollableElement.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollableElementOptions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollableElementOptions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarArrow.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"df5-TBMJi1C5tk2/WCGevAn2JSe1GIk\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 3573,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarArrow.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarState.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bfe-hVS/IxEOC+Hlrh4NvQ6Y+J0dfwQ\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 7166,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarState.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarVisibilityController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d0a-s8hQeGyDN4dSsqzzgE1ZYE1WwRg\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 3338,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/scrollbarVisibilityController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/verticalScrollbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1112-UtCPgirtPnBwcmtmCVqJsCbcQS0\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 4370,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/verticalScrollbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBox.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"35f-TQq+R+nW5Gw/iCaT6/5yQiDfyho\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 863,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBox.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBox.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"740-eSEytrGTxiNazHkqs5GiZMbFGgA\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 1856,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBox.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxCustom.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"efe-R57NySoYhrc/7coz3CDV4HQItbk\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 3838,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxCustom.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxCustom.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ac3b-IAyzDMbEXXkQ0DtMM8DM4IIOfGc\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 44091,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxCustom.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxNative.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16e6-VO5utzpiSDjjatOfuDDBlRyWtW8\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 5862,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/selectBox/selectBoxNative.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/splitview/splitview.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7d2-KOkSxqoVxuOj2Ajgbt+KaYtMkK8\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 2002,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/splitview/splitview.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/splitview/splitview.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"95c5-X4VJuO5UmCGsI+WG7YIlFS6Yo28\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 38341,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/splitview/splitview.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/table.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"556-ijkid+ba/MEJDSt8jW3RxMynbk0\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 1366,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/table.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/table.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.761Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/table.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/tableWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2030-s7JzQrrSn0uiUKIgT9GaUugiqWA\"",
    "mtime": "2024-08-01T03:05:11.811Z",
    "size": 8240,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/table/tableWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toggle/toggle.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"672-rpXDAI9jH1c/pQ2Vaf4ewfMiqYs\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 1650,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toggle/toggle.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toggle/toggle.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"101e-8VYSbqJ4ZpggulIIBFzyvQBBkso\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 4126,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toggle/toggle.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toolbar/toolbar.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1d3-oYX/CiGYPZC5SdhddTW1Hbe+VZ8\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 467,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toolbar/toolbar.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toolbar/toolbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1cfa-G8MFcBxIA6pgDPuZ5bmI6f9LCgA\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 7418,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/toolbar/toolbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/abstractTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"179a8-kOOep9Ma35RJa/a9uHWWl6S4vbs\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 96680,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/abstractTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/asyncDataTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8ec7-fYE5vq97SfcnNF8fQGojgcKpN5Q\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 36551,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/asyncDataTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/compressedObjectTreeModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"39fc-YT7uzJHhlKCXaoBGqSnjgjkypyA\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 14844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/compressedObjectTreeModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/dataTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36f-SBPyvrKvhZLB51pR/jv/yAY6x5w\"",
    "mtime": "2024-08-01T03:05:11.812Z",
    "size": 879,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/dataTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/indexTreeModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5bfa-UfblTYX0whjiLvKgYM1DkdD8aLA\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 23546,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/indexTreeModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/objectTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2510-2/CjGxhSWmS8bnhQvfXQzggTIjQ\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 9488,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/objectTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/objectTreeModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2053-0olLWkciRBecVleYS5270FXGrC4\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 8275,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/objectTreeModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/tree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7e7-jkQDZtgIufNFa68m3803b3YvFBY\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 2023,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/tree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/parts/storage/common/storage.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d30-c7F3MqLyUzyILQ0uswJSX9/G/9k\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 7472,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/parts/storage/common/storage.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hover.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"ee5-l7ZM1XtwyTOdET6BOvPD/RRJ0YY\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 3813,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hover.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hoverService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4689-wWO6pJ/uz8+Dp+udyaJsdxK1o7g\"",
    "mtime": "2024-08-01T03:05:11.746Z",
    "size": 18057,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hoverService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hoverWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"74aa-UglmKvs1z046H1UbLsuihOs1B6w\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 29866,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/hoverWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/updatableHoverWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f9e-obb7AJKyOnrCpXqxjrUzMOARhSU\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 3998,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/services/hoverService/updatableHoverWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/blockDecorations/blockDecorations.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"21f-ddFGUGOf8qSa5oRI6KYY96EPIOg\"",
    "mtime": "2024-08-01T03:05:11.746Z",
    "size": 543,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/blockDecorations/blockDecorations.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/blockDecorations/blockDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"fc1-wG5411iWXw3w7Qty0EfO1K6XD+E\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 4033,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/blockDecorations/blockDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/contentWidgets/contentWidgets.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"55b6-PnG17MK+gp6ZeybrA3D/68Ic7rs\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 21942,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/contentWidgets/contentWidgets.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"304-EyuAGeXwPM5/YCQivbysWqpMI+I\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 772,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"24b2-SwesqIRpxGaWNA5OOuveYzOZSbs\"",
    "mtime": "2024-08-01T03:05:11.813Z",
    "size": 9394,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/decorations/decorations.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"202-894TCPNwdjQUc2djJcapRBT/mLE\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 514,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/decorations/decorations.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/decorations/decorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22df-TlNPA8AVfybRgoCRenS7pVumhcQ\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 8927,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/decorations/decorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/editorScrollbar/editorScrollbar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e25-nnxwK8SZ4q1axNmOwlV+xOedydU\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 7717,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/editorScrollbar/editorScrollbar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/glyphMargin/glyphMargin.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3c9-hITmCkEZA4vmW+1TnP44SG7odtg\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 969,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/glyphMargin/glyphMargin.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/glyphMargin/glyphMargin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4552-Ik4QY+ZZwQksBee8BgPW56pL6tU\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 17746,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/glyphMargin/glyphMargin.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/indentGuides/indentGuides.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1cc-GRm7rkJlDAa1WNPTY++gVhf3nMc\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 460,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/indentGuides/indentGuides.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/indentGuides/indentGuides.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ca8-1GU7N6CTJxUZg8DcvATYWj4kyRk\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 15528,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/indentGuides/indentGuides.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lineNumbers/lineNumbers.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3cd-m84rB2aipitVNi6ZLsjewwbuoWo\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 973,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lineNumbers/lineNumbers.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lineNumbers/lineNumbers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1fd7-RM34HNDJyBJYx4lr8UAJXLwuJG0\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 8151,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lineNumbers/lineNumbers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/domReadingContext.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"59d-CdCiGHI2riZziuRSLm3VQHBB2PI\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 1437,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/domReadingContext.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/rangeUtil.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15df-RNHECnrvCigQX9ZkPGC0pp5e+Ng\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 5599,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/rangeUtil.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLine.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"66ac-YOa+b48ixfrUM8RE/x5mwu7Dsfc\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 26284,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLine.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLines.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"97f-YYsmPbhaeeTL65gnFlyQFjRwfm0\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 2431,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLines.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLines.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"893a-FokpkFnRJ55WevRetHhvQSSdxbU\"",
    "mtime": "2024-08-01T03:05:11.814Z",
    "size": 35130,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/lines/viewLines.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/linesDecorations/linesDecorations.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"268-qU5vt70DUaU5LxoILGBeZ0xpkiU\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 616,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/linesDecorations/linesDecorations.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/linesDecorations/linesDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10f4-55tmmw9e+vcCZg0NgOJ+lgR6opc\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 4340,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/linesDecorations/linesDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/margin/margin.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1b6-/JZ1883bmxpToDSjKiqxO+025M8\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 438,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/margin/margin.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/margin/margin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bc7-NiUqKNozg3cDDxgubtUeURAJ8ec\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 3015,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/margin/margin.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/marginDecorations/marginDecorations.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"229-hMQNcELju+q8q6lbIELEvyJ0vg4\"",
    "mtime": "2024-08-01T03:05:11.762Z",
    "size": 553,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/marginDecorations/marginDecorations.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/marginDecorations/marginDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b5a-TTpyUtohGyyCRodjAPxhPWakPHs\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 2906,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/marginDecorations/marginDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimap.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"693-gpy4kxkxh5vLIlGbRlxT3Jd9Mhw\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 1683,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimap.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimap.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13c82-sQmP5j4TYu7VDdIVRFutIlP4ltg\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 81026,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimap.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1126-h2IP82MzO38oi9t02UWVicqSiGQ\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 4390,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharRendererFactory.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c0a-LH94HC2k2kHuSkDeCw4U8pk8ViE\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 7178,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharRendererFactory.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharSheet.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"433-gDQ0jH6UEI1bsGJAuF3mBDQ/a7Q\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 1075,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapCharSheet.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapPreBaked.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d49-Y6STygxsTzQTW8FBoivFw1P+EO8\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 3401,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/minimap/minimapPreBaked.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overlayWidgets/overlayWidgets.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1a9-ttCU36fkiQgULAeRJfhh7AWhzzE\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 425,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overlayWidgets/overlayWidgets.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overlayWidgets/overlayWidgets.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1efa-1o3B+7J/79qDU8Nv1zThfisLIQs\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 7930,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overlayWidgets/overlayWidgets.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4a84-OzUJOraYmFzQA/9dSf3isfgFiK0\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 19076,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overviewRuler/overviewRuler.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"152b-m+CxF81r8CqTjLFMidSBlLQRbKg\"",
    "mtime": "2024-08-01T03:05:11.815Z",
    "size": 5419,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/overviewRuler/overviewRuler.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/rulers/rulers.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1e1-WkGGMLggydLyPwY+m93AHZzLocw\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 481,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/rulers/rulers.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/rulers/rulers.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c74-oulJHguNwYecMS3XZ3+r7N40tx0\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 3188,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/rulers/rulers.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/scrollDecoration/scrollDecoration.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1ff-ln2LrUHP55BA31QWtacJEDbN354\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 511,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/scrollDecoration/scrollDecoration.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/scrollDecoration/scrollDecoration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a41-cSHSuyPqA50YH88urMnL7OeH/6s\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 2625,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/scrollDecoration/scrollDecoration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/selections/selections.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"653-SDRifX2wYvR1x+Yj2Ss/k9ShS6U\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 1619,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/selections/selections.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/selections/selections.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4015-HSCpQyoLLLzejQNqs9BA7isNgyU\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 16405,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/selections/selections.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"263d-baXVnYgu/4n+RlCxV+p76rTxQ9U\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 9789,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursors.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"711-LuQI8W3AYMNKR97MbLBRV1KX/K4\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 1809,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursors.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36ef-/xcze3MsDwcj3BqfZRRZjYjh97w\"",
    "mtime": "2024-08-01T03:05:11.816Z",
    "size": 14063,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewCursors/viewCursors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewZones/viewZones.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3681-cz4dkz3P03sJX37+p4N5n4NiIq0\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 13953,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/viewZones/viewZones.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/whitespace/whitespace.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1cc-8jFLgxDvLKUtqFRWoP0JyKEAnNY\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 460,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/whitespace/whitespace.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/whitespace/whitespace.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32f9-mUFcJsrd9aVDEM6/KIMo3U3Er9s\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 13049,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/viewParts/whitespace/whitespace.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorContributions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"179d-wCi1Icsvu3okQOB8ua1IUPZ76Uo\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 6045,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorContributions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorWidget.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorWidget.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15559-6iBzApk/VsGzNzHqvZVbWOv+cTo\"",
    "mtime": "2024-08-01T03:05:11.746Z",
    "size": 87385,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/codeEditorWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/editor.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"bc4-qiBODkKgSvn2QnWq4nDSP4432Bg\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 3012,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/editor.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f09-xUg/choXXFOsBDvbgQrAD3eWQxA\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 3849,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/commands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"270c-m7yIAbAgl7R4eJWYixzbx8BAPFs\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 9996,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/commands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/delegatingEditorImpl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"145d-WShxXELTtuQWWaNadnTSTrCEgW8\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 5213,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/delegatingEditorImpl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditor.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.834Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditor.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditor.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1067-AjwTuNXHNiN5CBWdG+mPSC4ud5A\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 4199,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditor.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorOptions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26d7-1H11g0U381vRH/2+E81tot2qAtw\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 9943,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorOptions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorViewModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"86e7-V9M2KIQHoqApaIS1xjiOJNfsr8k\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 34535,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorViewModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7f53-NtLbK4lHwlSSRJKIrDLtkCzxgSk\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 32595,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffEditorWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffProviderFactoryService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d08-x/xuKqp27kUkhUfP3MO4XfRhq28\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 7432,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/diffProviderFactoryService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/registrations.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f76-dKZ6a/kOmABV9KAjwlFBteqZkmk\"",
    "mtime": "2024-08-01T03:05:11.817Z",
    "size": 3958,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/registrations.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2b12-wgoFSG3hAjUQEJpV2HMIdoaZJfg\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 11026,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/style.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3448-vSUpwkiL166Rs/SWtDCFQj4oxuU\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 13384,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/colors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"566-lTq5KOWdSi4Cmv1qagoeAlFlkkg\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 1382,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/colors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34ae-dMw9SDei0slhfxkHuFRe8dXm7Yg\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 13486,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/model.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/model.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorViewModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14fa-mHQrME8nZIUboaaB7Z9XADdRyyk\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 5370,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorViewModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a53-TouX4tUfIQwQzvxGUgCvd6uM5b8\"",
    "mtime": "2024-08-01T03:05:11.818Z",
    "size": 2643,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidgetImpl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4010-0vJrMrOu5BMZZz1g8b8AVwmnm78\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 16400,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidgetImpl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/objectPool.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"516-N+TBw5pIZD8j045/zIB9rRGZNjM\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 1302,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/objectPool.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/style.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a28-dAgxkAxv9RxXxhl8VKJkPo2upEI\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 2600,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/style.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2bc-roxOI4KrtSy19+vriRgqXNdqdAk\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 700,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/workbenchUIElementFactory.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/multiDiffEditor/workbenchUIElementFactory.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3356-1L/t4+FcTRZlYvV4CKk3TSm7rss\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 13142,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"34fd-nfYU5H6iY4CTIxboQ4fggBavG/0\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 13565,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"428d-dqqgTihLyxDLaqwNV1eFk7QKKcw\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 17037,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/lineSequence.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"540-nGwrnh9Vf6gDzFbmYP8Sp16bh58\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 1344,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/lineSequence.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"200a-E66m+JzALqd7f5Wktt47m7VFDb8\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 8202,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/linesSliceCharSequence.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"922-KmAziLzXuUlu4LO+qsYq+7YCSyY\"",
    "mtime": "2024-08-01T03:05:11.819Z",
    "size": 2338,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/characterPair.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8b0-p+hkuqb+fFQqC6dor47/ZAg9kIc\"",
    "mtime": "2024-08-01T03:05:11.747Z",
    "size": 2224,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/characterPair.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/electricCharacter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8f8-oEVgk4QwD1Jhx+0KJzdmrwr+vlc\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 2296,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/electricCharacter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/indentRules.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a06-NXb/XX+OYKh+DXeVsDI8IOLSYP0\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 2566,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/indentRules.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/indentationLineProcessor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2abe-cRQFeFk42YxPWiOotTZAs2zS6wU\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 10942,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/indentationLineProcessor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/inplaceReplaceSupport.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b8b-qWa5ky/Xq+D+Df9R5sEutpoo8NM\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 2955,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/inplaceReplaceSupport.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/languageBracketsConfiguration.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14c8-aKRdcE9CBhpRHBuCRIbkFKJN73Q\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 5320,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/languageBracketsConfiguration.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/onEnter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10a5-VOi8DMW2Vf+lfTo/mEv+IzadSMA\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 4261,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/onEnter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/richEditBrackets.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3336-4vBVjGL6F8VpqhifkeZ8b396dKo\"",
    "mtime": "2024-08-01T03:05:11.820Z",
    "size": 13110,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/richEditBrackets.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/tokenization.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"28b2-u6BC0N1z6U/3lkp7gVYd+CKDNXc\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 10418,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/languages/supports/tokenization.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsImpl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"921d-/wskYVYhel69oUG1XvQQcbupvUY\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 37405,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsImpl.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/colorizedBracketPairsDecorationProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11d5-hfTEuyInIWlrHXJulm5klS47zkk\"",
    "mtime": "2024-08-01T03:05:11.763Z",
    "size": 4565,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/colorizedBracketPairsDecorationProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/fixBrackets.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ca0-Ddj3YEpyQCBPVih5xa6Ae6/nvBM\"",
    "mtime": "2024-08-01T03:05:11.822Z",
    "size": 3232,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/fixBrackets.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f74f-508ES2GyFhH/79XUx7ZYgRfkat8\"",
    "mtime": "2024-08-01T03:05:11.822Z",
    "size": 63311,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeBase.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"520f-Zd3IcW/+cSQYSS1dxwj+ymeBMnc\"",
    "mtime": "2024-08-01T03:05:11.764Z",
    "size": 21007,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1665-06EeNcchu1dMyt3dY4+8vPleqSM\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 5733,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/rbTreeBase.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2af1-nzEYW+DBnLoFbKb/8JsukUOy3Qo\"",
    "mtime": "2024-08-01T03:05:11.821Z",
    "size": 10993,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/pieceTreeTextBuffer/rbTreeBase.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1ba-W/SBisxxkXFlWNy3VAPvT9lYtms\"",
    "mtime": "2024-08-01T03:05:11.841Z",
    "size": 442,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ea1-YKr2mep7Y0DPwdQItM/gpsO5SF4\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 7841,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/anchorSelect/browser/anchorSelect.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"218-roSPN3u6B8g5NSDGGxYAX3UkA70\"",
    "mtime": "2024-08-01T03:05:11.822Z",
    "size": 536,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3eae-73P5totPMYshbwdQhgcklLG8oyQ\"",
    "mtime": "2024-08-01T03:05:11.870Z",
    "size": 16046,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/bracketMatching/browser/bracketMatching.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/caretOperations.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/caretOperations.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/caretOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"79d-QLv0L7WaLc4OXKkg7BRUMdNSU/Q\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 1949,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/caretOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/moveCaretCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"92e-+N2CsbEGJU+UCpoM8gZVMoJDFe4\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 2350,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/moveCaretCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/transpose.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/transpose.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/transpose.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"caf-FNwRhHNLYvQ2CbweO4HSVu/bxW0\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 3247,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/caretOperations/browser/transpose.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/clipboard/browser/clipboard.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/clipboard/browser/clipboard.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/clipboard/browser/clipboard.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3029-imsKoxUTPvHEZVNM75Gh2iuK3S0\"",
    "mtime": "2024-08-01T03:05:11.841Z",
    "size": 12329,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/clipboard/browser/clipboard.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeAction.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3385-4wboq28ASYHCt2MkEPJW9JL1TmY\"",
    "mtime": "2024-08-01T03:05:11.870Z",
    "size": 13189,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeAction.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionCommands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"30a5-h2pC5cKVIEyhGeLff7algNmklEs\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 12453,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionCommands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionContributions.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionContributions.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionContributions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9d2-Vf9YSmxm3SepkvT6N3rib2gjDHY\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 2514,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionContributions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5052-+nAn0MhnzJjsRzFVG39EZAMS5ow\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 20562,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionKeybindingResolver.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1159-oRCvhpr5ILa5khD5Ht+tHeT6jPs\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 4441,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionKeybindingResolver.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionMenu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f0c-ZV5VrHtcdLkzsYektkR5X+dq0xo\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 3852,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionMenu.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4795-k+OxLbu19YTxEj6ZuyxRfXcI7g8\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 18325,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/codeActionModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/lightBulbWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"547-j15ShvDCuZJU1T7oK+QEvEfe+pc\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 1351,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/lightBulbWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/lightBulbWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"29bd-PRic+TiAoBCBv/h9BO5WWo1wkSQ\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 10685,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/browser/lightBulbWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/common/types.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1700-xbv8HiuQp97ZX+k9whE4baME6Aw\"",
    "mtime": "2024-08-01T03:05:11.860Z",
    "size": 5888,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codeAction/common/types.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codeLensCache.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13e6-o30LjmOp8/3l6jX8Hcvqs9Io59E\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 5094,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codeLensCache.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10a7-FEUl8BdOWAfh23Qgm64znbRm0kg\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 4263,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensController.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensController.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5b3e-4y5F9xzJ46YihPKBYz7iP1joEhc\"",
    "mtime": "2024-08-01T03:05:11.872Z",
    "size": 23358,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"774-oPIZW3Ln+79o2uPWTkAyixju5RM\"",
    "mtime": "2024-08-01T03:05:11.871Z",
    "size": 1908,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"27a0-Tz85kwovAgezuobUpeyo9ih9G/E\"",
    "mtime": "2024-08-01T03:05:11.872Z",
    "size": 10144,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/codelens/browser/codelensWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/color.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15a8-Iiad/IFcU2aEPUIOYGzDm90PZ20\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 5544,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/color.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorContributions.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorContributions.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorContributions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9f0-OutUp0EPi/+SXaTD84RV4WzqciA\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 2544,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorContributions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorDetector.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2da6-DYrwq64zy7w9Ixqe5Ak+zzRx7GQ\"",
    "mtime": "2024-08-01T03:05:11.872Z",
    "size": 11686,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorDetector.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorHoverParticipant.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a24-b0cRHaT4M2JWjVW2osv2BBuNB0U\"",
    "mtime": "2024-08-01T03:05:11.872Z",
    "size": 10788,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorHoverParticipant.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPicker.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"12e7-LJCpLU5hXfXho2qKcB4t1TzUgrU\"",
    "mtime": "2024-08-01T03:05:11.872Z",
    "size": 4839,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPicker.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPickerModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c06-Ac3M0QOASf4JLEtuGt+h3dEd+SA\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 3078,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPickerModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPickerWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ff7-2tr5yIN7Kpjk7Qqm17O5guqJkD8\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 16375,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/colorPickerWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/defaultDocumentColorProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e4e-E7fKHeHvoHc1PonDinOlZ6BZDdg\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 3662,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/defaultDocumentColorProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerActions.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerActions.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerActions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ff6-hH2qvyIxaKprFftthrlOMXIEOdg\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 4086,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerActions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3521-BnpKcB2sLcQ71PTyXwILdAja5o4\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 13601,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/colorPicker/browser/standaloneColorPickerWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/blockCommentCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1eee-jPRpJDTsxvq37rrzqAIGYJM6X7o\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 7918,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/blockCommentCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/comment.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/comment.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/comment.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a68-wV+k5rhNbr/MqprbZvinnhafUN4\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 6760,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/comment.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/lineCommentCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40c5-Nt+pxyxHtVnRDDRMBH4mY/XSrfY\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 16581,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/comment/browser/lineCommentCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/contextmenu/browser/contextmenu.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/contextmenu/browser/contextmenu.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/contextmenu/browser/contextmenu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40b5-CFKB4csS1QWNzz9K/AjqY0alWgo\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 16565,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/contextmenu/browser/contextmenu.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/cursorUndo/browser/cursorUndo.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/cursorUndo/browser/cursorUndo.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/cursorUndo/browser/cursorUndo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14bf-jPnBbaR6Sj60x3xohAxc6rFgYCs\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 5311,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/cursorUndo/browser/cursorUndo.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/diffEditorBreadcrumbs/browser/contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/diffEditorBreadcrumbs/browser/contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/diffEditorBreadcrumbs/browser/contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f72-3RbDJpzdq5/CtMeb2xfjf0Z3iHE\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 3954,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/diffEditorBreadcrumbs/browser/contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"48a-Wt+TYiPr0J1sdJkzv0hLk9ei5jI\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 1162,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"22a3-nMwcTFGWkjNaL//Uo/CkBzAKMAE\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 8867,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dnd.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dragAndDropCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"117e-PaHJc505vXIHAlWP55j/us6QnJQ\"",
    "mtime": "2024-08-01T03:05:11.873Z",
    "size": 4478,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dnd/browser/dragAndDropCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/documentSymbols.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/documentSymbols.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/documentSymbols.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"535-lYlsloAJno/QmaF/1ovblOPOvlU\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 1333,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/documentSymbols.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/outlineModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b00-NB+Fkzcl/xGLCClLwLyMmyr3iWc\"",
    "mtime": "2024-08-01T03:05:11.875Z",
    "size": 11008,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/documentSymbols/browser/outlineModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteContribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteContribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteContribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1113-Kt4ptXCYNwmUbuzqu/7O9SKsWts\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 4371,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteContribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"63cc-NlJNjwsZUPjskrP+q9eMiaK6Vm4\"",
    "mtime": "2024-08-01T03:05:11.874Z",
    "size": 25548,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/copyPasteController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/defaultProviders.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"261f-JPANnv9h9cBxbfeEN5dCSeEmj5c\"",
    "mtime": "2024-08-01T03:05:11.874Z",
    "size": 9759,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/defaultProviders.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorContribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorContribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorContribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b7b-KufV+tw7If0fi3qtKrI9KQgQrHc\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 2939,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorContribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2492-rrCRfUZxjdsS59AqSdzGx6uZpro\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 9362,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/edit.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cb1-nstZO2cLVdJkLGaf8Rev2hjpDXE\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 3249,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/edit.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/postEditWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"357-U+I5FIBX1qk7eNDo+W5dXc7Jliw\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 855,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/postEditWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/postEditWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25ad-3Fxmlc800HwVmq+wImipPgNuQc8\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 9645,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/dropOrPasteInto/browser/postEditWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/editorState/browser/editorState.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11b7-rHzhzsTi5LJiQxaFP9vYd7jrcBI\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 4535,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/editorState/browser/editorState.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/editorState/browser/keybindingCancellation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cb8-Vl/r3Rcn+mCEsuewlL4daODeXDk\"",
    "mtime": "2024-08-01T03:05:11.876Z",
    "size": 3256,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/editorState/browser/keybindingCancellation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findController.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findController.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a5fd-YhM4kmev/5orz2L/vTSqLDazlVk\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 42493,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"35ed-UES9UInPuaiLCCoKjSCQ51U+OTs\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 13805,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5bdc-F+2eAgf/zFnPviQoK4nVzU6d80o\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 23516,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findOptionsWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"257-FdGayGGSBO8uXjhyfl0iX1KmeYg\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 599,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findOptionsWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findOptionsWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"169b-QtA+Dcq5Aka1E46Pz29qsH7SbSU\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 5787,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findOptionsWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findState.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"287e-NFb8aaoi9jEvVIIkVvYIB9zwvdA\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 10366,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findState.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1be1-33bpg1iovHCY0wHVUv2fzB+lUlk\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 7137,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d493-v6IwSHf2sd05Wg5P642sEiJYOl4\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 54419,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/findWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/replaceAllCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"918-lr+Fn/A22+bqOKdS7W7TYLqN+rU\"",
    "mtime": "2024-08-01T03:05:11.877Z",
    "size": 2328,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/replaceAllCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/replacePattern.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b6d-0dnb2whMTf1G0JrUEwBmQJqSNbk\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 11117,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/find/browser/replacePattern.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"836-ylSnKvt7DpCuw2g4N41X0z2d0NI\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 2102,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c8a7-TKqM6WcKtCmXCvsZ+p3MAWFsLQw\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 51367,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/folding.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"23bc-4Ww9xLmPczf878R9DUADkZbTgkI\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 9148,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5eaa-bE323v/2RnSF7+htDqDX99igyL0\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 24234,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingRanges.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36b0-yZd69825juYbpdDoypZIS1IFGOY\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 14000,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/foldingRanges.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/hiddenRangeModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"144c-T4Mhe9skSc+lsvFV+nhP+mu74bs\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 5196,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/hiddenRangeModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/indentRangeProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1cc6-QCV5WpxMsJGzdTI8Mytc/Z4qF34\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 7366,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/indentRangeProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/syntaxRangeProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1bb2-UQDCjR8+SMskDnIGyIas2AJhXRE\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 7090,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/folding/browser/syntaxRangeProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/fontZoom/browser/fontZoom.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/fontZoom/browser/fontZoom.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/fontZoom/browser/fontZoom.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"76f-fEiFYpj9SzeeviT1DI++a3Fpo8Y\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 1903,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/fontZoom/browser/fontZoom.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/format.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"46a6-WkPk4Cybw0AfQN3DoF5zlKjgl7g\"",
    "mtime": "2024-08-01T03:05:11.842Z",
    "size": 18086,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/format.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formatActions.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formatActions.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formatActions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3294-HuVU5uUQWT/UxXz6YL9ng3L45tw\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 12948,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formatActions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formattingEdit.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"941-Lmh7tlNLSuRBadyrkt0uXIbp8fs\"",
    "mtime": "2024-08-01T03:05:11.878Z",
    "size": 2369,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/format/browser/formattingEdit.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoError.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoError.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoError.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"327e-K2gGLYHUBQPyKY/ywEAjSTUnjs0\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 12926,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoError.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoErrorWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4b29-O9BGJfMqeowLbVxNpF2YhmL8cJg\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 19241,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/gotoErrorWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/markerNavigationService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2002-Cs+skJ0Z0oJ2JV0y476yjunSGg0\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 8194,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/markerNavigationService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToCommands.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToCommands.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToCommands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"836c-VVqqRBV0UFozS6FDGmvDg/DmW9c\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 33644,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToCommands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToSymbol.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16db-ge2OgQlmd7GU2Hm7GbWuYnUk/UI\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 5851,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/goToSymbol.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/referencesModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"24ec-Hox/qMWU9kyyYd3u742NU+FQdAg\"",
    "mtime": "2024-08-01T03:05:11.879Z",
    "size": 9452,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/referencesModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/symbolNavigation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20f8-UzcyI/InWKhTpNuUi+H5MIPrB8E\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 8440,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/symbolNavigation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e20-YKY94/pRY6r7Nwj84/E1CcX3EWo\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 3616,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"449b-+mq04IpZILzO9XTd6Pdc44BH7vA\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 17563,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverStatusBar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9ac-MID8CXuG6WU19B0L1is+YMiZ2ko\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 2476,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverStatusBar.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverTypes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"72b-kFroXGam5/FaGzK8p+RMSOamXbg\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 1835,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverTypes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4f87-cBq/qrK2z7wep/DTETJizPoVF/k\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 20359,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/contentHoverWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/getHover.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"96a-tDy+ssrUtdtyTjkNR6mZBlX5w7Y\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 2410,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/getHover.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hover.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"78e-eOlJjP0zCwa0+RzoIGI/S2f46i0\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 1934,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hover.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverAccessibleViews.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"135b-a1oRwDs2f7g+x0TiKnoDpeXC3YE\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 4955,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverAccessibleViews.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverActionIds.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6f6-paCSR2M0z+LZbmpYcAs1HbFM4fg\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 1782,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverActionIds.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverActions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"445c-25Zqrd1g/63WQ3AAzXPRMjG8u3s\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 17500,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverActions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverContribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverContribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverContribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bcc-euAUcaHcrhsrYsWOV1JSaSDQ1Ck\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 3020,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverContribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"458f-Q+rBvdqM7HjANkRU9RqHyltSvV4\"",
    "mtime": "2024-08-01T03:05:11.880Z",
    "size": 17807,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverOperation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"18b7-UGCf45DgGL1OkvM55eWz2/b3Dww\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 6327,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverOperation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverTypes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7dd-Bz2XJjK1MDIEzcHamo2Y+7T6FX0\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 2013,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/hoverTypes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/marginHoverComputer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7f7-20Tegu13DYJF4bAjDUZsuC+thGo\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 2039,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/marginHoverComputer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/marginHoverWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1853-NFJfwBwJq7sDBiwVVEvYvcJLhSY\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 6227,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/marginHoverWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/markdownHoverParticipant.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5420-OUhGYjfJh5nZFssI9KJBh7k9B18\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 21536,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/markdownHoverParticipant.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/markerHoverParticipant.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"32c4-8KjVQPZqFmrpKidoLkmohOMpr90\"",
    "mtime": "2024-08-01T03:05:11.881Z",
    "size": 12996,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/markerHoverParticipant.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/resizableContentWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"113e-NhUQJ4IpIIbtoF0vV63C3E0b0yA\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 4414,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/hover/browser/resizableContentWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/browser/indentation.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/browser/indentation.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/browser/indentation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"61ed-mBOaaGXG0toVGzWvk0cRKOGXGEs\"",
    "mtime": "2024-08-01T03:05:11.860Z",
    "size": 25069,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/browser/indentation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/common/indentUtils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"426-zfVpfia791v7ogX9zu0jITkXokk\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 1062,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/common/indentUtils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/common/indentation.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"142c-p3gXT4hea8pMLbTli6zzl4DG3vo\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 5164,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/indentation/common/indentation.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1ca-1LsdZUywEkkCyaPKJu0gG/3Mkpg\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 458,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d2f-KRIyDM9r7hU6ztfqvUUcTWNDZh4\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 7471,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplaceCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"57b-KN6LRMbBPPpu8LaD6Htv3gMMO90\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 1403,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplaceCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHints.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19df-oN8mTHWA3YFph4KDKe2BKwg/Kqw\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 6623,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHints.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsContribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsContribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsContribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"334-t0iRBkbfXF89erJmLIyWtGjRo08\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 820,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsContribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6fc2-yCWqzbBAtI5RnC5sWXGsLU6toXo\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 28610,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsHover.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2220-7fHwoBhDTM+Z2TfMMCcjcXLTs/8\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 8736,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsHover.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsLocations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"151b-ern930Wd+83fQeuCXe3Wg4iNO7o\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 5403,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlayHints/browser/inlayHintsLocations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/commandIds.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"263-VnUJgTdpgktOjmg/Gqm2dgOCgmI\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 611,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/commandIds.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/commands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2674-b6P/9THnS3ws8++JCMUh7hLV96c\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 9844,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/commands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostText.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"52c-p1kwerTlrpCerAF3Scw+Byo6GP0\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 1324,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostText.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostText.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ee0-dIXRB2XaDJkiuTUgiymmmhkCQfo\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 3808,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostText.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostTextWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3401-yGBDSJ4SlZMXoqkzzO53x1yrwHA\"",
    "mtime": "2024-08-01T03:05:11.882Z",
    "size": 13313,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/ghostTextWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/hoverParticipant.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1fc2-JXwqSJmED8sG6wUQji31APBRqo8\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 8130,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/hoverParticipant.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1431-0hEkI7IQFPZDruxb3Ijm1XW5otM\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 5169,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7ad-THJvtX3eomyYhDxX6uBXgYk65qI\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 1965,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsAccessibleView.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"212-2zGpi1gw2STyoEabgc9KMFe/AFo\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 530,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsAccessibleView.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4bc0-gI56LFHAl5RaPyGs20cSQUlAeZI\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 19392,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4a6-txSOMPDi0KuEjypgjH0Txmzy+Bk\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 1190,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4537-y9KU8i8pNjl1RkAZdB5NMCr7q34\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 17719,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6b70-7qwn9qmxPAkhpP/erF+xi1Vk7Ec\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 27504,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsSource.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"36a6-5P3bJHBIhgdzbKqAsRePUmi3V+I\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 13990,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/inlineCompletionsSource.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/provideInlineCompletions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a30-amaqBIptqtHbXCRCg4lMzG5298E\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 10800,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/provideInlineCompletions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/singleTextEdit.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25eb-EApuNAVZ7s/ZvAzusOBwgCz3GxI\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 9707,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/singleTextEdit.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/suggestWidgetInlineCompletionProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2429-0kQluy4WU6kW3685qpcOgkcsnz4\"",
    "mtime": "2024-08-01T03:05:11.883Z",
    "size": 9257,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/suggestWidgetInlineCompletionProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/utils.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8db-LfRH7vl+lq0kbJNa/GD5BJvRMPc\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 2267,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineCompletions/browser/utils.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/commandIds.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"278-9UWdHHK+0FFdNiv47vt8kPoHMMQ\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 632,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/commandIds.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/commands.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1768-bha7RQFBj0oLz7mKRwJCmGxSS7s\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 5992,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/commands.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/ghostTextWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ad1-50K5tIqcsV5+X9FdxRNF5wF29Y0\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 10961,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/ghostTextWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/hoverParticipant.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13f0-cKKSBBaBNW+PiO/AqwsNMJZUS/Q\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 5104,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/hoverParticipant.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4a3-NB2U4OVQ6vIU+bKZbyxOYJ2wROA\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 1187,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"4e9-gDcGk6iubaQhH8baPpcRn9eUSXA\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 1257,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEdit.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"41e3-82+B8EtYx4IBtJb6NRM0aDY6npY\"",
    "mtime": "2024-08-01T03:05:11.884Z",
    "size": 16867,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3f9-Gn3XF//8jgwATwDeJ9WuGhNl194\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 1017,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2be2-WOFOW4iWdOeCJ3ajS5K+X0L6kQI\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 11234,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineEdit/browser/inlineEditHintsWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/lineSelection/browser/lineSelection.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/lineSelection/browser/lineSelection.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/lineSelection/browser/lineSelection.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"698-0q4MjRdc9q01boXKgqJY21aRKSw\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 1688,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/lineSelection/browser/lineSelection.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgress.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgress.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgress.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1748-0QM1uXr3hrzd0b4M+mGHwhrw8gI\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 5960,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgress.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgressWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"343-CtoVKe3oCH/BXZh/GdG+G2iwBnc\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 835,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/inlineProgress/browser/inlineProgressWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/copyLinesCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d1d-kvs1V9nwoyy6SZHWjMX46YiDDHg\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 3357,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/copyLinesCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/linesOperations.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/linesOperations.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/linesOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b913-bvPPvNm/FXI/icnc59MQ0ve9K1I\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 47379,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/linesOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/moveLinesCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"59b9-U+j+xWhniMthOhSHJYwnFOEJU0M\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 22969,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/moveLinesCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/sortLinesCommand.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bd2-QmFlQIaXf9HWTzkYyFishZPpcxs\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 3026,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linesOperations/browser/sortLinesCommand.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"21d-k6HTyz/zHF2dEq8FECHmIJoC9dU\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 541,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4879-Fa19hwm94gwuUfVIia5s2tB0M6U\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 18553,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/linkedEditing/browser/linkedEditing.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/getLinks.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1533-V7BN6FLZmeHVAcEssf+nieyQnFE\"",
    "mtime": "2024-08-01T03:05:11.843Z",
    "size": 5427,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/getLinks.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"260-z/KK1nG3/98zbAckmi+Uk3kvECM\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 608,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4189-6N2IwCQD1OqwzIYHPh4HsCoTXPs\"",
    "mtime": "2024-08-01T03:05:11.885Z",
    "size": 16777,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/links/browser/links.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/longLinesHelper/browser/longLinesHelper.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/longLinesHelper/browser/longLinesHelper.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/longLinesHelper/browser/longLinesHelper.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"502-iEmjwLh8NH9A3japzf1X3891ONg\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 1282,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/longLinesHelper/browser/longLinesHelper.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/message/browser/messageController.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"914-t0T+0i4uerLLY8bWD1/KvOkg7HU\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 2324,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/message/browser/messageController.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/message/browser/messageController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"236f-2FQ8FTqwKXZdO0TrUjH/nXezHCc\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 9071,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/message/browser/messageController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/multicursor/browser/multicursor.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/multicursor/browser/multicursor.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/multicursor/browser/multicursor.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"add2-V9lqi392fapmjQv3Gt9TeRV0EuE\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 44498,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/multicursor/browser/multicursor.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e57-Ua1XKdH+f/vcyL2n0/zuR8/bVwg\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 3671,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.892Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"18f9-+akwix28K+izQDj41lupp6r+CVY\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 6393,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHints.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHintsModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a2b-yaw5+tsh0JSmiwxAWLjLXki/eHI\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 10795,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHintsModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHintsWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3c8a-L2gHc/2HfSCODLZUp6xH11beCiU\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 15498,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/parameterHintsWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/provideSignatureHelp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a9a-DPuDQQZp8M5GC2rdsjF+qjHmDEo\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 2714,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/parameterHints/browser/provideSignatureHelp.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/peekView/browser/peekView.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3951-qtNkzV9l9h6qdmZcksQA3XdTwn8\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 14673,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/peekView/browser/peekView.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/commandsQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"81e-E5D1z6+YRqmq9VWan9MVb/yb8ww\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 2078,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/commandsQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ced-dSOpBMSOxhPJ2HJxGTMsaYZ1AMk\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 7405,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1777-6FNWMBUq8OzOoLvsUisI9H9YF0o\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 6007,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/gotoSymbolQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"51d7-jtUPw2VAgNp0pNS1a6wyf6KB9JY\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 20951,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/quickAccess/browser/gotoSymbolQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/rename.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/rename.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/rename.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5bee-HSR70synPrj04XhV5yqldBj5IAU\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 23534,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/rename.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/renameWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"581-SlFh5lkyMCkyH0UbMcBsDPEkU8s\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 1409,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/renameWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/renameWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"943e-YjQiz/sY2Nzn/+Og/cpMT1a+0wo\"",
    "mtime": "2024-08-01T03:05:11.886Z",
    "size": 37950,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/rename/browser/renameWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/sectionHeaders/browser/sectionHeaders.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/sectionHeaders/browser/sectionHeaders.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/sectionHeaders/browser/sectionHeaders.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2346-LhsrZhDBSxmfpUBIsBF1YgtCI3o\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 9030,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/sectionHeaders/browser/sectionHeaders.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/documentSemanticTokens.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/documentSemanticTokens.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/documentSemanticTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"46cb-EhYusmyJOGHAmIdsTGf5iwF1kCk\"",
    "mtime": "2024-08-01T03:05:11.844Z",
    "size": 18123,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/documentSemanticTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c37-VrsreYVgHQObr3F2saGiB8BMw8M\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 7223,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/common/getSemanticTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"21d2-9vsa+w4D4gN0MEBtvtyR2kZ8mQ8\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 8658,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/common/getSemanticTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/common/semanticTokensConfig.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"368-bVyk41HivQhs+wTDhhq+zWY1yMI\"",
    "mtime": "2024-08-01T03:05:11.860Z",
    "size": 872,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/semanticTokens/common/semanticTokensConfig.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/readOnlyMessage/browser/contribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/readOnlyMessage/browser/contribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/readOnlyMessage/browser/contribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"777-wpftn9Ev29S4OzTaV485IoD3YAk\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 1911,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/readOnlyMessage/browser/contribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/bracketSelections.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"191c-wP5sTKXZxWZhmd95IshWbKcbih8\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 6428,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/bracketSelections.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/smartSelect.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/smartSelect.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/smartSelect.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3618-e9rYz79pXCqROEEdlYe/IzlnSww\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 13848,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/smartSelect.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/wordSelections.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c8d-3Z+M4oYCDdGoLbnv5ApN/QTF+dg\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 3213,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/smartSelect/browser/wordSelections.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetController2.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetController2.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetController2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3555-og3zgrtI69Qdn3mKTQZAfazAYao\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 13653,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetController2.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetParser.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"75e5-ZaBP2BoKDsfJBk9HNEKrhfd3Q18\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 30181,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetParser.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetSession.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"37e-SW+y+siyvrhZ4TeHdHw/kkVOQ1w\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 894,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetSession.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetSession.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"89ec-ZKuHdpkAIp3FW5wcUDS4eQZjib8\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 35308,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetSession.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetVariables.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3e7d-t7Ep9xQm9bEURV7bYh/hzQXjPrQ\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 15997,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/snippet/browser/snippetVariables.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScroll.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7f5-/KEQ2AuTB7HJxeS2S7rh43icwJc\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 2037,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScroll.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollActions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"170b-W5D07igMKIkF43Gu4fac9NGD4fY\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 5899,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollActions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollContribution.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollContribution.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollContribution.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"473-7ygU5fKM5hQq8NL09i701p7Wmx4\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 1139,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollContribution.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"69e4-2PPQc+T1n6cYN5Ozj86QZspwB5A\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 27108,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollElement.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"470-jDYscUOzixLgzdYU7YYHJ9Ij4yM\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 1136,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollElement.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollModelProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3dc5-3Esm2QDz99WvYbrMW6/bVCE4Ubw\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 15813,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollModelProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollProvider.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"212b-XfJ2ud5iCU0Cage5ZaXamwyTwXw\"",
    "mtime": "2024-08-01T03:05:11.887Z",
    "size": 8491,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollProvider.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5544-ZnBof4eQS1WsuCY9qyCDlEAsau8\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 21828,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/stickyScroll/browser/stickyScrollWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/completionModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25cf-mc9hJbH+e+wg70U80AKpFWsXnW4\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 9679,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/completionModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggest.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"44bf-TAivXGm5d73nbqr3ppbSRsDzqDo\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 17599,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggest.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestAlternatives.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ea9-xQ2dTdI27BDicEP7HhR5HEUvKcg\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 3753,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestAlternatives.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestCommitCharacters.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9a3-E7zMCTQevqKBfJK6NLnVn8vlJGQ\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 2467,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestCommitCharacters.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestController.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestController.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ae90-Xx+AA8Dew1EgHDUvqJ7ekiQBjkQ\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 44688,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestInlineCompletions.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestInlineCompletions.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestInlineCompletions.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2a94-TEYJkp2rkK2O0zYzrIq13lTU/RM\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 10900,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestInlineCompletions.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestMemory.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26eb-QpBllfYJvcGJA2BwH8Y7qxizjDM\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 9963,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestMemory.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestModel.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7d8a-G2MQqVDSv2eO28YXKxrEGGxu1uM\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 32138,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestModel.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestOvertypingCapturer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"99b-oyco4NSUisI+xb1TjT3O8yPMxk4\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 2459,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestOvertypingCapturer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a28a-DKiEAN2OG+HwJVRaNCiXDpVeghc\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 41610,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetDetails.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"455c-FO+3oWsZNN8H1CURfePZ6e1vKjo\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 17756,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetDetails.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2bbf-3FyVKxTDEjidLw3qRG4gm/Z1wiw\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 11199,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetStatus.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1162-nplKAV25CbiVjQUt4+kyyPzyIC4\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 4450,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/suggestWidgetStatus.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/wordContextKey.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"cc4-gsXfwvcuLBpSx0RXSJip5Z7c5vo\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 3268,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/wordContextKey.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/wordDistance.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"add-ia3wEfUbR6fm3QxkR3wqolCqnyE\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 2781,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/wordDistance.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/symbolIcons/browser/symbolIcons.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1565-C4Y+ht3R7b04jYR4oklM9MsOiRM\"",
    "mtime": "2024-08-01T03:05:11.888Z",
    "size": 5477,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/symbolIcons/browser/symbolIcons.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/symbolIcons/browser/symbolIcons.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ea5-qrQ1onS3GD+0ZV66eNic1vWn5rw\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 11941,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/symbolIcons/browser/symbolIcons.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.893Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"865-zEU7ELhjlO5Ml45w/M1UhX14jhs\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 2149,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/tokenization/browser/tokenization.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/tokenization/browser/tokenization.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/tokenization/browser/tokenization.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"50a-OUK+YmO6F/Unn9KdSN1RbE0ANOQ\"",
    "mtime": "2024-08-01T03:05:11.845Z",
    "size": 1290,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/tokenization/browser/tokenization.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/bannerController.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"729-r1biRH2HORcPB/U1mRCZTGLqEg0\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 1833,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/bannerController.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/bannerController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1525-khbTochDWgsqZxB0b58xGoZNspQ\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 5413,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/bannerController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"224-s406It7R/2RRW4ygqARtGMknypw\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 548,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7efe-FAOVgRxNKIIfNm6yIEg0OP76zFU\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 32510,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unicodeHighlighter/browser/unicodeHighlighter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1694-Hh9Z+pC1PIoPY95RY/igVGp234I\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 5780,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/highlightDecorations.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"656-jnxMjceSnrHywpL5+VFp9ReNdkg\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 1622,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/highlightDecorations.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/highlightDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c11-akvfZAe+jn8ai9etseujdrosWy0\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 7185,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/highlightDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"8ad5-1PjQBJlrNFOpBD/SxtIImm5XIKk\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 35541,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordOperations/browser/wordOperations.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordOperations/browser/wordOperations.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordOperations/browser/wordOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4aa2-JcthhsDYRw19t1XvS+KH9bsmRDU\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 19106,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordOperations/browser/wordOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordPartOperations/browser/wordPartOperations.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordPartOperations/browser/wordPartOperations.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordPartOperations/browser/wordPartOperations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"17d7-yi7lO2w4EfFny+WRdpJR5xL6MMM\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 6103,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/wordPartOperations/browser/wordPartOperations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/zoneWidget/browser/zoneWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"257-DH+8rMxp2Na0kiTh3M4lmMlaJAo\"",
    "mtime": "2024-08-01T03:05:11.846Z",
    "size": 599,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/zoneWidget/browser/zoneWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/zoneWidget/browser/zoneWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3bc2-/IKn+abt0378x4ZjPe6iOfzHrts\"",
    "mtime": "2024-08-01T03:05:11.889Z",
    "size": 15298,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/zoneWidget/browser/zoneWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"f7c-KKIOy+pefFQO3wuvZdimMjPZZ6c\"",
    "mtime": "2024-08-01T03:05:11.765Z",
    "size": 3964,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a42-LGEit42VgIhbosOHFdXfjo6DhSM\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 2626,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"59b-HthYUqrMha+vYWokPch8XU3tJsk\"",
    "mtime": "2024-08-01T03:05:11.748Z",
    "size": 1435,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2d5f-r8q2FHn7gsvNPqxkTWQd6Fwd4vY\"",
    "mtime": "2024-08-01T03:05:11.822Z",
    "size": 11615,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/inspectTokens/inspectTokens.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1170-uG4O3Yn2l+kh8E0zyVcp2NqfXHc\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 4464,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dd3-wTTO1uAgA2pLTE6DStPL6uUN60w\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 3539,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11d3-fZwX7+Ksn4JxoiFxKDx3fMrwtlo\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 4563,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"371-nMtGIjMUH4IQzntnLi2roalOqy0\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 881,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickInput/standaloneQuickInput.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7e9-UUwGIIJSxx2aEL5hZw9ME5h7E4Q\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 2025,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickInput/standaloneQuickInput.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1c83-qUEUpPNaQi0auJSpmyNn25M5Rog\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 7299,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a86-q58oKWmVgBEIdr30UGIk2n7sGos\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 2694,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.835Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"75f-X/NmFPwDAlKVClAsiP9rs8gGIjE\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 1887,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchCommon.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"110f-N8t8v2Pf9FRQNjzyPb2eSl/rGj8\"",
    "mtime": "2024-08-01T03:05:11.748Z",
    "size": 4367,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchCommon.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchCompile.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"51f7-SSPQ6HnW859IX105BotGEZk5qgk\"",
    "mtime": "2024-08-01T03:05:11.822Z",
    "size": 20983,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchCompile.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchLexer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"84ef-BN4nI9fbWHV5xgVQxUN8by1d8v0\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 34031,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchLexer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchTypes.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16b-EowE4pZYkCnO5xAyY6EVxovwQ0M\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 363,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/standalone/common/monarch/monarchTypes.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/media/quickInput.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"20a1-kIh1y6/ps+TnoMSxbsWw8EuoNao\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 8353,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/quickinput/browser/media/quickInput.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/severityIcon/browser/media/severityIcon.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"639-OUpzl8qNBcHvlb8SMzeAqCitEZs\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 1593,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/severityIcon/browser/media/severityIcon.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/baseColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1421-FQD+6GxE0tjg0rN9dpx4uqWvN3o\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 5153,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/baseColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/chartsColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a4c-1kkK5WLNFCf3gpSSQkkJPAc6hmE\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 2636,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/chartsColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/editorColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"75d4-yU2s/PuYqT9I1zANTxxwmn632dw\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 30164,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/editorColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/inputColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2bc5-6UzQYKrEWM7qdOk/+LvZXwENbCk\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 11205,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/inputColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/listColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2ad0-Ru8S/1UHFuRwDU/iUHZ7EG2mOoI\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 10960,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/listColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/menuColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a1b-mAhnETQ0zpFTyb9ITt6oV5TDDCY\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 2587,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/menuColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/minimapColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1094-UBgXwbgjm9oTafIayQgIXfNO5Dg\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 4244,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/minimapColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/miscColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c29-JlfhrMhEm4S5nLI+/xGNVejzelA\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 3113,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/miscColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/quickpickColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ec9-sp6M2T7cqeMzJYZVrr4TJun0/v8\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 3785,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/quickpickColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/searchColors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"70b-76wCPMJhIZqm4YfEnakK7W/E1FQ\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 1803,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/platform/theme/common/colors/searchColors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon-modifiers.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3ef-yQb9N40FF8uFtMVmHb5LbmgzSvg\"",
    "mtime": "2024-08-01T03:05:11.823Z",
    "size": 1007,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon-modifiers.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"368-4BiQIDEfYh7H3r5SEV89Wr0MSUM\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 872,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon.ttf": {
    "type": "font/ttf",
    "etag": "\"139d4-58fQ8Ohjcapek6AgDzlcXTeWfi4\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 80340,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/codicons/codicon/codicon.ttf"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/media/scrollbars.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"781-CsJTZD//pzp1d4LPkH5b4f0WzaE\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 1921,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/scrollbar/media/scrollbars.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/media/tree.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1001-8P7JLb6DlOnSyHnwGsWIB+Q8QQw\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 4097,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/base/browser/ui/tree/media/tree.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"682-YWKoLRbprI/hlwt8c06vcb7u6tg\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 1666,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7638-3uboL0pvJ9LnAEAxrhBEdH6gcu4\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 30264,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/accessibleDiffViewer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorDecorations.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1a0c-wl2gIKgKD2GjB+8C4/8RplI6RhQ\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 6668,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorDecorations.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorEditors.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2835-0sbMzunn3LhQwkLFmqYmDnOrHb0\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 10293,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorEditors.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorSash.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f5d-3AuIxk6hncjEo4S7wN8Z0NFX6gI\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 3933,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorSash.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/gutterFeature.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"35f4-vvrLS3tcddGnBTIJhIryBYuXU/s\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 13812,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/gutterFeature.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/hideUnchangedRegionsFeature.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5709-z7R/h9Rj71MmqIwXrrXUyTLGDjo\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 22281,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/hideUnchangedRegionsFeature.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ebe-BJ8qj+37w3dC0u2WPzeGvYuRQH8\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 16062,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/overviewRulerFeature.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2941-kLa4JRhG3v51KVpodxJfS9l1No4\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 10561,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/overviewRulerFeature.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/revertButtonsFeature.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19f6-cFDGVumJobQv3MVRPLP9PpSu8io\"",
    "mtime": "2024-08-01T03:05:11.824Z",
    "size": 6646,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/features/revertButtonsFeature.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/utils/editorGutter.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"182f-WoxxWpBK+eugG7vkATKjbyEuK+U\"",
    "mtime": "2024-08-01T03:05:11.766Z",
    "size": 6191,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/utils/editorGutter.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"181a-3YQml1Mn4C+iIJ/SdMxRyRGZGFM\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 6170,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/markdownRenderer/browser/renderedMarkdown.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"362-2wcgEn1zwXEqEKHoltbKCQ+Tuds\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 866,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/markdownRenderer/browser/renderedMarkdown.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12bb-D85uE/1BFf70Msl+u7+9GmZFgBc\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 4795,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/dynamicProgrammingDiffing.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11b7-6iV4Xfa2lI0sX4DYScVFOT3Xx+4\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 4535,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/dynamicProgrammingDiffing.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1798-2mEvQrBBttdfePjYCCDvkpzfVew\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 6040,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/ast.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"406b-Myn3eENTRbI/ZWb5wqZTda38xb0\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 16491,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/ast.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1458-sTIz9rXZW4Wy3d+z6h2Yd8n+zvg\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 5208,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/bracketPairsTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4450-vo+CPFgwAax8omFNrO9/oOpxLeA\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 17488,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/bracketPairsTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"125f-KVwykQgXipJLnDe4mj8xB7CH9vQ\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 4703,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1414-GaZwuxtIWHBFh14e/q1NTlfrKOc\"",
    "mtime": "2024-08-01T03:05:11.825Z",
    "size": 5140,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/concat23Trees.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1b9b-hkUlIcqm4skjLbk3IAxh4x6ImOc\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 7067,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/concat23Trees.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1063-7a4mAFeCcb3ZcuU+Nl4j4Nhj6Yg\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 4195,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/nodeReader.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"13fe-grBBIz+NaQ/6m+nM51GUcR6IuuI\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 5118,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/nodeReader.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/parser.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15cf-alnHx26DF4jmZyuYK84A4Pg0Bw4\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 5583,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/parser.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e92-MVSZa6BEleByZcljrcQvRzK1rIc\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 3730,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/tokenizer.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3513-owAIJt1HjnDdLouY3N6oiNknztE\"",
    "mtime": "2024-08-01T03:05:11.826Z",
    "size": 13587,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/tokenizer.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/media/gotoErrorWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"7e4-xa4JL3sYOeMiqlwalB9vNFjis14\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 2020,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoError/browser/media/gotoErrorWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1ec0-ry60D2ojXreSK+GwXvyIeo6MGbY\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 7872,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1f7-0iNafzi7MoAjQLicD5zsEY3s+64\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 503,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.d.ts": {
    "type": "video/mp2t",
    "etag": "\"a-Hr+tQ49o/dtNuE2e9cC5IrWfiVs\"",
    "mtime": "2024-08-01T03:05:11.894Z",
    "size": 10,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.d.ts"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"37ce-2kDq/u5uJuB5nd/68BflF9L/mnQ\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 14286,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesController.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"486d-uwasjd+3s4UHCCPlbUNwnLb0IPk\"",
    "mtime": "2024-08-01T03:05:11.861Z",
    "size": 18541,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesController.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesTree.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"20cc-NaUo+14VNQk3hqmHUJ1osJ6pt80\"",
    "mtime": "2024-08-01T03:05:11.890Z",
    "size": 8396,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesTree.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"b85-QemfFppwlcbwRdFCtqSw/yMTFsU\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 2949,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesWidget.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"51fe-m0H2LHX5loZsFmjPeBMTqJY14iE\"",
    "mtime": "2024-08-01T03:05:11.891Z",
    "size": 20990,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/gotoSymbol/browser/peek/referencesWidget.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/peekView/browser/media/peekViewWidget.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"85c-o1yVeuoqMpL86MgRwS8TveQ438o\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 2140,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/peekView/browser/media/peekViewWidget.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/media/suggest.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3436-MRkRbm/mj1L3nAFOc5z5pvwNLs0\"",
    "mtime": "2024-08-01T03:05:11.829Z",
    "size": 13366,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/contrib/suggest/browser/media/suggest.css"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/diffEditorViewZones.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7c37-atIymthWwITIrsFnb6G+85Hi4dI\"",
    "mtime": "2024-08-01T03:05:11.749Z",
    "size": 31799,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/diffEditorViewZones.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/inlineDiffDeletedCodeMargin.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1f97-RcAPEUkf/c0Mq2lfcm088+JOYfM\"",
    "mtime": "2024-08-01T03:05:11.827Z",
    "size": 8087,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/inlineDiffDeletedCodeMargin.js"
  },
  "/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"19fd-SZqA++k16kLW/5Fp3ckI8BbpcI0\"",
    "mtime": "2024-08-01T03:05:11.828Z",
    "size": 6653,
    "path": "../public/_nuxt/nuxt-monaco-editor/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines.js"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};
const basename = function(p, extension) {
  const lastSegment = normalizeWindowsPath(p).split("/").pop();
  return extension && lastSegment.endsWith(extension) ? lastSegment.slice(0, -extension.length) : lastSegment;
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises$1.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _f4b49z = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    setResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$1({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const basicReporter = {
  log(logObj) {
    (console[logObj.type] || console.log)(...logObj.args);
  }
};
function createConsola(options = {}) {
  return createConsola$1({
    reporters: [basicReporter],
    ...options
  });
}
const consola = createConsola();
consola.consola = consola;

const collections = {
};

const DEFAULT_ENDPOINT = "https://api.iconify.design";
const _DaNh0Z = defineCachedEventHandler(async (ctx) => {
  const url = ctx.node.req.url;
  if (!url)
    return;
  const options = useAppConfig().icon;
  const collectionName = ctx.context.params?.collection?.replace(/\.json$/, "");
  const collection = collectionName ? await collections[collectionName]?.() : null;
  const apiEndPoint = options.iconifyApiEndpoint || DEFAULT_ENDPOINT;
  const apiUrl = new URL(basename(url), apiEndPoint);
  const icons = apiUrl.searchParams.get("icons")?.split(",");
  if (collection) {
    if (icons?.length) {
      const data = getIcons(
        collection,
        icons
      );
      consola.debug(`[Icon] serving ${(icons || []).map((i) => "`" + collectionName + ":" + i + "`").join(",")} from bundled collection`);
      return data;
    }
  }
  if (options.fallbackToApi) {
    consola.debug(`[Icon] fetching ${(icons || []).map((i) => "`" + collectionName + ":" + i + "`").join(",")} from iconify api`);
    const data = await $fetch(apiUrl.href);
    return data;
  }
});

const _lazy_9y0NM6 = () => import('./routes/api/flaff.post.mjs');
const _lazy_2NsWWe = () => import('./routes/api/flaff/_flaffId/file/index.get.mjs');
const _lazy_Sozo4u = () => import('./routes/api/flaff/_flaffId/file/index.put.mjs');
const _lazy_AanqqY = () => import('./routes/api/flaff/_flaffId/index.post.mjs');
const _lazy_KvBDnf = () => import('./routes/api/flaff/index.get.mjs');
const _lazy_6frsbc = () => import('./routes/api/flaff/index.put.mjs');
const _lazy_lzXIJV = () => import('./routes/renderer.mjs');

const handlers = [
  { route: '', handler: _f4b49z, lazy: false, middleware: true, method: undefined },
  { route: '/api/flaff', handler: _lazy_9y0NM6, lazy: true, middleware: false, method: "post" },
  { route: '/api/flaff/:flaffId/file/:fileId', handler: _lazy_2NsWWe, lazy: true, middleware: false, method: "get" },
  { route: '/api/flaff/:flaffId/file/:fileId', handler: _lazy_Sozo4u, lazy: true, middleware: false, method: "put" },
  { route: '/api/flaff/:flaffId/file', handler: _lazy_AanqqY, lazy: true, middleware: false, method: "post" },
  { route: '/api/flaff/:flaffId', handler: _lazy_KvBDnf, lazy: true, middleware: false, method: "get" },
  { route: '/api/flaff/:flaffId', handler: _lazy_6frsbc, lazy: true, middleware: false, method: "put" },
  { route: '/__nuxt_error', handler: _lazy_lzXIJV, lazy: true, middleware: false, method: undefined },
  { route: '/api/_nuxt_icon/:collection', handler: _DaNh0Z, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_lzXIJV, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((_err) => {
      console.error("Error while capturing another error", _err);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const localCall = createCall(toNodeListener(h3App));
  const _localFetch = createFetch(localCall, globalThis.fetch);
  const localFetch = (input, init) => _localFetch(input, init).then(
    (response) => normalizeFetchResponse(response)
  );
  const $fetch = createFetch$1({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  h3App.use(
    eventHandler((event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const envContext = event.node.req?.__unenv__;
      if (envContext) {
        Object.assign(event.context, envContext);
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (envContext?.waitUntil) {
          envContext.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
    })
  );
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  for (const plugin of plugins) {
    try {
      plugin(app);
    } catch (err) {
      captureError(err, { tags: ["plugin"] });
      throw err;
    }
  }
  return app;
}
const nitroApp = createNitroApp();
const useNitroApp = () => nitroApp;

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((err) => {
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        destroy(socket);
      }
    }
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        destroy(socket);
      }
    }
  }
  server.on("request", function(req, res) {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", function() {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", function(socket) {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", function() {
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    if (options.development) {
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        return Promise.resolve(false);
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((err) => {
      const errString = typeof err === "string" ? err : JSON.stringify(err);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT, 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((err) => {
          console.error(err);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const path = process.env.NITRO_UNIX_SOCKET;
const listener = server.listen(path ? { path } : { port, host }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const addressInfo = listener.address();
  if (typeof addressInfo === "string") {
    console.log(`Listening on unix socket ${addressInfo}`);
    return;
  }
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${addressInfo.family === "IPv6" ? `[${addressInfo.address}]` : addressInfo.address}:${addressInfo.port}${baseURL}`;
  console.log(`Listening on ${url}`);
});
trapUnhandledNodeErrors();
setupGracefulShutdown(listener, nitroApp);
const nodeServer = {};

export { createStorage as a, getQuery as b, createError$1 as c, defineEventHandler as d, readValidatedBody as e, fsDriver as f, getValidatedRouterParams as g, eventHandler as h, send as i, getResponseStatus as j, setResponseStatus as k, useNitroApp as l, setResponseHeaders as m, joinRelativeURL as n, getRouteRules as o, prisma as p, getResponseStatusText as q, readMultipartFormData as r, setResponseHeader as s, nodeServer as t, useRuntimeConfig as u };
//# sourceMappingURL=runtime.mjs.map
