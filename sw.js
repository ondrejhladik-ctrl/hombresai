(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:process.env>
  var define_process_env_default;
  var init_define_process_env = __esm({
    "<define:process.env>"() {
      define_process_env_default = {};
    }
  });

  // web/node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "web/node_modules/base64-js/index.js"(exports) {
      "use strict";
      init_define_process_env();
      init_globals();
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // web/node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "web/node_modules/ieee754/index.js"(exports) {
      init_define_process_env();
      init_globals();
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // web/node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "web/node_modules/buffer/index.js"(exports) {
      "use strict";
      init_define_process_env();
      init_globals();
      var base64 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer3;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          const arr = new Uint8Array(1);
          const proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer3.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer3.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer3.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        const buf = new Uint8Array(length);
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function Buffer3(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      Buffer3.poolSize = 8192;
      function from(value, encodingOrOffset, length) {
        if (typeof value === "string") {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer3.from(valueOf, encodingOrOffset, length);
        }
        const b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer3.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
      Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer3, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer3.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer3.allocUnsafe = function(size) {
        return allocUnsafe(size);
      };
      Buffer3.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        const length = byteLength(string, encoding) | 0;
        let buf = createBuffer(length);
        const actual = buf.write(string, encoding);
        if (actual !== length) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        const length = array.length < 0 ? 0 : checked(array.length) | 0;
        const buf = createBuffer(length);
        for (let i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          const copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        let buf;
        if (byteOffset === void 0 && length === void 0) {
          buf = new Uint8Array(array);
        } else if (length === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        Object.setPrototypeOf(buf, Buffer3.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer3.isBuffer(obj)) {
          const len = checked(obj.length) | 0;
          const buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) {
          length = 0;
        }
        return Buffer3.alloc(+length);
      }
      Buffer3.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer3.prototype;
      };
      Buffer3.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
        if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        let x = a.length;
        let y = b.length;
        for (let i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer3.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer3.concat = function concat(list2, length) {
        if (!Array.isArray(list2)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list2.length === 0) {
          return Buffer3.alloc(0);
        }
        let i;
        if (length === void 0) {
          length = 0;
          for (i = 0; i < list2.length; ++i) {
            length += list2[i].length;
          }
        }
        const buffer = Buffer3.allocUnsafe(length);
        let pos = 0;
        for (i = 0; i < list2.length; ++i) {
          let buf = list2[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
              buf.copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer3.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer3.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
          );
        }
        const len = string.length;
        const mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes(string).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        let loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer3.prototype._isBuffer = true;
      function swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer3.prototype.swap16 = function swap16() {
        const len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (let i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer3.prototype.swap32 = function swap32() {
        const len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (let i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer3.prototype.swap64 = function swap64() {
        const len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (let i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer3.prototype.toString = function toString() {
        const length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
      Buffer3.prototype.equals = function equals(b) {
        if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer3.compare(this, b) === 0;
      };
      Buffer3.prototype.inspect = function inspect() {
        let str = "";
        const max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
      }
      Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer3.from(target, target.offset, target.byteLength);
        }
        if (!Buffer3.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        let x = thisEnd - thisStart;
        let y = end - start;
        const len = Math.min(x, y);
        const thisCopy = this.slice(thisStart, thisEnd);
        const targetCopy = target.slice(start, end);
        for (let i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer3.from(val, encoding);
        }
        if (Buffer3.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        let indexSize = 1;
        let arrLength = arr.length;
        let valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read2(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        let i;
        if (dir) {
          let foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
              if (read2(arr, i + j) !== read2(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        const remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        const strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        let i;
        for (i = 0; i < length; ++i) {
          const parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer3.prototype.write = function write2(string, offset, length, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (length === void 0 && typeof offset === "string") {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length;
            length = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        const remaining = this.length - offset;
        if (length === void 0 || length > remaining) length = remaining;
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string, offset, length);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string, offset, length);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string, offset, length);
            case "base64":
              return base64Write(this, string, offset, length);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer3.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf);
        } else {
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        const res = [];
        let i = start;
        while (i < end) {
          const firstByte = buf[i];
          let codePoint = null;
          let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        const len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        let res = "";
        let i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        const len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        let out = "";
        for (let i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        const bytes = buf.slice(start, end);
        let res = "";
        for (let i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer3.prototype.slice = function slice(start, end) {
        const len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        const newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer3.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        let val = this[offset + --byteLength2];
        let mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
        const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      });
      Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      });
      Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let i = byteLength2;
        let mul = 1;
        let val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
        return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
      });
      Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
      });
      Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let mul = 1;
        let i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function wrtBigUInt64LE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        return offset;
      }
      function wrtBigUInt64BE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset + 7] = lo;
        lo = lo >> 8;
        buf[offset + 6] = lo;
        lo = lo >> 8;
        buf[offset + 5] = lo;
        lo = lo >> 8;
        buf[offset + 4] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset + 3] = hi;
        hi = hi >> 8;
        buf[offset + 2] = hi;
        hi = hi >> 8;
        buf[offset + 1] = hi;
        hi = hi >> 8;
        buf[offset] = hi;
        return offset + 8;
      }
      Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = 0;
        let mul = 1;
        let sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        let sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer3.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
              val = code;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        let i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
          const len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var errors = {};
      function E(sym, getMessage, Base) {
        errors[sym] = class NodeError extends Base {
          constructor() {
            super();
            Object.defineProperty(this, "message", {
              value: getMessage.apply(this, arguments),
              writable: true,
              configurable: true
            });
            this.name = `${this.name} [${sym}]`;
            this.stack;
            delete this.name;
          }
          get code() {
            return sym;
          }
          set code(value) {
            Object.defineProperty(this, "code", {
              configurable: true,
              enumerable: true,
              value,
              writable: true
            });
          }
          toString() {
            return `${this.name} [${sym}]: ${this.message}`;
          }
        };
      }
      E(
        "ERR_BUFFER_OUT_OF_BOUNDS",
        function(name) {
          if (name) {
            return `${name} is outside of buffer bounds`;
          }
          return "Attempt to access memory outside buffer bounds";
        },
        RangeError
      );
      E(
        "ERR_INVALID_ARG_TYPE",
        function(name, actual) {
          return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        function(str, range, input) {
          let msg = `The value of "${str}" is out of range.`;
          let received = input;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          }
          msg += ` It must be ${range}. Received ${received}`;
          return msg;
        },
        RangeError
      );
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function checkBounds(buf, offset, byteLength2) {
        validateNumber(offset, "offset");
        if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
          boundsError(offset, buf.length - (byteLength2 + 1));
        }
      }
      function checkIntBI(value, min, max, buf, offset, byteLength2) {
        if (value > max || value < min) {
          const n = typeof min === "bigint" ? "n" : "";
          let range;
          if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
              range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
          }
          throw new errors.ERR_OUT_OF_RANGE("value", range, value);
        }
        checkBounds(buf, offset, byteLength2);
      }
      function validateNumber(value, name) {
        if (typeof value !== "number") {
          throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
      }
      function boundsError(value, length, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type);
          throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
        }
        if (length < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
        }
        throw new errors.ERR_OUT_OF_RANGE(
          type || "offset",
          `>= ${type ? 1 : 0} and <= ${length}`,
          value
        );
      }
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        let codePoint;
        const length = string.length;
        let leadSurrogate = null;
        const bytes = [];
        for (let i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        let c, hi, lo;
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        let i;
        for (i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = function() {
        const alphabet = "0123456789abcdef";
        const table = new Array(256);
        for (let i = 0; i < 16; ++i) {
          const i16 = i * 16;
          for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
          }
        }
        return table;
      }();
      function defineBigIntMethod(fn) {
        return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
      }
      function BufferBigIntNotDefined() {
        throw new Error("BigInt not supported");
      }
    }
  });

  // web/shims/globals.js
  var import_buffer, process, wrap, unwrap, native, setTimeout, setInterval, clearTimeout;
  var init_globals = __esm({
    "web/shims/globals.js"() {
      import_buffer = __toESM(require_buffer());
      process = {
        env: {},
        argv: [],
        pid: 1,
        platform: "web",
        execPath: "",
        version: "v20.0.0",
        versions: { node: "20.0.0" },
        cwd: () => "/app",
        exit() {
        },
        on() {
          return this;
        },
        once() {
          return this;
        },
        emitWarning() {
        },
        nextTick: (fn, ...args) => queueMicrotask(() => fn(...args))
      };
      wrap = (id) => ({ id, unref() {
        return this;
      }, ref() {
        return this;
      }, hasRef: () => true, [Symbol.toPrimitive]: () => id });
      unwrap = (t) => t && typeof t === "object" ? t.id : t;
      native = {
        setTimeout: globalThis.setTimeout.bind(globalThis),
        setInterval: globalThis.setInterval.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        clearInterval: globalThis.clearInterval.bind(globalThis)
      };
      setTimeout = (fn, ms, ...args) => wrap(native.setTimeout(fn, ms, ...args));
      setInterval = (fn, ms, ...args) => wrap(native.setInterval(fn, ms, ...args));
      clearTimeout = (t) => native.clearTimeout(unwrap(t));
    }
  });

  // hombresai:builtin-files
  var BUILTIN;
  var init_builtin_files = __esm({
    "hombresai:builtin-files"() {
      init_define_process_env();
      init_globals();
      BUILTIN = { "/app/effects/README.md": '# hombresai effects\n\nEvery file in this folder is one effect for the **Effects** section of hombresai. Effects are small GPU programs\n(GLSL ES 3.00 fragment shaders) that run live in the browser on images, videos and the camera \u2013 no AI, no cost.\n\n- `effects/*.glsl` \u2013 the effects that come with the app.\n- `effects/custom/*.glsl` \u2013 your own effects (made with the AI coder, saved from the code editor, or written by hand).\n  The app reloads them whenever you come back to its window, so you can edit them in any editor or coding agent.\n\n## File structure\n\n```glsl\n// @name Neon Lines\n// @category Lines\n// @description One sentence that explains the look.\n// @palette violet\n// @finish glow=0.5 glowSize=16\n// @preset name="Acid Variant" uSpacing=6 palette=acid glow=0.3\n\nuniform float uSpacing;  // @param label="Line spacing" min=2 max=40 step=0.5 default=7\nuniform bool uPaper;     // @param label="Ink on paper" default=false\n\nvec4 effect(vec2 uv) {\n  vec3 c = imgCell(uv, uSpacing).rgb;       // colour of the image around this pixel\n  float t = inkAmount(luma(c));             // 0..1, how much ink this area gets\n  float d = abs(fract(uv.y * uSize.y / uSpacing) - 0.5);\n  return vec4(ink(t, c), cover(d, 0.5 * t)); // rgb = ink colour, a = coverage (0 = background)\n}\n```\n\nThe app wraps the file with the shared header listed below and calls `effect(vUv)` for every pixel.\nDo not write `#version`, `precision`, `main()` or redeclare anything from the header.\n\n### Metadata comments (all optional except @name)\n\n| Line | Meaning |\n|---|---|\n| `// @name \u2026` | Name shown on the effect card. |\n| `// @category \u2026` | One of: Pixel, Dither, Print, Lines, Text, Color, Glitch, Edges, Distort (or a new one). |\n| `// @description \u2026` | One short sentence. |\n| `// @palette id` | Palette chosen when the effect is opened (ids below). |\n| `// @finish key=value \u2026` | Default finish: `glow` 0\u20131, `glowSize` 2\u201360, `glowThreshold` 0\u20131, `scanlines` 0\u20131, `vignette` 0\u20131, `grain` 0\u20131, `bg` = `auto` / `transparent` / `#rrggbb`. |\n| `// @animated` | The effect moves over time (uses `uTime`). `// @animated param=uSpeed` animates only while that slider is not 0 / that switch is on. |\n| `// @preset name="\u2026" \u2026` | An extra card with different slider values, palette or finish (`uName=value`, `palette=id`, finish keys). |\n\n### Sliders \u2013 `@param`\n\nEach uniform with a `// @param` comment becomes a control. Supported forms:\n\n```glsl\nuniform float uAmount;  // @param label="Amount" min=0 max=1 step=0.01 default=0.5     (slider)\nuniform int uMode;      // @param label="Mode" options="Lines,Dots,Waves" default=0      (dropdown, value = index)\nuniform bool uInvert;   // @param label="Invert" default=false                         (switch)\nuniform vec3 uTint;     // @param label="Tint" type=color default=#ff3366              (colour picker, rgb 0..1)\nuniform int uChars;     // @param label="Characters" type=charset default=classic      (character set for glyph())\nuniform int uKernel;    // @param label="Algorithm" type=kernel default=floyd          (error-diffusion algorithm)\n```\n\n`show="uMode>0"` (also `==`, `!=`, `<`, `>=`\u2026, or `show="original"` / `show="!original"` for the palette) shows a\ncontrol only when it matters.\n\nA bool named `uPaper` is special: when it is on, the lightest palette colour becomes the background and `ink()` /\n`inkAmount()` work with darkness (ink on paper) instead of light.\n\n### Error diffusion \u2013 `// @cpu diffusion`\n\nError diffusion (Floyd\u2013Steinberg, Atkinson\u2026) can\u2019t run in a shader, so the app does it on the CPU before your\nshader runs and hands you the result: `dithered(uv)` returns the dithered colour (alpha 0 on the background colour).\nThe CPU stage reads these sliders by name (declare the ones you need): `uCell` pixel size, `uKernel` algorithm\n(`type=kernel`), `uStrength` 0\u20131, `uThreshold` \u22120.5\u20260.5, `uSerpentine`, `uModulate` (0 none, 1 lines, 2 waves,\n3 rings, 4 dots, 5 flow, 6 noise), `uModAmount`, `uModScale` (design px), `uModAngle`, `uWarp`, `uSpeed`,\n`uNearest` (closest palette colour instead of a brightness ramp) and `uLevels` (for original colours).\nKernel ids: floyd, atkinson, jjn, stucki, burkes, sierra, sierra2, sierralite, falsefloyd, row, column.\n\n## Coordinates\n\n- `uv` \u2013 0..1 across the image, origin at the **bottom-left** (y goes up).\n- `uSize` \u2013 the design size in pixels (the long side is 1080). Measure every size in these pixels: `uv * uSize`.\n  Exports at 2\xD7 or 4\xD7 and videos at any resolution then look exactly like the preview.\n- `uOutSize` \u2013 the real output size in pixels (for anti-aliasing math only); `outScale()` = output px per design px.\n\n## Header \u2013 uniforms and helpers you can use\n\n```glsl\nuniform sampler2D uImage;  // the source image / video frame (already adjusted), mipmapped\nuniform vec2 uSize;        // design size in px\nuniform vec2 uOutSize;     // output size in px\nuniform float uTime;       // seconds since the effect started\nuniform vec3 uPal[16];     // the palette, darkest first (first = background)\nuniform int uPalN;         // number of palette colours (2..16)\nuniform bool uPalOriginal; // true when the user picked "Original colors"\nuniform bool uPaperMode;   // true when the effect\'s uPaper switch is on\nconst float PI, TAU;\n\nfloat luma(vec3 c);                    // perceived brightness 0..1\nvec4  img(vec2 uv);                    // sample the image\nvec4  imgCell(vec2 uv, float cellPx);  // average colour of a cellPx-sized area around uv (smooth, cheap)\nfloat outScale();                      // output px per design px\nvec2  rot(vec2 p, float degrees);      // rotate a point around the origin\nfloat hash(vec2 p);                    // random 0..1 from a position\nfloat ign(vec2 p);                     // interleaved-gradient noise 0..1 (good for dithering)\nfloat blueNoise(vec2 cell);            // blue-noise threshold 0..1 for a cell \u2013 the finest, pattern-free dither\nfloat bayer(vec2 cell, int n);         // ordered-dither threshold 0..1 for an n\xD7n matrix (2, 4, 8 or 16)\nfloat cover(float dist, float size);   // anti-aliased coverage: 1 where dist < size, 0 outside\nfloat inkAmount(float lum);            // lum, or 1 - lum in ink-on-paper mode\nvec3  palAt(int i);                    // palette colour i\nint   palIndex(float t);               // palette index for brightness t (stepped)\nvec3  pal(float t);                    // stepped palette colour for brightness t\nvec3  palSmooth(float t);              // smooth gradient through the palette\nvec3  ink(float amount, vec3 src);     // ink colour for amount 0..1 (palette without background, or src for original colours)\nint   nearestIndex(vec3 c);            // closest palette colour index\nvec3  nearestColor(vec3 c);            // closest palette colour (or c for original colours)\nvec4  paletteOut(int i);               // palette colour i as output (the background index becomes transparent)\nfloat glyph(int index, vec2 local, float cellPx); // coverage of character `index` at `local` (0..1 inside the cell)\nuniform int uGlyphCount;               // number of characters of the chosen character set\nuniform int uGlyphMode;                // 0 = ordered by density, 1 = the user\'s text in reading order, 2 = random (matrix)\nvec4  dithered(vec2 uv);               // result of the CPU error diffusion (only with // @cpu diffusion)\n```\n\n### Output\n\nReturn `vec4(rgb, alpha)`: `rgb` is the colour you draw, `alpha` is how much of the pixel it covers.\nAlpha 0 shows the background (palette background, a chosen colour, or transparency in PNG exports).\nEffects that recolour the whole picture return alpha 1.\n\n### Rules (WebGL2 / GLSL ES 3.00)\n\n- Float literals need a dot: `1.0`, not `1`. There is no automatic int \u2194 float conversion \u2013 use `float(i)` / `int(x)`.\n- Loops need a constant upper bound (`for (int i = 0; i < 32; i++)`), break early with `if (\u2026) break;`.\n- Use `img()` / `imgCell()` / `texture()`, never `texture2D` or `gl_FragColor`.\n- Helper functions must be defined before `effect()`. Keep it fast \u2013 it runs for every pixel of every video frame.\n- Sizes in design pixels, never in raw output pixels. Animate only with `uTime`.\n\n### Palette ids\n\nmono, newsprint, amber, phosphor, gold, blueprint, violet, acid, synth, blood, ice, thermal, gameboy, cga, pico8,\nc64, teletext, sepia, auto (the main colours of the user\u2019s image), original\n\n### Character set ids (for `type=charset`)\n\nclassic, dense, blocks, binary, braille, dots, hearts, matrix, text (the user\'s own text)\n', "/app/effects/ascii.glsl": '// @name ASCII\n// @category Text\n// @description Your image rebuilt from characters \u2013 pick a character set or type your own text.\n// @palette gold\n// @finish glow=0.4\n// @animated param=uSpeed\n// @preset name="Matrix Rain" uCharset=matrix uCell=12 uSpeed=1 palette=phosphor glow=0.55\n// @preset name="Amber Terminal" uCharset=dense uCell=8 palette=amber glow=0.4 scanlines=0.35\n// @preset name="Your Words" uCharset=text uCell=11 palette=violet glow=0.45\n\nuniform float uCell;     // @param label="Character size" min=4 max=48 step=1 default=10\nuniform int uCharset;    // @param label="Characters" type=charset default=classic\nuniform float uOffset;   // @param label="Character offset" min=0 max=8 step=1 default=0\nuniform float uCutoff;   // @param label="Cut-off" min=0 max=0.6 step=0.01 default=0.06\nuniform float uSpeed;    // @param label="Flicker speed" min=0 max=4 step=0.01 default=0\nuniform bool uPaper;     // @param label="Ink on paper" default=false\n\nvec4 effect(vec2 uv) {\n  vec2 cellSize = vec2(uCell * 0.6, uCell);\n  vec2 px = uv * uSize;\n  vec2 cell = floor(px / cellSize);\n  vec2 local = fract(px / cellSize);\n  vec3 c = imgCell((cell + 0.5) * cellSize / uSize, uCell).rgb;\n  float t = inkAmount(luma(c));\n  if (t < uCutoff) return vec4(ink(t, c), 0.0);\n  int count = max(uGlyphCount, 1);\n  int i;\n  if (uGlyphMode == 1) {\n    float cols = ceil(uSize.x / cellSize.x);\n    float row = floor(uSize.y / cellSize.y) - cell.y;\n    i = int(mod(row * cols + cell.x + row * uOffset, float(count)));\n  } else if (uGlyphMode == 2) {\n    i = int(hash(cell + floor(uTime * uSpeed * 6.0 + hash(cell.xx) * 4.0)) * float(count));\n  } else {\n    i = int(floor(t * float(count - 1) + 0.5 + uOffset));\n  }\n  return vec4(ink(t, c), glyph(i, local, uCell));\n}\n', "/app/effects/bit-crush.glsl": '// @name Bit Crush\n// @category Glitch\n// @description Digital decay \u2013 fewer bits per color, plus bit patterns that tear the image into bands.\n// @palette original\n// @animated param=uSpeed\n// @preset name="XOR Storm" uBits=4 uMode=1 uAmount=0.8 uScale=2 uSpeed=0.5\n\nuniform float uBits;     // @param label="Bits per channel" min=1 max=8 step=1 default=3\nuniform int uMode;       // @param label="Glitch" options="None,XOR pattern,Bit shift bands,Channel swap bands" default=1\nuniform float uAmount;   // @param label="Amount" min=0 max=1 step=0.01 default=0.5 show="uMode>0"\nuniform float uScale;    // @param label="Pattern scale" min=1 max=32 step=1 default=4 show="uMode>0"\nuniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0 show="uMode>0"\n\nvec4 effect(vec2 uv) {\n  vec3 c = img(uv).rgb;\n  int bits = int(uBits);\n  int maxv = (1 << bits) - 1;\n  float levels = float(maxv);\n  ivec3 q = ivec3(floor(c * levels + 0.5));\n  float t = floor(uTime * uSpeed * 8.0);\n  vec2 cell = floor(uv * uSize / uScale);\n  float band = floor(uv.y * uSize.y / (uScale * 6.0));\n  if (uMode == 1) {\n    ivec2 p = ivec2(cell + t);\n    if (hash(cell + t * 0.37) < uAmount) q = q ^ ivec3((p.x ^ p.y) & maxv);\n  } else if (uMode == 2) {\n    if (hash(vec2(band, t)) < uAmount) {\n      int s = int(hash(vec2(band + 9.0, t)) * float(bits));\n      q = ((q << s) | (q >> (bits - s))) & maxv;\n    }\n  } else if (uMode == 3) {\n    if (hash(vec2(band, t + 3.0)) < uAmount) q = q.gbr;\n  }\n  vec3 col = vec3(q) / levels;\n  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);\n}\n', "/app/effects/chromatic-aberration.glsl": '// @name Chromatic Aberration\n// @category Glitch\n// @description Color fringes like a cheap lens \u2013 red and blue drift apart toward the edges.\n// @palette original\n// @animated param=uPulse\n// @preset name="Prism Split" uMode=1 uAmount=14 uBlur=0\n\nuniform float uAmount;   // @param label="Amount" min=0 max=40 step=0.1 default=8\nuniform int uMode;       // @param label="Direction" options="Radial (lens),Horizontal,Vertical" default=0\nuniform float uFalloff;  // @param label="Edge falloff" min=0 max=3 step=0.01 default=1.2 show="uMode==0"\nuniform float uBlur;     // @param label="Smear" min=0 max=1 step=0.01 default=0.4\nuniform float uPulse;    // @param label="Pulse speed" min=0 max=4 step=0.01 default=0\n\nvec4 effect(vec2 uv) {\n  vec2 c = uv - 0.5;\n  vec2 dir = uMode == 0 ? c * pow(max(length(c) * 2.0, 1e-4), uFalloff) : (uMode == 1 ? vec2(0.5, 0.0) : vec2(0.0, 0.5));\n  float amount = uAmount * (1.0 + 0.6 * sin(uTime * uPulse * 3.0) * step(0.001, uPulse));\n  vec2 off = dir * amount * 2.0 / uSize;\n  float r = 0.0;\n  float b = 0.0;\n  for (int i = 0; i < 8; i++) {\n    float k = 1.0 - uBlur * float(i) / 7.0;\n    r += img(uv + off * k).r;\n    b += img(uv - off * k).b;\n  }\n  vec3 col = vec3(r / 8.0, img(uv).g, b / 8.0);\n  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);\n}\n', "/app/effects/cmyk-halftone.glsl": '// @name CMYK Halftone\n// @category Print\n// @description Four rotated ink screens \u2013 cyan, magenta, yellow and black \u2013 like real offset print.\n// @palette original\n// @preset name="Comic Print" uCell=10 uInk=1.15 uBlack=0.9 uPaperTone=#fff4dc\n// @preset name="Fine Print" uCell=4 uInk=1 uBlack=0.7\n\nuniform float uCell;       // @param label="Screen size" min=3 max=40 step=0.5 default=8\nuniform float uInk;        // @param label="Ink" min=0.3 max=2 step=0.01 default=1\nuniform float uBlack;      // @param label="Black generation" min=0 max=1 step=0.01 default=0.8\nuniform float uRotation;   // @param label="Screen rotation" min=0 max=90 step=1 default=0\nuniform vec3 uPaperTone;   // @param label="Paper" type=color default=#ffffff\n\nvec4 toCmyk(vec3 c) {\n  float k = (1.0 - max(c.r, max(c.g, c.b))) * uBlack;\n  vec3 cmy = (1.0 - c - k) / max(1.0 - k, 0.001);\n  return vec4(clamp(cmy, 0.0, 1.0), k);\n}\n\n// coverage of one ink: dots on a screen rotated by `angle`, sized by that ink\'s amount at the dot centre\nfloat screen(vec2 px, float angle, int ink) {\n  vec2 r = rot(px, -angle);\n  vec2 cell = floor(r / uCell);\n  vec2 center = (cell + 0.5) * uCell;\n  vec4 s = toCmyk(imgCell(rot(center, angle) / uSize, uCell).rgb);\n  float amount = ink == 0 ? s.x : (ink == 1 ? s.y : (ink == 2 ? s.z : s.w));\n  amount = clamp(amount * uInk, 0.0, 1.0);\n  return cover(length((r - center) / uCell), sqrt(amount / PI));\n}\n\nvec4 effect(vec2 uv) {\n  vec2 px = uv * uSize;\n  float c = screen(px, 15.0 + uRotation, 0);\n  float m = screen(px, 75.0 + uRotation, 1);\n  float y = screen(px, uRotation, 2);\n  float k = screen(px, 45.0 + uRotation, 3);\n  vec3 col = uPaperTone;\n  col *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), c);\n  col *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), m);\n  col *= mix(vec3(1.0), vec3(1.0, 0.93, 0.0), y);\n  col *= mix(vec3(1.0), vec3(0.1), k);\n  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);\n}\n', "/app/effects/contour.glsl": '// @name Contour Map\n// @category Edges\n// @description Topographic lines that follow the brightness of the image.\n// @palette ice\n// @finish glow=0.2\n// @preset name="Topo Fill" uLevels=10 uFill=0.55 palette=thermal glow=0\n\nuniform float uLevels;  // @param label="Levels" min=3 max=40 step=1 default=12\nuniform float uWidth;   // @param label="Line width" min=0.3 max=6 step=0.1 default=1.3\nuniform float uSmooth;  // @param label="Smoothing" min=1 max=32 step=0.5 default=6\nuniform float uFill;    // @param label="Fill" min=0 max=1 step=0.01 default=0\n\nvec4 effect(vec2 uv) {\n  vec3 src = img(uv).rgb;\n  float t = luma(textureLod(uImage, uv, log2(max(uSmooth * outScale(), 1.0))).rgb);\n  float f = t * uLevels;\n  float d = abs(fract(f + 0.5) - 0.5);\n  float w = max(fwidth(f), 1e-5);\n  float line = clamp(uWidth * outScale() * 0.5 - d / w + 0.5, 0.0, 1.0);\n  vec3 fillCol = uPalOriginal ? src * 0.6 : pal(floor(f) / uLevels);\n  float a = max(line, uFill);\n  return vec4(mix(fillCol, ink(t, src), line / max(a, 0.001)), a);\n}\n', "/app/effects/crosshatch.glsl": '// @name Crosshatch\n// @category Print\n// @description Pen-and-ink hatching that layers up in the shadows.\n// @palette sepia\n// @preset name="Blueprint Sketch" uCell=6 uWeight=0.18 uPaper=false palette=blueprint\n\nuniform float uCell;    // @param label="Spacing" min=3 max=30 step=0.5 default=7\nuniform float uWeight;  // @param label="Line weight" min=0.05 max=0.6 step=0.01 default=0.22\nuniform bool uPaper;    // @param label="Ink on paper" default=true\n\nfloat hatch(vec2 px, float angle, float spacing) {\n  vec2 r = rot(px, -angle);\n  return cover(abs(fract(r.y / spacing) - 0.5), uWeight * 0.5);\n}\n\nvec4 effect(vec2 uv) {\n  vec2 px = uv * uSize;\n  vec3 c = imgCell(uv, uCell * 0.5).rgb;\n  float t = inkAmount(luma(c));\n  float a = hatch(px, 45.0, uCell) * smoothstep(0.08, 0.16, t);\n  a = max(a, hatch(px, -45.0, uCell) * smoothstep(0.30, 0.38, t));\n  a = max(a, hatch(px, 0.0, uCell) * smoothstep(0.52, 0.60, t));\n  a = max(a, hatch(px, 90.0, uCell * 0.5) * smoothstep(0.74, 0.82, t));\n  return vec4(ink(t, c), a);\n}\n', "/app/effects/distort.glsl": '// @name Distort\n// @category Distort\n// @description Swirl, ripple, bulge, pinch or wave the picture \u2013 it moves while Speed is above 0.\n// @palette original\n// @animated param=uSpeed\n// @preset name="Ripple" uMode=1 uAmount=1.2 uFreq=14 uSpeed=0.8\n// @preset name="Fisheye" uMode=2 uAmount=1.3 uRadius=0.9\n\nuniform int uMode;       // @param label="Mode" options="Swirl,Ripple,Bulge,Pinch,Waves" default=0\nuniform float uAmount;   // @param label="Amount" min=-2 max=2 step=0.01 default=0.8\nuniform float uRadius;   // @param label="Radius" min=0.05 max=1.5 step=0.01 default=0.6\nuniform float uFreq;     // @param label="Frequency" min=1 max=60 step=0.5 default=12 show="uMode==1"\nuniform float uCenterX;  // @param label="Center X" min=0 max=1 step=0.01 default=0.5\nuniform float uCenterY;  // @param label="Center Y" min=0 max=1 step=0.01 default=0.5\nuniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0\n\nvec4 effect(vec2 uv) {\n  float aspect = uSize.x / uSize.y;\n  vec2 center = vec2(uCenterX, uCenterY);\n  vec2 d = (uv - center) * vec2(aspect, 1.0);\n  float r = length(d);\n  float t = uTime * uSpeed;\n  float k = clamp(1.0 - r / uRadius, 0.0, 1.0);\n  vec2 q = d;\n  if (uMode == 0) q = rot(d, degrees(uAmount * 3.0 * k * k + t * k));\n  else if (uMode == 1) q = d + normalize(d + 1e-6) * sin(r * uFreq * TAU - t * 4.0) * 0.02 * uAmount * k;\n  else if (uMode == 2) q = d * (1.0 - uAmount * 0.5 * k * k);\n  else if (uMode == 3) q = d * (1.0 + uAmount * 0.5 * k * k);\n  else q = d + vec2(sin(d.y * 36.0 + t * 3.0), sin(d.x * 36.0 + t * 2.0)) * 0.015 * uAmount;\n  vec2 s = center + q / vec2(aspect, 1.0);\n  s = 1.0 - abs(1.0 - mod(s, 2.0));\n  vec3 col = img(s).rgb;\n  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);\n}\n', "/app/effects/dither.glsl": '// @name Ordered Dither\n// @category Dither\n// @description Threshold-matrix dithering \u2013 crisp 1-bit, pattern and retro looks that stay stable on video.\n// @palette mono\n// @animated param=uShimmer\n// @preset name="Mac Classic" uCell=2 uPattern=2 palette=newsprint\n// @preset name="Handheld Dither" uCell=3 uPattern=1 palette=gameboy\n// @preset name="Clustered Print" uCell=2 uPattern=4 palette=sepia\n// @preset name="Thermal Dither" uCell=2 uPattern=3 palette=thermal glow=0.35\n// @preset name="Blue Noise" uCell=1 uPattern=8 palette=mono\n// @preset name="Ring Pattern" uCell=2 uPattern=10 palette=synth glow=0.3\n// @preset name="Hard Threshold" uCell=1 uSpread=0 palette=mono\n\nuniform float uCell;     // @param label="Pixel size" min=1 max=16 step=1 default=2\nuniform int uPattern;    // @param label="Pattern" options="Bayer 2\xD72,Bayer 4\xD74,Bayer 8\xD78,Bayer 16\xD716,Clustered dots,Lines,Diagonal lines,Noise,Blue noise,Crosses,Rings,Waves,Checker,Diamonds" default=2\nuniform float uSpread;   // @param label="Spread" min=0 max=1.5 step=0.01 default=1\nuniform float uShimmer;  // @param label="Shimmer (animate)" min=0 max=4 step=0.01 default=0\nuniform float uLevels;   // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"\n\nfloat threshold(vec2 cell) {\n  if (uPattern <= 3) return bayer(cell, uPattern == 0 ? 2 : (uPattern == 1 ? 4 : (uPattern == 2 ? 8 : 16)));\n  if (uPattern == 4) return 0.5 + 0.25 * (cos(TAU * cell.x / 6.0) + cos(TAU * cell.y / 6.0));\n  if (uPattern == 5) return fract((cell.y + 0.5) / 4.0);\n  if (uPattern == 6) return fract((cell.x + cell.y + 0.5) / 6.0);\n  if (uPattern == 7) return ign(cell);\n  if (uPattern == 8) return blueNoise(cell);\n  if (uPattern == 9) {\n    vec2 f = abs(fract(cell / 6.0) - 0.5);\n    return min(f.x, f.y) * 2.0;\n  }\n  if (uPattern == 10) return fract(length(cell - uSize / uCell * 0.5) / 5.0);\n  if (uPattern == 11) return fract((cell.y + 2.0 * sin(cell.x * 0.35)) / 5.0);\n  if (uPattern == 12) return mod(cell.x + cell.y, 2.0) * 0.5 + 0.25;\n  vec2 f = abs(fract(cell / 6.0) - 0.5);\n  return f.x + f.y;\n}\n\nvec4 effect(vec2 uv) {\n  vec2 cell = floor(uv * uSize / uCell);\n  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;\n  vec2 shift = floor(uTime * uShimmer * 12.0) * vec2(3.0, 7.0);\n  float th = (threshold(cell + shift) - 0.5) * uSpread;\n  if (uPalOriginal) {\n    float l = uLevels - 1.0;\n    return vec4(clamp(floor(c * l + 0.5 + th), 0.0, l) / l, 1.0);\n  }\n  float top = float(uPalN - 1);\n  int i = int(clamp(floor(luma(c) * top + 0.5 + th), 0.0, top));\n  return paletteOut(i);\n}\n', "/app/effects/error-diffusion.glsl": '// @name Error Diffusion\n// @category Dither\n// @description Classic error-diffusion dithering \u2013 Floyd\u2013Steinberg, Atkinson and friends \u2013 at any pixel size.\n// @cpu diffusion\n// @palette mono\n// @animated param=uSpeed\n// @preset name="Atkinson Paper" uKernel=atkinson uCell=2 palette=newsprint\n// @preset name="Modulated Lines" uModulate=1 uModAmount=0.9 uModScale=7 uModAngle=0 palette=ice glow=0.3\n// @preset name="Flow Lines" uModulate=5 uModAmount=1 uModScale=6 uWarp=2 uCell=2 palette=violet glow=0.5\n// @preset name="Acid Waves" uModulate=2 uModAmount=0.85 uModScale=8 uCell=2 palette=acid glow=0.25\n// @preset name="Ring Ripples" uModulate=3 uModAmount=0.8 uModScale=10 uCell=2 palette=synth glow=0.35\n// @preset name="Retro Color" uNearest=true uCell=3 palette=pico8\n// @preset name="Streaks" uKernel=row uCell=2 uStrength=0.9 palette=blood glow=0.3\n// @preset name="Riemersma Organic" uKernel=riemersma uCell=2 palette=sepia\n// @preset name="Glow Dither" uKernel=stevensonarce uCell=2 palette=ice glow=0.85 glowSize=8 glowThreshold=0.45\n\nuniform float uCell;       // @param label="Pixel size" min=1 max=24 step=1 default=2\nuniform int uKernel;       // @param label="Algorithm" type=kernel default=floyd\nuniform float uStrength;   // @param label="Diffusion" min=0 max=1 step=0.01 default=1\nuniform float uThreshold;  // @param label="Threshold" min=-0.5 max=0.5 step=0.01 default=0\nuniform bool uSerpentine;  // @param label="Serpentine scan" default=true\nuniform int uModulate;     // @param label="Modulation" options="None,Lines,Waves,Rings,Dots,Flow,Noise" default=0\nuniform float uModAmount;  // @param label="Modulation amount" min=0 max=1 step=0.01 default=0.8 show="uModulate>0"\nuniform float uModScale;   // @param label="Modulation scale" min=2 max=80 step=0.5 default=8 show="uModulate>0"\nuniform float uModAngle;   // @param label="Modulation angle" min=0 max=180 step=1 default=0 show="uModulate>0"\nuniform float uWarp;       // @param label="Flow warp" min=0 max=6 step=0.01 default=1.5 show="uModulate==5"\nuniform float uSpeed;      // @param label="Speed" min=0 max=4 step=0.01 default=0 show="uModulate>0"\nuniform bool uNearest;     // @param label="Closest palette color" default=false show="!original"\nuniform float uLevels;     // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"\n\n// The dithering itself runs on the CPU (see @cpu); here it is only drawn as crisp big pixels.\nvec4 effect(vec2 uv) {\n  return dithered(uv);\n}\n', "/app/effects/glitch.glsl": '// @name Glitch\n// @category Glitch\n// @description Torn slices, RGB split and digital noise \u2013 it moves while Speed is above 0.\n// @palette original\n// @animated param=uSpeed\n\nuniform float uShift;   // @param label="RGB split" min=0 max=40 step=0.5 default=6\nuniform float uSlices;  // @param label="Slices" min=0 max=60 step=1 default=16\nuniform float uOffset;  // @param label="Slice offset" min=0 max=200 step=1 default=40\nuniform float uNoise;   // @param label="Noise" min=0 max=1 step=0.01 default=0.15\nuniform float uSpeed;   // @param label="Speed" min=0 max=4 step=0.01 default=1\nuniform float uSeed;    // @param label="Seed" min=1 max=99 step=1 default=7\n\nvec4 effect(vec2 uv) {\n  float tm = floor(uTime * uSpeed * 10.0);\n  vec2 px = uv * uSize;\n  float band = floor((1.0 - uv.y) * max(uSlices, 1.0) * 3.0);\n  float shift = 0.0;\n  if (uSlices > 0.0 && hash(vec2(band, uSeed + tm)) > 1.0 - uSlices / 90.0) {\n    shift = (hash(vec2(band + 17.0, uSeed - tm)) - 0.5) * 2.0 * uOffset;\n  }\n  vec2 p = px + vec2(shift, 0.0);\n  vec2 s = vec2(uShift, 0.0);\n  vec3 c = vec3(img((p + s) / uSize).r, img(p / uSize).g, img((p - s) / uSize).b);\n  c += (hash(floor(px) + tm * 13.1) - 0.5) * uNoise;\n  float line = step(0.996, hash(vec2(floor(px.y), tm + uSeed)));\n  c = mix(c, vec3(1.0), line * uNoise);\n  vec3 col = uPalOriginal ? c : palSmooth(clamp(luma(c), 0.0, 1.0));\n  return vec4(clamp(col, 0.0, 1.0), 1.0);\n}\n', "/app/effects/gradient-map.glsl": '// @name Gradient Map\n// @category Color\n// @description Maps the brightness onto a palette \u2013 duotones, thermal camera, neon.\n// @palette thermal\n// @preset name="Duotone" palette=synth\n// @preset name="Posterize" uSteps=5 palette=ice\n\nuniform float uSteps;  // @param label="Steps (0 = smooth)" min=0 max=16 step=1 default=0\nuniform float uMix;    // @param label="Amount" min=0 max=1 step=0.01 default=1\n\nvec4 effect(vec2 uv) {\n  vec3 src = img(uv).rgb;\n  float t = luma(src);\n  if (uSteps >= 2.0) t = floor(t * uSteps) / (uSteps - 1.0);\n  vec3 col = uPalOriginal ? src : palSmooth(clamp(t, 0.0, 1.0));\n  return vec4(mix(src, col, uMix), 1.0);\n}\n', "/app/effects/grain-dither.glsl": '// @name Grain Dither\n// @category Dither\n// @description Noise-based dithering with a film-grain feel \u2013 switch on the animation for video.\n// @palette mono\n// @animated param=uAnimate\n// @preset name="Night Vision" uCell=2 uAnimate=true palette=phosphor glow=0.45 scanlines=0.35 vignette=0.6\n\nuniform float uCell;     // @param label="Pixel size" min=1 max=12 step=1 default=1\nuniform float uSpread;   // @param label="Spread" min=0 max=1.5 step=0.01 default=1\nuniform bool uAnimate;   // @param label="Animate grain" default=false\nuniform float uLevels;   // @param label="Color levels" min=2 max=8 step=1 default=3 show="original"\n\nvec4 effect(vec2 uv) {\n  vec2 cell = floor(uv * uSize / uCell);\n  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;\n  float frame = uAnimate ? floor(uTime * 24.0) : 0.0;\n  float th = (ign(cell + frame * vec2(5.588238, 3.17)) - 0.5) * uSpread;\n  if (uPalOriginal) {\n    float l = uLevels - 1.0;\n    return vec4(clamp(floor(c * l + 0.5 + th), 0.0, l) / l, 1.0);\n  }\n  float top = float(uPalN - 1);\n  int i = int(clamp(floor(luma(c) * top + 0.5 + th), 0.0, top));\n  return paletteOut(i);\n}\n', "/app/effects/halftone.glsl": '// @name Halftone\n// @category Print\n// @description A rotated dot screen like a printed magazine \u2013 dots grow with the ink (or the light).\n// @palette newsprint\n// @preset name="Pop Dots" uCell=12 uPaper=false palette=synth glow=0.3\n// @preset name="Comic Lines" uCell=8 uShape=3 uAngle=30 palette=blood\n\nuniform float uCell;    // @param label="Dot spacing" min=3 max=60 step=0.5 default=9\nuniform float uAngle;   // @param label="Angle" min=0 max=90 step=1 default=45\nuniform int uShape;     // @param label="Shape" options="Circle,Square,Diamond,Line" default=0\nuniform bool uPaper;    // @param label="Ink on paper" default=true\n\nvec4 effect(vec2 uv) {\n  vec2 r = rot(uv * uSize, -uAngle);\n  vec2 cell = floor(r / uCell);\n  vec2 center = (cell + 0.5) * uCell;\n  vec3 c = imgCell(rot(center, uAngle) / uSize, uCell).rgb;\n  float t = inkAmount(luma(c));\n  vec2 d = (r - center) / uCell;\n  float dist;\n  float size;\n  if (uShape == 0) { dist = length(d); size = sqrt(t / PI); }\n  else if (uShape == 1) { dist = max(abs(d.x), abs(d.y)); size = 0.5 * sqrt(t); }\n  else if (uShape == 2) { dist = abs(d.x) + abs(d.y); size = sqrt(t * 0.5); }\n  else { dist = abs(d.y); size = 0.5 * t; }\n  return vec4(ink(t, c), cover(dist, size));\n}\n', "/app/effects/jpeg-glitch.glsl": '// @name JPEG Glitch\n// @category Glitch\n// @description Broken compression \u2013 blocky artefacts, shifted blocks, swapped colors and ringing.\n// @palette original\n// @animated param=uSpeed\n// @preset name="Datamosh" uBlock=16 uQuality=0.1 uCorrupt=0.75 uChroma=0.9 uSpeed=0.6\n\nuniform float uBlock;    // @param label="Block size" min=4 max=64 step=1 default=12\nuniform float uQuality;  // @param label="Quality" min=0 max=1 step=0.01 default=0.25\nuniform float uCorrupt;  // @param label="Corruption" min=0 max=1 step=0.01 default=0.35\nuniform float uChroma;   // @param label="Color bleed" min=0 max=1 step=0.01 default=0.6\nuniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=0\nuniform float uSeed;     // @param label="Seed" min=1 max=99 step=1 default=11\n\nvec3 toYcc(vec3 c) {\n  return vec3(dot(c, vec3(0.299, 0.587, 0.114)), dot(c, vec3(-0.1687, -0.3313, 0.5)) + 0.5, dot(c, vec3(0.5, -0.4187, -0.0813)) + 0.5);\n}\n\nvec3 toRgb(vec3 y) {\n  float cb = y.y - 0.5;\n  float cr = y.z - 0.5;\n  return vec3(y.x + 1.402 * cr, y.x - 0.344136 * cb - 0.714136 * cr, y.x + 1.772 * cb);\n}\n\nvec4 effect(vec2 uv) {\n  float tm = floor(uTime * uSpeed * 6.0);\n  vec2 px = uv * uSize;\n  vec2 block = floor(px / uBlock);\n  float h = hash(block + vec2(uSeed, tm));\n  // corrupted blocks show data from elsewhere in the row (or a row nearby)\n  vec2 src = block;\n  if (h < uCorrupt * 0.5) src.x += floor((hash(block.yx + uSeed + tm) - 0.5) * 12.0);\n  if (h > 1.0 - uCorrupt * 0.15) src.y += floor((hash(block + 3.1 + tm) - 0.5) * 4.0);\n  vec2 local = px - block * uBlock;\n  vec3 ycc = toYcc(img((src * uBlock + local) / uSize).rgb);\n  vec3 avg = toYcc(imgCell((src + 0.5) * uBlock / uSize, uBlock).rgb);\n  // low quality = flat blocks with few brightness steps\n  ycc.x = mix(avg.x, ycc.x, mix(0.15, 1.0, uQuality));\n  float steps = mix(4.0, 32.0, uQuality);\n  ycc.x = floor(ycc.x * steps + 0.5) / steps;\n  // colour is stored at half resolution and coarsely \u2013 it bleeds over the blocks\n  vec3 chroma = toYcc(imgCell((floor(src / 2.0) * 2.0 + 1.0) * uBlock / uSize, uBlock * 2.0).rgb);\n  ycc.yz = mix(ycc.yz, floor(chroma.yz * 6.0 + 0.5) / 6.0, uChroma);\n  if (h > 1.0 - uCorrupt * 0.25) ycc.yz = ycc.zy;\n  // ringing inside the damaged blocks\n  float ring = cos(PI * local.x / uBlock * (1.0 + floor(h * 4.0))) * cos(PI * local.y / uBlock * (1.0 + floor(h * 3.0)));\n  ycc.x += ring * 0.08 * uCorrupt * step(h, uCorrupt);\n  vec3 col = clamp(toRgb(ycc), 0.0, 1.0);\n  return vec4(uPalOriginal ? col : palSmooth(luma(col)), 1.0);\n}\n', "/app/effects/kaleidoscope.glsl": '// @name Kaleidoscope\n// @category Distort\n// @description Mirrored slices around the center \u2013 set a spin speed to make it turn.\n// @palette original\n// @animated param=uSpin\n\nuniform float uSegments;  // @param label="Segments" min=2 max=24 step=1 default=8\nuniform float uRotate;    // @param label="Rotation" min=0 max=360 step=1 default=0\nuniform float uZoom;      // @param label="Zoom" min=0.3 max=3 step=0.01 default=1\nuniform float uSpin;      // @param label="Spin speed" min=-2 max=2 step=0.01 default=0\n\nvec4 effect(vec2 uv) {\n  float m = min(uSize.x, uSize.y);\n  vec2 p = (uv - 0.5) * uSize / m;\n  float a = atan(p.y, p.x) + radians(uRotate) + uTime * uSpin;\n  float r = length(p) / uZoom;\n  float seg = TAU / uSegments;\n  a = mod(a, seg);\n  a = abs(a - seg * 0.5);\n  vec2 s = 0.5 + vec2(cos(a), sin(a)) * r * m / uSize;\n  s = 1.0 - abs(1.0 - mod(s, 2.0));\n  vec3 c = img(s).rgb;\n  return vec4(uPalOriginal ? c : palSmooth(luma(c)), 1.0);\n}\n', "/app/effects/led-wall.glsl": '// @name LED Wall\n// @category Pixel\n// @description A giant LED screen \u2013 round lights in the real colors of the image.\n// @palette original\n// @finish glow=0.45 glowSize=10\n// @preset name="Scoreboard" uCell=8 uRound=false uGap=0.25 palette=amber glow=0.6\n\nuniform float uCell;   // @param label="LED size" min=3 max=48 step=1 default=10\nuniform float uGap;    // @param label="Gap" min=0 max=0.7 step=0.01 default=0.2\nuniform bool uRound;   // @param label="Round LEDs" default=true\nuniform float uBoost;  // @param label="Brightness" min=0.5 max=2.5 step=0.01 default=1.25\n\nvec4 effect(vec2 uv) {\n  vec2 px = uv * uSize;\n  vec2 cell = floor(px / uCell);\n  vec2 d = (px - (cell + 0.5) * uCell) / uCell;\n  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;\n  float dist = uRound ? length(d) : max(abs(d.x), abs(d.y));\n  float a = cover(dist, 0.5 - uGap * 0.5);\n  vec3 col = uPalOriginal ? min(c * uBoost, 1.0) : pal(min(luma(c) * uBoost, 1.0));\n  return vec4(col, a);\n}\n', "/app/effects/line-screen.glsl": '// @name Line Screen\n// @category Lines\n// @description Parallel lines whose thickness follows the light \u2013 scan-line and engraving looks.\n// @palette acid\n// @finish glow=0.25\n// @preset name="Engraving" uCell=4 uAngle=30 uPaper=true palette=sepia glow=0\n\nuniform float uCell;   // @param label="Line spacing" min=2 max=40 step=0.5 default=6\nuniform float uAngle;  // @param label="Angle" min=0 max=180 step=1 default=0\nuniform bool uPaper;   // @param label="Ink on paper" default=false\n\nvec4 effect(vec2 uv) {\n  vec2 r = rot(uv * uSize, -uAngle);\n  float row = floor(r.y / uCell);\n  vec2 center = rot(vec2(r.x, (row + 0.5) * uCell), uAngle);\n  vec3 c = imgCell(center / uSize, uCell * 0.75).rgb;\n  float t = inkAmount(luma(c));\n  float d = abs(fract(r.y / uCell) - 0.5);\n  return vec4(ink(t, c), cover(d, 0.5 * t));\n}\n', "/app/effects/neon-edges.glsl": '// @name Neon Edges\n// @category Edges\n// @description Outlines traced in glowing neon \u2013 the colors follow the brightness of the image.\n// @palette synth\n// @finish glow=0.75 glowSize=18\n// @preset name="Chalk" uStrength=2.5 uWidth=1.2 uBase=0 palette=mono glow=0.15\n\nuniform float uStrength;  // @param label="Edge strength" min=0.5 max=10 step=0.1 default=3.5\nuniform float uWidth;     // @param label="Line width" min=0.5 max=8 step=0.1 default=1.5\nuniform float uBase;      // @param label="Original image" min=0 max=1 step=0.01 default=0.1\n\nfloat lumAt(vec2 uv, float lod) {\n  return luma(textureLod(uImage, uv, lod).rgb);\n}\n\nvec4 effect(vec2 uv) {\n  vec2 o = uWidth / uSize;\n  float lod = log2(max(uWidth * outScale(), 1.0));\n  float tl = lumAt(uv + vec2(-o.x, o.y), lod);\n  float tc = lumAt(uv + vec2(0.0, o.y), lod);\n  float tr = lumAt(uv + vec2(o.x, o.y), lod);\n  float ml = lumAt(uv + vec2(-o.x, 0.0), lod);\n  float mr = lumAt(uv + vec2(o.x, 0.0), lod);\n  float bl = lumAt(uv + vec2(-o.x, -o.y), lod);\n  float bc = lumAt(uv + vec2(0.0, -o.y), lod);\n  float br = lumAt(uv + vec2(o.x, -o.y), lod);\n  float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);\n  float gy = (tl + 2.0 * tc + tr) - (bl + 2.0 * bc + br);\n  float e = clamp(length(vec2(gx, gy)) * uStrength * 0.5, 0.0, 1.0);\n  vec3 src = img(uv).rgb;\n  vec3 col = uPalOriginal ? src / max(max(src.r, max(src.g, src.b)), 0.05) : ink(luma(src), src);\n  float a = clamp(e + uBase, 0.0, 1.0);\n  return vec4(mix(src, col, e / max(a, 0.001)), a);\n}\n', "/app/effects/pixel-art.glsl": '// @name Pixel Art\n// @category Pixel\n// @description Chunky pixels snapped to a palette \u2013 sprite and retro-console looks.\n// @palette pico8\n// @preset name="Game Boy" uCell=6 uNearest=false palette=gameboy\n// @preset name="CGA Pop" uCell=5 palette=cga\n\nuniform float uCell;    // @param label="Pixel size" min=1 max=64 step=1 default=8\nuniform bool uNearest;  // @param label="Closest palette color" default=true\nuniform float uLevels;  // @param label="Color levels" min=2 max=16 step=1 default=6 show="original"\n\nvec4 effect(vec2 uv) {\n  vec2 cell = floor(uv * uSize / uCell);\n  vec3 c = imgCell((cell + 0.5) * uCell / uSize, uCell).rgb;\n  if (uPalOriginal) {\n    float l = uLevels - 1.0;\n    return vec4(floor(c * l + 0.5) / l, 1.0);\n  }\n  int i = uNearest ? nearestIndex(c) : palIndex(luma(c));\n  return paletteOut(i);\n}\n', "/app/effects/pixel-smear.glsl": '// @name Pixel Smear\n// @category Glitch\n// @description A pixel-sorting look \u2013 bright areas drip and streak in one direction.\n// @palette original\n// @preset name="Neon Drip" uLength=180 uThreshold=0.45 palette=synth glow=0.4\n\nuniform float uLength;     // @param label="Length" min=0 max=400 step=1 default=120\nuniform float uThreshold;  // @param label="Threshold" min=0 max=1 step=0.01 default=0.5\nuniform float uAngle;      // @param label="Direction" min=0 max=360 step=1 default=270\nuniform float uFade;       // @param label="Fade" min=0 max=1 step=0.01 default=0.35\n\nvec4 effect(vec2 uv) {\n  vec2 dir = rot(vec2(1.0, 0.0), uAngle) / uSize;\n  vec3 best = img(uv).rgb;\n  float bestL = luma(best);\n  for (int i = 1; i <= 48; i++) {\n    float k = float(i) / 48.0;\n    vec3 s = img(uv - dir * k * uLength).rgb;\n    float l = luma(s) * (1.0 - k * uFade);\n    if (l > uThreshold && l > bestL) {\n      best = s * (1.0 - k * uFade);\n      bestL = l;\n    }\n  }\n  vec3 col = uPalOriginal ? best : palSmooth(clamp(luma(best), 0.0, 1.0));\n  return vec4(col, 1.0);\n}\n', "/app/effects/relief.glsl": '// @name Relief\n// @category Edges\n// @description Embossed metal or paper \u2013 the image pressed into a surface lit from one side.\n// @palette original\n// @preset name="Gold Foil" uDepth=3 palette=gold glow=0.25\n\nuniform float uDepth;   // @param label="Depth" min=0 max=8 step=0.05 default=2.5\nuniform float uLight;   // @param label="Light angle" min=0 max=360 step=1 default=135\nuniform float uSoft;    // @param label="Softness" min=0.5 max=8 step=0.1 default=1.5\nuniform float uColor;   // @param label="Keep color" min=0 max=1 step=0.01 default=0 show="original"\n\nfloat lumAt(vec2 uv, float lod) {\n  return luma(textureLod(uImage, uv, lod).rgb);\n}\n\nvec4 effect(vec2 uv) {\n  vec2 o = uSoft / uSize;\n  float lod = log2(max(uSoft * outScale(), 1.0));\n  float dx = lumAt(uv - vec2(o.x, 0.0), lod) - lumAt(uv + vec2(o.x, 0.0), lod);\n  float dy = lumAt(uv - vec2(0.0, o.y), lod) - lumAt(uv + vec2(0.0, o.y), lod);\n  vec3 n = normalize(vec3(dx * uDepth, dy * uDepth, 1.0));\n  vec3 l = normalize(vec3(rot(vec2(1.0, 0.0), uLight), 0.8));\n  float shade = clamp(dot(n, l), 0.0, 1.0);\n  if (!uPalOriginal) return vec4(palSmooth(shade), 1.0);\n  vec3 base = mix(vec3(0.62), img(uv).rgb, uColor);\n  return vec4(clamp(base * (0.35 + shade), 0.0, 1.0), 1.0);\n}\n', "/app/effects/signal-jitter.glsl": '// @name Signal Jitter\n// @category Glitch\n// @description Lines of the picture slip sideways like a bad video signal, with a rolling sync bar.\n// @palette original\n// @animated param=uSpeed\n\nuniform float uShift;    // @param label="Shift" min=0 max=200 step=1 default=40\nuniform float uLines;    // @param label="Line height" min=1 max=40 step=1 default=3\nuniform float uChance;   // @param label="Amount" min=0 max=1 step=0.01 default=0.3\nuniform float uWave;     // @param label="Wave" min=0 max=60 step=0.5 default=6\nuniform float uBar;      // @param label="Sync bar" min=0 max=1 step=0.01 default=0.4\nuniform float uSpeed;    // @param label="Speed" min=0 max=4 step=0.01 default=1\n\nvec4 effect(vec2 uv) {\n  vec2 px = uv * uSize;\n  float t = uTime * uSpeed;\n  float line = floor(px.y / uLines);\n  float frame = floor(t * 12.0);\n  float shift = hash(vec2(line, frame)) < uChance ? (hash(vec2(line + 5.0, frame)) - 0.5) * 2.0 * uShift : 0.0;\n  shift += sin(px.y * 0.05 + t * 4.0) * uWave;\n  vec3 c = img((px + vec2(shift, 0.0)) / uSize).rgb;\n  float bar = fract(uv.y * 0.7 + t * 0.25);\n  c *= 1.0 - uBar * 0.6 * smoothstep(0.0, 0.06, bar) * smoothstep(0.14, 0.06, bar);\n  return vec4(uPalOriginal ? c : palSmooth(luma(c)), 1.0);\n}\n', "/app/effects/stained-glass.glsl": '// @name Stained Glass\n// @category Pixel\n// @description Irregular glass cells in the colors of the image, joined by dark lead lines.\n// @palette original\n// @preset name="Crystal" uCell=18 uLead=0.05 palette=ice glow=0.3\n\nuniform float uCell;      // @param label="Cell size" min=6 max=120 step=1 default=28\nuniform float uJitter;    // @param label="Irregularity" min=0 max=1 step=0.01 default=0.85\nuniform float uLead;      // @param label="Lead width" min=0 max=0.3 step=0.005 default=0.08\nuniform vec3 uLeadColor;  // @param label="Lead color" type=color default=#121212\nuniform float uShade;     // @param label="Shading" min=0 max=1 step=0.01 default=0.35\n\nvec2 site(vec2 cell) {\n  return cell + 0.5 + (vec2(hash(cell), hash(cell + 17.3)) - 0.5) * uJitter;\n}\n\nvec4 effect(vec2 uv) {\n  vec2 p = uv * uSize / uCell;\n  vec2 base = floor(p);\n  float d1 = 1e9;\n  float d2 = 1e9;\n  vec2 best = vec2(0.0);\n  for (int j = -1; j <= 1; j++) {\n    for (int i = -1; i <= 1; i++) {\n      vec2 s = site(base + vec2(float(i), float(j)));\n      float d = length(p - s);\n      if (d < d1) { d2 = d1; d1 = d; best = s; }\n      else if (d < d2) { d2 = d; }\n    }\n  }\n  vec3 c = imgCell(best * uCell / uSize, uCell * 0.8).rgb;\n  vec3 col = uPalOriginal ? c : nearestColor(c);\n  col *= 1.0 - uShade * smoothstep(0.0, 0.7, d1);\n  col = mix(col, uLeadColor, cover(d2 - d1, uLead));\n  return vec4(col, 1.0);\n}\n', "/app/effects/vhs.glsl": '// @name VHS Tape\n// @category Glitch\n// @description A worn videotape \u2013 tracking wobble, color bleed, noise and a curved CRT screen.\n// @palette original\n// @finish scanlines=0.35 vignette=0.5\n// @animated\n\nuniform float uWobble;  // @param label="Tracking wobble" min=0 max=8 step=0.1 default=2\nuniform float uBleed;   // @param label="Color bleed" min=0 max=12 step=0.1 default=4\nuniform float uNoise;   // @param label="Tape noise" min=0 max=1 step=0.01 default=0.25\nuniform float uCurve;   // @param label="Screen curve" min=0 max=0.3 step=0.005 default=0.08\n\nvec4 effect(vec2 uv) {\n  vec2 c = uv - 0.5;\n  vec2 cuv = 0.5 + c * (1.0 + uCurve * dot(c, c) * 4.0);\n  if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) return vec4(0.0, 0.0, 0.0, 1.0);\n  float line = floor(cuv.y * uSize.y);\n  float frame = floor(uTime * 30.0);\n  float wob = (hash(vec2(line, frame)) - 0.5) * uWobble + sin(cuv.y * 40.0 + uTime * 3.0) * uWobble * 0.3;\n  vec2 p = cuv + vec2(wob / uSize.x, 0.0);\n  vec2 b = vec2(uBleed / uSize.x, 0.0);\n  vec3 col = vec3(img(p + b).r, img(p).g, img(p - b).b);\n  col += (hash(vec2(floor(p.x * uSize.x * 0.5), line + frame * 17.0)) - 0.5) * uNoise * 0.5;\n  float roll = fract(uTime * 0.12);\n  col += smoothstep(0.03, 0.0, abs(cuv.y - roll)) * uNoise * hash(vec2(p.x * 300.0, line));\n  vec3 outc = uPalOriginal ? col : palSmooth(clamp(luma(col), 0.0, 1.0));\n  return vec4(clamp(outc, 0.0, 1.0), 1.0);\n}\n', "/app/effects/waveform.glsl": '// @name Waveform\n// @category Lines\n// @description Flowing lines that bend and swell with the light \u2013 glows beautifully.\n// @palette violet\n// @finish glow=0.6 glowSize=16\n// @animated param=uSpeed\n// @preset name="Acid Waves" uCell=6 uFreq=6 uAmp=0.35 uWarp=2.2 palette=acid glow=0.35\n// @preset name="Signal" uCell=5 uFreq=20 uAmp=0.25 uWarp=0.6 uSpeed=0.6 palette=phosphor glow=0.5\n\nuniform float uCell;    // @param label="Line spacing" min=2 max=40 step=0.5 default=7\nuniform float uFreq;    // @param label="Wave density" min=0 max=40 step=0.5 default=12\nuniform float uAmp;     // @param label="Wave height" min=0 max=3 step=0.01 default=0.6\nuniform float uWarp;    // @param label="Image warp" min=0 max=4 step=0.01 default=1.2\nuniform float uAngle;   // @param label="Angle" min=0 max=180 step=1 default=0\nuniform float uSpeed;   // @param label="Speed" min=0 max=4 step=0.01 default=0\nuniform bool uPaper;    // @param label="Ink on paper" default=false\n\nvec4 effect(vec2 uv) {\n  vec2 r = rot(uv * uSize, -uAngle);\n  vec3 c = imgCell(uv, uCell).rgb;\n  float lum = luma(c);\n  float t = inkAmount(lum);\n  float wave = sin(r.x / uSize.x * uFreq * TAU + uTime * uSpeed * 3.0) * uAmp * uCell;\n  float y = r.y + wave + lum * uWarp * uCell;\n  float d = abs(fract(y / uCell) - 0.5);\n  return vec4(ink(t, c), cover(d, 0.5 * t));\n}\n' };
    }
  });

  // web/shims/vfs.js
  async function vfsInit(preload = []) {
    db = await new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("meta");
        r.result.createObjectStore("data");
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const store = db.transaction("meta").objectStore("meta");
    const [keys, values] = await Promise.all([result(store.getAllKeys()), result(store.getAll())]);
    keys.forEach((k, i) => meta.set(k, values[i]));
    for (const p of preload.map(norm)) if (meta.has(p) && !data.has(p)) data.set(p, await load(p));
  }
  async function load(p) {
    const v = await result(db.transaction("data").objectStore("data").get(p));
    return v ? new Uint8Array(v) : null;
  }
  function readSync(p) {
    p = norm(p);
    if (data.has(p)) return data.get(p);
    throw fsError("ENOENT", "open", p);
  }
  async function read(p) {
    p = norm(p);
    if (data.has(p)) return data.get(p);
    if (!meta.has(p)) throw fsError("ENOENT", "open", p);
    const bytes = await load(p);
    if (!bytes) throw fsError("ENOENT", "open", p);
    if (bytes.length <= MEMORY_LIMIT) data.set(p, bytes);
    return bytes;
  }
  async function write(p, bytes) {
    p = norm(p);
    if (meta.get(p)?.builtin) throw fsError("EPERM", "open", p);
    const m = { size: bytes.length, mtime: Date.now() };
    const tx = db.transaction(["meta", "data"], "readwrite");
    tx.objectStore("meta").put(m, p);
    tx.objectStore("data").put(bytes, p);
    await done(tx);
    meta.set(p, m);
    if (bytes.length <= MEMORY_LIMIT) data.set(p, bytes);
    else data.delete(p);
  }
  async function remove(p) {
    p = norm(p);
    if (!meta.has(p)) throw fsError("ENOENT", "unlink", p);
    const tx = db.transaction(["meta", "data"], "readwrite");
    tx.objectStore("meta").delete(p);
    tx.objectStore("data").delete(p);
    await done(tx);
    meta.delete(p);
    data.delete(p);
  }
  async function rename(a, b) {
    a = norm(a);
    b = norm(b);
    if (!meta.has(a)) throw fsError("ENOENT", "rename", a);
    const bytes = await read(a);
    await write(b, bytes);
    await remove(a);
  }
  function mkdir(p) {
    let cur = norm(p);
    while (cur !== "/") {
      dirs.add(cur);
      cur = norm(`${cur}/..`);
    }
  }
  function list(dir) {
    dir = norm(dir);
    if (!isDir(dir)) throw fsError("ENOENT", "scandir", dir);
    const prefix = dir === "/" ? "/" : `${dir}/`;
    const out = /* @__PURE__ */ new Map();
    for (const k of [...meta.keys(), ...dirs]) {
      if (!k.startsWith(prefix)) continue;
      const rest = k.slice(prefix.length);
      if (!rest) continue;
      const slash = rest.indexOf("/");
      const name = slash < 0 ? rest : rest.slice(0, slash);
      out.set(name, slash < 0 && meta.has(k) ? "file" : "dir");
    }
    return [...out].map(([name, kind]) => ({ name, kind }));
  }
  function stat(p) {
    p = norm(p);
    const m = meta.get(p);
    if (m) return { size: m.size, mtimeMs: m.mtime, mtime: new Date(m.mtime), isFile: () => true, isDirectory: () => false };
    if (isDir(p)) return { size: 0, mtimeMs: 0, mtime: /* @__PURE__ */ new Date(0), isFile: () => false, isDirectory: () => true };
    throw fsError("ENOENT", "stat", p);
  }
  var DB_NAME, MEMORY_LIMIT, meta, data, dirs, db, enc, norm, fsError, done, result, isDir, exists;
  var init_vfs = __esm({
    "web/shims/vfs.js"() {
      init_define_process_env();
      init_globals();
      init_builtin_files();
      DB_NAME = "hombresai-web";
      MEMORY_LIMIT = 512 * 1024;
      meta = /* @__PURE__ */ new Map();
      data = /* @__PURE__ */ new Map();
      dirs = /* @__PURE__ */ new Set(["/"]);
      db = null;
      enc = new TextEncoder();
      for (const [p, text] of Object.entries(BUILTIN)) {
        const bytes = enc.encode(text);
        meta.set(p, { size: bytes.length, mtime: 0, builtin: true });
        data.set(p, bytes);
      }
      norm = (p) => {
        const parts = [];
        for (const s of String(p).replace(/\\/g, "/").split("/")) {
          if (!s || s === ".") continue;
          if (s === "..") parts.pop();
          else parts.push(s);
        }
        return `/${parts.join("/")}`;
      };
      fsError = (code, syscall, p) => Object.assign(new Error(`${code}: ${code === "ENOENT" ? "no such file or directory" : "operation not permitted"}, ${syscall} '${p}'`), { code, syscall, path: p, errno: -2 });
      done = (tx) => new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      result = (r) => new Promise((resolve, reject) => {
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      isDir = (p) => p === "/" || dirs.has(p) || [...meta.keys()].some((k) => k.startsWith(`${p}/`));
      exists = (p) => {
        p = norm(p);
        return meta.has(p) || isDir(p);
      };
    }
  });

  // web/shims/http.js
  var http_exports = {};
  __export(http_exports, {
    Agent: () => Agent,
    createServer: () => createServer,
    default: () => http_default,
    get: () => get,
    request: () => request,
    serverReady: () => serverReady
  });
  function createServer(handler) {
    const server = {
      listen(port, host, callback) {
        resolveReady({ handler, port });
        queueMicrotask(() => (typeof host === "function" ? host : callback)?.());
        return server;
      },
      on() {
        return server;
      },
      once() {
        return server;
      },
      close(callback) {
        callback?.();
      },
      address: () => ({ port: 4848 })
    };
    return server;
  }
  function mapUrl(url) {
    const u = new URL(url);
    if (["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) && Number(u.port) >= 4848 && Number(u.port) <= 4868) return null;
    if (u.hostname === CNB_HOST) return new URL("cnb.txt", self.registration?.scope || self.location.href).href;
    return u.href;
  }
  function request(url, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    return new ClientRequest(url, options, callback);
  }
  function get(url, options, callback) {
    const req = request(url, options, callback);
    req.end();
    return req;
  }
  var resolveReady, serverReady, CNB_HOST, SKIP_HEADERS, Emitter, IncomingMessage, ClientRequest, Agent, http_default;
  var init_http = __esm({
    "web/shims/http.js"() {
      init_define_process_env();
      init_globals();
      serverReady = new Promise((resolve) => {
        resolveReady = resolve;
      });
      CNB_HOST = "www.cnb.cz";
      SKIP_HEADERS = /^(content-length|host|connection|accept-encoding|user-agent|transfer-encoding)$/i;
      Emitter = class {
        constructor() {
          this.handlers = {};
        }
        on(ev, fn) {
          (this.handlers[ev] ||= []).push(fn);
          return this;
        }
        once(ev, fn) {
          return this.on(ev, fn);
        }
        emit(ev, ...args) {
          for (const fn of this.handlers[ev] || []) fn(...args);
        }
      };
      IncomingMessage = class extends Emitter {
        constructor(r) {
          super();
          this.statusCode = r.status;
          this.statusMessage = r.statusText;
          this.headers = {};
          r.headers.forEach((v, k) => {
            this.headers[k] = v;
          });
          this.response = r;
        }
        setEncoding() {
          return this;
        }
        resume() {
          return this;
        }
        async start() {
          try {
            if (this.response.body) {
              const reader = this.response.body.getReader();
              for (; ; ) {
                const { done: done2, value } = await reader.read();
                if (done2) break;
                this.emit("data", import_buffer.Buffer.from(value));
              }
            }
            this.emit("end");
          } catch (err) {
            this.emit("error", err);
          }
        }
      };
      ClientRequest = class extends Emitter {
        constructor(url, options, callback) {
          super();
          this.url = url;
          this.options = options || {};
          this.callback = callback;
          this.chunks = [];
          this.controller = new AbortController();
          this.failed = false;
        }
        setTimeout(ms, fn) {
          this.timer = setTimeout(fn, ms);
          return this;
        }
        setHeader() {
        }
        write(chunk) {
          this.chunks.push(typeof chunk === "string" ? import_buffer.Buffer.from(chunk) : chunk);
          return true;
        }
        fail(err) {
          clearTimeout(this.timer);
          if (this.failed) return;
          this.failed = true;
          this.emit("error", err);
        }
        destroy(err) {
          this.controller.abort();
          this.fail(err || Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }));
        }
        end(chunk) {
          if (chunk != null) this.write(chunk);
          this.send();
          return this;
        }
        async send() {
          const url = mapUrl(String(this.url));
          if (!url) {
            setTimeout(() => this.fail(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" })), 0);
            return;
          }
          const headers = {};
          for (const [k, v] of Object.entries(this.options.headers || {})) if (!SKIP_HEADERS.test(k) && v != null) headers[k] = String(v);
          const method = (this.options.method || "GET").toUpperCase();
          const body = this.chunks.length && !["GET", "HEAD"].includes(method) ? import_buffer.Buffer.concat(this.chunks) : void 0;
          let r;
          try {
            r = await fetch(url, { method, headers, body, signal: this.controller.signal, redirect: "follow" });
          } catch (err) {
            if (!this.failed) this.fail(Object.assign(new Error(err.message || "fetch failed"), { code: err.name === "AbortError" ? "ECONNRESET" : "ENOTFOUND", cause: err }));
            return;
          }
          clearTimeout(this.timer);
          if (this.failed) return;
          const res = new IncomingMessage(r);
          this.callback?.(res);
          this.emit("response", res);
          res.start();
        }
      };
      Agent = class {
      };
      http_default = { createServer, request, get, Agent };
    }
  });

  // web/shims/fs-promises.js
  var fs_promises_exports = {};
  __export(fs_promises_exports, {
    access: () => access,
    appendFile: () => appendFile,
    copyFile: () => copyFile,
    default: () => fs_promises_default,
    mkdir: () => mkdir2,
    readFile: () => readFile,
    readdir: () => readdir,
    rename: () => rename2,
    rm: () => rm,
    rmdir: () => rmdir,
    stat: () => stat2,
    unlink: () => unlink,
    writeFile: () => writeFile
  });
  async function readFile(p, options) {
    const bytes = import_buffer.Buffer.from(await read(p));
    const enc2 = encodingOf(options);
    return enc2 ? bytes.toString(enc2) : bytes;
  }
  async function writeFile(p, d, options) {
    await write(p, toBytes(d, encodingOf(options)));
  }
  async function appendFile(p, d, options) {
    const old = exists(p) ? import_buffer.Buffer.from(await read(p)) : import_buffer.Buffer.alloc(0);
    await write(p, import_buffer.Buffer.concat([old, toBytes(d, encodingOf(options))]));
  }
  async function mkdir2(p) {
    mkdir(p);
  }
  async function unlink(p) {
    await remove(p);
  }
  async function rm(p, options) {
    try {
      await remove(p);
    } catch (err) {
      if (!options?.force) throw err;
    }
  }
  async function rename2(a, b) {
    await rename(a, b);
  }
  async function copyFile(a, b) {
    await write(b, await read(a));
  }
  async function rmdir() {
  }
  async function stat2(p) {
    return stat(p);
  }
  async function access(p) {
    if (!exists(p)) throw fsError("ENOENT", "access", p);
  }
  async function readdir(dir, options) {
    const entries = list(dir);
    if (!options?.withFileTypes) return entries.map((e) => e.name);
    return entries.map((e) => ({ name: e.name, isFile: () => e.kind === "file", isDirectory: () => e.kind === "dir" }));
  }
  var toBytes, encodingOf, fs_promises_default;
  var init_fs_promises = __esm({
    "web/shims/fs-promises.js"() {
      init_define_process_env();
      init_globals();
      init_vfs();
      toBytes = (d, encoding) => typeof d === "string" ? import_buffer.Buffer.from(d, encoding || "utf8") : d instanceof Uint8Array ? d : import_buffer.Buffer.from(d);
      encodingOf = (o) => typeof o === "string" ? o : o?.encoding;
      fs_promises_default = { readFile, writeFile, appendFile, mkdir: mkdir2, unlink, rm, rename: rename2, copyFile, rmdir, stat: stat2, access, readdir };
    }
  });

  // web/shims/fs.js
  var fs_exports = {};
  __export(fs_exports, {
    createReadStream: () => createReadStream,
    default: () => fs_default,
    existsSync: () => existsSync,
    mkdirSync: () => mkdirSync,
    promises: () => fs_promises_default,
    readFileSync: () => readFileSync,
    renameSync: () => renameSync
  });
  function readFileSync(p, options) {
    const bytes = import_buffer.Buffer.from(readSync(p));
    const enc2 = typeof options === "string" ? options : options?.encoding;
    return enc2 ? bytes.toString(enc2) : bytes;
  }
  function renameSync(a) {
    throw fsError("ENOENT", "rename", a);
  }
  function mkdirSync(p) {
    mkdir(p);
  }
  function createReadStream(p, opts = {}) {
    const handlers = {};
    const stream = {
      on(ev, fn) {
        (handlers[ev] ||= []).push(fn);
        return stream;
      },
      once(ev, fn) {
        return stream.on(ev, fn);
      },
      pipe(res) {
        read(p).then((bytes) => {
          let out = import_buffer.Buffer.from(bytes);
          if (typeof opts.start === "number" || typeof opts.end === "number") {
            out = out.subarray(opts.start || 0, typeof opts.end === "number" ? opts.end + 1 : out.length);
          }
          res.end(out);
        }, (err) => (handlers.error || []).forEach((fn) => fn(err)));
        return res;
      }
    };
    return stream;
  }
  var existsSync, fs_default;
  var init_fs = __esm({
    "web/shims/fs.js"() {
      init_define_process_env();
      init_globals();
      init_vfs();
      init_fs_promises();
      existsSync = (p) => exists(p);
      fs_default = { existsSync, readFileSync, renameSync, mkdirSync, createReadStream, promises: fs_promises_default };
    }
  });

  // web/node_modules/path-browserify/index.js
  var require_path_browserify = __commonJS({
    "web/node_modules/path-browserify/index.js"(exports, module) {
      "use strict";
      init_define_process_env();
      init_globals();
      function assertPath(path) {
        if (typeof path !== "string") {
          throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
        }
      }
      function normalizeStringPosix(path, allowAboveRoot) {
        var res = "";
        var lastSegmentLength = 0;
        var lastSlash = -1;
        var dots = 0;
        var code;
        for (var i = 0; i <= path.length; ++i) {
          if (i < path.length)
            code = path.charCodeAt(i);
          else if (code === 47)
            break;
          else
            code = 47;
          if (code === 47) {
            if (lastSlash === i - 1 || dots === 1) {
            } else if (lastSlash !== i - 1 && dots === 2) {
              if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                if (res.length > 2) {
                  var lastSlashIndex = res.lastIndexOf("/");
                  if (lastSlashIndex !== res.length - 1) {
                    if (lastSlashIndex === -1) {
                      res = "";
                      lastSegmentLength = 0;
                    } else {
                      res = res.slice(0, lastSlashIndex);
                      lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                    }
                    lastSlash = i;
                    dots = 0;
                    continue;
                  }
                } else if (res.length === 2 || res.length === 1) {
                  res = "";
                  lastSegmentLength = 0;
                  lastSlash = i;
                  dots = 0;
                  continue;
                }
              }
              if (allowAboveRoot) {
                if (res.length > 0)
                  res += "/..";
                else
                  res = "..";
                lastSegmentLength = 2;
              }
            } else {
              if (res.length > 0)
                res += "/" + path.slice(lastSlash + 1, i);
              else
                res = path.slice(lastSlash + 1, i);
              lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
          } else if (code === 46 && dots !== -1) {
            ++dots;
          } else {
            dots = -1;
          }
        }
        return res;
      }
      function _format(sep, pathObject) {
        var dir = pathObject.dir || pathObject.root;
        var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
        if (!dir) {
          return base;
        }
        if (dir === pathObject.root) {
          return dir + base;
        }
        return dir + sep + base;
      }
      var posix = {
        // path.resolve([from ...], to)
        resolve: function resolve() {
          var resolvedPath = "";
          var resolvedAbsolute = false;
          var cwd;
          for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path;
            if (i >= 0)
              path = arguments[i];
            else {
              if (cwd === void 0)
                cwd = process.cwd();
              path = cwd;
            }
            assertPath(path);
            if (path.length === 0) {
              continue;
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47;
          }
          resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
          if (resolvedAbsolute) {
            if (resolvedPath.length > 0)
              return "/" + resolvedPath;
            else
              return "/";
          } else if (resolvedPath.length > 0) {
            return resolvedPath;
          } else {
            return ".";
          }
        },
        normalize: function normalize(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var isAbsolute = path.charCodeAt(0) === 47;
          var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
          path = normalizeStringPosix(path, !isAbsolute);
          if (path.length === 0 && !isAbsolute) path = ".";
          if (path.length > 0 && trailingSeparator) path += "/";
          if (isAbsolute) return "/" + path;
          return path;
        },
        isAbsolute: function isAbsolute(path) {
          assertPath(path);
          return path.length > 0 && path.charCodeAt(0) === 47;
        },
        join: function join() {
          if (arguments.length === 0)
            return ".";
          var joined;
          for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            assertPath(arg);
            if (arg.length > 0) {
              if (joined === void 0)
                joined = arg;
              else
                joined += "/" + arg;
            }
          }
          if (joined === void 0)
            return ".";
          return posix.normalize(joined);
        },
        relative: function relative(from, to) {
          assertPath(from);
          assertPath(to);
          if (from === to) return "";
          from = posix.resolve(from);
          to = posix.resolve(to);
          if (from === to) return "";
          var fromStart = 1;
          for (; fromStart < from.length; ++fromStart) {
            if (from.charCodeAt(fromStart) !== 47)
              break;
          }
          var fromEnd = from.length;
          var fromLen = fromEnd - fromStart;
          var toStart = 1;
          for (; toStart < to.length; ++toStart) {
            if (to.charCodeAt(toStart) !== 47)
              break;
          }
          var toEnd = to.length;
          var toLen = toEnd - toStart;
          var length = fromLen < toLen ? fromLen : toLen;
          var lastCommonSep = -1;
          var i = 0;
          for (; i <= length; ++i) {
            if (i === length) {
              if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                  return to.slice(toStart + i + 1);
                } else if (i === 0) {
                  return to.slice(toStart + i);
                }
              } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                  lastCommonSep = i;
                } else if (i === 0) {
                  lastCommonSep = 0;
                }
              }
              break;
            }
            var fromCode = from.charCodeAt(fromStart + i);
            var toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode)
              break;
            else if (fromCode === 47)
              lastCommonSep = i;
          }
          var out = "";
          for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === 47) {
              if (out.length === 0)
                out += "..";
              else
                out += "/..";
            }
          }
          if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
          else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === 47)
              ++toStart;
            return to.slice(toStart);
          }
        },
        _makeLong: function _makeLong(path) {
          return path;
        },
        dirname: function dirname(path) {
          assertPath(path);
          if (path.length === 0) return ".";
          var code = path.charCodeAt(0);
          var hasRoot = code === 47;
          var end = -1;
          var matchedSlash = true;
          for (var i = path.length - 1; i >= 1; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                end = i;
                break;
              }
            } else {
              matchedSlash = false;
            }
          }
          if (end === -1) return hasRoot ? "/" : ".";
          if (hasRoot && end === 1) return "//";
          return path.slice(0, end);
        },
        basename: function basename(path, ext) {
          if (ext !== void 0 && typeof ext !== "string") throw new TypeError('"ext" argument must be a string');
          assertPath(path);
          var start = 0;
          var end = -1;
          var matchedSlash = true;
          var i;
          if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path) return "";
            var extIdx = ext.length - 1;
            var firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
              var code = path.charCodeAt(i);
              if (code === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else {
                if (firstNonSlashEnd === -1) {
                  matchedSlash = false;
                  firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                  if (code === ext.charCodeAt(extIdx)) {
                    if (--extIdx === -1) {
                      end = i;
                    }
                  } else {
                    extIdx = -1;
                    end = firstNonSlashEnd;
                  }
                }
              }
            }
            if (start === end) end = firstNonSlashEnd;
            else if (end === -1) end = path.length;
            return path.slice(start, end);
          } else {
            for (i = path.length - 1; i >= 0; --i) {
              if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
            }
            if (end === -1) return "";
            return path.slice(start, end);
          }
        },
        extname: function extname(path) {
          assertPath(path);
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var preDotState = 0;
          for (var i = path.length - 1; i >= 0; --i) {
            var code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1)
                startDot = i;
              else if (preDotState !== 1)
                preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            return "";
          }
          return path.slice(startDot, end);
        },
        format: function format(pathObject) {
          if (pathObject === null || typeof pathObject !== "object") {
            throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
          }
          return _format("/", pathObject);
        },
        parse: function parse(path) {
          assertPath(path);
          var ret = { root: "", dir: "", base: "", ext: "", name: "" };
          if (path.length === 0) return ret;
          var code = path.charCodeAt(0);
          var isAbsolute = code === 47;
          var start;
          if (isAbsolute) {
            ret.root = "/";
            start = 1;
          } else {
            start = 0;
          }
          var startDot = -1;
          var startPart = 0;
          var end = -1;
          var matchedSlash = true;
          var i = path.length - 1;
          var preDotState = 0;
          for (; i >= start; --i) {
            code = path.charCodeAt(i);
            if (code === 47) {
              if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
              continue;
            }
            if (end === -1) {
              matchedSlash = false;
              end = i + 1;
            }
            if (code === 46) {
              if (startDot === -1) startDot = i;
              else if (preDotState !== 1) preDotState = 1;
            } else if (startDot !== -1) {
              preDotState = -1;
            }
          }
          if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
          preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
            if (end !== -1) {
              if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);
              else ret.base = ret.name = path.slice(startPart, end);
            }
          } else {
            if (startPart === 0 && isAbsolute) {
              ret.name = path.slice(1, startDot);
              ret.base = path.slice(1, end);
            } else {
              ret.name = path.slice(startPart, startDot);
              ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
          }
          if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
          else if (isAbsolute) ret.dir = "/";
          return ret;
        },
        sep: "/",
        delimiter: ":",
        win32: null,
        posix: null
      };
      posix.posix = posix;
      module.exports = posix;
    }
  });

  // web/shims/os.js
  var os_exports = {};
  __export(os_exports, {
    EOL: () => EOL,
    default: () => os_default,
    homedir: () => homedir,
    platform: () => platform,
    tmpdir: () => tmpdir
  });
  var homedir, tmpdir, platform, EOL, os_default;
  var init_os = __esm({
    "web/shims/os.js"() {
      init_define_process_env();
      init_globals();
      homedir = () => "/home/web";
      tmpdir = () => "/tmp";
      platform = () => "web";
      EOL = "\n";
      os_default = { homedir, tmpdir, platform, EOL };
    }
  });

  // web/shims/crypto.js
  var crypto_exports = {};
  __export(crypto_exports, {
    createHash: () => createHash,
    default: () => crypto_default,
    randomBytes: () => randomBytes,
    randomInt: () => randomInt,
    randomUUID: () => randomUUID
  });
  function randomBytes(n) {
    const b = import_buffer.Buffer.alloc(n);
    for (let i = 0; i < n; i += 65536) webcrypto.getRandomValues(b.subarray(i, Math.min(n, i + 65536)));
    return b;
  }
  function randomInt(min, max) {
    if (max === void 0) {
      max = min;
      min = 0;
    }
    const range = max - min;
    const buf = new Uint32Array(1);
    const limit = Math.floor(4294967296 / range) * range;
    do
      webcrypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return min + buf[0] % range;
  }
  function sha256(bytes) {
    const len = bytes.length;
    const padded = new Uint8Array(len + 9 + 63 >> 6 << 6);
    padded.set(bytes);
    padded[len] = 128;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(len / 536870912));
    view.setUint32(padded.length - 4, len << 3 >>> 0);
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const w = new Uint32Array(64);
    const rotr = (x, n) => x >>> n | x << 32 - n;
    for (let off = 0; off < padded.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ w[i - 15] >>> 3;
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ w[i - 2] >>> 10;
        w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + (e & f ^ ~e & g) + K[i] + w[i] >>> 0;
        const t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + (a & b ^ a & c ^ b & c) >>> 0;
        hh = g;
        g = f;
        f = e;
        e = d + t1 >>> 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 >>> 0;
      }
      h[0] += a;
      h[1] += b;
      h[2] += c;
      h[3] += d;
      h[4] += e;
      h[5] += f;
      h[6] += g;
      h[7] += hh;
    }
    const out = import_buffer.Buffer.alloc(32);
    for (let i = 0; i < 8; i++) out.writeUInt32BE(h[i], i * 4);
    return out;
  }
  function createHash(algorithm) {
    if (String(algorithm).toLowerCase() !== "sha256") throw new Error(`The web version only has sha256 (asked for ${algorithm}).`);
    const parts = [];
    const hash = {
      update(d, enc2) {
        parts.push(typeof d === "string" ? import_buffer.Buffer.from(d, enc2 || "utf8") : import_buffer.Buffer.from(d));
        return hash;
      },
      digest(enc2) {
        const out = sha256(import_buffer.Buffer.concat(parts));
        if (enc2 === "base64url") return out.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return enc2 ? out.toString(enc2) : out;
      }
    };
    return hash;
  }
  var webcrypto, randomUUID, K, crypto_default;
  var init_crypto = __esm({
    "web/shims/crypto.js"() {
      init_define_process_env();
      init_globals();
      webcrypto = globalThis.crypto;
      randomUUID = () => webcrypto.randomUUID();
      K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
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
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      crypto_default = { randomBytes, randomInt, randomUUID, createHash };
    }
  });

  // web/shims/child_process.js
  var child_process_exports = {};
  __export(child_process_exports, {
    default: () => child_process_default,
    spawn: () => spawn
  });
  function spawn() {
    const child = { on() {
      return child;
    }, once() {
      return child;
    }, unref() {
      return child;
    }, kill() {
    } };
    return child;
  }
  var child_process_default;
  var init_child_process = __esm({
    "web/shims/child_process.js"() {
      init_define_process_env();
      init_globals();
      child_process_default = { spawn };
    }
  });

  // public/nodes-core.js
  var require_nodes_core = __commonJS({
    "public/nodes-core.js"(exports, module) {
      init_define_process_env();
      init_globals();
      (function(root, factory) {
        const core = factory();
        if (typeof module === "object" && module.exports) module.exports = core;
        else root.NodesCore = core;
      })(typeof globalThis !== "undefined" ? globalThis : exports, () => {
        "use strict";
        const o = (id, label, text, extra) => ({ id, label, text: text ?? label.toLowerCase(), ...extra });
        const CAMERAS = [
          o("ff", "Full-frame mirrorless", "a full-frame mirrorless camera", { sensor: "full frame (36 \xD7 24 mm)", crop: 1 }),
          o("ff_dslr", "Full-frame DSLR", "a full-frame DSLR", { sensor: "full frame (36 \xD7 24 mm)", crop: 1 }),
          o("mf", "Medium format digital", "a medium-format digital camera", { sensor: "medium format (44 \xD7 33 mm)", crop: 0.79 }),
          o("apsc", "APS-C mirrorless", "an APS-C mirrorless camera", { sensor: "APS-C", crop: 1.5 }),
          o("m43", "Micro Four Thirds", "a Micro Four Thirds camera", { sensor: "Micro Four Thirds", crop: 2 }),
          o("cinema", "Cinema camera (Super 35)", "an ARRI Alexa 35 cinema camera", { sensor: "Super 35", crop: 1.4 }),
          o("cinema_lf", "Large-format cinema", "an ARRI Alexa LF large-format cinema camera", { sensor: "large format", crop: 0.85 }),
          o("film35", "35 mm film SLR", "a 35 mm film SLR", { sensor: "35 mm film", crop: 1 }),
          o("film120", "Medium format film (6\xD77)", "a 6\xD77 medium-format film camera", { sensor: "120 film (6\xD77)", crop: 0.5 }),
          o("large", "Large format 4\xD75", "a 4\xD75 large-format view camera", { sensor: "4\xD75 inch sheet film", crop: 0.28 }),
          o("phone", "Smartphone", "a modern smartphone camera", { sensor: "small smartphone sensor", crop: 1, dof: 5 }),
          o("action", "Action camera", "an action camera", { sensor: "small action-cam sensor", crop: 1, dof: 6 }),
          o("drone", "Drone camera", "a camera drone", { sensor: "1-inch sensor", crop: 1, dof: 2.7 }),
          o("instant", "Instant film", "an instant film camera", { sensor: "instant film", crop: 0.85 }),
          o("disposable", "Disposable film camera", "a disposable 35 mm camera with on-camera flash", { sensor: "35 mm film", crop: 1 }),
          o("cctv", "Security camera", "a security CCTV camera", { sensor: "tiny surveillance sensor", crop: 1, dof: 8 })
        ];
        const LENS_TYPES = [
          o("prime", "Prime", "prime lens"),
          o("zoom", "Zoom", "zoom lens"),
          o("cine", "Cine prime", "cinema prime lens", { look: "smooth focus fall-off" }),
          o("anamorphic", "Anamorphic 2\xD7", "anamorphic lens", { look: "oval bokeh and horizontal blue lens flares" }),
          o("macro", "Macro 1:1", "macro lens", { look: "life-size magnification with a wafer-thin plane of focus" }),
          o("fisheye", "Fisheye", "fisheye lens", { look: "strong barrel distortion and a curved horizon" }),
          o("tiltshift", "Tilt-shift", "tilt-shift lens", { look: "a tilted plane of focus that gives a miniature effect" }),
          o("vintage", "Vintage", "vintage lens", { look: "soft glow, lower contrast, swirly bokeh and gentle vignetting" }),
          o("pinhole", "Pinhole", "pinhole aperture", { look: "overall softness, infinite depth of field and heavy vignetting" })
        ];
        const FOCALS = [8, 12, 14, 16, 18, 20, 24, 28, 35, 40, 50, 58, 70, 85, 100, 105, 135, 180, 200, 300, 400, 600, 800];
        const ISOS = [50, 64, 100, 125, 160, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200];
        const APERTURES = [0.95, 1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32];
        const SHUTTERS = ["1/8000", "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60", "1/50", "1/30", "1/15", "1/8", "1/4", "1/2", "1", "2", "4", "8", "15", "30"];
        const FOCUS_TARGETS = [o("eyes", "Eyes", "the eyes"), o("face", "Face", "the face"), o("subject", "Main subject", "the main subject"), o("foreground", "Foreground", "the foreground"), o("background", "Background", "the background"), o("everything", "Everything (hyperfocal)", "everything from near to far")];
        const DOF_OVERRIDES = [o("auto", "From aperture", ""), o("razor", "Razor-thin", "razor-thin"), o("shallow", "Shallow", "shallow"), o("moderate", "Moderate", "moderate"), o("deep", "Deep", "deep"), o("infinite", "Everything sharp", "everything sharp")];
        const BOKEH = [o("none", "\u2014", ""), o("creamy", "Creamy round", "creamy round"), o("swirly", "Swirly", "swirly"), o("oval", "Oval (anamorphic)", "oval anamorphic"), o("bubble", "Soap bubble", "soap-bubble"), o("catseye", "Cat's eye", "cat's-eye"), o("hexagon", "Hexagonal", "hexagonal")];
        const FILM_STOCKS = [
          o("digital", "Clean digital", "a clean digital image"),
          o("portra400", "Kodak Portra 400", "Kodak Portra 400 film with soft pastel tones and natural skin"),
          o("ektar100", "Kodak Ektar 100", "Kodak Ektar 100 film with vivid saturated colors and fine grain"),
          o("gold200", "Kodak Gold 200", "Kodak Gold 200 film with warm golden tones"),
          o("fuji400h", "Fujifilm Pro 400H", "Fujifilm Pro 400H film with airy pastel greens"),
          o("velvia50", "Fujifilm Velvia 50", "Fujifilm Velvia 50 slide film with intense saturation and deep contrast"),
          o("cinestill800t", "CineStill 800T", "CineStill 800T tungsten film with red halation around highlights"),
          o("vision3", "Kodak Vision3 500T", "Kodak Vision3 500T motion-picture film with rich shadows"),
          o("trix400", "Kodak Tri-X 400 (B&W)", "Kodak Tri-X 400 black-and-white film with punchy grain"),
          o("hp5", "Ilford HP5 (B&W)", "Ilford HP5 black-and-white film with soft gradation"),
          o("polaroid", "Polaroid", "Polaroid instant film with soft colors and a dreamy shift")
        ];
        const GRAIN = [o("auto", "From stock / ISO", ""), o("none", "None", "no grain"), o("fine", "Fine", "fine grain"), o("medium", "Medium", "medium grain"), o("heavy", "Heavy", "heavy grain")];
        const SHOT_SIZES = [
          o("ecu", "Extreme close-up", "extreme close-up"),
          o("cu", "Close-up", "close-up"),
          o("mcu", "Medium close-up", "medium close-up"),
          o("ms", "Medium shot", "medium shot"),
          o("cowboy", "Cowboy shot", "cowboy shot (mid-thigh up)"),
          o("fs", "Full shot", "full-body shot"),
          o("ws", "Wide shot", "wide shot"),
          o("ews", "Extreme wide / establishing", "extreme wide establishing shot"),
          o("macro", "Macro detail", "macro detail shot")
        ];
        const ANGLES = [
          o("eye", "Eye level", "at eye level"),
          o("low", "Low angle", "from a low angle"),
          o("high", "High angle", "from a high angle"),
          o("top", "Bird's eye / top-down", "from directly above"),
          o("worm", "Worm's eye", "from a worm's-eye view"),
          o("dutch", "Dutch angle", "with a tilted dutch angle"),
          o("ots", "Over the shoulder", "over the shoulder"),
          o("pov", "POV", "from a first-person point of view"),
          o("profile", "Profile", "in profile")
        ];
        const COMPOSITIONS = [
          o("thirds", "Rule of thirds", "rule-of-thirds composition"),
          o("center", "Centered, symmetrical", "centered symmetrical composition"),
          o("lines", "Leading lines", "leading lines toward the subject"),
          o("frame", "Frame within a frame", "a frame within the frame"),
          o("negative", "Negative space", "generous negative space"),
          o("golden", "Golden ratio", "golden-ratio composition"),
          o("layers", "Foreground layers", "layered foreground, midground and background"),
          o("free", "Free", "")
        ];
        const LIGHT_SETUPS = [
          o("natural", "Natural daylight", "natural daylight"),
          o("window", "Soft window light", "soft window light"),
          o("golden", "Golden hour sun", "warm low golden-hour sun"),
          o("blue", "Blue hour", "cool blue-hour twilight"),
          o("overcast", "Overcast", "soft overcast light"),
          o("midday", "Hard midday sun", "hard midday sun with crisp shadows"),
          o("softbox", "Studio softbox", "large studio softbox"),
          o("rembrandt", "Rembrandt", "Rembrandt lighting with a triangle of light on the cheek"),
          o("butterfly", "Butterfly / Paramount", "butterfly lighting from above the camera"),
          o("split", "Split light", "split lighting"),
          o("rim", "Rim / backlight", "strong rim backlight"),
          o("highkey", "High-key", "bright high-key lighting"),
          o("lowkey", "Low-key", "moody low-key lighting"),
          o("neon", "Neon practicals", "colored neon practical lights"),
          o("candle", "Candlelight", "flickering candlelight"),
          o("moon", "Moonlight", "cool moonlight"),
          o("flash", "Direct flash", "direct on-camera flash"),
          o("godrays", "Volumetric god rays", "volumetric god rays through haze")
        ];
        const LIGHT_DIRECTIONS = [o("any", "\u2014", ""), o("front", "Front", "from the front"), o("side45", "45\xB0 side", "from 45\xB0 to the side"), o("side", "Side", "from the side"), o("back", "Back", "from behind"), o("top", "Top", "from above"), o("under", "Under", "from below")];
        const LIGHT_QUALITY = [o("soft", "Soft", "soft, diffused"), o("hard", "Hard", "hard, crisp"), o("mixed", "Mixed", "mixed soft and hard")];
        const KELVINS = [1900, 2700, 3200, 4300, 5e3, 5600, 6500, 7500, 1e4];
        const CONTRASTS = [o("low", "Low", "low contrast"), o("medium", "Medium", "medium contrast"), o("high", "High", "high contrast")];
        const HAZE = [o("none", "None", ""), o("light", "Light", "light atmospheric haze"), o("heavy", "Heavy", "thick haze and fog")];
        const TIMES = [o("any", "\u2014", ""), o("dawn", "Dawn"), o("morning", "Morning"), o("noon", "Midday"), o("afternoon", "Afternoon"), o("golden", "Golden hour"), o("dusk", "Dusk"), o("bluehour", "Blue hour"), o("night", "Night")];
        const WEATHER = [o("any", "\u2014", ""), o("clear", "Clear", "under a clear sky"), o("cloudy", "Cloudy", "under cloudy skies"), o("fog", "Fog", "in fog"), o("rain", "Rain", "in the rain"), o("snow", "Snow", "in falling snow"), o("storm", "Storm", "in a storm"), o("wind", "Windy", "on a windy day")];
        const SEASONS = [o("any", "\u2014", ""), o("spring", "Spring"), o("summer", "Summer"), o("autumn", "Autumn"), o("winter", "Winter")];
        const GRADES = [
          o("natural", "Natural", "natural true-to-life color"),
          o("warm", "Warm", "warm color grade"),
          o("cool", "Cool", "cool color grade"),
          o("tealorange", "Teal & orange", "teal-and-orange cinematic grade"),
          o("bleach", "Bleach bypass", "desaturated bleach-bypass look"),
          o("pastel", "Pastel", "soft pastel palette"),
          o("vivid", "Vivid", "vivid saturated colors"),
          o("muted", "Muted", "muted, desaturated colors"),
          o("mono", "Black & white", "black-and-white"),
          o("sepia", "Sepia", "sepia toning"),
          o("cross", "Cross-processed", "cross-processed color shifts")
        ];
        const SATURATION = [o("muted", "Muted"), o("natural", "Natural"), o("vivid", "Vivid")];
        const MEDIUMS = [
          o("photo", "Photograph", "photograph"),
          o("cinematic", "Cinematic still", "cinematic film still"),
          o("editorial", "Editorial", "editorial photograph"),
          o("documentary", "Documentary", "documentary photograph"),
          o("commercial", "Commercial", "commercial advertising photograph"),
          o("render3d", "3D render", "physically based 3D render"),
          o("illustration", "Illustration", "digital illustration"),
          o("oil", "Oil painting", "oil painting"),
          o("watercolor", "Watercolor", "watercolor painting"),
          o("anime", "Anime", "anime illustration"),
          o("comic", "Comic", "comic book art"),
          o("pixel", "Pixel art", "pixel art"),
          o("vector", "Flat vector", "flat vector illustration"),
          o("clay", "Claymation", "claymation")
        ];
        const ERAS = [o("any", "\u2014", ""), o("now", "Contemporary", "contemporary"), o("1920s", "1920s"), o("1950s", "1950s"), o("1970s", "1970s"), o("1980s", "1980s"), o("1990s", "1990s"), o("y2k", "Y2K"), o("future", "Near future", "near-future")];
        const MOODS = [o("any", "\u2014", ""), o("serene", "Serene"), o("dramatic", "Dramatic"), o("mysterious", "Mysterious"), o("joyful", "Joyful"), o("melancholic", "Melancholic"), o("tense", "Tense"), o("romantic", "Romantic"), o("epic", "Epic"), o("cozy", "Cozy"), o("eerie", "Eerie")];
        const EXPRESSIONS = [o("any", "\u2014", ""), o("neutral", "Neutral"), o("smile", "Gentle smile", "a gentle smile"), o("laugh", "Laughing"), o("serious", "Serious"), o("pensive", "Pensive"), o("surprised", "Surprised"), o("intense", "Intense gaze", "an intense gaze")];
        const CAMERA_MOVES = [
          o("static", "Static (locked off)", "a locked-off static camera"),
          o("pushin", "Push in (dolly in)", "a dolly push-in"),
          o("pullout", "Pull out (dolly out)", "a dolly pull-out"),
          o("panl", "Pan left", "a pan to the left"),
          o("panr", "Pan right", "a pan to the right"),
          o("tiltup", "Tilt up", "a tilt up"),
          o("tiltdown", "Tilt down", "a tilt down"),
          o("track", "Tracking / follow", "a tracking shot following the subject"),
          o("orbit", "Orbit / arc", "an orbiting arc around the subject"),
          o("craneup", "Crane up", "a rising crane move"),
          o("cranedown", "Crane down", "a descending crane move"),
          o("handheld", "Handheld", "organic handheld camera"),
          o("gimbal", "Gimbal / steadicam", "a smooth steadicam glide"),
          o("fpv", "FPV drone fly-through", "a fast FPV drone fly-through"),
          o("aerial", "Aerial drone", "a sweeping aerial drone shot"),
          o("whip", "Whip pan", "a whip pan"),
          o("zoomin", "Zoom in", "a slow optical zoom in"),
          o("zoomout", "Zoom out", "a zoom out"),
          o("dollyzoom", "Dolly zoom (vertigo)", "a dolly-zoom vertigo effect"),
          o("rackfocus", "Rack focus", "a rack focus between foreground and background")
        ];
        const SPEEDS = [o("veryslow", "Very slow"), o("slow", "Slow"), o("medium", "Medium", "moderate"), o("fast", "Fast")];
        const PACING = [o("realtime", "Real time", ""), o("slowmo", "Slow motion", "slow motion"), o("timelapse", "Time-lapse", "time-lapse"), o("ramp", "Speed ramp", "a speed ramp")];
        const MUSIC = [o("none", "No music", ""), o("ambient", "Ambient pads", "ambient pads"), o("score", "Cinematic score", "a cinematic orchestral score"), o("piano", "Solo piano", "a soft solo piano"), o("electronic", "Electronic", "an electronic beat"), o("upbeat", "Upbeat pop", "upbeat pop music"), o("tension", "Tension drones", "tense low drones")];
        const MODEL_FALLBACK = [o("gemini-nano-banana-2.1", "Nano Banana 2.1", "")];
        const IMAGE_RATIOS = ["auto", "1:1", "4:5", "3:4", "2:3", "9:16", "5:4", "4:3", "3:2", "16:9", "21:9"];
        const IMAGE_SIZES = ["1K", "2K", "4K"];
        const VIDEO_MODELS = [
          o("gemini-omni-1.1-flash", "Gemini Omni Flash", ""),
          o("wan-2.2", "Wan 2.2 (free, up to 5 s)", "", { free: true }),
          o("ltx-2.3", "LTX-2.3 (free, with sound)", "", { free: true }),
          o("ltx-video", "LTX-Video (free, fast)", "", { free: true })
        ];
        const VIDEO_RATIOS = ["16:9", "9:16"];
        const VIDEO_RESOLUTIONS = ["360p", "720p", "1080p", "4k"];
        const REF_ROLES = [o("auto", "Auto", ""), o("character", "Character"), o("object", "Object / product"), o("style", "Style"), o("scene", "Scene"), o("pose", "Pose"), o("edit", "Edit this")];
        const find = (list3, id) => list3.find((x) => String(x.id) === String(id));
        const textOf = (list3, id) => find(list3, id)?.text || "";
        const labelOf = (list3, id) => find(list3, id)?.label || "";
        const clean = (v) => String(v ?? "").trim();
        const article = (w) => /^[aeiou8]|^1[18]\b/i.test(String(w)) ? "an" : "a";
        const sentence = (t) => {
          const s = clean(t);
          return s ? s[0].toUpperCase() + s.slice(1) + (/[.!?…]$/.test(s) ? "" : ".") : "";
        };
        const list2 = (arr) => arr.length < 2 ? arr.join("") : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
        const fstop = (n) => `f/${Number(n)}`;
        const shutterSeconds = (s) => {
          const [a, b] = String(s).split("/").map(Number);
          return b ? a / b : a;
        };
        const shutterLabel = (s) => String(s).includes("/") ? `${s} s` : `${s} s`;
        const opts = (arr) => arr.map((x) => typeof x === "object" ? { value: String(x.id), label: x.label } : { value: String(x), label: String(x) });
        const SPEC_IN = [{ id: "in", type: "spec", multi: true, label: "in" }];
        const SPEC_OUT = [{ id: "out", type: "spec", label: "out" }];
        const CATEGORIES = [
          { id: "input", label: "Prompt & references" },
          { id: "camera", label: "Camera" },
          { id: "composition", label: "Composition" },
          { id: "light", label: "Light & scene" },
          { id: "look", label: "Look" },
          { id: "subject", label: "Subject" },
          { id: "motion", label: "Motion (video)" },
          { id: "audio", label: "Sound (video)" },
          { id: "output", label: "Generate" },
          { id: "utility", label: "Utility" }
        ];
        const NODE_TYPES = {
          prompt: {
            title: "Prompt",
            category: "input",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "What the picture or clip shows. It becomes the start of the prompt.",
            fields: [{ id: "text", label: "Prompt", type: "textarea", rows: 4, default: "", placeholder: "An old fisherman on a pier at dawn\u2026" }],
            build: (v) => ({ base: clean(v.text), spec: clean(v.text) ? { subject: { description: clean(v.text).slice(0, 600) } } : {} }),
            chips: (v) => clean(v.text) ? [clean(v.text).slice(0, 28) + (clean(v.text).length > 28 ? "\u2026" : "")] : []
          },
          reference: {
            title: "Reference image",
            category: "input",
            kinds: ["image", "video"],
            inputs: [],
            outputs: [{ id: "image", type: "image", label: "image" }],
            help: "An image from your gallery or computer \u2013 a reference for Generate image, or the first/last frame of a video.",
            fields: [
              { id: "image", label: "Image", type: "image", default: null },
              { id: "role", label: "Use as", type: "select", options: opts(REF_ROLES), default: "auto" }
            ],
            chips: (v) => v.image ? [labelOf(REF_ROLES, v.role) || "Reference"] : ["no image"]
          },
          camera: {
            title: "Camera body",
            category: "camera",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "The camera and its sensor size \u2013 it changes depth of field and the overall rendering.",
            fields: [
              { id: "body", label: "Camera", type: "select", options: opts(CAMERAS), default: "ff" },
              { id: "model", label: "Exact model (optional)", type: "text", default: "", placeholder: "e.g. Sony A7R V, Leica M11" }
            ],
            build: (v) => {
              const c = find(CAMERAS, v.body) || CAMERAS[0];
              const model = clean(v.model);
              return {
                spec: { camera: { body: model || c.label, sensor: c.sensor, crop_factor: c.crop } },
                prose: { camera: model ? `${article(model)} ${model} (${c.sensor})` : c.text },
                meta: { crop: c.crop, dof: c.dof || 1 }
              };
            },
            chips: (v) => [clean(v.model) || labelOf(CAMERAS, v.body)]
          },
          lens: {
            title: "Lens",
            category: "camera",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Focal length sets the field of view and perspective; the lens type adds its character.",
            fields: [
              { id: "focal", label: "Focal length", type: "select", options: FOCALS.map((f) => ({ value: String(f), label: `${f} mm` })), default: "50" },
              { id: "type", label: "Type", type: "select", options: opts(LENS_TYPES), default: "prime" },
              { id: "model", label: "Exact lens (optional)", type: "text", default: "", placeholder: "e.g. Zeiss Otus 85 mm" }
            ],
            build: (v) => {
              const t = find(LENS_TYPES, v.type) || LENS_TYPES[0];
              const focal = Number(v.focal) || 50;
              const model = clean(v.model);
              return {
                spec: { lens: { focal_length_mm: focal, type: t.label, ...model ? { model } : {}, ...t.look ? { character: t.look } : {} } },
                prose: { lens: model ? `${article(model)} ${model} at ${focal} mm` : `${article(focal)} ${focal} mm ${t.text}`, lensLook: t.look },
                meta: { focal, lensType: t.id }
              };
            },
            chips: (v) => [`${v.focal} mm`, v.type !== "prime" ? labelOf(LENS_TYPES, v.type) : null].filter(Boolean)
          },
          exposure: {
            title: "Exposure",
            category: "camera",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "ISO, aperture and shutter speed. They decide depth of field, motion blur, noise and how bright the scene must be.",
            fields: [
              { id: "iso", label: "ISO", type: "select", options: ISOS.map((i) => ({ value: String(i), label: `ISO ${i}` })), default: "100" },
              { id: "aperture", label: "Aperture", type: "select", options: APERTURES.map((a) => ({ value: String(a), label: fstop(a) })), default: "2.8" },
              { id: "shutter", label: "Shutter speed", type: "select", options: SHUTTERS.map((s) => ({ value: s, label: `${s} s` })), default: "1/250" },
              { id: "ev", label: "Exposure compensation", type: "select", options: ["-2", "-1", "-0.7", "-0.3", "0", "+0.3", "+0.7", "+1", "+2"].map((x) => ({ value: x, label: `${x} EV` })), default: "0" }
            ],
            build: (v) => ({
              spec: { exposure: { iso: Number(v.iso), aperture: fstop(v.aperture), shutter_speed: shutterLabel(v.shutter), ...v.ev && v.ev !== "0" ? { exposure_compensation: `${v.ev} EV` } : {} } },
              meta: { iso: Number(v.iso), aperture: Number(v.aperture), shutter: shutterSeconds(v.shutter), ev: Number(v.ev) || 0 }
            }),
            chips: (v) => [fstop(v.aperture), `${v.shutter} s`, `ISO ${v.iso}`]
          },
          focus: {
            title: "Focus & bokeh",
            category: "camera",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Where the focus sits and how the out-of-focus areas look.",
            fields: [
              { id: "target", label: "Focus on", type: "select", options: opts(FOCUS_TARGETS), default: "subject" },
              { id: "dof", label: "Depth of field", type: "select", options: opts(DOF_OVERRIDES), default: "auto" },
              { id: "bokeh", label: "Bokeh", type: "select", options: opts(BOKEH), default: "none" }
            ],
            build: (v) => {
              const dof = textOf(DOF_OVERRIDES, v.dof);
              const bokeh = textOf(BOKEH, v.bokeh);
              return {
                spec: { focus: { target: labelOf(FOCUS_TARGETS, v.target), ...dof ? { depth_of_field: dof } : {}, ...bokeh ? { bokeh } : {} } },
                say: [40, `Sharp focus on ${textOf(FOCUS_TARGETS, v.target)}${dof ? `, ${dof} depth of field` : ""}${bokeh ? `, ${bokeh} bokeh` : ""}`],
                meta: dof ? { dofOverride: v.dof } : {}
              };
            },
            chips: (v) => [labelOf(FOCUS_TARGETS, v.target), v.dof !== "auto" ? labelOf(DOF_OVERRIDES, v.dof) : null].filter(Boolean)
          },
          film: {
            title: "Film stock & grain",
            category: "camera",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "The emulsion or digital look: colors, contrast, grain and halation.",
            fields: [
              { id: "stock", label: "Stock", type: "select", options: opts(FILM_STOCKS), default: "portra400" },
              { id: "grain", label: "Grain", type: "select", options: opts(GRAIN), default: "auto" },
              { id: "halation", label: "Halation", type: "toggle", default: false }
            ],
            build: (v) => {
              const grain = textOf(GRAIN, v.grain);
              return {
                spec: { film: { stock: labelOf(FILM_STOCKS, v.stock), ...grain ? { grain } : {}, ...v.halation ? { halation: true } : {} } },
                say: [45, `The look of ${textOf(FILM_STOCKS, v.stock)}${grain ? `, ${grain}` : ""}${v.halation && !/halation/.test(textOf(FILM_STOCKS, v.stock)) ? ", soft red halation around bright highlights" : ""}`],
                meta: { grain: v.grain }
              };
            },
            chips: (v) => [labelOf(FILM_STOCKS, v.stock)]
          },
          shot: {
            title: "Shot & angle",
            category: "composition",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Shot size, camera angle and composition.",
            fields: [
              { id: "size", label: "Shot size", type: "select", options: opts(SHOT_SIZES), default: "mcu" },
              { id: "angle", label: "Angle", type: "select", options: opts(ANGLES), default: "eye" },
              { id: "composition", label: "Composition", type: "select", options: opts(COMPOSITIONS), default: "thirds" }
            ],
            build: (v) => {
              const comp = textOf(COMPOSITIONS, v.composition);
              return {
                spec: { composition: { shot_size: labelOf(SHOT_SIZES, v.size), angle: labelOf(ANGLES, v.angle), ...comp ? { framing: labelOf(COMPOSITIONS, v.composition) } : {} } },
                say: [50, `${textOf(SHOT_SIZES, v.size)} ${textOf(ANGLES, v.angle)}${comp ? `, ${comp}` : ""}`]
              };
            },
            chips: (v) => [labelOf(SHOT_SIZES, v.size), labelOf(ANGLES, v.angle)]
          },
          lighting: {
            title: "Lighting",
            category: "light",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Light source, direction, quality, color temperature and atmosphere.",
            fields: [
              { id: "setup", label: "Light", type: "select", options: opts(LIGHT_SETUPS), default: "window" },
              { id: "direction", label: "Direction", type: "select", options: opts(LIGHT_DIRECTIONS), default: "side45" },
              { id: "quality", label: "Quality", type: "select", options: opts(LIGHT_QUALITY), default: "soft" },
              { id: "kelvin", label: "Color temperature", type: "select", options: KELVINS.map((k) => ({ value: String(k), label: `${k} K` })), default: "5600" },
              { id: "contrast", label: "Contrast", type: "select", options: opts(CONTRASTS), default: "medium" },
              { id: "haze", label: "Atmosphere", type: "select", options: opts(HAZE), default: "none" }
            ],
            build: (v) => {
              const k = Number(v.kelvin);
              const warmth = k <= 3300 ? "warm" : k >= 6500 ? "cool" : "neutral";
              const dir = textOf(LIGHT_DIRECTIONS, v.direction);
              const haze = textOf(HAZE, v.haze);
              return {
                spec: { lighting: { setup: labelOf(LIGHT_SETUPS, v.setup), ...dir ? { direction: labelOf(LIGHT_DIRECTIONS, v.direction) } : {}, quality: labelOf(LIGHT_QUALITY, v.quality), color_temperature_k: k, contrast: labelOf(CONTRASTS, v.contrast), ...haze ? { atmosphere: haze } : {} } },
                say: [60, `Lit by ${textOf(LIGHT_SETUPS, v.setup)}${dir ? ` ${dir}` : ""} \u2013 ${textOf(LIGHT_QUALITY, v.quality)} light, ${warmth} ${k} K, ${textOf(CONTRASTS, v.contrast)}${haze ? `, ${haze}` : ""}`],
                meta: { light: v.setup }
              };
            },
            chips: (v) => [labelOf(LIGHT_SETUPS, v.setup), `${v.kelvin} K`]
          },
          scene: {
            title: "Time & place",
            category: "light",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Where and when: location, time of day, weather and season.",
            fields: [
              { id: "location", label: "Location", type: "text", default: "", placeholder: "e.g. a rainy Prague side street" },
              { id: "time", label: "Time of day", type: "select", options: opts(TIMES), default: "any" },
              { id: "weather", label: "Weather", type: "select", options: opts(WEATHER), default: "any" },
              { id: "season", label: "Season", type: "select", options: opts(SEASONS), default: "any" }
            ],
            build: (v) => {
              const parts = [clean(v.location), textOf(TIMES, v.time) && `at ${textOf(TIMES, v.time)}`, textOf(WEATHER, v.weather), textOf(SEASONS, v.season) && `in ${textOf(SEASONS, v.season)}`].filter(Boolean);
              const data2 = { ...clean(v.location) ? { location: clean(v.location) } : {}, ...v.time !== "any" ? { time_of_day: labelOf(TIMES, v.time) } : {}, ...v.weather !== "any" ? { weather: labelOf(WEATHER, v.weather) } : {}, ...v.season !== "any" ? { season: labelOf(SEASONS, v.season) } : {} };
              return { spec: Object.keys(data2).length ? { scene: data2 } : {}, say: parts.length ? [20, `Setting: ${parts.join(", ")}`] : null, meta: { time: v.time } };
            },
            chips: (v) => [clean(v.location).slice(0, 20), v.time !== "any" ? labelOf(TIMES, v.time) : null].filter(Boolean)
          },
          color: {
            title: "Color grade",
            category: "look",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Color grade, palette and saturation.",
            fields: [
              { id: "grade", label: "Grade", type: "select", options: opts(GRADES), default: "natural" },
              { id: "palette", label: "Palette (optional)", type: "text", default: "", placeholder: "e.g. navy, cream and rust" },
              { id: "saturation", label: "Saturation", type: "select", options: opts(SATURATION), default: "natural" }
            ],
            build: (v) => ({
              spec: { color: { grade: labelOf(GRADES, v.grade), ...clean(v.palette) ? { palette: clean(v.palette) } : {}, saturation: labelOf(SATURATION, v.saturation) } },
              say: [70, `Color: ${textOf(GRADES, v.grade)}${clean(v.palette) ? `, palette of ${clean(v.palette)}` : ""}${v.saturation !== "natural" ? `, ${textOf(SATURATION, v.saturation)} saturation` : ""}`]
            }),
            chips: (v) => [labelOf(GRADES, v.grade)]
          },
          style: {
            title: "Style & mood",
            category: "look",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "The medium, the era and the emotional tone.",
            fields: [
              { id: "medium", label: "Medium", type: "select", options: opts(MEDIUMS), default: "photo" },
              { id: "era", label: "Era", type: "select", options: opts(ERAS), default: "any" },
              { id: "mood", label: "Mood", type: "select", options: opts(MOODS), default: "any" }
            ],
            build: (v) => ({
              spec: { style: { medium: labelOf(MEDIUMS, v.medium), ...v.era !== "any" ? { era: labelOf(ERAS, v.era) } : {}, ...v.mood !== "any" ? { mood: labelOf(MOODS, v.mood) } : {} } },
              say: [10, `${article(textOf(MEDIUMS, v.medium))} ${textOf(MEDIUMS, v.medium)}${v.era !== "any" ? ` with a ${textOf(ERAS, v.era)} feel` : ""}${v.mood !== "any" ? `, ${textOf(MOODS, v.mood)} mood` : ""}`]
            }),
            chips: (v) => [labelOf(MEDIUMS, v.medium), v.mood !== "any" ? labelOf(MOODS, v.mood) : null].filter(Boolean)
          },
          subject: {
            title: "Subject details",
            category: "subject",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Who or what is in the frame, what they do and wear.",
            fields: [
              { id: "who", label: "Subject", type: "text", default: "", placeholder: "e.g. a woman in her 30s with short red hair" },
              { id: "action", label: "Pose / action", type: "text", default: "", placeholder: "e.g. leaning on a railing, looking away" },
              { id: "expression", label: "Expression", type: "select", options: opts(EXPRESSIONS), default: "any" },
              { id: "wardrobe", label: "Wardrobe", type: "text", default: "", placeholder: "e.g. oversized wool coat" }
            ],
            build: (v) => {
              const data2 = { ...clean(v.who) ? { who: clean(v.who) } : {}, ...clean(v.action) ? { pose_action: clean(v.action) } : {}, ...v.expression !== "any" ? { expression: labelOf(EXPRESSIONS, v.expression) } : {}, ...clean(v.wardrobe) ? { wardrobe: clean(v.wardrobe) } : {} };
              const parts = [clean(v.who), clean(v.action), v.expression !== "any" && `with ${textOf(EXPRESSIONS, v.expression)}`, clean(v.wardrobe) && `wearing ${clean(v.wardrobe)}`].filter(Boolean);
              return { spec: Object.keys(data2).length ? { subject: data2 } : {}, say: parts.length ? [15, parts.join(", ")] : null };
            },
            chips: (v) => [clean(v.who).slice(0, 24)].filter(Boolean)
          },
          camera_move: {
            title: "Camera movement",
            category: "motion",
            kinds: ["video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "How the camera moves during the clip.",
            fields: [
              { id: "move", label: "Movement", type: "select", options: opts(CAMERA_MOVES), default: "pushin" },
              { id: "speed", label: "Speed", type: "select", options: opts(SPEEDS), default: "slow" },
              { id: "stabilization", label: "Feel", type: "select", options: [{ value: "smooth", label: "Smooth" }, { value: "organic", label: "Organic" }, { value: "shaky", label: "Shaky" }], default: "smooth" }
            ],
            build: (v) => ({
              spec: { motion: { camera_movement: labelOf(CAMERA_MOVES, v.move), speed: labelOf(SPEEDS, v.speed), feel: v.stabilization } },
              say: [80, `Camera: ${textOf(CAMERA_MOVES, v.move)}, ${textOf(SPEEDS, v.speed)} and ${v.stabilization}`]
            }),
            chips: (v) => [labelOf(CAMERA_MOVES, v.move)]
          },
          action: {
            title: "Action & timing",
            category: "motion",
            kinds: ["video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "What happens, beat by beat. One line per beat, optionally with times like \u201C0\u20133s: \u2026\u201D.",
            fields: [
              { id: "beats", label: "Beats", type: "textarea", rows: 4, default: "", placeholder: "0\u20133s: she turns toward the window\n3\u20136s: rain starts, she smiles" },
              { id: "pacing", label: "Pacing", type: "select", options: opts(PACING), default: "realtime" }
            ],
            build: (v) => {
              const beats = clean(v.beats).split(/\r?\n/).map(clean).filter(Boolean);
              const pacing = textOf(PACING, v.pacing);
              return {
                spec: { motion: { ...beats.length ? { beats } : {}, ...pacing ? { pacing: labelOf(PACING, v.pacing) } : {} } },
                say: beats.length || pacing ? [85, `${beats.length ? `Action: ${beats.join("; ")}` : ""}${beats.length && pacing ? ". " : ""}${pacing ? `Played in ${pacing}` : ""}`] : null
              };
            },
            chips: (v) => [clean(v.beats).split(/\r?\n/).filter(Boolean).length ? `${clean(v.beats).split(/\r?\n/).filter(Boolean).length} beats` : null, v.pacing !== "realtime" ? labelOf(PACING, v.pacing) : null].filter(Boolean)
          },
          audio: {
            title: "Sound",
            category: "audio",
            kinds: ["video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Dialogue, ambience, effects and music. The video model creates the sound from this.",
            fields: [
              { id: "dialogue", label: "Dialogue", type: "textarea", rows: 2, default: "", placeholder: 'Speaker: "Line of dialogue"' },
              { id: "ambience", label: "Ambience", type: "text", default: "", placeholder: "e.g. distant traffic, light rain" },
              { id: "sfx", label: "Sound effects", type: "text", default: "", placeholder: "e.g. footsteps on gravel" },
              { id: "music", label: "Music", type: "select", options: opts(MUSIC), default: "none" }
            ],
            build: (v) => {
              const data2 = { ...clean(v.dialogue) ? { dialogue: clean(v.dialogue) } : { dialogue: "none" }, ...clean(v.ambience) ? { ambience: clean(v.ambience) } : {}, ...clean(v.sfx) ? { sound_effects: clean(v.sfx) } : {}, music: labelOf(MUSIC, v.music) };
              const parts = [clean(v.dialogue) ? `dialogue: ${clean(v.dialogue)}` : "no dialogue", clean(v.ambience) && `ambience of ${clean(v.ambience)}`, clean(v.sfx) && `sound effects: ${clean(v.sfx)}`, textOf(MUSIC, v.music) ? `music: ${textOf(MUSIC, v.music)}` : "no music"].filter(Boolean);
              return { spec: { audio: data2 }, say: [90, `Sound \u2013 ${parts.join("; ")}`] };
            },
            chips: (v) => [clean(v.dialogue) ? "Dialogue" : null, v.music !== "none" ? labelOf(MUSIC, v.music) : null].filter(Boolean)
          },
          avoid: {
            title: "Avoid",
            category: "utility",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Things that must not appear (models without a negative prompt read it as an instruction).",
            fields: [{ id: "text", label: "Avoid", type: "text", default: "text, watermarks, logos", placeholder: "comma-separated" }],
            build: (v) => {
              const items = clean(v.text).split(",").map(clean).filter(Boolean);
              return items.length ? { spec: { avoid: items }, say: [98, `Avoid ${list2(items)}`] } : {};
            },
            chips: (v) => [clean(v.text) ? "Avoid list" : null].filter(Boolean)
          },
          instruction: {
            title: "Extra instruction",
            category: "utility",
            kinds: ["image", "video"],
            inputs: SPEC_IN,
            outputs: SPEC_OUT,
            help: "Any extra instruction that should be part of the prompt.",
            fields: [{ id: "text", label: "Instruction", type: "textarea", rows: 3, default: "", placeholder: "e.g. keep the logo exactly as in the reference" }],
            build: (v) => clean(v.text) ? { spec: { notes: [clean(v.text)] }, say: [95, clean(v.text)] } : {},
            chips: (v) => [clean(v.text).slice(0, 24)].filter(Boolean)
          },
          note: {
            title: "Note",
            category: "utility",
            kinds: ["image", "video"],
            inputs: [],
            outputs: [],
            help: "A comment on the canvas \u2013 it is not sent anywhere.",
            fields: [{ id: "text", label: "Note", type: "textarea", rows: 3, default: "" }],
            chips: () => []
          },
          generate_image: {
            title: "Generate image",
            category: "output",
            kinds: ["image"],
            output: "image",
            inputs: [{ id: "spec", type: "spec", multi: true, label: "shot" }, { id: "refs", type: "image", multi: true, label: "references" }],
            outputs: [{ id: "image", type: "image", label: "image" }],
            help: "Generates images from everything connected to it. The images also land in your gallery.",
            fields: [
              { id: "model", label: "Model", type: "model", default: "gemini-nano-banana-2.1", options: opts(MODEL_FALLBACK) },
              { id: "ratio", label: "Aspect ratio", type: "select", options: opts(IMAGE_RATIOS), default: "1:1" },
              { id: "size", label: "Resolution", type: "select", options: opts(IMAGE_SIZES), default: "1K" },
              { id: "count", label: "Images", type: "select", options: ["1", "2", "3", "4"].map((n) => ({ value: n, label: n })), default: "1" }
            ],
            chips: (v) => [v.ratio, `${v.count}\xD7`]
          },
          generate_video: {
            title: "Generate video",
            category: "output",
            kinds: ["video"],
            output: "video",
            inputs: [
              { id: "spec", type: "spec", multi: true, label: "shot" },
              { id: "first", type: "image", label: "first frame" },
              { id: "last", type: "image", label: "last frame" },
              { id: "refs", type: "image", multi: true, label: "references" }
            ],
            outputs: [{ id: "video", type: "video", label: "video" }],
            help: "Generates a video clip with Gemini Omni Flash, or for free with an open model on Hugging Face (Wan 2.2, LTX-2.3, LTX-Video). First and last frames anchor the start and end.",
            fields: [
              { id: "model", label: "Model", type: "select", options: opts(VIDEO_MODELS), default: "gemini-omni-1.1-flash" },
              { id: "ratio", label: "Aspect ratio", type: "select", options: opts(VIDEO_RATIOS), default: "16:9" },
              { id: "resolution", label: "Resolution", type: "select", options: opts(VIDEO_RESOLUTIONS), default: "720p" },
              { id: "duration", label: "Length", type: "select", options: ["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => ({ value: n, label: `${n} s` })), default: "6" },
              { id: "sound", label: "Sound", type: "toggle", default: true }
            ],
            chips: (v) => {
              const free = VIDEO_MODELS.find((m) => m.id === v.model && m.free);
              return [free && free.label.replace(/ \(.*$/, ""), v.ratio, !free && v.resolution, `${v.duration} s`].filter(Boolean);
            }
          }
        };
        const isOutput = (type) => Boolean(NODE_TYPES[type]?.output);
        function derive(meta2, spec, kind) {
          const out = {};
          const warnings = [];
          const crop = meta2.crop || 1;
          const dofFactor = meta2.dof || 1;
          if (meta2.focal) {
            const eq = meta2.focal * crop;
            const fov = Math.round(2 * Math.atan(36 / (2 * eq)) * 180 / Math.PI);
            out.field_of_view = `${fov}\xB0 horizontal (${Math.round(eq)} mm full-frame equivalent)`;
            out.perspective = eq < 20 ? "ultra-wide with strong perspective distortion and exaggerated depth" : eq < 30 ? "wide-angle with expansive perspective" : eq < 45 ? "slightly wide, natural documentary perspective" : eq < 65 ? "normal perspective close to human vision" : eq < 115 ? "short-telephoto compression with a flattering, calm perspective" : eq < 220 ? "telephoto compression that pulls the background closer" : "super-telephoto compression with an isolated subject";
            if (meta2.lensType === "fisheye") out.perspective = "fisheye distortion with a curved horizon";
          }
          if (meta2.aperture && !meta2.dofOverride) {
            const eqN = meta2.aperture * crop * dofFactor;
            const eqF = (meta2.focal || 50) * crop;
            const score = meta2.lensType === "pinhole" ? 999 : eqN * (50 / eqF) ** 2 * (meta2.lensType === "macro" ? 0.15 : 1);
            out.depth_of_field = score < 0.8 ? "razor-thin depth of field, background melts into creamy bokeh" : score < 2 ? "very shallow depth of field with a strongly blurred background" : score < 5 ? "shallow depth of field with a softly blurred background" : score < 12 ? "moderate depth of field, background recognizable but soft" : score < 30 ? "deep depth of field, most of the scene sharp" : "everything sharp from foreground to background";
          }
          if (meta2.shutter) {
            const t = meta2.shutter;
            out.motion = kind === "video" ? t <= 1 / 500 ? "very crisp, staccato motion with little motion blur per frame" : t <= 1 / 40 ? "natural cinematic motion blur (about a 180\xB0 shutter)" : "smeared, dreamy motion blur" : t <= 1 / 2e3 ? "freezes even very fast motion such as splashes and sports" : t <= 1 / 500 ? "crisp, frozen motion" : t <= 1 / 125 ? "natural rendering, slight blur only on fast movement" : t <= 1 / 30 ? "visible motion blur on moving subjects" : t <= 1 / 4 ? "strong motion blur and streaking movement" : "long exposure: silky water, light trails and ghosted moving people, camera on a tripod";
          }
          if (meta2.iso) {
            const iso = meta2.iso;
            const grainSet = meta2.grain && meta2.grain !== "auto";
            if (!grainSet) {
              out.noise = iso <= 200 ? "clean, noise-free image" : iso <= 800 ? "very slight noise" : iso <= 3200 ? "visible fine grain" : iso <= 12800 ? "pronounced grain typical of low light" : "heavy, gritty grain";
            }
          }
          if (meta2.aperture && meta2.shutter && meta2.iso) {
            const ev = Math.log2(meta2.aperture * meta2.aperture / meta2.shutter) - Math.log2(meta2.iso / 100) + (meta2.ev || 0);
            const light = ev >= 15 ? "bright direct sunlight" : ev >= 13 ? "daylight or light overcast" : ev >= 11 ? "open shade or heavy overcast" : ev >= 8 ? "a bright interior or dusk" : ev >= 5 ? "a dim interior or evening" : ev >= 2 ? "night streets or candlelight" : "a very dark night or moonlight";
            out.scene_brightness = `EV ${Math.round(ev)} \u2013 matches ${light}`;
            const time = meta2.time;
            const lightSetup = meta2.light;
            const dark = time === "night" || ["moon", "candle"].includes(lightSetup);
            const bright = time === "noon" || lightSetup === "midday";
            if (dark && ev > 11) warnings.push(`The exposure (EV ${Math.round(ev)}) is far too dark for a night or candlelit scene \u2013 open the aperture, slow the shutter or raise the ISO.`);
            if (bright && ev < 9) warnings.push(`The exposure (EV ${Math.round(ev)}) would blow out a sunny midday scene \u2013 stop down, use a faster shutter or a lower ISO.`);
          }
          if (meta2.shutter && meta2.shutter >= 1 / 8 && kind !== "video") warnings.push("Shutter speeds of 1/8 s and slower blur anything that moves \u2013 fine for long exposures, not for sharp portraits.");
          return { rendering: out, warnings };
        }
        const uid = () => Math.random().toString(36).slice(2, 10);
        function defaults(type) {
          const t = NODE_TYPES[type];
          const values = {};
          for (const f of t?.fields || []) values[f.id] = f.default;
          return values;
        }
        function newNode(type, x = 0, y = 0, values = {}) {
          return { id: `n${uid()}`, type, x: Math.round(x), y: Math.round(y), values: { ...defaults(type), ...values } };
        }
        function newGraph(kind = "image", name = "Untitled") {
          return { id: `g${uid()}`, name, kind, nodes: [], edges: [], formats: { prose: true, xml: true, json: true, markdown: true }, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        }
        function portOf(type, side, id) {
          const t = NODE_TYPES[type];
          return (side === "in" ? t?.inputs : t?.outputs)?.find((p) => p.id === id) || null;
        }
        function canConnect(graph, from, to) {
          if (from.node === to.node) return false;
          const a = graph.nodes.find((n) => n.id === from.node), b = graph.nodes.find((n) => n.id === to.node);
          const pa = a && portOf(a.type, "out", from.port), pb = b && portOf(b.type, "in", to.port);
          if (!pa || !pb || pa.type !== pb.type) return false;
          const feeds = (src, dst, seen = /* @__PURE__ */ new Set()) => {
            if (src === dst) return true;
            if (seen.has(src)) return false;
            seen.add(src);
            return graph.edges.filter((e) => e.from.node === src).some((e) => feeds(e.to.node, dst, seen));
          };
          return !feeds(to.node, from.node);
        }
        function connect(graph, from, to) {
          if (!canConnect(graph, from, to)) return null;
          const b = graph.nodes.find((n) => n.id === to.node);
          const pb = portOf(b.type, "in", to.port);
          if (!pb.multi) graph.edges = graph.edges.filter((e) => !(e.to.node === to.node && e.to.port === to.port));
          if (graph.edges.some((e) => e.from.node === from.node && e.from.port === from.port && e.to.node === to.node && e.to.port === to.port)) return null;
          const edge = { id: `e${uid()}`, from: { ...from }, to: { ...to } };
          graph.edges.push(edge);
          return edge;
        }
        function sanitizeGraph(input) {
          const g = input && typeof input === "object" ? input : {};
          const nodes = (Array.isArray(g.nodes) ? g.nodes : []).slice(0, 200).filter((n) => n && NODE_TYPES[n.type]).map((n) => {
            const t = NODE_TYPES[n.type];
            const values = defaults(n.type);
            for (const f of t.fields) {
              const v = n.values?.[f.id];
              if (v === void 0) continue;
              if (f.type === "toggle") values[f.id] = Boolean(v);
              else if (f.type === "image") values[f.id] = v && typeof v === "object" ? { path: String(v.path || "").slice(0, 200), itemId: v.itemId ? String(v.itemId).slice(0, 60) : void 0, url: v.url ? String(v.url).slice(0, 300) : void 0 } : null;
              else if (f.type === "select" && f.id !== "model") values[f.id] = f.options.some((op) => op.value === String(v)) ? String(v) : f.default;
              else values[f.id] = String(v).slice(0, 4e3);
            }
            return { id: String(n.id || `n${uid()}`).slice(0, 40), type: n.type, x: Math.round(Number(n.x) || 0), y: Math.round(Number(n.y) || 0), values };
          });
          const ids = new Set(nodes.map((n) => n.id));
          const graph = {
            id: String(g.id || `g${uid()}`).replace(/[^\w-]/g, "").slice(0, 40) || `g${uid()}`,
            name: String(g.name || "Untitled").slice(0, 80),
            kind: g.kind === "video" ? "video" : "image",
            nodes,
            edges: [],
            formats: { prose: g.formats?.prose !== false, xml: g.formats?.xml !== false, json: g.formats?.json !== false, markdown: g.formats?.markdown !== false },
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          for (const e of (Array.isArray(g.edges) ? g.edges : []).slice(0, 600)) {
            if (!e?.from || !e?.to || !ids.has(e.from.node) || !ids.has(e.to.node)) continue;
            connect(graph, { node: String(e.from.node), port: String(e.from.port) }, { node: String(e.to.node), port: String(e.to.port) });
          }
          return graph;
        }
        const isPlain = (v) => v && typeof v === "object" && !Array.isArray(v);
        function merge(a, b) {
          for (const [k, v] of Object.entries(b)) {
            if (isPlain(v) && isPlain(a[k])) merge(a[k], v);
            else if (Array.isArray(v) && Array.isArray(a[k])) a[k] = [...a[k], ...v];
            else a[k] = isPlain(v) ? merge({}, v) : v;
          }
          return a;
        }
        const SECTION_ORDER = ["subject", "scene", "style", "camera", "lens", "exposure", "focus", "film", "composition", "lighting", "color", "motion", "audio", "rendering", "output", "avoid", "notes"];
        const byPosition = (a, b) => a.y - b.y || a.x - b.x;
        function outputNodes(graph) {
          return graph.nodes.filter((n) => isOutput(n.type)).sort(byPosition);
        }
        function upstream(graph, target) {
          const byId = new Map(graph.nodes.map((n) => [n.id, n]));
          const order = [];
          const seen = /* @__PURE__ */ new Set();
          const visit = (id) => {
            if (seen.has(id)) return;
            seen.add(id);
            const parents = graph.edges.filter((e) => e.to.node === id && portOf(byId.get(id)?.type, "in", e.to.port)?.type === "spec").map((e) => byId.get(e.from.node)).filter(Boolean).sort(byPosition);
            for (const p of parents) visit(p.id);
            order.push(id);
          };
          if (target) visit(target.id);
          else graph.nodes.filter((n) => NODE_TYPES[n.type]?.build).sort(byPosition).forEach((n) => visit(n.id));
          return order.map((id) => byId.get(id)).filter((n) => n && n !== target && NODE_TYPES[n.type]?.build);
        }
        function imageInputs(graph, target) {
          const byId = new Map(graph.nodes.map((n) => [n.id, n]));
          const res = {};
          if (!target) return res;
          for (const e of graph.edges.filter((x) => x.to.node === target.id)) {
            const port = portOf(target.type, "in", e.to.port);
            if (!port || port.type !== "image") continue;
            const src = byId.get(e.from.node);
            if (!src) continue;
            const entry = src.type === "reference" ? { node: src.id, kind: "reference", image: src.values.image || null, role: src.values.role || "auto" } : { node: src.id, kind: "generated", from: src.type };
            if (port.multi) (res[e.to.port] ||= []).push(entry);
            else res[e.to.port] = entry;
          }
          return res;
        }
        function compile(graph, options = {}) {
          const g = graph || newGraph();
          const outputs = outputNodes(g);
          const ownKind = outputs.find((n) => NODE_TYPES[n.type].output === (g.kind || "image"));
          const target = options.target === null ? null : (options.target ? g.nodes.find((n) => n.id === options.target) : ownKind || outputs[0]) || null;
          const kind = options.only || (target ? NODE_TYPES[target.type].output === "video" ? "video" : "image" : g.kind || "image");
          const skip = new Set(options.skip || []);
          const nodes = upstream(g, target).filter((n) => !skip.has(n.type) && (!options.only || NODE_TYPES[n.type].kinds.includes(options.only)));
          const spec = {};
          const prose = {};
          const meta2 = {};
          const says = [];
          const bases = [];
          const chips = [];
          for (const n of nodes) {
            const t = NODE_TYPES[n.type];
            const r = t.build(n.values || {}) || {};
            if (r.base) bases.push(r.base);
            if (r.spec) merge(spec, r.spec);
            if (r.prose) Object.assign(prose, r.prose);
            if (r.meta) Object.assign(meta2, r.meta);
            if (r.say && r.say[1]) says.push(r.say);
            chips.push(...t.chips?.(n.values || {}) || []);
          }
          const { rendering, warnings } = derive(meta2, spec, kind);
          if (Object.keys(rendering).length) spec.rendering = rendering;
          if (target) {
            const v = target.values || {};
            spec.output = kind === "video" ? { type: "video clip", aspect_ratio: v.ratio, resolution: v.resolution, duration_seconds: Number(v.duration) || void 0, sound: v.sound !== false } : { type: "image", aspect_ratio: v.ratio };
          }
          const exp = spec.exposure;
          if (prose.camera || prose.lens || exp) {
            let t = kind === "video" ? "Filmed" : "Shot";
            if (prose.camera) t += ` on ${prose.camera}`;
            if (prose.lens) t += ` with ${prose.lens}`;
            const e = exp ? [exp.aperture, exp.shutter_speed, `ISO ${exp.iso}`].filter(Boolean) : [];
            if (e.length) t += ` at ${list2(e)}`;
            if (exp?.exposure_compensation) t += ` (${exp.exposure_compensation})`;
            says.push([30, t]);
            if (prose.lensLook) says.push([31, `The lens gives ${prose.lensLook}`]);
          }
          if (spec.rendering) {
            const r = spec.rendering;
            const parts2 = [r.depth_of_field, r.perspective, r.motion, r.noise].filter(Boolean);
            if (parts2.length) says.push([35, `Optical result: ${parts2.join("; ")}`]);
            if (r.scene_brightness) {
              const [, ev, light] = r.scene_brightness.match(/^EV (-?\d+) – matches (.*)$/) || [];
              if (light) says.push([36, `Light level consistent with ${light} (EV ${ev})`]);
            }
          }
          if (kind === "video" && target) {
            const v = target.values || {};
            says.push([92, `${v.duration ? `About ${v.duration} seconds long` : "A short clip"}${v.sound === false ? ", silent \u2013 no audio" : ""}`]);
          }
          says.sort((a, b) => a[0] - b[0]);
          const sentences = says.map((s) => sentence(s[1])).filter(Boolean);
          const ordered = {};
          for (const k of SECTION_ORDER) if (spec[k] !== void 0) ordered[k] = spec[k];
          const root = kind === "video" ? "video_specification" : "shot_specification";
          const xml = Object.keys(ordered).length ? toXml(root, ordered) : "";
          const json = Object.keys(ordered).length ? JSON.stringify(ordered, null, 2) : "";
          const markdown = Object.keys(ordered).length ? toMarkdown(kind === "video" ? "Video specification" : "Shot specification", ordered) : "";
          const base = [clean(options.prompt), ...bases].filter(Boolean).join("\n\n");
          const formats = { ...{ prose: true, xml: true, json: true, markdown: true }, ...g.formats || {}, ...options.formats || {} };
          const parts = { base, prose: sentences.join(" "), xml, json, markdown };
          const used = new Set(outputs.flatMap((out) => upstream(g, out)).map((n) => n.id));
          const unconnected = target ? g.nodes.filter((n) => NODE_TYPES[n.type]?.build && !used.has(n.id)).length : 0;
          if (unconnected) warnings.push(`${unconnected} ${unconnected === 1 ? "node isn\u2019t" : "nodes aren\u2019t"} connected to \u201C${NODE_TYPES[target.type].title}\u201D and ${unconnected === 1 ? "is" : "are"} left out.`);
          return {
            kind,
            target: target ? target.id : null,
            prompt: assemble(parts, formats, kind),
            addition: assemble({ ...parts, base: "" }, formats, kind),
            parts,
            spec: ordered,
            settings: target ? { ...target.values } : null,
            inputs: imageInputs(g, target),
            chips: [...new Set(chips.filter(Boolean))],
            warnings,
            nodes: nodes.map((n) => n.id)
          };
        }
        function assemble(parts, formats, kind) {
          const blocks = [];
          if (parts.base) blocks.push(parts.base);
          if (formats.prose && parts.prose) blocks.push(parts.prose);
          const structured = [];
          if (formats.xml && parts.xml) structured.push(parts.xml);
          if (formats.json && parts.json) structured.push("```json\n" + parts.json + "\n```");
          if (formats.markdown && parts.markdown) structured.push(parts.markdown);
          if (structured.length) {
            blocks.push(`${kind === "video" ? "Video" : "Shot"} specification \u2013 follow every value exactly. The same values are given as ${list2([formats.xml && parts.xml && "XML", formats.json && parts.json && "JSON", formats.markdown && parts.markdown && "Markdown"].filter(Boolean))}:`);
            blocks.push(...structured);
          }
          return blocks.join("\n\n");
        }
        const xmlEscape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const tag = (k) => String(k).replace(/[^a-zA-Z0-9_]/g, "_").replace(/^(\d)/, "_$1");
        function toXml(rootName, obj, depth = 0) {
          const pad = "  ".repeat(depth);
          const body = Object.entries(obj).map(([k, v]) => {
            const t = tag(k);
            if (Array.isArray(v)) {
              const item = t.endsWith("s") ? t.slice(0, -1) : "item";
              return `${pad}  <${t}>
${v.map((x) => `${pad}    <${item}>${xmlEscape(x)}</${item}>`).join("\n")}
${pad}  </${t}>`;
            }
            if (isPlain(v)) return toXml(t, v, depth + 1);
            return `${pad}  <${t}>${xmlEscape(v)}</${t}>`;
          }).join("\n");
          return `${pad}<${rootName}>
${body}
${pad}</${rootName}>`;
        }
        const human = (k) => (k === "iso" ? "ISO" : k).replace(/_/g, " ").replace(/\bmm\b/, "(mm)").replace(/\bk\b/, "(K)").replace(/^./, (c) => c.toUpperCase());
        function toMarkdown(title, obj) {
          const lines = [`## ${title}`];
          for (const [section, v] of Object.entries(obj)) {
            lines.push("", `### ${human(section)}`);
            if (Array.isArray(v)) lines.push(...v.map((x) => `- ${x}`));
            else if (isPlain(v)) {
              for (const [k, x] of Object.entries(v)) lines.push(`- **${human(k)}:** ${Array.isArray(x) ? x.join("; ") : x}`);
            } else lines.push(String(v));
          }
          return lines.join("\n");
        }
        function template(name, kind, rows, edges) {
          const g = newGraph(kind, name);
          const ids = {};
          rows.forEach(([key, type, x, y, values]) => {
            const n = newNode(type, x, y, values);
            ids[key] = n.id;
            g.nodes.push(n);
          });
          for (const [a, b, port = "in", fromPort] of edges) {
            const from = g.nodes.find((n) => n.id === ids[a]);
            connect(g, { node: ids[a], port: fromPort || NODE_TYPES[from.type].outputs[0].id }, { node: ids[b], port });
          }
          return g;
        }
        const chain = (keys, last, lastPort = "spec") => keys.slice(0, -1).map((k, i) => [k, keys[i + 1]]).concat([[keys[keys.length - 1], last, lastPort]]);
        const TEMPLATES = [
          {
            id: "portrait85",
            name: "Portrait \xB7 85 mm",
            kind: "image",
            build: () => template("Portrait \xB7 85 mm", "image", [
              ["p", "prompt", 0, 0, { text: "Portrait of an old fisherman on a pier at dawn" }],
              ["c", "camera", 0, 230, { body: "ff" }],
              ["l", "lens", 300, 0, { focal: "85", type: "prime" }],
              ["e", "exposure", 300, 230, { iso: "100", aperture: "1.8", shutter: "1/500" }],
              ["s", "shot", 600, 0, { size: "mcu", angle: "eye", composition: "thirds" }],
              ["li", "lighting", 600, 230, { setup: "golden", direction: "side45", quality: "soft", kelvin: "3200", contrast: "low", haze: "light" }],
              ["g", "generate_image", 920, 80, { ratio: "4:5" }]
            ], chain(["p", "c", "l", "e", "s", "li"], "g"))
          },
          {
            id: "street35",
            name: "Night street \xB7 35 mm film",
            kind: "image",
            build: () => template("Night street \xB7 35 mm film", "image", [
              ["p", "prompt", 0, 0, { text: "A rainy side street at night, a cyclist passing a glowing noodle bar" }],
              ["c", "camera", 0, 230, { body: "film35" }],
              ["l", "lens", 300, 0, { focal: "35", type: "prime" }],
              ["e", "exposure", 300, 230, { iso: "800", aperture: "1.4", shutter: "1/60" }],
              ["f", "film", 600, 0, { stock: "cinestill800t", grain: "auto", halation: true }],
              ["sc", "scene", 600, 230, { location: "old town side street", time: "night", weather: "rain", season: "any" }],
              ["g", "generate_image", 920, 80, { ratio: "3:2" }]
            ], chain(["p", "c", "l", "e", "f", "sc"], "g"))
          },
          {
            id: "product100",
            name: "Product \xB7 macro 100 mm",
            kind: "image",
            build: () => template("Product \xB7 macro 100 mm", "image", [
              ["p", "prompt", 0, 0, { text: "A luxury perfume bottle on wet black stone with water droplets" }],
              ["l", "lens", 300, 0, { focal: "100", type: "macro" }],
              ["e", "exposure", 300, 230, { iso: "100", aperture: "8", shutter: "1/160" }],
              ["s", "shot", 600, 0, { size: "cu", angle: "eye", composition: "center" }],
              ["li", "lighting", 600, 230, { setup: "softbox", direction: "side", quality: "soft", kelvin: "5600", contrast: "high", haze: "none" }],
              ["a", "avoid", 0, 230, { text: "text, watermarks, fingerprints, dust" }],
              ["g", "generate_image", 920, 80, { ratio: "4:5" }]
            ], chain(["p", "a", "l", "e", "s", "li"], "g"))
          },
          {
            id: "landscape16",
            name: "Landscape \xB7 16 mm",
            kind: "image",
            build: () => template("Landscape \xB7 16 mm", "image", [
              ["p", "prompt", 0, 0, { text: "Mountain lake with a lone wooden boat, peaks reflected in still water" }],
              ["l", "lens", 300, 0, { focal: "16", type: "zoom" }],
              ["e", "exposure", 300, 230, { iso: "100", aperture: "11", shutter: "1/125" }],
              ["sc", "scene", 600, 0, { location: "alpine lake", time: "golden", weather: "clear", season: "autumn" }],
              ["co", "color", 600, 230, { grade: "warm", saturation: "vivid" }],
              ["g", "generate_image", 920, 80, { ratio: "16:9" }]
            ], chain(["p", "l", "e", "sc", "co"], "g"))
          },
          {
            id: "cine_anamorphic",
            name: "Cinematic shot \xB7 anamorphic",
            kind: "video",
            build: () => template("Cinematic shot \xB7 anamorphic", "video", [
              ["p", "prompt", 0, 0, { text: "A woman in a red coat walks through a foggy train station" }],
              ["c", "camera", 0, 230, { body: "cinema" }],
              ["l", "lens", 300, 0, { focal: "40", type: "anamorphic" }],
              ["e", "exposure", 300, 230, { iso: "800", aperture: "2.8", shutter: "1/50" }],
              ["m", "camera_move", 600, 0, { move: "track", speed: "slow", stabilization: "smooth" }],
              ["co", "color", 600, 230, { grade: "tealorange", saturation: "natural" }],
              ["au", "audio", 900, 0, { ambience: "echoing station hall, distant announcements", sfx: "heels on stone", music: "score" }],
              ["g", "generate_video", 1220, 80, { ratio: "16:9", resolution: "720p", duration: "6" }]
            ], chain(["p", "c", "l", "e", "m", "co", "au"], "g"))
          },
          {
            id: "image_to_video",
            name: "Image \u2192 video",
            kind: "video",
            build: () => template("Image \u2192 video", "video", [
              ["p", "prompt", 0, 0, { text: "A paper boat drifting on a rain puddle, city lights reflected" }],
              ["l", "lens", 300, 0, { focal: "50", type: "macro" }],
              ["gi", "generate_image", 600, 0, { ratio: "16:9", count: "1" }],
              ["m", "camera_move", 300, 260, { move: "pushin", speed: "veryslow", stabilization: "smooth" }],
              ["au", "audio", 600, 300, { ambience: "soft rain, distant traffic", music: "none" }],
              ["gv", "generate_video", 920, 160, { ratio: "16:9", resolution: "720p", duration: "6" }]
            ], [["p", "l"], ["l", "gi", "spec"], ["p", "m"], ["m", "au"], ["au", "gv", "spec"], ["gi", "gv", "first", "image"]])
          }
        ];
        return {
          VERSION: 1,
          NODE_TYPES,
          CATEGORIES,
          TEMPLATES,
          VIDEO_MODELS,
          newGraph,
          newNode,
          defaults,
          portOf,
          canConnect,
          connect,
          sanitizeGraph,
          compile,
          outputNodes,
          upstream,
          toXml,
          toMarkdown
        };
      });
    }
  });

  // scripts/free-models.js
  var require_free_models = __commonJS({
    "scripts/free-models.js"(exports, module) {
      "use strict";
      init_define_process_env();
      init_globals();
      var fs = (init_fs(), __toCommonJS(fs_exports));
      var path = require_path_browserify();
      var os = (init_os(), __toCommonJS(os_exports));
      var VERSION = 2;
      var HF_API = (define_process_env_default.HF_API_BASE || "https://huggingface.co").replace(/\/+$/, "");
      var HF_SPACES_BASE = (define_process_env_default.HF_SPACES_BASE || "").replace(/\/+$/, "");
      var POLLINATIONS = (define_process_env_default.POLLINATIONS_BASE || "https://gen.pollinations.ai").replace(/\/+$/, "");
      var CLOUDFLARE = (define_process_env_default.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
      var KINDS = ["image", "video", "code"];
      var PER_KIND = 40;
      var OPEN_LICENSES = /* @__PURE__ */ new Set([
        "apache-2.0",
        "mit",
        "bsd",
        "bsd-2-clause",
        "bsd-3-clause",
        "bsd-3-clause-clear",
        "isc",
        "unlicense",
        "cc0-1.0",
        "wtfpl",
        "gpl",
        "gpl-2.0",
        "gpl-3.0",
        "lgpl",
        "lgpl-2.1",
        "lgpl-3.0",
        "lgpl-lr",
        "agpl-3.0",
        "mpl-2.0",
        "epl-2.0",
        "artistic-2.0",
        "afl-3.0",
        "ecl-2.0",
        "osl-3.0",
        "bsl-1.0",
        "zlib",
        "pddl",
        "odc-by",
        "openrail",
        "openrail++",
        "creativeml-openrail-m",
        "bigscience-openrail-m",
        "bigcode-openrail-m",
        "bigscience-bloom-rail-1.0",
        "cc-by-4.0",
        "cc-by-sa-4.0",
        "cc-by-3.0",
        "cc-by-sa-3.0",
        "cc-by-2.0"
      ]);
      var OPEN_OTHER = /^(modified-)?(mit|apache)/i;
      var NSFW = /nsfw|nud(e|ity)|naked|porn|hentai|lewd|uncensor|erotic|\beros\b|10eros|sexy|\bxxx\b|18\+|\br-?18\b|onlyfans|fetish|undress|deepnude|waifu/i;
      var NOT_A_GENERATOR = /lora|lycoris|controlnet|ip-?adapter|\bvae\b|-vae|gguf|\bgptq\b|\bawq\b|embedding|textual-inversion|upscal|inpaint|outpaint|segment|caption|tagger|detector|depth|pose|leaderboard|arena|benchmark|compar|search|prompt-?gen|prompt-?enhanc|dataset|trainer|training|fine-?tun|merge|quantiz|convert|-to-lora|interrogat|clip-|face-?swap|try-?on|remove-?bg|background-?remov|rembg|vram|calculator|gallery-only|viewer/i;
      var CLOSED = /\bsora\b|\bveo\b|kling|runway|dall-?e|midjourney|ideogram|seedance|seedream|hailuo|\bpika\b|gpt-?image|nano-?banana|imagen|grok|firefly/i;
      var TRUSTED = /* @__PURE__ */ new Set(["multimodalart", "huggingface-projects", "hysts", "zerogpu-aoti", "akhaliq", "linoyts", "Gradio-Community", "gradio", "huggingface", "evalstate"]);
      var FAMILIES = [
        // images
        { kind: "image", re: /hunyuanimage-?3/i, tier: 92, label: "HunyuanImage 3", nodes: true },
        { kind: "image", re: /qwen-?image(?!-edit)/i, tier: 90, label: "Qwen-Image" },
        { kind: "image", re: /flux\.?2-?dev/i, tier: 88, label: "FLUX.2 dev" },
        { kind: "image", re: /z-?image/i, tier: 86, label: "Z-Image" },
        { kind: "image", re: /hidream/i, tier: 82, label: "HiDream" },
        { kind: "image", re: /flux\.?2-?klein/i, tier: 80, label: "FLUX.2 klein" },
        { kind: "image", re: /bagel/i, tier: 72, label: "BAGEL", nodes: true },
        { kind: "image", re: /flux\.?1-?(dev|krea)/i, tier: 78, label: "FLUX.1" },
        { kind: "image", re: /flux\.?1-?schnell/i, tier: 72, label: "FLUX.1 schnell" },
        { kind: "image", re: /stable-diffusion-3\.5|sd-?3\.5/i, tier: 70, label: "Stable Diffusion 3.5" },
        { kind: "image", re: /cogview-?4/i, tier: 70, label: "CogView4" },
        { kind: "image", re: /lumina/i, tier: 68, label: "Lumina" },
        { kind: "image", re: /sana/i, tier: 64, label: "SANA" },
        { kind: "image", re: /kolors/i, tier: 62, label: "Kolors" },
        { kind: "image", re: /omnigen/i, tier: 62, label: "OmniGen" },
        { kind: "image", re: /playground-?v2/i, tier: 60, label: "Playground v2.5" },
        { kind: "image", re: /janus/i, tier: 52, label: "Janus" },
        { kind: "image", re: /pixart/i, tier: 55, label: "PixArt" },
        { kind: "image", re: /sdxl|stable-diffusion-xl/i, tier: 54, label: "SDXL" },
        { kind: "image", re: /dreamshaper/i, tier: 45, label: "DreamShaper" },
        { kind: "image", re: /stable-diffusion-(v-?)?[12]|sd-?(1\.5|2\.1)/i, tier: 35, label: "Stable Diffusion 1/2" },
        // videos
        { kind: "video", re: /wan-?2\.?[2-9].*(a14b|14b)|wan2-2-fp8|wan-?2-?2-?14b/i, tier: 90, label: "Wan 2.2 14B" },
        { kind: "video", re: /hunyuanvideo-?1\.5/i, tier: 86, label: "HunyuanVideo 1.5" },
        { kind: "video", re: /ltx-?2/i, tier: 82, label: "LTX-2" },
        { kind: "video", re: /wan-?2\.?[2-9]/i, tier: 80, label: "Wan 2.2" },
        { kind: "video", re: /skyreels/i, tier: 76, label: "SkyReels" },
        { kind: "video", re: /kandinsky-?[5-9]/i, tier: 76, label: "Kandinsky" },
        { kind: "video", re: /wan-?2\.?1/i, tier: 74, label: "Wan 2.1" },
        { kind: "video", re: /hunyuanvideo/i, tier: 72, label: "HunyuanVideo" },
        { kind: "video", re: /magi-?1/i, tier: 70, label: "MAGI-1" },
        { kind: "video", re: /ltx-?video|ltxv/i, tier: 64, label: "LTX-Video" },
        { kind: "video", re: /cogvideo/i, tier: 60, label: "CogVideoX" },
        { kind: "video", re: /mochi/i, tier: 60, label: "Mochi" },
        { kind: "video", re: /animatediff/i, tier: 40, label: "AnimateDiff" },
        // code: models that write SVG only, and the open language models that write code best (effects and SVG)
        { kind: "svg", re: /omnisvg/i, tier: 78, label: "OmniSVG" },
        { kind: "svg", re: /svgthinker/i, tier: 74, label: "SVGThinker" },
        { kind: "svg", re: /starvector/i, tier: 66, label: "StarVector" },
        { kind: "svg", re: /svg/i, tier: 55, label: "SVG model" },
        { kind: "coder", re: /kimi-?k\d/i, tier: 90 },
        { kind: "coder", re: /glm-?5(?!.*flash)/i, tier: 90 },
        { kind: "coder", re: /qwen3\.\d+-[\d.]+t/i, tier: 90 },
        { kind: "coder", re: /deepseek-?v4(?!.*flash)/i, tier: 88 },
        { kind: "coder", re: /minimax-?m\d(?!.*flash)/i, tier: 86 },
        { kind: "coder", re: /deepseek/i, tier: 84 },
        { kind: "coder", re: /qwen.*coder/i, tier: 84 },
        { kind: "coder", re: /mistral-?large/i, tier: 80 },
        { kind: "coder", re: /glm/i, tier: 78 },
        { kind: "coder", re: /minimax/i, tier: 78 },
        { kind: "coder", re: /gpt-oss-120b/i, tier: 76 },
        { kind: "coder", re: /qwen/i, tier: 72 },
        { kind: "coder", re: /gpt-oss/i, tier: 62 }
      ];
      var family = (kind, text) => FAMILIES.find((f) => (f.kind === kind || kind === "code" && f.kind === "svg") && f.re.test(text)) || null;
      var PUBLISHER_ALIASES = { deepseek: "deepseek-ai", "deepseek-ai": "deepseek-ai", "z-ai": "zai-org", zai: "zai-org", meta: "meta-llama", minimax: "MiniMaxAI", qwen: "Qwen", mistral: "mistralai", ibm: "ibm-granite", google: "google", openai: "openai" };
      var appId = (prefix, name) => `${prefix}-${String(name).toLowerCase().replace(/^@cf\//, "").replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "")}`.slice(0, 80);
      var limitedFor = 0;
      async function getJson(url, { headers = {}, timeoutMs = 25e3, retry = true } = {}) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        let res;
        try {
          res = await fetch(url, { headers: { Accept: "application/json", ...headers }, signal: ctrl.signal, redirect: "follow" });
        } catch (err) {
          return { status: 0, json: null, error: err.name === "AbortError" ? "timeout" : err.message };
        } finally {
          clearTimeout(timer);
        }
        if (res.status === 429) {
          const wait = Number(/t=(\d+)/.exec(res.headers.get("ratelimit") || "")?.[1] || res.headers.get("retry-after") || 0);
          if (retry && wait > 0 && wait <= 90) {
            await new Promise((r) => setTimeout(r, (wait + 1) * 1e3));
            return getJson(url, { headers, timeoutMs, retry: false });
          }
          limitedFor = Math.max(limitedFor, wait || 300);
          return { status: 429, json: null, wait };
        }
        if (!res.ok) return { status: res.status, json: null };
        return { status: res.status, json: await res.json().catch(() => null) };
      }
      async function pool(items, limit, fn) {
        const out = new Array(items.length);
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
          while (next < items.length) {
            const i = next++;
            out[i] = await fn(items[i], i);
          }
        }));
        return out;
      }
      var openOnly = define_process_env_default.FREE_MODELS_OPEN_ONLY === "1";
      var isOpenLicense = (l) => OPEN_LICENSES.has(l) || OPEN_OTHER.test(l);
      function licenseOf(model) {
        const tag = (model.tags || []).find((t) => t.startsWith("license:"));
        const license = String(model.cardData?.license || (tag ? tag.slice(8) : "") || "").toLowerCase();
        const name = String(model.cardData?.license_name || "").toLowerCase();
        const id = license === "other" && name ? name : license;
        if (isOpenLicense(id)) return id;
        return openOnly ? null : id || "not stated";
      }
      function licenseNote(license, id = "") {
        if (isOpenLicense(license)) return null;
        const l = `${license} ${id}`.toLowerCase();
        if (/hunyuan|tencent/.test(l)) return "own license \u2013 not valid in the EU, UK and South Korea";
        if (/research/.test(l)) return "own license \u2013 research and personal use only";
        if (/non-?commercial|[-_ ]nc[-_ ]|cc-by-nc|-nc$/.test(l)) return "own license \u2013 non-commercial use only";
        if (/stability|community/.test(l)) return "own license \u2013 free below a yearly revenue limit";
        if (license === "not stated") return "no license stated";
        return "own license \u2013 free for personal use";
      }
      var PROMPT_RE = /prompt|^text$|text_?input|^input$|description|caption|^message$|query|instruction|^idea$|^subject$/i;
      var NOT_PROMPT_RE = /negative|neg_|system|lora|model|api|token|key|url|path|file|^n$|_n$|_[iv]$|style_?name|seed|template|preset/i;
      var IMAGE_IN_RE = /image|frame|start|first|input|photo|picture|reference|init/i;
      var SIZE_CHOICE_RE = /aspect|ratio|resolution|size|dimension|orientation|format/i;
      var GOOD_API = /^(infer|generate|generate_image|generate_video|text_to_image|t2i|text2image|txt2img|run|predict|process|create|text_to_video|t2v|image_to_video|i2v|video|gradio_text_to_svg|text_to_svg|svg|generate_svg|draw)$/i;
      var BAD_API = /example|random|enhance|update|clear|load|reset|upscale|caption|lambda|^get_|^set_|change|toggle|preset|^on_|_on_|dims|upload|refine|polish|translate|cancel|stop|history|lora|style|login|feedback|share|download|save|delete/i;
      var shapeOf = (s) => {
        const str = String(s);
        const px = /(\d{3,4})\s*[x×*]\s*(\d{3,4})/.exec(str);
        if (px) return [Number(px[1]), Number(px[2])];
        const r = /(\d{1,2}(?:\.\d+)?)\s*:\s*(\d{1,2}(?:\.\d+)?)/.exec(str);
        if (r) return [Number(r[1]), Number(r[2])];
        if (/square/i.test(str)) return [1, 1];
        return null;
      };
      function componentsById(config) {
        return new Map((config?.components || []).map((c) => [c.id, c]));
      }
      function endpointInputs(config, info, dep) {
        const byId = componentsById(config);
        const params = info?.named_endpoints?.[`/${dep.api_name}`]?.parameters || null;
        const inputs = [];
        let i = 0;
        for (const id of dep.inputs || []) {
          const c = byId.get(id);
          const type = String(c?.type || "").toLowerCase();
          if (type === "state") return null;
          const p = params ? params[i] : null;
          i++;
          const props = c?.props || {};
          inputs.push({
            name: p?.parameter_name || String(props.label || `input_${i}`).toLowerCase().replace(/\W+/g, "_"),
            type,
            label: String(props.label || p?.label || ""),
            required: p ? !p.parameter_has_default : props.value == null,
            props: { minimum: props.minimum, maximum: props.maximum, step: props.step, value: props.value, choices: props.choices, max_length: props.max_length }
          });
        }
        if (params && params.length !== inputs.length) return null;
        return inputs;
      }
      function choiceValues(choices) {
        return (Array.isArray(choices) ? choices : []).map((c) => Array.isArray(c) ? { label: String(c[0]), value: c[1] } : { label: String(c), value: c });
      }
      function planEndpoint(config, info, dep, kind) {
        if (!dep.api_name || dep.show_api === false || ["private", "undocumented"].includes(dep.api_visibility) || dep.backend_fn === false) return null;
        const inputs = endpointInputs(config, info, dep);
        if (!inputs) return null;
        const byId = componentsById(config);
        const outputs = (dep.outputs || []).map((id) => String(byId.get(id)?.type || "").toLowerCase());
        const want = kind === "image" ? ["image", "gallery"] : kind === "video" ? ["video"] : ["code", "textbox", "html", "markdown", "file"];
        const outputIndex = outputs.findIndex((t) => want.includes(t));
        if (outputIndex < 0) return null;
        const plan = { api: dep.api_name, output: outputs[outputIndex], outputIndex, outputs: outputs.length, fixed: {} };
        const text = (p) => `${p.name} ${p.label}`;
        const keep = (p) => {
          if (!p.required) return true;
          const choices = choiceValues(p.props.choices);
          const v = p.props.value ?? (choices.length ? choices[0].value : p.type === "checkbox" ? false : ["slider", "number"].includes(p.type) ? p.props.minimum ?? 0 : ["textbox", "textarea", "code"].includes(p.type) ? "" : void 0);
          if (v === void 0) return false;
          plan.fixed[p.name] = v;
          return true;
        };
        for (const p of inputs) {
          const t = p.type;
          if (/api.?key|token|password|secret|credential/i.test(text(p))) return null;
          if (["textbox", "textarea", "code"].includes(t)) {
            if (!plan.prompt && PROMPT_RE.test(text(p)) && !NOT_PROMPT_RE.test(p.name) && !/negative/i.test(p.label)) plan.prompt = { name: p.name, maxLength: Number(p.props.max_length) || null };
            else if (!keep(p)) return null;
          } else if (t === "slider" || t === "number") {
            const lim = { name: p.name, min: Number(p.props.minimum ?? 0), max: Number(p.props.maximum ?? 4096), step: Number(p.props.step || 1) };
            if (/^width$|image_?width|\bwidth\b/i.test(text(p))) plan.width = lim;
            else if (/^height$|image_?height|\bheight\b/i.test(text(p))) plan.height = lim;
            else if (/seed/i.test(text(p))) plan.seed = lim;
            else if (/duration|seconds|length/i.test(text(p)) && !/frames/i.test(text(p))) plan.duration = lim;
            else if (!keep(p)) return null;
          } else if (t === "checkbox") {
            if (/random/i.test(text(p))) plan.randomize = { name: p.name };
            else if (!keep(p)) return null;
          } else if (t === "radio" || t === "dropdown") {
            const choices = choiceValues(p.props.choices);
            const shaped = choices.filter((c) => shapeOf(c.label) || shapeOf(c.value));
            if (!plan.choice && SIZE_CHOICE_RE.test(text(p)) && shaped.length >= 2) plan.choice = { name: p.name, choices: shaped.map((c) => ({ value: c.value, shape: shapeOf(c.value) || shapeOf(c.label) })) };
            else if (!keep(p)) return null;
          } else if (t === "image") {
            if (kind === "video" && !plan.image && IMAGE_IN_RE.test(text(p))) plan.image = { name: p.name, required: p.required && !/optional/i.test(p.label) };
            else if (!p.required || /optional/i.test(p.label)) plan.fixed[p.name] = null;
            else return null;
          } else if (p.required) {
            return null;
          }
        }
        if (!plan.prompt) return null;
        plan.input = plan.image ? plan.image.required ? "image" : "text+image" : "text";
        if (plan.width && !plan.height) delete plan.width;
        if (plan.height && !plan.width) delete plan.height;
        return plan;
      }
      function apiScore(plan) {
        let s = 0;
        if (GOOD_API.test(plan.api)) s += 10;
        if (BAD_API.test(plan.api)) s -= 20;
        if (plan.width || plan.choice) s += 2;
        if (plan.seed || plan.randomize) s += 1;
        if (plan.input === "text") s += 1;
        return s;
      }
      function analyzeSpace(config, info, kind, api = null) {
        if (!Array.isArray(config?.dependencies)) return null;
        const plans = config.dependencies.map((dep) => planEndpoint(config, info, dep, kind)).filter(Boolean).filter((p) => apiScore(p) > -10);
        if (api) return plans.find((p) => p.api === api) || null;
        if (!plans.length) return null;
        plans.sort((a, b) => apiScore(b) - apiScore(a));
        const best = plans[0];
        if (kind === "video" && best.input === "text") {
          const img = plans.find((p) => p.input !== "text" && p.api !== best.api);
          if (img) best.imageApi = img.api;
        }
        return best;
      }
      var snap = (v, lim) => {
        const step = lim.step > 0 ? lim.step : 1;
        const x = Math.round((v - lim.min) / step) * step + lim.min;
        return Math.max(lim.min, Math.min(lim.max, Number(x.toFixed(6))));
      };
      function fillValues(plan, { prompt, aspectRatio = "1:1", image = null, duration = null, area = 1024 * 1024 }) {
        const values = { ...plan.fixed || {} };
        const max = plan.prompt.maxLength || 2e3;
        values[plan.prompt.name] = String(prompt || "").slice(0, max);
        const [rw, rh] = String(aspectRatio).split(":").map(Number);
        const ratio = rw > 0 && rh > 0 ? rw / rh : 1;
        if (plan.width && plan.height) {
          let w = Math.sqrt(area * ratio);
          let h = w / ratio;
          const k = Math.min(1, plan.width.max / w, plan.height.max / h);
          w *= k;
          h *= k;
          values[plan.width.name] = snap(w, plan.width);
          values[plan.height.name] = snap(h, plan.height);
        }
        if (plan.choice) {
          const dist = (s) => Math.abs(Math.log(s[0] / s[1] / ratio));
          values[plan.choice.name] = plan.choice.choices.reduce((a, b) => dist(b.shape) < dist(a.shape) ? b : a).value;
        }
        if (plan.randomize) values[plan.randomize.name] = true;
        else if (plan.seed) values[plan.seed.name] = Math.floor(plan.seed.min + Math.random() * Math.max(1, Math.min(plan.seed.max, 2 ** 31 - 1) - plan.seed.min));
        if (plan.duration && duration) values[plan.duration.name] = snap(Number(duration), plan.duration);
        if (plan.image && image) values[plan.image.name] = image;
        return values;
      }
      var spaceHost = (s) => s.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      var spaceUrl = (host) => HF_SPACES_BASE ? `${HF_SPACES_BASE}/${host}` : `https://${host}.hf.space`;
      var prettyName = (id) => id.split("/").pop().replace(/[-_]+/g, " ").replace(/\b(\d+)b\b/gi, "$1B").trim().replace(/^./, (c) => c.toUpperCase());
      async function candidateModels(log, headers) {
        const queries = [
          ["image", "pipeline_tag=text-to-image&sort=likes&limit=70"],
          ["image", "pipeline_tag=text-to-image&sort=trendingScore&limit=40"],
          ["video", "pipeline_tag=text-to-video&sort=likes&limit=40"],
          ["video", "pipeline_tag=image-to-video&sort=likes&limit=40"],
          ["video", "pipeline_tag=text-to-video&sort=trendingScore&limit=25"],
          ["video", "pipeline_tag=image-to-video&sort=trendingScore&limit=25"],
          ["code", "search=svg&sort=likes&limit=40"]
        ];
        const found = /* @__PURE__ */ new Map();
        const results = await pool(queries, 4, async ([kind, q]) => ({ kind, res: await getJson(`${HF_API}/api/models?${q}&expand[]=likes&expand[]=tags&expand[]=pipeline_tag&expand[]=trendingScore&expand[]=cardData`, { headers }) }));
        if (!results.some((r) => Array.isArray(r.res.json))) {
          const limited = results.find((r) => r.res.status === 429);
          throw new Error(limited ? `Hugging Face is limiting requests for now \u2013 try again in ${Math.max(1, Math.ceil((limited.res.wait || 300) / 60))} min.` : `Hugging Face isn\u2019t answering (${results[0]?.res.error || `HTTP ${results[0]?.res.status}`}).`);
        }
        let seen = 0;
        for (const { kind, res } of results) {
          for (const m of Array.isArray(res.json) ? res.json : []) {
            seen++;
            if (found.has(m.id)) continue;
            const text = `${m.id} ${(m.tags || []).join(" ")}`;
            if (NSFW.test(text) || NOT_A_GENERATOR.test(m.id) || (m.tags || []).some((t) => /^(lora|gguf|base_model:adapter:|base_model:quantized:)/.test(t))) continue;
            const license = licenseOf(m);
            if (!license) continue;
            if (kind === "code" && !/svg/i.test(m.id)) continue;
            found.set(m.id, { id: m.id, kind, license, likes: m.likes || 0, trending: m.trendingScore || 0, task: m.pipeline_tag || "" });
          }
        }
        for (const m of await comfyCandidates(log, headers)) {
          const old = found.get(m.id);
          if (old) Object.assign(old, { comfyUsage: m.comfyUsage, comfyName: m.comfyName });
          else found.set(m.id, m);
        }
        const rank = (m) => (family(m.kind, m.id)?.tier ?? 50) + 8 * Math.log10(1 + m.likes) + Math.min(10, m.trending / 5) + Math.min(10, 2 * Math.log10(1 + (m.comfyUsage || 0)));
        const list2 = [...found.values()].sort((a, b) => rank(b) - rank(a)).slice(0, 120);
        log(`Hugging Face: ${seen} models looked at, ${found.size} open-source generators, the ${list2.length} most promising checked`);
        return list2;
      }
      var COMFY_TEMPLATES = define_process_env_default.COMFY_TEMPLATES_URL || "https://raw.githubusercontent.com/Comfy-Org/workflow_templates/main/templates/index.json";
      var COMFY_GENERIC = /^(none|wan|flux|lightricks|stability|tencent|qwen|hunyuan|minimax|bytedance|google|openai|alibaba|kling|comfyui|sdxl?)$/i;
      async function comfyCandidates(log, headers) {
        const res = await getJson(COMFY_TEMPLATES, { timeoutMs: 3e4 });
        if (!Array.isArray(res.json)) {
          log(`ComfyUI: its template list isn\u2019t available (${res.error || `HTTP ${res.status}`})`);
          return [];
        }
        const byName = /* @__PURE__ */ new Map();
        for (const t of res.json.flatMap((c) => c.templates || [])) {
          if (!t.openSource) continue;
          const tags = t.tags || [];
          const kind = tags.includes("Text to Image") ? "image" : tags.some((g) => /^(Text|Image) to Video$/.test(g)) ? "video" : null;
          if (!kind) continue;
          for (const name of t.models || []) {
            if (!name || COMFY_GENERIC.test(String(name).trim())) continue;
            const key = `${kind}:${String(name).toLowerCase()}`;
            const e = byName.get(key) || { name: String(name), kind, usage: 0 };
            e.usage += Number(t.usage) || 0;
            byName.set(key, e);
          }
        }
        const names = [...byName.values()].sort((a, b) => b.usage - a.usage).slice(0, 60);
        const tasks = { image: ["text-to-image"], video: ["text-to-video", "image-to-video"] };
        const out = [];
        await pool(names, 6, async (n) => {
          const q = encodeURIComponent(n.name.trim().replace(/\s+/g, "-"));
          const r = await getJson(`${HF_API}/api/models?search=${q}&sort=likes&limit=6&expand[]=likes&expand[]=tags&expand[]=pipeline_tag&expand[]=trendingScore&expand[]=cardData`, { headers });
          const m = (Array.isArray(r.json) ? r.json : []).find((x) => tasks[n.kind].includes(x.pipeline_tag) && licenseOf(x) && !NSFW.test(`${x.id} ${(x.tags || []).join(" ")}`) && !NOT_A_GENERATOR.test(x.id) && !(x.tags || []).some((t) => /^(lora|gguf|base_model:adapter:|base_model:quantized:)/.test(t)));
          if (m) out.push({ id: m.id, kind: n.kind, license: licenseOf(m), likes: m.likes || 0, trending: m.trendingScore || 0, task: m.pipeline_tag, comfyUsage: n.usage, comfyName: n.name });
        });
        log(`ComfyUI: ${names.length} open models in its official templates, ${out.length} of them open source on Hugging Face`);
        return out;
      }
      async function spacesFor(models, log, headers) {
        const spaces = /* @__PURE__ */ new Map();
        await pool(models, 6, async (m) => {
          const res = await getJson(`${HF_API}/api/spaces?models=${encodeURIComponent(m.id)}&sort=likes&limit=8&expand[]=runtime&expand[]=likes&expand[]=sdk&expand[]=tags&expand[]=cardData&expand[]=models`, { headers });
          const list2 = (Array.isArray(res.json) ? res.json : []).filter((s) => {
            if (s.sdk !== "gradio" || s.runtime?.stage !== "RUNNING" || !s.runtime?.hardware?.current || /^cpu/.test(s.runtime.hardware.current)) return false;
            const about = `${s.id} ${s.cardData?.title || ""} ${s.cardData?.short_description || ""} ${(s.tags || []).join(" ")} ${(s.models || []).join(" ")}`;
            const name = `${s.id} ${s.cardData?.title || ""}`;
            return !NSFW.test(about) && !CLOSED.test(name) && !NOT_A_GENERATOR.test(name);
          });
          const author = m.id.split("/")[0].toLowerCase();
          const trust = (s) => s.id.split("/")[0].toLowerCase() === author ? 3 : TRUSTED.has(s.id.split("/")[0]) ? 2 : 1;
          list2.sort((a, b) => trust(b) - trust(a) || (b.likes || 0) - (a.likes || 0));
          for (const s of list2.slice(0, 2)) {
            const old = spaces.get(s.id);
            const fam = family(m.kind, m.id);
            if (old && (family(old.model.kind, old.model.id)?.tier || 0) >= (fam?.tier || 0)) continue;
            spaces.set(s.id, { space: s, model: m, official: trust(s) === 3, trusted: trust(s) >= 2 });
          }
        });
        log(`Hugging Face: ${spaces.size} running apps use them`);
        return [...spaces.values()];
      }
      async function probeSpaces(candidates, log, headers) {
        const entries = [];
        let failed = 0;
        await pool(candidates, 6, async ({ space, model, official, trusted }) => {
          const host = spaceHost(space);
          const [config, info] = await Promise.all([
            getJson(`${spaceUrl(host)}/config`, { headers, timeoutMs: 2e4 }),
            getJson(`${spaceUrl(host)}/gradio_api/info`, { headers, timeoutMs: 2e4 })
          ]);
          let kind = model.kind;
          let plan = config.json && info.json ? analyzeSpace(config.json, info.json, kind) : null;
          if (!plan && config.json && info.json && kind !== "code") {
            const other = kind === "image" ? "video" : "image";
            plan = family(other, space.id) ? analyzeSpace(config.json, info.json, other) : null;
            if (plan) kind = other;
          }
          if (!plan) {
            failed++;
            if (define_process_env_default.FREE_MODELS_DEBUG) {
              const byId = componentsById(config.json);
              const fns = (config.json?.dependencies || []).filter((d) => d.api_name).map((d) => `${d.api_name}(${(d.inputs || []).map((i) => `${byId.get(i)?.type}:${byId.get(i)?.props?.label || ""}`).join(", ")}) \u2192 ${(d.outputs || []).map((i) => byId.get(i)?.type).join(",")}`);
              log(`  \u2717 ${kind} ${space.id} [${config.status}/${info.status}] ${fns.slice(0, 6).join(" | ").slice(0, 600)}`);
            }
            return;
          }
          const fam = family(kind, space.id) || (kind === model.kind ? family(kind, model.id) : null);
          if (kind !== model.kind && !fam) return;
          const hardware = space.runtime.hardware.current;
          const score = Math.round(((fam?.tier ?? 50) + 6 * Math.log10(1 + model.likes) + 4 * Math.log10(1 + (space.likes || 0)) + (official ? 6 : trusted ? 3 : 0) + Math.min(5, model.trending / 10) + Math.min(6, 1.5 * Math.log10(1 + (model.comfyUsage || 0)))) * 10) / 10;
          entries.push({
            id: appId("hf", host),
            kind,
            role: kind === "code" ? "svg" : void 0,
            // the code apps found on Hugging Face write SVG only
            label: fam && !/model$/.test(fam.label) ? `${fam.label}${/(turbo|fast|lightning|distill)/i.test(space.id + model.id) ? " (fast)" : ""}` : prettyName(model.id),
            provider: "huggingface",
            model: model.id,
            license: kind !== model.kind && licenseOf({ cardData: space.cardData }) || model.license,
            licenseNote: licenseNote(kind !== model.kind && licenseOf({ cardData: space.cardData }) || model.license, `${model.id} ${space.id}`),
            space: space.id,
            host,
            hardware,
            zeroGpu: /^zero/.test(hardware),
            official,
            likes: model.likes,
            spaceLikes: space.likes || 0,
            comfy: model.comfyUsage ? model.comfyName || true : void 0,
            // in ComfyUI's official templates
            score,
            nodes: Boolean(fam?.nodes),
            ...plan
          });
        });
        log(`Hugging Face: ${entries.length} apps can be driven${failed ? `, ${failed} left out (no usable API)` : ""}`);
        return entries;
      }
      async function pollinationsModels(log, headers) {
        const [img, txt] = await Promise.all([getJson(`${POLLINATIONS}/image/models`), getJson(`${POLLINATIONS}/text/models`)]);
        const list2 = [
          ...(Array.isArray(img.json) ? img.json : []).map((m) => ({ ...m, kind: "image" })),
          ...(Array.isArray(txt.json) ? txt.json : []).map((m) => ({ ...m, kind: "coder" }))
        ].filter((m) => m.paid_only === false && m.name && !String(m.name).startsWith("community/") && !NSFW.test(m.name) && (m.kind === "image" ? (m.output_modalities || ["image"]).includes("image") : (m.output_modalities || ["text"]).join() === "text" && !/guard|audio|midijourney|safeguard/i.test(m.name)));
        const entries = [];
        await pool(list2, 6, async (m) => {
          const open = await openOnHuggingFace(m.name, headers);
          if (!open) return;
          const fam = family(m.kind, m.name);
          if (m.kind === "coder" && !fam) return;
          entries.push({
            id: appId("poll", m.name),
            kind: m.kind === "coder" ? "code" : "image",
            role: m.kind === "coder" ? "coder" : void 0,
            label: m.title || prettyName(open.id),
            provider: "pollinations",
            apiModel: m.name,
            model: open.id,
            license: open.license,
            licenseNote: licenseNote(open.license, open.id),
            likes: open.likes,
            score: Math.round(((fam?.tier ?? 60) + 6 * Math.log10(1 + open.likes)) * 10) / 10,
            // language models read structured specifications (XML, JSON); image models only their prompt
            nodes: m.kind === "coder"
          });
        });
        log(`Pollinations: ${list2.length} free models, ${entries.length} of them open source`);
        return entries;
      }
      async function openOnHuggingFace(name, headers) {
        const [pub, ...rest] = String(name).replace(/^@cf\//, "").split("/");
        if (!rest.length) return null;
        const res = await getJson(`${HF_API}/api/models/${PUBLISHER_ALIASES[pub] || pub}/${rest.join("/")}?expand[]=tags&expand[]=cardData&expand[]=likes`, { headers });
        const license = res.json ? licenseOf(res.json) : null;
        return license ? { id: res.json.id, license, likes: res.json.likes || 0 } : null;
      }
      async function cloudflareModels(cloudflare, log, headers) {
        if (!cloudflare?.accountId || !cloudflare?.token) return [];
        const res = await getJson(`${CLOUDFLARE}/accounts/${encodeURIComponent(cloudflare.accountId)}/ai/models/search?task=${encodeURIComponent("Text Generation")}&per_page=100`, {
          headers: { Authorization: `Bearer ${cloudflare.token}` }
        });
        const list2 = (Array.isArray(res.json?.result) ? res.json.result : []).filter((m) => /^@cf\//.test(m.name || "") && family("coder", m.name) && !/guard|lora|awq|-int8|vision|-vl\b/i.test(m.name) && !(m.properties || []).some((p) => p.property_id === "planned_deprecation_date"));
        const entries = [];
        await pool(list2, 6, async (m) => {
          const open = await openOnHuggingFace(m.name, headers);
          if (!open) return;
          entries.push({
            id: appId("cf", m.name),
            kind: "code",
            role: "coder",
            label: prettyName(open.id),
            provider: "cloudflare",
            apiModel: m.name,
            model: open.id,
            license: open.license,
            licenseNote: licenseNote(open.license, open.id),
            likes: open.likes,
            score: Math.round((family("coder", m.name).tier + 6 * Math.log10(1 + open.likes) + 3) * 10) / 10,
            // +3: really free
            nodes: true
          });
        });
        log(`Cloudflare: ${list2.length} code models, ${entries.length} of them open source`);
        return entries;
      }
      async function discover({ hfToken = "", cloudflare = null, openSourceOnly = define_process_env_default.FREE_MODELS_OPEN_ONLY === "1", log = () => {
      } } = {}) {
        openOnly = openSourceOnly;
        limitedFor = 0;
        const started2 = Date.now();
        const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};
        const models = await candidateModels(log, headers);
        const [spaceEntries, pollEntries, cfEntries] = await Promise.all([
          spacesFor(models, log, headers).then((c) => probeSpaces(c, log, headers)),
          pollinationsModels(log, headers).catch((err) => {
            log(`Pollinations: ${err.message}`);
            return [];
          }),
          cloudflareModels(cloudflare, log, headers).catch((err) => {
            log(`Cloudflare: ${err.message}`);
            return [];
          })
        ]);
        const catalog = { version: VERSION, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), tookMs: Date.now() - started2 };
        for (const kind of KINDS) {
          const sorted = [...spaceEntries, ...pollEntries, ...cfEntries].filter((e) => e.kind === kind).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
          const byModel = /* @__PURE__ */ new Map();
          for (const e of sorted) {
            const key = `${e.provider}:${e.model.toLowerCase()}`;
            const first = byModel.get(key);
            if (!first) byModel.set(key, { ...e, alternates: [] });
            else if (e.provider === "huggingface" && first.alternates.length < 2) {
              first.alternates.push({ space: e.space, host: e.host, hardware: e.hardware, zeroGpu: e.zeroGpu });
            }
          }
          const kept = [...byModel.values()].slice(0, PER_KIND);
          const same = {};
          for (const e of kept) same[e.label] = (same[e.label] || 0) + 1;
          for (const e of kept) {
            if (same[e.label] > 1 && e.provider === "huggingface") {
              const fast = /(turbo|fast|lightning|distill)/i.test(e.space) && !/(turbo|fast|lightning|distill)/i.test(e.model);
              const fromModel = !family(e.kind, e.space) || family(e.kind, e.model) === family(e.kind, e.space);
              e.label = `${prettyName(fromModel ? e.model : e.space)}${fast ? " (fast)" : ""}`;
            }
          }
          catalog[kind] = kept.map((e, i) => ({ ...e, rank: i + 1 }));
        }
        catalog.counts = Object.fromEntries(KINDS.map((k) => [k, catalog[k].length]));
        if (limitedFor) throw new Error(`Hugging Face is limiting requests for now, so the search was cut short \u2013 the list wasn\u2019t changed. Try again in ${Math.max(1, Math.ceil(limitedFor / 60))} min.`);
        if (!catalog.image.length) throw new Error("The search found no image models \u2013 the list wasn\u2019t changed. Try again later.");
        return catalog;
      }
      var dataDir = () => path.join(os.homedir(), ".hombresai");
      var catalogFile = () => path.join(dataDir(), "free-models.json");
      function readCatalog(file = catalogFile()) {
        try {
          const c = JSON.parse(fs.readFileSync(file, "utf8"));
          return c?.version === VERSION ? c : null;
        } catch {
          return null;
        }
      }
      function writeCatalog(catalog, file = catalogFile()) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(catalog, null, 1));
        fs.renameSync(tmp, file);
      }
      function printCatalog(c) {
        const titles = { image: "Images", video: "Videos", code: "Code (effects and SVG)" };
        for (const kind of KINDS) {
          console.log(`
${titles[kind]} (${c[kind].length})`);
          for (const e of c[kind]) {
            console.log(`  ${String(e.rank).padStart(2)}. ${e.label.padEnd(26)} ${(e.licenseNote ? `${e.license.slice(0, 18)}*` : e.license).padEnd(22)} ${whereLabel(e)}${e.comfy ? " \xB7 in ComfyUI" : ""}${e.role === "svg" ? " \xB7 SVG only" : ""}${e.nodes ? " \xB7 reads node specs" : ""}`);
          }
        }
        console.log(`
* own license \u2013 free for personal use (each model's license has the details).
Updated ${c.updatedAt} in ${(c.tookMs / 1e3).toFixed(0)} s.`);
      }
      function whereLabel(e) {
        if (e.provider === "pollinations") return "Pollinations (needs pollen)";
        if (e.provider === "cloudflare") return "Cloudflare (free daily allowance)";
        return `Hugging Face \xB7 ${e.space}${e.zeroGpu ? " (free GPU time)" : ""}`;
      }
      module.exports = { VERSION, KINDS, discover, analyzeSpace, planEndpoint, fillValues, readCatalog, writeCatalog, catalogFile, licenseOf, licenseNote, family, whereLabel };
      if (__require.main === module) {
        const args = new Set(process.argv.slice(2));
        let saved = {};
        try {
          saved = JSON.parse(fs.readFileSync(path.join(dataDir(), "config.json"), "utf8"));
        } catch {
        }
        const quiet = args.has("--json");
        discover({ hfToken: define_process_env_default.HF_TOKEN || saved.hfToken || "", cloudflare: saved.cloudflare, openSourceOnly: args.has("--open-only"), log: (msg) => {
          if (!quiet) console.log(msg);
        } }).then((catalog) => {
          if (!args.has("--dry-run")) writeCatalog(catalog);
          if (quiet) console.log(JSON.stringify(catalog, null, 2));
          else {
            printCatalog(catalog);
            if (!args.has("--dry-run")) console.log(`Saved to ${catalogFile()}.`);
          }
        }).catch((err) => {
          console.error(`Couldn\u2019t finish: ${err.message}`);
          process.exit(1);
        });
      }
    }
  });

  // server.js
  var require_server = __commonJS({
    "server.js"() {
      "use strict";
      init_define_process_env();
      init_globals();
      var http = (init_http(), __toCommonJS(http_exports));
      var https = (init_http(), __toCommonJS(http_exports));
      var fs = (init_fs(), __toCommonJS(fs_exports));
      var fsp = (init_fs_promises(), __toCommonJS(fs_promises_exports));
      var path = require_path_browserify();
      var os = (init_os(), __toCommonJS(os_exports));
      var crypto = (init_crypto(), __toCommonJS(crypto_exports));
      var { spawn: spawn2 } = (init_child_process(), __toCommonJS(child_process_exports));
      var ROOT = "/app";
      var PUBLIC_DIR = path.join(ROOT, "public");
      var LEGACY_OUTPUT_DIR = path.join(ROOT, "output");
      var DATA_DIR = (() => {
        const dir = path.join(os.homedir(), ".hombresai");
        const legacy = path.join(os.homedir(), ".myhighsfield");
        if (!fs.existsSync(dir) && fs.existsSync(legacy)) {
          try {
            fs.renameSync(legacy, dir);
          } catch {
            return legacy;
          }
        }
        return dir;
      })();
      var CONFIG_FILE = path.join(DATA_DIR, "config.json");
      var HISTORY_FILE = path.join(DATA_DIR, "history.json");
      var CACHE_DIR = path.join(DATA_DIR, "cache");
      var REFS_DIR = path.join(CACHE_DIR, "refs");
      var THUMBS_DIR = path.join(CACHE_DIR, "thumbs");
      var PENDING_DIR = path.join(CACHE_DIR, "pending");
      var EFFECTS_DIR = path.join(ROOT, "effects");
      var CUSTOM_EFFECTS_DIR = path.join(EFFECTS_DIR, "custom");
      var FX_PRESETS_DIR = path.join(DATA_DIR, "presets");
      var API_BASE = (define_process_env_default.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
      var GOOGLE = {
        auth: define_process_env_default.GOOGLE_AUTH_URL || "https://accounts.google.com/o/oauth2/v2/auth",
        token: define_process_env_default.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token",
        revoke: define_process_env_default.GOOGLE_REVOKE_URL || "https://oauth2.googleapis.com/revoke",
        drive: (define_process_env_default.DRIVE_API_BASE || "https://www.googleapis.com/drive/v3").replace(/\/+$/, ""),
        upload: (define_process_env_default.DRIVE_UPLOAD_BASE || "https://www.googleapis.com/upload/drive/v3").replace(/\/+$/, "")
      };
      var POLLINATIONS_BASE = (define_process_env_default.POLLINATIONS_BASE || "https://gen.pollinations.ai").replace(/\/+$/, "");
      var HOST = "127.0.0.1";
      var BASE_PORT = Number(define_process_env_default.PORT) || 4848;
      var OPEN_BROWSER = process.argv.includes("--open");
      var MAX_BODY_BYTES = 64 * 1024 * 1024;
      var MAX_INLINE_BYTES = 19 * 1024 * 1024;
      var MAX_REFS = 14;
      var MAX_PROMPT_CHARS = 2e4;
      var MAX_EFFECT_BYTES = 64 * 1024;
      var GENERATE_TIMEOUT_MS = 8 * 60 * 1e3;
      var MODEL_CACHE_MS = 10 * 60 * 1e3;
      var MEM_CACHE_MAX_BYTES = 256 * 1024 * 1024;
      var MODEL_ID_RE = /^[a-z0-9][a-z0-9.-]{1,80}$/i;
      var DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
      var DRIVE_FOLDER = "hombresai";
      var FOLDER_MIME = "application/vnd.google-apps.folder";
      var RATIOS_ALL = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "1:4", "4:1", "1:8", "8:1"];
      var RATIOS_STD = RATIOS_ALL.slice(0, 10);
      var IMAGE_SIZES = ["512", "1K", "2K", "4K"];
      var THINKING_LEVELS = ["MINIMAL", "LOW", "MEDIUM", "HIGH"];
      var KNOWN_MODELS = [
        {
          id: "gemini-nano-banana-2.1",
          label: "Nano Banana 2.1",
          tag: "Recommended",
          desc: "The newest model. Fast and cheap, with excellent in-image text, character consistency and edits.",
          ratios: RATIOS_ALL,
          sizes: ["1K", "2K", "4K"],
          thinking: ["MINIMAL", "MEDIUM", "HIGH"],
          thinkingDefault: "MEDIUM",
          refsHint: "up to 10 objects + 4 characters",
          price: { image: { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 }, input: 1.5, textOut: 7.5 }
        },
        {
          id: "gemini-3-pro-image",
          label: "Nano Banana Pro",
          tag: "Top quality",
          desc: "Studio quality, complex compositions and precise text. Always thinks at full depth \u2013 slower and pricier.",
          ratios: RATIOS_STD,
          sizes: ["1K", "2K", "4K"],
          thinking: null,
          refsHint: "up to 6 objects, 5 characters and 3 styles",
          price: { image: { "1K": 0.134, "2K": 0.134, "4K": 0.24 }, input: 2, textOut: 12 }
        },
        {
          id: "gemini-3.1-flash-lite-image",
          label: "Nano Banana 2 Lite",
          tag: "Fast",
          desc: "Minimal latency, 1K only. Ideal for exploring ideas in bulk.",
          ratios: RATIOS_STD,
          sizes: ["1K"],
          thinking: ["MINIMAL", "HIGH"],
          thinkingDefault: "MINIMAL",
          refsHint: "up to 14 objects (no character consistency)",
          price: { image: { "1K": 0.0336 }, input: 0.25, textOut: 1.5 }
        },
        {
          id: "gemini-3.1-flash-image",
          label: "Nano Banana 2",
          tag: "Older",
          desc: "The previous generation (deprecated by Google). The only one that also supports 512 px.",
          ratios: RATIOS_ALL,
          sizes: ["512", "1K", "2K", "4K"],
          thinking: ["MINIMAL", "HIGH"],
          thinkingDefault: "MINIMAL",
          refsHint: "up to 10 objects + 4 characters",
          price: { image: { "512": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151 }, input: 0.5, textOut: 3 }
        }
      ];
      for (const m of KNOWN_MODELS) Object.assign(m, { provider: "gemini", refs: true, maxRefs: MAX_REFS });
      var OPEN_MODELS = [
        {
          id: "os-z-image-turbo",
          apiModel: "tongyi-mai/z-image-turbo",
          label: "Z-Image Turbo",
          desc: "Alibaba\u2019s open-source model (Apache 2.0). Very fast and photorealistic. Text only \u2013 no references.",
          refs: false,
          refsHint: "no references \u2013 text only"
        },
        {
          id: "os-flux2-klein",
          apiModel: "black-forest-labs/flux.2-klein-4b",
          label: "FLUX.2 klein",
          desc: "Black Forest Labs\u2019 open 4B model (Apache 2.0). Generates and edits photos with references \u2013 works with Effects.",
          refs: true,
          maxRefs: 4,
          refsHint: "up to 4 references"
        },
        {
          id: "os-flux1-schnell",
          apiModel: "black-forest-labs/flux.1-schnell",
          label: "FLUX.1 schnell",
          desc: "The classic open FLUX model (Apache 2.0). Quick drafts. Text only \u2013 no references.",
          refs: false,
          refsHint: "no references \u2013 text only"
        },
        {
          id: "os-qwen-image",
          label: "Qwen-Image",
          desc: "Alibaba\u2019s open 20B model (Apache 2.0) \u2013 the best of the free ones at lettering and text in pictures. Runs on Hugging Face\u2019s free GPUs; slower, and it uses more of the daily free GPU time.",
          refs: false,
          refsHint: "no references \u2013 text only",
          hfOnly: true
        }
      ].map((m) => ({ ...m, provider: "pollinations", open: true, group: "open", tag: "Open source", free: true, ratios: RATIOS_STD, sizes: [], thinking: null, price: null }));
      var MODELS_BY_ID = new Map([...KNOWN_MODELS, ...OPEN_MODELS].map((m) => [m.id, m]));
      var KNOWN_BY_ID = new Map(KNOWN_MODELS.map((m) => [m.id, m]));
      var KNOWN_LABELS = new Set(KNOWN_MODELS.map((m) => m.label.toLowerCase()));
      var HIDDEN_MODEL_IDS = /* @__PURE__ */ new Set(["gemini-2.5-flash-image"]);
      var isAliasOfKnown = (id, displayName) => KNOWN_BY_ID.has(id.replace(/-preview.*$/, "")) || KNOWN_LABELS.has(String(displayName || "").trim().toLowerCase());
      var REF_ROLES = {
        auto: "",
        character: "Use it as the CHARACTER reference: keep this person's face, identity, hairstyle and body proportions exactly the same.",
        object: "Use it as the OBJECT/PRODUCT reference: reproduce this item faithfully, with its exact shape, colors, materials, text and logos.",
        style: "Use it only as a STYLE reference: match its visual style, color palette, lighting and mood, but do not copy its content.",
        scene: "Use it as the SCENE/BACKGROUND reference: set the result in this environment.",
        pose: "Use it as the POSE/COMPOSITION reference: match the body pose and camera framing.",
        edit: "This is the BASE IMAGE to edit: keep everything unchanged except what the instructions ask to change."
      };
      var ENHANCE_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"];
      var CODER_MODELS = [
        { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", provider: "pollinations", note: "free \xB7 open source" },
        { id: "z-ai/glm-5.3-flash", label: "GLM 5.3 Flash", provider: "pollinations", note: "free \xB7 open source" },
        { id: "openai/gpt-oss-20b", label: "gpt-oss 20B", provider: "pollinations", note: "free \xB7 open source" },
        { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "gemini", note: "your Gemini key \xB7 \u2248 CZK 0.03" }
      ];
      var POLLINATIONS_ANON_CODERS = ["openai/gpt-oss-20b", "z-ai/glm-5.3-flash"];
      var ENHANCE_SYSTEM = `You are an expert prompt writer for Google's Nano Banana image models (Gemini image generation).
Rewrite the user's idea into ONE vivid, detailed image-generation prompt in English.
- Write a natural descriptive paragraph, not a list of keywords: subject and its details, action, setting, composition and camera angle, lens, lighting, mood, color palette, materials and textures, overall style.
- Keep every concrete detail and the intent of the user. Do not add text, captions, logos or watermarks unless asked. Text the user wants rendered in the image must stay exactly as written (original language), in quotes.
- If reference images are attached, call them "reference image 1", "reference image 2", ... and say precisely what to take from each (e.g. the person's face and identity, the exact product design, the style) and what should change.
- Do not mention aspect ratio, resolution or these instructions.
Return only the final prompt: no title, no surrounding quotes, no markdown, no explanations.`;
      var CNB_URL = "https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt";
      var FALLBACK_FX = { usdCzk: 21.782, date: "26.10.2026" };
      var FX_MAX_AGE_MS = 6 * 60 * 60 * 1e3;
      var FX_RETRY_MS = 10 * 60 * 1e3;
      var BILLING_HINT = "Gemini image models have no Free Tier. In Google AI Studio (aistudio.google.com/apikey), click \u201CSet up billing\u201D on your project and link a billing account \u2013 then you only pay for the images you generate.";
      var MIME_BY_EXT = {
        html: "text/html; charset=utf-8",
        js: "text/javascript; charset=utf-8",
        css: "text/css; charset=utf-8",
        json: "application/json; charset=utf-8",
        txt: "text/plain; charset=utf-8",
        svg: "image/svg+xml",
        ico: "image/x-icon",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
        avif: "image/avif",
        heic: "image/heic",
        heif: "image/heif",
        mp4: "video/mp4",
        m4v: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime"
      };
      var EXT_BY_MIME = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
        "image/heic": "heic",
        "image/heif": "heif"
      };
      var CSP = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
      var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      var pad = (n) => String(n).padStart(2, "0");
      var localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      var localTime = (d) => `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
      var base64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      function slugify(text) {
        return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").slice(0, 40).replace(/-+$/, "");
      }
      function resolveInside(base, rel) {
        let decoded;
        try {
          decoded = decodeURIComponent(String(rel));
        } catch {
          return null;
        }
        if (decoded.includes("\0")) return null;
        const full = path.resolve(base, decoded.replace(/^[/\\]+/, ""));
        return full.startsWith(base + path.sep) ? full : null;
      }
      async function writeFileSafe(file, data2) {
        const tmp = `${file}.${process.pid}-${crypto.randomBytes(4).toString("hex")}.tmp`;
        await fsp.writeFile(tmp, data2);
        for (let attempt = 0; ; attempt++) {
          try {
            await fsp.rename(tmp, file);
            return;
          } catch (err) {
            if (attempt < 8 && ["EPERM", "EBUSY", "EACCES"].includes(err.code)) {
              await sleep(120 * (attempt + 1));
              continue;
            }
            await fsp.writeFile(file, data2);
            await fsp.unlink(tmp).catch(() => {
            });
            return;
          }
        }
      }
      async function moveFiles(src, dst) {
        let names;
        try {
          names = await fsp.readdir(src);
        } catch {
          return;
        }
        await fsp.mkdir(dst, { recursive: true });
        for (const name of names) {
          const from = path.join(src, name);
          const to = path.join(dst, name);
          try {
            await fsp.rename(from, to);
          } catch {
            try {
              await fsp.copyFile(from, to);
              await fsp.unlink(from).catch(() => {
              });
            } catch (err) {
              console.warn(`Couldn\u2019t move ${from}:`, err.message);
            }
          }
        }
      }
      async function removeEmptyDirs(dir) {
        let entries;
        try {
          entries = await fsp.readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name));
        await fsp.rmdir(dir).catch(() => {
        });
      }
      function imageDimensions(buf) {
        try {
          if (buf.length > 24 && buf.readUInt32BE(0) === 2303741511) {
            return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
          }
          if (buf[0] === 255 && buf[1] === 216) {
            let off = 2;
            while (off + 9 < buf.length) {
              if (buf[off] !== 255) {
                off++;
                continue;
              }
              const marker = buf[off + 1];
              if (marker === 255) {
                off++;
                continue;
              }
              if (marker === 1 || marker >= 208 && marker <= 216) {
                off += 2;
                continue;
              }
              if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
                return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
              }
              off += 2 + buf.readUInt16BE(off + 2);
            }
          }
          if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
            const chunk = buf.toString("ascii", 12, 16);
            if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
            if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 16383, height: buf.readUInt16LE(28) & 16383 };
            if (chunk === "VP8L") {
              const bits = buf.readUInt32LE(21);
              return { width: (bits & 16383) + 1, height: (bits >> 14 & 16383) + 1 };
            }
          }
        } catch {
        }
        return null;
      }
      function httpError(status, message, extra = {}) {
        return Object.assign(new Error(message), { httpStatus: status, info: { code: "local", message, ...extra } });
      }
      function httpRequest(method, url, { headers = {}, body, raw, binary = false, timeoutMs = 6e4 } = {}) {
        return new Promise((resolve, reject) => {
          const target = new URL(url);
          const extra = {};
          let payload = null;
          if (raw !== void 0) {
            payload = import_buffer.Buffer.isBuffer(raw) ? raw : import_buffer.Buffer.from(String(raw));
          } else if (body !== void 0) {
            payload = import_buffer.Buffer.from(JSON.stringify(body));
            extra["Content-Type"] = "application/json; charset=UTF-8";
          }
          if (payload) extra["Content-Length"] = payload.length;
          const req = (target.protocol === "http:" ? http : https).request(target, {
            method,
            headers: { Accept: "application/json", ...extra, ...headers }
          }, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              const buffer = import_buffer.Buffer.concat(chunks);
              if (binary && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ status: res.statusCode, headers: res.headers, buffer });
                return;
              }
              const text = buffer.toString("utf8");
              let json = null;
              try {
                json = JSON.parse(text);
              } catch {
              }
              resolve({ status: res.statusCode, headers: res.headers, buffer, text, json });
            });
            res.on("error", reject);
          });
          req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
          req.on("error", reject);
          req.end(payload || void 0);
        });
      }
      var formBody = (params) => ({ raw: new URLSearchParams(params).toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      var DEFAULT_SETTINGS = { enhanceModel: ENHANCE_MODELS[0], concurrency: 4, store: false, vat: true };
      var config = { apiKey: "", pollinationsKey: "", ...DEFAULT_SETTINGS, drive: {} };
      function loadConfig() {
        try {
          config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) };
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t load the config:", err.message);
        }
        config.drive = config.drive || {};
      }
      async function saveConfig() {
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(CONFIG_FILE, JSON.stringify(config, null, 2));
      }
      function getApiKey() {
        if (config.apiKey) return { key: config.apiKey, source: "config" };
        const env = define_process_env_default.GEMINI_API_KEY || define_process_env_default.GOOGLE_API_KEY || "";
        return { key: env, source: env ? "env" : null };
      }
      function requireApiKey() {
        const { key } = getApiKey();
        if (!key) throw httpError(401, "API key missing \u2013 add it in Settings.", { code: "bad_key" });
        return key;
      }
      var keyHint = (key) => key ? `${key.slice(0, 4)}\u2026${key.slice(-4)}` : "";
      function publicConfig() {
        const { key, source } = getApiKey();
        return {
          hasKey: Boolean(key),
          keySource: source,
          keyHint: keyHint(key),
          pollinations: { hasKey: Boolean(config.pollinationsKey), keyHint: keyHint(config.pollinationsKey), ...config.pollinationsKey ? config.pollinationsInfo : null },
          cloudflare: { hasKey: hasCloudflare(), accountHint: keyHint(config.cloudflare?.accountId), tokenHint: keyHint(config.cloudflare?.token), ...hasCloudflare() ? config.cloudflareInfo : null },
          huggingface: { hasToken: Boolean(config.hfToken), tokenHint: keyHint(config.hfToken), user: config.hfToken ? config.hfInfo?.user : void 0 },
          connect: { origin: config.connectOrigin || "" },
          settings: { enhanceModel: config.enhanceModel, concurrency: config.concurrency, store: config.store, vat: config.vat },
          fx: config.fx?.usdCzk ? { usdCzk: config.fx.usdCzk, date: config.fx.date } : FALLBACK_FX,
          drive: driveStatus(),
          dataDir: DATA_DIR,
          configFile: CONFIG_FILE,
          mcp: { script: path.join(ROOT, "mcp", "hombresai-mcp.js"), node: process.execPath }
        };
      }
      var fxRefresh = null;
      var fxLastAttempt = 0;
      function refreshFx() {
        const fresh = config.fx && Date.now() - (config.fx.fetchedAt || 0) < FX_MAX_AGE_MS;
        if (fresh || fxRefresh || Date.now() - fxLastAttempt < FX_RETRY_MS) return fxRefresh || Promise.resolve();
        fxLastAttempt = Date.now();
        fxRefresh = httpRequest("GET", CNB_URL, { headers: { Accept: "text/plain" }, timeoutMs: 6e3 }).then(async (res) => {
          const lines = res.text.split(/\r?\n/);
          const usd = lines.map((line) => line.split("|")).find((cols) => cols[3] === "USD");
          const rate = usd ? parseFloat(usd[4].replace(",", ".")) / (parseInt(usd[2], 10) || 1) : NaN;
          if (res.status !== 200 || !(rate > 5 && rate < 100)) throw new Error("unexpected rate file format");
          config.fx = { usdCzk: rate, date: lines[0].split(" ")[0], fetchedAt: Date.now() };
          await saveConfig();
        }).catch((err) => console.warn("Couldn\u2019t load the CNB exchange rate, using the last known one:", err.message)).finally(() => {
          fxRefresh = null;
        });
        return fxRefresh;
      }
      var history = [];
      var historyWrites = Promise.resolve();
      async function loadHistory() {
        try {
          const data2 = JSON.parse(await fsp.readFile(HISTORY_FILE, "utf8"));
          if (!Array.isArray(data2)) throw new Error("unexpected format");
          history = data2;
        } catch (err) {
          if (err.code === "ENOENT") return;
          const backup = path.join(DATA_DIR, `history.broken-${Date.now()}.json`);
          await fsp.rename(HISTORY_FILE, backup).catch(() => {
          });
          console.warn(`history.json was corrupted (${err.message}), backup: ${backup}`);
        }
      }
      function saveHistory() {
        const data2 = JSON.stringify(history);
        historyWrites = historyWrites.then(() => fsp.mkdir(DATA_DIR, { recursive: true })).then(() => writeFileSafe(HISTORY_FILE, data2)).catch((err) => console.error("Couldn\u2019t save the history:", err.message));
        return historyWrites;
      }
      function publicItem(item) {
        const { localPath, ...rest } = item;
        return rest;
      }
      var memCache = /* @__PURE__ */ new Map();
      var memCacheBytes = 0;
      function cacheDelete(id) {
        const entry = memCache.get(id);
        if (!entry) return;
        memCacheBytes -= entry.buffer.length;
        memCache.delete(id);
      }
      function cachePut(id, buffer, mimeType) {
        cacheDelete(id);
        memCache.set(id, { buffer, mimeType });
        memCacheBytes += buffer.length;
        for (const oldId of memCache.keys()) {
          if (memCacheBytes <= MEM_CACHE_MAX_BYTES || memCache.size <= 1) break;
          cacheDelete(oldId);
        }
      }
      function cacheGet(id) {
        const entry = memCache.get(id);
        if (entry) {
          memCache.delete(id);
          memCache.set(id, entry);
        }
        return entry;
      }
      var GeminiError = class extends Error {
        constructor(status, apiError, fallbackMessage) {
          super(apiError?.message || fallbackMessage || `HTTP ${status}`);
          this.status = status;
          this.details = Array.isArray(apiError?.details) ? apiError.details : [];
        }
      };
      async function gemini(method, endpoint, { key, body, timeoutMs }) {
        let res;
        try {
          res = await httpRequest(method, `${API_BASE}/${endpoint}`, { headers: { "x-goog-api-key": key }, body, timeoutMs });
        } catch (err) {
          const error = new GeminiError(0, null, err.code === "ETIMEDOUT" ? "The Google API didn\u2019t respond in time." : `Couldn\u2019t connect to the Google API (${err.code || err.message}).`);
          error.network = true;
          throw error;
        }
        if (res.status < 200 || res.status >= 300) throw new GeminiError(res.status, res.json?.error, res.text.slice(0, 500));
        if (!res.json) throw new GeminiError(res.status, null, "The Google API returned an unreadable response.");
        return res.json;
      }
      async function listModels(key) {
        const models = [];
        let pageToken = "";
        for (let page = 0; page < 5; page++) {
          const query = `models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
          const json = await gemini("GET", query, { key, timeoutMs: 2e4 });
          models.push(...json.models || []);
          if (!json.nextPageToken) break;
          pageToken = json.nextPageToken;
        }
        return models;
      }
      var storeFieldSupported = true;
      async function generateContent(model, request2, key, timeoutMs) {
        const endpoint = `models/${model}:generateContent`;
        const body = storeFieldSupported ? { ...request2, store: Boolean(config.store) } : request2;
        try {
          return await gemini("POST", endpoint, { key, body, timeoutMs });
        } catch (err) {
          if (storeFieldSupported && err.status === 400 && /\bstore\b/i.test(err.message)) {
            storeFieldSupported = false;
            return gemini("POST", endpoint, { key, body: request2, timeoutMs });
          }
          throw err;
        }
      }
      function retryDelayMs(details) {
        const info = details.find((d) => String(d["@type"] || "").endsWith("RetryInfo"));
        const seconds = parseFloat(info?.retryDelay);
        return Number.isFinite(seconds) ? Math.ceil(seconds * 1e3) + 500 : void 0;
      }
      function describeError(err) {
        if (err.info) return err.info;
        if (err instanceof PollinationsError) return describePollinationsError(err);
        if (err instanceof CloudflareError) return describeCloudflareError(err);
        if (!(err instanceof GeminiError)) return { code: "internal", message: err.message || String(err) };
        const msg = err.message;
        const status = err.status;
        const all = `${msg} ${err.details.map((d) => d.reason || "").join(" ")}`;
        const base = { status, detail: msg };
        if (err.network) return { ...base, code: "network", message: msg, hint: "Check your internet connection.", retryable: true };
        if (/API_KEY_INVALID|API key not valid|API key expired|API_KEY_EXPIRED/i.test(all)) {
          return { ...base, code: "bad_key", message: "The API key is invalid or expired.", hint: "Make sure you copied the whole key from aistudio.google.com/apikey." };
        }
        if (/location is not supported/i.test(msg)) {
          return { ...base, code: "region", message: "The Gemini API isn\u2019t available from this location.", hint: "If you\u2019re using a VPN, try turning it off." };
        }
        if (status === 429 && /free.?tier|limit: 0\b/i.test(msg)) {
          return { ...base, code: "billing", message: "This model isn\u2019t available in the Free Tier.", hint: BILLING_HINT };
        }
        if (/BILLING_DISABLED|billing account|prepa(y|id)|credits? (are |have been )?(depleted|exhausted)|spend(ing)? cap/i.test(all)) {
          return { ...base, code: "billing", message: "There\u2019s a problem with billing or the project\u2019s credit.", hint: "Check billing and spending limits in Google AI Studio." };
        }
        if (status === 429) {
          const retryAfterMs = retryDelayMs(err.details);
          if (retryAfterMs && retryAfterMs > 12e4) {
            return { ...base, code: "quota", message: "Request quota exhausted.", hint: "Try again later, or check your tier\u2019s limits in AI Studio." };
          }
          return { ...base, code: "rate_limit", message: "Per-minute request limit exceeded.", hint: "I\u2019ll retry shortly. Lowering the concurrent requests in Settings helps too.", retryable: true, retryAfterMs };
        }
        if (status === 401 || status === 403) {
          return { ...base, code: "forbidden", message: "Access denied.", hint: "The key has no access to this model or project (check the key\u2019s restrictions and billing)." };
        }
        if (status === 404) {
          return { ...base, code: "model_not_found", message: "Model not found, or your key doesn\u2019t support it.", hint: "Pick a different model in the left panel." };
        }
        if (status === 400) return { ...base, code: "bad_request", message: "The Google API rejected the request.", hint: msg };
        if (status === 499 || status >= 500) {
          return { ...base, code: "server", message: "The Google API is overloaded or temporarily unavailable.", hint: "I\u2019ll retry.", retryable: true };
        }
        return { ...base, code: "unknown", message: msg };
      }
      function extractOutput(json) {
        const candidate = json?.candidates?.[0];
        const images = [];
        const texts = [];
        for (const part of candidate?.content?.parts || []) {
          if (part.thought) continue;
          const blob = part.inlineData || part.inline_data;
          if (blob?.data) images.push({ mimeType: blob.mimeType || blob.mime_type || "image/png", data: blob.data });
          else if (typeof part.text === "string") texts.push(part.text);
        }
        return { candidate, images, text: texts.join("\n").trim() };
      }
      function estimateCost(meta2, usage, imageSize, imageCount) {
        if (!meta2?.price) return null;
        const { image, input, textOut } = meta2.price;
        const perImage = image[imageSize] ?? image["1K"] ?? Object.values(image)[0];
        let cost = perImage * imageCount;
        if (usage) {
          const textTokens = (usage.candidatesTokensDetails || []).filter((d) => d.modality === "TEXT").reduce((sum, d) => sum + (d.tokenCount || 0), 0);
          cost += ((usage.promptTokenCount || 0) * input + ((usage.thoughtsTokenCount || 0) + textTokens) * textOut) / 1e6;
        }
        return Math.round(cost * 1e5) / 1e5;
      }
      async function loadRefFiles(refs, max) {
        const files = [];
        let total = 0;
        for (const [i, ref] of refs.slice(0, max).entries()) {
          const rel = String(ref?.path || "");
          if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, `Invalid reference #${i + 1}.`);
          let data2;
          try {
            data2 = await fsp.readFile(path.join(CACHE_DIR, rel));
          } catch {
            throw httpError(400, `Reference image #${i + 1} is no longer on this computer \u2013 add it again.`);
          }
          total += data2.length;
          if (total * 4 / 3 > MAX_INLINE_BYTES) {
            throw httpError(413, "The references are too large together (max 20 MB per request). Remove some.");
          }
          const ext = path.extname(rel).slice(1).toLowerCase();
          files.push({
            data: data2,
            ext,
            mimeType: MIME_BY_EXT[ext] || "image/jpeg",
            role: Object.hasOwn(REF_ROLES, ref.role) ? ref.role : "auto",
            dims: imageDimensions(data2)
          });
        }
        return files;
      }
      var refLabel = (file, i) => `Reference image ${i + 1}.${REF_ROLES[file.role] ? ` ${REF_ROLES[file.role]}` : ""}`;
      async function loadRefParts(refs, max) {
        const files = await loadRefFiles(refs, max);
        return files.flatMap((file, i) => [
          { text: refLabel(file, i) },
          { inlineData: { mimeType: file.mimeType, data: file.data.toString("base64") } }
        ]);
      }
      function cleanRefs(refs) {
        return (Array.isArray(refs) ? refs : []).slice(0, MAX_REFS).map((r) => ({
          path: String(r?.path || ""),
          role: Object.hasOwn(REF_ROLES, r?.role) ? r.role : "auto"
        }));
      }
      async function geminiGenerate(model, prompt, refs, { aspectRatio, imageSize, thinkingLevel }) {
        const key = requireApiKey();
        const parts = [...await loadRefParts(refs, MAX_REFS)];
        if (prompt) parts.push({ text: prompt });
        const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };
        const imageConfig = {};
        if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
        if (imageSize) imageConfig.imageSize = imageSize;
        if (Object.keys(imageConfig).length) generationConfig.imageConfig = imageConfig;
        if (thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel };
        const json = await generateContent(model, { contents: [{ role: "user", parts }], generationConfig }, key, GENERATE_TIMEOUT_MS);
        const { candidate, images, text } = extractOutput(json);
        if (!images.length) {
          const blockReason = json?.promptFeedback?.blockReason;
          const finish = candidate?.finishReason || "";
          if (blockReason || /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/.test(finish)) {
            throw Object.assign(new Error("blocked"), {
              httpStatus: 422,
              info: {
                code: "blocked",
                message: "Google\u2019s safety filter blocked the image.",
                hint: /RECITATION/.test(finish) ? "The result was too similar to an existing work. Try making the prompt more distinct." : "Adjust the prompt or references (typically real famous people, violence, nudity\u2026).",
                detail: [blockReason || finish, candidate?.finishMessage, text].filter(Boolean).join(" \u2013 ")
              }
            });
          }
          throw Object.assign(new Error("no_image"), {
            httpStatus: 422,
            info: {
              code: "no_image",
              message: "The model didn\u2019t return an image.",
              hint: text ? "The model replied with text only (see details). Phrase the prompt as a clear image request." : "Try again or adjust the prompt.",
              detail: [finish, text].filter(Boolean).join(" \u2013 "),
              retryable: !text
            }
          });
        }
        return { images, text, usageMetadata: json.usageMetadata };
      }
      var PollinationsError = class extends Error {
        constructor(res, message) {
          const json = res.json || {};
          super(message || json.error?.message || json.message || (typeof json.error === "string" ? json.error : "") || `HTTP ${res.status}`);
          this.status = res.status;
          this.httpStatus = 502;
          this.retryAfter = Number(res.headers?.["retry-after"]);
        }
      };
      var SIZE_BY_RATIO = {
        "1:1": [1024, 1024],
        "4:5": [896, 1120],
        "5:4": [1120, 896],
        "3:4": [864, 1152],
        "4:3": [1152, 864],
        "2:3": [832, 1248],
        "3:2": [1248, 832],
        "9:16": [768, 1344],
        "16:9": [1344, 768],
        "21:9": [1536, 656]
      };
      var round16 = (n) => Math.max(256, Math.round(n / 16) * 16);
      function sizeFor(aspectRatio, dims) {
        if (SIZE_BY_RATIO[aspectRatio]) return SIZE_BY_RATIO[aspectRatio];
        if (dims?.width && dims?.height) {
          const ratio = Math.min(4, Math.max(0.25, dims.width / dims.height));
          const height = Math.sqrt(1024 * 1024 / ratio);
          return [round16(height * ratio), round16(height)];
        }
        return [1024, 1024];
      }
      function sniffMime(buf) {
        if (buf[0] === 137 && buf[1] === 80) return "image/png";
        if (buf[0] === 255 && buf[1] === 216) return "image/jpeg";
        if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
        return "image/png";
      }
      function multipartBody(fields, files) {
        const boundary = `----hombresai${crypto.randomBytes(12).toString("hex")}`;
        const chunks = [];
        for (const [name, value] of Object.entries(fields)) {
          chunks.push(import_buffer.Buffer.from(`--${boundary}\r
Content-Disposition: form-data; name="${name}"\r
\r
${value}\r
`));
        }
        for (const file of files) {
          chunks.push(import_buffer.Buffer.from(`--${boundary}\r
Content-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r
Content-Type: ${file.mimeType}\r
\r
`));
          chunks.push(file.data, import_buffer.Buffer.from("\r\n"));
        }
        chunks.push(import_buffer.Buffer.from(`--${boundary}--\r
`));
        return { body: import_buffer.Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
      }
      async function pollinationsGenerate(meta2, prompt, refs, aspectRatio) {
        const key = config.pollinationsKey;
        if (!key) {
          throw httpError(401, "Open-source models need a free Pollinations API key \u2013 add it in Settings.", { code: "pollinations_key" });
        }
        if (refs.length && !meta2.refs) {
          throw httpError(400, `${meta2.label} can\u2019t use reference images \u2013 remove them or pick FLUX.2 klein or a Gemini model.`, { code: "bad_request" });
        }
        const seed = crypto.randomInt(1, 2147483647);
        const auth = { Authorization: `Bearer ${key}` };
        let res;
        try {
          if (refs.length) {
            const files = await loadRefFiles(refs, meta2.maxRefs || 4);
            const [width, height] = sizeFor(aspectRatio, files[0].dims);
            const form = multipartBody(
              {
                prompt: [...files.map(refLabel), "", prompt].join("\n").trim(),
                model: meta2.apiModel,
                size: `${width}x${height}`,
                seed: String(seed),
                response_format: "b64_json"
              },
              files.map((file, i) => ({ field: "image", filename: `reference-${i + 1}.${file.ext}`, mimeType: file.mimeType, data: file.data }))
            );
            res = await httpRequest("POST", `${POLLINATIONS_BASE}/v1/images/edits`, {
              raw: form.body,
              headers: { ...auth, "Content-Type": form.contentType },
              timeoutMs: 4 * 60 * 1e3
            });
          } else {
            const [width, height] = sizeFor(aspectRatio);
            res = await httpRequest("POST", `${POLLINATIONS_BASE}/v1/images/generations`, {
              body: { prompt, model: meta2.apiModel, size: `${width}x${height}`, seed, response_format: "b64_json" },
              headers: auth,
              timeoutMs: 4 * 60 * 1e3
            });
          }
        } catch (err) {
          if (err.info) throw err;
          const error = new PollinationsError({ status: 0 }, err.code === "ETIMEDOUT" ? "Pollinations didn\u2019t respond in time." : `Couldn\u2019t connect to Pollinations (${err.code || err.message}).`);
          error.network = true;
          throw error;
        }
        if (res.status !== 200) throw new PollinationsError(res);
        let b64 = res.json?.data?.[0]?.b64_json;
        if (!b64 && res.json?.data?.[0]?.url) {
          const image = await httpRequest("GET", res.json.data[0].url, { binary: true, timeoutMs: 6e4 }).catch(() => null);
          if (image?.status === 200) b64 = image.buffer.toString("base64");
        }
        if (!b64) {
          throw Object.assign(new Error("no_image"), {
            httpStatus: 422,
            info: { code: "no_image", message: "The model didn\u2019t return an image.", hint: "Try again or adjust the prompt.", retryable: true }
          });
        }
        return { images: [{ mimeType: sniffMime(import_buffer.Buffer.from(b64.slice(0, 32), "base64")), data: b64 }], text: "", usageMetadata: null };
      }
      function describePollinationsError(err) {
        const msg = err.message;
        const base = { status: err.status, detail: msg };
        const balance = /balance|pollen|insufficient|credit/i.test(msg);
        if (err.network) return { ...base, code: "network", message: msg, hint: "Check your internet connection.", retryable: true };
        if (err.status === 402 || [400, 401, 403].includes(err.status) && balance) {
          return { ...base, code: "pollinations_balance", message: "Not enough pollen on your Pollinations account.", hint: "The free models run on free pollen that refills over time \u2013 try again later, or top up at enter.pollinations.ai." };
        }
        if (err.status === 429) {
          const retryAfterMs = Number.isFinite(err.retryAfter) ? Math.min(err.retryAfter * 1e3 + 500, 9e4) : void 0;
          return { ...base, code: "rate_limit", message: "Pollinations rate limit reached.", hint: "I\u2019ll retry shortly.", retryable: true, retryAfterMs };
        }
        if (err.status === 401 || err.status === 403) {
          return { ...base, code: "pollinations_key", message: "The Pollinations API key is missing or invalid.", hint: "Create a free key at enter.pollinations.ai/keys and paste it in Settings \u2192 Open-source models." };
        }
        if (err.status === 400) return { ...base, code: "bad_request", message: "Pollinations rejected the request.", hint: msg };
        if (err.status >= 500) {
          if (/failed query|database/i.test(msg)) {
            return {
              ...base,
              code: "pollinations_outage",
              message: "Pollinations can\u2019t check API keys right now \u2013 an outage on their side, so the open-source models don\u2019t work.",
              hint: "Connect the free Cloudflare backup in Settings and the open-source models keep working \u2013 or use a Gemini model meanwhile."
            };
          }
          return { ...base, code: "server", message: "Pollinations or the model provider is temporarily unavailable.", hint: "I\u2019ll retry. If it keeps failing, try again later or use a Gemini model meanwhile.", retryable: true };
        }
        return { ...base, code: "unknown", message: msg };
      }
      var CLOUDFLARE_BASE = (define_process_env_default.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
      var CF_SCHNELL = "@cf/black-forest-labs/flux-1-schnell";
      var CF_KLEIN = "@cf/black-forest-labs/flux-2-klein-4b";
      var CF_CODER = "@cf/openai/gpt-oss-120b";
      var CF_REF_MAX_SIDE = 511;
      var CF_FALLBACK_CODES = /* @__PURE__ */ new Set(["pollinations_outage", "pollinations_balance", "pollinations_key", "server", "network", "rate_limit"]);
      var hasCloudflare = () => Boolean(config.cloudflare?.accountId && config.cloudflare?.token);
      var CloudflareError = class extends Error {
        constructor(res, message) {
          const json = res.json || {};
          const first = Array.isArray(json.errors) ? json.errors[0] : null;
          super(message || first?.message || json.error?.message || (typeof json.error === "string" ? json.error : "") || `HTTP ${res.status}`);
          this.status = res.status;
          this.httpStatus = 502;
          this.retryAfter = Number(res.headers?.["retry-after"]);
        }
      };
      function describeCloudflareError(err) {
        const msg = err.message;
        const base = { status: err.status, detail: msg };
        if (err.network) return { ...base, code: "network", message: msg, hint: "Check your internet connection.", retryable: true };
        if (/neuron|daily (free )?allocation|free allocation|quota/i.test(msg)) {
          cfQuotaUntil = (/* @__PURE__ */ new Date()).setUTCHours(24, 0, 0, 0);
          saveFreeLimits();
          return { ...base, code: "cloudflare_quota", message: "Today\u2019s free Cloudflare allowance is used up.", hint: "It renews at midnight UTC (1:00 in Czechia). Until then use a Gemini model." };
        }
        if (err.status === 401 || err.status === 403 || /authenticat|unauthori[sz]ed|permission/i.test(msg)) {
          return { ...base, code: "cloudflare_key", message: "Cloudflare refused the API token or Account ID.", hint: "Check them in Settings \u2192 Cloudflare \u2013 the token needs the \u201CWorkers AI\u201D permission." };
        }
        if (err.status === 429) {
          const retryAfterMs = Number.isFinite(err.retryAfter) ? Math.min(err.retryAfter * 1e3 + 500, 9e4) : void 0;
          return { ...base, code: "rate_limit", message: "Cloudflare rate limit reached.", hint: "I\u2019ll retry shortly.", retryable: true, retryAfterMs };
        }
        if (err.status >= 500) return { ...base, code: "server", message: "Cloudflare Workers AI is temporarily unavailable.", hint: "I\u2019ll retry.", retryable: true };
        if (err.status === 400) return { ...base, code: "bad_request", message: "Cloudflare rejected the request.", hint: msg };
        return { ...base, code: "unknown", message: msg };
      }
      async function cloudflareRequest(route, { body, raw, contentType, timeoutMs = 4 * 60 * 1e3 } = {}) {
        const { accountId, token } = config.cloudflare;
        let res;
        try {
          res = await httpRequest("POST", `${CLOUDFLARE_BASE}/accounts/${accountId}${route}`, {
            body,
            raw,
            headers: { Authorization: `Bearer ${token}`, ...contentType ? { "Content-Type": contentType } : {} },
            timeoutMs
          });
        } catch (err) {
          const error = new CloudflareError({ status: 0 }, err.code === "ETIMEDOUT" ? "Cloudflare didn\u2019t answer in time." : `Couldn\u2019t connect to Cloudflare (${err.code || err.message}).`);
          error.network = true;
          throw error;
        }
        if (res.status !== 200 || res.json?.success === false) throw new CloudflareError(res);
        return res;
      }
      async function verifyCloudflare(accountId, token) {
        let res;
        try {
          res = await httpRequest("GET", `${CLOUDFLARE_BASE}/accounts/${accountId}/ai/models/search?per_page=1`, {
            headers: { Authorization: `Bearer ${token}` },
            timeoutMs: 2e4
          });
        } catch (err) {
          throw httpError(502, `Couldn\u2019t reach Cloudflare (${err.code || err.message}).`, { code: "network" });
        }
        if (res.status === 200 && res.json?.success !== false) return { verified: true, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
        const reason = res.json?.errors?.[0]?.message || `HTTP ${res.status}`;
        if ([400, 401, 403, 404].includes(res.status)) {
          throw httpError(400, `Cloudflare doesn\u2019t accept this Account ID or API token (${reason}).`, {
            code: "cloudflare_key",
            hint: "Copy the Account ID from the Cloudflare dashboard and create the token with the \u201CWorkers AI\u201D template."
          });
        }
        throw httpError(502, `Cloudflare didn\u2019t confirm the token (${reason}).`, { code: "server", retryable: true });
      }
      async function loadCloudflareRefs(refs) {
        const files = [];
        for (const [i, ref] of refs.slice(0, 4).entries()) {
          const rel = String(ref?.path || "");
          if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, `Invalid reference #${i + 1}.`);
          const small = path.join(CACHE_DIR, rel.replace(/\.[^.]+$/, ".small.jpg"));
          let data2 = await fsp.readFile(small).catch(() => null);
          if (!data2) {
            data2 = await fsp.readFile(path.join(CACHE_DIR, rel)).catch(() => null);
            if (!data2) throw httpError(400, `Reference image #${i + 1} is no longer on this computer \u2013 add it again.`);
            const dims = imageDimensions(data2);
            if (!dims || Math.max(dims.width, dims.height) > CF_REF_MAX_SIDE) {
              throw httpError(400, `Reference image #${i + 1} was added before the Cloudflare backup existed.`, {
                code: "bad_request",
                hint: "Remove it and add it again \u2013 the app then also keeps the small copy Cloudflare needs."
              });
            }
          }
          files.push({ data: data2, dims: imageDimensions(data2), mimeType: sniffMime(data2), role: Object.hasOwn(REF_ROLES, ref.role) ? ref.role : "auto" });
        }
        return files;
      }
      async function cloudflareGenerate(meta2, prompt, refs, aspectRatio) {
        const square = !aspectRatio || aspectRatio === "1:1";
        const schnell = meta2.id === "os-flux1-schnell" && !refs.length && square;
        let res;
        if (schnell) {
          res = await cloudflareRequest(`/ai/run/${CF_SCHNELL}`, { body: { prompt: prompt.slice(0, 2048), steps: 6 } });
        } else {
          const files = await loadCloudflareRefs(refs);
          const [width, height] = sizeFor(aspectRatio, files[0]?.dims);
          const form = multipartBody(
            {
              prompt: [...files.map(refLabel), "", prompt].join("\n").trim().slice(0, 2048),
              width: String(Math.min(1920, width)),
              height: String(Math.min(1920, height)),
              seed: String(crypto.randomInt(1, 2147483647))
            },
            files.map((file, i) => ({ field: `input_image_${i}`, filename: `reference-${i + 1}.jpg`, mimeType: file.mimeType, data: file.data }))
          );
          res = await cloudflareRequest(`/ai/run/${CF_KLEIN}`, { raw: form.body, contentType: form.contentType });
        }
        const b64 = res.json?.result?.image || res.json?.image;
        if (!b64) {
          throw Object.assign(new Error("no_image"), {
            httpStatus: 422,
            info: { code: "no_image", message: "Cloudflare didn\u2019t return an image.", hint: "Try again or adjust the prompt.", retryable: true }
          });
        }
        return { images: [{ mimeType: sniffMime(import_buffer.Buffer.from(b64.slice(0, 32), "base64")), data: b64 }], text: "", usageMetadata: null, via: "cloudflare" };
      }
      async function cloudflareChat(system, user, maxTokens, model = CF_CODER) {
        const res = await cloudflareRequest("/ai/v1/chat/completions", {
          body: { model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.3, max_tokens: maxTokens }
        });
        const content = res.json?.choices?.[0]?.message?.content;
        return Array.isArray(content) ? content.map((part) => part?.text || "").join("") : String(content || "");
      }
      var OPEN_FALLBACK_CODES = /* @__PURE__ */ new Set([...CF_FALLBACK_CODES, "cloudflare_key", "cloudflare_quota"]);
      var pollinationsPausedUntil = 0;
      async function openGenerate(meta2, prompt, refs, aspectRatio) {
        if (meta2.hfOnly) return hfImageGenerate(meta2, prompt, refs, aspectRatio);
        const routes2 = [
          config.pollinationsKey && Date.now() > pollinationsPausedUntil && ["Pollinations", pollinationsGenerate],
          hasCloudflare() && ["Cloudflare Workers AI", cloudflareGenerate],
          ["Hugging Face", hfImageGenerate]
        ].filter(Boolean);
        for (const [i, [name, run]] of routes2.entries()) {
          try {
            return await run(meta2, prompt, refs, aspectRatio);
          } catch (err) {
            const info = err.info || describeError(err);
            if (i === routes2.length - 1 || !OPEN_FALLBACK_CODES.has(info.code)) throw err;
            if (name === "Pollinations" && ["pollinations_balance", "pollinations_outage"].includes(info.code)) pollinationsPausedUntil = Date.now() + 10 * 60 * 1e3;
            if (info.code === "pollinations_balance") notePollen(0);
            console.log(`  ! ${name}: ${info.message} \u2192 ${routes2[i + 1][0]}`);
          }
        }
      }
      var DriveError = class extends Error {
        constructor(message, code = "drive") {
          super(message);
          this.httpStatus = 502;
          this.info = { code, message };
        }
      };
      var serverPort = BASE_PORT;
      var driveToken = null;
      var driveLastError = null;
      var driveFolderChecked = false;
      var oauthStates = /* @__PURE__ */ new Map();
      var redirectUri = () => `http://${HOST}:${serverPort}/oauth/callback`;
      function driveStatus() {
        const d = config.drive;
        return {
          configured: Boolean(d.clientId && d.clientSecret),
          connected: Boolean(d.refreshToken),
          email: d.email || null,
          clientId: d.clientId || "",
          folderUrl: d.folderId ? `https://drive.google.com/drive/folders/${d.folderId}` : null,
          pending: history.filter((i) => i.pending).length,
          error: driveLastError
        };
      }
      function oauthStart(res) {
        const d = config.drive;
        if (!d.clientId || !d.clientSecret) return redirect(res, "/?drive=missing_client");
        for (const [state2, entry] of oauthStates) if (Date.now() - entry.at > 15 * 60 * 1e3) oauthStates.delete(state2);
        const state = base64url(crypto.randomBytes(16));
        const verifier = base64url(crypto.randomBytes(32));
        oauthStates.set(state, { verifier, at: Date.now() });
        const params = new URLSearchParams({
          client_id: d.clientId,
          redirect_uri: redirectUri(),
          response_type: "code",
          scope: DRIVE_SCOPE,
          access_type: "offline",
          prompt: "consent",
          state,
          code_challenge: base64url(crypto.createHash("sha256").update(verifier).digest()),
          code_challenge_method: "S256"
        });
        return redirect(res, `${GOOGLE.auth}?${params}`);
      }
      async function oauthCallback(url, res) {
        const state = url.searchParams.get("state");
        const pending = state ? oauthStates.get(state) : null;
        if (state) oauthStates.delete(state);
        if (url.searchParams.get("error")) return redirect(res, "/?drive=denied");
        if (!pending) return redirect(res, "/?drive=expired");
        const d = config.drive;
        try {
          const r = await httpRequest("POST", GOOGLE.token, {
            ...formBody({
              code: url.searchParams.get("code") || "",
              client_id: d.clientId,
              client_secret: d.clientSecret,
              redirect_uri: redirectUri(),
              grant_type: "authorization_code",
              code_verifier: pending.verifier
            }),
            timeoutMs: 2e4
          });
          if (r.status !== 200 || !r.json?.refresh_token) throw new Error(r.json?.error_description || r.json?.error || `HTTP ${r.status}`);
          d.refreshToken = r.json.refresh_token;
          driveToken = { accessToken: r.json.access_token, expiresAt: Date.now() + (r.json.expires_in || 3600) * 1e3 };
          driveLastError = null;
          driveFolderChecked = false;
          try {
            const about = await driveRequest("GET", `${GOOGLE.drive}/about?fields=user(emailAddress)`);
            d.email = about.json?.user?.emailAddress || null;
          } catch {
          }
          await saveConfig();
          console.log(`  Google Drive connected${d.email ? ` (${d.email})` : ""}.`);
          scheduleUploads();
          return redirect(res, "/?drive=connected");
        } catch (err) {
          console.warn("Connecting Google Drive failed:", err.message);
          return redirect(res, `/?drive=error&reason=${encodeURIComponent(err.message.slice(0, 200))}`);
        }
      }
      async function driveAccessToken() {
        const d = config.drive;
        if (!d.refreshToken) throw new DriveError("Google Drive isn\u2019t connected \u2013 connect it in Settings.", "drive_disconnected");
        if (driveToken && Date.now() < driveToken.expiresAt - 6e4) return driveToken.accessToken;
        let r;
        try {
          r = await httpRequest("POST", GOOGLE.token, {
            ...formBody({ client_id: d.clientId, client_secret: d.clientSecret, refresh_token: d.refreshToken, grant_type: "refresh_token" }),
            timeoutMs: 2e4
          });
        } catch (err) {
          throw new DriveError(`Couldn\u2019t connect to Google (${err.code || err.message}).`, "drive_network");
        }
        if (r.status !== 200 || !r.json?.access_token) {
          if (["invalid_grant", "invalid_client", "unauthorized_client"].includes(r.json?.error)) {
            d.refreshToken = null;
            await saveConfig();
            throw new DriveError("Google Drive access expired or was revoked \u2013 reconnect Drive in Settings.", "drive_disconnected");
          }
          throw new DriveError(`Google refused to renew Drive access (${r.json?.error || r.status}).`);
        }
        driveToken = { accessToken: r.json.access_token, expiresAt: Date.now() + (r.json.expires_in || 3600) * 1e3 };
        return driveToken.accessToken;
      }
      async function driveRequest(method, url, opts = {}) {
        for (let attempt = 0; ; attempt++) {
          const token = await driveAccessToken();
          let res;
          try {
            res = await httpRequest(method, url, { timeoutMs: 6e4, ...opts, headers: { Authorization: `Bearer ${token}`, ...opts.headers || {} } });
          } catch (err) {
            throw new DriveError(`Couldn\u2019t connect to Google Drive (${err.code || err.message}).`, "drive_network");
          }
          if (res.status === 401 && attempt === 0) {
            driveToken = null;
            continue;
          }
          return res;
        }
      }
      function driveFail(res, what) {
        const msg = res.json?.error?.message || `HTTP ${res.status}`;
        if (res.status === 403 && /storage|quota/i.test(msg)) return new DriveError("Google Drive is out of storage.", "drive_full");
        return new DriveError(`${what}: ${msg}`);
      }
      async function findOrCreateFolder(name, parentId) {
        const q = `mimeType='${FOLDER_MIME}' and name='${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
        const list2 = await driveRequest("GET", `${GOOGLE.drive}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
        if (list2.status !== 200) throw driveFail(list2, "Looking up a folder on Drive failed");
        if (list2.json?.files?.length) return list2.json.files[0].id;
        const created = await driveRequest("POST", `${GOOGLE.drive}/files?fields=id`, { body: { name, mimeType: FOLDER_MIME, parents: [parentId] } });
        if (created.status !== 200) throw driveFail(created, "Creating a folder on Drive failed");
        return created.json.id;
      }
      async function dayFolderId(day) {
        const d = config.drive;
        if (d.folderId && !driveFolderChecked) {
          const r = await driveRequest("GET", `${GOOGLE.drive}/files/${encodeURIComponent(d.folderId)}?fields=id,trashed`);
          if (r.status !== 200 || r.json?.trashed) {
            d.folderId = null;
            d.dayFolders = {};
          }
          driveFolderChecked = true;
        }
        if (!d.folderId) {
          d.folderId = await findOrCreateFolder(DRIVE_FOLDER, "root");
          d.dayFolders = {};
          driveFolderChecked = true;
          await saveConfig();
        }
        if (!d.dayFolders?.[day]) {
          d.dayFolders = { ...d.dayFolders, [day]: await findOrCreateFolder(day, d.folderId) };
          await saveConfig();
        }
        return d.dayFolders[day];
      }
      async function driveUpload(item, buffer) {
        for (let attempt = 0; attempt < 2; attempt++) {
          const parent = await dayFolderId(item.day);
          const init = await driveRequest("POST", `${GOOGLE.upload}/files?uploadType=resumable&fields=id,webViewLink`, {
            body: { name: item.name, parents: [parent], mimeType: item.mimeType, description: String(item.userPrompt || item.prompt || "").slice(0, 4e3) },
            headers: { "X-Upload-Content-Type": item.mimeType, "X-Upload-Content-Length": String(buffer.length) }
          });
          if (init.status === 404 && attempt === 0) {
            config.drive.dayFolders = {};
            driveFolderChecked = false;
            continue;
          }
          if (init.status !== 200 || !init.headers.location) throw driveFail(init, "Upload to Drive failed");
          const put = await driveRequest("PUT", init.headers.location, { raw: buffer, headers: { "Content-Type": item.mimeType }, timeoutMs: 5 * 60 * 1e3 });
          if (put.status !== 200 && put.status !== 201) throw driveFail(put, "Upload to Drive failed");
          return { id: put.json.id, link: put.json.webViewLink || `https://drive.google.com/file/d/${put.json.id}/view` };
        }
        throw new DriveError("Couldn\u2019t create the folder on Google Drive.");
      }
      async function driveTrash(fileId) {
        const r = await driveRequest("PATCH", `${GOOGLE.drive}/files/${encodeURIComponent(fileId)}`, { body: { trashed: true } });
        if (r.status !== 200 && r.status !== 404) throw driveFail(r, "Moving to the Drive trash failed");
      }
      var uploadChain = Promise.resolve();
      var uploadQueued = false;
      function scheduleUploads() {
        if (uploadQueued) return uploadChain;
        uploadQueued = true;
        uploadChain = uploadChain.then(() => {
          uploadQueued = false;
          return processUploads();
        }).catch((err) => console.warn("Uploading to Google Drive:", err.message));
        return uploadChain;
      }
      async function processUploads() {
        if (!config.drive.refreshToken) return;
        let changed = false;
        for (const item of history.filter((i) => i.pending)) {
          if (!history.includes(item)) continue;
          try {
            const buffer = cacheGet(item.id)?.buffer || await fsp.readFile(item.localPath);
            const uploaded = await driveUpload(item, buffer);
            if (!history.includes(item)) {
              await driveTrash(uploaded.id).catch(() => {
              });
              continue;
            }
            const local = item.localPath;
            item.drive = uploaded;
            delete item.pending;
            delete item.localPath;
            delete item.uploadError;
            cachePut(item.id, buffer, item.mimeType);
            changed = true;
            driveLastError = null;
            if (local) await fsp.unlink(local).catch(() => {
            });
            console.log(`  \u2601 ${item.name} \u2192 Google Drive`);
          } catch (err) {
            item.uploadError = err.code === "ENOENT" ? "The image file is no longer on this computer." : err.info?.message || err.message;
            driveLastError = item.uploadError;
            changed = true;
            if (["drive_disconnected", "drive_network", "drive_full"].includes(err.info?.code)) break;
          }
        }
        if (changed) await saveHistory();
        if (!history.some((i) => i.localPath?.startsWith(LEGACY_OUTPUT_DIR + path.sep))) await removeEmptyDirs(LEGACY_OUTPUT_DIR);
      }
      async function migrateLegacyOutput() {
        if (!fs.existsSync(LEGACY_OUTPUT_DIR)) return;
        await moveFiles(path.join(LEGACY_OUTPUT_DIR, "refs"), REFS_DIR);
        await moveFiles(path.join(LEGACY_OUTPUT_DIR, "thumbs"), THUMBS_DIR);
        const legacyHistory = path.join(LEGACY_OUTPUT_DIR, "history.json");
        let items;
        try {
          items = JSON.parse(await fsp.readFile(legacyHistory, "utf8"));
        } catch {
          items = null;
        }
        if (!Array.isArray(items)) {
          await removeEmptyDirs(LEGACY_OUTPUT_DIR);
          return;
        }
        const known = new Set(history.map((i) => i.id));
        let imported = 0;
        for (const item of items) {
          if (known.has(item.id) || typeof item.file !== "string") continue;
          const { file, thumb, ...rest } = item;
          const [, day, name] = file.split("/");
          history.push({
            ...rest,
            day: day || localDay(new Date(item.createdAt)),
            name: name || path.basename(file),
            thumb: Boolean(thumb),
            pending: true,
            localPath: path.join(LEGACY_OUTPUT_DIR, file)
          });
          imported++;
        }
        history.sort((a, b) => a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
        await saveHistory();
        await historyWrites;
        await fsp.unlink(legacyHistory).catch(() => {
        });
        if (imported) console.log(`  Imported ${imported} images from the output folder \u2013 they\u2019ll move to Google Drive once it\u2019s connected.`);
      }
      async function verifyPollinationsKey(key) {
        const headers = { Authorization: `Bearer ${key}` };
        let res;
        try {
          res = await httpRequest("GET", `${POLLINATIONS_BASE}/account/key`, { headers, timeoutMs: 15e3 });
        } catch {
          return { verified: false };
        }
        if (res.status === 401 || res.status === 403 || res.json?.valid === false) {
          throw httpError(400, "Pollinations doesn\u2019t accept this key. Copy the whole secret key (sk_\u2026) from enter.pollinations.ai/keys.", { code: "pollinations_key" });
        }
        if (res.status !== 200 || !res.json) return { verified: false };
        if (res.json.type === "publishable") {
          throw httpError(400, "That\u2019s a publishable key (pk_\u2026) \u2013 create a secret key (sk_\u2026) at enter.pollinations.ai/keys.", { code: "pollinations_key" });
        }
        const models = res.json.permissions?.models;
        const allows = (kind) => !Array.isArray(models) || models.includes(kind);
        const info = {
          verified: true,
          keyName: typeof res.json.name === "string" ? res.json.name.slice(0, 60) : null,
          expiresAt: typeof res.json.expiresAt === "string" ? res.json.expiresAt : null,
          images: allows("image"),
          text: allows("text"),
          balance: Number.isFinite(res.json.pollenBudget) ? res.json.pollenBudget : null
        };
        if (info.balance == null) {
          const bal = await httpRequest("GET", `${POLLINATIONS_BASE}/account/balance`, { headers, timeoutMs: 15e3 }).catch(() => null);
          if (bal?.status === 200 && Number.isFinite(bal.json?.balance)) info.balance = bal.json.balance;
        }
        console.log(`  \u2713 Pollinations key verified${info.keyName ? ` (\u201C${info.keyName}\u201D)` : ""}${info.balance != null ? ` \u2013 ${info.balance} pollen` : ""}`);
        return info;
      }
      async function handleConfig(body) {
        if (typeof body.apiKey === "string") {
          const key = body.apiKey.trim();
          if (key) {
            try {
              await listModels(key);
            } catch (err) {
              const info = describeError(err);
              if (["bad_key", "forbidden", "region"].includes(info.code)) throw Object.assign(new Error(info.message), { httpStatus: 400, info });
            }
          }
          config.apiKey = key;
          modelCache = null;
        }
        if (typeof body.enhanceModel === "string") {
          const model = body.enhanceModel.trim();
          if (model && !MODEL_ID_RE.test(model)) throw httpError(400, "Invalid model name.");
          config.enhanceModel = model || DEFAULT_SETTINGS.enhanceModel;
        }
        if (body.concurrency !== void 0) {
          config.concurrency = clamp(parseInt(body.concurrency, 10) || DEFAULT_SETTINGS.concurrency, 1, 8);
        }
        if (typeof body.store === "boolean") config.store = body.store;
        if (typeof body.vat === "boolean") config.vat = body.vat;
        if (typeof body.pollinationsKey === "string") {
          const key = body.pollinationsKey.trim();
          if (key && (key.length < 10 || /\s/.test(key))) throw httpError(400, "That doesn\u2019t look like a Pollinations API key (it starts with \u201Csk_\u201D).");
          config.pollinationsInfo = key ? await verifyPollinationsKey(key) : null;
          config.pollinationsKey = key;
          pollinationsPausedUntil = 0;
          modelCache = null;
        }
        if (typeof body.cloudflareAccountId === "string" || typeof body.cloudflareToken === "string") {
          const accountId = String(body.cloudflareAccountId ?? config.cloudflare?.accountId ?? "").trim();
          const token = String(body.cloudflareToken ?? config.cloudflare?.token ?? "").trim();
          if (!accountId && !token) {
            delete config.cloudflare;
            delete config.cloudflareInfo;
          } else {
            if (!/^[0-9a-f]{32}$/i.test(accountId)) throw httpError(400, "The Account ID has 32 characters (0\u20139, a\u2013f) \u2013 copy it from the Cloudflare dashboard.", { code: "cloudflare_key" });
            if (!/^[\w-]{30,100}$/.test(token)) throw httpError(400, "That doesn\u2019t look like a Cloudflare API token \u2013 create one with the \u201CWorkers AI\u201D template and copy it whole.", { code: "cloudflare_key" });
            config.cloudflareInfo = await verifyCloudflare(accountId, token);
            config.cloudflare = { accountId, token };
          }
          modelCache = null;
        }
        if (typeof body.hfToken === "string") {
          const token = body.hfToken.trim();
          if (!token) {
            delete config.hfToken;
            delete config.hfInfo;
          } else {
            if (!/^hf_[A-Za-z0-9]{20,}$/.test(token)) throw httpError(400, "That doesn\u2019t look like a Hugging Face token (it starts with \u201Chf_\u201D).", { code: "hf_token" });
            config.hfInfo = await verifyHfToken(token);
            config.hfToken = token;
          }
        }
        if (typeof body.driveClientId === "string" || typeof body.driveClientSecret === "string") {
          const d = config.drive;
          const clientId = typeof body.driveClientId === "string" ? body.driveClientId.trim() : d.clientId || "";
          const clientSecret = typeof body.driveClientSecret === "string" && body.driveClientSecret.trim() ? body.driveClientSecret.trim() : d.clientSecret || "";
          if (clientId && !/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
            throw httpError(400, "The Client ID should look like \u201C\u2026.apps.googleusercontent.com\u201D.");
          }
          if (clientId !== d.clientId || clientSecret !== d.clientSecret) {
            config.drive = { ...d, clientId, clientSecret, refreshToken: null, email: null };
            driveToken = null;
          }
        }
        if (typeof body.connectOrigin === "string") {
          const raw = body.connectOrigin.trim();
          if (!raw) {
            delete config.connectOrigin;
          } else {
            let origin;
            try {
              const u = new URL(raw);
              if (!["http:", "https:"].includes(u.protocol) || u.pathname !== "/" || u.search || u.hash) throw new Error("bad");
              origin = u.origin;
            } catch {
              throw httpError(400, "Enter the address of your onestoapp site, like https://yoursite.com (no path).");
            }
            config.connectOrigin = origin;
          }
        }
        await saveConfig();
        return publicConfig();
      }
      async function handleDriveDisconnect() {
        const token = config.drive.refreshToken;
        config.drive.refreshToken = null;
        config.drive.email = null;
        driveToken = null;
        await saveConfig();
        if (token) await httpRequest("POST", GOOGLE.revoke, { ...formBody({ token }), timeoutMs: 1e4 }).catch(() => {
        });
        return publicConfig();
      }
      var modelCache = null;
      async function handleModels() {
        const base = KNOWN_MODELS.map((m) => ({ ...m, known: true, available: null }));
        const routes2 = freeRoutesNow();
        const open = [FREE_AUTO_MODEL, ...OPEN_MODELS, ...freeImageModels()].map((m) => ({ ...m, availableNow: availableNow(m, routes2) })).map(({ found, ...m }) => ({ ...m, known: true, available: null, keyMissing: false }));
        const freeStatus = freeStatusNow();
        const { key } = getApiKey();
        if (!key) return { models: [...base, ...open], source: "static", freeStatus };
        if (modelCache && modelCache.key === key && Date.now() - modelCache.at < MODEL_CACHE_MS) return { ...modelCache.value, models: [...modelCache.value.models, ...open], freeStatus };
        try {
          const imageModels = (await listModels(key)).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent") && /image|banana/i.test(m.name || "") && !/imagen|veo|video|embed|tts/i.test(m.name || ""));
          const ids = new Set(imageModels.map((m) => m.name.replace(/^models\//, "")));
          const models = base.map((m) => ({ ...m, available: ids.has(m.id) }));
          for (const m of imageModels) {
            const id = m.name.replace(/^models\//, "");
            if (KNOWN_BY_ID.has(id) || HIDDEN_MODEL_IDS.has(id) || !MODEL_ID_RE.test(id) || isAliasOfKnown(id, m.displayName)) continue;
            models.push({
              id,
              label: m.displayName || id,
              desc: m.description || "An image model found in your account.",
              ratios: RATIOS_STD,
              sizes: [],
              thinking: null,
              refsHint: "",
              price: null,
              known: false,
              available: true,
              provider: "gemini",
              refs: true,
              maxRefs: MAX_REFS
            });
          }
          const value = { models, source: "api" };
          modelCache = { key, at: Date.now(), value };
          return { ...value, models: [...models, ...open], freeStatus };
        } catch (err) {
          return { models: [...base, ...open], source: "static", warning: describeError(err).message, freeStatus };
        }
      }
      async function stashImage(buf, mimeType, now, slug) {
        const id = `${now.getTime().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
        const ext = mimeType === "image/svg+xml" ? "svg" : VIDEO_MIME_EXT[mimeType] || EXT_BY_MIME[mimeType] || "png";
        const localPath = path.join(PENDING_DIR, `${id}.${ext}`);
        await fsp.mkdir(PENDING_DIR, { recursive: true });
        await fsp.writeFile(localPath, buf);
        cachePut(id, buf, mimeType);
        const dims = imageDimensions(buf) || {};
        return { id, localPath, name: `${localTime(now)}-${slug}-${id.slice(-6)}.${ext}`, width: dims.width, height: dims.height, bytes: buf.length };
      }
      async function handleGenerate(body) {
        const model = String(body.model || "");
        if (!MODEL_ID_RE.test(model)) throw httpError(400, "Invalid model.");
        const meta2 = MODELS_BY_ID.get(model) || freeModelMeta(model);
        const prompt = String(body.prompt || "").trim().slice(0, MAX_PROMPT_CHARS);
        const refs = cleanRefs(body.refs);
        if (!prompt && !refs.length) throw httpError(400, "Write a prompt or add a reference.");
        const aspectRatio = RATIOS_ALL.includes(body.aspectRatio) ? body.aspectRatio : null;
        const imageSize = IMAGE_SIZES.includes(body.imageSize) ? body.imageSize : null;
        const thinkingLevel = THINKING_LEVELS.includes(body.thinkingLevel) ? body.thinkingLevel : null;
        const started2 = Date.now();
        let result2;
        try {
          result2 = meta2?.open ? await freeGenerate(meta2, prompt, refs, aspectRatio) : await geminiGenerate(model, prompt, refs, { aspectRatio, imageSize, thinkingLevel });
        } catch (err) {
          console.log(`  \u2717 ${model}: ${String(err.info?.message || err.message).split("\n")[0].slice(0, 160)}`);
          throw err;
        }
        const durationMs = Date.now() - started2;
        const { images, text, usageMetadata } = result2;
        const callCost = estimateCost(meta2, usageMetadata, imageSize || "1K", images.length);
        const now = /* @__PURE__ */ new Date();
        const day = localDay(now);
        const slug = slugify(body.userPrompt || prompt) || "image";
        const batchId = /^[\w-]{1,64}$/.test(String(body.batchId || "")) ? String(body.batchId) : null;
        const batchCreatedAt = typeof body.batchCreatedAt === "string" && !Number.isNaN(Date.parse(body.batchCreatedAt)) ? body.batchCreatedAt : now.toISOString();
        const usage = usageMetadata ? {
          prompt: usageMetadata.promptTokenCount,
          output: usageMetadata.candidatesTokenCount,
          thoughts: usageMetadata.thoughtsTokenCount
        } : void 0;
        const items = [];
        for (const [i, image] of images.entries()) {
          const file = await stashImage(import_buffer.Buffer.from(image.data, "base64"), image.mimeType, now, slug);
          items.push({
            id: file.id,
            via: result2.via,
            batchId: batchId || file.id,
            batchCreatedAt,
            index: (Number(body.index) || 0) + i / 10,
            createdAt: now.toISOString(),
            model: result2.model || model,
            // “Best free (auto)” says which model made it
            prompt,
            userPrompt: String(body.userPrompt ?? prompt).slice(0, MAX_PROMPT_CHARS),
            style: typeof body.style === "string" ? body.style.slice(0, 80) : null,
            styleId: typeof body.styleId === "string" ? body.styleId.slice(0, 40) : null,
            nodes: cleanNodesMeta(body.nodes),
            aspectRatio: aspectRatio || "auto",
            imageSize,
            thinkingLevel,
            refs,
            day,
            name: file.name,
            mimeType: image.mimeType,
            width: file.width,
            height: file.height,
            bytes: file.bytes,
            durationMs,
            cost: callCost == null ? null : Math.round(callCost / images.length * 1e5) / 1e5,
            usage,
            text: text || void 0,
            pending: true,
            localPath: file.localPath
          });
        }
        history.unshift(...items);
        await saveHistory();
        scheduleUploads();
        console.log(`  \u2713 ${result2.model || model} \xB7 ${imageSize || "\u2013"} \xB7 ${aspectRatio || "auto"} \xB7 ${(durationMs / 1e3).toFixed(1)} s${refs.length ? ` \xB7 ${refs.length} ref.` : ""}`);
        return { items: items.map(publicItem) };
      }
      function cleanEnhancedPrompt(text) {
        let out = text.trim().replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "").replace(/^\s*(final\s+)?prompt\s*:\s*/i, "").trim();
        if (/^"[^"]*"$/.test(out) || /^“[^”]*”$/.test(out)) out = out.slice(1, -1).trim();
        return out;
      }
      async function handleEnhance(body) {
        const key = requireApiKey();
        const idea = String(body.prompt || "").trim().slice(0, MAX_PROMPT_CHARS);
        if (!idea) throw httpError(400, "Write an idea to enhance first.");
        const parts = [
          ...await loadRefParts(cleanRefs(body.refs), 6),
          { text: `User's idea (may be written in Czech or another language):
${idea}` }
        ];
        const request2 = { systemInstruction: { parts: [{ text: ENHANCE_SYSTEM }] }, contents: [{ role: "user", parts }] };
        const candidates = [...new Set([config.enhanceModel, ...ENHANCE_MODELS].filter(Boolean))];
        let lastError;
        for (const model of candidates) {
          try {
            const { text } = extractOutput(await generateContent(model, request2, key, 9e4));
            if (!text) throw new GeminiError(200, null, "The model returned no text.");
            return { prompt: cleanEnhancedPrompt(text), model };
          } catch (err) {
            lastError = err;
            const missing = err.status === 404 || err.status === 400 && /not found|not supported|unsupported/i.test(err.message);
            if (!missing) throw err;
          }
        }
        throw lastError;
      }
      async function handleRefUpload(body) {
        const ext = EXT_BY_MIME[String(body.mimeType || "").toLowerCase()];
        if (!ext) throw httpError(415, "Gemini doesn\u2019t support this image format.");
        const buf = import_buffer.Buffer.from(String(body.data || ""), "base64");
        if (buf.length < 32) throw httpError(400, "Empty image.");
        const name = `${crypto.createHash("sha256").update(buf).digest("hex").slice(0, 24)}.${ext}`;
        const file = path.join(REFS_DIR, name);
        if (!fs.existsSync(file)) {
          await fsp.mkdir(REFS_DIR, { recursive: true });
          await fsp.writeFile(file, buf);
        }
        const small = typeof body.small === "string" ? import_buffer.Buffer.from(body.small, "base64") : null;
        const smallDims = small && sniffMime(small) === "image/jpeg" ? imageDimensions(small) : null;
        if (smallDims && Math.max(smallDims.width, smallDims.height) <= CF_REF_MAX_SIDE) {
          const smallFile = path.join(REFS_DIR, name.replace(/\.[^.]+$/, ".small.jpg"));
          if (!fs.existsSync(smallFile)) await fsp.writeFile(smallFile, small);
        }
        return { path: `refs/${name}`, url: `/refs/${name}` };
      }
      function findItem(id) {
        const item = history.find((it) => it.id === id);
        if (!item) throw httpError(404, "Image not found.");
        return item;
      }
      async function handlePatch(id, body) {
        const item = findItem(id);
        if (typeof body.favorite === "boolean") item.favorite = body.favorite;
        const seconds = Number(body.duration);
        if (/^video\//.test(item.mimeType || "") && !item.duration && Number.isFinite(seconds) && seconds > 0 && seconds < 36e3) item.duration = Math.round(seconds * 1e3) / 1e3;
        await saveHistory();
        return { item: publicItem(item) };
      }
      async function handleThumb(id, body) {
        const item = findItem(id);
        const buf = import_buffer.Buffer.from(String(body.data || ""), "base64");
        if (buf.length < 100 || buf[0] !== 255 || buf[1] !== 216) throw httpError(400, "Invalid thumbnail.");
        await fsp.mkdir(THUMBS_DIR, { recursive: true });
        await fsp.writeFile(path.join(THUMBS_DIR, `${id}.jpg`), buf);
        item.thumb = true;
        await saveHistory();
        return { thumb: true };
      }
      async function handleDelete(body) {
        const ids = new Set((Array.isArray(body.ids) ? body.ids : []).map(String));
        const removed = history.filter((it) => ids.has(it.id));
        history = history.filter((it) => !ids.has(it.id));
        await saveHistory();
        let driveFailed = 0;
        for (const item of removed) {
          cacheDelete(item.id);
          if (item.localPath) await fsp.unlink(item.localPath).catch(() => {
          });
          await fsp.unlink(path.join(THUMBS_DIR, `${item.id}.jpg`)).catch(() => {
          });
          if (item.drive?.id) {
            try {
              await driveTrash(item.drive.id);
            } catch {
              driveFailed++;
            }
          }
        }
        return { deleted: removed.length, driveFailed };
      }
      function openExternal(target) {
        const [cmd, args] = process.platform === "win32" ? ["explorer.exe", [target]] : process.platform === "darwin" ? ["open", [target]] : ["xdg-open", [target]];
        spawn2(cmd, args, { detached: true, stdio: "ignore" }).on("error", () => {
        }).unref();
      }
      function handleOpenFolder() {
        if (config.drive.folderId) return { url: `https://drive.google.com/drive/folders/${config.drive.folderId}` };
        openExternal(DATA_DIR);
        return { opened: DATA_DIR };
      }
      async function readEffectDir(dir, prefix) {
        let names;
        try {
          names = (await fsp.readdir(dir)).filter((n) => /^[\w-]{1,60}\.glsl$/i.test(n)).sort();
        } catch {
          return [];
        }
        const out = [];
        for (const name of names) {
          const file = path.join(dir, name);
          try {
            const source = await fsp.readFile(file, "utf8");
            if (import_buffer.Buffer.byteLength(source) <= MAX_EFFECT_BYTES) {
              out.push({ id: prefix + name.replace(/\.glsl$/i, ""), file: path.relative(ROOT, file).replace(/\\/g, "/"), source });
            }
          } catch {
          }
        }
        return out;
      }
      async function handleEffectsList() {
        const [builtin, custom] = await Promise.all([readEffectDir(EFFECTS_DIR, ""), readEffectDir(CUSTOM_EFFECTS_DIR, "custom/")]);
        return {
          builtin,
          custom,
          coder: { models: publicCoders(coderModels()), vectorModels: publicCoders(coderModels({ svg: true })), pollinations: Boolean(config.pollinationsKey) || hasCloudflare(), cloudflare: hasCloudflare(), gemini: Boolean(getApiKey().key) }
        };
      }
      var customEffectSlug = (id) => /^custom\/([\w-]{1,60})$/.exec(String(id || ""))?.[1] || null;
      async function handleEffectSave(body) {
        const source = String(body.source || "").replace(/\r\n?/g, "\n");
        if (!source.trim()) throw httpError(400, "The effect code is empty.");
        if (import_buffer.Buffer.byteLength(source) > MAX_EFFECT_BYTES) throw httpError(400, "The effect code is too long (max 64 KB).");
        if (!/\bvec4\s+effect\s*\(/.test(source) && !/\bvoid\s+main\s*\(/.test(source)) {
          throw httpError(400, "The code needs a `vec4 effect(vec2 uv)` function.");
        }
        const name = source.match(/^\s*\/\/\s*@name\s+(.+?)\s*$/m)?.[1] || "My effect";
        await fsp.mkdir(CUSTOM_EFFECTS_DIR, { recursive: true });
        let slug = customEffectSlug(body.id);
        if (!slug || !fs.existsSync(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`))) {
          const base = slugify(name) || "effect";
          slug = base;
          for (let n = 2; fs.existsSync(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`)); n++) slug = `${base}-${n}`;
        }
        await writeFileSafe(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`), source.endsWith("\n") ? source : `${source}
`);
        console.log(`  \u2713 effect saved: effects/custom/${slug}.glsl`);
        return { id: `custom/${slug}`, file: `effects/custom/${slug}.glsl` };
      }
      async function handleEffectDelete(body) {
        const slug = customEffectSlug(body.id);
        if (!slug) throw httpError(400, "Only your own effects can be deleted.");
        const trash = path.join(CUSTOM_EFFECTS_DIR, ".trash");
        await fsp.mkdir(trash, { recursive: true });
        try {
          await fsp.rename(path.join(CUSTOM_EFFECTS_DIR, `${slug}.glsl`), path.join(trash, `${slug}-${Date.now()}.glsl`));
        } catch (err) {
          if (err.code === "ENOENT") throw httpError(404, "That effect no longer exists.");
          throw err;
        }
        console.log(`  \u2713 effect moved to effects/custom/.trash: ${slug}.glsl`);
        return { ok: true };
      }
      var FX_PRESET_ID = /^p[a-z0-9]{6,30}$/;
      var FX_PRESET_MEDIA = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
      var FX_PRESET_MAX_LOOK = 256 * 1024;
      var fxPresetFile = (id) => path.join(FX_PRESETS_DIR, `${id}.json`);
      var publicFxPreset = (p) => ({
        ...p,
        media: p.mediaFile ? `/fxpresets/${p.mediaFile}` : null,
        thumb: p.thumbFile ? `/fxpresets/${p.thumbFile}` : null
      });
      async function readFxPreset(id) {
        if (!FX_PRESET_ID.test(String(id || ""))) throw httpError(400, "Unknown preset.");
        try {
          return JSON.parse(await fsp.readFile(fxPresetFile(id), "utf8"));
        } catch (err) {
          if (err.code === "ENOENT") throw httpError(404, "That preset no longer exists.");
          throw err;
        }
      }
      async function handleFxPresetsList() {
        let names = [];
        try {
          names = (await fsp.readdir(FX_PRESETS_DIR)).filter((n) => /^p[a-z0-9]+\.json$/.test(n));
        } catch {
        }
        const presets = [];
        for (const n of names) {
          try {
            presets.push(publicFxPreset(JSON.parse(await fsp.readFile(path.join(FX_PRESETS_DIR, n), "utf8"))));
          } catch {
          }
        }
        presets.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return { presets, dir: FX_PRESETS_DIR };
      }
      async function handleFxPresetSave(body) {
        const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 80) || "Preset";
        const key = String(body.key || "").slice(0, 120);
        if (!key) throw httpError(400, "Which effect is the preset for?");
        const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
        const look = { key, params: obj(body.params), look: obj(body.look), stack: Array.isArray(body.stack) ? body.stack.slice(0, 6) : [] };
        if (import_buffer.Buffer.byteLength(JSON.stringify(look)) > FX_PRESET_MAX_LOOK) throw httpError(400, "The preset settings are too large.");
        const id = `p${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
        await fsp.mkdir(FX_PRESETS_DIR, { recursive: true });
        const rec = { id, name, createdAt: (/* @__PURE__ */ new Date()).toISOString(), ...look, mediaKind: null, mediaName: null, mediaFile: null, thumbFile: null };
        const ext = FX_PRESET_MEDIA[String(body.mediaType || "").toLowerCase()];
        if (body.media && ext) {
          rec.mediaFile = `${id}.${ext}`;
          rec.mediaKind = ["mp4", "webm", "mov"].includes(ext) ? "video" : "image";
          rec.mediaName = String(body.mediaName || "").slice(0, 160) || `${name}.${ext}`;
          await writeFileSafe(path.join(FX_PRESETS_DIR, rec.mediaFile), import_buffer.Buffer.from(String(body.media), "base64"));
        }
        const thumb = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.thumb || ""))?.[1];
        if (thumb && thumb.length < 2 * 1024 * 1024) {
          rec.thumbFile = `${id}.thumb.jpg`;
          await writeFileSafe(path.join(FX_PRESETS_DIR, rec.thumbFile), import_buffer.Buffer.from(thumb, "base64"));
        }
        await writeFileSafe(fxPresetFile(id), JSON.stringify(rec, null, 2));
        console.log(`  \u2713 preset saved: ${fxPresetFile(id)}`);
        return { preset: publicFxPreset(rec), dir: FX_PRESETS_DIR };
      }
      async function handleFxPresetRename(body) {
        const rec = await readFxPreset(body.id);
        const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 80);
        if (!name) throw httpError(400, "Give the preset a name.");
        rec.name = name;
        await writeFileSafe(fxPresetFile(rec.id), JSON.stringify(rec, null, 2));
        return { preset: publicFxPreset(rec) };
      }
      async function handleFxPresetDelete(body) {
        const rec = await readFxPreset(body.id);
        const trash = path.join(FX_PRESETS_DIR, ".trash");
        await fsp.mkdir(trash, { recursive: true });
        for (const f of [`${rec.id}.json`, rec.mediaFile, rec.thumbFile].filter(Boolean)) {
          try {
            await fsp.rename(path.join(FX_PRESETS_DIR, f), path.join(trash, f));
          } catch {
          }
        }
        console.log(`  \u2713 preset moved to presets/.trash: ${rec.id}`);
        return { ok: true };
      }
      async function handleFxPresetsOpen() {
        await fsp.mkdir(FX_PRESETS_DIR, { recursive: true });
        openExternal(FX_PRESETS_DIR);
        return { opened: FX_PRESETS_DIR };
      }
      var CODER_INTRO = `You are an expert graphics programmer who writes effects for "hombresai", a browser studio that applies
procedural GPU effects to images, videos and the camera. Answer with exactly one complete effect file in a
\`\`\`glsl code block and nothing else \u2013 no explanation before or after it.

Write a beautiful, efficient effect that matches the request. Expose the interesting knobs as @param sliders
(3\u20138 is a good number) with sensible ranges and defaults that already look great. Give it a short, catchy
@name, a @category, a one-sentence @description and a fitting @palette (plus @finish if glow or scan lines help).
If it moves over time, use uTime and add an @animated line (with param= pointing at a speed slider that can be 0).

The effect file format, the helpers you can call and the GLSL rules follow. Obey them exactly \u2013 the code is
compiled as WebGL2 GLSL ES 3.00 together with the header described in the guide.`;
      var effectGuide = () => fsp.readFile(path.join(EFFECTS_DIR, "README.md"), "utf8").catch(() => "");
      function extractGlsl(text) {
        const str = String(text || "");
        const blocks = [...str.matchAll(/```[ \t]*[\w+-]*[ \t]*\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
        const code = blocks.find((b) => /\bvec4\s+effect\s*\(/.test(b)) || (str.includes("```") ? str.slice(str.indexOf("```")).replace(/^```[^\n]*\n/, "").replace(/```[\s\S]*$/, "") : str);
        return /\bvec4\s+effect\s*\(|\bvoid\s+main\s*\(/.test(code) ? code.replace(/\r\n?/g, "\n").trim() : "";
      }
      async function coderPollinations(model, system, user, { maxTokens = 8e3 } = {}) {
        const key = config.pollinationsKey;
        if (!key) {
          if (hasCloudflare()) return cloudflareChat(system, user, maxTokens);
          throw httpError(401, "The free AI coders need a Pollinations key \u2013 add it in Settings.", {
            code: "pollinations_key",
            hint: "Create a free key at enter.pollinations.ai/keys and paste it in Settings \u2192 Open-source models."
          });
        }
        const send = async (modelId, auth) => {
          try {
            return await httpRequest("POST", `${POLLINATIONS_BASE}/v1/chat/completions`, {
              body: { model: modelId, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.3, max_tokens: maxTokens },
              headers: auth ? { Authorization: `Bearer ${key}` } : {},
              timeoutMs: 4 * 60 * 1e3
            });
          } catch (err) {
            const error = new PollinationsError({ status: 0 }, err.code === "ETIMEDOUT" ? "The AI coder didn\u2019t answer in time." : `Couldn\u2019t connect to Pollinations (${err.code || err.message}).`);
            error.network = true;
            throw error;
          }
        };
        const text = (res2) => {
          const content = res2.json?.choices?.[0]?.message?.content;
          return Array.isArray(content) ? content.map((part) => part?.text || "").join("") : String(content || "");
        };
        let res, failure;
        try {
          res = await send(model.id, true);
          if (res.status === 200) return text(res);
          failure = new PollinationsError(res);
        } catch (err) {
          failure = err;
        }
        const code = describePollinationsError(failure).code;
        if (code === "pollinations_balance") notePollen(0);
        if (hasCloudflare() && CF_FALLBACK_CODES.has(code)) {
          console.log(`  ! Pollinations: ${describePollinationsError(failure).message} \u2192 Cloudflare Workers AI`);
          return cloudflareChat(system, user, maxTokens);
        }
        if (code === "pollinations_outage") {
          const anon = POLLINATIONS_ANON_CODERS.includes(model.id) ? model.id : POLLINATIONS_ANON_CODERS[0];
          console.log(`  ! Pollinations can\u2019t check API keys \u2013 asking ${anon} without a key`);
          const retry = await send(anon, false).catch(() => null);
          if (retry?.status === 200) return text(retry);
        }
        throw failure;
      }
      async function coderGemini(model, system, user, { maxTokens = 8192 } = {}) {
        const key = requireApiKey();
        const request2 = {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
        };
        let lastError;
        for (const id of [.../* @__PURE__ */ new Set([model.id, ...ENHANCE_MODELS])]) {
          try {
            return extractOutput(await generateContent(id, request2, key, 3 * 60 * 1e3)).text || "";
          } catch (err) {
            lastError = err;
            const missing = err.status === 404 || err.status === 400 && /not found|not supported|unsupported/i.test(err.message);
            if (!missing) throw err;
          }
        }
        throw lastError;
      }
      async function handleEffectAi(body) {
        const prompt = String(body.prompt || "").trim().slice(0, 2e3);
        const base = typeof body.source === "string" ? body.source.slice(0, MAX_EFFECT_BYTES) : "";
        const error = typeof body.error === "string" ? body.error.slice(0, 4e3) : "";
        if (!prompt) throw httpError(400, "Describe the effect you want.");
        const model = coderModels().find((m) => m.id === body.model) || CODER_MODELS[0];
        const system = `${CODER_INTRO}

${await effectGuide()}`;
        let user;
        if (error && base) {
          user = `This effect file fails to compile in WebGL2 (GLSL ES 3.00). Fix every error and return the complete corrected file; otherwise keep the effect and its sliders the same.

Compiler errors (line numbers are lines of the effect file):
${error}

What the effect should do: ${prompt}

\`\`\`glsl
${base}
\`\`\``;
        } else if (base.trim()) {
          user = `Here is an existing effect. Change it as follows: ${prompt}

Keep what still fits and keep slider names where they still make sense. Update @name and @description if the look changes. Return the complete new file.

\`\`\`glsl
${base}
\`\`\``;
        } else {
          user = `Create a new effect: ${prompt}`;
        }
        const started2 = Date.now();
        const text = await runCoder(model, system, user);
        const source = extractGlsl(text);
        if (!source) {
          throw httpError(502, "The AI coder didn\u2019t return any shader code.", {
            code: "ai_empty",
            hint: "Try again, describe the effect a little differently, or pick another AI coder."
          });
        }
        console.log(`  \u2713 AI coder (${model.label}): ${((Date.now() - started2) / 1e3).toFixed(1)} s${error ? " \u2013 compile fix" : ""}`);
        return { source, model: model.id };
      }
      async function handleEffectExport(body) {
        const mimeType = ["image/png", "image/jpeg", "image/webp"].includes(body.mimeType) ? body.mimeType : null;
        const buf = mimeType && typeof body.data === "string" ? import_buffer.Buffer.from(body.data, "base64") : null;
        if (!buf || !imageDimensions(buf)) throw httpError(400, "That isn\u2019t a valid image.");
        const label = String(body.label || "Effect").trim().slice(0, 80) || "Effect";
        const now = /* @__PURE__ */ new Date();
        const file = await stashImage(buf, mimeType, now, slugify(label) || "effect");
        const item = {
          id: file.id,
          batchId: file.id,
          batchCreatedAt: now.toISOString(),
          index: 0,
          createdAt: now.toISOString(),
          model: "effects",
          prompt: String(body.description || label).slice(0, 2e3),
          userPrompt: label,
          style: null,
          styleId: null,
          effect: { name: label, palette: typeof body.palette === "string" ? body.palette.slice(0, 40) : void 0 },
          aspectRatio: "auto",
          imageSize: null,
          thinkingLevel: null,
          refs: [],
          day: localDay(now),
          name: file.name,
          mimeType,
          width: file.width,
          height: file.height,
          bytes: file.bytes,
          cost: null,
          pending: true,
          localPath: file.localPath
        };
        history.unshift(item);
        await saveHistory();
        scheduleUploads();
        console.log(`  \u2713 effect image saved: ${label} \xB7 ${file.width}\xD7${file.height}`);
        return { items: [publicItem(item)] };
      }
      var NodesCore = require_nodes_core();
      var GRAPHS_FILE = path.join(DATA_DIR, "nodes.json");
      var MAX_GRAPHS = 500;
      var graphStore = null;
      async function loadGraphs() {
        if (graphStore) return graphStore;
        graphStore = /* @__PURE__ */ new Map();
        try {
          const data2 = JSON.parse(await fsp.readFile(GRAPHS_FILE, "utf8"));
          for (const g of Array.isArray(data2) ? data2 : []) {
            const clean = NodesCore.sanitizeGraph(g);
            if (typeof g.updatedAt === "string") clean.updatedAt = g.updatedAt;
            graphStore.set(clean.id, clean);
          }
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t read the node graphs:", err.message);
        }
        return graphStore;
      }
      async function saveGraphs() {
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(GRAPHS_FILE, JSON.stringify([...graphStore.values()], null, 1));
      }
      async function handleNodesList() {
        const graphs = await loadGraphs();
        return { graphs: [...graphs.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) };
      }
      async function handleNodesSave(body) {
        const graphs = await loadGraphs();
        if (!body.graph || typeof body.graph !== "object") throw httpError(400, "No graph to save.");
        if (graphs.size >= MAX_GRAPHS && !graphs.has(body.graph.id)) throw httpError(400, "There are too many graphs \u2013 delete some first.");
        const graph = NodesCore.sanitizeGraph(body.graph);
        graphs.set(graph.id, graph);
        await saveGraphs();
        return { graph };
      }
      async function handleNodesDelete(body) {
        const graphs = await loadGraphs();
        if (!graphs.delete(String(body.id || ""))) throw httpError(404, "That graph doesn\u2019t exist.");
        await saveGraphs();
        return { ok: true };
      }
      async function resolveGraph(body) {
        if (body.graph && typeof body.graph === "object") return NodesCore.sanitizeGraph(body.graph);
        const graphs = await loadGraphs();
        const ref = String(body.graphId || body.id || body.name || "").trim();
        const graph = graphs.get(ref) || [...graphs.values()].find((g) => g.name.toLowerCase() === ref.toLowerCase());
        if (!graph) throw httpError(404, `No node graph \u201C${ref}\u201D.`);
        return graph;
      }
      function compileOptions(body) {
        const formats = body.formats && typeof body.formats === "object" ? Object.fromEntries(["prose", "xml", "json", "markdown"].filter((k) => k in body.formats).map((k) => [k, Boolean(body.formats[k])])) : void 0;
        return {
          // target null = every shot node; skip/only = leave out node types / keep nodes made for 'image' or 'video'
          target: body.target === null ? null : body.target ? String(body.target) : void 0,
          skip: Array.isArray(body.skip) ? body.skip.map(String).slice(0, 20) : void 0,
          only: ["image", "video"].includes(body.only) ? body.only : void 0,
          prompt: typeof body.prompt === "string" ? body.prompt.slice(0, MAX_PROMPT_CHARS) : "",
          formats
        };
      }
      async function handleNodesTemplate(body) {
        const want = String(body.template || "");
        const t = NodesCore.TEMPLATES.find((x) => x.id === want);
        const own = t ? null : [...(await loadUserTemplates()).values()].find((x) => x.id === want || x.name.toLowerCase() === want.trim().toLowerCase());
        if (!t && !own) {
          const names = [...NodesCore.TEMPLATES.map((x) => x.id), ...[...(await loadUserTemplates()).values()].map((x) => x.name)];
          throw httpError(400, `Unknown template. Use one of: ${names.join(", ")}.`);
        }
        const graph = t ? t.build() : NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(own.graph)), id: void 0, name: own.name });
        if (body.name) graph.name = String(body.name).slice(0, 80);
        return handleNodesSave({ graph });
      }
      var NODE_TEMPLATES_FILE = path.join(DATA_DIR, "node-templates.json");
      var userTemplates = null;
      async function loadUserTemplates() {
        if (userTemplates) return userTemplates;
        userTemplates = /* @__PURE__ */ new Map();
        try {
          for (const t of JSON.parse(await fsp.readFile(NODE_TEMPLATES_FILE, "utf8"))) {
            if (t?.id && t.graph) userTemplates.set(t.id, { ...t, graph: NodesCore.sanitizeGraph(t.graph) });
          }
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t read the node templates:", err.message);
        }
        return userTemplates;
      }
      async function saveUserTemplates() {
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(NODE_TEMPLATES_FILE, JSON.stringify([...userTemplates.values()], null, 1));
      }
      async function handleUserTemplatesList() {
        const map = await loadUserTemplates();
        return { templates: [...map.values()].sort((a, b) => a.name.localeCompare(b.name)) };
      }
      async function handleUserTemplateSave(body) {
        const map = await loadUserTemplates();
        const source = body.graph && typeof body.graph === "object" ? body.graph : body.graphId ? (await loadGraphs()).get(String(body.graphId)) : null;
        if (!source) throw httpError(400, "Which graph should become the template?");
        const name = String(body.name || source.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
        if (!name) throw httpError(400, "Give the template a name.");
        const graph = NodesCore.sanitizeGraph({ ...JSON.parse(JSON.stringify(source)), name });
        if (!graph.nodes.length) throw httpError(400, "The graph is empty.");
        for (const n of graph.nodes) {
          for (const v of Object.values(n.values || {})) {
            if (v && typeof v === "object" && v.path && !fs.existsSync(path.join(CACHE_DIR, v.path))) throw httpError(400, `An image in \u201C${n.type}\u201D is no longer on this computer \u2013 choose it again first.`);
          }
        }
        const old = [...map.values()].find((x) => x.name.toLowerCase() === name.toLowerCase());
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const template = { id: old?.id || `ut${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`, name, kind: graph.kind, graph: { ...graph, id: void 0 }, createdAt: old?.createdAt || now, updatedAt: now };
        map.set(template.id, template);
        await saveUserTemplates();
        return { template, replaced: Boolean(old) };
      }
      async function handleUserTemplateDelete(body) {
        const map = await loadUserTemplates();
        if (!map.delete(String(body.id || ""))) throw httpError(404, "That template doesn\u2019t exist.");
        await saveUserTemplates();
        return { ok: true };
      }
      async function handleRefsFromItems(body) {
        const ids = (Array.isArray(body.ids) ? body.ids : []).slice(0, MAX_REFS);
        const roles = Array.isArray(body.roles) ? body.roles : [];
        const refs = [];
        for (const [i, id] of ids.entries()) refs.push({ path: await refFromItem(id), role: Object.hasOwn(REF_ROLES, roles[i]) ? roles[i] : "auto" });
        return { refs };
      }
      async function handleNodesCompile(body) {
        const graph = await resolveGraph(body);
        const c = NodesCore.compile(graph, compileOptions(body));
        return { graph: { id: graph.id, name: graph.name, kind: graph.kind }, ...c };
      }
      function handleNodeTypes() {
        const types = Object.entries(NodesCore.NODE_TYPES).map(([id, t]) => ({
          type: id,
          title: t.title,
          category: t.category,
          kinds: t.kinds,
          help: t.help,
          inputs: t.inputs,
          outputs: t.outputs,
          fields: t.fields.map((f) => ({ id: f.id, label: f.label, type: f.type, default: f.default, ...f.options && f.type !== "model" ? { options: f.options.map((o) => o.value) } : {} }))
        }));
        return { types, categories: NodesCore.CATEGORIES, templates: NodesCore.TEMPLATES.map((t) => ({ id: t.id, name: t.name, kind: t.kind })) };
      }
      var cleanNodesMeta = (n) => n && typeof n === "object" && n.name ? { graphId: String(n.graphId || "").slice(0, 40), name: String(n.name).slice(0, 80), chips: (Array.isArray(n.chips) ? n.chips : []).slice(0, 12).map((c) => String(c).slice(0, 40)) } : void 0;
      async function itemBuffer(item) {
        let entry = cacheGet(item.id);
        if (!entry && item.localPath) {
          try {
            entry = { buffer: await fsp.readFile(item.localPath), mimeType: item.mimeType };
          } catch {
          }
        }
        if (!entry && item.drive?.id) {
          const r = await driveRequest("GET", `${GOOGLE.drive}/files/${encodeURIComponent(item.drive.id)}?alt=media`, { binary: true, timeoutMs: 12e4 });
          if (r.status !== 200) throw httpError(r.status === 404 ? 404 : 502, r.status === 404 ? "The file is no longer on Google Drive." : "Google Drive didn\u2019t return the file.");
          entry = { buffer: r.buffer, mimeType: item.mimeType };
          cachePut(item.id, r.buffer, item.mimeType);
        }
        if (!entry) throw httpError(404, "The file isn\u2019t available.");
        return entry;
      }
      async function refFromItem(id) {
        const item = findItem(String(id));
        if (!/^image\/(png|jpeg|webp)$/.test(item.mimeType || "")) throw httpError(400, "Only PNG, JPEG and WebP images can be references.");
        const { buffer } = await itemBuffer(item);
        const ext = EXT_BY_MIME[item.mimeType];
        const name = `${crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 24)}.${ext}`;
        const file = path.join(REFS_DIR, name);
        if (!fs.existsSync(file)) {
          await fsp.mkdir(REFS_DIR, { recursive: true });
          await fsp.writeFile(file, buffer);
        }
        return `refs/${name}`;
      }
      async function nodeImageRef(entry, graph, depth) {
        if (!entry) return null;
        if (entry.kind === "reference") {
          const img = entry.image || {};
          if (/^refs\/[\w.-]+$/.test(img.path || "") && fs.existsSync(path.join(CACHE_DIR, img.path))) return { path: img.path, role: entry.role || "auto" };
          if (img.itemId) return { path: await refFromItem(img.itemId), role: entry.role || "auto" };
          return null;
        }
        if (depth > 3) throw httpError(400, "The graph chains too many Generate nodes.");
        const node = graph.nodes.find((n) => n.id === entry.node);
        const run = await runImageNode(graph, node, { count: 1 }, depth + 1);
        return run.items[0] ? { path: await refFromItem(run.items[0].id), role: "auto", itemId: run.items[0].id } : null;
      }
      async function runImageNode(graph, node, opts = {}, depth = 0) {
        const c = NodesCore.compile(graph, { target: node.id, prompt: opts.prompt || "", formats: opts.formats });
        const v = node.values;
        const model = String(opts.model || v.model);
        if (!MODELS_BY_ID.has(model) && !MODEL_ID_RE.test(model)) throw httpError(400, "Invalid model.");
        const refs = [];
        for (const entry of c.inputs.refs || []) {
          const ref = await nodeImageRef(entry, graph, depth);
          if (ref) refs.push({ path: ref.path, role: ref.role });
        }
        const count = clamp(parseInt(opts.count ?? v.count, 10) || 1, 1, 4);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const batchId = `n${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
        const items = [];
        for (let i = 0; i < count; i++) {
          const res = await handleGenerate({
            model,
            prompt: c.prompt,
            userPrompt: c.parts.base || graph.name,
            aspectRatio: opts.aspectRatio || (v.ratio === "auto" ? null : v.ratio),
            imageSize: opts.imageSize || v.size,
            refs,
            nodes: { graphId: graph.id, name: graph.name, chips: c.chips },
            batchId,
            batchCreatedAt: now,
            index: i
          });
          items.push(...res.items);
        }
        return { compiled: c, items };
      }
      async function handleNodesRun(body) {
        const graph = await resolveGraph(body);
        const outputs = NodesCore.outputNodes(graph);
        const node = body.target ? graph.nodes.find((n) => n.id === body.target) : outputs.find((n) => NodesCore.NODE_TYPES[n.type].output === graph.kind) || outputs[0];
        if (!node || !NodesCore.NODE_TYPES[node.type]?.output) throw httpError(400, "The graph has no Generate image or Generate video node.");
        const opts = compileOptions(body);
        if (NodesCore.NODE_TYPES[node.type].output === "video") {
          if (typeof runVideoNode !== "function") throw httpError(501, "Video generation isn\u2019t available yet.");
          return runVideoNode(graph, node, { ...opts, wait: body.wait });
        }
        const run = await runImageNode(graph, node, { ...opts, count: body.count, model: body.model });
        return { prompt: run.compiled.prompt, chips: run.compiled.chips, warnings: run.compiled.warnings, items: run.items };
      }
      var MAX_SVG_BYTES = 4 * 1024 * 1024;
      var VECTOR_INTRO = `You are an expert vector illustrator who draws with hand-written SVG code for "hombresai", a vector
editor similar to Adobe Illustrator. Answer with exactly one complete SVG document in a \`\`\`svg code block and nothing
else \u2013 no explanation before or after it.

Rules:
- Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" width="W" height="H"> \u2013 pick W\xD7H to suit the
  subject (1000\xD71000 unless the request implies another shape).
- Draw with <path>, <rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon> and <text>, grouped with <g> into
  meaningful parts (give each <g> an id that names the part, e.g. id="left-eye"). Prefer filled shapes with clear,
  confident curves; use strokes only where lines are the point.
- Solid hex colors on fill/stroke attributes, a deliberate palette (4\u201310 colors). Linear and radial gradients in <defs>
  are allowed when they really help; no filters, masks, patterns, images, CSS classes, <style>, scripts, animation,
  event attributes, external links or <foreignObject>.
- Leave the background transparent unless a background is requested.
- Make it look professionally designed \u2013 balanced composition, good proportions, enough detail to be convincing but
  no tiny noise. Keep the file compact: round coordinates to at most 1 decimal.`;
      function extractSvg(text) {
        const str = String(text || "");
        const start = str.search(/<svg[\s>]/i);
        const end = str.toLowerCase().lastIndexOf("</svg>");
        return start >= 0 && end > start ? str.slice(start, end + 6).trim() : "";
      }
      function stripUnsafeSvg(svg) {
        return svg.replace(/<\s*(script|foreignObject|iframe|object|embed|audio|video)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*(script|foreignObject|iframe|object|embed|audio|video)\b[^>]*>/gi, "").replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s(?:xlink:)?(?:href|src)\s*=\s*(["'])\s*(?:javascript:|data:text\/html|https?:|\/\/)[^"']*\1/gi, "").replace(/<!ENTITY[^>]*>/gi, "");
      }
      function unsafeSvg(svg) {
        return /<\s*(script|foreignObject|iframe|object|embed|audio|video)\b|\son\w+\s*=|javascript:|data:text\/html|<!ENTITY|(?:href|src)\s*=\s*["']?\s*(?:https?:)?\/\//i.test(svg);
      }
      async function handleVectorAi(body) {
        const prompt = String(body.prompt || "").trim().slice(0, 2e3);
        const base = typeof body.source === "string" ? body.source.slice(0, 2e5) : "";
        if (!prompt) throw httpError(400, "Describe what to draw.");
        const model = coderModels({ svg: true }).find((m) => m.id === body.model) || CODER_MODELS[0];
        if (model.svgOnly && base.trim()) throw httpError(400, `${model.label} can only draw new drawings \u2013 pick another AI model to change this one.`);
        const user = base.trim() ? `Here is an existing SVG drawing. Change it as follows: ${prompt}

Keep everything that still fits, keep the viewBox, and return the complete new SVG.

\`\`\`svg
${base}
\`\`\`` : `Draw this as an SVG: ${prompt}`;
        const started2 = Date.now();
        const text = model.svgOnly ? await foundSvg(model.found, prompt) : await runCoder(model, VECTOR_INTRO, user, { maxTokens: model.provider === "gemini" ? 16384 : 12e3 });
        const svg = stripUnsafeSvg(extractSvg(text));
        if (!svg || unsafeSvg(svg)) {
          throw httpError(502, "The AI didn\u2019t return a usable drawing.", {
            code: "ai_empty",
            hint: "Try again, describe it a little differently, or pick another AI model."
          });
        }
        console.log(`  \u2713 AI vector (${model.label}): ${((Date.now() - started2) / 1e3).toFixed(1)} s \xB7 ${(svg.length / 1024).toFixed(0)} kB`);
        return { svg, model: model.id };
      }
      async function handleVectorExport(body) {
        const svg = typeof body.svg === "string" ? body.svg.trim() : "";
        if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>$/i.test(svg)) throw httpError(400, "That isn\u2019t an SVG drawing.");
        if (import_buffer.Buffer.byteLength(svg) > MAX_SVG_BYTES) throw httpError(413, "The drawing is too big (max 4 MB) \u2013 simplify it or trace with fewer colors.");
        if (unsafeSvg(svg)) throw httpError(400, "The drawing contains scripts or external links \u2013 they aren\u2019t allowed.");
        const size = (v) => Math.max(1, Math.min(2e4, Math.round(Number(v) || 0)));
        const label = String(body.label || "Vector").trim().slice(0, 80) || "Vector";
        const now = /* @__PURE__ */ new Date();
        const file = await stashImage(import_buffer.Buffer.from(svg), "image/svg+xml", now, slugify(label) || "vector");
        const item = {
          id: file.id,
          batchId: file.id,
          batchCreatedAt: now.toISOString(),
          index: 0,
          createdAt: now.toISOString(),
          model: "vectors",
          prompt: String(body.description || label).slice(0, 2e3),
          userPrompt: label,
          style: null,
          styleId: null,
          aspectRatio: "auto",
          imageSize: null,
          thinkingLevel: null,
          refs: [],
          day: localDay(now),
          name: file.name,
          mimeType: "image/svg+xml",
          width: size(body.width),
          height: size(body.height),
          bytes: file.bytes,
          cost: null,
          pending: true,
          localPath: file.localPath
        };
        history.unshift(item);
        await saveHistory();
        scheduleUploads();
        console.log(`  \u2713 vector saved: ${label} \xB7 ${(file.bytes / 1024).toFixed(0)} kB`);
        return { items: [publicItem(item)] };
      }
      var OMNI_MODEL = "gemini-omni-1.1-flash";
      var OMNI_PRICE = { input: 15e-7, textOut: 9e-6, videoOut: 175e-7 };
      var FREE_VIDEO = { provider: "huggingface", free: true, pricePerSecond: 0, ratios: ["16:9", "9:16"], refs: false };
      var VIDEO_MODELS = [{
        id: OMNI_MODEL,
        label: "Gemini Omni Flash",
        provider: "gemini",
        ratios: ["16:9", "9:16"],
        resolutions: ["360p", "720p", "1080p", "4k"],
        minSeconds: 3,
        maxSeconds: 10,
        pricePerSecond: 0.1,
        sound: true,
        firstFrame: "optional",
        lastFrame: true,
        refs: true,
        desc: "Google\u2019s video model: text, first/last frame and reference images to video, with sound. About $0.10 per second of 720p (1080p and 4K are upscaled)."
      }, {
        id: "wan-2.2",
        label: "Wan 2.2",
        ...FREE_VIDEO,
        resolutions: ["480p"],
        minSeconds: 1,
        maxSeconds: 5,
        sound: false,
        firstFrame: "auto",
        lastFrame: true,
        desc: "Alibaba\u2019s open model \u2013 the best free quality. It animates a first frame (drawn for you with FLUX.1 schnell if you don\u2019t pick one) and can move from a first to a last frame. Silent, up to 5 s."
      }, {
        id: "ltx-2.3",
        label: "LTX-2.3",
        ...FREE_VIDEO,
        resolutions: ["576p"],
        minSeconds: 1,
        maxSeconds: 10,
        sound: true,
        firstFrame: "auto",
        lastFrame: false,
        desc: "Lightricks\u2019 open model with sound. It animates a first frame (drawn for you if you don\u2019t pick one). Up to 10 s \u2013 long clips use up the free GPU time faster."
      }, {
        id: "ltx-video",
        label: "LTX-Video",
        ...FREE_VIDEO,
        resolutions: ["480p"],
        minSeconds: 1,
        maxSeconds: 8,
        sound: false,
        firstFrame: "optional",
        lastFrame: false,
        desc: "Lightricks\u2019 fast open model, straight from text or from a first frame. Silent, up to 8 s. Lower quality, but quick and light on the free GPU time."
      }];
      var VIDEO_MIME_EXT = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
      var VIDEO_JOBS_FILE = path.join(DATA_DIR, "video-jobs.json");
      var PROJECTS_FILE = path.join(DATA_DIR, "video-projects.json");
      var VIDEO_POLL_MS = Number(define_process_env_default.VIDEO_POLL_MS) || 5e3;
      var VIDEO_TIMEOUT_MS = 20 * 60 * 1e3;
      var MAX_VIDEO_UPLOAD = 60 * 1024 * 1024;
      var videoJobs = /* @__PURE__ */ new Map();
      var videoProjects = null;
      function mp4Info(buf) {
        const info = {};
        let timescale = 0;
        let track = 0;
        let frag = null;
        const scales = {}, trexDur = {}, ends = {};
        const walk = (start, end) => {
          let off = start;
          while (off + 8 <= end) {
            let size = buf.readUInt32BE(off);
            const type = buf.toString("latin1", off + 4, off + 8);
            let header = 8;
            if (size === 1) {
              size = Number(buf.readBigUInt64BE(off + 8));
              header = 16;
            } else if (size === 0) size = end - off;
            if (size < header || off + size > end) break;
            const p = off + header;
            if (["moov", "trak", "mvex", "mdia", "moof"].includes(type)) walk(p, off + size);
            else if (type === "traf") {
              frag = { track: 0, dur: 0, base: null, sum: 0 };
              walk(p, off + size);
              const t = frag.track;
              ends[t] = Math.max(ends[t] || 0, (frag.base ?? ends[t] ?? 0) + frag.sum);
              frag = null;
            } else if (type === "mvhd") {
              const v = buf[p];
              timescale = v === 1 ? buf.readUInt32BE(p + 20) : buf.readUInt32BE(p + 12);
              const duration = v === 1 ? Number(buf.readBigUInt64BE(p + 24)) : buf.readUInt32BE(p + 16);
              if (timescale && duration && duration !== 4294967295) info.duration = duration / timescale;
            } else if (type === "mehd" && timescale && !info.duration) {
              const d = buf[p] === 1 ? Number(buf.readBigUInt64BE(p + 4)) : buf.readUInt32BE(p + 4);
              if (d) info.duration = d / timescale;
            } else if (type === "tkhd") {
              track = buf.readUInt32BE(p + (buf[p] === 1 ? 20 : 12));
              const w = buf.readUInt32BE(off + size - 8) / 65536, h = buf.readUInt32BE(off + size - 4) / 65536;
              if (w && h && !info.width) {
                info.width = Math.round(w);
                info.height = Math.round(h);
              }
            } else if (type === "mdhd") {
              scales[track] = buf.readUInt32BE(p + (buf[p] === 1 ? 20 : 12));
            } else if (type === "trex") {
              trexDur[buf.readUInt32BE(p + 4)] = buf.readUInt32BE(p + 12);
            } else if (type === "tfhd" && frag) {
              const flags = buf.readUInt32BE(p) & 16777215;
              frag.track = buf.readUInt32BE(p + 4);
              const q = p + 8 + (flags & 1 ? 8 : 0) + (flags & 2 ? 4 : 0);
              frag.dur = flags & 8 ? buf.readUInt32BE(q) : trexDur[frag.track] || 0;
            } else if (type === "tfdt" && frag) {
              frag.base = buf[p] === 1 ? Number(buf.readBigUInt64BE(p + 4)) : buf.readUInt32BE(p + 4);
            } else if (type === "trun" && frag) {
              const flags = buf.readUInt32BE(p) & 16777215;
              const count = buf.readUInt32BE(p + 4);
              const q = p + 8 + (flags & 1 ? 4 : 0) + (flags & 4 ? 4 : 0);
              const step = [256, 512, 1024, 2048].filter((f) => flags & f).length * 4;
              if (flags & 256) for (let k = 0; k < count; k++) frag.sum += buf.readUInt32BE(q + k * step);
              else frag.sum += count * frag.dur;
            }
            off += size;
          }
        };
        try {
          walk(0, buf.length);
        } catch {
        }
        if (!info.duration) {
          const seconds = Object.keys(ends).map((t) => scales[t] ? ends[t] / scales[t] : 0);
          if (Math.max(0, ...seconds) > 0) info.duration = Math.max(...seconds);
        }
        if (info.duration) info.duration = Math.round(info.duration * 1e3) / 1e3;
        return info;
      }
      var RES_HEIGHT = { "360p": 360, "480p": 480, "576p": 576, "720p": 720, "1080p": 1080, "4k": 2160 };
      function videoSize(aspectRatio, resolution) {
        const short = RES_HEIGHT[resolution] || 720;
        const long = Math.round(short * 16 / 9);
        return aspectRatio === "9:16" ? { width: short, height: long } : { width: long, height: short };
      }
      function publicJob(job) {
        const item = job.itemId ? history.find((i) => i.id === job.itemId) : null;
        return {
          id: job.id,
          status: job.status,
          error: job.error || void 0,
          createdAt: job.createdAt,
          finishedAt: job.finishedAt,
          prompt: job.userPrompt,
          aspectRatio: job.aspectRatio,
          resolution: job.resolution,
          duration: job.duration,
          projectId: job.projectId,
          segmentId: job.segmentId,
          itemId: job.itemId,
          item: item ? publicItem(item) : void 0,
          estimate: job.estimate,
          model: job.model || OMNI_MODEL,
          free: job.provider === "huggingface",
          stage: job.status === "running" ? job.stage : void 0
        };
      }
      async function saveVideoJobs() {
        const keep = [...videoJobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60).map(({ timer, abort, ...job }) => job);
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(VIDEO_JOBS_FILE, JSON.stringify(keep, null, 1));
      }
      async function loadVideoJobs() {
        try {
          for (const job of JSON.parse(await fsp.readFile(VIDEO_JOBS_FILE, "utf8"))) {
            videoJobs.set(job.id, job);
            if (job.status !== "running") continue;
            if (job.provider === "huggingface") failVideoJob(job, "Stopped when hombresai restarted \u2013 it was free, just start it again.");
            else pollVideoJob(job);
          }
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t read the video jobs:", err.message);
        }
      }
      async function videoFrame(spec, itemId) {
        let rel = spec && typeof spec === "object" ? String(spec.path || "") : "";
        if (!rel && itemId) rel = await refFromItem(String(itemId));
        if (!rel) return null;
        if (!/^refs\/[\w.-]+$/.test(rel)) throw httpError(400, "Invalid frame.");
        const data2 = await fsp.readFile(path.join(CACHE_DIR, rel)).catch(() => null);
        if (!data2) throw httpError(400, "The frame image is no longer on this computer \u2013 capture it again.");
        return { path: rel, data: data2, mimeType: sniffMime(data2) };
      }
      function videoCost(usage, seconds) {
        const out = (usage?.output_tokens_by_modality || []).find((m) => /video/i.test(m.modality))?.tokens;
        if (usage && (usage.total_input_tokens || usage.total_output_tokens)) {
          const video = out ?? usage.total_output_tokens ?? 0;
          const text = Math.max(0, (usage.total_output_tokens || 0) - video);
          return (usage.total_input_tokens || 0) * OMNI_PRICE.input + video * OMNI_PRICE.videoOut + text * OMNI_PRICE.textOut;
        }
        return seconds ? seconds * VIDEO_MODELS[0].pricePerSecond : null;
      }
      var HF_SPACES_BASE = (define_process_env_default.HF_SPACES_BASE || "").replace(/\/+$/, "");
      var HF_API_BASE = (define_process_env_default.HF_API_BASE || "https://huggingface.co").replace(/\/+$/, "");
      var HF_TIMEOUT_MS = 15 * 60 * 1e3;
      var hfHost = (s) => HF_SPACES_BASE ? `${HF_SPACES_BASE}/${s.host}` : `https://${s.host}.hf.space`;
      var hfHeaders = () => config.hfToken ? { Authorization: `Bearer ${config.hfToken}` } : {};
      var HF_SPACES = {
        flux: { repo: "black-forest-labs/FLUX.1-schnell", host: "black-forest-labs-flux-1-schnell", api: "infer", title: "FLUX.1 schnell" },
        wan: { repo: "zerogpu-aoti/wan2-2-fp8da-aoti-faster", host: "zerogpu-aoti-wan2-2-fp8da-aoti-faster", api: "generate_video", title: "Wan 2.2" },
        wanFlf: { repo: "multimodalart/wan-2-2-first-last-frame", host: "multimodalart-wan-2-2-first-last-frame", api: "generate_video", title: "Wan 2.2 (first and last frame)" },
        ltx2: { repo: "Lightricks/LTX-2-3", host: "lightricks-ltx-2-3", api: "generate_video", title: "LTX-2.3" },
        ltxText: { repo: "Lightricks/ltx-video-distilled", host: "lightricks-ltx-video-distilled", api: "text_to_video", title: "LTX-Video" },
        ltxImage: { repo: "Lightricks/ltx-video-distilled", host: "lightricks-ltx-video-distilled", api: "image_to_video", title: "LTX-Video" },
        // the open image models – used when Pollinations (and Cloudflare) can't serve them; Qwen-Image only runs here
        zimage: { repo: "Tongyi-MAI/Z-Image-Turbo", host: "tongyi-mai-z-image-turbo", api: "generate", title: "Z-Image Turbo" },
        klein: { repo: "black-forest-labs/FLUX.2-klein-4B", host: "black-forest-labs-flux-2-klein-4b", api: "infer", title: "FLUX.2 klein" },
        qwenImage: { repo: "Qwen/Qwen-Image", host: "qwen-qwen-image", api: "infer", title: "Qwen-Image" }
      };
      var FREE_SIZES = {
        frame: { "16:9": [1024, 576], "9:16": [576, 1024] },
        "ltx-2.3": { "16:9": [1024, 576], "9:16": [576, 1024] },
        "ltx-video": { "16:9": [832, 480], "9:16": [480, 832] }
      };
      async function verifyHfToken(token) {
        let res;
        try {
          res = await httpRequest("GET", `${HF_API_BASE}/api/whoami-v2`, { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 2e4 });
        } catch (err) {
          throw httpError(502, `Couldn\u2019t reach Hugging Face (${err.code || err.message}).`, { code: "network" });
        }
        if (res.status === 200 && res.json?.name) return { user: res.json.name, checkedAt: (/* @__PURE__ */ new Date()).toISOString() };
        if (res.status === 401 || res.status === 403) {
          throw httpError(400, "Hugging Face doesn\u2019t accept this token.", { code: "hf_token", hint: "Create a new token of the type \u201CRead\u201D and copy it whole." });
        }
        throw httpError(502, `Hugging Face didn\u2019t confirm the token (HTTP ${res.status}).`, { code: "server", retryable: true });
      }
      var hfInfoCache = /* @__PURE__ */ new Map();
      var hfUnavailable = (s, status) => httpError(503, `The free ${s.title} app on Hugging Face isn\u2019t available right now (HTTP ${status}) \u2013 it may be starting up or paused.`, {
        code: "hf_unavailable",
        retryable: true,
        hint: `Try again in a minute or pick another model. huggingface.co/spaces/${s.repo}`
      });
      async function hfApiInfo(s) {
        const hit = hfInfoCache.get(s.host);
        if (hit && Date.now() - hit.at < 60 * 60 * 1e3) return hit.info;
        let info, cfg;
        try {
          [info, cfg] = await Promise.all([
            httpRequest("GET", `${hfHost(s)}/gradio_api/info`, { headers: hfHeaders(), timeoutMs: 6e4 }),
            httpRequest("GET", `${hfHost(s)}/config`, { headers: hfHeaders(), timeoutMs: 6e4 })
          ]);
        } catch (err) {
          throw httpError(502, `Couldn\u2019t reach Hugging Face (${err.code || err.message}).`, { code: "network", retryable: true });
        }
        if (info.status !== 200 || !info.json?.named_endpoints) throw hfUnavailable(s, info.status);
        if (cfg.status !== 200 || !Array.isArray(cfg.json?.dependencies)) throw hfUnavailable(s, cfg.status);
        const components = (cfg.json.components || []).map((c) => ({ id: c.id, type: c.type, props: { label: c.props?.label, minimum: c.props?.minimum, maximum: c.props?.maximum, step: c.props?.step, value: c.props?.value, choices: c.props?.choices, max_length: c.props?.max_length } }));
        const result2 = { ...info.json, dependencies: cfg.json.dependencies, components };
        hfInfoCache.set(s.host, { at: Date.now(), info: result2 });
        return result2;
      }
      async function hfUpload(s, file) {
        const ext = EXT_BY_MIME[file.mimeType] || "png";
        const { body, contentType } = multipartBody({}, [{ field: "files", filename: `frame.${ext}`, mimeType: file.mimeType, data: file.data }]);
        const res = await httpRequest("POST", `${hfHost(s)}/gradio_api/upload`, { headers: { ...hfHeaders(), "Content-Type": contentType }, raw: body, timeoutMs: 12e4 });
        const uploaded = Array.isArray(res.json) ? res.json[0] : null;
        if (res.status !== 200 || typeof uploaded !== "string") throw httpError(502, `Couldn\u2019t send the frame to Hugging Face (HTTP ${res.status}).`, { code: "hf_run", retryable: true });
        return { path: uploaded, orig_name: `frame.${ext}`, mime_type: file.mimeType, size: file.data.length, meta: { _type: "gradio.FileData" } };
      }
      function hfRunError(s, payload) {
        const msg = String((typeof payload === "string" ? payload : payload?.message || payload?.error) || "").replace(/\s+/g, " ").trim();
        if (/quota/i.test(msg)) {
          const wait = /try again in ([\d:]+)/i.exec(msg)?.[1];
          const ask = /\((\d+)s requested vs\.? (\d+)s left\)/i.exec(msg);
          const back = wait && /[1-9]/.test(wait) ? ` \u2013 it comes back in ${wait.replace(/^0:/, "")} (h:mm:ss)` : " for now";
          noteHfQuota(wait, ask ? Number(ask[2]) : null);
          return httpError(429, `The free GPU time on Hugging Face is used up${back}.${ask ? ` ${s.title} books ${ask[1]} s per run, ${ask[2]} s are left.` : ""}`, {
            code: "hf_quota",
            detail: msg.slice(0, 300),
            hint: config.hfToken ? "A free account has 5 minutes a day. For images, a free Cloudflare account (Settings) gives about 100 a day." : "Without an account it\u2019s 2 minutes a day: a free Hugging Face token in Settings gives 5. For images, a free Cloudflare account (Settings) gives about 100 a day."
          });
        }
        if (/no gpu|gpu task aborted|zerogpu|worker|timed? ?out/i.test(msg)) {
          return httpError(503, `Hugging Face had no free GPU for ${s.title} just now \u2013 try again in a minute.`, { code: "hf_busy", detail: msg.slice(0, 300), retryable: true });
        }
        return httpError(502, msg ? `${s.title} failed: ${msg.slice(0, 300)}` : `${s.title} failed without saying why \u2013 try again or pick another model.`, { code: "hf_run", retryable: true });
      }
      async function hfCall(s, info, data2, signal, onProgress) {
        const host = hfHost(s);
        const fnIndex = info.dependencies.findIndex((d) => d.api_name === s.api);
        if (fnIndex < 0) throw httpError(502, `The ${s.title} app on Hugging Face has changed \u2013 hombresai needs an update for it.`, { code: "hf_api" });
        const session = crypto.randomBytes(8).toString("hex");
        const join = await httpRequest("POST", `${host}/gradio_api/queue/join`, {
          headers: hfHeaders(),
          timeoutMs: 6e4,
          body: { data: data2, fn_index: fnIndex, trigger_id: info.dependencies[fnIndex].targets?.[0]?.[0] ?? null, session_hash: session, event_data: null }
        });
        if (join.status !== 200 || !join.json?.event_id) {
          hfInfoCache.delete(s.host);
          if ([404, 502, 503, 504].includes(join.status)) throw hfUnavailable(s, join.status);
          throw hfRunError(s, join.json?.detail || join.json?.error || `HTTP ${join.status}`);
        }
        const res = await fetch(`${host}/gradio_api/queue/data?session_hash=${session}`, { headers: { ...hfHeaders(), Accept: "text/event-stream" }, signal });
        if (!res.ok || !res.body) throw hfRunError(s, `HTTP ${res.status}`);
        const decoder = new TextDecoder();
        let buf = "";
        for await (const chunk of res.body) {
          buf = (buf + decoder.decode(chunk, { stream: true })).replace(/\r\n/g, "\n");
          let end;
          while ((end = buf.indexOf("\n\n")) >= 0) {
            const block = buf.slice(0, end);
            buf = buf.slice(end + 2);
            const raw = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n");
            let msg;
            try {
              msg = JSON.parse(raw);
            } catch {
              continue;
            }
            if (msg.msg === "estimation") onProgress?.({ rank: msg.rank, eta: msg.rank_eta });
            else if (msg.msg === "process_starts") onProgress?.({ started: true });
            else if (msg.msg === "process_completed") {
              if (msg.success && msg.output?.data) {
                if (hfQuotaUntil) {
                  hfQuotaUntil = 0;
                  saveFreeLimits();
                }
                return msg.output.data;
              }
              throw hfRunError(s, msg.output?.error || msg.title || null);
            } else if (msg.msg === "unexpected_error") throw hfRunError(s, msg.message || null);
          }
        }
        throw httpError(502, "Hugging Face closed the connection before the result was ready \u2013 try again.", { code: "hf_run", retryable: true });
      }
      async function hfRun(key, values, signal, onProgress) {
        const s = HF_SPACES[key];
        const info = await hfApiInfo(s);
        const ep = info.named_endpoints[`/${s.api}`];
        if (!ep) throw httpError(502, `The ${s.title} app on Hugging Face has changed \u2013 hombresai needs an update for it.`, { code: "hf_api" });
        const files = {};
        for (const [name, v] of Object.entries(values)) {
          if (v?.data && v.mimeType) files[name] = await hfUpload(s, v);
          else if (Array.isArray(v) && v.length && v.every((f) => f?.data)) files[name] = await Promise.all(v.map(async (f) => ({ image: await hfUpload(s, f), caption: null })));
        }
        const data2 = ep.parameters.map((p) => {
          const name = p.parameter_name;
          if (Object.hasOwn(values, name)) return files[name] || values[name];
          if (p.parameter_has_default) return p.parameter_default;
          throw httpError(502, `The ${s.title} app on Hugging Face now needs \u201C${name}\u201D \u2013 hombresai needs an update for it.`, { code: "hf_api" });
        });
        return hfCall(s, info, data2, signal, onProgress);
      }
      async function hfDownload(key, out) {
        const s = HF_SPACES[key];
        const first = Array.isArray(out) ? out[0] : out;
        const file = first?.video || first?.image || first;
        const url = file?.url || (file?.path ? `${hfHost(s)}/gradio_api/file=${file.path}` : null);
        if (!url || !/^https?:\/\//.test(url)) throw httpError(502, `${s.title} finished without a file.`, { code: "hf_run", retryable: true });
        const own = new URL(url).host === new URL(hfHost(s)).host;
        const res = await httpRequest("GET", url, { headers: own ? hfHeaders() : {}, binary: true, timeoutMs: 3e5 });
        if (res.status !== 200) throw httpError(502, `Couldn\u2019t download the result from Hugging Face (HTTP ${res.status}).`, { code: "hf_run", retryable: true });
        const type = String(file.mime_type || res.headers["content-type"] || "").split(";")[0];
        return { data: res.buffer, mimeType: type || (/\.webm$/i.test(url) ? "video/webm" : "video/mp4") };
      }
      async function hfFirstFrame(job, signal) {
        const [width, height] = FREE_SIZES.frame[job.aspectRatio] || FREE_SIZES.frame["16:9"];
        const out = await hfRun("flux", { prompt: `Opening frame of a film shot: ${job.prompt}`.slice(0, 1200), width, height, randomize_seed: true }, signal);
        const img = await hfDownload("flux", out?.[0]);
        const ref = await handleRefUpload({ mimeType: sniffMime(img.data), data: img.data.toString("base64") });
        return videoFrame({ path: ref.path });
      }
      var HF_IMAGE_SPACE = { "os-z-image-turbo": "zimage", "os-flux2-klein": "klein", "os-flux1-schnell": "flux", "os-qwen-image": "qwenImage" };
      var fitSize = ([w, h], max, step) => {
        const k = Math.min(1, max / Math.max(w, h));
        return [w, h].map((v) => Math.max(256, Math.min(max, Math.round(v * k / step) * step)));
      };
      function closestChoice(info, s, param, [w, h], { maxPixels = Infinity } = {}) {
        const p = info.named_endpoints[`/${s.api}`]?.parameters.find((x) => x.parameter_name === param);
        const choices = [...String(p?.python_type?.type || "").matchAll(/'([^']+)'/g)].map((m) => m[1]);
        const shape = (c) => {
          const m = /(\d+)\s*[x:]\s*(\d+)/.exec(c);
          return m ? [Number(m[1]), Number(m[2])] : null;
        };
        const fits = choices.filter((c) => shape(c) && shape(c)[0] * shape(c)[1] <= maxPixels);
        const pool = fits.length ? fits : choices.filter(shape);
        if (!pool.length) return p?.parameter_default;
        const dist = (c) => Math.abs(Math.log(shape(c)[0] / shape(c)[1] / (w / h)));
        return pool.reduce((best, c) => dist(c) < dist(best) ? c : best);
      }
      async function hfImageGenerate(meta2, prompt, refs, aspectRatio) {
        const key = HF_IMAGE_SPACE[meta2.id];
        const s = HF_SPACES[key];
        const files = key === "klein" ? await loadRefFiles(refs, meta2.maxRefs || 4) : [];
        const size = sizeFor(aspectRatio, files[0]?.dims);
        let values;
        if (key === "zimage") {
          const info = await hfApiInfo(s);
          values = { prompt, resolution: closestChoice(info, s, "resolution", size, { maxPixels: 11e5 }), random_seed: true };
        } else if (key === "qwenImage") {
          const info = await hfApiInfo(s);
          values = { prompt, aspect_ratio: closestChoice(info, s, "aspect_ratio", size), randomize_seed: true, prompt_enhance: false, num_inference_steps: 30 };
        } else if (key === "klein") {
          const [width, height] = fitSize(size, 1024, 8);
          values = { prompt: [...files.map(refLabel), "", prompt].join("\n").trim(), input_images: files, width, height, randomize_seed: true };
        } else {
          const [width, height] = fitSize(size, 2048, 32);
          values = { prompt, width, height, randomize_seed: true };
        }
        const out = await hfRun(key, values);
        const img = await hfDownload(key, out?.[0]);
        const mimeType = /^image\//.test(img.mimeType) ? img.mimeType : sniffMime(img.data);
        return { images: [{ mimeType, data: img.data.toString("base64") }], text: "", usageMetadata: null, via: "huggingface" };
      }
      var plainPrompt = (prompt) => prompt.split(/\n\n(?:Shot|Video) specification – follow every value exactly/)[0].trim();
      var openVideoPrompt = (prompt) => plainPrompt(prompt).slice(0, 1500);
      var FreeModels = require_free_models();
      var FREE_MODELS_FILE = path.join(DATA_DIR, "free-models.json");
      var FREE_MODELS_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
      var FREE_AUTO_MODEL = {
        id: "free-auto",
        label: "Best free (auto)",
        provider: "free",
        open: true,
        auto: true,
        group: "open",
        tag: "Auto",
        free: true,
        desc: "Tries the best free open-source models one after another until one works \u2013 the built-in ones and the ones found online, best first. The gallery shows which model made each image. With references it uses FLUX.2 klein.",
        refs: true,
        maxRefs: 4,
        refsHint: "up to 4 references (FLUX.2 klein)",
        ratios: RATIOS_STD,
        sizes: [],
        thinking: null,
        price: null,
        nodes: false
      };
      var freeCatalog = null;
      var freeSearch = null;
      var freeSearchError = null;
      var hfQuotaUntil = 0;
      var cfQuotaUntil = 0;
      var pollenBalance = null;
      var pollenCheckedAt = 0;
      function noteHfQuota(wait, left) {
        if (left != null && left >= 30) return;
        const [h = 0, m = 0, sec = 0] = String(wait || "").split(":").map(Number).reverse().concat([0, 0, 0]).slice(0, 3).reverse();
        const ms = ((h * 60 + m) * 60 + sec) * 1e3;
        hfQuotaUntil = Date.now() + (ms > 0 ? ms : 60 * 60 * 1e3);
        saveFreeLimits();
      }
      function saveFreeLimits() {
        freeHealth._limits = { hf: hfQuotaUntil, cf: cfQuotaUntil };
        saveFreeHealth();
      }
      function notePollen(balance) {
        pollenBalance = balance;
        pollenCheckedAt = Date.now();
      }
      function checkPollen() {
        if (!config.pollinationsKey || Date.now() - pollenCheckedAt < 15 * 60 * 1e3) return;
        pollenCheckedAt = Date.now();
        httpRequest("GET", `${POLLINATIONS_BASE}/account/balance`, { headers: { Authorization: `Bearer ${config.pollinationsKey}` }, timeoutMs: 15e3 }).then((res) => {
          if (res.status === 200 && Number.isFinite(res.json?.balance)) pollenBalance = res.json.balance;
        }).catch(() => {
        });
      }
      function pollinationsUp() {
        if (!config.pollinationsKey || Date.now() < pollinationsPausedUntil) return false;
        const balance = pollenBalance ?? config.pollinationsInfo?.balance;
        return !(Number.isFinite(balance) && balance <= 0);
      }
      function freeRoutesNow() {
        return {
          pollinations: pollinationsUp(),
          cloudflare: hasCloudflare() && Date.now() > cfQuotaUntil,
          huggingface: Date.now() > hfQuotaUntil
        };
      }
      function availableNow(m, r = freeRoutesNow()) {
        if (m.provider === "gemini") return true;
        if (m.auto) return r.pollinations || r.cloudflare || r.huggingface;
        const e = m.found;
        if (e) return e.provider === "pollinations" ? r.pollinations || e.kind === "code" && r.cloudflare : e.provider === "cloudflare" ? r.cloudflare : r.huggingface;
        if (m.hfOnly || m.provider === "huggingface") return r.huggingface;
        if (m.provider === "pollinations" && !m.open) return r.pollinations || r.cloudflare;
        return r.pollinations || r.cloudflare || r.huggingface;
      }
      function freeStatusNow() {
        checkPollen();
        const r = freeRoutesNow();
        return {
          huggingface: { ok: r.huggingface, until: r.huggingface ? null : new Date(hfQuotaUntil).toISOString() },
          pollinations: { ok: r.pollinations, reason: r.pollinations ? null : !config.pollinationsKey ? "no key" : "no pollen" },
          cloudflare: { ok: r.cloudflare, reason: r.cloudflare ? null : !hasCloudflare() ? "not connected" : "used up today", until: hasCloudflare() && !r.cloudflare ? new Date(cfQuotaUntil).toISOString() : null }
        };
      }
      async function loadFreeModels() {
        try {
          const c = JSON.parse(await fsp.readFile(FREE_MODELS_FILE, "utf8"));
          if (c?.version === FreeModels.VERSION && FreeModels.KINDS.every((k) => Array.isArray(c[k]))) freeCatalog = c;
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t read the list of free models:", err.message);
        }
        await loadFreeHealth();
      }
      function scheduleFreeModels() {
        if (define_process_env_default.FREE_MODELS_AUTO === "0") return;
        const check = () => {
          const age = freeCatalog ? Date.now() - Date.parse(freeCatalog.updatedAt) : Infinity;
          if (!(age < FREE_MODELS_MAX_AGE_MS)) refreshFreeModels();
        };
        setTimeout(check, 15e3).unref();
        setInterval(check, 60 * 60 * 1e3).unref();
      }
      function refreshFreeModels({ wait = false } = {}) {
        if (!freeSearch) {
          freeSearch = (async () => {
            try {
              const c = await FreeModels.discover({ hfToken: config.hfToken || "", cloudflare: hasCloudflare() ? config.cloudflare : null });
              await fsp.mkdir(DATA_DIR, { recursive: true });
              await writeFileSafe(FREE_MODELS_FILE, JSON.stringify(c, null, 1));
              freeCatalog = c;
              freeSearchError = null;
              modelCache = null;
              console.log(`  \u2713 Free models found: ${c.counts.image} image, ${c.counts.video} video, ${c.counts.code} code`);
              if (define_process_env_default.FREE_MODELS_TEST === "1") testNewFreeModels();
            } catch (err) {
              freeSearchError = err.message;
              console.log(`  ! Free models: ${err.message}`);
            } finally {
              freeSearch = null;
            }
          })();
        }
        const run = freeSearch;
        return wait ? run.then(() => freeModelsStatus()) : Promise.resolve(freeModelsStatus());
      }
      function builtInFor(e) {
        const builtInHost = (host) => Object.values(HF_SPACES).some((s) => !s.found && s.host === host);
        if (e.kind === "image") {
          if (e.provider === "pollinations") return OPEN_MODELS.find((m) => m.apiModel === e.apiModel) || null;
          return OPEN_MODELS.find((m) => HF_SPACES[HF_IMAGE_SPACE[m.id]]?.host === e.host) || null;
        }
        if (e.kind === "video") return e.provider === "huggingface" && builtInHost(e.host) ? VIDEO_MODELS.find((m) => m.free) : null;
        if (e.kind === "code") return CODER_MODELS.find((m) => m.id === e.apiModel) || (e.provider === "cloudflare" && e.apiModel === CF_CODER ? CODER_MODELS[0] : null);
        return null;
      }
      function freeImageModels() {
        return (freeCatalog?.image || []).filter((e) => ["huggingface", "pollinations"].includes(e.provider) && !builtInFor(e) && freeState(e) !== "broken").map((e) => ({
          id: e.id,
          label: e.label,
          provider: e.provider,
          open: true,
          group: "found",
          tag: "Found free",
          free: true,
          found: e,
          state: e.provider === "huggingface" ? freeState(e) : "pollen",
          where: FreeModels.whereLabel(e),
          desc: `${e.model} (${e.licenseNote || e.license}), found by the free-model search. ${e.provider === "pollinations" ? "Runs on Pollinations and needs pollen." : `Runs free on Hugging Face in ${e.space}${e.alternates?.length ? ` (backup: ${e.alternates.map((a) => a.space).join(", ")})` : ""} and uses the daily free GPU time.`} Text only \u2013 no references.`,
          refs: false,
          refsHint: "no references \u2013 text only",
          ratios: RATIOS_STD,
          sizes: [],
          thinking: null,
          price: null,
          nodes: false
        })).sort((a, b) => (a.state === "works" ? 0 : 1) - (b.state === "works" ? 0 : 1));
      }
      function freeModelMeta(id) {
        if (id === FREE_AUTO_MODEL.id) return FREE_AUTO_MODEL;
        return freeImageModels().find((m) => m.id === id) || null;
      }
      async function freeGenerate(meta2, prompt, refs, aspectRatio) {
        prompt = plainPrompt(prompt);
        if (meta2.auto) return freeAutoGenerate(prompt, refs, aspectRatio);
        if (!meta2.found) return openGenerate(meta2, prompt, refs, aspectRatio);
        if (refs.length) throw httpError(400, `${meta2.label} can\u2019t use reference images \u2013 pick FLUX.2 klein or a Gemini model.`);
        const e = meta2.found;
        if (e.provider === "pollinations") return pollinationsGenerate({ ...meta2, apiModel: e.apiModel }, plainPrompt(prompt), [], aspectRatio);
        const { key, plan, out } = await foundRun(e, "image", { prompt: plainPrompt(prompt), aspectRatio: aspectRatio || "1:1" });
        const img = await hfDownload(key, out?.[plan.outputIndex]);
        const mimeType = /^image\//.test(img.mimeType) ? img.mimeType : sniffMime(img.data);
        return { images: [{ mimeType, data: img.data.toString("base64") }], text: "", usageMetadata: null, via: "huggingface" };
      }
      async function foundRun(e, kind, input, { signal, onProgress } = {}) {
        const places = [{ space: e.space, host: e.host }, ...e.alternates || []];
        let last;
        for (const [i, place] of places.entries()) {
          const key = `found:${place.host}`;
          HF_SPACES[key] ||= { repo: place.space, host: place.host, api: e.api, title: e.label, found: true };
          const s = HF_SPACES[key];
          try {
            const info = await hfApiInfo(s);
            let plan = FreeModels.analyzeSpace(info, info, kind);
            if (!plan) throw httpError(502, `The free ${e.label} app on Hugging Face has changed \u2013 search for free models again in Settings.`, { code: "hf_api" });
            if (input.image && plan.input === "text" && plan.imageApi) plan = FreeModels.analyzeSpace(info, info, kind, plan.imageApi) || plan;
            s.api = plan.api;
            const out = await hfRun(key, FreeModels.fillValues(plan, input), signal, onProgress);
            noteFree(e, null);
            return { key, plan, out };
          } catch (err) {
            last = err;
            if (i === places.length - 1 || !["hf_unavailable", "hf_api", "hf_busy", "network"].includes(err.info?.code)) break;
            console.log(`  ! ${place.space}: ${err.info?.message || err.message} \u2192 ${places[i + 1].space}`);
          }
        }
        noteFree(e, last);
        throw last;
      }
      var FREE_HEALTH_FILE = path.join(DATA_DIR, "free-models-health.json");
      var FREE_BROKEN_CODES = /* @__PURE__ */ new Set(["hf_api", "hf_run", "hf_unavailable"]);
      var FREE_BROKEN_DAYS = 3;
      var freeHealth = {};
      var freeHealthSave = null;
      var freeTesting = false;
      async function loadFreeHealth() {
        try {
          freeHealth = JSON.parse(await fsp.readFile(FREE_HEALTH_FILE, "utf8")) || {};
        } catch {
          freeHealth = {};
        }
        hfQuotaUntil = Number(freeHealth._limits?.hf) || 0;
        cfQuotaUntil = Number(freeHealth._limits?.cf) || 0;
      }
      function noteFree(e, err) {
        const h = freeHealth[e.id] ||= { strikes: 0 };
        if (!err) Object.assign(h, { ok: (/* @__PURE__ */ new Date()).toISOString(), strikes: 0, error: void 0 });
        else if (FREE_BROKEN_CODES.has(err.info?.code)) Object.assign(h, { fail: (/* @__PURE__ */ new Date()).toISOString(), strikes: (h.strikes || 0) + 1, error: String(err.info?.message || err.message).slice(0, 200) });
        else return;
        saveFreeHealth();
      }
      function saveFreeHealth() {
        clearTimeout(freeHealthSave);
        freeHealthSave = setTimeout(() => writeFileSafe(FREE_HEALTH_FILE, JSON.stringify(freeHealth, null, 1)).catch(() => {
        }), 500);
      }
      function freeState(e) {
        const h = freeHealth[e.id];
        if (!h) return "untested";
        if (h.strikes >= 2 && Date.now() - Date.parse(h.fail) < FREE_BROKEN_DAYS * 864e5) return "broken";
        return h.ok ? "works" : "untested";
      }
      async function testNewFreeModels() {
        if (freeTesting) return;
        freeTesting = true;
        try {
          for (const m of freeImageModels().filter((x) => x.found.provider === "huggingface" && freeState(x.found) === "untested").slice(0, 3)) {
            try {
              await foundRun(m.found, "image", { prompt: "A red apple on a wooden table, soft daylight", aspectRatio: "1:1", area: 512 * 512 });
              console.log(`  \u2713 Free model works: ${m.label}`);
            } catch (err) {
              console.log(`  ! Free model test \u2013 ${m.label}: ${String(err.info?.message || err.message).slice(0, 120)}`);
              if (err.info?.code === "hf_quota") break;
            }
          }
        } finally {
          freeTesting = false;
        }
      }
      function freeVideoModels() {
        return (freeCatalog?.video || []).filter((e) => e.provider === "huggingface" && !builtInFor(e) && freeState(e) !== "broken").map((e) => {
          const d = e.duration;
          const takesFrame = e.input !== "text" || Boolean(e.imageApi);
          return {
            id: e.id,
            label: `${e.label} (found)`,
            provider: "huggingface",
            free: true,
            found: e,
            pricePerSecond: 0,
            ratios: ["16:9", "9:16"],
            resolutions: [e.width ? "480p" : "app default"],
            minSeconds: d ? Math.max(1, Math.ceil(d.min)) : 2,
            maxSeconds: d ? Math.max(1, Math.min(10, Math.floor(d.max))) : 5,
            sound: false,
            firstFrame: e.input === "image" ? "auto" : takesFrame ? "optional" : false,
            lastFrame: false,
            refs: false,
            nodes: false,
            desc: `${e.model} (${e.licenseNote || e.license}), found by the free-model search. Runs free on Hugging Face in ${e.space} and uses the daily free GPU time.${d ? "" : " The app decides the length."}`
          };
        });
      }
      var videoModels = () => [...VIDEO_MODELS, ...freeVideoModels()];
      var publicVideoModels = () => {
        const r = freeRoutesNow();
        return videoModels().map((m) => ({ ...m, availableNow: availableNow(m, r) })).map(({ found, ...m }) => m);
      };
      async function freeAutoGenerate(prompt, refs, aspectRatio) {
        const ranked = [];
        const add = (m) => {
          if (m && !ranked.includes(m)) ranked.push(m);
        };
        if (refs.length) add(OPEN_MODELS.find((m) => m.refs));
        else {
          const found = freeImageModels();
          for (const e of freeCatalog?.image || []) add(builtInFor(e) || found.find((m) => m.id === e.id));
          OPEN_MODELS.forEach(add);
          ranked.sort((a, b) => (a.found && freeState(a.found) === "untested" ? 1 : 0) - (b.found && freeState(b.found) === "untested" ? 1 : 0));
        }
        let last = null;
        let quota = !freeRoutesNow().huggingface;
        let tries = 0;
        for (const m of ranked) {
          if (tries >= 5) break;
          if (m.found?.provider === "pollinations" && !pollinationsUp()) continue;
          if (quota && (m.hfOnly || m.found?.zeroGpu || !m.found && !pollinationsUp() && !hasCloudflare())) continue;
          tries++;
          try {
            return { ...await freeGenerate(m, prompt, refs, aspectRatio), model: m.id };
          } catch (err) {
            last = err;
            if (err.info?.code === "hf_quota") quota = true;
            console.log(`  ! Best free: ${m.label} \u2013 ${String(err.info?.message || err.message).slice(0, 120)}`);
          }
        }
        throw last || httpError(503, "No free model is available right now \u2013 try again later.", { code: "server", retryable: true });
      }
      function coderModels({ svg = false } = {}) {
        const found = (freeCatalog?.code || []).filter((e) => (e.role === "coder" || svg && e.role === "svg") && !builtInFor(e) && (e.provider !== "cloudflare" || hasCloudflare()) && freeState(e) !== "broken").map((e) => ({
          id: e.id,
          label: e.label,
          provider: e.provider,
          found: e,
          svgOnly: e.role === "svg",
          note: e.role === "svg" ? "found \xB7 open source \xB7 SVG only \xB7 free GPU time" : e.provider === "cloudflare" ? "found \xB7 open source \xB7 Cloudflare (free)" : "found \xB7 open source \xB7 needs pollen"
        }));
        return [...CODER_MODELS, ...found];
      }
      var publicCoders = (list2) => {
        const r = freeRoutesNow();
        return list2.map((m) => ({ ...m, availableNow: availableNow(m, r) })).map(({ found, ...m }) => m);
      };
      function runCoder(model, system, user, opts = {}) {
        if (model.provider === "gemini") return coderGemini(model, system, user, opts);
        if (model.provider === "cloudflare") {
          if (!hasCloudflare()) throw httpError(400, "Connect Cloudflare in Settings first.", { code: "cloudflare_key" });
          return cloudflareChat(system, user, opts.maxTokens || 8e3, model.found.apiModel);
        }
        return coderPollinations(model.found ? { ...model, id: model.found.apiModel } : model, system, user, opts);
      }
      async function foundSvg(e, prompt) {
        const { key, plan, out } = await foundRun(e, "code", { prompt });
        const v = out?.[plan.outputIndex];
        if (typeof v === "string") return v;
        if (v?.url || v?.path) return (await hfDownload(key, v)).data.toString("utf8");
        return "";
      }
      function freeModelsStatus() {
        const c = freeCatalog;
        const inMenus = new Set([...freeImageModels(), ...freeVideoModels(), ...coderModels({ svg: true })].map((m) => m.id));
        const row = (e) => ({
          id: e.id,
          rank: e.rank,
          label: e.label,
          model: e.model,
          license: e.license,
          licenseNote: e.licenseNote || null,
          where: FreeModels.whereLabel(e),
          url: e.space ? `https://huggingface.co/spaces/${e.space}` : `https://huggingface.co/${e.model}`,
          role: e.role || null,
          comfy: Boolean(e.comfy),
          nodes: Boolean(e.nodes),
          state: e.provider === "huggingface" ? freeState(e) : null,
          error: e.provider === "huggingface" && freeState(e) === "broken" ? freeHealth[e.id]?.error || null : null,
          use: inMenus.has(e.id) ? "menu" : builtInFor(e) ? "built-in" : e.kind === "code" && e.provider === "cloudflare" ? "connect" : "list"
        });
        return {
          updatedAt: c?.updatedAt || null,
          searching: Boolean(freeSearch),
          testing: freeTesting,
          error: freeSearchError,
          groups: Object.fromEntries(FreeModels.KINDS.map((k) => [k, (c?.[k] || []).map(row)]))
        };
      }
      function videoModel(id) {
        if (id) {
          const m = videoModels().find((x) => x.id === id);
          if (!m) throw httpError(400, `Unknown video model \u201C${id}\u201D.`);
          return m;
        }
        return getApiKey().key ? VIDEO_MODELS[0] : VIDEO_MODELS.find((m) => m.id === "wan-2.2");
      }
      async function startFreeVideoJob(model, { body, prompt, userPrompt, nodes, aspectRatio, first, last }) {
        if (!model.firstFrame) first = last = null;
        const duration = clamp(Math.round((Number(body.duration) || 4) * 10) / 10, model.minSeconds, model.maxSeconds);
        const now = /* @__PURE__ */ new Date();
        const job = {
          id: `vj${now.getTime().toString(36)}${crypto.randomBytes(3).toString("hex")}`,
          provider: "huggingface",
          model: model.id,
          status: "running",
          stage: "Starting\u2026",
          createdAt: now.toISOString(),
          userPrompt: userPrompt || prompt.slice(0, 200),
          prompt: openVideoPrompt(prompt),
          aspectRatio,
          resolution: model.resolutions[0],
          duration,
          sound: model.sound,
          frames: { first: first?.path, last: model.lastFrame && first ? last?.path : void 0 },
          refs: [],
          nodes,
          projectId: body.projectId ? String(body.projectId).slice(0, 40) : void 0,
          segmentId: body.segmentId ? String(body.segmentId).slice(0, 40) : void 0,
          keepLength: body.keepLength !== false,
          estimate: 0
        };
        videoJobs.set(job.id, job);
        console.log(`  \u2026 free video started (${model.label}, ${aspectRatio}, ~${duration} s${first ? ", with frames" : ""})`);
        runFreeVideoJob(job, first, model.lastFrame && first ? last : null);
        await saveVideoJobs();
        return { job: publicJob(job) };
      }
      async function runFreeVideoJob(job, first, last) {
        const controller = new AbortController();
        job.abort = () => controller.abort();
        const timer = setTimeout(() => {
          job.timedOut = true;
          controller.abort();
        }, HF_TIMEOUT_MS);
        const signal = controller.signal;
        const { prompt, duration } = job;
        try {
          const model = videoModels().find((m) => m.id === job.model);
          if (!model) throw httpError(400, "This free video model is no longer in the list \u2013 pick another one.", { code: "bad_request" });
          if (!first && model.firstFrame === "auto") {
            job.stage = "Drawing the first frame (FLUX.1 schnell)\u2026";
            first = await hfFirstFrame(job, signal);
            if (job.status !== "running") return;
            job.frames.first = first.path;
            job.autoFirstFrame = true;
          }
          job.stage = "Generating on Hugging Face\u2019s free GPU\u2026";
          const progress = (p) => {
            job.stage = p.started ? "Generating on Hugging Face\u2019s free GPU\u2026" : `In the queue on Hugging Face (position ${(p.rank ?? 0) + 1}${p.eta ? `, about ${Math.max(1, Math.round(p.eta))} s` : ""})\u2026`;
          };
          if (model.found) {
            const run = await foundRun(model.found, "video", { prompt, aspectRatio: job.aspectRatio, image: first, duration, area: 832 * 480 }, { signal, onProgress: progress });
            job.stage = "Downloading the clip\u2026";
            const clip = await hfDownload(run.key, run.out?.[run.plan.outputIndex]);
            if (job.status !== "running") return;
            await saveVideoItem(job, clip.data, clip.mimeType, { cost: () => 0, via: "huggingface" });
            return;
          }
          let key, values;
          if (job.model === "wan-2.2") {
            [key, values] = last ? ["wanFlf", { start_image_pil: first, end_image_pil: last, prompt, duration_seconds: Math.min(duration, 5.1), randomize_seed: true }] : ["wan", { input_image: first, prompt, duration_seconds: duration, randomize_seed: true }];
          } else if (job.model === "ltx-2.3") {
            const [width, height] = FREE_SIZES["ltx-2.3"][job.aspectRatio];
            [key, values] = ["ltx2", { input_image: first, prompt, duration, enhance_prompt: false, randomize_seed: true, width, height }];
          } else {
            const [width_ui, height_ui] = FREE_SIZES["ltx-video"][job.aspectRatio];
            [key, values] = [first ? "ltxImage" : "ltxText", {
              prompt,
              mode: first ? "image-to-video" : "text-to-video",
              duration_ui: duration,
              width_ui,
              height_ui,
              randomize_seed: true,
              ...first ? { input_image_filepath: first } : {}
            }];
          }
          const out = await hfRun(key, values, signal, (p) => {
            job.stage = p.started ? "Generating on Hugging Face\u2019s free GPU\u2026" : `In the queue on Hugging Face (position ${(p.rank ?? 0) + 1}${p.eta ? `, about ${Math.max(1, Math.round(p.eta))} s` : ""})\u2026`;
          });
          job.stage = "Downloading the clip\u2026";
          const video = await hfDownload(key, out?.[0]);
          if (job.status !== "running") return;
          await saveVideoItem(job, video.data, video.mimeType, { cost: () => 0, via: "huggingface" });
        } catch (err) {
          if (job.status !== "running") return;
          if (job.timedOut) failVideoJob(job, "Hugging Face didn\u2019t finish within 15 minutes \u2013 its free GPUs are very busy. Try again later.");
          else if (!err.info && /fetch failed|ECONN|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|socket/i.test(`${err.message} ${err.code || ""} ${err.cause?.code || ""}`)) {
            failVideoJob(job, "Couldn\u2019t reach Hugging Face \u2013 check the internet connection and try again.");
          } else {
            const info = describeError(err);
            failVideoJob(job, [info.message, info.hint].filter(Boolean).join(" "));
          }
        } finally {
          clearTimeout(timer);
          delete job.abort;
          delete job.stage;
        }
      }
      async function handleVideoGenerate(body) {
        const model = videoModel(body.model);
        const userPrompt = String(body.userPrompt ?? body.prompt ?? "").trim().slice(0, MAX_PROMPT_CHARS);
        let prompt = String(body.prompt || "").trim().slice(0, MAX_PROMPT_CHARS);
        let nodes = cleanNodesMeta(body.nodes);
        if (body.graph) {
          const graph = await resolveGraph({ name: body.graph });
          const c = NodesCore.compile(graph, { target: null, skip: ["prompt"], only: "video" });
          prompt = [prompt, c.addition].filter(Boolean).join("\n\n");
          nodes = cleanNodesMeta({ graphId: graph.id, name: graph.name, chips: c.chips });
        }
        if (!prompt) throw httpError(400, "Describe the video.");
        const aspectRatio = model.ratios.includes(body.aspectRatio) ? body.aspectRatio : "16:9";
        const first = await videoFrame(body.firstFrame, body.firstFrameId);
        const last = await videoFrame(body.lastFrame, body.lastFrameId);
        if (last && !first) throw httpError(400, "A last frame needs a first frame as well.");
        if (model.free) return startFreeVideoJob(model, { body, prompt, userPrompt, nodes, aspectRatio, first, last });
        const key = requireApiKey();
        const resolution = model.resolutions.includes(body.resolution) ? body.resolution : "720p";
        const duration = clamp(Math.round(Number(body.duration) || 6), 3, 10);
        const sound = body.sound !== false;
        const refs = first ? [] : await loadRefFiles(cleanRefs(body.refs), 3);
        const text = [
          prompt,
          `Length: about ${duration} seconds.`,
          sound ? "" : "Silent: no audio at all.",
          first && last ? "The clip starts exactly on the first image (<FIRST_FRAME>) and ends exactly on the second image (<LAST_FRAME>); move between them smoothly." : first ? "The clip starts exactly on the given image (<FIRST_FRAME>)." : ""
        ].filter(Boolean).join("\n\n");
        const input = [
          ...first ? [first] : [],
          ...last ? [last] : [],
          ...refs
        ].map((f) => ({ type: "image", data: f.data.toString("base64"), mime_type: f.mimeType }));
        input.push({ type: "text", text });
        const request2 = { model: OMNI_MODEL, input, response_format: { type: "video", aspect_ratio: aspectRatio, resolution }, background: true, store: true };
        if (first) request2.generation_config = { video_config: { task: "image_to_video" } };
        else if (refs.length) request2.generation_config = { video_config: { task: "reference_to_video" } };
        const started2 = await gemini("POST", "interactions", { key, body: request2, timeoutMs: 12e4 });
        const now = /* @__PURE__ */ new Date();
        const job = {
          id: `vj${now.getTime().toString(36)}${crypto.randomBytes(3).toString("hex")}`,
          interactionId: started2.id,
          provider: "gemini",
          model: OMNI_MODEL,
          status: "running",
          createdAt: now.toISOString(),
          userPrompt: userPrompt || prompt.slice(0, 200),
          prompt: text,
          aspectRatio,
          resolution,
          duration,
          sound,
          frames: { first: first?.path, last: last?.path },
          refs: refs.length ? cleanRefs(body.refs).slice(0, 3) : [],
          nodes,
          projectId: body.projectId ? String(body.projectId).slice(0, 40) : void 0,
          segmentId: body.segmentId ? String(body.segmentId).slice(0, 40) : void 0,
          keepLength: body.keepLength !== false,
          estimate: duration * VIDEO_MODELS[0].pricePerSecond
        };
        videoJobs.set(job.id, job);
        console.log(`  \u2026 video started (${resolution}, ${aspectRatio}, ~${duration} s${first ? ", with frames" : ""})`);
        if (started2.status === "completed") await finishVideoJob(job, started2);
        else if (["failed", "cancelled", "incomplete"].includes(started2.status)) failVideoJob(job, interactionError(started2));
        else pollVideoJob(job);
        await saveVideoJobs();
        return { job: publicJob(job) };
      }
      function interactionError(res) {
        const e = Array.isArray(res.errors) ? res.errors[0] : null;
        const msg = e?.message || (res.status === "cancelled" ? "The video was cancelled." : "Gemini couldn\u2019t make this video.");
        return /safety|blocked|policy/i.test(msg) ? `${msg} \u2013 Gemini\u2019s safety filters stopped it; describe it differently.` : msg;
      }
      function pollVideoJob(job) {
        const tick = async () => {
          if (job.status !== "running") return;
          if (Date.now() - Date.parse(job.createdAt) > VIDEO_TIMEOUT_MS) {
            failVideoJob(job, "Gemini didn\u2019t finish the video within 20 minutes.");
            return;
          }
          try {
            const res = await gemini("GET", `interactions/${encodeURIComponent(job.interactionId)}`, { key: requireApiKey(), timeoutMs: 12e4 });
            if (res.status === "completed") {
              await finishVideoJob(job, res);
              return;
            }
            if (["failed", "cancelled", "incomplete"].includes(res.status)) {
              failVideoJob(job, interactionError(res));
              return;
            }
          } catch (err) {
            const info = describeError(err);
            if (["bad_key", "billing", "forbidden", "region", "quota"].includes(info.code)) {
              failVideoJob(job, info.message);
              return;
            }
            job.lastError = info.message;
          }
          job.timer = setTimeout(tick, VIDEO_POLL_MS);
        };
        job.timer = setTimeout(tick, VIDEO_POLL_MS);
      }
      function failVideoJob(job, message) {
        job.status = "error";
        job.error = message;
        job.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
        console.log(`  \u2717 video: ${message}`);
        saveVideoJobs().catch(() => {
        });
      }
      async function finishVideoJob(job, res) {
        const content = (res.steps || []).filter((s) => s.type === "model_output").flatMap((s) => s.content || []);
        const video = content.find((c) => c.type === "video");
        if (!video) {
          const said = content.filter((c) => c.type === "text").map((c) => c.text).join(" ").slice(0, 300);
          failVideoJob(job, said ? `Gemini answered without a video: \u201C${said}\u201D` : "Gemini finished without a video.");
          return;
        }
        let buf;
        try {
          if (video.data) buf = import_buffer.Buffer.from(video.data, "base64");
          else {
            const r = await fetch(video.uri, { headers: { "x-goog-api-key": requireApiKey() } });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            buf = import_buffer.Buffer.from(await r.arrayBuffer());
          }
        } catch (err) {
          failVideoJob(job, `Couldn\u2019t download the video (${err.message}).`);
          return;
        }
        await saveVideoItem(job, buf, video.mime_type, { cost: (seconds) => videoCost(res.usage, seconds || job.duration), usage: res.usage });
      }
      async function saveVideoItem(job, buf, type, { cost, usage, via } = {}) {
        const mimeType = VIDEO_MIME_EXT[type] ? type : "video/mp4";
        const info = mimeType === "video/mp4" ? mp4Info(buf) : {};
        const size = videoSize(job.aspectRatio, job.resolution);
        const now = /* @__PURE__ */ new Date();
        const file = await stashImage(buf, mimeType, now, slugify(job.userPrompt) || "video");
        const seconds = info.duration || null;
        const item = {
          id: file.id,
          batchId: job.id,
          batchCreatedAt: job.createdAt,
          index: 0,
          createdAt: now.toISOString(),
          model: job.model || OMNI_MODEL,
          via,
          prompt: job.prompt,
          userPrompt: job.userPrompt,
          style: null,
          styleId: null,
          nodes: job.nodes,
          aspectRatio: job.aspectRatio,
          imageSize: null,
          resolution: via === "huggingface" && info.height ? `${Math.min(info.width, info.height)}p` : job.resolution,
          thinkingLevel: null,
          refs: [
            job.frames.first && { path: job.frames.first, role: job.autoFirstFrame ? "first frame (drawn by FLUX.1 schnell)" : "first frame" },
            job.frames.last && { path: job.frames.last, role: "last frame" },
            ...job.refs || []
          ].filter(Boolean),
          frames: job.frames,
          day: localDay(now),
          name: file.name,
          mimeType,
          width: info.width || size.width,
          height: info.height || size.height,
          duration: seconds,
          bytes: file.bytes,
          durationMs: Date.now() - Date.parse(job.createdAt),
          cost: cost ? cost(seconds) : null,
          usage,
          interactionId: job.interactionId,
          pending: true,
          localPath: file.localPath
        };
        history.unshift(item);
        await saveHistory();
        scheduleUploads();
        job.status = "done";
        job.itemId = item.id;
        job.finishedAt = now.toISOString();
        const price = via === "huggingface" ? "free" : `\u2248 ${item.cost != null ? `$${item.cost.toFixed(2)}` : "?"}`;
        console.log(`  \u2713 video ${item.width}\xD7${item.height}${seconds ? ` \xB7 ${seconds.toFixed(1)} s` : ""} \xB7 ${price}`);
        if (job.projectId && job.segmentId) await applyRegeneration(job, item).catch((err) => console.warn("Couldn\u2019t update the project:", err.message));
        await saveVideoJobs();
      }
      function handleVideoJobs() {
        return { jobs: [...videoJobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30).map(publicJob) };
      }
      function handleVideoJob(id) {
        const job = videoJobs.get(id);
        if (!job) throw httpError(404, "No such video job.");
        return { job: publicJob(job) };
      }
      async function handleVideoCancel(id) {
        const job = videoJobs.get(id);
        if (!job) throw httpError(404, "No such video job.");
        if (job.status === "running") {
          clearTimeout(job.timer);
          if (job.provider === "huggingface") job.abort?.();
          else await gemini("POST", `interactions/${encodeURIComponent(job.interactionId)}/cancel`, { key: requireApiKey(), body: {}, timeoutMs: 3e4 }).catch(() => {
          });
          failVideoJob(job, "Cancelled.");
          job.status = "cancelled";
          await saveVideoJobs();
        }
        return { job: publicJob(job) };
      }
      async function handleVideoSave(body) {
        const mimeType = VIDEO_MIME_EXT[body.mimeType] ? body.mimeType : null;
        const buf = mimeType && typeof body.data === "string" ? import_buffer.Buffer.from(body.data, "base64") : null;
        if (!buf || buf.length < 1e3) throw httpError(400, "That isn\u2019t a valid video.");
        if (buf.length > MAX_VIDEO_UPLOAD) throw httpError(413, "The video is too big (max 60 MB).");
        const label = String(body.label || "Edited video").trim().slice(0, 80) || "Edited video";
        const now = /* @__PURE__ */ new Date();
        const file = await stashImage(buf, mimeType, now, slugify(label) || "video");
        const info = mimeType === "video/mp4" ? mp4Info(buf) : {};
        const num = (v, max) => {
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? Math.min(max, n) : null;
        };
        const item = {
          id: file.id,
          batchId: file.id,
          batchCreatedAt: now.toISOString(),
          index: 0,
          createdAt: now.toISOString(),
          model: "video-edit",
          prompt: String(body.description || label).slice(0, 2e3),
          userPrompt: label,
          style: null,
          styleId: null,
          aspectRatio: ["16:9", "9:16"].includes(body.aspectRatio) ? body.aspectRatio : "auto",
          imageSize: null,
          thinkingLevel: null,
          refs: [],
          day: localDay(now),
          name: file.name,
          mimeType,
          width: info.width || num(body.width, 8e3),
          height: info.height || num(body.height, 8e3),
          duration: info.duration || num(body.duration, 36e3),
          bytes: file.bytes,
          cost: null,
          projectId: body.projectId ? String(body.projectId).slice(0, 40) : void 0,
          pending: true,
          localPath: file.localPath
        };
        history.unshift(item);
        await saveHistory();
        scheduleUploads();
        console.log(`  \u2713 video saved: ${label} \xB7 ${(file.bytes / 1024 / 1024).toFixed(1)} MB`);
        return { items: [publicItem(item)] };
      }
      function cleanSegment(s) {
        const n = (v) => Math.max(0, Math.round((Number(v) || 0) * 1e3) / 1e3);
        const seg = {
          id: String(s?.id || `s${crypto.randomBytes(4).toString("hex")}`).slice(0, 40),
          itemId: String(s?.itemId || "").slice(0, 60),
          in: n(s?.in),
          out: n(s?.out),
          label: s?.label ? String(s.label).slice(0, 120) : void 0,
          takes: (Array.isArray(s?.takes) ? s.takes : []).slice(-20).map((t) => ({ itemId: String(t.itemId || "").slice(0, 60), in: n(t.in), out: n(t.out), at: String(t.at || "").slice(0, 30) })).filter((t) => t.itemId),
          frames: s?.frames && typeof s.frames === "object" ? Object.fromEntries(["first", "last"].filter((k) => /^refs\/[\w.-]+$/.test(s.frames[k] || "")).map((k) => [k, s.frames[k]])) : void 0,
          regenAt: s?.regenAt ? String(s.regenAt).slice(0, 30) : void 0
        };
        if (seg.out <= seg.in) seg.out = seg.in + 0.1;
        return seg;
      }
      function cleanProject(p) {
        return {
          id: String(p?.id || `p${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`).replace(/[^\w-]/g, "").slice(0, 40),
          name: String(p?.name || "Untitled video").slice(0, 80),
          aspectRatio: p?.aspectRatio === "9:16" ? "9:16" : "16:9",
          segments: (Array.isArray(p?.segments) ? p.segments : []).slice(0, 300).map(cleanSegment).filter((s) => s.itemId),
          createdAt: String(p?.createdAt || (/* @__PURE__ */ new Date()).toISOString()),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      async function loadProjects() {
        if (videoProjects) return videoProjects;
        videoProjects = /* @__PURE__ */ new Map();
        try {
          for (const p of JSON.parse(await fsp.readFile(PROJECTS_FILE, "utf8"))) {
            const clean = cleanProject(p);
            clean.updatedAt = p.updatedAt || clean.updatedAt;
            videoProjects.set(clean.id, clean);
          }
        } catch (err) {
          if (err.code !== "ENOENT") console.warn("Couldn\u2019t read the video projects:", err.message);
        }
        return videoProjects;
      }
      async function saveProjects() {
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await writeFileSafe(PROJECTS_FILE, JSON.stringify([...videoProjects.values()], null, 1));
      }
      async function handleProjectsList() {
        const map = await loadProjects();
        return { projects: [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
      }
      async function handleProjectSave(body) {
        const map = await loadProjects();
        const project = cleanProject(body.project);
        const stored = map.get(project.id);
        let merged = false;
        for (const seg of project.segments) {
          const old = stored?.segments.find((s) => s.id === seg.id);
          if (old?.regenAt && old.regenAt !== seg.regenAt) {
            Object.assign(seg, { itemId: old.itemId, in: old.in, out: old.out, takes: old.takes, frames: old.frames, regenAt: old.regenAt });
            merged = true;
          }
        }
        map.set(project.id, project);
        await saveProjects();
        return { project, merged };
      }
      async function handleProjectDelete(body) {
        const map = await loadProjects();
        if (!map.delete(String(body.id || ""))) throw httpError(404, "No such project.");
        await saveProjects();
        return { ok: true };
      }
      async function projectById(id) {
        const map = await loadProjects();
        const p = map.get(String(id || ""));
        if (!p) throw httpError(404, `No video project \u201C${id}\u201D.`);
        return p;
      }
      var clipLength = (item) => item?.duration || 8;
      async function handleProjectEdit(body) {
        const op = String(body.op || "");
        if (op === "create") {
          return handleProjectSave({ project: { name: body.name || "Untitled video", aspectRatio: body.aspect_ratio || body.aspectRatio } });
        }
        const p = await projectById(body.project);
        const segIndex = () => {
          const i = p.segments.findIndex((s) => s.id === body.segment);
          if (i < 0) throw httpError(404, `No segment \u201C${body.segment}\u201D in this project.`);
          return i;
        };
        if (op === "add_clip") {
          const item = findItem(String(body.item_id || body.itemId || ""));
          if (!/^video\//.test(item.mimeType || "")) throw httpError(400, "That item isn\u2019t a video.");
          const seg = cleanSegment({ itemId: item.id, in: 0, out: clipLength(item), label: item.userPrompt });
          const at = Number.isInteger(body.at) ? clamp(body.at, 0, p.segments.length) : p.segments.length;
          p.segments.splice(at, 0, seg);
        } else if (op === "split") {
          const i = segIndex();
          const s = p.segments[i];
          const cut = s.in + Number(body.at_seconds);
          if (!(cut > s.in + 0.1 && cut < s.out - 0.1)) throw httpError(400, `Split inside the segment: between 0.1 and ${(s.out - s.in - 0.1).toFixed(2)} seconds.`);
          const right = cleanSegment({ ...s, id: void 0, in: cut, takes: [], frames: s.frames?.last ? { last: s.frames.last } : void 0, regenAt: void 0 });
          p.segments.splice(i, 1, cleanSegment({ ...s, out: cut, frames: s.frames?.first ? { first: s.frames.first } : void 0 }), right);
        } else if (op === "delete_segment") {
          p.segments.splice(segIndex(), 1);
        } else if (op === "trim") {
          const i = segIndex();
          const s = p.segments[i];
          const len = clipLength(history.find((it) => it.id === s.itemId));
          const inn = clamp(Number(body.in_seconds ?? s.in), 0, len), out = clamp(Number(body.out_seconds ?? s.out), 0, len);
          if (out - inn < 0.1) throw httpError(400, "A segment must be at least 0.1 s long.");
          p.segments[i] = cleanSegment({ ...s, in: inn, out, frames: void 0 });
        } else if (op === "move") {
          const i = segIndex();
          const [s] = p.segments.splice(i, 1);
          p.segments.splice(clamp(Number(body.to_index) || 0, 0, p.segments.length), 0, s);
        } else throw httpError(400, "Unknown operation.");
        p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        await saveProjects();
        return { project: p };
      }
      async function handleProjectRegenerate(body) {
        const p = await projectById(body.project);
        const i = p.segments.findIndex((s) => s.id === body.segment);
        if (i < 0) throw httpError(404, "No such segment.");
        const seg = p.segments[i], prev = p.segments[i - 1], next = p.segments[i + 1];
        const instruction = String(body.instruction || "").trim();
        if (!instruction) throw httpError(400, "Say what should happen in this part.");
        const model = videoModel(body.model);
        const wantFirst = body.before !== false;
        const wantLast = wantFirst && body.after !== false && model.lastFrame;
        const firstFrame = !wantFirst ? null : body.firstFrame?.path ? body.firstFrame : prev ? { path: prev.frames?.last } : seg.frames?.first ? { path: seg.frames.first } : null;
        const lastFrame = !wantLast ? null : body.lastFrame?.path ? body.lastFrame : next ? { path: next.frames?.first } : null;
        if (wantFirst && prev && !firstFrame?.path || wantLast && next && !lastFrame?.path) {
          throw httpError(409, "The frames around this segment haven\u2019t been captured yet.", { code: "frames_missing", hint: "Open the project once in the app\u2019s Video view \u2013 it captures them automatically." });
        }
        const label = (it) => history.find((x) => x.id === it?.itemId)?.userPrompt || it?.label || "";
        const context = [
          "This clip replaces one part of a longer edited video and must blend in seamlessly with the rest: same characters, setting, lighting, color, style, camera language and pacing.",
          prev ? `What comes before it: ${label(prev).slice(0, 400)}.` : "It is the opening of the video.",
          next ? `What comes after it: ${label(next).slice(0, 400)}.` : "It is the end of the video.",
          `What happens in this part: ${instruction}`
        ].join("\n");
        const length = model.free ? Math.round((seg.out - seg.in) * 10) / 10 : Math.max(3, Math.min(10, Math.round(seg.out - seg.in)));
        return handleVideoGenerate({
          prompt: context,
          userPrompt: instruction,
          aspectRatio: p.aspectRatio,
          resolution: body.resolution || "720p",
          duration: length,
          sound: body.sound !== false,
          firstFrame: firstFrame?.path ? firstFrame : void 0,
          lastFrame: lastFrame?.path && firstFrame?.path ? lastFrame : void 0,
          projectId: p.id,
          segmentId: seg.id,
          keepLength: body.keepLength !== false,
          nodes: body.nodes,
          model: model.id
        });
      }
      async function applyRegeneration(job, item) {
        const map = await loadProjects();
        const p = map.get(job.projectId);
        const seg = p?.segments.find((s) => s.id === job.segmentId);
        if (!seg) return;
        const length = seg.out - seg.in;
        seg.takes = [...seg.takes || [], { itemId: seg.itemId, in: seg.in, out: seg.out, at: (/* @__PURE__ */ new Date()).toISOString() }].slice(-20);
        seg.itemId = item.id;
        seg.in = 0;
        seg.out = job.keepLength && item.duration ? Math.min(length, item.duration) : item.duration || length;
        seg.frames = void 0;
        seg.regenAt = (/* @__PURE__ */ new Date()).toISOString();
        p.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        await saveProjects();
      }
      async function runVideoNode(graph, node, opts) {
        const c = NodesCore.compile(graph, { target: node.id, prompt: opts.prompt || "", formats: opts.formats });
        const v = node.values;
        const first = await nodeImageRef(c.inputs.first, graph, 0);
        const last = first ? await nodeImageRef(c.inputs.last, graph, 0) : null;
        const refs = [];
        if (!first) for (const e of c.inputs.refs || []) {
          const r = await nodeImageRef(e, graph, 0);
          if (r) refs.push({ path: r.path, role: r.role });
        }
        return handleVideoGenerate({
          model: v.model,
          prompt: c.prompt,
          userPrompt: c.parts.base || graph.name,
          aspectRatio: v.ratio,
          resolution: v.resolution,
          duration: v.duration,
          sound: v.sound,
          firstFrame: first ? { path: first.path } : void 0,
          lastFrame: last ? { path: last.path } : void 0,
          refs,
          nodes: { graphId: graph.id, name: graph.name, chips: c.chips }
        });
      }
      var routes = [
        ["GET", /^\/api\/ping$/, () => ({ app: "hombresai" })],
        ["GET", /^\/api\/effects$/, () => handleEffectsList()],
        ["POST", /^\/api\/effects\/custom$/, (body) => handleEffectSave(body)],
        ["POST", /^\/api\/effects\/custom\/delete$/, (body) => handleEffectDelete(body)],
        ["GET", /^\/api\/effects\/presets$/, () => handleFxPresetsList()],
        ["POST", /^\/api\/effects\/presets$/, (body) => handleFxPresetSave(body)],
        ["POST", /^\/api\/effects\/presets\/rename$/, (body) => handleFxPresetRename(body)],
        ["POST", /^\/api\/effects\/presets\/delete$/, (body) => handleFxPresetDelete(body)],
        ["POST", /^\/api\/effects\/presets\/open$/, () => handleFxPresetsOpen()],
        ["POST", /^\/api\/effects\/ai$/, (body) => handleEffectAi(body)],
        ["POST", /^\/api\/effects\/export$/, (body) => handleEffectExport(body)],
        ["POST", /^\/api\/vectors\/ai$/, (body) => handleVectorAi(body)],
        ["GET", /^\/api\/nodes$/, () => handleNodesList()],
        ["GET", /^\/api\/nodes\/types$/, () => handleNodeTypes()],
        ["POST", /^\/api\/nodes$/, (body) => handleNodesSave(body)],
        ["POST", /^\/api\/nodes\/delete$/, (body) => handleNodesDelete(body)],
        ["POST", /^\/api\/nodes\/compile$/, (body) => handleNodesCompile(body)],
        ["POST", /^\/api\/nodes\/run$/, (body) => handleNodesRun(body)],
        ["POST", /^\/api\/nodes\/template$/, (body) => handleNodesTemplate(body)],
        ["GET", /^\/api\/nodes\/templates$/, () => handleUserTemplatesList()],
        ["POST", /^\/api\/nodes\/templates$/, (body) => handleUserTemplateSave(body)],
        ["POST", /^\/api\/nodes\/templates\/delete$/, (body) => handleUserTemplateDelete(body)],
        ["POST", /^\/api\/refs\/from-items$/, (body) => handleRefsFromItems(body)],
        ["GET", /^\/api\/video\/models$/, () => ({ models: publicVideoModels(), freeStatus: freeStatusNow() })],
        ["POST", /^\/api\/video\/generate$/, (body) => handleVideoGenerate(body)],
        ["GET", /^\/api\/video\/jobs$/, () => handleVideoJobs()],
        ["GET", /^\/api\/video\/jobs\/([\w-]+)$/, (body, m) => handleVideoJob(m[1])],
        ["POST", /^\/api\/video\/jobs\/([\w-]+)\/cancel$/, (body, m) => handleVideoCancel(m[1])],
        ["POST", /^\/api\/video\/save$/, (body) => handleVideoSave(body)],
        ["GET", /^\/api\/video\/projects$/, () => handleProjectsList()],
        ["POST", /^\/api\/video\/projects$/, (body) => handleProjectSave(body)],
        ["POST", /^\/api\/video\/projects\/delete$/, (body) => handleProjectDelete(body)],
        ["POST", /^\/api\/video\/projects\/edit$/, (body) => handleProjectEdit(body)],
        ["POST", /^\/api\/video\/projects\/regenerate$/, (body) => handleProjectRegenerate(body)],
        ["POST", /^\/api\/vectors\/export$/, (body) => handleVectorExport(body)],
        ["GET", /^\/api\/config$/, async () => {
          await Promise.race([refreshFx(), sleep(2500)]);
          return publicConfig();
        }],
        ["POST", /^\/api\/config$/, (body) => handleConfig(body)],
        ["GET", /^\/api\/models$/, () => handleModels()],
        ["GET", /^\/api\/free-models$/, () => freeModelsStatus()],
        ["POST", /^\/api\/free-models\/refresh$/, () => refreshFreeModels({ wait: true })],
        ["GET", /^\/api\/history$/, () => ({ items: history.map(publicItem), drive: driveStatus() })],
        ["POST", /^\/api\/history\/delete$/, (body) => handleDelete(body)],
        ["PATCH", /^\/api\/history\/([\w-]+)$/, (body, m) => handlePatch(m[1], body)],
        ["POST", /^\/api\/history\/([\w-]+)\/thumb$/, (body, m) => handleThumb(m[1], body)],
        ["POST", /^\/api\/refs$/, (body) => handleRefUpload(body)],
        ["POST", /^\/api\/generate$/, (body) => handleGenerate(body)],
        ["POST", /^\/api\/enhance$/, (body) => handleEnhance(body)],
        ["POST", /^\/api\/drive\/disconnect$/, () => handleDriveDisconnect()],
        ["POST", /^\/api\/drive\/sync$/, async () => {
          await scheduleUploads();
          return driveStatus();
        }],
        ["POST", /^\/api\/open-folder$/, () => handleOpenFolder()]
      ];
      function sendJson(res, status, data2) {
        const body = JSON.stringify(data2);
        res.writeHead(status, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": import_buffer.Buffer.byteLength(body),
          "Cache-Control": "no-store"
        });
        res.end(body);
      }
      function sendText(res, status, text) {
        res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end(text);
      }
      function redirect(res, location) {
        res.writeHead(302, { Location: location, "Cache-Control": "no-store" });
        res.end();
      }
      function readJsonBody(req) {
        return new Promise((resolve, reject) => {
          const chunks = [];
          let size = 0;
          req.on("data", (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
              reject(httpError(413, "The request is too large."));
              req.destroy();
            } else {
              chunks.push(chunk);
            }
          });
          req.on("end", () => {
            try {
              resolve(chunks.length ? JSON.parse(import_buffer.Buffer.concat(chunks).toString("utf8")) : {});
            } catch {
              reject(httpError(400, "Invalid JSON."));
            }
          });
          req.on("error", reject);
        });
      }
      async function serveFile(req, res, baseDir, rel, cacheControl) {
        const file = resolveInside(baseDir, rel);
        let stat3 = null;
        try {
          stat3 = file ? await fsp.stat(file) : null;
        } catch {
        }
        if (!stat3?.isFile()) return sendText(res, 404, "Not found");
        const ext = path.extname(file).slice(1).toLowerCase();
        const total = stat3.size;
        const headers = {
          "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
          "Cache-Control": cacheControl,
          "X-Content-Type-Options": "nosniff",
          "Accept-Ranges": "bytes"
        };
        if (ext === "html") headers["Content-Security-Policy"] = CSP;
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
        if (range && (range[1] || range[2])) {
          const start = range[1] === "" ? Math.max(0, total - Number(range[2])) : Number(range[1]);
          const end = Math.min(total - 1, range[1] !== "" && range[2] !== "" ? Number(range[2]) : total - 1);
          if (start >= total || end < start) {
            res.writeHead(416, { "Content-Range": `bytes */${total}` });
            res.end();
            return;
          }
          res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": end - start + 1 });
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          fs.createReadStream(file, { start, end }).on("error", () => res.destroy()).pipe(res);
          return;
        }
        res.writeHead(200, { ...headers, "Content-Length": total });
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
      }
      async function serveMedia(req, res, id, download) {
        const item = history.find((i) => i.id === id);
        if (!item) return sendText(res, 404, "Image not found.");
        let entry = cacheGet(id);
        if (!entry && item.localPath) {
          try {
            entry = { buffer: await fsp.readFile(item.localPath), mimeType: item.mimeType };
          } catch {
          }
        }
        if (!entry && item.drive?.id) {
          try {
            const r = await driveRequest("GET", `${GOOGLE.drive}/files/${encodeURIComponent(item.drive.id)}?alt=media`, { binary: true, timeoutMs: 12e4 });
            if (r.status !== 200) return sendText(res, r.status === 404 ? 404 : 502, r.status === 404 ? "The file is no longer on Google Drive." : "Google Drive didn\u2019t return the image.");
            entry = { buffer: r.buffer, mimeType: item.mimeType };
            cachePut(id, r.buffer, item.mimeType);
          } catch (err) {
            return sendText(res, 502, err.info?.message || err.message);
          }
        }
        if (!entry) return sendText(res, 404, "The image isn\u2019t available.");
        const headers = {
          "Content-Type": entry.mimeType || "application/octet-stream",
          "Content-Length": entry.buffer.length,
          "Cache-Control": "private, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff"
        };
        if (entry.mimeType === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
        if (download) headers["Content-Disposition"] = `attachment; filename*=UTF-8''${encodeURIComponent(item.name || `${id}.jpg`)}`;
        headers["Accept-Ranges"] = "bytes";
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
        const total = entry.buffer.length;
        if (range && !download && (range[1] || range[2])) {
          const start = range[1] === "" ? Math.max(0, total - Number(range[2])) : Number(range[1]);
          const end = Math.min(total - 1, range[1] !== "" && range[2] !== "" ? Number(range[2]) : total - 1);
          if (start >= total || end < start) {
            res.writeHead(416, { "Content-Range": `bytes */${total}` });
            res.end();
            return;
          }
          res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": end - start + 1 });
          res.end(req.method === "HEAD" ? void 0 : entry.buffer.subarray(start, end + 1));
          return;
        }
        res.writeHead(200, headers);
        res.end(req.method === "HEAD" ? void 0 : entry.buffer);
      }
      function connectAllowed(origin) {
        if (!origin) return false;
        if (config.connectOrigin && origin === config.connectOrigin) return true;
        try {
          const u = new URL(origin);
          return ["http:", "https:"].includes(u.protocol) && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
        } catch {
          return false;
        }
      }
      var isConnectReadPath = (pathname) => pathname === "/api/history" || /^\/media\/[\w-]+$/.test(pathname);
      async function handleRequest(req, res, port) {
        const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
        const host = String(req.headers.host || "").toLowerCase();
        if (!allowed.includes(host)) return sendJson(res, 403, { error: { message: "Host not allowed." } });
        const url = new URL(req.url, `http://${host}`);
        const { pathname } = url;
        const reqOrigin = req.headers.origin;
        const connectRead = connectAllowed(reqOrigin) && isConnectReadPath(pathname);
        if (req.method === "OPTIONS" && connectRead) {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": reqOrigin,
            "Vary": "Origin",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "*",
            "Access-Control-Allow-Private-Network": "true",
            "Access-Control-Max-Age": "600"
          });
          res.end();
          return;
        }
        if (pathname.startsWith("/api/")) {
          const origin = req.headers.origin;
          if (origin && !allowed.some((h) => origin === `http://${h}`) && !(connectRead && req.method === "GET")) {
            return sendJson(res, 403, { error: { message: "Origin not allowed." } });
          }
          if (connectRead) {
            res.setHeader("Access-Control-Allow-Origin", reqOrigin);
            res.setHeader("Vary", "Origin");
          }
          const route = routes.find(([method, re]) => method === req.method && re.test(pathname));
          if (!route) return sendJson(res, 404, { error: { message: "Unknown endpoint." } });
          try {
            let body = {};
            if (req.method !== "GET") {
              if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) throw httpError(415, "Expected JSON.");
              body = await readJsonBody(req);
            }
            sendJson(res, 200, await route[2](body, pathname.match(route[1])));
          } catch (err) {
            const status = err.httpStatus || (err instanceof GeminiError ? 502 : 500);
            if (status === 500) console.error(err);
            sendJson(res, status, { error: describeError(err) });
          }
          return;
        }
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.writeHead(405);
          res.end();
          return;
        }
        if (pathname === "/oauth/start") return oauthStart(res);
        if (pathname === "/oauth/callback") return oauthCallback(url, res);
        const media = pathname.match(/^\/media\/([\w-]+)$/);
        if (media) {
          if (connectRead) {
            res.setHeader("Access-Control-Allow-Origin", reqOrigin);
            res.setHeader("Vary", "Origin");
          }
          return serveMedia(req, res, media[1], url.searchParams.has("download"));
        }
        if (pathname.startsWith("/thumbs/")) return serveFile(req, res, THUMBS_DIR, pathname.slice("/thumbs/".length), "private, max-age=31536000, immutable");
        if (pathname.startsWith("/fxpresets/")) return serveFile(req, res, FX_PRESETS_DIR, pathname.slice("/fxpresets/".length), "private, max-age=31536000, immutable");
        if (pathname.startsWith("/refs/")) return serveFile(req, res, REFS_DIR, pathname.slice("/refs/".length), "private, max-age=31536000, immutable");
        return serveFile(req, res, PUBLIC_DIR, pathname === "/" ? "index.html" : pathname, "no-cache");
      }
      function listen(port) {
        return new Promise((resolve, reject) => {
          const server = http.createServer((req, res) => {
            handleRequest(req, res, port).catch((err) => {
              console.error(err);
              if (!res.headersSent) sendJson(res, 500, { error: { message: "Internal server error." } });
              else res.destroy();
            });
          });
          server.once("error", reject);
          server.listen(port, HOST, () => resolve(server));
        });
      }
      async function findRunningInstance(port) {
        try {
          const res = await httpRequest("GET", `http://${HOST}:${port}/api/ping`, { timeoutMs: 1500 });
          return ["hombresai", "myhighsfield"].includes(res.json?.app) ? `http://${HOST}:${port}` : null;
        } catch {
          return null;
        }
      }
      async function main() {
        loadConfig();
        refreshFx();
        await fsp.mkdir(DATA_DIR, { recursive: true });
        const running = await findRunningInstance(BASE_PORT);
        if (running) {
          console.log(`hombresai is already running at ${running} \u2013 opening it.`);
          openExternal(running);
          return;
        }
        await loadHistory();
        await loadVideoJobs();
        await loadFreeModels();
        await migrateLegacyOutput();
        let port = BASE_PORT;
        for (; ; port++) {
          try {
            await listen(port);
            break;
          } catch (err) {
            if (!["EADDRINUSE", "EACCES"].includes(err.code) || port >= BASE_PORT + 20) throw err;
          }
        }
        serverPort = port;
        const url = `http://${HOST}:${port}`;
        const { key, source } = getApiKey();
        const d = config.drive;
        const pendingCount = history.filter((i) => i.pending).length;
        console.log("");
        console.log(`  hombresai is running at ${url}`);
        console.log(`  Images are saved to: ${d.refreshToken ? `Google Drive${d.email ? ` (${d.email})` : ""} \u2192 folder ${DRIVE_FOLDER}` : "Google Drive \u2013 not connected yet, connect it in Settings"}`);
        if (pendingCount) console.log(`  ${pendingCount} ${pendingCount === 1 ? "image is" : "images are"} waiting to be uploaded.`);
        console.log(`  Gemini API key: ${key ? source === "env" ? "from an environment variable" : "saved" : "missing \u2013 add it in the app"}`);
        console.log(`  Open-source models (Pollinations): ${config.pollinationsKey ? "key saved" : "no key yet \u2013 add one in Settings"}${hasCloudflare() ? " \xB7 Cloudflare backup connected" : ""}`);
        console.log(`  Free video models (Hugging Face): ${config.hfToken ? `token saved (${config.hfInfo?.user || "checked"}) \u2013 5 min of GPU a day` : "no token \u2013 2 min of GPU a day, add a free token in Settings for 5"}`);
        console.log("  Stop it by closing this window or pressing Ctrl+C.");
        console.log("");
        if (OPEN_BROWSER) openExternal(url);
        scheduleUploads();
        setInterval(() => {
          if (history.some((i) => i.pending)) scheduleUploads();
        }, 6e4).unref();
        scheduleFreeModels();
      }
      process.on("SIGINT", () => historyWrites.finally(() => process.exit(0)));
      main().catch((err) => {
        console.error("Failed to start the server:", err.message);
        process.exit(1);
      });
    }
  });

  // web/sw-entry.js
  init_define_process_env();
  init_globals();
  init_vfs();
  init_http();
  var SCOPE = new URL(self.registration.scope).pathname;
  var SERVER_PATHS = /^\/(api|media|thumbs|refs|oauth)(\/|$)/;
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
  var started = null;
  function startServer() {
    started ||= (async () => {
      await vfsInit(["/home/web/.hombresai/config.json"]);
      require_server();
      return serverReady;
    })().catch((err) => {
      started = null;
      throw err;
    });
    return started;
  }
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    const rel = url.pathname.startsWith(SCOPE) ? `/${url.pathname.slice(SCOPE.length)}` : url.pathname;
    if (SERVER_PATHS.test(rel)) event.respondWith(serve(event.request, rel + url.search));
    else if (!url.pathname.startsWith(SCOPE)) event.respondWith(fetch(SCOPE + rel.slice(1) + url.search));
  });
  var FakeRequest = class {
    constructor(method, url, headers, body) {
      Object.assign(this, { method, url, headers, body, handlers: {}, delivered: false });
    }
    on(ev, fn) {
      (this.handlers[ev] ||= []).push(fn);
      if (ev === "end" && !this.delivered) {
        this.delivered = true;
        setTimeout(() => {
          if (this.body?.length) for (const fn2 of this.handlers.data || []) fn2(import_buffer.Buffer.from(this.body));
          for (const fn2 of this.handlers.end || []) fn2();
        }, 0);
      }
      return this;
    }
    once(ev, fn) {
      return this.on(ev, fn);
    }
    destroy() {
    }
  };
  var FakeResponse = class {
    constructor(done2) {
      this.done = done2;
      this.statusCode = 200;
      this.headers = new Headers();
      this.chunks = [];
      this.headersSent = false;
      this.finished = false;
    }
    setHeader(k, v) {
      this.headers.set(k, String(v));
    }
    getHeader(k) {
      return this.headers.get(k);
    }
    removeHeader(k) {
      this.headers.delete(k);
    }
    writeHead(status, headers) {
      this.statusCode = status;
      for (const [k, v] of Object.entries(headers || {})) if (v != null) this.headers.set(k, String(v));
      this.headersSent = true;
      return this;
    }
    write(chunk) {
      if (chunk != null) this.chunks.push(typeof chunk === "string" ? import_buffer.Buffer.from(chunk) : chunk);
      this.headersSent = true;
      return true;
    }
    end(chunk) {
      if (this.finished) return;
      if (chunk != null) this.write(chunk);
      this.finished = true;
      this.headers.delete("content-length");
      const empty = [101, 204, 205, 304].includes(this.statusCode);
      this.done(new Response(empty ? null : import_buffer.Buffer.concat(this.chunks), { status: this.statusCode, headers: this.headers }));
    }
    destroy() {
      if (this.finished) return;
      this.finished = true;
      this.done(new Response("The request failed.", { status: 500 }));
    }
    on() {
      return this;
    }
    once() {
      return this;
    }
  };
  async function serve(request2, pathAndQuery) {
    let server;
    try {
      server = await startServer();
    } catch (err) {
      return new Response(JSON.stringify({ error: { message: `The web version couldn\u2019t start: ${err.message}` } }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const body = ["GET", "HEAD"].includes(request2.method) ? null : new Uint8Array(await request2.arrayBuffer());
    const headers = {};
    request2.headers.forEach((v, k) => {
      headers[k] = v;
    });
    headers.host = `127.0.0.1:${server.port}`;
    if (headers.origin) headers.origin = `http://127.0.0.1:${server.port}`;
    return new Promise((resolve) => server.handler(new FakeRequest(request2.method, pathAndQuery, headers, body), new FakeResponse(resolve)));
  }
})();
