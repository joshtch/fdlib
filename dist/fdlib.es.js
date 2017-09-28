function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    if (i % 2) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));
    }
  }

  return target;
}

// FDlib Helpers
var INSPECT = typeof require === 'function' ? function (arg) {
  return require('util').inspect(arg, {
    showHidden: false,
    depth: 100
  }).replace(/\n ?/g, ' ');
} : function (o) {
  return "" + o;
};
var TERM = console;

function setTerm(newTerm) {
  TERM = _objectSpread2({}, TERM, {}, newTerm);
}

function getTerm() {
  return TERM;
}

function _doNothing() {}

function SUSH() {
  var prevTerm = TERM;
  setTerm({
    log: _doNothing,
    warn: _doNothing,
    error: _doNothing,
    trace: _doNothing,
    time: _doNothing,
    timeEnd: _doNothing
  });
  return prevTerm;
} // Abstraction for throwing because throw statements cause deoptimizations
// All explicit throws should use this function. Also helps with tooling
// later, catching and reporting explicit throws and whatnot.


function THROW() {
  for (var _len = arguments.length, msg = new Array(_len), _key = 0; _key < _len; _key++) {
    msg[_key] = arguments[_key];
  }

  throw new Error(msg.join(': '));
}

var SUB = 0; // WARNING: don't change this. It's mostly a magic number thing.

var SUP = 100000000; // Don't let this max exceed 30 bits or stuff will break

var NOT_FOUND = -1; // Different from NOT_FOUND in that NOT_FOUND must be -1 because of the indexOf api
// while NO_SUCH_VALUE must be a value that cannot be a legal domain value (<SUB or >SUP)

var NO_SUCH_VALUE = Math.min(0, SUB) - 1; // Make sure NO_SUCH_VALUE is a value that may be neither valid in a domain nor >=0

var ARR_RANGE_SIZE = 2; // Magic number

var SMALL_MAX_NUM = 30; // There are SMALL_MAX_NUM flags. if they are all on, this is the number value
// (oh and; 1<<31 is negative. >>>0 makes it unsigned. this is why 30 is max.)

var SOLVED_FLAG = 1 << 31 >>> 0; // The >>> makes it unsigned, we dont really need it but it may help perf a little (unsigned vs signed)

var $STABLE = 0;
var $CHANGED = 1;
var $SOLVED = 2;
var $REJECTED = 3;

if (process.env.NODE_ENV !== 'production') {

  if (NOT_FOUND !== NO_SUCH_VALUE) {
    var _msg = 'not found constants NOT_FOUND and NO_SUCH_VALUE need to be equal to prevent confusion bugs';
    getTerm().error(_msg);
    THROW(_msg);
  }
}

// Assert helper library. This should not be in production

function ASSERT(bool, msg) {
  if (msg === void 0) {
    msg = '';
  }

  if (process.env.NODE_ENV !== 'production') {
    if (bool) {
      return;
    }

    if (!msg) msg = '(no desc)'; // Msg = new Error('trace').stack;

    var TERM = getTerm();
    TERM.error("Assertion fail: " + msg);

    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    if (args) {
      TERM.log('Error args:', args);
    } //      TERM.trace()
    //      process.exit() # uncomment for quick error access :)


    var suffix = args && args.length > 0 ? "Args (" + args.length + "x): `" + _stringify(args) + "`" : '';
    THROW("Assertion fail: " + msg + " " + suffix);
  }
}

function _stringify(o) {
  if (Array.isArray(o)) {
    return "[ " + o.map(_stringify).join(', ') + " ]";
  }

  return "" + o;
} // Simple function to completely validate a domain


function ASSERT_STRDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    var s = domain__debug && domain__debug(domain);
    var strdomValueLen = 2;
    var strdomRangeLen = 2 * strdomValueLen;
    ASSERT(typeof domain === 'string', 'ONLY_STRDOM', s);
    ASSERT(domain.length % strdomRangeLen === 0, 'SHOULD_CONTAIN_RANGES', s);
    var lo = domain.charCodeAt(0) << 16 | domain.charCodeAt(1);
    var hi = domain.charCodeAt(domain.length - strdomValueLen) << 16 | domain.charCodeAt(domain.length - strdomValueLen + 1);
    ASSERT(lo >= SUB, 'SHOULD_BE_GTE ' + SUB, s);
    ASSERT(hi <= SUP, 'SHOULD_BE_LTE ' + SUP, s);
    ASSERT(!expectSmallest || lo !== hi || domain.length > strdomRangeLen, 'SHOULD_NOT_BE_SOLVED', s);
    return true;
  }
}

function ASSERT_SOLDOM(domain, value) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(typeof domain === 'number', 'ONLY_SOLDOM');
    ASSERT(domain >= 0, 'ALL_SOLDOMS_SHOULD_BE_UNSIGNED');
    ASSERT(domain >= SOLVED_FLAG, 'SOLDOMS_MUST_HAVE_FLAG_SET');
    ASSERT((domain ^ SOLVED_FLAG) >= SUB, 'SOLVED_NUMDOM_SHOULD_BE_MIN_SUB');
    ASSERT((domain ^ SOLVED_FLAG) <= SUP, 'SOLVED_NUMDOM_SHOULD_BE_MAX_SUP');
    if (value !== undefined) ASSERT((domain ^ SOLVED_FLAG) === value, 'SHOULD_BE_SOLVED_TO:' + value);
    return true;
  }
}

function ASSERT_BITDOM(domain) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(typeof domain === 'number', 'ONLY_BITDOM');
    ASSERT(domain >= 0, 'ALL_BITDOMS_SHOULD_BE_UNSIGNED');
    ASSERT(domain < SOLVED_FLAG, 'SOLVED_FLAG_NOT_SET');
    ASSERT(SMALL_MAX_NUM < 31, 'next assertion relies on this');
    ASSERT(domain >= 0 && domain < 1 << SMALL_MAX_NUM + 1 >>> 0, 'NUMDOM_SHOULD_BE_VALID_RANGE');
    return true;
  }
}

function ASSERT_ARRDOM(domain, min, max) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(Array.isArray(domain), 'ONLY_ARRDOM');
    if (domain.length === 0) return;
    ASSERT(domain.length % 2 === 0, 'SHOULD_CONTAIN_RANGES');
    ASSERT(domain[0] >= (min || SUB), 'SHOULD_BE_GTE ' + (min || SUB));
    ASSERT(domain[domain.length - 1] <= (max === undefined ? SUP : max), 'SHOULD_BE_LTE ' + (max === undefined ? SUP : max));
    return true;
  }
}

function ASSERT_NORDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    var s = domain__debug && domain__debug(domain);
    ASSERT(typeof domain === 'string' || typeof domain === 'number', 'ONLY_NORDOM', s);

    if (typeof domain === 'string') {
      ASSERT(domain.length > 0, 'empty domains are always numdoms');

      if (expectSmallest) {
        var lo = domain.charCodeAt(0) << 16 | domain.charCodeAt(1);
        var hi = domain.charCodeAt(domain.length - 2) << 16 | domain.charCodeAt(domain.length - 1);
        ASSERT(hi > SMALL_MAX_NUM, 'EXPECTING_STRDOM_TO_HAVE_NUMS_GT_BITDOM', s);
        ASSERT(domain.length > 4 || lo !== hi, 'EXPECTING_STRDOM_NOT_TO_BE_SOLVED');
      }

      return ASSERT_STRDOM(domain, undefined, undefined);
    }

    if (expectSmallest) ASSERT(!domain || domain >= SOLVED_FLAG || (domain & domain - 1) !== 0, 'EXPECTING_SOLVED_NUMDOM_TO_BE_SOLDOM', s);
    ASSERT_NUMDOM(domain, s);
    return true;
  }
}

function ASSERT_NUMDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    var s = domain__debug && domain__debug(domain);
    ASSERT(typeof domain === 'number', 'ONLY_NUMDOM', s);
    if (expectSmallest) ASSERT(!domain || domain >= SOLVED_FLAG || (domain & domain - 1) !== 0, 'EXPECTING_SOLVED_NUMDOM_TO_BE_SOLDOM', s);
    if (domain >= SOLVED_FLAG) ASSERT_SOLDOM(domain);else ASSERT_BITDOM(domain);
    return true;
  }
}

function ASSERT_ANYDOM(domain) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(typeof domain === 'string' || typeof domain === 'number' || Array.isArray(domain), 'ONLY_VALID_DOM_TYPE');
  }
}

function ASSERT_VARDOMS_SLOW(vardoms, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    for (var _iterator = vardoms, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var domain = _ref;
      ASSERT_NORDOM(domain, true, domain__debug);
    }
  }
}

var LOG_NONE = 0;
var LOG_STATS = 1;
var LOG_SOLVES = 2;
var LOG_MIN = LOG_NONE;
var LOG_MAX = LOG_SOLVES;
var LOG_FLAG_NONE = 0;
var LOG_FLAG_PROPSTEPS = 1;
var LOG_FLAG_CHOICE = 2;
var LOG_FLAG_SEARCH = 4;
var LOG_FLAG_SOLUTIONS = 8;
var LOG_FLAGS = LOG_FLAG_NONE; // LOG_FLAG_PROPSTEPS|LOG_FLAG_CHOICE|LOG_FLAG_SOLUTIONS|LOG_FLAG_SEARCH;
// let LOG_FLAGS = LOG_FLAG_PROPSTEPS|LOG_FLAG_CHOICE|LOG_FLAG_SOLUTIONS|LOG_FLAG_SEARCH;

function ASSERT_SET_LOG(level) {
  if (process.env.NODE_ENV !== 'production') {
    LOG_FLAGS = level;
  }
}

function helper_logger() {
  if (process.env.NODE_ENV !== 'production') {
    var _getTerm;

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    (_getTerm = getTerm()).log.apply(_getTerm, ['LOG'].concat(args));
  }
}

function ASSERT_LOG(flags, func) {
  if (process.env.NODE_ENV !== 'production') {
    if (flags & LOG_FLAGS) {
      ASSERT(typeof func === 'function');
      func(helper_logger);
    }
  }
}

var TRACING = false;

function isTracing() {
  if (process.env.NODE_ENV !== 'production') {
    return TRACING;
  }

  return false;
}

function setTracing(b) {
  if (process.env.NODE_ENV !== 'production') {
    TRACING = b;
  }
}
/**
 * @return {boolean}
 */


function TRACE() {
  if (process.env.NODE_ENV !== 'production') {
    var _getTerm2;

    if (arguments.length === 1 && (arguments.length <= 0 ? undefined : arguments[0]) === '') return false;
    if (TRACING) (_getTerm2 = getTerm()).log.apply(_getTerm2, arguments);
    return false;
  }
}

function TRACE_MORPH(from, to, desc, names, indexes) {
  if (process.env.NODE_ENV !== 'production') {
    TRACE(' ### Morphing;    ', from, '   ==>    ', to);
  }
}

function TRACE_SILENT() {
  if (process.env.NODE_ENV !== 'production') {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    TRACE.apply(void 0, ["\x1B[90m"].concat(args, ["\x1B[0m"]));
  }
}

// A domain, in this lib, is a set of numbers denoted by lo-hi range pairs (inclusive)
// Basically means the ranges in the domain are ordered
// ascending and no ranges overlap. We call this "simplified"
// const FIRST_RANGE = 0;

var STR_FIRST_RANGE_LO = 0; // First and second char of a string

var STR_FIRST_RANGE_HI = 2; // Third and fourth char of a string

var ARR_FIRST_RANGE_LO = 0;
var ARR_FIRST_RANGE_HI = 1; // Cache static Math functions

var MIN = Math.min;
var MAX = Math.max;
var FLOOR = Math.floor;
var CEIL = Math.ceil; // Size of values and ranges in a string domain

var STR_VALUE_SIZE = 2;
var STR_RANGE_SIZE = 4;
var EMPTY = 0;
var EMPTY_STR = '';
var DOM_ZERO = domain_createValue(0);
var DOM_BOOL = domain_createRange(0, 1); ///**
// * Append given range to the end of given domain. Does not
// * check if the range belongs there! Dumbly appends.
// *
// * @param {$nordom} domain
// * @param {number} lo
// * @param {number} hi
// * @returns {$domain}
// */
// function domain_appendRange(domain, lo, hi) {
//  ASSERT_NORDOM(domain);
//
//  if (typeof domain === 'number') {
//    // note: this function should not receive numdoms with a SOLVED_FLAG set
//    // it is only used in temporary array cases, the flag must be set afterwards
//    ASSERT(domain < SOLVED_FLAG, 'not expecting solved numdoms');
//    if (hi <= SMALL_MAX_NUM) return domain_bit_addRange(domain, lo, hi);
//    domain = domain_numToStr(domain);
//  }
//  return domain_str_addRange(domain, lo, hi);
// }

/**
 * Append given range to the end of given domain. Does not
 * check if the range belongs there! Dumbly appends.
 *
 * @param {$nordom} domain
 * @param {number} lo
 * @param {number} hi
 * @returns {$domain}
 */

function domain_bit_addRange(domain, lo, hi) {
  ASSERT_BITDOM(domain); // What we do is:
  // - create a 1
  // - move the 1 to the left, `1+to-from` times
  // - subtract 1 to get a series of `to-from` ones
  // - shift those ones `from` times to the left
  // - OR that result with the domain and return it

  var range = (1 << 1 + (hi | 0) - (lo | 0)) - 1 << lo;
  return domain | range;
}
/**
 * Append given range to the end of given domain. Does not
 * check if the range belongs there! Dumbly appends.
 *
 * @param {$nordom} domain
 * @param {number} lo
 * @param {number} hi
 * @returns {$domain}
 */
// function domain_str_addRange(domain, lo, hi) {
//  ASSERT_STRDOM(domain);
//  ASSERT(lo >= 0);
//  ASSERT(hi <= SUP);
//  ASSERT(lo <= hi);
//
//  return domain + domain_str_encodeRange(lo, hi);
// }

/**
 * returns whether domain covers given value
 *
 * @param {$nordom} domain
 * @param {number} value
 * @returns {boolean}
 */


function domain_containsValue(domain, value) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_containsValue(domain, value);
  return domain_str_containsValue(domain, value);
}

function domain_num_containsValue(domain, value) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_containsValue(domain, value);
  return domain_bit_containsValue(domain, value);
}

function domain_sol_containsValue(domain, value) {
  ASSERT_SOLDOM(domain);
  ASSERT(typeof value === 'number', 'A_VALUE_SHOULD_BE_NUMBER');
  ASSERT(value >= SUB);
  ASSERT(value <= SUP);
  return (domain ^ SOLVED_FLAG) === value;
}

function domain_bit_containsValue(domain, value) {
  ASSERT_BITDOM(domain);
  ASSERT(typeof value === 'number', 'A_VALUE_SHOULD_BE_NUMBER');
  ASSERT(value >= SUB, 'OOB');
  ASSERT(value <= SUP, 'OOB');
  if (value < SUB || value > SMALL_MAX_NUM) return false;
  return (domain & 1 << value) !== 0;
}

function domain_str_containsValue(domain, value) {
  ASSERT_STRDOM(domain);
  ASSERT(typeof value === 'number', 'A_VALUE_SHOULD_BE_NUMBER');
  ASSERT(value >= SUB, 'value must be >=SUB', value);
  ASSERT(value <= SUP, 'value must be <=SUP', value);
  return domain_str_rangeIndexOf(domain, value) !== NOT_FOUND;
}
/**
 * Return the range index in given domain that covers given
 * value, or if the domain does not cover it at all
 *
 * @param {$strdom} domain
 * @param {number} value
 * @returns {number} >=0 actual index on strdom or NOT_FOUND
 */


