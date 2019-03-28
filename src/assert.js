// Assert helper library. This should not be in production

import { getTerm, THROW } from './helpers';

import { SUB, SUP, SMALL_MAX_NUM, SOLVED_FLAG } from './constants';

function ASSERT(bool, msg = '', ...args) {
  if (process.env.NODE_ENV !== 'production') {
    if (bool) {
      return;
    }

    if (!msg) msg = '(no desc)'; //msg = new Error('trace').stack;

    const TERM = getTerm();

    TERM.error(`Assertion fail: ${msg}`);
    if (args) {
      TERM.log('Error args:', args);
    }
    //      TERM.trace()
    //      process.exit() # uncomment for quick error access :)

    const suffix =
      args && args.length > 0
        ? `Args (${args.length}x): \`${_stringify(args)}\``
        : '';

    THROW(`Assertion fail: ${msg} ${suffix}`);
  }
}

function _stringify(o) {
  if (o instanceof Array) {
    return `[ ${o.map(_stringify).join(', ')} ]`;
  }
  return `${o}`;
}

// Simple function to completely validate a domain

function ASSERT_STRDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    const s = domain__debug && domain__debug(domain);
    const strdomValueLen = 2;
    const strdomRangeLen = 2 * strdomValueLen;
    ASSERT(typeof domain === 'string', 'ONLY_STRDOM', s);
    ASSERT(domain.length % strdomRangeLen === 0, 'SHOULD_CONTAIN_RANGES', s);
    const lo = (domain.charCodeAt(0) << 16) | domain.charCodeAt(1);
    const hi =
      (domain.charCodeAt(domain.length - strdomValueLen) << 16) |
      domain.charCodeAt(domain.length - strdomValueLen + 1);
    ASSERT(lo >= SUB, 'SHOULD_BE_GTE ' + SUB, s);
    ASSERT(hi <= SUP, 'SHOULD_BE_LTE ' + SUP, s);
    ASSERT(
      !expectSmallest || lo !== hi || domain.length > strdomRangeLen,
      'SHOULD_NOT_BE_SOLVED',
      s
    );
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
    if (value !== undefined)
      ASSERT((domain ^ SOLVED_FLAG) === value, 'SHOULD_BE_SOLVED_TO:' + value);
    return true;
  }
}

function ASSERT_BITDOM(domain) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(typeof domain === 'number', 'ONLY_BITDOM');
    ASSERT(domain >= 0, 'ALL_BITDOMS_SHOULD_BE_UNSIGNED');
    ASSERT(domain < SOLVED_FLAG, 'SOLVED_FLAG_NOT_SET');
    ASSERT(SMALL_MAX_NUM < 31, 'next assertion relies on this');
    ASSERT(
      domain >= 0 && domain < (1 << (SMALL_MAX_NUM + 1)) >>> 0,
      'NUMDOM_SHOULD_BE_VALID_RANGE'
    );
    return true;
  }
}

function ASSERT_ARRDOM(domain, min, max) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(domain instanceof Array, 'ONLY_ARRDOM');
    if (domain.length === 0) return;
    ASSERT(domain.length % 2 === 0, 'SHOULD_CONTAIN_RANGES');
    ASSERT(domain[0] >= (min || SUB), 'SHOULD_BE_GTE ' + (min || SUB));
    ASSERT(
      domain[domain.length - 1] <= (max === undefined ? SUP : max),
      'SHOULD_BE_LTE ' + (max === undefined ? SUP : max)
    );
    return true;
  }
}

function ASSERT_NORDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    const s = domain__debug && domain__debug(domain);
    ASSERT(
      typeof domain === 'string' || typeof domain === 'number',
      'ONLY_NORDOM',
      s
    );
    if (typeof domain === 'string') {
      ASSERT(domain.length > 0, 'empty domains are always numdoms');
      if (expectSmallest) {
        const lo = (domain.charCodeAt(0) << 16) | domain.charCodeAt(1);
        const hi =
          (domain.charCodeAt(domain.length - 2) << 16) |
          domain.charCodeAt(domain.length - 1);
        ASSERT(hi > SMALL_MAX_NUM, 'EXPECTING_STRDOM_TO_HAVE_NUMS_GT_BITDOM', s);
        ASSERT(
          domain.length > 4 || lo !== hi,
          'EXPECTING_STRDOM_NOT_TO_BE_SOLVED'
        );
      }
      return ASSERT_STRDOM(domain, undefined, undefined, s);
    }
    if (expectSmallest)
      ASSERT(
        !domain || domain >= SOLVED_FLAG || (domain & (domain - 1)) !== 0,
        'EXPECTING_SOLVED_NUMDOM_TO_BE_SOLDOM',
        s
      );
    ASSERT_NUMDOM(domain, s);
    return true;
  }
}

