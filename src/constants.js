import { getTerm, THROW } from './helpers';

const SUB = 0; // WARNING: don't change this. It's mostly a magic number thing.
const SUP = 100000000; // Don't let this max exceed 30 bits or stuff will break
const NOT_FOUND = -1;

// Different from NOT_FOUND in that NOT_FOUND must be -1 because of the indexOf api
// while NO_SUCH_VALUE must be a value that cannot be a legal domain value (<SUB or >SUP)
const NO_SUCH_VALUE = Math.min(0, SUB) - 1; // Make sure NO_SUCH_VALUE is a value that may be neither valid in a domain nor >=0

const ARR_RANGE_SIZE = 2; // Magic number

const SMALL_MAX_NUM = 30;
// There are SMALL_MAX_NUM flags. if they are all on, this is the number value
// (oh and; 1<<31 is negative. >>>0 makes it unsigned. this is why 30 is max.)
const SOLVED_FLAG = (1 << 31) >>> 0; // The >>> makes it unsigned, we dont really need it but it may help perf a little (unsigned vs signed)

const $STABLE = 0;
const $CHANGED = 1;
const $SOLVED = 2;
const $REJECTED = 3;

if (process.env.NODE_ENV !== 'production') {
  if (SMALL_MAX_NUM > 30) {
    const msg =
      'SMALL_MAX_NUM cannot exceed 30 or else shifting fails above and elsewhere';
    getTerm().error(msg);
    THROW(msg);
  }

  if (NOT_FOUND !== NO_SUCH_VALUE) {
    const msg =
      'not found constants NOT_FOUND and NO_SUCH_VALUE need to be equal to prevent confusion bugs';
    getTerm().error(msg);
    THROW(msg);
  }
}

export {
  $CHANGED,
  $REJECTED,
  $SOLVED,
  $STABLE,
  NOT_FOUND,
  NO_SUCH_VALUE,
  ARR_RANGE_SIZE,
  SMALL_MAX_NUM,
  SOLVED_FLAG,
  SUB,
  SUP,
};