function domain_str_rangeIndexOf(domain, value) {
  ASSERT_STRDOM(domain);
  ASSERT(domain !== '', 'NOT_EMPTY_STR');
  ASSERT(typeof value === 'number', 'A_VALUE_SHOULD_BE_NUMBER');
  ASSERT(value >= SUB);
  ASSERT(value <= SUP);
  var len = domain.length;

  for (var index = 0; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, index);

    if (lo <= value) {
      var hi = domain_str_decodeValue(domain, index + STR_VALUE_SIZE);

      if (hi >= value) {
        // Value is lo<=value<=hi
        return index;
      }
    } else {
      // Value is between previous range and this one, aka: not found.
      break;
    }
  }

  return NOT_FOUND;
}
/**
 * Check if given domain is solved. If so, return the value
 * to which it was solved. Otherwise return NO_SUCH_VALUE.
 *
 * @param {$nordom} domain
 * @returns {number}
 */


function domain_getValue(domain) {
  ASSERT_NORDOM(domain); // TODO: in a sound system we'd only have to check for soldoms...

  if (typeof domain === 'number') return domain_num_getValue(domain);
  return domain_str_getValue(domain);
}

function domain_num_getValue(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_getValue(domain);
  return domain_bit_getValue(domain);
}

function domain_sol_getValue(domain) {
  ASSERT_SOLDOM(domain);
  return domain ^ SOLVED_FLAG;
}

function domain_bit_getValue(domain) {
  ASSERT_BITDOM(domain);
  var lo = domain_bit_min(domain);
  return domain === 1 << lo ? lo : NO_SUCH_VALUE;
}

function domain_str_getValue(domain) {
  ASSERT_STRDOM(domain);
  if (domain.length !== STR_RANGE_SIZE) return NO_SUCH_VALUE;
  var lo = domain_str_decodeValue(domain, STR_FIRST_RANGE_LO);
  var hi = domain_str_decodeValue(domain, STR_FIRST_RANGE_HI);
  if (lo === hi) return lo;
  return NO_SUCH_VALUE;
}
/**
 * @param {$strdom} domain
 * @param {number} index
 * @returns {number}
 */


function domain_str_decodeValue(domain, index) {
  ASSERT_STRDOM(domain);
  return domain.charCodeAt(index) << 16 | domain.charCodeAt(index + 1);
}
/**
 * @param {number} value
 * @returns {string} not a $strdom but half of one
 */


function domain_str_encodeValue(value) {
  return String.fromCharCode(value >>> 16 & 0xffff, value & 0xffff);
}
/**
 * @param {number} lo
 * @param {number} hi
 * @returns {$strdom} One range is still a valid domain
 */


function domain_str_encodeRange(lo, hi) {
  return String.fromCharCode(lo >>> 16 & 0xffff, lo & 0xffff, hi >>> 16 & 0xffff, hi & 0xffff);
}
/**
 * External API only. Always returns an arrdom.
 *
 * @param {number[]} list
 * @returns {$arrdom}
 */


function domain_fromListToArrdom(list) {
  if (list.length === 0) return [];
  list = list.slice(0);
  list.sort(function (a, b) {
    return a - b;
  }); // Note: default sort is lexicographic!

  var arrdom = [];
  var hi;
  var lo;

  for (var index = 0; index < list.length; index++) {
    var value = list[index];
    ASSERT(value >= SUB, 'A_OOB_INDICATES_BUG');
    ASSERT(value <= SUP, 'A_OOB_INDICATES_BUG');

    if (index === 0) {
      lo = value;
      hi = value;
    } else {
      ASSERT(value >= hi, 'LIST_SHOULD_BE_ORDERED_BY_NOW'); // Imo it should not even contain dupe elements... but that may happen anyways

      if (value > hi + 1) {
        arrdom.push(lo, hi);
        lo = value;
      }

      hi = value;
    }
  }

  arrdom.push(lo, hi);
  ASSERT_ARRDOM(arrdom);
  return arrdom;
}
/**
 * Domain to list of possible values
 *
 * @param {$nordom} domain
 * @returns {number[]}
 *
 * @nosideffects
 */


function domain_toList(domain) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_toList(domain);
  return domain_str_toList(domain);
}

function domain_num_toList(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_toList(domain);
  return domain_bit_toList(domain);
}

function domain_sol_toList(domain) {
  ASSERT_SOLDOM(domain);
  return [domain ^ SOLVED_FLAG];
}

function domain_bit_toList(domain) {
  ASSERT_BITDOM(domain);
  var list = [];

  for (var i = 0; i < SMALL_MAX_NUM; ++i) {
    if ((domain & 1 << i >>> 0) > 0) list.push(i);
  }

  return list;
}

function domain_str_toList(domain) {
  ASSERT_STRDOM(domain);
  var list = [];

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    for (var n = domain_str_decodeValue(domain, i), m = domain_str_decodeValue(domain, i + STR_VALUE_SIZE); n <= m; ++n) {
      list.push(n);
    }
  }

  return list;
}
/**
 * @param {$nordom} domain
 * @param {number[]} list
 * @returns {number} Can return NO_SUCH_VALUE
 */


function domain_getFirstIntersectingValue(domain, list) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_getFirstIntersectingValue(domain, list);
  return domain_str_getFirstIntersectingValue(domain, list);
}

function domain_num_getFirstIntersectingValue(domain, list) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_getFirstIntersectingValue(domain, list);
  return domain_bit_getFirstIntersectingValue(domain, list);
}

function domain_sol_getFirstIntersectingValue(domain, list) {
  ASSERT_SOLDOM(domain);
  ASSERT(list && Array.isArray(list), 'A_EXPECTING_LIST');
  var solvedValue = domain ^ SOLVED_FLAG;
  if (list.indexOf(solvedValue) >= 0) return solvedValue;
  return NO_SUCH_VALUE;
}

function domain_bit_getFirstIntersectingValue(domain, list) {
  ASSERT_BITDOM(domain);
  ASSERT(list && Array.isArray(list), 'A_EXPECTING_LIST');

  for (var i = 0; i < list.length; ++i) {
    var value = list[i];
    ASSERT(value >= SUB && value <= SUP, 'A_OOB_INDICATES_BUG'); // Internally all domains elements should be sound; SUB>=n>=SUP
    // 1<<100 = 16 and large numbers are valid here so do check

    if (value <= SMALL_MAX_NUM && (domain & 1 << value) > 0) return value;
  }

  return NO_SUCH_VALUE;
}

function domain_str_getFirstIntersectingValue(domain, list) {
  ASSERT_STRDOM(domain);
  ASSERT(list && Array.isArray(list), 'A_EXPECTING_LIST');

  for (var i = 0; i < list.length; i++) {
    var value = list[i];
    ASSERT(value >= SUB && value <= SUP, 'A_OOB_INDICATES_BUG'); // Internally all domains elements should be sound; SUB>=n>=SUP

    if (domain_str_containsValue(domain, value)) {
      return value;
    }
  }

  return NO_SUCH_VALUE;
}
/**
 * All ranges will be ordered ascending and overlapping ranges are merged
 * This function first checks whether simplification is needed at all
 * Should normalize all return values.
 *
 * @param {$strdom|string} domain
 * @returns {$strdom} ironically, not optimized to a number if possible
 */


function domain_str_simplify(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return EMPTY; // Keep return type consistent, dont return EMPTY

  if (domain.length === STR_RANGE_SIZE) return domain_toSmallest(domain); // Order ranges, then merge overlapping ranges (TODO: can we squash this step together?)

  domain = _domain_str_quickSortRanges(domain);
  domain = _domain_str_mergeOverlappingRanges(domain);
  return domain_toSmallest(domain);
}
/**
 * Sort all ranges in this pseudo-strdom from lo to hi. Domain
 * may already be csis but we're not sure. This function call
 * is part of the process of ensuring that.
 *
 * @param {$strdom|string} domain MAY not be CSIS yet (that's probably why this function is called in the first place)
 * @returns {$strdom|string} ranges in this string will be ordered but may still overlap
 */


function _domain_str_quickSortRanges(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return EMPTY_STR; // Keep return type consistent, dont return EMPTY

  var len = domain.length;
  if (len <= STR_RANGE_SIZE) return domain; // TODO: right now we convert to actual values and concat with "direct" string access. would it be faster to use slices? and would it be faster to do string comparisons with the slices and no decoding?

  var pivotIndex = 0; // TODO: i think we'd be better off with a different pivot? middle probably performs better

  var pivotLo = domain_str_decodeValue(domain, pivotIndex);
  var pivotHi = domain_str_decodeValue(domain, pivotIndex + STR_VALUE_SIZE);
  var left = EMPTY_STR;
  var right = EMPTY_STR;

  for (var i = STR_RANGE_SIZE; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i); // TODO: if we change assumptions elsewhere we could drop the `hi` stuff from this function altogether

    if (lo < pivotLo || lo === pivotLo && domain_str_decodeValue(domain, i + STR_VALUE_SIZE) < pivotHi) {
      left += domain[i] + domain[i + 1] + domain[i + 2] + domain[i + 3];
    } else {
      right += domain[i] + domain[i + 1] + domain[i + 2] + domain[i + 3];
    }
  }

  return String(_domain_str_quickSortRanges(left)) + // Sort left part, without pivot
  domain[pivotIndex] + // Include pivot (4 chars)
  domain[pivotIndex + 1] + domain[pivotIndex + STR_VALUE_SIZE] + domain[pivotIndex + STR_VALUE_SIZE + 1] + _domain_str_quickSortRanges(right) // Sort right part, without pivot
  ;
}
/**
 * @param {$strdom|string} domain May already be csis but at least all ranges should be ordered and are lo<=hi
 * @returns {$strdom}
 */


function _domain_str_mergeOverlappingRanges(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return EMPTY_STR; // Prefer strings for return type consistency
  // assumes domain is sorted
  // assumes all ranges are "sound" (lo<=hi)

  var len = domain.length;
  if (len === STR_RANGE_SIZE) return domain;
  var newDomain = domain[STR_FIRST_RANGE_LO] + domain[STR_FIRST_RANGE_LO + 1]; // Just copy the first two characters...

  var lasthi = domain_str_decodeValue(domain, STR_FIRST_RANGE_HI);
  var lasthindex = STR_FIRST_RANGE_HI;

  for (var i = STR_RANGE_SIZE; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i);
    var hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);
    ASSERT(lo <= hi, 'ranges should be ascending'); // Either:
    // - lo <= lasthi, hi <= lasthi: last range consumes current range (drop it)
    // - lo <= lasthi+1: replace lasthi, last range is extended by current range
    // - lo >= lasthi+2: flush lasthi, replace lastlo and lasthi, current range becomes last range
    // if (lo <= lasthi && hi <= lasthi) {}
    // else

    if (lo <= lasthi + 1) {
      if (hi > lasthi) {
        lasthi = hi;
        lasthindex = i + STR_VALUE_SIZE;
      }
    } else {
      ASSERT(lo >= lasthi + 2, 'should be this now');
      newDomain += domain[lasthindex] + domain[lasthindex + 1] + domain[i] + domain[i + 1];
      lasthi = hi;
      lasthindex = i + STR_VALUE_SIZE;
    }
  }

  return newDomain + domain[lasthindex] + domain[lasthindex + 1];
}
/**
 * Intersect two $domains.
 * Intersection means the result only contains the values
 * that are contained in BOTH domains.
 *
 * @param {$nordom} domain1
 * @param {$nordom} domain2
 * @returns {$nordom}
 */


function domain_intersection(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2);
  if (domain1 === domain2) return domain1;
  var isNum1 = typeof domain1 === 'number';
  var isNum2 = typeof domain2 === 'number';
  if (isNum1 && isNum2) return domain_numnum_intersection(domain1, domain2);
  if (isNum1) return domain_numstr_intersection(domain1, domain2);
  if (isNum2) return domain_numstr_intersection(domain2, domain1); // Swapped!

  return domain_strstr_intersection(domain1, domain2);
}

function domain_numnum_intersection(domain1, domain2) {
  ASSERT_NUMDOM(domain1);
  ASSERT_NUMDOM(domain2);
  var sol1 = domain1 >= SOLVED_FLAG;
  var sol2 = domain2 >= SOLVED_FLAG;

  if (sol1) {
    if (sol2) return domain_solsol_intersect(domain1, domain2);
    return domain_solbit_intersect(domain1, domain2);
  }

  if (sol2) return domain_solbit_intersect(domain2, domain1);
  return domain_bitbit_intersect(domain1, domain2);
}

function domain_solbit_intersect(soldom, bitdom) {
  ASSERT_SOLDOM(soldom);
  ASSERT_BITDOM(bitdom);
  var solvedValue = soldom ^ SOLVED_FLAG;
  if (solvedValue <= SMALL_MAX_NUM && bitdom & 1 << solvedValue) return soldom;
  return EMPTY;
}

function domain_solsol_intersect(domain1, domain2) {
  ASSERT_SOLDOM(domain1);
  ASSERT_SOLDOM(domain2);
  if (domain1 === domain2) return domain1;
  return EMPTY;
}

function domain_bitbit_intersect(domain1, domain2) {
  ASSERT_BITDOM(domain1);
  ASSERT_BITDOM(domain2);
  return domain_bitToSmallest(domain1 & domain2);
}

function domain_numstr_intersection(numdom, strdom) {
  ASSERT_NUMDOM(numdom);
  ASSERT_STRDOM(strdom);
  if (numdom >= SOLVED_FLAG) return domain_solstr_intersect(numdom, strdom);
  return domain_bitstr_intersect(numdom, strdom);
}

function domain_solstr_intersect(soldom, strdom) {
  ASSERT_SOLDOM(soldom);
  ASSERT_STRDOM(strdom);
  var solvedValue = soldom ^ SOLVED_FLAG;

  for (var i = 0, len = strdom.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(strdom, i);
    var hi = domain_str_decodeValue(strdom, i + STR_VALUE_SIZE); // Once a range is found beyond the solved value we can never find solved value in domain_str

    if (solvedValue < lo) break; // When lo<=value<=hi the intersection is non-empty. return the solved domain.

    if (solvedValue <= hi) return soldom;
  }

  return EMPTY;
}

function domain_bitstr_intersect(bitdom, strdom) {
  ASSERT_BITDOM(bitdom);
  ASSERT_STRDOM(strdom); // TODO: intersect in a "zipper" O(max(n,m)) algorithm instead of O(n*m). see _domain_strstr_intersection

  var domain = EMPTY;

  for (var i = 0, len = strdom.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(strdom, i);
    if (lo > SMALL_MAX_NUM) break;
    var hi = domain_str_decodeValue(strdom, i + STR_VALUE_SIZE);

    for (var j = lo, m = MIN(SMALL_MAX_NUM, hi); j <= m; ++j) {
      var flag = 1 << j;
      if (bitdom & flag) domain |= flag; // Could be: domain |= domain1 & NUMBER[j]; but this reads better?
    }
  }

  return domain_bitToSmallest(domain);
}