function ASSERT_NUMDOM(domain, expectSmallest, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    const s = domain__debug && domain__debug(domain);
    ASSERT(typeof domain === 'number', 'ONLY_NUMDOM', s);
    if (expectSmallest)
      ASSERT(
        !domain || domain >= SOLVED_FLAG || (domain & (domain - 1)) !== 0,
        'EXPECTING_SOLVED_NUMDOM_TO_BE_SOLDOM',
        s
      );
    if (domain >= SOLVED_FLAG) ASSERT_SOLDOM(domain);
    else ASSERT_BITDOM(domain);
    return true;
  }
}

function ASSERT_ANYDOM(domain) {
  if (process.env.NODE_ENV !== 'production') {
    ASSERT(
      typeof domain === 'string' ||
        typeof domain === 'number' ||
        domain instanceof Array,
      'ONLY_VALID_DOM_TYPE'
    );
  }
}

function ASSERT_VARDOMS_SLOW(vardoms, domain__debug) {
  if (process.env.NODE_ENV !== 'production') {
    for (const domain of vardoms) {
      ASSERT_NORDOM(domain, true, domain__debug);
    }
  }
}

const LOG_NONE = 0;
const LOG_STATS = 1;
const LOG_SOLVES = 2;
const LOG_MIN = LOG_NONE;
const LOG_MAX = LOG_SOLVES;

const LOG_FLAG_NONE = 0;
const LOG_FLAG_PROPSTEPS = 1;
const LOG_FLAG_CHOICE = 2;
const LOG_FLAG_SEARCH = 4;
const LOG_FLAG_SOLUTIONS = 8;

let LOG_FLAGS = LOG_FLAG_NONE; //LOG_FLAG_PROPSTEPS|LOG_FLAG_CHOICE|LOG_FLAG_SOLUTIONS|LOG_FLAG_SEARCH;
//let LOG_FLAGS = LOG_FLAG_PROPSTEPS|LOG_FLAG_CHOICE|LOG_FLAG_SOLUTIONS|LOG_FLAG_SEARCH;
function ASSERT_SET_LOG(level) {
  if (process.env.NODE_ENV !== 'production') {
    LOG_FLAGS = level;
  }
}

function helper_logger(...args) {
  if (process.env.NODE_ENV !== 'production') {
    getTerm().log('LOG', ...args);
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

let TRACING = false;
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
function TRACE(...args) {
  if (process.env.NODE_ENV !== 'production') {
    if (args.length === 1 && args[0] === '') return false;
    if (TRACING) getTerm().log(...args);
    return false;
  }
}

function TRACE_MORPH(from, to, desc, names, indexes) {
  if (process.env.NODE_ENV !== 'production') {
    TRACE(' ### Morphing;    ', from, '   ==>    ', to);
  }
}

function TRACE_SILENT(...args) {
  if (process.env.NODE_ENV !== 'production') {
    TRACE('\x1b[90m', ...args, '\x1b[0m');
  }
}

export {
  ASSERT,
  ASSERT_ANYDOM,
  ASSERT_ARRDOM,
  ASSERT_BITDOM,
  ASSERT_NORDOM,
  ASSERT_NUMDOM,
  ASSERT_SOLDOM,
  ASSERT_STRDOM,
  ASSERT_VARDOMS_SLOW,

  ASSERT_LOG,
  ASSERT_SET_LOG,

  LOG_FLAG_CHOICE,
  LOG_FLAG_NONE,
  LOG_FLAG_PROPSTEPS,
  LOG_FLAG_SEARCH,
  LOG_FLAG_SOLUTIONS,
  LOG_MAX,
  LOG_MIN,
  LOG_NONE,
  LOG_SOLVES,
  LOG_STATS,

  TRACE,
  TRACE_MORPH,
  TRACE_SILENT,
  isTracing,
  setTracing,
};
