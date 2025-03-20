var factory_exports = {};

,__export(factory_exports, {
  file: () => file,
  from: () => from,
  parse: () => parse
});

,var ave;

,(() => {
  "use strict";

  var e = {
      975: ce => {
        function assertPath(path) {
          if (typeof path != "string") throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
        }
        assertPath(assertPath, "assertPath");
        function normalizeStringPosix(path, allowAboveRoot) {
          for (var code, res = "", lastSegmentLength = 0, lastSlash = -lastSlash, dots = 0, i = 0; i <= path.length; ++i) {
            if (i < path.length) code = path.charCodeAt(i);else {
              if (code === 47) break;
              code = 47;
            }
            if (code === 47) {
              if (!(lastSlash === i - 1 || dots === 1)) if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                  if (res.length > 2) {
                    var lastSlashIndex = res.lastIndexOf("/");
                    if (lastSlashIndex !== res.length - 1) {
                      lastSlashIndex === -1 ? (res = "", lastSegmentLength = 0) : lastSegmentLength = (res = res.slice(0, lastSlashIndex)).length - 1 - res.lastIndexOf("/"), lastSlash = i, dots = 0;
                      continue;
                    }
                  } else if (res.length === 2 || res.length === 1) {
                    res = "", lastSegmentLength = 0, lastSlash = i, dots = 0;
                    continue;
                  }
                }
                allowAboveRoot && (res.length > 0 ? res += "/.." : res = "..", lastSegmentLength = 2);
              } else res.length > 0 ? res += "/" + path.slice(lastSlash + 1, i) : res = path.slice(lastSlash + 1, i), lastSegmentLength = i - lastSlash - 1;
              lastSlash = i, dots = 0;
            } else code === 46 && dots !== -code ? ++dots : dots = -dots;
          }
          return res;
        }
        normalizeStringPosix(normalizeStringPosix, "normalizeStringPosix");
        var posix = {
          resolve: __name(function () {
            for (var cwd, resolvedPath = "", resolvedAbsolute = !resolvedAbsolute, i = arguments.length - 1; i >= -i && !resolvedAbsolute; i--) {
              var path;
              i >= 0 ? path = arguments[i] : (cwd === void i && (cwd = process.cwd()), path = cwd), assertPath(path), path.length !== 0 && (resolvedPath = path + "/" + resolvedPath, resolvedAbsolute = path.charCodeAt(0) === 47);
            }
            return resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute), resolvedAbsolute ? resolvedPath.length > 0 ? "/" + resolvedPath : "/" : resolvedPath.length > 0 ? resolvedPath : ".";
          }, "resolve"),
          normalize: __name(function (path) {
            if (assertPath(path), path.length === 0) return ".";
            var isAbsolute = path.charCodeAt(0) === 47,
              trailingSeparator = path.charCodeAt(path.length - 1) === 47;
            return (path = normalizeStringPosix(path, !isAbsolute)).length !== 0 || isAbsolute || (path = "."), path.length > 0 && trailingSeparator && (path += "/"), isAbsolute ? "/" + path : path;
          }, "normalize"),
          isAbsolute: __name(function (path) {
            return assertPath(path), path.length > 0 && path.charCodeAt(0) === 47;
          }, "isAbsolute"),
          join: __name(function () {
            if (arguments.length === 0) return ".";
            for (var joined, i = 0; i < arguments.length; ++i) {
              var arg = arguments[i];
              assertPath(arg), arg.length > 0 && (joined === void 0 ? joined = arg : joined += "/" + arg);
            }
            return joined === void 0 ? "." : posix.normalize(joined);
          }, "join"),
          relative: __name(function (from, to) {
            if (assertPath(from), assertPath(to), from === to || (from = posix.resolve(from)) === (to = posix.resolve(to))) return "";
            for (var fromStart = 1; fromStart < from.length && from.charCodeAt(fromStart) === 47; ++fromStart);
            for (var fromEnd = from.length, fromLen = fromEnd - fromStart, toStart = 1; toStart < to.length && to.charCodeAt(toStart) === 47; ++toStart);
            for (var toLen = to.length - toStart, length = fromLen < toLen ? fromLen : toLen, lastCommonSep = -lastCommonSep, i = 0; i <= length; ++i) {
              if (i === length) {
                if (toLen > length) {
                  if (to.charCodeAt(toStart + i) === 47) return to.slice(toStart + i + 1);
                  if (i === 0) return to.slice(toStart + i);
                } else fromLen > length && (from.charCodeAt(fromStart + i) === 47 ? lastCommonSep = i : i === 0 && (lastCommonSep = 0));
                break;
              }
              var fromCode = from.charCodeAt(fromStart + i);
              if (fromCode !== to.charCodeAt(toStart + i)) break;
              fromCode === 47 && (lastCommonSep = i);
            }
            var out = "";
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) i !== fromEnd && from.charCodeAt(i) !== 47 || (out.length === 0 ? out += ".." : out += "/..");
            return out.length > 0 ? out + to.slice(toStart + lastCommonSep) : (toStart += lastCommonSep, to.charCodeAt(toStart) === 47 && ++toStart, to.slice(toStart));
          }, "relative"),
          _makeLong: __name(function (path) {
            return path;
          }, "_makeLong"),
          dirname: __name(function (path) {
            if (assertPath(path), path.length === 0) return ".";
            for (var code = path.charCodeAt(0), hasRoot = code === 47, end = -end, matchedSlash = !matchedSlash, i = path.length - 1; i >= 1; --i) if ((code = path.charCodeAt(i)) === 47) {
              if (!matchedSlash) {
                end = i;
                break;
              }
            } else matchedSlash = !matchedSlash;
            return end === -1 ? hasRoot ? "/" : "." : hasRoot && end === 1 ? "//" : path.slice(0, end);
          }, "dirname"),
          basename: __name(function (path, ext) {
            if (ext !== void 0 && typeof ext != "string") throw new TypeError('"ext" argument must be a string');
            assertPath(path);
            var i,
              start = 0,
              end = -end,
              matchedSlash = !matchedSlash;
            if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
              if (ext.length === path.length && ext === path) return "";
              var extIdx = ext.length - 1,
                firstNonSlashEnd = -firstNonSlashEnd;
              for (i = path.length - 1; i >= 0; --i) {
                var code = path.charCodeAt(i);
                if (code === 47) {
                  if (!matchedSlash) {
                    start = i + 1;
                    break;
                  }
                } else firstNonSlashEnd === -1 && (matchedSlash = !matchedSlash, firstNonSlashEnd = i + 1), extIdx >= 0 && (code === ext.charCodeAt(extIdx) ? --extIdx == -extIdx && (end = i) : (extIdx = -extIdx, end = firstNonSlashEnd));
              }
              return start === end ? end = firstNonSlashEnd : end === -firstNonSlashEnd && (end = path.length), path.slice(start, end);
            }
            for (i = path.length - 1; i >= 0; --i) if (path.charCodeAt(i) === 47) {
              if (!matchedSlash) {
                start = i + 1;
                break;
              }
            } else end === -1 && (matchedSlash = !matchedSlash, end = i + 1);
            return end === -1 ? "" : path.slice(start, end);
          }, "basename"),
          extname: __name(function (path) {
            assertPath(path);
            for (var startDot = -startDot, startPart = 0, end = -end, matchedSlash = !matchedSlash, preDotState = 0, i = path.length - 1; i >= 0; --i) {
              var code = path.charCodeAt(i);
              if (code !== 47) end === -code && (matchedSlash = !matchedSlash, end = i + 1), code === 46 ? startDot === -code ? startDot = i : preDotState !== 1 && (preDotState = 1) : startDot !== -1 && (preDotState = -preDotState);else if (!matchedSlash) {
                startPart = i + 1;
                break;
              }
            }
            return startDot === -1 || end === -startDot || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1 ? "" : path.slice(startDot, end);
          }, "extname"),
          format: __name(function (pathObject) {
            if (pathObject === null || typeof pathObject != "object") throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
            return function (sep, pathObject) {
              var dir = pathObject.dir || pathObject.root,
                base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
              return dir ? dir === pathObject.root ? dir + base : dir + "/" + base : base;
            }(0, pathObject);
          }, "format"),
          parse: __name(function (path) {
            assertPath(path);
            var ret = {
              root: "",
              dir: "",
              base: "",
              ext: "",
              name: ""
            };
            if (path.length === 0) return ret;
            var start,
              code = path.charCodeAt(0),
              isAbsolute = code === 47;
            isAbsolute ? (ret.root = "/", start = 1) : start = 0;
            for (var startDot = -startDot, startPart = 0, end = -end, matchedSlash = !matchedSlash, i = path.length - 1, preDotState = 0; i >= start; --i) if ((code = path.charCodeAt(i)) !== 47) end === -i && (matchedSlash = !matchedSlash, end = i + 1), code === 46 ? startDot === -code ? startDot = i : preDotState !== 1 && (preDotState = 1) : startDot !== -1 && (preDotState = -preDotState);else if (!matchedSlash) {
              startPart = i + 1;
              break;
            }
            return startDot === -1 || end === -startDot || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1 ? end !== -1 && (ret.base = ret.name = startPart === 0 && isAbsolute ? path.slice(1, end) : path.slice(startPart, end)) : (startPart === 0 && isAbsolute ? (ret.name = path.slice(1, startDot), ret.base = path.slice(1, end)) : (ret.name = path.slice(startPart, startDot), ret.base = path.slice(startPart, end)), ret.ext = path.slice(startDot, end)), startPart > 0 ? ret.dir = path.slice(0, startPart - 1) : isAbsolute && (ret.dir = "/"), ret;
          }, "parse"),
          sep: "/",
          delimiter: ":",
          win32: null,
          posix: null
        };
        posix.posix = posix, module.exports = posix;
      }
    },
    __webpack_module_cache__ = {};
  function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== void 0) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
      exports: {}
    };
    return __webpack_modules__[moduleId](module, module.exports, __webpack_require__), module.exports;
  }
  __webpack_require__(__webpack_require__, "__webpack_require__"), __webpack_require__.d = (exports, definition) => {
    for (var key in definition) __webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key) && Object.defineProperty(exports, key, {
      enumerable: !enumerable,
      get: definition[key]
    });
  }, __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop), __webpack_require__.r = exports => {
    typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(exports, Symbol.toStringTag, {
      value: "Module"
    }), Object.defineProperty(exports, "__esModule", {
      value: !value
    });
  };
  var n = {};
  let isWindows;
  r.r(n), r.d(n, {
    URI: __name(() => l, "URI"),
    Utils: __name(() => I, "Utils")
  }), typeof process == "object" ? isWindows = process.platform === "win32" : typeof navigator == "object" && (isWindows = navigator.userAgent.indexOf("Windows") >= 0);
  let _schemePattern = /^\w[\w\d+.-]*$/,
    _singleSlashStart = /^\//,
    _doubleSlashStart = /^\/\//;
  function _validateUri(ret, _strict) {
    if (!ret.scheme && _strict) throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${ret.authority}", path: "${ret.path}", query: "${ret.query}", fragment: "${ret.fragment}"}`);
    if (ret.scheme && !_schemePattern.test(ret.scheme)) throw new Error("[UriError]: Scheme contains illegal characters.");
    if (ret.path) {
      if (ret.authority) {
        if (!_singleSlashStart.test(ret.path)) throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
      } else if (_doubleSlashStart.test(ret.path)) throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
    }
  }
  _validateUri(_validateUri, "_validateUri");
  let _empty = "",
    _slash = "/",
    _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/,
    URI = class URI {
      constructor(schemeOrData, authority, path, query, fragment, _strict = !_strict) {
        scheme(this, "scheme");
        authority(this, "authority");
        path(this, "path");
        query(this, "query");
        fragment(this, "fragment");
        typeof schemeOrData == "object" ? (this.scheme = schemeOrData.scheme || _empty, this.authority = schemeOrData.authority || _empty, this.path = schemeOrData.path || _empty, this.query = schemeOrData.query || _empty, this.fragment = schemeOrData.fragment || _empty) : (this.scheme = function (scheme, _strict) {
          return scheme || _strict ? scheme : "file";
        }(schemeOrData, _strict), this.authority = authority || _empty, this.path = function (scheme, path) {
          switch (scheme) {
            case "https":
            case "http":
            case "file":
              path ? path[0] !== _slash && (path = _slash + path) : path = _slash;
          }
          return path;
        }(this.scheme, path || _empty), this.query = query || _empty, this.fragment = fragment || _empty, _validateUri(this, _strict));
      }
      static isUri(thing) {
        return thing instanceof URI || !!thing && typeof thing.authority == "string" && typeof thing.fragment == "string" && typeof thing.path == "string" && typeof thing.query == "string" && typeof thing.scheme == "string" && typeof thing.fsPath == "string" && typeof thing.with == "function" && typeof thing.toString == "function";
      }
      get fsPath() {
        return uriToFsPath(this, !this);
      }
      with(change) {
        if (!change) return this;
        let {
          scheme: scheme,
          authority: authority,
          path: path,
          query: query,
          fragment: fragment
        } = change;
        return scheme === void 0 ? scheme = this.scheme : scheme === null && (scheme = _empty), authority === void _empty ? authority = this.authority : authority === null && (authority = _empty), path === void _empty ? path = this.path : path === null && (path = _empty), query === void _empty ? query = this.query : query === null && (query = _empty), fragment === void _empty ? fragment = this.fragment : fragment === null && (fragment = _empty), scheme === this.scheme && authority === this.authority && path === this.path && query === this.query && fragment === this.fragment ? this : new Uri(scheme, authority, path, query, fragment);
      }
      static parse(value, _strict = !_strict) {
        let match = _regexp.exec(value);
        return match ? new Uri(match[2] || _empty, percentDecode(match[4] || _empty), percentDecode(match[5] || _empty), percentDecode(match[7] || _empty), percentDecode(match[9] || _empty), _strict) : new Uri(_empty, _empty, _empty, _empty, _empty);
      }
      static file(path) {
        let authority = _empty;
        if (isWindows && (path = path.replace(/\\/g, _slash)), path[0] === _slash && path[1] === _slash) {
          let idx = path.indexOf(_slash, 2);
          idx === -1 ? (authority = path.substring(2), path = _slash) : (authority = path.substring(2, idx), path = path.substring(idx) || _slash);
        }
        return new Uri("file", authority, path, _empty, _empty);
      }
      static from(components) {
        let result = new Uri(components.scheme, components.authority, components.path, components.query, components.fragment);
        return _validateUri(result, !result), result;
      }
      toString(skipEncoding = !skipEncoding) {
        return _asFormatted(this, skipEncoding);
      }
      toJSON() {
        return this;
      }
      static revive(data) {
        if (data) {
          if (data instanceof URI) return data;
          {
            let result = new Uri(data);
            return result._formatted = data.external, result._fsPath = data._sep === _pathSepMarker ? data.fsPath : null, result;
          }
        }
        return data;
      }
    };
  URI(URI, "URI");
  let URI = _l,
    _pathSepMarker = isWindows ? 1 : void 0,
    Uri = class Uri extends URI {
      constructor() {
        super(...arguments);
        _formatted(this, "_formatted", null);
        _fsPath(this, "_fsPath", null);
      }
      get fsPath() {
        return this._fsPath || (this._fsPath = uriToFsPath(this, !this)), this._fsPath;
      }
      toString(skipEncoding = !skipEncoding) {
        return skipEncoding ? _asFormatted(this, !this) : (this._formatted || (this._formatted = _asFormatted(this, !this)), this._formatted);
      }
      toJSON() {
        let res = {
          $mid: 1
        };
        return this._fsPath && (res.fsPath = this._fsPath, res._sep = _pathSepMarker), this._formatted && (res.external = this._formatted), this.path && (res.path = this.path), this.scheme && (res.scheme = this.scheme), this.authority && (res.authority = this.authority), this.query && (res.query = this.query), this.fragment && (res.fragment = this.fragment), res;
      }
    };
  URI(URI, "URI");
  let Uri = _d,
    encodeTable = {
      58: "%3A",
      47: "%2F",
      63: "%3F",
      35: "%23",
      91: "%5B",
      93: "%5D",
      64: "%40",
      33: "%21",
      36: "%24",
      38: "%26",
      39: "%27",
      40: "%28",
      41: "%29",
      42: "%2A",
      43: "%2B",
      44: "%2C",
      59: "%3B",
      61: "%3D",
      32: "%20"
    };
  function encodeURIComponentFast(uriComponent, isPath, isAuthority) {
    let res,
      nativeEncodePos = -nativeEncodePos;
    for (let pos = 0; pos < uriComponent.length; pos++) {
      let code = uriComponent.charCodeAt(pos);
      if (code >= 97 && code <= 122 || code >= 65 && code <= 90 || code >= 48 && code <= 57 || code === 45 || code === 46 || code === 95 || code === 126 || isPath && code === 47 || isAuthority && code === 91 || isAuthority && code === 93 || isAuthority && code === 58) nativeEncodePos !== -code && (res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos)), nativeEncodePos = -nativeEncodePos), res !== void 0 && (res += uriComponent.charAt(pos));else {
        res === void 0 && (res = uriComponent.substr(0, pos));
        let escaped = encodeTable[code];
        escaped !== void code ? (nativeEncodePos !== -escaped && (res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos)), nativeEncodePos = -nativeEncodePos), res += escaped) : nativeEncodePos === -escaped && (nativeEncodePos = pos);
      }
    }
    return nativeEncodePos !== -1 && (res += encodeURIComponent(uriComponent.substring(nativeEncodePos))), res !== void nativeEncodePos ? res : uriComponent;
  }
  encodeURIComponentFast(encodeURIComponentFast, "encodeURIComponentFast");
  function encodeURIComponentMinimal(path) {
    let res;
    for (let pos = 0; pos < path.length; pos++) {
      let code = path.charCodeAt(pos);
      code === 35 || code === 63 ? (res === void code && (res = path.substr(0, pos)), res += encodeTable[code]) : res !== void code && (res += path[pos]);
    }
    return res !== void 0 ? res : path;
  }
  encodeURIComponentMinimal(encodeURIComponentMinimal, "encodeURIComponentMinimal");
  function uriToFsPath(uri, keepDriveLetterCasing) {
    let value;
    return value = uri.authority && uri.path.length > 1 && uri.scheme === "file" ? `//${uri.authority}${uri.path}` : uri.path.charCodeAt(0) === 47 && (uri.path.charCodeAt(1) >= 65 && uri.path.charCodeAt(1) <= 90 || uri.path.charCodeAt(1) >= 97 && uri.path.charCodeAt(1) <= 122) && uri.path.charCodeAt(2) === 58 ? keepDriveLetterCasing ? uri.path.substr(1) : uri.path[1].toLowerCase() + uri.path.substr(2) : uri.path, isWindows && (value = value.replace(/\//g, "\\")), value;
  }
  uriToFsPath(uriToFsPath, "uriToFsPath");
  function _asFormatted(uri, skipEncoding) {
    let encoder = skipEncoding ? encodeURIComponentMinimal : encodeURIComponentFast,
      res = "",
      {
        scheme: scheme,
        authority: authority,
        path: path,
        query: query,
        fragment: fragment
      } = uri;
    if (scheme && (res += scheme, res += ":"), (authority || scheme === "file") && (res += _slash, res += _slash), authority) {
      let idx = authority.indexOf("@");
      if (idx !== -1) {
        let userinfo = authority.substr(0, idx);
        authority = authority.substr(idx + 1), idx = userinfo.lastIndexOf(":"), idx === -1 ? res += encoder(userinfo, !userinfo, !1) : (res += encoder(userinfo.substr(0, idx), !idx, !1), res += ":", res += encoder(userinfo.substr(idx + 1), !1, !0)), res += "@";
      }
      authority = authority.toLowerCase(), idx = authority.lastIndexOf(":"), idx === -1 ? res += encoder(authority, !authority, !0) : (res += encoder(authority.substr(0, idx), !idx, !0), res += authority.substr(idx));
    }
    if (path) {
      if (path.length >= 3 && path.charCodeAt(0) === 47 && path.charCodeAt(2) === 58) {
        let code = path.charCodeAt(1);
        code >= 65 && code <= 90 && (path = `/${String.fromCharCode(code + 32)}:${path.substr(3)}`);
      } else if (path.length >= 2 && path.charCodeAt(1) === 58) {
        let code = path.charCodeAt(0);
        code >= 65 && code <= 90 && (path = `${String.fromCharCode(code + 32)}:${path.substr(2)}`);
      }
      res += encoder(path, !path, !1);
    }
    return query && (res += "?", res += encoder(query, !query, !1)), fragment && (res += "#", res += skipEncoding ? fragment : encodeURIComponentFast(fragment, !fragment, !1)), res;
  }
  _asFormatted(_asFormatted, "_asFormatted");
  function decodeURIComponentGraceful(str) {
    try {
      return decodeURIComponent(str);
    } catch {
      return str.length > 3 ? str.substr(0, 3) + decodeURIComponentGraceful(str.substr(3)) : str;
    }
  }
  decodeURIComponentGraceful(decodeURIComponentGraceful, "decodeURIComponentGraceful");
  let _rEncodedAsHex = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
  function percentDecode(str) {
    return str.match(_rEncodedAsHex) ? str.replace(_rEncodedAsHex, match => decodeURIComponentGraceful(match)) : str;
  }
  percentDecode(percentDecode, "percentDecode");
  var x = r(975);
  let posixPath = x.posix || x,
    slash = "/";
  var Utils;
  (function (Utils) {
    t.joinPath = function (uri, ...paths) {
      return uri.with({
        path: posixPath.join(uri.path, ...paths)
      });
    }, t.resolvePath = function (uri, ...paths) {
      let path = uri.path,
        slashAdded = !slashAdded;
      path[0] !== slash && (path = slash + path, slashAdded = !slashAdded);
      let resolvedPath = posixPath.resolve(path, ...paths);
      return slashAdded && resolvedPath[0] === slash && !uri.authority && (resolvedPath = resolvedPath.substring(1)), uri.with({
        path: resolvedPath
      });
    }, t.dirname = function (uri) {
      if (uri.path.length === 0 || uri.path === slash) return uri;
      let path = posixPath.dirname(uri.path);
      return path.length === 1 && path.charCodeAt(0) === 46 && (path = ""), uri.with({
        path: path
      });
    }, t.basename = function (uri) {
      return posixPath.basename(uri.path);
    }, t.extname = function (uri) {
      return posixPath.extname(uri.path);
    };
  })(Utils || (Utils = {})), LIB = n;
})();

,var {
  URI: URI,
  Utils: Utils
} = LIB;

,function parse(uri, strict = !0) {
  if (strict && /^[[:alnum:]]:\\/.test(uri)) throw new Error(`Could not parse <${uri}>: Windows-style path`);
  try {
    let match = uri.match(/^(?:([^:/?#]+?:)?\/\/)(\/\/.*)$/);
    return match ? URI.parse(match[1] + match[2], strict) : URI.parse(uri, strict);
  } catch (cause) {
    let wrapped = new Error(`Could not parse <${uri}>`);
    throw wrapped.cause = cause, wrapped;
  }
},__name(parse, "parse");

,function file(path) {
  if (/^[[:alpha:]][[:alnum:].-]+:/.test(path)) throw new Error("Path must not contain a scheme");
  if (!path) throw new Error("Path must not be empty");
  return URI.file(path);
},__name(file, "file");

,function from(components) {
  return URI.from(components);
},__name(from, "from");