function domain_strstr_intersection(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);
  var len1 = domain1.length;
  var len2 = domain2.length;
  if ((len1 | len2) === 0) return EMPTY;
  var newDomain = EMPTY_STR;
  var index1 = 0;
  var index2 = 0;
  var lo1 = domain_str_decodeValue(domain1, STR_FIRST_RANGE_LO);
  var hi1 = domain_str_decodeValue(domain1, STR_FIRST_RANGE_HI);
  var lo2 = domain_str_decodeValue(domain2, STR_FIRST_RANGE_LO);
  var hi2 = domain_str_decodeValue(domain2, STR_FIRST_RANGE_HI);

  while (true) {
    if (hi1 < lo2) {
      index1 += STR_RANGE_SIZE;
      if (index1 >= len1) break;
      lo1 = domain_str_decodeValue(domain1, index1);
      hi1 = domain_str_decodeValue(domain1, index1 + STR_VALUE_SIZE);
    } else if (hi2 < lo1) {
      index2 += STR_RANGE_SIZE;
      if (index2 >= len2) break;
      lo2 = domain_str_decodeValue(domain2, index2);
      hi2 = domain_str_decodeValue(domain2, index2 + STR_VALUE_SIZE);
    } else {
      ASSERT(lo1 <= lo2 && lo2 <= hi1 || lo2 <= lo1 && lo1 <= hi2, '_domain_strstr_intersection: both ranges must overlap at least for some element because neither ends before the other [' + lo1 + ',' + hi1 + ' - ' + lo2 + ',' + hi2 + ']');
      var mh = MIN(hi1, hi2);
      newDomain += domain_str_encodeRange(MAX(lo1, lo2), mh); // Put all ranges after the one we just added...

      mh += 2; // Last added range + 1 position gap

      lo1 = lo2 = mh;
      ASSERT(hi1 < mh || hi2 < mh, 'at least one range should be moved forward now');

      if (hi1 < mh) {
        index1 += STR_RANGE_SIZE;
        if (index1 >= len1) break;
        lo1 = domain_str_decodeValue(domain1, index1);
        hi1 = domain_str_decodeValue(domain1, index1 + STR_VALUE_SIZE);
      }

      if (hi2 < mh) {
        index2 += STR_RANGE_SIZE;
        if (index2 >= len2) break;
        lo2 = domain_str_decodeValue(domain2, index2);
        hi2 = domain_str_decodeValue(domain2, index2 + STR_VALUE_SIZE);
      }
    }
  }

  if (newDomain === EMPTY_STR) return EMPTY;
  return domain_toSmallest(newDomain);
}
/**
 * Check if domain contains value, if so, return a domain with
 * just given value. Otherwise return the empty domain.
 *
 * @param {$nordom} domain
 * @param {number} value
 * @returns {$nordom}
 */


function domain_intersectionValue(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(value >= SUB && value <= SUP, 'Expecting valid value');
  if (domain_containsValue(domain, value)) return domain_createValue(value);
  return domain_createEmpty();
}
/**
 * Return a simple string showing the given domain in array
 * form and the representation type that was passed on.
 *
 * @param {$domain} domain
 * @returns {string}
 */


function domain__debug(domain) {
  if (typeof domain === 'number') {
    if (domain >= SOLVED_FLAG) return 'soldom([' + (domain ^ SOLVED_FLAG) + ',' + (domain ^ SOLVED_FLAG) + '])';
    return 'numdom([' + domain_numToArr(domain) + '])';
  }

  if (typeof domain === 'string') return 'strdom([' + domain_strToArr(domain) + '])';
  if (Array.isArray(domain)) return 'arrdom([' + domain + '])';
  return '???dom(' + domain + ')';
}
/**
 * The idea behind this function - which is primarily
 * intended for domain_plus and domain_minus and probably applies
 * to nothing else - is that when adding two intervals,
 * both intervals expand by the other's amount. This means
 * that when given two segmented domains, each continuous
 * range expands by at least the interval of the smallest
 * range of the other segmented domain. When such an expansion
 * occurs, any gaps between subdomains that are <= the smallest
 * range's interval width get filled up, which we can exploit
 * to reduce the number of segments in a domain. Reducing the
 * number of domain segments helps reduce the N^2 complexity of
 * the subsequent domain consistent interval addition method.
 *
 * @param {$strdom} domain1
 * @param {$strdom} domain2
 * @returns {$strdom[]} NOT smallest! call sites depend on strdom, and they will take care of normalization
 */


function domain_str_closeGaps(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);

  if (domain1 && domain2) {
    var change;

    do {
      change = 0;

      if (domain1.length > STR_RANGE_SIZE) {
        var smallestRangeSize = domain_str_smallestRangeSize(domain2);

        var domain = _domain_str_closeGaps(domain1, smallestRangeSize);

        change += domain1.length - domain.length;
        domain1 = domain;
      }

      if (domain2.length > STR_RANGE_SIZE) {
        var _smallestRangeSize = domain_str_smallestRangeSize(domain1);

        var _domain = _domain_str_closeGaps(domain2, _smallestRangeSize);

        change += domain2.length - _domain.length;
        domain2 = _domain;
      }
    } while (change !== 0);
  } // TODO: we could return a concatted string and prefix the split, instead of this temporary array...


  return [domain1, domain2];
}
/**
 * Closes all the gaps between the intervals according to
 * the given gap value. All gaps less than this gap are closed.
 * Domain is not harmed
 *
 * @param {$strdom} domain
 * @param {number} gap
 * @returns {$strdom} (min/max won't be eliminated and input should be a "large" domain)
 */


function _domain_str_closeGaps(domain, gap) {
  ASSERT_STRDOM(domain);
  var newDomain = domain[STR_FIRST_RANGE_LO] + domain[STR_FIRST_RANGE_LO + 1];
  var lasthi = domain_str_decodeValue(domain, STR_FIRST_RANGE_HI);
  var lasthindex = STR_FIRST_RANGE_HI;

  for (var i = STR_RANGE_SIZE, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i);
    var hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);

    if (lo - lasthi > gap) {
      newDomain += domain[lasthindex] + domain[lasthindex + 1] + domain[i] + domain[i + 1];
    }

    lasthi = hi;
    lasthindex = i + STR_VALUE_SIZE;
  }

  newDomain += domain[lasthindex] + domain[lasthindex + 1];
  return newDomain;
}
/**
 * @param {$strdom} domain
 * @returns {number}
 */


function domain_str_smallestRangeSize(domain) {
  ASSERT_STRDOM(domain);
  var min_width = SUP;

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i);
    var hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);
    var width = 1 + hi - lo;

    if (width < min_width) {
      min_width = width;
    }
  }

  return min_width;
}
/**
 * Note that this one isn't domain consistent.
 *
 * @param {$nordom} domain1
 * @param {$nordom} domain2
 * @returns {$domain}
 */


function domain_mul(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2); // TOFIX: quick shortcut for solved domains
  // for simplicity sake, convert them back to arrays

  if (typeof domain1 === 'number') domain1 = domain_numToStr(domain1);
  if (typeof domain2 === 'number') domain2 = domain_numToStr(domain2); // TODO domain_mulNum

  return domain_strstr_mul(domain1, domain2);
}

function domain_strstr_mul(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);
  var result = EMPTY_STR;

  for (var i = 0, leni = domain1.length; i < leni; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain1, i);
    var hi = domain_str_decodeValue(domain1, i + STR_VALUE_SIZE);
    result += _domain_str_mulByRange(domain2, lo, hi);
  } // TODO: is it worth doing this step immediately?


  return domain_str_simplify(result);
}
/**
 * Multiply a domain by given range
 *
 * @param {$strdom} strdom
 * @param {number} lo
 * @param {number} hi
 * @returns {$strdom} NOT normalized
 */


function _domain_str_mulByRange(strdom, lo, hi) {
  ASSERT_STRDOM(strdom, false, domain__debug);
  ASSERT(typeof lo === 'number', 'lo should be number');
  ASSERT(typeof hi === 'number', 'hi should be number');
  var result = EMPTY_STR;

  for (var j = 0, len = strdom.length; j < len; j += STR_RANGE_SIZE) {
    var loj = domain_str_decodeValue(strdom, j);
    var hij = domain_str_decodeValue(strdom, j + STR_VALUE_SIZE);
    result += domain_str_encodeRange(MIN(SUP, lo * loj), MIN(SUP, hi * hij));
  }

  return result;
}
/**
 * Multiply given domain by a single value
 * [1, 10] * 5 = [5, 50]
 *
 * @param {$nordom} domain
 * @param {number} value
 * @returns {$nordom}
 */


function domain_mulByValue(domain, value) {
  ASSERT_NORDOM(domain, false, domain__debug);
  ASSERT(typeof value === 'number', 'value should be number');
  ASSERT(value >= 0, 'cannot use negative numbers');
  ASSERT(arguments.length === 2, 'not expecting a range');
  if (typeof domain === 'number') domain = domain_numToStr(domain);
  domain = _domain_str_mulByRange(domain, value, value);
  return domain_str_simplify(domain);
}
/**
 * Divide one range by another
 * Result has any integer values that are equal or between
 * the real results. This means fractions are floored/ceiled.
 * This is an expensive operation.
 * Zero is a special case.
 *
 * Does not harm input domains
 *
 * @param {$nordom} domain1
 * @param {$nordom} domain2
 * @param {boolean} [floorFractions=true] Include the floored lo of the resulting ranges?
 *         For example, <5,5>/<2,2> is <2.5,2.5>. If this flag is true, it will include
 *         <2,2>, otherwise it will not include anything for that division.
 * @returns {$nordom}
 */


function domain_divby(domain1, domain2, floorFractions) {
  if (floorFractions === void 0) {
    floorFractions = true;
  }

  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2); // TOFIX: add quick shortcut for solved domains
  // for simplicity sake, convert them back to arrays

  if (typeof domain1 === 'number') domain1 = domain_numToStr(domain1);
  if (typeof domain2 === 'number') domain2 = domain_numToStr(domain2); // TODO: domain_divByNum

  return domain_strstr_divby(domain1, domain2, floorFractions);
}

function domain_strstr_divby(domain1, domain2, floorFractions) {
  if (floorFractions === void 0) {
    floorFractions = true;
  }

  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);
  var result = EMPTY_STR;

  for (var i = 0, leni = domain2.length; i < leni; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain2, i);
    var hi = domain_str_decodeValue(domain2, i + STR_VALUE_SIZE);
    result += _domain_str_divbyRange(domain1, lo, hi, floorFractions);
  }

  return domain_str_simplify(result);
}

function _domain_str_divbyRange(strdom, divisorLo, divisorHi, floorFractions) {
  // Division: Dividend / Divisor = Quotient
  ASSERT_STRDOM(strdom);
  ASSERT(typeof divisorLo === 'number', 'lo should be a number');
  ASSERT(typeof divisorHi === 'number', 'hi should be a number');
  ASSERT(divisorLo >= 0 && divisorHi >= 0, 'lo/hi cannot be negative');
  var result = EMPTY_STR;

  for (var j = 0, lenj = strdom.length; j < lenj; j += STR_RANGE_SIZE) {
    var dividendLo = domain_str_decodeValue(strdom, j);
    var dividendHi = domain_str_decodeValue(strdom, j + STR_VALUE_SIZE); // Cannot /0
    // we ignore it right now. should we...
    // - add a 0 or SUB or SUP for it
    // - throw an error / issue a warning for it

    if (divisorHi > 0) {
      var quotientLo = dividendLo / divisorHi;
      var quotientHi = divisorLo > 0 ? dividendHi / divisorLo : SUP; // We cant use fractions, so we'll only include any values in the
      // resulting domains that are _above_ the lo and _below_ the hi.

      var left = CEIL(quotientLo);
      var right = FLOOR(quotientHi); // If the fraction is within the same integer this could result in
      // lo>hi so we must prevent this case

      if (left <= right) {
        result += domain_str_encodeRange(left, right);
      } else {
        ASSERT(FLOOR(quotientLo) === FLOOR(quotientHi), 'left>right when fraction is in same int, which can happen', quotientLo, quotientHi);

        if (floorFractions) {
          // Only use the floored value
          // note: this is a choice. not both floor/ceil because then 5/2=2.5 becomes [2,3]. should be [2,2] or [3,3]
          result += domain_str_encodeRange(right, right);
        }
      }
    }
  }

  return result;
}

function domain_divByValue(domain, value) {
  ASSERT_NORDOM(domain, false, domain__debug);
  ASSERT(typeof value === 'number', 'value should be number');
  ASSERT(value >= 0, 'cannot use negative numbers');
  ASSERT(arguments.length === 2, 'not expecting a range');
  if (typeof domain === 'number') domain = domain_numToStr(domain);

  var domain2 = _domain_str_divbyRange(domain, value, value);

  return domain_str_simplify(domain2);
}
/**
 * Do the opposite of a mul. This is _like_ a div but there
 * are special cases for zeroes and fractions:
 * - x * y = 0
 *   - x / 0 = y (not infinity)
 *   - y / 0 = x (not infinity)
 * - 2 * x = [2, 3]
 *   - 2 / [1, 3] = x (integer division so x=1)
 *   - x / [1, 3] = 2
 *
 * @param {$nordom} domain1
 * @param {$nordom} domain2
 * @returns {$nordom}
 */


function domain_invMul(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2); // TOFIX: add quick shortcut for solved domains
  // if (domain_isZero(domain2)) return domain1;
  // for simplicity sake, convert them back to arrays

  if (typeof domain1 === 'number') domain1 = domain_numToStr(domain1);
  if (typeof domain2 === 'number') domain2 = domain_numToStr(domain2); // TODO: domain_divByNum

  return domain_strstr_invMul(domain1, domain2);
}

function domain_strstr_invMul(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);
  var result = EMPTY_STR;

  for (var i = 0, len = domain2.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain2, i);
    var hi = domain_str_decodeValue(domain2, i + STR_VALUE_SIZE);
    result += _domain_str_invMulRange(domain1, lo, hi);
  }

  return domain_str_simplify(result);
}

function _domain_str_invMulRange(domain, divisorLo, divisorHi) {
  // Note: act like div but do exact opposite of mul regardless
  // all we worry about is the zero since input is >=0 and finite
  ASSERT_STRDOM(domain);
  var result = EMPTY_STR;

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    var dividendLo = domain_str_decodeValue(domain, i);
    var dividendHi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);
    var quotientLo = divisorHi ? dividendLo / divisorHi : SUB; // Use SUB if /0

    var quotientHi = divisorLo ? dividendHi / divisorLo : SUP; // Use SUP if /0
    // only care about the integers within the division range

    var lo = CEIL(quotientLo);
    var hi = FLOOR(quotientHi); // If the lo hi quotients are inside the same integer, the result is empty

    if (lo <= hi) {
      result += domain_str_encodeRange(lo, hi);
    }
  }

  return result;
}

function domain_invMulValue(domain, value) {
  ASSERT_NORDOM(domain, false, domain__debug);
  ASSERT(typeof value === 'number', 'value should be number');
  ASSERT(value >= 0, 'cannot use negative numbers');
  ASSERT(arguments.length === 2, 'not expecting a range');
  if (typeof domain === 'number') domain = domain_numToStr(domain);

  var domain2 = _domain_str_invMulRange(domain, value, value);

  return domain_str_simplify(domain2);
}
/**
 * Return the number of elements this domain covers
 *
 * @param {$nordom} domain
 * @returns {number}
 */


function domain_size(domain) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_size(domain);
  return domain_str_size(domain);
}

function domain_num_size(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return 1;
  return domain_bit_size(domain);
}

var _ref = function () {
  //'use asm';
  function _domain_bit_size(domain) {
    domain = domain | 0; // Hot paths; binary
    // the empty domain is "free"

    switch (domain | 0) {
      case 0:
        return 0;
      // Empty domain

      case 1:
        return 1;

      case 2:
        return 1;

      case 3:
        return 2;

      default:
        break;
    } // 32-bit popcount (count of set bits) using the SWAR algorithm.
    // See stackoverflow.com/a/109025


    domain = domain - (domain >> 1 & 0x55555555) | 0;
    domain = (domain & 0x33333333) + (domain >> 2 & 0x33333333) | 0;
    domain = domain + (domain >> 4) & 0x0f0f0f0f | 0;
    return (domain << 24) + (domain << 16) + (domain << 8) + domain >> 24 | 0;
  }

  return {
    _domain_bit_size: _domain_bit_size
  };
}(),
    _domain_bit_size = _ref._domain_bit_size;

function domain_bit_size(domain) {
  ASSERT_BITDOM(domain);
  return _domain_bit_size(domain) | 0;
}

function domain_str_size(domain) {
  ASSERT_STRDOM(domain);
  ASSERT(domain && domain.length > 0, 'A_EXPECTING_NON_EMPTY_STRDOM');
  var count = 0;

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    // TODO: add test to confirm this still works fine if SUB is negative
    count += 1 + domain_str_decodeValue(domain, i + STR_VALUE_SIZE) - domain_str_decodeValue(domain, i);
  }

  return count;
}
/**
 * Get the middle element of all elements in domain.
 * Not hi-lo/2 but the (size/2)th element.
 * For domains with an even number of elements it
 * will take the first value _above_ the middle,
 * in other words; index=ceil(count/2).
 *
 * @param {$nordom} domain
 * @returns {number} can return
 */


