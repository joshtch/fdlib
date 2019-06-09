// NOTE: THIS IS NOT A GENERIC TRIE IMPLEMENTATION
// It's specifically geared towards the use within fdq
// Input strings are assumed to be limited to ascii 32-132

import { THROW } from './helpers';
import { ASSERT } from './assert';

const TRIE_ROOT_OFFSET = 0;
const TRIE_BUCKET_COUNT = 10; // 10 digits
const TRIE_NODE_SIZE = TRIE_BUCKET_COUNT + 1; // Inc value

const TRIE_INITIAL_SIZE = 16 * 1024;
const TRIE_MINIMAL_GROWTH = 4 * 1024;

const TRIE_KEY_NOT_FOUND = -1;

const TRIE_EMPTY = undefined;
const TRIE_DEFAULT_SIZE = undefined;
const TRIE_8_BIT = 8;
const TRIE_16_BIT = 16;
const TRIE_32_BIT = 32;
const TRIE_64_BIT = 64;
const TRIE_DEFAULT_BITS = undefined;

// Every trie node needs space for 10 jumps + 1 leaf value (must be capable of containing
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
 *
 * @nosideeffects
 */
function trie_create(valuesByIndex, initialLength, initialBitsize) {
  const size = initialLength | 0 || TRIE_INITIAL_SIZE;
  if (!size) THROW('fixme'); // Blabla it's possible the constant is not yet initialized due to minification. dont initialize a trie in module global space
  const bits = Math.max(trie_getValueBitsize(size), initialBitsize | 0); // Given bitsize might be lower than max address, ignore it in that case
  const buffer = trie_createBuffer(size, bits);

  // Have to use a wrapper because the buffer ref may change when it grows
  // otherwise we could just store the meta data inside the buffer. but at
  // least this is easier to read :)
  let trie = {
    _class: '$trie',
    buffer,
    bits, // 8 16 32 (64?)
    lastNode: TRIE_ROOT_OFFSET, // Pointer to last node in the buffer
    count: 0, // Number of keys in the Trie
  };

  if (process.env.NODE_ENV !== 'production') {
    trie = {
      ...trie,
      // Debug stats... any use should be wrapped in ASSERT so that it's use gets removed in a dist
      _mallocs: String(buffer.length), // Malloc steps in a string
      _adds: 0, // Number of trie_add calls
      _addSteps: 0, // Sum of steps taken in all trie_add calls
      _hass: 0, // Number of trie_has calls
      _gets: 0, // Number of trie_get calls (and also contains has)
      _getSteps: 0, // Sum of steps for all gets on this trie
    };
  }

  if (valuesByIndex) {
    for (let i = 0, n = valuesByIndex.length; i < n; ++i) {
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
    case 16:
      return new Uint16Array(size);
    case TRIE_32_BIT:
      return new Uint32Array(size);
    case TRIE_64_BIT:
      return new Float64Array(size); // Let's hope not ;)
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
  const newNodePtr = trie.lastNode + TRIE_NODE_SIZE;
  trie.lastNode = newNodePtr;
  // Technically the `while` is valid (instead of an `if`) but only
  // if the buffer could grow by a smaller amount than the node size...
  // note: buffer.length is cell size, buffer.byteLength is byte size. we want cells here.
  while (newNodePtr + TRIE_NODE_SIZE >= trie.buffer.length) trie_grow(trie);
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
  const len = trie.buffer.length; // Cell size! not byte size.
  let newSize = ~~(len * 1.1); // Grow by 10% (an arbitrary number)
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
  const newBits = trie_getValueBitsize(size);

  // Dont shrink bit size even if length would allow it; "large" _values_ may require it
  // (our tries dont need to shrink)
  trie.bits = Math.max(trie.bits, newBits);

  const nbuf = trie_createBuffer(size, trie.bits);
  nbuf.set(trie.buffer, 0);
  if (process.env.NODE_ENV !== 'production')
    ASSERT((trie._mallocs += ' ' + nbuf.length));
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
 *
 * @sideeffects
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
  ASSERT(value >= 0, 'VALUE_UNSIGNED');

  // Dont create next path part if it would create a leaf node
  if (index >= len) {
    const { buffer } = trie;
    const valuePtr = offset + TRIE_BUCKET_COUNT;
    const curValue = trie.buffer[valuePtr];
    if (!curValue) ++trie.count;
    buffer[valuePtr] = value + 1; // 0 is reserved to mean "unused"
    return curValue - 1;
  }

  const c = key.charCodeAt(index) - 32; // Allow all asciis 31 < c < 130 encoded as stringified double digits

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
 *
 * @sideeffects
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
    const { buffer } = trie;
    const valuePtr = offset + TRIE_BUCKET_COUNT;
    const curValue = trie.buffer[valuePtr];
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
  const bitsNeeded = trie_getValueBitsize(value);
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
  let ptr = trie.buffer[offset];
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

  const { buffer } = trie;

  if (index >= len) {
    const valuePtr = offset + TRIE_BUCKET_COUNT;
    return buffer[valuePtr] - 1;
  }

  const c = key.charCodeAt(index) - 32; // Allow all asciis 31 < c < 130 encoded as stringified double digits

  offset = buffer[offset + (c % 10)];
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

  const { buffer } = trie;

  if (key === 0) {
    const valuePtr = offset + TRIE_BUCKET_COUNT;
    return buffer[valuePtr] - 1;
  }

  offset = buffer[offset + (key % 10)];
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
 *
 * @nosideeffects
 */
function _trie_debug(trie, skipBuffer) {
  /* eslint no-extend-native: "off" */
  const { buffer } = trie;

  const { lastNode } = trie;

  // Patch some es6 stuff for debugging. note: dont do this in prod, it may slow stuff down.
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(n, c) {
      let s = this;
      if (this.length < n) for (let i = 0; i < n - this.length; ++i) s = c + s;
      return s;
    };
  }

  if (!String.prototype.padEnd) {
    String.prototype.padEnd = function(n, c) {
      let s = this;
      if (this.length < n) for (let i = 0; i < n - this.length; ++i) s += c;
      return s;
    };
  }

  if (!Array.from) {
    Array.from = function(a) {
      return [].concat.call(a);
    };
  }

  // If one doesnt support them, they probably all dont.
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

  const pad = 20;
  const npad = 6;
  let s =
    '' +
    '\n' +
    '###\n' +
    'Key count:'.padEnd(pad, ' ') +
    trie.count +
    '\n' +
    'Node count:'.padEnd(pad, ' ') +
    (lastNode / TRIE_NODE_SIZE + 1) +
    ' (' +
    (lastNode / TRIE_NODE_SIZE + 1) / trie.count +
    ' nodes per key)\n' +
    'Buffer cell length:'.padEnd(pad, ' ') +
    buffer.length +
    '\n' +
    'Buffer byte length:'.padEnd(pad, ' ') +
    buffer.byteLength +
    '\n' +
    'Bit size:'.padEnd(pad, ' ') +
    trie.bits +
    '\n' +
    'Node len:'.padEnd(pad, ' ') +
    TRIE_NODE_SIZE +
    '\n' +
    'Node size:'.padEnd(pad, ' ') +
    TRIE_NODE_SIZE +
    '\n' +
    'Last Node:'.padEnd(pad, ' ') +
    lastNode +
    '\n' +
    'Used space:'.padEnd(pad, ' ') +
    (lastNode + TRIE_NODE_SIZE) +
    ' cells, ' +
    bytes((lastNode + TRIE_NODE_SIZE) * (trie.bits >> 3)) +
    '\n' +
    'Unused space:'.padEnd(pad, ' ') +
    (buffer.length - (lastNode + TRIE_NODE_SIZE)) +
    ' cells, ' +
    bytes((buffer.length - (lastNode + TRIE_NODE_SIZE)) * (trie.bits >> 3)) +
    '\n';

  if (process.env.NODE_ENV !== 'production') {
    s +=
      'Mallocs:'.padEnd(pad, ' ') +
      trie._mallocs +
      '\n' +
      'trie_adds:'.padEnd(pad, ' ') +
      trie._adds +
      '\n' +
      'Avg key distance:'.padEnd(pad, ' ') +
      trie._addSteps / trie._adds +
      '\n' +
      'trie_hass:'.padEnd(pad, ' ') +
      trie._hass +
      '\n' +
      'trie_gets:'.padEnd(pad, ' ') +
      trie._gets +
      '\n' +
      'Avg get distance:'.padEnd(pad, ' ') +
      trie._getSteps +
      ' -> ' +
      trie._getSteps / trie._gets +
      '\n';
  }

  s += '\n';

  if (!skipBuffer) {
    s +=
      'ptr \\ key= 0      1      2      3      4      5      6      7      8      9  ->  value\n\n';

    let ptr = TRIE_ROOT_OFFSET;
    while (ptr <= lastNode) {
      s +=
        String(ptr).padStart(npad, ' ') +
        ': ' +
        [...buffer.slice(ptr, ptr + TRIE_NODE_SIZE - 1)]
          .map(n => String(n).padStart(npad, ' '))
          .join(', ') +
        '  ->  ' +
        String(buffer[ptr + TRIE_NODE_SIZE - 1]).padStart(npad, ' ') +
        '\n';
      ptr += TRIE_NODE_SIZE;
    }
  }

  s += '###\n\n';

  return s;
}

export {
  TRIE_8_BIT,
  TRIE_16_BIT,
  TRIE_32_BIT,
  TRIE_64_BIT,
  TRIE_DEFAULT_BITS,
  TRIE_DEFAULT_SIZE,
  TRIE_INITIAL_SIZE,
  TRIE_KEY_NOT_FOUND,
  TRIE_MINIMAL_GROWTH,
  TRIE_NODE_SIZE,
  TRIE_EMPTY,
  trie_add,
  trie_addNum,
  trie_create,
  _trie_debug,
  trie_get,
  trie_getNum,
  trie_getValueBitsize,
  trie_has,
  trie_hasNum,
};