function domain_middleElement(domain) {
  ASSERT_NORDOM(domain);

  if (typeof domain === 'number') {
    if (domain >= SOLVED_FLAG) return domain ^ SOLVED_FLAG; // For simplicity sake, convert them back to arrays

    domain = domain_numToStr(domain);
  } // TODO: domain_middleElementNum(domain);


  return domain_str_middleElement(domain);
}

function domain_str_middleElement(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return NO_SUCH_VALUE;
  var size = domain_str_size(domain);
  var targetValue = FLOOR(size / 2);
  var lo;
  var hi;

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    lo = domain_str_decodeValue(domain, i);
    hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);
    var count = 1 + hi - lo;

    if (targetValue < count) {
      break;
    }

    targetValue -= count;
  } // `targetValue` should be the `nth` element in the current range (`lo-hi`)
  // so we can use `lo` and add the remainder of `targetValue` to get the mid value


  return lo + targetValue;
}
/**
 * Get lowest value in the domain
 * Only use if callsite doesn't need to cache first range (because array access)
 *
 * @param {$nordom} domain
 * @returns {number}
 */


function domain_min(domain) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_min(domain);
  return domain_str_min(domain);
}

function domain_num_min(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_min(domain);
  return domain_bit_min(domain);
}

function domain_sol_min(domain) {
  ASSERT_SOLDOM(domain);
  return domain ^ SOLVED_FLAG;
}

var _ref2 = function (stdlib) {
  //'use asm';
  var clz = stdlib.Math.clz32;

  function _domain_bit_min(domain) {
    domain = domain | 0; // fast paths: these are by far the most used case in our situation

    switch (domain | 0) {
      case 0:
        return -1;

      case 1:
        return 0;

      case 2:
        return 1;

      case 3:
        return 0;

      default:
        break;
    } // 1. Fill in all the higher bits after the first one
    // ASMjs for some reason does not allow ^=,&=, or |=


    domain = domain | domain << 16;
    domain = domain | domain << 8;
    domain = domain | domain << 4;
    domain = domain | domain << 2;
    domain = domain | domain << 1; // 2. Now, inversing the bits (including the first set
    // bit, which becomes unset) reveals the lowest bits

    return 32 - clz(~domain) | 0;
  }

  return {
    _domain_bit_min: _domain_bit_min
  };
}({
  Math: {
    clz32: Math.clz32
  }
}),
    _domain_bit_min = _ref2._domain_bit_min;

function domain_bit_min(domain) {
  ASSERT_BITDOM(domain);
  return _domain_bit_min(domain) | 0;
}

function domain_str_min(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return NO_SUCH_VALUE;
  return domain_str_decodeValue(domain, STR_FIRST_RANGE_LO);
}
/**
 * Only use if callsite doesn't use last range again
 *
 * @param {$nordom} domain
 * @returns {number} can be NO_SUCH_VALUE
 */


function domain_max(domain) {
  ASSERT_NORDOM(domain);
  if (typeof domain === 'number') return domain_num_max(domain);
  return domain_str_max(domain);
}

function domain_num_max(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_max(domain);
  return domain_bit_max(domain);
}

function domain_sol_max(domain) {
  ASSERT_SOLDOM(domain);
  return domain ^ SOLVED_FLAG;
}

var _ref3 = function (stdlib) {
  //'use asm';
  var clz = stdlib.Math.clz32;

  function _domain_bit_max(domain) {
    domain = domain | 0; // Fast paths: these are by far the most used case in our situation
    // (the empty domain check is "free" here)

    switch (domain | 0) {
      case 0:
        return -1;
      // Empty domain

      case 1:
        return 0;
      // Should not be possible. implies a soldom

      case 2:
        return 1;

      case 3:
        return 1;

      default:
        break;
    }

    return 31 - clz(domain) | 0;
  }

  return {
    _domain_bit_max: _domain_bit_max
  };
}({
  Math: {
    clz32: Math.clz32
  }
}),
    _domain_bit_max = _ref3._domain_bit_max;

function domain_bit_max(domain) {
  ASSERT_BITDOM(domain);
  return _domain_bit_max(domain) | 0;
}

function domain_str_max(domain) {
  ASSERT_STRDOM(domain);
  if (!domain) return NO_SUCH_VALUE; // Last encoded value in the string should be the hi of the last range. so max is last value

  return domain_str_decodeValue(domain, domain.length - STR_VALUE_SIZE);
}

function domain_arr_max(domain) {
  ASSERT_ARRDOM(domain);
  var len = domain.length;
  if (len === 0) return NO_SUCH_VALUE;
  return domain[len - 1];
}
/**
 * A domain is "solved" if it covers exactly one value. It is not solved if it is empty.
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isSolved(domain) {
  ASSERT_NORDOM(domain, true, domain__debug);
  ASSERT((domain & SOLVED_FLAG) !== 0 === domain >= SOLVED_FLAG, 'if flag is set the num should be gte to flag');
  return typeof domain === 'number' && domain >= SOLVED_FLAG;
}
/**
 * Purely checks whether given domain is solved to zero
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isZero(domain) {
  ASSERT_NORDOM(domain);
  return domain === DOM_ZERO;
}
/**
 * Purely checks whether given domain does not contain the value zero
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_hasNoZero(domain) {
  ASSERT_NORDOM(domain);
  return !domain_hasZero(domain); // This roundabout way of checking ensures true when the domain is empty
}
/**
 * Does the domain have, at least, a zero? This may be a
 * domain that is solved to zero but not necessarily.
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_hasZero(domain) {
  ASSERT_NORDOM(domain);
  return domain_min(domain) === 0;
}
/**
 * Is the var strictly the domain [0, 1] ?
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isBool(domain) {
  return domain === DOM_BOOL;
}
/**
 * Does the domain have a zero and one nonzero value?
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isBoolyPair(domain) {
  ASSERT_NORDOM(domain);
  return domain_isBooly(domain) && domain_size(domain) === 2;
}
/**
 * Does the domain have a zero and a nonzero value?
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isBooly(domain) {
  ASSERT_NORDOM(domain);
  return domain_isBool(domain) || !domain_isZero(domain) && domain_hasZero(domain);
}
/**
 * Treat domain as booly ("zero or nonzero")
 * If result then remove the zero, otherwise remove anything nonzero
 * The result should be either the domain solved to zero or any domain that contains no zero. Well or the empty domain.
 *
 * @param {$nordom} domain
 * @param {boolean} result
 * @returns {$nordom}
 */


function domain_resolveAsBooly(domain, result) {
  return result ? domain_removeValue(domain, 0) : domain_removeGtUnsafe(domain, 0);
}
/**
 * Is given domain empty?
 * Assuming a nordom, the only value that returns true is EMPTY.
 * Minifier or browser should eliminate this function.
 *
 * @param {$nordom} domain
 * @returns {boolean}
 */


function domain_isEmpty(domain) {
  ASSERT(domain !== '', 'never use empty string as rejected domain');
  ASSERT_NORDOM(domain);
  return domain === EMPTY;
}
/**
 * Remove all values from domain that are greater
 * than or equal to given value
 *
 * @param {$domain} domain
 * @param {number} value
 * @returns {$domain}
 */


function domain_removeGte(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(typeof value === 'number' && value >= SUB - 1 && value <= SUP + 1, 'VALUE_SHOULD_BE_VALID_DOMAIN_ELEMENT', domain__debug(domain), value); // Or +-1...

  if (typeof domain === 'number') return domain_num_removeGte(domain, value);
  return domain_str_removeGte(domain, value);
}

function domain_num_removeGte(domain, value) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_removeGte(domain, value);
  return domain_bitToSmallest(domain_bit_removeGte(domain, value));
}

function domain_sol_removeGte(domain, value) {
  ASSERT_SOLDOM(domain); // (could we just do `return (domain >= (value|SOLVED_FLAG)) ? EMPTY : domain` ?)

  var solvedValue = domain ^ SOLVED_FLAG;
  if (solvedValue >= value) return EMPTY;
  return domain; // No change
}
/**
 * Remove all values from domain that are greater
 * than or equal to given value
 *
 * @param {$numdom} domain
 * @param {number} value NOT a flag
 * @returns {$numdom}
 */


function domain_bit_removeGte(domain, value) {
  switch (value) {
    case 0:
      return 0;

    case 1:
      return domain & 0x00000001;

    case 2:
      return domain & 0x00000003;

    case 3:
      return domain & 0x00000007;

    case 4:
      return domain & 0x0000000f;

    case 5:
      return domain & 0x0000001f;

    case 6:
      return domain & 0x0000003f;

    case 7:
      return domain & 0x0000007f;

    case 8:
      return domain & 0x000000ff;

    case 9:
      return domain & 0x000001ff;

    case 10:
      return domain & 0x000003ff;

    case 11:
      return domain & 0x000007ff;

    case 12:
      return domain & 0x00000fff;

    case 13:
      return domain & 0x00001fff;

    case 14:
      return domain & 0x00003fff;

    case 15:
      return domain & 0x00007fff;

    case 16:
      return domain & 0x0000ffff;

    case 17:
      return domain & 0x0001ffff;

    case 18:
      return domain & 0x0003ffff;

    case 19:
      return domain & 0x0007ffff;

    case 20:
      return domain & 0x000fffff;

    case 21:
      return domain & 0x001fffff;

    case 22:
      return domain & 0x003fffff;

    case 23:
      return domain & 0x007fffff;

    case 24:
      return domain & 0x00ffffff;

    case 25:
      return domain & 0x01ffffff;

    case 26:
      return domain & 0x03ffffff;

    case 27:
      return domain & 0x07ffffff;

    case 28:
      return domain & 0x0fffffff;

    case 29:
      return domain & 0x1fffffff;

    case 30:
      return domain & 0x3fffffff;
  }

  return domain; // When value > 30
}
/**
 * Remove any value from domain that is bigger than or equal to given value.
 * Since domains are assumed to be in CSIS form, we can start from the back and
 * search for the first range that is smaller or contains given value. Prune
 * any range that follows it and trim the found range if it contains the value.
 * Returns whether the domain was changed somehow.
 *
 * @param {$strdom} strdom
 * @param {number} value
 * @returns {$strdom}
 */


function domain_str_removeGte(strdom, value) {
  ASSERT_STRDOM(strdom);

  for (var i = 0, len = strdom.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(strdom, i);
    var hi = domain_str_decodeValue(strdom, i + STR_VALUE_SIZE); // Case: v=5
    // 012 456 // => 012 4
    // 012 45  // => 012 4
    // 012 567 // => 012
    // 012 5   // => 012
    // 012 678 // => 012
    // 012     // => NONE
    // 678     // => empty
    // TODO: if we know the returned domain is a small domain we should prevent the slice at all.

    if (lo >= value) {
      // >
      // 67 9    -> empty
      // 012 789 -> 012
      // ==
      // 567 9   -> empty
      // 012 567 -> 012
      // 012 5   -> 012
      // 5       ->
      if (!i) return EMPTY;
      return domain_toSmallest(strdom.slice(0, i));
    }

    if (value <= hi) {
      if (i === 0 && value === lo + 1) {
        // Domain_createValue(lo);
        var slo = strdom.slice(0, STR_VALUE_SIZE);
        return domain_toSmallest(slo + slo);
      } // 012 456 -> 012 4
      // 012 45  -> 012 4


      var newDomain = strdom.slice(0, i + STR_VALUE_SIZE) + domain_str_encodeValue(value - 1);
      ASSERT(newDomain.length > STR_VALUE_SIZE, 'cannot be a solved value'); // If (value - 1 <= SMALL_MAX_NUM) return newDomain;

      return domain_toSmallest(newDomain);
    }
  }

  return strdom; // 012 -> 012
}
/**
 * Remove all values from domain that are lower
 * than or equal to given value
 *
 * @param {$domain} domain
 * @param {number} value
 * @returns {$domain}
 */


function domain_removeLte(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(typeof value === 'number' && value >= SUB - 1 && value <= SUP + 1, 'VALUE_SHOULD_BE_VALID_DOMAIN_ELEMENT', domain__debug(domain), value); // Or +-1...

  if (typeof domain === 'number') return domain_num_removeLte(domain, value);
  return domain_str_removeLte(domain, value);
}

function domain_num_removeLte(domain, value) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_sol_removeLte(domain, value);
  return domain_toSmallest(domain_bit_removeLte(domain, value));
}

function domain_sol_removeLte(domain, value) {
  // (could we just do `return (domain <= (value|SOLVED_FLAG)) ? EMPTY : domain` ?)
  var solvedValue = domain ^ SOLVED_FLAG;
  if (solvedValue <= value) return EMPTY;
  return domain; // No change
}
/**
 * Remove all values from domain that are lower
 * than or equal to given value
 *
 * @param {$numdom} domain
 * @param {number} value NOT a flag
 * @returns {$numdom}
 */


function domain_bit_removeLte(domain, value) {
  switch (value) {
    case 0:
      return domain & 0x7ffffffe;

    case 1:
      return domain & 0x7ffffffc;

    case 2:
      return domain & 0x7ffffff8;

    case 3:
      return domain & 0x7ffffff0;

    case 4:
      return domain & 0x7fffffe0;

    case 5:
      return domain & 0x7fffffc0;

    case 6:
      return domain & 0x7fffff80;

    case 7:
      return domain & 0x7fffff00;

    case 8:
      return domain & 0x7ffffe00;

    case 9:
      return domain & 0x7ffffc00;

    case 10:
      return domain & 0x7ffff800;

    case 11:
      return domain & 0x7ffff000;

    case 12:
      return domain & 0x7fffe000;

    case 13:
      return domain & 0x7fffc000;

    case 14:
      return domain & 0x7fff8000;

    case 15:
      return domain & 0x7fff0000;

    case 16:
      return domain & 0x7ffe0000;

    case 17:
      return domain & 0x7ffc0000;

    case 18:
      return domain & 0x7ff80000;

    case 19:
      return domain & 0x7ff00000;

    case 20:
      return domain & 0x7fe00000;

    case 21:
      return domain & 0x7fc00000;

    case 22:
      return domain & 0x7f800000;

    case 23:
      return domain & 0x7f000000;

    case 24:
      return domain & 0x7e000000;

    case 25:
      return domain & 0x7c000000;

    case 26:
      return domain & 0x78000000;

    case 27:
      return domain & 0x70000000;

    case 28:
      return domain & 0x60000000;

    case 29:
      return domain & 0x40000000;

    case 30:
      return 0;
    // Assuming domain is "valid" this should remove all elements
  }

  if (value < 0) return domain;
  ASSERT(value > SMALL_MAX_NUM, 'if not below zero than above max');
  return 0;
}
/**
 * Remove any value from domain that is lesser than or equal to given value.
 * Since domains are assumed to be in CSIS form, we can start from the front and
 * search for the first range that is smaller or contains given value. Prune
 * any range that preceeds it and trim the found range if it contains the value.
 * Returns whether the domain was changed somehow
 * Does not harm domain
 *
 * @param {$strdom} strdom
 * @param {number} value
 * @returns {$nordom}
 */


function domain_str_removeLte(strdom, value) {
  ASSERT_STRDOM(strdom);

  for (var i = 0, len = strdom.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(strdom, i);
    var hi = domain_str_decodeValue(strdom, i + STR_VALUE_SIZE); // Case: v=5
    // 456 89 => 6 89
    // 45 89  => 89
    // 56 89  => 6 89
    // 5  89  => 5 89
    // 6788   => 67 9
    // 789    => NONE
    // 012    => empty

    if (lo > value) {
      // 678 -> 678
      if (!i) return domain_toSmallest(strdom); // 234 678 -> 678

      return domain_toSmallest(strdom.slice(i));
    }

    if (hi === value) {
      // 45 89  => 89
      // 5  89  => 5 89
      // 15     =>
      if (i >= len - STR_RANGE_SIZE) return EMPTY;
      return domain_toSmallest(strdom.slice(i + STR_RANGE_SIZE));
    }

    if (value <= hi) {
      // 456 89 => 6 89
      // 56 89  => 6 89
      return domain_toSmallest(domain_str_encodeValue(value + 1) + strdom.slice(i + STR_VALUE_SIZE));
    }
  }

  return EMPTY; // 012 -> empty
}
/**
 * Removes all values lower than value.
 * Only "unsafe" in the sense that no flag is raised
 * for oob values (<-1 or >sup+1) or non-numeric values.
 * This unsafeness simplifies other code significantly.
 *
 * @param {$nordom} domain
 * @param {number} value
 * @returns {$nordom}
 */


function domain_removeLtUnsafe(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(typeof value === 'number', 'Expecting a numerical value');
  if (value <= SUB) return domain;
  if (value > SUP) return domain_createEmpty();
  return domain_removeLte(domain, value - 1);
}
/**
 * Removes all values lower than value.
 * Only "unsafe" in the sense that no flag is raised
 * for oob values (<-1 or >sup+1) or non-numeric values
 * This unsafeness simplifies other code significantly.
 *
 * @param {$nordom} domain
 * @param {number} value
 * @returns {$nordom}
 */


function domain_removeGtUnsafe(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(typeof value === 'number', 'Expecting a numerical value');
  if (value >= SUP) return domain;
  if (value < SUB) return domain_createEmpty();
  return domain_removeGte(domain, value + 1);
}
/**
 * Remove given value from given domain and return
 * the new domain that doesn't contain it.
 *
 * @param {$domain} domain
 * @param {number} value
 * @returns {$domain}
 */


function domain_removeValue(domain, value) {
  ASSERT_NORDOM(domain);
  ASSERT(typeof value === 'number' && value >= 0, 'VALUE_SHOULD_BE_VALID_DOMAIN_ELEMENT', value); // So cannot be negative

  if (typeof domain === 'number') return domain_num_removeValue(domain, value);
  return domain_toSmallest(domain_str_removeValue(domain, value));
}
/**
 * @param {$numdom} domain
 * @param {number} value
 * @returns {$domain}
 */


function domain_num_removeValue(domain, value) {
  if (domain >= SOLVED_FLAG) return domain_sol_removeValue(domain, value);
  return domain_bit_removeValue(domain, value);
}

function domain_sol_removeValue(domain, value) {
  if (value === (domain ^ SOLVED_FLAG)) return EMPTY;
  return domain;
}
/**
 * @param {$bitdom} domain
 * @param {number} value NOT a flag
 * @returns {$bitdom}
 */


function domain_bit_removeValue(domain, value) {
  if (value > 30) return domain_toSmallest(domain); // Though probably already fine, we dont know what `domain` is here

  var flag = 1 << value;
  return domain_bitToSmallest((domain | flag) ^ flag);
}
/**
 * @param {$strdom} domain
 * @param {number} value
 * @returns {$domain} should be smallest
 */


function domain_str_removeValue(domain, value) {
  ASSERT_STRDOM(domain);
  var lastLo = -1;
  var lastHi = -1;

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i); // Domain is CSIS so once a range was found beyond value, no further ranges can possibly wrap value. return now.

    if (value < lo) break;
    var hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);

    if (value <= hi) {
      return _domain_str_removeValue(domain, len, i, lo, hi, value, lastLo, lastHi);
    }

    lastLo = lo;
    lastHi = hi;
  } // "no change" because domain was not found.


  return domain;
}

function _domain_str_removeValue(domain, len, index, lo, hi, value, lastLo, lastHi) {
  ASSERT_STRDOM(domain);
  ASSERT(domain, 'SHOULD_NOT_BE_EMPTY_YET'); // Normalize to (solved) numdom if the result is solved:
  // - one range and it contains two values: solved numdom
  // - oen range and it contains one value: EMPTY
  // - two ranges and both have one value: solved numdom
  // - removed value is >MAX_NUMDOM_VALUE and new highest value <=MAX_NUMDOM_VALUE: numdom
  //   - must remove highest value of dom. either
  //     - from a range of >=2 values (check hi-1)
  //     - from range with one value (check lastHi)

  if (len === STR_RANGE_SIZE) {
    if (hi - lo === 1) return ((lo === value ? hi : lo) | SOLVED_FLAG) >>> 0;
    if (lo === hi) return EMPTY;
    ASSERT(hi - lo > 1);
  } else if (index && len === 2 * STR_RANGE_SIZE && lo === hi && lastLo === lastHi) {
    return (lastLo | SOLVED_FLAG) >>> 0;
  }

  if (index === len - STR_RANGE_SIZE && value === hi) {
    // To numdom checks
    if (lo === hi && lastHi <= SMALL_MAX_NUM) {
      ASSERT(len > STR_RANGE_SIZE, 'this return-EMPTY case is checked above'); // Numdom excluding the last range

      var newLen = len - STR_RANGE_SIZE;
      return domain_strToBit(domain.slice(0, newLen), newLen);
    }

    if (hi - 1 <= SMALL_MAX_NUM) {
      ASSERT(len > STR_RANGE_SIZE || hi - lo > 2, 'one-range check done above, would return solved numdom'); // Numdom excluding last value of last range
      // (the encodeValue step is unfortunate but let's KISS)

      return domain_strToBit(domain.slice(0, -STR_VALUE_SIZE) + domain_str_encodeValue(hi - 1), len);
    }
  } // From this point onward we'll return a strdom


  var before = domain.slice(0, index);
  var after = domain.slice(index + STR_RANGE_SIZE);

  if (hi === value) {
    if (lo === value) {
      // Lo=hi=value; drop this range completely
      return before + after;
    }

    return before + domain_str_encodeRange(lo, hi - 1) + after;
  }

  if (lo === value) {
    return before + domain_str_encodeRange(lo + 1, hi) + after;
  } // We get new two ranges...


  return before + domain_str_encodeRange(lo, value - 1) + domain_str_encodeRange(value + 1, hi) + after;
}
/**
 * Check if every element in one domain not
 * occur in the other domain and vice versa
 *
 * @param {$domain} domain1
 * @param {$domain} domain2
 * @returns {boolean}
 */


function domain_sharesNoElements(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2);
  var isNum1 = typeof domain1 === 'number';
  var isNum2 = typeof domain2 === 'number';
  if (isNum1 && isNum2) return domain_numnum_sharesNoElements(domain1, domain2);
  if (isNum1) return domain_numstr_sharesNoElements(domain1, domain2);
  if (isNum2) return domain_numstr_sharesNoElements(domain2, domain1);
  return domain_strstr_sharesNoElements(domain1, domain2);
}

function domain_numnum_sharesNoElements(domain1, domain2) {
  if (domain1 >= SOLVED_FLAG) {
    if (domain2 >= SOLVED_FLAG) return domain_solsol_sharesNoElements(domain1, domain2);
    return domain_solbit_sharesNoElements(domain1, domain2);
  }

  if (domain2 >= SOLVED_FLAG) return domain_solbit_sharesNoElements(domain2, domain1);
  return domain_bitbit_sharesNoElements(domain1, domain2);
}

function domain_solsol_sharesNoElements(domain1, domain2) {
  return domain1 !== domain2;
}

function domain_solbit_sharesNoElements(soldom, bitsol) {
  var solvedValue = soldom ^ SOLVED_FLAG;
  if (solvedValue > SMALL_MAX_NUM) return true;
  return (bitsol & 1 << solvedValue) === 0;
}
/**
 * Check if every element in one domain does not
 * occur in the other domain and vice versa
 *
 * @param {$numdom} domain1
 * @param {$numdom} domain2
 * @returns {boolean}
 */


function domain_bitbit_sharesNoElements(domain1, domain2) {
  // Checks whether not a single bit in set in _both_ domains
  return (domain1 & domain2) === 0;
}
/**
 * Check if every element in one domain not
 * occur in the other domain and vice versa
 *
 * @param {$numdom} numdom
 * @param {$strdom} strdom
 * @returns {boolean}
 */


function domain_numstr_sharesNoElements(numdom, strdom) {
  ASSERT_NUMDOM(numdom);
  ASSERT_STRDOM(strdom);
  if (numdom >= SOLVED_FLAG) return domain_solstr_sharesNoElements(numdom, strdom);
  return domain_bitstr_sharesNoElements(numdom, strdom);
}

function domain_solstr_sharesNoElements(soldom, strdom) {
  var solvedValue = soldom ^ SOLVED_FLAG;

  for (var strIndex = 0, strlen = strdom.length; strIndex < strlen; strIndex += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(strdom, strIndex);
    var hi = domain_str_decodeValue(strdom, strIndex + STR_VALUE_SIZE);
    if (solvedValue < lo) return true; // Solved value not found so element not shared

    if (solvedValue <= hi) return false; // Solved value is in current range so element shared
  } // Did not find a range that contained value so no element shared


  return true;
}

function domain_bitstr_sharesNoElements(bitdom, strdom) {
  ASSERT_BITDOM(bitdom);
  ASSERT_STRDOM(strdom);
  var strIndex = 0;
  var strlen = strdom.length;

  for (var numIndex = 0; numIndex <= SMALL_MAX_NUM; ++numIndex) {
    if (bitdom & 1 << numIndex) {
      // Find numIndex (as value) in domain_str. return true when
      // found. return false if number above small_max_num is found
      while (strIndex < strlen) {
        var lo = domain_str_decodeValue(strdom, strIndex);
        var hi = domain_str_decodeValue(strdom, strIndex + STR_VALUE_SIZE); // There is overlap if numIndex is within current range so return false

        if (numIndex >= lo && numIndex <= hi) return false; // The next value in domain_num can not be smaller and the previous
        // domain_str range was below that value and the next range is beyond
        // the small domain max so there can be no more matching values

        if (lo > SMALL_MAX_NUM) return true; // This range is bigger than target value so the value doesnt
        // exist; skip to next value

        if (lo > numIndex) break;
        strIndex += STR_RANGE_SIZE;
      }

      if (strIndex >= strlen) return true;
    }
  }

  return true; // Dead code?
}
/**
 * Check if every element in one domain not
 * occur in the other domain and vice versa
 *
 * @param {$strdom} domain1
 * @param {$strdom} domain2
 * @returns {boolean}
 */


function domain_strstr_sharesNoElements(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2);
  var len1 = domain1.length;
  var len2 = domain2.length;
  var index1 = 0;
  var index2 = 0;
  var lo1 = domain_str_decodeValue(domain1, STR_FIRST_RANGE_LO);
  var hi1 = domain_str_decodeValue(domain1, STR_FIRST_RANGE_HI);
  var lo2 = domain_str_decodeValue(domain2, STR_FIRST_RANGE_LO);
  var hi2 = domain_str_decodeValue(domain2, STR_FIRST_RANGE_HI);

  while (true) {
    if (hi1 < lo2) {
      index1 += STR_RANGE_SIZE;
      if (index1 >= len1) break;
      lo1 = domain_str_decodeValue(domain1, index1);
      hi1 = domain_str_decodeValue(domain1, index1 + STR_VALUE_SIZE);
    } else if (hi2 < lo1) {
      index2 += STR_RANGE_SIZE;
      if (index2 >= len2) break;
      lo2 = domain_str_decodeValue(domain2, index2);
      hi2 = domain_str_decodeValue(domain2, index2 + STR_VALUE_SIZE);
    } else {
      ASSERT(lo1 <= lo2 && lo2 <= hi1 || lo2 <= lo1 && lo1 <= hi2, 'domain_strstr_sharesNoElements: both ranges must overlap at least for some element because neither ends before the other [' + lo1 + ',' + hi1 + ' - ' + lo2 + ',' + hi2 + ']');
      return false;
    }
  } // No overlaps found


  return true;
}
/**
 * @param {number} value
 * @returns {$domain} will be a soldom
 */


function domain_createValue(value) {
  ASSERT(value >= SUB, 'domain_createValue: value should be within valid range', SUB, '<=', value);
  ASSERT(value <= SUP, 'domain_createValue: value should be within valid range', SUP, '>=', value);
  return (value | SOLVED_FLAG) >>> 0;
}
/**
 * @param {number} lo
 * @param {number} hi
 * @returns {$nordom}
 */


function domain_createRange(lo, hi) {
  ASSERT(lo >= SUB, 'lo should be >= SUB', lo, hi);
  ASSERT(hi <= SUP, 'hi should be <= SUP', lo, hi);
  ASSERT(lo <= hi, 'should be lo<=hi', lo, hi);
  if (lo === hi) return domain_createValue(lo);
  if (hi <= SMALL_MAX_NUM) return domain_num_createRange(lo, hi);
  return domain_str_encodeRange(lo, hi);
}
/**
 * Create a new domain by passing on the bounds. If the bounds are OOB they
 * are trimmed. This can return the empty domain if both lo and hi are OOB.
 *
 * @param {number} lo
 * @param {number} hi
 * @returns {$nordom}
 */


function domain_createRangeTrimmed(lo, hi) {
  ASSERT(lo <= hi, 'should be lo<=hi', lo, hi);
  if (hi < SUB || lo > SUP) return EMPTY;
  return domain_createRange(Math.max(SUB, lo), Math.min(SUP, hi));
}
/**
 * @param {number} lo
 * @param {number} hi
 * @returns {$bitdom}
 */


function domain_num_createRange(lo, hi) {
  return (1 << 1 + hi - lo) - 1 << lo;
}
/**
 * This function mainly prevents leaking EMPTY outside of domain.js
 * Browsers should optimize this away, if the minifier didn't already.
 *
 * @returns {$numdom}
 */


function domain_createEmpty() {
  return EMPTY;
}

function domain_createBoolyPair(value) {
  if (value === 0) return domain_createValue(0);
  if (value === 1) return domain_createRange(0, 1);
  return domain_arrToSmallest([0, 0, value, value]); // Meh. we can optimize this if it turns out a perf issue
}
/**
 * Return a domain containing all numbers from zero to the highest
 * number in given domain. In binary this means we'll set all the
 * bits of lower value than the most-significant set bit.
 *
 * @param {$numdom} domain_num Must be > ZERO
 * @returns {$domain} never solved since that requires ZERO to be a valid input, which it isnt
 */


function domain_numnum_createRangeZeroToMax(domain_num) {
  ASSERT_NUMDOM(domain_num);
  ASSERT(domain_num < SOLVED_FLAG, 'should not be solved num');
  ASSERT(domain_num !== 1 << 0, 'INVALID INPUT, ZERO would be a solved domain which is caught elsewhere'); // If (domain_num === (1 << 0)) return SOLVED_FLAG; // note: SOLVED_FLAG|0 === SOLVED_FLAG.

  domain_num |= domain_num >> 1;
  domain_num |= domain_num >> 2;
  domain_num |= domain_num >> 4;
  domain_num |= domain_num >> 8;
  domain_num |= domain_num >> 16;
  return domain_num;
}
/**
 * Get a domain representation in array form
 *
 * @param {$domain} domain
 * @param {boolean} [clone] If input is array, slice the array? (other cases will always return a fresh array)
 * @returns {$arrdom} (small domains will also be arrays)
 */


function domain_toArr(domain, clone) {
  if (typeof domain === 'number') return domain_numToArr(domain);
  if (typeof domain === 'string') return domain_strToArr(domain);
  ASSERT(Array.isArray(domain), 'can only be array now');
  if (clone) return domain.slice(0);
  return domain;
}

function domain_numToArr(domain) {
  ASSERT_NUMDOM(domain);
  if (domain >= SOLVED_FLAG) return domain_solToArr(domain);
  return domain_bitToArr(domain);
}

function domain_solToArr(domain) {
  var solvedValue = domain ^ SOLVED_FLAG;
  return [solvedValue, solvedValue];
}

function domain_bitToArr(domain) {
  if (domain === EMPTY) return [];
  var arr = [];
  var lo = -1;
  var hi = -1;

  if (1 << 0 & domain) {
    lo = 0;
    hi = 0;
  }

  if (1 << 1 & domain) {
    if (lo !== 0) {
      // Lo is either 0 or nothing
      lo = 1;
    }

    hi = 1; // There cannot be a gap yet
  }

  if (1 << 2 & domain) {
    if (hi === 0) {
      arr.push(0, 0);
      lo = 2;
    } else if (hi !== 1) {
      // If hi isnt 0 and hi isnt 1 then hi isnt set and so lo isnt set
      lo = 2;
    }

    hi = 2;
  }

  if (1 << 3 & domain) {
    if (hi < 0) {
      // This is the LSB that is set
      lo = 3;
    } else if (hi !== 2) {
      // There's a gap so push prev range now
      arr.push(lo, hi);
      lo = 3;
    }

    hi = 3;
  } // Is the fifth bit or higher even set at all? for ~85% that is not the case at this point


  if (domain >= 1 << 4) {
    for (var i = 4; i <= SMALL_MAX_NUM; ++i) {
      if (domain & 1 << i) {
        if (hi < 0) {
          // This is the LSB that is set
          lo = i;
        } else if (hi !== i - 1) {
          // There's a gap so push prev range now
          arr.push(lo, hi);
          lo = i;
        }

        hi = i;
      }
    }
  } // Since the domain wasn't empty (checked at start) there
  // must now be an unpushed lo/hi pair left to push...


  arr.push(lo, hi);
  return arr;
}

function domain_strToArr(domain) {
  ASSERT_STRDOM(domain);
  if (domain === EMPTY) return [];
  var arr = [];

  for (var i = 0, len = domain.length; i < len; i += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain, i);
    var hi = domain_str_decodeValue(domain, i + STR_VALUE_SIZE);
    arr.push(lo, hi);
  }

  return arr;
}
/**
 * Get a domain representation in string form
 *
 * @param {$domain} domain
 * @returns {$strdom} (small domains will also be strings)
 */


function domain_toStr(domain) {
  if (typeof domain === 'number') return domain_numToStr(domain);
  if (typeof domain === 'string') return domain;
  ASSERT(Array.isArray(domain), 'can only be array now');
  return domain_arrToStr(domain);
}

function domain_numToStr(domain) {
  if (domain >= SOLVED_FLAG) return domain_solToStr(domain);
  return domain_bitToStr(domain);
}

function domain_solToStr(domain) {
  var solvedValue = domain ^ SOLVED_FLAG;
  return domain_str_encodeRange(solvedValue, solvedValue);
}

function domain_bitToStr(domain) {
  ASSERT_NUMDOM(domain);
  if (domain === EMPTY) return EMPTY_STR;
  var str = EMPTY_STR;
  var lo = -1;
  var hi = -1;

  if (1 << 0 & domain) {
    lo = 0;
    hi = 0;
  }

  if (1 << 1 & domain) {
    if (lo !== 0) {
      // Lo is either 0 or nothing
      lo = 1;
    }

    hi = 1; // There cannot be a gap yet
  }

  if (1 << 2 & domain) {
    if (hi === 0) {
      str = domain_str_encodeRange(0, 0);
      lo = 2;
    } else if (hi !== 1) {
      // If hi isnt 0 and hi isnt 1 then hi isnt set and so lo isnt set
      lo = 2;
    }

    hi = 2;
  }

  if (1 << 3 & domain) {
    if (hi < 0) {
      // This is the LSB that is set
      lo = 3;
    } else if (hi !== 2) {
      // There's a gap so push prev range now
      str += domain_str_encodeRange(lo, hi);
      lo = 3;
    }

    hi = 3;
  } // Is the fifth bit or higher even set at all? for ~85% that is not the case at this point


  if (domain >= 1 << 4) {
    for (var i = 4; i <= SMALL_MAX_NUM; ++i) {
      if (domain & 1 << i) {
        if (hi < 0) {
          // This is the LSB that is set
          lo = i;
        } else if (hi !== i - 1) {
          // There's a gap so push prev range now
          str += domain_str_encodeRange(lo, hi);
          lo = i;
        }

        hi = i;
      }
    }
  } // Since the domain wasn't empty (checked at start) there
  // must now be an unpushed lo/hi pair left to push...


  str += domain_str_encodeRange(lo, hi);
  return str;
}

function domain_arrToStr(arrdom) {
  ASSERT_ARRDOM(arrdom);
  var str = EMPTY_STR;

  for (var i = 0, len = arrdom.length; i < len; i += ARR_RANGE_SIZE) {
    var lo = arrdom[i];
    var hi = arrdom[i + 1];
    ASSERT(typeof lo === 'number');
    ASSERT(typeof hi === 'number');
    str += domain_str_encodeRange(lo, hi);
  }

  return str;
}
/**
 * Returns the smallest representation of given domain. The order is:
 * soldom < numdom < strdom
 * Won't return arrdoms.
 *
 * @param {$domain} domain
 * @returns {$domain}
 */


function domain_toSmallest(domain) {
  if (typeof domain === 'number') return domain_numToSmallest(domain);
  ASSERT(typeof domain === 'string', 'there is no arrtosmallest', domain);
  return domain_strToSmallest(domain);
}

function domain_anyToSmallest(domain) {
  // For tests and config import
  if (Array.isArray(domain)) domain = domain_arrToStr(domain);
  return domain_toSmallest(domain);
}

function domain_numToSmallest(domain) {
  if (domain >= SOLVED_FLAG) return domain;
  return domain_bitToSmallest(domain);
}

function domain_bitToSmallest(domain) {
  var value = domain_getValue(domain);
  if (value === NO_SUCH_VALUE) return domain;
  return domain_createValue(value);
}

function domain_strToSmallest(domain) {
  var len = domain.length;
  if (!len) return EMPTY;
  var min = domain_str_decodeValue(domain, 0);
  var max = domain_str_decodeValue(domain, len - STR_VALUE_SIZE);

  if (len === STR_RANGE_SIZE) {
    if (min === max) return domain_createValue(min);
  }

  if (max <= SMALL_MAX_NUM) return domain_strToBit(domain, len);
  return domain;
}
/**
 * Convert string domain to number domain. Assumes domain
 * is eligible to be a small domain.
 *
 * @param {$strdom} strdom
 * @param {number} len Cache of domain.length (string length... not value count)
 * @returns {$strdom}
 */


function domain_strToBit(strdom, len) {
  ASSERT_STRDOM(strdom);
  ASSERT(strdom.length === len, 'len should be cache of domain.length');
  ASSERT(domain_max(strdom) <= SMALL_MAX_NUM, 'SHOULD_BE_SMALL_DOMAIN', strdom, domain_max(strdom));
  if (len === 0) return EMPTY;
  var lo = domain_str_decodeValue(strdom, 0);
  var hi = domain_str_decodeValue(strdom, 0 + STR_VALUE_SIZE); // If (len === STR_RANGE_SIZE && lo === hi) {
  //  return (lo | SOLVED_FLAG) >>> 0; // >>>0 forces unsigned.
  // }

  var out = domain_bit_addRange(EMPTY, lo, hi);

  for (var i = STR_RANGE_SIZE; i < len; i += STR_RANGE_SIZE) {
    var _lo = domain_str_decodeValue(strdom, i);

    var _hi = domain_str_decodeValue(strdom, i + STR_VALUE_SIZE);

    out = domain_bit_addRange(out, _lo, _hi);
  }

  return out;
}

function domain_arrToSmallest(arrdom) {
  ASSERT_ARRDOM(arrdom);
  var len = arrdom.length;
  if (len === 0) return EMPTY;
  if (len === ARR_RANGE_SIZE && arrdom[0] === arrdom[1]) return domain_createValue(arrdom[0]);
  ASSERT(typeof arrdom[arrdom.length - 1] === 'number');
  var max = domain_arr_max(arrdom);
  if (max <= SMALL_MAX_NUM) return _domain_arrToBit(arrdom, len);
  return domain_arrToStr(arrdom);
}

function _domain_arrToBit(domain, len) {
  ASSERT_ARRDOM(domain);
  ASSERT(domain[domain.length - 1] <= SMALL_MAX_NUM, 'SHOULD_BE_SMALL_DOMAIN', domain); // TODO
  // if (domain.length === 2 && domain[0] === domain[1]) return (domain[0] | SOLVED_FLAG) >>> 0;

  var out = 0;

  for (var i = 0; i < len; i += ARR_RANGE_SIZE) {
    out = domain_bit_addRange(out, domain[i], domain[i + 1]);
  }

  return out;
}

// This file only concerns itself with adding two domains
var min = Math.min;
/**
 * Does not harm input domains
 *
 * @param {$domain} domain1
 * @param {$domain} domain2
 * @returns {$domain}
 */

function domain_plus(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2); // Note: this is not 0+x=x. this is nothing+something=nothing because the domains contain no value

  if (!domain1 || !domain2) return EMPTY;
  var isNum1 = typeof domain1 === 'number';
  var isNum2 = typeof domain2 === 'number';
  var result;

  if (isNum1 && isNum2) {
    // If the highest number in the result is below the max of a small
    // domain we can take a fast path for it. this case happens often.
    if (_domain_plusWillBeSmall(domain1, domain2)) {
      return domain_toSmallest(_domain_plusNumNumNum(domain1, domain2));
    }

    result = _domain_plusNumNumStr(domain1, domain2);
  } else if (isNum1) result = _domain_plusNumStrStr(domain1, domain2);else if (isNum2) result = _domain_plusNumStrStr(domain2, domain1); // Swapped domains!
  else result = _domain_plusStrStrStr(domain1, domain2);

  return domain_toSmallest(domain_str_simplify(result));
}

function _domain_plusStrStrStr(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2); // Simplify the domains by closing gaps since when we add
  // the domains, the gaps will close according to the
  // smallest interval width in the other domain.

  var domains = domain_str_closeGaps(domain1, domain2);
  domain1 = domains[0];
  domain2 = domains[1];
  var newDomain = EMPTY_STR;

  for (var index = 0, len = domain1.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain1, index);
    var hi = domain_str_decodeValue(domain1, index + STR_VALUE_SIZE);
    newDomain += _domain_plusRangeStrStr(lo, hi, domain2);
  }

  return newDomain;
}

function _domain_plusWillBeSmall(domain1, domain2) {
  // If both domains are small enough they cannot add to a domain beyond the max
  ASSERT(typeof domain1 === 'number', 'ONLY_WITH_NUMBERS');
  ASSERT(typeof domain2 === 'number', 'ONLY_WITH_NUMBERS'); // If (((domain1 | domain2) >>> 0) < (1 << 15)) return true; // could catch some cases
  // if (domain1 < (1<<15) && domain2 < (1<<15)) return true;  // alternative of above

  return domain_max(domain1) + domain_max(domain2) <= SMALL_MAX_NUM; // If max changes, update above too!
}

function _domain_plusNumNumStr(domain1, domain2) {
  ASSERT_NUMDOM(domain1);
  ASSERT_NUMDOM(domain2);

  if (domain1 >= SOLVED_FLAG) {
    var solvedValue = domain1 ^ SOLVED_FLAG;
    return _domain_plusRangeNumStr(solvedValue, solvedValue, domain2);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain1 & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY_STR;

  while (flagValue <= domain1 && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain1) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain += _domain_plusRangeNumStr(lo, hi, domain2);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain + _domain_plusRangeNumStr(lo, hi, domain2);
}

function _domain_plusNumNumNum(domain1, domain2) {
  ASSERT_NUMDOM(domain1);
  ASSERT_NUMDOM(domain2);
  ASSERT(domain1 !== EMPTY && domain2 !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE');
  ASSERT(domain_max(domain1) + domain_max(domain2) <= SMALL_MAX_NUM, 'THE_POINTE');

  if (domain1 >= SOLVED_FLAG) {
    var solvedValue = domain1 ^ SOLVED_FLAG;
    return _domain_plusRangeNumNum(solvedValue, solvedValue, domain2);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain1 & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY;

  while (flagValue <= domain1 && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain1) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain |= _domain_plusRangeNumNum(lo, hi, domain2);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain | _domain_plusRangeNumNum(lo, hi, domain2);
}

function _domain_plusRangeNumNum(loi, hii, domain_num) {
  ASSERT_NUMDOM(domain_num);
  ASSERT(domain_num !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE');

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_plusRangeRangeNum(loi, hii, solvedValue, solvedValue);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain |= _domain_plusRangeRangeNum(loi, hii, lo, hi);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain | _domain_plusRangeRangeNum(loi, hii, lo, hi);
}

function _domain_plusNumStrStr(domain_num, domain_str) {
  ASSERT_NUMDOM(domain_num);
  ASSERT_STRDOM(domain_str);

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_plusRangeStrStr(solvedValue, solvedValue, domain_str);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY_STR;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain += _domain_plusRangeStrStr(lo, hi, domain_str);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain + _domain_plusRangeStrStr(lo, hi, domain_str);
}

function _domain_plusRangeNumStr(loi, hii, domain_num) {
  ASSERT_NUMDOM(domain_num);

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_plusRangeRangeStr(loi, hii, solvedValue, solvedValue);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY_STR;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain += _domain_plusRangeRangeStr(loi, hii, lo, hi);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain + _domain_plusRangeRangeStr(loi, hii, lo, hi);
}

function _domain_plusRangeStrStr(loi, hii, domain_str) {
  ASSERT_STRDOM(domain_str);
  var newDomain = EMPTY_STR;

  for (var index = 0, len = domain_str.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain_str, index);
    var hi = domain_str_decodeValue(domain_str, index + STR_VALUE_SIZE);
    newDomain += _domain_plusRangeRangeStr(loi, hii, lo, hi);
  }

  return newDomain;
}

function _domain_plusRangeRangeStr(loi, hii, loj, hij) {
  ASSERT(loi + loj >= 0, 'DOMAINS_SHOULD_NOT_HAVE_NEGATIVES');
  var lo = loi + loj;

  if (lo <= SUP) {
    // If lo exceeds SUP the resulting range is completely OOB and we ignore it.
    var hi = min(SUP, hii + hij);
    return domain_str_encodeRange(lo, hi);
  }

  return EMPTY_STR;
}

function _domain_plusRangeRangeNum(loi, hii, loj, hij) {
  ASSERT(loi + loj >= 0, 'DOMAINS_SHOULD_NOT_HAVE_NEGATIVES');
  ASSERT(loi + loj <= SMALL_MAX_NUM, 'RESULT_SHOULD_NOT_EXCEED_SMALL_DOMAIN');
  ASSERT(hii + hij <= SMALL_MAX_NUM, 'RESULT_SHOULD_NOT_EXCEED_SMALL_DOMAIN');
  var domain = domain_num_createRange(loi + loj, hii + hij);
  ASSERT(typeof domain === 'number' && domain < SOLVED_FLAG, 'expecting numdom, not soldom');
  return domain;
}

// This file only concerns itself with subtracting two domains
var max = Math.max;
/**
 * Subtract one domain from the other
 *
 * @param {$domain} domain1
 * @param {$domain} domain2
 * @returns {$domain}
 */

function domain_minus(domain1, domain2) {
  ASSERT_NORDOM(domain1);
  ASSERT_NORDOM(domain2); // Note: this is not x-0=x. this is nothing-something=nothing because the domains contain no value

  if (!domain1 || !domain2) return EMPTY; // Optimize an easy path: if both domains contain zero the
  // result will always be [0, max(domain1)], because:
  // d1-d2 = [lo1-hi2, hi1-lo2] -> [0-hi2, hi1-0] -> [0, hi1]

  if (domain_min(domain1) === 0 && domain_min(domain2) === 0) {
    return domain_createRange(0, domain_max(domain1));
  }

  var isNum1 = typeof domain1 === 'number';
  var isNum2 = typeof domain2 === 'number';

  if (isNum1) {
    // Note: if domain1 is a small domain the result is always a small domain
    if (isNum2) return domain_toSmallest(_domain_minusNumNum(domain1, domain2));
    var D = domain_toSmallest(_domain_minusNumStr(domain1, domain2));
    if (D === EMPTY_STR) return EMPTY;
    return D;
  }

  var result;
  if (isNum2) result = _domain_minusStrNumStr(domain1, domain2); // Cannot swap minus args!
  else result = _domain_minusStrStrStr(domain1, domain2);
  var E = domain_toSmallest(domain_str_simplify(result));
  if (E === EMPTY_STR) return EMPTY;
  return E;
}

function _domain_minusStrStrStr(domain1, domain2) {
  ASSERT_STRDOM(domain1);
  ASSERT_STRDOM(domain2); // Simplify the domains by closing gaps since when we add
  // the domains, the gaps will close according to the
  // smallest interval width in the other domain.

  var domains = domain_str_closeGaps(domain1, domain2);
  domain1 = domains[0];
  domain2 = domains[1];
  ASSERT(typeof domain1 === 'string', 'make sure closeGaps doesnt "optimize"');
  ASSERT(typeof domain2 === 'string', 'make sure closeGaps doesnt "optimize"');
  var newDomain = EMPTY_STR;

  for (var index = 0, len = domain1.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain1, index);
    var hi = domain_str_decodeValue(domain1, index + STR_VALUE_SIZE);
    newDomain += _domain_minusRangeStrStr(lo, hi, domain2);
  }

  return newDomain;
}

function _domain_minusNumNum(domain1, domain2) {
  if (domain1 >= SOLVED_FLAG) {
    var solvedValue = domain1 ^ SOLVED_FLAG;

    if (domain2 >= SOLVED_FLAG) {
      var result = solvedValue - (domain2 ^ SOLVED_FLAG);
      if (result < 0) return EMPTY;
      return domain_createValue(result);
    }

    if (solvedValue <= SMALL_MAX_NUM) return _domain_minusRangeNumNum(solvedValue, solvedValue, domain2);
    return _domain_minusRangeNumStr(solvedValue, solvedValue, domain2);
  }

  return _domain_minusNumNumNum(domain1, domain2);
}

function _domain_minusNumNumNum(domain1, domain2) {
  ASSERT_NUMDOM(domain1);
  ASSERT_NUMDOM(domain2);
  ASSERT(domain1 !== EMPTY && domain2 !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE');
  ASSERT(domain_max(domain1) - domain_min(domain2) <= SMALL_MAX_NUM, 'MAX-MIN_MUST_NOT_EXCEED_NUMDOM_RANGE');
  ASSERT(domain1 < SOLVED_FLAG, 'solved domain1 is expected to be caught elsewhere');
  if (domain_num_containsValue(domain1, 0) && domain_num_containsValue(domain2, 0)) return domain_numnum_createRangeZeroToMax(domain1);
  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain1 & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY;

  while (flagValue <= domain1 && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain1) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain |= _domain_minusRangeNumNum(lo, hi, domain2);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain | _domain_minusRangeNumNum(lo, hi, domain2);
}

function _domain_minusNumStr(domain_num, domain_str) {
  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    if (solvedValue <= SMALL_MAX_NUM) return _domain_minusRangeStrNum(solvedValue, solvedValue, domain_str);
    return _domain_minusRangeStrStr(solvedValue, solvedValue, domain_str);
  }

  return _domain_minusNumStrNum(domain_num, domain_str);
}

function _domain_minusNumStrNum(domain_num, domain_str) {
  ASSERT_NUMDOM(domain_num);
  ASSERT_STRDOM(domain_str);
  ASSERT(domain_num !== EMPTY && domain_str !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE');
  ASSERT(domain_max(domain_num) - domain_min(domain_str) <= SMALL_MAX_NUM, 'MAX-MIN_MUST_NOT_EXCEED_NUMDOM_RANGE');

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_minusRangeStrNum(solvedValue, solvedValue, domain_str);
  } // Since any number above the small domain max ends up with negative, which is truncated, use the max of domain1


  if (domain_num_containsValue(domain_num, 0) && domain_min(domain_str) === 0) return domain_numnum_createRangeZeroToMax(domain_num);
  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain |= _domain_minusRangeStrNum(lo, hi, domain_str);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain | _domain_minusRangeStrNum(lo, hi, domain_str);
}

function _domain_minusRangeNumNum(loi, hii, domain_num) {
  ASSERT_NUMDOM(domain_num);
  ASSERT(domain_num !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE');

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_minusRangeRangeNum(loi, hii, solvedValue, solvedValue);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain |= _domain_minusRangeRangeNum(loi, hii, lo, hi);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain | _domain_minusRangeRangeNum(loi, hii, lo, hi);
}

function _domain_minusStrNumStr(domain_str, domain_num) {
  ASSERT_NUMDOM(domain_num);
  ASSERT_STRDOM(domain_str);
  ASSERT(domain_num !== EMPTY && domain_str !== EMPTY, 'SHOULD_BE_CHECKED_ELSEWHERE'); // Optimize an easy path: if both domains contain zero the
  // result will always be [0, max(domain1)], because:
  // d1-d2 = [lo1-hi2, hi1-lo2] -> [0-hi2, hi1-0] -> [0, hi1]

  if (domain_min(domain_str) === 0 && domain_min(domain_num) === 0) {
    return domain_createRange(0, domain_max(domain_str));
  }

  var newDomain = EMPTY_STR;

  for (var index = 0, len = domain_str.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain_str, index);
    var hi = domain_str_decodeValue(domain_str, index + STR_VALUE_SIZE);
    newDomain += _domain_minusRangeNumStr(lo, hi, domain_num);
  }

  return newDomain;
}

function _domain_minusRangeNumStr(loi, hii, domain_num) {
  ASSERT_NUMDOM(domain_num);
  if (domain_num === EMPTY) return EMPTY;

  if (domain_num >= SOLVED_FLAG) {
    var solvedValue = domain_num ^ SOLVED_FLAG;
    return _domain_minusRangeRangeStr(loi, hii, solvedValue, solvedValue);
  }

  var flagIndex = 0; // Find the first set bit. must find something because small domain and not empty

  while ((domain_num & 1 << flagIndex) === 0) {
    ++flagIndex;
  }

  var lo = flagIndex;
  var hi = flagIndex;
  var flagValue = 1 << ++flagIndex;
  var newDomain = EMPTY_STR;

  while (flagValue <= domain_num && flagIndex <= SMALL_MAX_NUM) {
    if ((flagValue & domain_num) > 0) {
      if (hi !== flagIndex - 1) {
        // There's a gap so push prev range now
        newDomain += _domain_minusRangeRangeStr(loi, hii, lo, hi);
        lo = flagIndex;
      }

      hi = flagIndex;
    }

    flagValue = 1 << ++flagIndex;
  }

  return newDomain + _domain_minusRangeRangeStr(loi, hii, lo, hi);
}

function _domain_minusRangeStrStr(loi, hii, domain_str) {
  ASSERT_STRDOM(domain_str);
  var newDomain = EMPTY_STR;

  for (var index = 0, len = domain_str.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain_str, index);
    var hi = domain_str_decodeValue(domain_str, index + STR_VALUE_SIZE);
    newDomain += _domain_minusRangeRangeStr(loi, hii, lo, hi);
  }

  return newDomain;
}

function _domain_minusRangeStrNum(loi, hii, domain_str) {
  ASSERT_STRDOM(domain_str);
  var newDomain = EMPTY;

  for (var index = 0, len = domain_str.length; index < len; index += STR_RANGE_SIZE) {
    var lo = domain_str_decodeValue(domain_str, index);
    var hi = domain_str_decodeValue(domain_str, index + STR_VALUE_SIZE);
    newDomain |= _domain_minusRangeRangeNum(loi, hii, lo, hi);
  }

  return newDomain;
}

function _domain_minusRangeRangeStr(loi, hii, loj, hij) {
  var hi = hii - loj;

  if (hi >= SUB) {
    // Silently ignore results that are OOB
    var lo = max(SUB, loi - hij);
    return domain_str_encodeRange(lo, hi);
  }

  return EMPTY_STR;
}

function _domain_minusRangeRangeNum(loi, hii, loj, hij) {
  var hi = hii - loj;

  if (hi >= SUB) {
    // Silently ignore results that are OOB
    var lo = max(SUB, loi - hij);
    ASSERT(lo <= SMALL_MAX_NUM, 'RESULT_SHOULD_NOT_EXCEED_SMALL_DOMAIN');
    ASSERT(hi <= SMALL_MAX_NUM, 'RESULT_SHOULD_NOT_EXCEED_SMALL_DOMAIN');
    var domain = domain_num_createRange(lo, hi);
    ASSERT(typeof domain === 'number' && domain < SOLVED_FLAG, 'expecting numdom, not soldom');
    return domain;
  }

  return EMPTY;
}

var TRIE_ROOT_OFFSET = 0;
var TRIE_BUCKET_COUNT = 10; // 10 digits

var TRIE_NODE_SIZE = TRIE_BUCKET_COUNT + 1; // Inc value

var TRIE_INITIAL_SIZE = 16 * 1024;
var TRIE_MINIMAL_GROWTH = 4 * 1024;
var TRIE_KEY_NOT_FOUND = -1;
var TRIE_EMPTY = undefined;
var TRIE_DEFAULT_SIZE = undefined;
var TRIE_8_BIT = 8;
var TRIE_16_BIT = 16;
var TRIE_32_BIT = 32;
var TRIE_64_BIT = 64;
var TRIE_DEFAULT_BITS = undefined; // Every trie node needs space for 10 jumps + 1 leaf value (must be capable of containing
// `size(Trie)-1`) so initially 11 bytes, later 12 bytes and then 22 bytes once the number of
// nodes exceeds 255

/**
 * Create a new trie and, optionally, initialize it
 * with given values as keys and their index as value.
 * Check `trie_add` for assumed key composition restrictions
 *
 * @param {string[]} [valuesByIndex] If exists, adds all values in array as keys, index as values
 * @param {number} [initialLength] Hint to help control memory consumption for large/small tries. This length is in cells, not bytes. (byteLength=length*(bitsize/8))
 * @param {number} [initialBitsize] Hint to set bitsize explicitly. One of: 8 16 32 64
 * @returns {$trie}
 */

function trie_create(valuesByIndex, initialLength, initialBitsize) {
  var size = initialLength | 0 || TRIE_INITIAL_SIZE; // TODO: if (!size) THROW('fixme'); // Blabla it's possible the constant is not yet initialized due to minification. dont initialize a trie in module global space

  var bits = Math.max(trie_getValueBitsize(size), initialBitsize | 0); // Given bitsize might be lower than max address, ignore it in that case

  var buffer = trie_createBuffer(size, bits); // Have to use a wrapper because the buffer ref may change when it grows
  // otherwise we could just store the meta data inside the buffer. but at
  // least this is easier to read :)

  var trie = {
    _class: '$trie',
    buffer: buffer,
    bits: bits,
    // 8 16 32 (64?)
    lastNode: TRIE_ROOT_OFFSET,
    // Pointer to last node in the buffer
    count: 0 // Number of keys in the Trie

  };

  if (process.env.NODE_ENV !== 'production') {
    trie = _objectSpread2({}, trie, {
      // Debug stats... any use should be wrapped in ASSERT so that it's use gets removed in a dist
      _mallocs: String(buffer.length),
      // Malloc steps in a string
      _adds: 0,
      // Number of trie_add calls
      _addSteps: 0,
      // Sum of steps taken in all trie_add calls
      _hass: 0,
      // Number of trie_has calls
      _gets: 0,
      // Number of trie_get calls (and also contains has)
      _getSteps: 0 // Sum of steps for all gets on this trie

    });
  }

  if (valuesByIndex) {
    for (var i = 0, n = valuesByIndex.length; i < n; ++i) {
      trie_add(trie, valuesByIndex[i], i);
    }
  }

  return trie;
}
/**
 * Create a buffer
 *
 * @param {number} size Length of the buffer in cells, not bytes (!)
 * @param {number} bits One of: 8 16 32 64
 * @returns {TypedArray}
 */


function trie_createBuffer(size, bits) {
  switch (bits) {
    case TRIE_8_BIT:
      return new Uint8Array(size);

    case TRIE_16_BIT:
      return new Uint16Array(size);

    case TRIE_32_BIT:
      return new Uint32Array(size);

    case TRIE_64_BIT:
      return new Float64Array(size);
    // Let's hope not ;)

    default:
      THROW('Unsupported bit size');
  }
}
/**
 * Reserve a part of the Trie memory to represent a node in the Trie.
 *
 * In this particular implementation nodes are of fixed width. It's
 * a field of 10 address cells and one value cell.
 *
 * Address cells point to other nodes. If zero, there is none (because
 * that would be the root node) and a search ends in not found.
 *
 * Value cells that are zero (default) are also "not found".
 *
 * @returns {Uint16Array}
 */


function trie_addNode(trie) {
  var newNodePtr = trie.lastNode + TRIE_NODE_SIZE;
  trie.lastNode = newNodePtr; // Technically the `while` is valid (instead of an `if`) but only
  // if the buffer could grow by a smaller amount than the node size...
  // note: buffer.length is cell size, buffer.byteLength is byte size. we want cells here.

  while (newNodePtr + TRIE_NODE_SIZE >= trie.buffer.length) {
    trie_grow(trie);
  }

  return newNodePtr;
}
/**
 * Allocate more size for this Trie
 *
 * Basically creates a new buffer with a larger size and then copies
 * the current buffer into it. If the new size exceeds the max size
 * of the current type (16bit/32bit) then the buffer is converted to
 * a bigger bit size automagically.
 * The trie buffer reference will be updated with the new buffer
 *
 * @param {$trie} trie
 */


function trie_grow(trie) {
  var len = trie.buffer.length; // Cell size! not byte size.

  var newSize = ~~(len * 1.1); // Grow by 10% (an arbitrary number)

  if (len + TRIE_MINIMAL_GROWTH > newSize) newSize = TRIE_MINIMAL_GROWTH + len;
  trie_malloc(trie, newSize);
}
/**
 * Allocate space for a Trie and copy given Trie to it.
 * Will grow bitsize if required, but never shrink it.
 * (Bitsize must grow if cell size exceeds certain threshholds
 * because otherwise we can't address all bytes in the buffer)
 *
 * @param {$trie} trie
 * @param {number} size Cell size, not byte size
 */


function trie_malloc(trie, size) {
  // Make sure addressing fits
  var newBits = trie_getValueBitsize(size); // Dont shrink bit size even if length would allow it; "large" _values_ may require it
  // (our tries dont need to shrink)

  trie.bits = Math.max(trie.bits, newBits);
  var nbuf = trie_createBuffer(size, trie.bits);
  nbuf.set(trie.buffer, 0);
  if (process.env.NODE_ENV !== 'production') ASSERT(trie._mallocs += ' ' + nbuf.length);
  trie.buffer = nbuf;
}
/**
 * Return the cell width in bits to fit given value.
 * For example, numbers below 256 can be represented in
 * 8 bits but numbers above it will need at least 16 bits.
 * Max is 64 but you can't pass on larger numbers in JS, anyways :)
 *
 * @param {number} value
 * @returns {number}
 */


function trie_getValueBitsize(value) {
  if (value < 0x100) return TRIE_8_BIT;
  if (value < 0x10000) return TRIE_16_BIT;
  if (value < 0x100000000) return TRIE_32_BIT;
  return TRIE_64_BIT;
}
/**
 * Add a key/value pair
 *
 * Note: keys and values are of limited structure
 *
 * The key must be a string of ascii in range of 32-131.
 * This key is hashed by turning each character into its
 * ascii ordinal value, stringifying it padded with zero,
 * and hashing each of the two resulting digits. This way
 * we can guarantee that each node in the Trie only
 * requires 10 places (one for each digit) plus a value.
 * That makes reads super fast.
 *
 * @param {$trie} trie
 * @param {string} key
 * @param {number} value Any unsigned 32bit-1 value
 * @returns {number} previous value, or -1 if there wasn't any
 */


function trie_add(trie, key, value) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._adds);
  trie_ensureValueFits(trie, value);
  return _trie_add(trie, TRIE_ROOT_OFFSET, key, 0, key.length, value);
}
/**
 * Recursively find the place to add the key. If
 * the trail runs cold, pave it. Clobbers existing
 * values (though in our implementation that current
 * shouldn't really happen...)
 *
 * @param {$trie} trie
 * @param {number} offset
 * @param {string} key
 * @param {number} index Current index of the key being walked
 * @param {number} len Cache of key.length
 * @param {number} value Any unsigned 32bit-1 value
 * @returns {number} the old value, or not found
 */


function _trie_add(trie, offset, key, index, len, value) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._addSteps);
  ASSERT(offset >= 0, 'OFFSET_UNSIGNED');
  ASSERT(typeof key === 'string', 'STRING_KEY');
  ASSERT(index >= 0, 'INDEX_UNSIGNED');
  ASSERT(key.length === len, 'KEY_LEN');
  ASSERT(value >= 0, 'VALUE_UNSIGNED'); // Dont create next path part if it would create a leaf node

  if (index >= len) {
    var buffer = trie.buffer;
    var valuePtr = offset + TRIE_BUCKET_COUNT;
    var curValue = trie.buffer[valuePtr];
    if (!curValue) ++trie.count;
    buffer[valuePtr] = value + 1; // 0 is reserved to mean "unused"

    return curValue - 1;
  }

  var c = key.charCodeAt(index) - 32; // Allow all asciis 31 < c < 130 encoded as stringified double digits

  offset = _trie_pavePath(trie, offset, c % 10);
  offset = _trie_pavePath(trie, offset, Math.floor(c / 10));
  return _trie_add(trie, offset, key, index + 1, len, value);
}
/**
 * Add a key/value pair
 *
 * This adds a value under a key that is a number. This
 * way reads and writes take `ceil(log(n)/log(10))` steps.
 * Eg. as many steps as digits in the decimal number.
 *
 * @param {$trie} trie
 * @param {number} key Assumes an unsigned int
 * @param {number} value Any unsigned 32bit-1 value
 * @returns {number} previous value, or -1 if there wasn't any
 */


function trie_addNum(trie, key, value) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._adds);
  trie_ensureValueFits(trie, value);
  return _trie_addNum(trie, TRIE_ROOT_OFFSET, key + 1, value);
}
/**
 * Recursively find the place to add the key. If
 * the trail runs cold, pave it. Clobbers existing
 * values (though in our implementation that current
 * shouldn't really happen...)
 *
 * @param {$trie} trie
 * @param {number} offset
 * @param {number} key Assumes an unsigned int >0
 * @param {number} value Any unsigned 32bit-1 value
 * @returns {number} the old value, or not found
 */


function _trie_addNum(trie, offset, key, value) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._addSteps);
  ASSERT(offset >= 0, 'OFFSET_UNSIGNED');
  ASSERT(typeof key === 'number', 'NUMBER_KEY');
  ASSERT(value >= 0, 'VALUE_UNSIGNED');

  if (key === 0) {
    var buffer = trie.buffer;
    var valuePtr = offset + TRIE_BUCKET_COUNT;
    var curValue = trie.buffer[valuePtr];
    if (!curValue) ++trie.count;
    buffer[valuePtr] = value + 1; // 0 is reserved to mean "unused"

    return curValue - 1;
  }

  offset = _trie_pavePath(trie, offset, key % 10);
  key = Math.floor(key / 10);
  return _trie_addNum(trie, offset, key, value);
}
/**
 * Make sure the Trie can hold a value of given manitude.
 * If the current bitsize of the trie is too small it will
 * grow the buffer to accomodate the larger size.
 *
 * @param {$trie} trie
 * @param {number} value
 */


function trie_ensureValueFits(trie, value) {
  var bitsNeeded = trie_getValueBitsize(value);

  if (bitsNeeded > trie.bits) {
    trie.bits = bitsNeeded;
    trie_malloc(trie, trie.buffer.length); // Note: length = cell size, byteLength = byte size. we mean cell here.
  }
}
/**
 * One step of writing a value. Offset should be a node, if
 * the digit has no address yet create it. If a node needs
 * to be created the buffer may be grown to fit the new node.
 * It will return the pointer of the (possibly new) next
 * node for given digit.
 *
 * @param {$trie} trie
 * @param {number} offset Start of a node
 * @param {number} digit Zero through nine
 * @returns {number} new address
 */


function _trie_pavePath(trie, offset, digit) {
  offset += digit;
  var ptr = trie.buffer[offset];

  if (!ptr) {
    ptr = trie_addNode(trie);
    trie.buffer[offset] = ptr;
  }

  return ptr;
}
/**
 * Find the value for given key. See trie_add for more details.
 *
 * @param {$trie} trie
 * @param {string} key
 * @returns {number} -1 if not found, >= 0 otherwise
 */


function trie_get(trie, key) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._gets);
  return _trie_get(trie, TRIE_ROOT_OFFSET, key, 0, key.length);
}
/**
 * Recursive function to search for key
 *
 * @param {$trie} trie
 * @param {number} offset Start of a node
 * @param {string} key
 * @param {number} index Current index of the key being walked
 * @param {number} len Cache of key.length
 * @returns {number} -1 if not found or >= 0 otherwise
 */


function _trie_get(trie, offset, key, index, len) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._getSteps);
  ASSERT(offset >= 0, 'OFFSET_UNSIGNED');
  ASSERT(typeof key === 'string', 'STRING_KEY', key);
  ASSERT(index >= 0, 'INDEX_UNSIGNED');
  ASSERT(key.length === len, 'KEY_LEN', key);
  var buffer = trie.buffer;

  if (index >= len) {
    var valuePtr = offset + TRIE_BUCKET_COUNT;
    return buffer[valuePtr] - 1;
  }

  var c = key.charCodeAt(index) - 32; // Allow all asciis 31 < c < 130 encoded as stringified double digits

  offset = buffer[offset + c % 10];
  if (!offset) return TRIE_KEY_NOT_FOUND;
  offset = buffer[offset + Math.floor(c / 10)];
  if (!offset) return TRIE_KEY_NOT_FOUND;
  return _trie_get(trie, offset, key, index + 1, len);
}
/**
 * See trie_get for more details
 *
 * @param {$trie} trie
 * @param {string} key
 * @returns {boolean}
 */


function trie_has(trie, key) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._hass);
  return trie_get(trie, key) !== TRIE_KEY_NOT_FOUND;
}
/**
 * Find the value for given number key.
 * See trie_addNum for more details.
 *
 * @param {$trie} trie
 * @param {number} key Assumed to be an unsigned int >=0
 * @returns {number} -1 if not found, >= 0 otherwise
 */


function trie_getNum(trie, key) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._gets);
  return _trie_getNum(trie, TRIE_ROOT_OFFSET, key + 1);
}
/**
 * Recursive function to search for number key
 *
 * @param {$trie} trie
 * @param {number} offset Start of a node
 * @param {number} key Assumed to be an unsigned int >=0
 * @returns {number} -1 if not found or >= 0 otherwise
 */


function _trie_getNum(trie, offset, key) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._getSteps);
  ASSERT(offset >= 0, 'OFFSET_UNSIGNED');
  ASSERT(typeof key === 'number', 'NUMBER_KEY');
  var buffer = trie.buffer;

  if (key === 0) {
    var valuePtr = offset + TRIE_BUCKET_COUNT;
    return buffer[valuePtr] - 1;
  }

  offset = buffer[offset + key % 10];
  if (!offset) return TRIE_KEY_NOT_FOUND;
  key = Math.floor(key / 10);
  return _trie_getNum(trie, offset, key);
}
/**
 * See trie_getNum for more details
 *
 * @param {$trie} trie
 * @param {number} key Assumed to be unsigned int >= 0
 * @returns {boolean}
 */


function trie_hasNum(trie, key) {
  if (process.env.NODE_ENV !== 'production') ASSERT(++trie._hass);
  return trie_getNum(trie, key) !== TRIE_KEY_NOT_FOUND;
}
/**
 * Human readable yay. Does not log, only returns a debug string.
 *
 * @param {$trie} trie
 * @param {boolean} [skipBuffer=false]
 * @returns {string}
 */


function _trie_debug(trie, skipBuffer) {
  if (process.env.NODE_ENV !== 'production') {
    var _ret = function () {
      /* eslint no-extend-native: "off" */
      var buffer = trie.buffer;
      var lastNode = trie.lastNode; // Patch some es6 stuff for debugging. note: dont do this in prod, it may slow stuff down.

      if (!String.prototype.padStart) {
        String.prototype.padStart = function (n, c) {
          var s = this;
          if (this.length < n) for (var i = 0; i < n - this.length; ++i) {
            s = c + s;
          }
          return s;
        };
      }

      if (!String.prototype.padEnd) {
        String.prototype.padEnd = function (n, c) {
          var s = this;
          if (this.length < n) for (var i = 0; i < n - this.length; ++i) {
            s += c;
          }
          return s;
        };
      }

      if (!Array.from) {
        Array.from = function (a) {
          return [].concat.call(a);
        };
      } // If one doesnt support them, they probably all dont.


      if (!Uint8Array.prototype.slice) {
        Uint8Array.prototype.slice = Array.prototype.slice;
        Uint16Array.prototype.slice = Array.prototype.slice;
        Uint32Array.prototype.slice = Array.prototype.slice;
        Float64Array.prototype.slice = Array.prototype.slice;
      }

      function bytes(b) {
        if (b < 1024) return b + ' b';
        b /= 1024;
        if (b < 1024) return ~~(b * 100) / 100 + ' kb';
        b /= 1024;
        if (b < 1024) return ~~(b * 100) / 100 + ' mb';
        b /= 1024;
        return ~~(b * 100) / 100 + ' gb';
      }

      var pad = 20;
      var npad = 6;
      var s = '' + '\n' + '###\n' + 'Key count:'.padEnd(pad, ' ') + trie.count + '\n' + 'Node count:'.padEnd(pad, ' ') + (lastNode / TRIE_NODE_SIZE + 1) + ' (' + (lastNode / TRIE_NODE_SIZE + 1) / trie.count + ' nodes per key)\n' + 'Buffer cell length:'.padEnd(pad, ' ') + buffer.length + '\n' + 'Buffer byte length:'.padEnd(pad, ' ') + buffer.byteLength + '\n' + 'Bit size:'.padEnd(pad, ' ') + trie.bits + '\n' + 'Node len:'.padEnd(pad, ' ') + TRIE_NODE_SIZE + '\n' + 'Node size:'.padEnd(pad, ' ') + TRIE_NODE_SIZE + '\n' + 'Last Node:'.padEnd(pad, ' ') + lastNode + '\n' + 'Used space:'.padEnd(pad, ' ') + (lastNode + TRIE_NODE_SIZE) + ' cells, ' + bytes((lastNode + TRIE_NODE_SIZE) * (trie.bits >> 3)) + '\n' + 'Unused space:'.padEnd(pad, ' ') + (buffer.length - (lastNode + TRIE_NODE_SIZE)) + ' cells, ' + bytes((buffer.length - (lastNode + TRIE_NODE_SIZE)) * (trie.bits >> 3)) + '\n';

      if (process.env.NODE_ENV !== 'production') {
        s += 'Mallocs:'.padEnd(pad, ' ') + trie._mallocs + '\n' + 'trie_adds:'.padEnd(pad, ' ') + trie._adds + '\n' + 'Avg key distance:'.padEnd(pad, ' ') + trie._addSteps / trie._adds + '\n' + 'trie_hass:'.padEnd(pad, ' ') + trie._hass + '\n' + 'trie_gets:'.padEnd(pad, ' ') + trie._gets + '\n' + 'Avg get distance:'.padEnd(pad, ' ') + trie._getSteps + ' -> ' + trie._getSteps / trie._gets + '\n';
      }

      s += '\n';

      if (!skipBuffer) {
        s += 'ptr \\ key= 0      1      2      3      4      5      6      7      8      9  ->  value\n\n';
        var ptr = TRIE_ROOT_OFFSET;

        while (ptr <= lastNode) {
          s += String(ptr).padStart(npad, ' ') + ': ' + [].concat(buffer.slice(ptr, ptr + TRIE_NODE_SIZE - 1)).map(function (n) {
            return String(n).padStart(npad, ' ');
          }).join(', ') + '  ->  ' + String(buffer[ptr + TRIE_NODE_SIZE - 1]).padStart(npad, ' ') + '\n';
          ptr += TRIE_NODE_SIZE;
        }
      }

      s += '###\n\n';
      return {
        v: s
      };
    }();

    if (typeof _ret === "object") return _ret.v;
  }
}

export { $CHANGED, $REJECTED, $SOLVED, $STABLE, ARR_FIRST_RANGE_HI, ARR_FIRST_RANGE_LO, ARR_RANGE_SIZE, ASSERT, ASSERT_ANYDOM, ASSERT_ARRDOM, ASSERT_BITDOM, ASSERT_LOG, ASSERT_NORDOM, ASSERT_NUMDOM, ASSERT_SET_LOG, ASSERT_SOLDOM, ASSERT_STRDOM, ASSERT_VARDOMS_SLOW, EMPTY, EMPTY_STR, INSPECT, LOG_FLAG_CHOICE, LOG_FLAG_NONE, LOG_FLAG_PROPSTEPS, LOG_FLAG_SEARCH, LOG_FLAG_SOLUTIONS, LOG_MAX, LOG_MIN, LOG_NONE, LOG_SOLVES, LOG_STATS, NOT_FOUND, NO_SUCH_VALUE, SMALL_MAX_NUM, SOLVED_FLAG, STR_FIRST_RANGE_HI, STR_FIRST_RANGE_LO, STR_RANGE_SIZE, STR_VALUE_SIZE, SUB, SUP, SUSH, THROW, TRACE, TRACE_MORPH, TRACE_SILENT, TRIE_16_BIT, TRIE_32_BIT, TRIE_64_BIT, TRIE_8_BIT, TRIE_DEFAULT_BITS, TRIE_DEFAULT_SIZE, TRIE_EMPTY, TRIE_INITIAL_SIZE, TRIE_KEY_NOT_FOUND, TRIE_MINIMAL_GROWTH, TRIE_NODE_SIZE, _domain_str_mergeOverlappingRanges, _domain_str_quickSortRanges, _trie_debug, domain__debug, domain_anyToSmallest, domain_arrToSmallest, domain_containsValue, domain_createBoolyPair, domain_createEmpty, domain_createRange, domain_createRangeTrimmed, domain_createValue, domain_divByValue, domain_divby, domain_fromListToArrdom, domain_getFirstIntersectingValue, domain_getValue, domain_hasNoZero, domain_hasZero, domain_intersection, domain_intersectionValue, domain_invMul, domain_invMulValue, domain_isBool, domain_isBooly, domain_isBoolyPair, domain_isEmpty, domain_isSolved, domain_isZero, domain_max, domain_middleElement, domain_min, domain_minus, domain_mul, domain_mulByValue, domain_numToStr, domain_num_containsValue, domain_num_createRange, domain_numnum_createRangeZeroToMax, domain_plus, domain_removeGtUnsafe, domain_removeGte, domain_removeLtUnsafe, domain_removeLte, domain_removeValue, domain_resolveAsBooly, domain_sharesNoElements, domain_size, domain_str_closeGaps, domain_str_decodeValue, domain_str_encodeRange, domain_str_rangeIndexOf, domain_str_simplify, domain_toArr, domain_toList, domain_toSmallest, domain_toStr, getTerm, isTracing, setTerm, setTracing, trie_add, trie_addNum, trie_create, trie_get, trie_getNum, trie_getValueBitsize, trie_has, trie_hasNum };
