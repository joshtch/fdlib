// a domain, in this lib, is a set of numbers denoted by lo-hi range pairs (inclusive)
// for memory and performance reasons fdq has three different representations for a domain;
// - arrdom: an array with number pairs. mostly used by external apis because its easier to deal with. GC sensitive.
// - numdom: a 31bit field where each bit represents the inclusion of a value of its index (0 through 30). 31st bit unused
// - strdom: each value of an arrdom encoded as a double 16bit character. fixed range size (4 characters).

import {
  fixt_arrdom_nums,
  fixt_arrdom_range,
  fixt_assertStrings,
  fixt_dom_clone,
  fixt_dom_empty,
  fixt_dom_nums,
  fixt_dom_range,
  fixt_dom_solved,
  fixt_domainEql,
  fixt_numdom_empty,
  fixt_numdom_nums,
  fixt_numdom_range,
  fixt_numdom_solved,
  fixt_strdom_empty,
  fixt_strdom_nums,
  fixt_strdom_range,
  fixt_strdom_ranges,
  fixt_strdom_value,
} from '../lib/domain.fixt';

import {
  NOT_FOUND,
  NO_SUCH_VALUE,
  SMALL_MAX_NUM,
  SUP,
} from '../../src/constants';
import {
  EMPTY,
  STR_RANGE_SIZE,
  domain_arrToSmallest,
  domain_str_closeGaps,
  domain_containsValue,
  domain_createRange,
  domain_numnum_createRangeZeroToMax,
  domain_createValue,
  domain_divby,
  domain_fromListToArrdom,
  domain_getFirstIntersectingValue,
  domain_getValue,
  domain_hasNoZero,
  domain_intersection,
  domain_isSolved,
  domain_isZero,
  domain_max,
  _domain_str_mergeOverlappingRanges,
  //domain_middleElement,
  domain_min,
  domain_mul,
  domain_numToStr,
  domain_str_rangeIndexOf,
  domain_removeGte,
  domain_removeGtUnsafe,
  domain_removeLte,
  domain_removeValue,
  domain_resolveAsBooly,
  domain_sharesNoElements,
  domain_str_simplify,
  domain_size,
  _domain_str_quickSortRanges,
  domain_toArr,
  domain_toList,
  domain_toSmallest,
  domain__debug,
} from '../../src/domain';

const FLOOR_FRACTIONS = true;
const CEIL_FRACTIONS = false;

describe('src/domain.spec', () => {
  describe('EMPTY', () => {
    test('should be empty', () => {
      expect(EMPTY).toEqual(fixt_dom_empty());
    });
  });

  describe('domain_createValue', () => {
    test('should exist', () => {
      expect(typeof domain_createValue).toBe('function');
    });

    describe('numdoms', () => {
      test('should convert small solved values to nums', () => {
        fixt_domainEql(domain_createRange(0, 10), domain_createRange(0, 10));
        fixt_domainEql(
          domain_createRange(20, SMALL_MAX_NUM),
          domain_createRange(20, SMALL_MAX_NUM)
        );
        fixt_domainEql(
          domain_createRange(0, SMALL_MAX_NUM),
          domain_createRange(0, SMALL_MAX_NUM)
        );
      });

      test('should convert small solved values to nums', () => {
        expect(domain_createValue(0)).toEqual(fixt_numdom_solved(0));
        expect(domain_createValue(1)).toEqual(fixt_numdom_solved(1));
        expect(domain_createValue(5)).toEqual(fixt_numdom_solved(5));
        expect(domain_createValue(8)).toEqual(fixt_numdom_solved(8));
        expect(domain_createValue(12)).toEqual(fixt_numdom_solved(12));
        expect(domain_createValue(18)).toEqual(fixt_numdom_solved(18));
        expect(domain_createValue(21)).toEqual(fixt_numdom_solved(21));
        expect(domain_createValue(29)).toEqual(fixt_numdom_solved(29));
        expect(domain_createValue(30)).toEqual(fixt_numdom_solved(30));
      });
    });

    describe('strdoms', () => {
      test('should convert small values to nums', () => {
        expect(domain_createValue(31)).toEqual(fixt_numdom_solved(31));
        expect(domain_createValue(32)).toEqual(fixt_numdom_solved(32));
        expect(domain_createValue(100)).toEqual(fixt_numdom_solved(100));
        expect(domain_createValue(56548)).toEqual(fixt_numdom_solved(56548));
        expect(domain_createValue(447)).toEqual(fixt_numdom_solved(447));
        expect(domain_createValue(SUP)).toEqual(fixt_numdom_solved(SUP));
        expect(domain_createValue(SUP - 1)).toEqual(
          fixt_numdom_solved(SUP - 1)
        );
      });
    });
  });

  describe('domain_createRange', () => {
    test('should exist', () => {
      expect(typeof domain_createRange).toBe('function');
    });

    describe('numdoms', () => {
      test('should convert small values to nums', () => {
        expect(domain_createRange(0, 0)).toEqual(fixt_numdom_solved(0));
        expect(domain_createRange(0, 1)).toEqual(fixt_numdom_range(0, 1));
        expect(domain_createRange(0, 29)).toEqual(fixt_numdom_range(0, 29));
        expect(domain_createRange(0, 30)).toEqual(fixt_numdom_range(0, 30));
        expect(domain_createRange(29, 30)).toEqual(fixt_numdom_range(29, 30));
        expect(domain_createRange(30, 30)).toEqual(fixt_numdom_solved(30));
        expect(domain_createRange(8, 14)).toEqual(fixt_numdom_range(8, 14));
        expect(domain_createRange(5, 21)).toEqual(fixt_numdom_range(5, 21));
        expect(domain_createRange(24, 28)).toEqual(fixt_numdom_range(24, 28));
      });
    });

    describe('strdoms', () => {
      test('should convert small values to nums', () => {
        fixt_assertStrings(
          domain_createRange(0, SUP),
          fixt_strdom_range(0, SUP)
        );
        expect(domain_createRange(SUP, SUP)).toEqual(fixt_numdom_solved(SUP));
        fixt_assertStrings(
          domain_createRange(SUP - 1, SUP),
          fixt_strdom_range(SUP - 1, SUP)
        );
        fixt_assertStrings(
          domain_createRange(200, 2000),
          fixt_strdom_range(200, 2000)
        );
        expect(domain_createRange(SUP - 1, SUP - 1)).toEqual(
          fixt_numdom_solved(SUP - 1)
        );
        fixt_assertStrings(
          domain_createRange(0, SUP - 1),
          fixt_strdom_range(0, SUP - 1)
        );
        fixt_assertStrings(
          domain_createRange(5, 53243),
          fixt_strdom_range(5, 53243)
        );
        expect(domain_createRange(85755487, 85755487)).toEqual(
          fixt_numdom_solved(85755487)
        );
      });
    });
  });

  describe('domain_createRangeZeroToMax', () => {
    const ZERO = 1 << 0;
    const ONE = 1 << 1;
    const TWO = 1 << 2;
    const THREE = 1 << 3;
    const FOUR = 1 << 4;
    const FIVE = 1 << 5;
    const SIX = 1 << 6;
    const SEVEN = 1 << 7;
    const EIGHT = 1 << 8;
    const NINE = 1 << 9;
    const TEN = 1 << 10;
    const ELEVEN = 1 << 11;
    const TWELVE = 1 << 12;
    const THIRTEEN = 1 << 13;
    const FOURTEEN = 1 << 14;
    const FIFTEEN = 1 << 15;
    const SIXTEEN = 1 << 16;
    const SEVENTEEN = 1 << 17;
    const EIGHTEEN = 1 << 18;
    const NINETEEN = 1 << 19;
    const TWENTY = 1 << 20;
    const TWENTYONE = 1 << 21;
    const TWENTYTWO = 1 << 22;
    const TWENTYTHREE = 1 << 23;
    const TWENTYFOUR = 1 << 24;
    const TWENTYFIVE = 1 << 25;
    const TWENTYSIX = 1 << 26;
    const TWENTYSEVEN = 1 << 27;
    const TWENTYEIGHT = 1 << 28;
    const TWENTYNINE = 1 << 29;
    const THIRTY = 1 << 30;

    test('should work', () => {
      expect(_ => {
        domain_numnum_createRangeZeroToMax(ZERO);
      }).toThrowError('INVALID INPUT');
      expect(domain_numnum_createRangeZeroToMax(ONE)).toEqual(ZERO | ONE);
      expect(domain_numnum_createRangeZeroToMax(TWO)).toEqual(ZERO | ONE | TWO);
      expect(domain_numnum_createRangeZeroToMax(THREE)).toEqual(
        ZERO | ONE | TWO | THREE
      );
      expect(domain_numnum_createRangeZeroToMax(FOUR)).toEqual(
        ZERO | ONE | TWO | THREE | FOUR
      );
      expect(domain_numnum_createRangeZeroToMax(SIX)).toEqual(
        ZERO | ONE | TWO | THREE | FOUR | FIVE | SIX
      );
      expect(domain_numnum_createRangeZeroToMax(SEVEN)).toEqual(
        ZERO | ONE | TWO | THREE | FOUR | FIVE | SIX | SEVEN
      );
      expect(domain_numnum_createRangeZeroToMax(EIGHT)).toEqual(
        ZERO | ONE | TWO | THREE | FOUR | FIVE | SIX | SEVEN | EIGHT
      );
      expect(domain_numnum_createRangeZeroToMax(NINE)).toEqual(
        ZERO | ONE | TWO | THREE | FOUR | FIVE | SIX | SEVEN | EIGHT | NINE
      );
      expect(domain_numnum_createRangeZeroToMax(TEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN
      );
      expect(domain_numnum_createRangeZeroToMax(ELEVEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN
      );
      expect(domain_numnum_createRangeZeroToMax(TWELVE)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE
      );
      expect(domain_numnum_createRangeZeroToMax(THIRTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(FOURTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(FIFTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(SIXTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(SEVENTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(EIGHTEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN
      );
      expect(domain_numnum_createRangeZeroToMax(NINETEEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTY)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYONE)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYTWO)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYTHREE)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYFOUR)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYFIVE)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYSIX)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE |
          TWENTYSIX
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYSEVEN)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE |
          TWENTYSIX |
          TWENTYSEVEN
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYEIGHT)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE |
          TWENTYSIX |
          TWENTYSEVEN |
          TWENTYEIGHT
      );
      expect(domain_numnum_createRangeZeroToMax(TWENTYNINE)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE |
          TWENTYSIX |
          TWENTYSEVEN |
          TWENTYEIGHT |
          TWENTYNINE
      );
      expect(domain_numnum_createRangeZeroToMax(THIRTY)).toEqual(
        ZERO |
          ONE |
          TWO |
          THREE |
          FOUR |
          FIVE |
          SIX |
          SEVEN |
          EIGHT |
          NINE |
          TEN |
          ELEVEN |
          TWELVE |
          THIRTEEN |
          FOURTEEN |
          FIFTEEN |
          SIXTEEN |
          SEVENTEEN |
          EIGHTEEN |
          NINETEEN |
          TWENTY |
          TWENTYONE |
          TWENTYTWO |
          TWENTYTHREE |
          TWENTYFOUR |
          TWENTYFIVE |
          TWENTYSIX |
          TWENTYSEVEN |
          TWENTYEIGHT |
          TWENTYNINE |
          THIRTY
      );
    });
  });

  describe('fromListToArrdom', () => {
    test('should exist', () => {
      expect(typeof domain_fromListToArrdom).toBe('function');
    });

    test('should return empty array for empty lists', () => {
      expect(domain_fromListToArrdom([])).toEqual([]);
    });

    describe('numdoms', () => {
      test('should work with [0,0]', () => {
        expect(domain_fromListToArrdom([0])).toEqual(fixt_arrdom_nums(0));
        expect(domain_fromListToArrdom([0, 0])).toEqual(fixt_arrdom_nums(0));
      });

      test('should work with [0,1]', () => {
        expect(domain_fromListToArrdom([0, 1])).toEqual(fixt_arrdom_nums(0, 1));
        expect(domain_fromListToArrdom([1, 0])).toEqual(fixt_arrdom_nums(0, 1));
        expect(domain_fromListToArrdom([0, 0, 1, 1])).toEqual(
          fixt_arrdom_nums(0, 1)
        );
        expect(domain_fromListToArrdom([1, 1, 0, 0])).toEqual(
          fixt_arrdom_nums(0, 1)
        );
      });

      test('should throw with negative elements', () => {
        expect(() => {
          domain_fromListToArrdom([10, 1, -1, 0]);
        }).toThrowError('A_OOB_INDICATES_BUG');
        expect(() =>
          domain_fromListToArrdom([10, 1, -1, 0, 10, 1, -1, 0, 10, 1, -1, 0])
        ).toThrowError('A_OOB_INDICATES_BUG');
      });

      test('should not sort input array', () => {
        const list = [4, 3, 8, 2];
        domain_fromListToArrdom(list, true, true);

        expect(list).toEqual([4, 3, 8, 2]);
      });
    });

    describe('strdoms', () => {
      test('should work with [SUP,SUP]', () => {
        expect(domain_fromListToArrdom([SUP])).toEqual(fixt_arrdom_nums(SUP));
        expect(domain_fromListToArrdom([SUP, SUP])).toEqual(
          fixt_arrdom_nums(SUP)
        );
      });

      test('should work with [SUP-1,SUP]', () => {
        expect(domain_fromListToArrdom([SUP - 1, SUP])).toEqual(
          fixt_arrdom_nums(SUP - 1, SUP)
        );
        expect(domain_fromListToArrdom([SUP, SUP - 1])).toEqual(
          fixt_arrdom_nums(SUP, SUP - 1)
        );
        expect(domain_fromListToArrdom([SUP - 1, SUP - 1, SUP, SUP])).toEqual(
          fixt_arrdom_nums(SUP - 1, SUP)
        );
        expect(domain_fromListToArrdom([SUP - 1, SUP - 1, SUP, SUP])).toEqual(
          fixt_arrdom_nums(SUP - 1, SUP)
        );
      });

      test('should throw with negative elements', () => {
        expect(() => {
          domain_fromListToArrdom([SUP, 1, -1, 0]);
        }).toThrowError('A_OOB_INDICATES_BUG');
        expect(() => {
          domain_fromListToArrdom([SUP, 1, -1, 0, 10, 1, -1, 0, 10, 1, -1, 0]);
        }).toThrowError('A_OOB_INDICATES_BUG');
      });

      test('should not sort input array', () => {
        const list = [4, SUP, 3, 8, 2];
        const domain = domain_fromListToArrdom(list);

        expect(list).toEqual([4, SUP, 3, 8, 2]); // not changed
        expect(domain).toEqual(fixt_arrdom_nums(2, SUP, 3, 4, 8));
      });
    });
  });

  describe('getValue', () => {
    test('should exist', () => {
      expect(typeof domain_getValue).toBe('function');
    });

    describe('strdom', () => {
      test('should return NOT_FOUND if the domain has more than two values', () => {
        expect(domain_getValue(fixt_strdom_ranges([10, 20], [30, 40]))).toBe(
          NOT_FOUND
        );
      });

      test('should return NOT_FOUND if the domain is empty', () => {
        expect(domain_getValue(fixt_numdom_empty())).toEqual(NO_SUCH_VALUE);
      });

      test('should return NO_SUCH_VALUE if the two elements are not equal', () => {
        expect(domain_getValue(fixt_strdom_nums(321, 1))).toBe(NO_SUCH_VALUE);
      });

      test('should return value if both elements are same', () => {
        expect(domain_getValue(fixt_strdom_nums(1700))).toBe(1700);
        expect(domain_getValue(fixt_strdom_nums(SUP))).toBe(SUP);
        expect(domain_getValue(fixt_strdom_nums(SUP - 1))).toBe(SUP - 1);
        expect(domain_getValue(fixt_strdom_nums(32))).toBe(32);
        expect(domain_getValue(fixt_strdom_nums(0))).toBe(0);
      });
    });

    describe('numdom', () => {
      test('should return NOT_FOUND if the domain has more than two values', () => {
        expect(domain_getValue(fixt_numdom_nums(10, 12))).toBe(NOT_FOUND);
      });

      test('should return NOT_FOUND if the domain is empty', () => {
        const A = fixt_numdom_empty();
        expect(domain_getValue(A)).toBe(NOT_FOUND);
      });

      test('should return 12 if it only contains 12', () => {
        expect(domain_getValue(fixt_numdom_nums(12))).toBe(12);
      });

      test('should return 0 if it only contains 0', () => {
        expect(domain_getValue(fixt_numdom_nums(0))).toBe(0);
      });
    });

    describe('solved numdom', () => {
      test('should work with solved numdoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // 'i=' + i
          expect(domain_getValue(fixt_numdom_solved(i))).toBe(i);
        }
      });
    });
  });

  describe('toList', () => {
    test('should exist', () => {
      expect(typeof domain_toList).toBe('function');
    });

    test('should require a domain', () => {
      expect(() => {
        domain_toList();
      }).toThrowError('ONLY_NORDOM');
    });

    describe('strdom', () => {
      test('should work', () => {
        expect(domain_toList(fixt_strdom_nums(SUP))).toEqual([SUP]);
        expect(domain_toList(fixt_strdom_nums(SUP - 1, SUP))).toEqual([
          SUP - 1,
          SUP,
        ]);
        expect(domain_toList(fixt_strdom_nums(32))).toEqual([32]);
        expect(domain_toList(fixt_strdom_nums(0))).toEqual([0]);
      });
    });

    describe('numdom', () => {
      test('should accept empty domain', () => {
        expect(domain_toList(fixt_numdom_empty())).toEqual([]);
      });

      test('[0,0]', () => {
        expect(domain_toList(fixt_numdom_nums(0))).toEqual([0]);
      });

      test('[0,1]', () => {
        expect(domain_toList(fixt_numdom_nums(0, 1))).toEqual([0, 1]);
      });

      test('[1,1]', () => {
        expect(domain_toList(fixt_numdom_nums(1))).toEqual([1]);
      });
    });

    describe('solved numdom', () => {
      test('should work with solved numdoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // 'i=' + i
          expect(domain_toList(fixt_numdom_solved(i))).toEqual([i]);
        }
      });
    });
  });

  describe('getFirstIntersectingValue ', () => {
    describe('strdom', () => {
      test('should work with SUP range', () => {
        const A = fixt_strdom_range(SUP - 3, SUP);

        expect(domain_getFirstIntersectingValue(A, [SUP])).toEqual(SUP);
        // [0,10,9,7]
        expect(domain_getFirstIntersectingValue(A, [SUP, 10, 9, 7])).toEqual(
          SUP
        );
        // [10,9,7,0]
        expect(domain_getFirstIntersectingValue(A, [10, 9, 7, SUP])).toEqual(
          SUP
        );
        expect(domain_getFirstIntersectingValue(A, [SUP - 1])).toEqual(SUP - 1);
        expect(domain_getFirstIntersectingValue(A, [SUP - 2])).toEqual(SUP - 2);
        expect(domain_getFirstIntersectingValue(A, [SUP - 3])).toEqual(SUP - 3);
        expect(domain_getFirstIntersectingValue(A, [99, 100])).toEqual(
          NO_SUCH_VALUE
        );
      });

      test('should work with multiple ranges', () => {
        const A = fixt_strdom_ranges([SUP - 14, SUP - 10], [SUP - 4, SUP]);

        expect(domain_getFirstIntersectingValue(A, [SUP])).toEqual(SUP);
        expect(
          domain_getFirstIntersectingValue(A, [SUP, SUP - 10, SUP - 11])
        ).toEqual(SUP);
        expect(
          domain_getFirstIntersectingValue(A, [
            SUP - 10,
            SUP - 11,
            SUP,
            SUP - 12,
          ])
        ).toEqual(SUP - 10);
        expect(domain_getFirstIntersectingValue(A, [SUP - 1])).toEqual(SUP - 1);
        expect(
          domain_getFirstIntersectingValue(A, [SUP - 100, SUP - 12])
        ).toEqual(SUP - 12);
        expect(
          domain_getFirstIntersectingValue(A, [SUP - 12, SUP - 100])
        ).toEqual(SUP - 12);
      });

      test('should return NO_SUCH_VALUE if the list not intersect with domain', () => {
        const A = fixt_strdom_ranges(
          [SUP - 24, SUP - 20],
          [SUP - 14, SUP - 10],
          [SUP - 4, SUP]
        );

        expect(
          domain_getFirstIntersectingValue(A, [99, 5, SUP - 12, 11])
        ).toEqual(SUP - 12);
        expect(domain_getFirstIntersectingValue(A, [99, 5])).toEqual(
          NO_SUCH_VALUE
        );
      });

      test('should throw for negative values', () => {
        const A = fixt_strdom_ranges(
          [SUP - 24, SUP - 20],
          [SUP - 14, SUP - 10],
          [SUP - 4, SUP]
        );

        expect(() =>
          domain_getFirstIntersectingValue(A, [99, -1, SUP - 12, 11])
        ).toThrowError('A_OOB_INDICATES_BUG');
        expect(() =>
          domain_getFirstIntersectingValue(A, [99, -1])
        ).toThrowError('A_OOB_INDICATES_BUG');
      });
    });

    describe('numdom', () => {
      test('should work with single range', () => {
        const A = fixt_numdom_range(0, 3);

        expect(domain_getFirstIntersectingValue(A, [0])).toBe(0);
        // [0,10,9,7]
        expect(domain_getFirstIntersectingValue(A, [0, 10, 9, 7])).toBe(0);
        // [10,9,7,0]
        expect(domain_getFirstIntersectingValue(A, [10, 9, 7, 0])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [1])).toBe(1);
        expect(domain_getFirstIntersectingValue(A, [2])).toBe(2);
        expect(domain_getFirstIntersectingValue(A, [3])).toBe(3);
        expect(domain_getFirstIntersectingValue(A, [99, 100])).toEqual(
          NO_SUCH_VALUE
        );
      });

      test('should work with zero domain', () => {
        const A = fixt_numdom_nums(0);

        expect(domain_getFirstIntersectingValue(A, [0])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [0, 10, 11])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [10, 11, 0, 12])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [1])).toEqual(NO_SUCH_VALUE);
        expect(domain_getFirstIntersectingValue(A, [1, 2, 3, 4, 5])).toEqual(
          NO_SUCH_VALUE
        );
      });

      test('should work with multiple ranges', () => {
        const A = fixt_numdom_nums(0, 1, 2, 3, 4, 10, 11, 12, 13, 14);

        expect(domain_getFirstIntersectingValue(A, [0])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [0, 10, 11])).toBe(0);
        expect(domain_getFirstIntersectingValue(A, [10, 11, 0, 12])).toBe(10);
        expect(domain_getFirstIntersectingValue(A, [1])).toBe(1);
        expect(domain_getFirstIntersectingValue(A, [100, 12])).toBe(12);
        expect(domain_getFirstIntersectingValue(A, [12, 100])).toBe(12);
      });

      test('should return NO_SUCH_VALUE if the list not intersect with domain', () => {
        const A = fixt_numdom_nums(0, 1, 2, 3, 4, 10, 11, 12, 13, 14);

        expect(domain_getFirstIntersectingValue(A, [99, 5, 12, 11])).toBe(12);
        expect(domain_getFirstIntersectingValue(A, [99, 5])).toEqual(
          NO_SUCH_VALUE
        );
      });

      test('should throw for negative values', () => {
        const A = fixt_numdom_nums(0, 1, 2, 3, 4, 10, 11, 12, 13, 14);

        expect(() =>
          domain_getFirstIntersectingValue(A, [99, -1, 12, 11])
        ).toThrowError('A_OOB_INDICATES_BUG');
        expect(() =>
          domain_getFirstIntersectingValue(A, [99, -1])
        ).toThrowError('A_OOB_INDICATES_BUG');
      });
    });

    describe('solved numdom', () => {
      test('should work with solved numdoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // test for list with target (i) as first, middle, last, and
          // not-existing element. also empty list and only i.
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [i])
          ).toBe(i);
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [
              i,
              500,
              SUP,
            ])
          ).toBe(i);
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [
              500,
              i,
              SUP,
            ])
          ).toBe(i);
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [
              500,
              SUP,
              i,
            ])
          ).toBe(i);
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [500, SUP])
          ).toBe(NO_SUCH_VALUE);
          // 'i=' + i
          expect(
            domain_getFirstIntersectingValue(fixt_numdom_solved(i), [])
          ).toBe(NO_SUCH_VALUE);
        }
      });
    });
  });

  describe('containsValue', () => {
    test('should exist', () => {
      expect(typeof domain_containsValue).toBe('function');
    });

    describe('arrdom', () => {
      describe('should return true if domain contains given value', () => {
        test('one range in domain', () => {
          expect(
            domain_containsValue(fixt_strdom_range(SUP - 10, SUP), SUP - 5)
          ).toBe(true);
        });

        test('multiple ranges in domain', () => {
          expect(
            domain_containsValue(
              fixt_strdom_ranges(
                [SUP - 60, SUP - 50],
                [SUP - 30, SUP - 20],
                [SUP - 10, SUP]
              ),
              SUP - 25
            )
          ).toBe(true);
        });
      });

      describe('should return false if domain does not contain value', () => {
        test('empty array', () => {
          expect(domain_containsValue(fixt_numdom_empty(), 0)).toBe(false);
        });

        test('one range in domain', () => {
          expect(
            domain_containsValue(fixt_strdom_range(SUP - 10, SUP), 25)
          ).toBe(false);
        });

        test('multiple ranges in domain', () => {
          expect(
            domain_containsValue(
              fixt_strdom_ranges(
                [SUP - 60, SUP - 50],
                [SUP - 30, SUP - 20],
                [SUP - 10, SUP]
              ),
              SUP - 15
            )
          ).toBe(false);
        });
      });
    });

    describe('numdom', () => {
      describe('should return true if domain contains given value', () => {
        test('one range in domain', () => {
          expect(domain_containsValue(fixt_numdom_range(0, 10), 5)).toBe(true);
        });

        test('multiple ranges in domain', () => {
          expect(
            domain_containsValue(
              fixt_numdom_nums(0, 1, 2, 4, 5, 8, 9, 10, 11),
              9
            )
          ).toBe(true);
        });
      });

      describe('should return false if domain does not contain value', () => {
        test('empty array', () => {
          expect(domain_containsValue(fixt_numdom_empty(), 0)).toBe(false);
        });

        test('one range in domain', () => {
          expect(domain_containsValue(fixt_numdom_range(0, 10), 25)).toBe(
            false
          );
        });

        test('multiple ranges in domain', () => {
          expect(
            domain_containsValue(
              fixt_numdom_nums(0, 1, 2, 4, 5, 8, 9, 10, 11),
              6
            )
          ).toBe(false);
        });
      });
    });

    describe('solved numdom', () => {
      test('should work with solved numdoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // do a search that passes, fails, and is oob
          // 'i=' + i + ',q=0'
          expect(domain_containsValue(fixt_numdom_solved(i), 0)).toBe(i === 0);
          // 'i=' + i + ',q=1'
          expect(domain_containsValue(fixt_numdom_solved(i), 1)).toBe(i === 1);
          // 'i=' + i + ',q=SUP'
          expect(domain_containsValue(fixt_numdom_solved(i), SUP)).toBe(false);
        }
      });
    });

    describe('large value in numdom range', () => {
      test('should return false when numbers are oob for bitdom ranges', () => {
        expect(domain_containsValue(fixt_numdom_range(0, 10), 10000)).toBe(
          false
        );
        expect(domain_containsValue(fixt_numdom_range(0, 10), 1760)).toBe(
          false
        ); // this value is a regression that uncovered a bug
        expect(_ =>
          domain_containsValue(fixt_numdom_range(0, 10), -1)
        ).toThrowError('OOB');
        expect(_ =>
          domain_containsValue(fixt_numdom_range(0, 10), -10000)
        ).toThrowError('OOB');
      });
    });
  });

  describe('domain_rangeIndexOf', () => {
    test('should exist', () => {
      expect(typeof domain_str_rangeIndexOf).toBe('function');
    });

    describe('should return index of range offset that encloses value', () => {
      // note: not range index, but index on the set of numbers which represents range pairs

      test('one range in domain', () => {
        expect(
          domain_str_rangeIndexOf(fixt_strdom_range(SUP - 10, SUP), SUP - 5)
        ).toBe(0);
      });

      test('multiple ranges in domain', () => {
        expect(
          domain_str_rangeIndexOf(
            fixt_strdom_ranges(
              [SUP - 60, SUP - 50],
              [SUP - 30, SUP - 20],
              [SUP - 10, SUP]
            ),
            SUP - 50
          )
        ).toBe(0);
        expect(
          domain_str_rangeIndexOf(
            fixt_strdom_ranges(
              [SUP - 60, SUP - 50],
              [SUP - 30, SUP - 20],
              [SUP - 10, SUP]
            ),
            SUP - 25
          )
        ).toEqual(1 * STR_RANGE_SIZE);
        expect(
          domain_str_rangeIndexOf(
            fixt_strdom_ranges(
              [SUP - 60, SUP - 50],
              [SUP - 30, SUP - 20],
              [SUP - 10, SUP]
            ),
            SUP - 5
          )
        ).toEqual(2 * STR_RANGE_SIZE);
      });
    });

    describe('should return NOT_FOUND if domain does not contain value', () => {
      test('empty array', () => {
        expect(_ =>
          domain_str_rangeIndexOf(fixt_strdom_empty(), 0)
        ).toThrowError('NOT_EMPTY_STR');
      });

      test('one range in domain', () => {
        expect(
          domain_str_rangeIndexOf(fixt_strdom_range(SUP - 10, SUP), SUP - 25)
        ).toEqual(NOT_FOUND);
      });

      test('multiple ranges in domain', () => {
        expect(
          domain_str_rangeIndexOf(
            fixt_strdom_ranges(
              [SUP - 60, SUP - 50],
              [SUP - 30, SUP - 20],
              [SUP - 10, SUP]
            ),
            SUP - 15
          )
        ).toEqual(NOT_FOUND);
      });
    });
  });

  describe('domain_removeValue', () => {
    test('should exist', () => {
      expect(typeof domain_removeValue).toBe('function');
    });

    test('should reject an invalid value', () => {
      // (only numbers are valid values)
      expect(() =>
        domain_removeValue(fixt_dom_nums(1, 2, 3), '15')
      ).toThrowError('VALUE_SHOULD_BE_VALID_DOMAIN_ELEMENT');
      expect(() =>
        domain_removeValue(fixt_dom_nums(1, 2, 3), ['15'])
      ).toThrowError('VALUE_SHOULD_BE_VALID_DOMAIN_ELEMENT');
    });

    describe('strdom', () => {
      test('should require a domain', () => {
        expect(() => {
          domain_removeValue(null, 15);
        }).toThrowError('ONLY_NORDOM');
      });

      // target: 5
      // 012 456 89 -> 012 4 6 89
      // 012 567    -> 012 67
      // 01 345     -> 01 34
      // 01 345 89  -> 01 34 89
      // 012 5 789  -> 012 789
      // 5 789      -> 789
      // 012 5      -> 012
      // 789        -> 789
      // 012        -> 012
      // 5          -> empty
      // empty      -> empty

      function testThis(domain, value, expectation) {
        test(`should remove [${value}] from [${domain__debug(
          domain
        )}] resulting in [${domain__debug(expectation)}]`, () => {
          const clone = fixt_dom_clone(domain);
          const result = domain_removeValue(fixt_dom_clone(domain), value);

          // should not change
          expect(domain).toEqual(clone);
          if (typeof expectation === 'string')
            fixt_assertStrings(result, expectation);
          else expect(result).toBe(expectation); // output is a numdom
          expect(result).toEqual(expectation);
        });
      }

      testThis(
        fixt_strdom_ranges([100, 102], [104, 106], [108, 109]),
        105,
        fixt_strdom_ranges([100, 102], [104, 104], [106, 106], [108, 109])
      );
      testThis(
        fixt_strdom_ranges([100, 102], [104, 106]),
        105,
        fixt_strdom_ranges([100, 102], [104, 104], [106, 106])
      );
      testThis(
        fixt_strdom_ranges([100, 101], [103, 105]),
        105,
        fixt_strdom_ranges([100, 101], [103, 104])
      );
      testThis(
        fixt_strdom_ranges([100, 101], [103, 105], [108, 109]),
        105,
        fixt_strdom_ranges([100, 101], [103, 104], [108, 109])
      );
      testThis(
        fixt_strdom_ranges([100, 102], [105, 105], [107, 109]),
        105,
        fixt_strdom_ranges([100, 102], [107, 109])
      );
      testThis(
        fixt_strdom_ranges([105, 105], [107, 109]),
        105,
        fixt_strdom_ranges([107, 109])
      );
      testThis(
        fixt_strdom_ranges([100, 102], [105, 105]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      testThis(
        fixt_strdom_ranges([107, 109]),
        105,
        fixt_strdom_ranges([107, 109])
      );
      testThis(
        fixt_strdom_ranges([100, 102]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      testThis(fixt_strdom_ranges([105, 105]), 105, fixt_numdom_empty());

      testThis(fixt_strdom_ranges([32, 32]), 32, fixt_numdom_empty());
      testThis(fixt_strdom_ranges([SUP, SUP]), SUP, fixt_numdom_empty());
      testThis(
        fixt_strdom_ranges([SUP - 1, SUP - 1]),
        SUP - 1,
        fixt_numdom_empty()
      );
      testThis(
        fixt_strdom_ranges([SUP - 1, SUP]),
        SUP,
        fixt_numdom_solved(SUP - 1)
      );
    });

    describe('numdom', () => {
      // target: 5
      // 012 456 89 -> 012 4 6 89
      // 012 567    -> 012 67
      // 01 345     -> 01 34
      // 01 345 89  -> 01 34 89
      // 012 5 789  -> 012 789
      // 5 789      -> 789
      // 012 5      -> 012
      // 789        -> 789
      // 012        -> 012
      // 5          -> empty
      // empty      -> empty

      function testThis(domain, value, output) {
        test(`should remove [${value}] from [${domain}] resulting in [${output}]`, () => {
          expect(domain_removeValue(domain, value)).toEqual(output);
        });
      }

      testThis(
        fixt_numdom_nums(0, 1, 2, 4, 5, 6, 8, 9),
        5,
        fixt_numdom_nums(0, 1, 2, 4, 6, 8, 9)
      );
      testThis(
        fixt_numdom_nums(0, 1, 2, 4, 5, 6),
        5,
        fixt_numdom_nums(0, 1, 2, 4, 6)
      );
      testThis(
        fixt_numdom_nums(0, 1, 3, 4, 5),
        5,
        fixt_numdom_nums(0, 1, 3, 4)
      );
      testThis(
        fixt_numdom_nums(0, 1, 3, 4, 5, 8, 9),
        5,
        fixt_numdom_nums(0, 1, 3, 4, 8, 9)
      );
      testThis(
        fixt_numdom_nums(0, 1, 2, 5, 7, 8, 9),
        5,
        fixt_numdom_nums(0, 1, 2, 7, 8, 9)
      );
      testThis(fixt_numdom_nums(5, 7, 8, 9), 5, fixt_numdom_nums(7, 8, 9));
      testThis(fixt_numdom_nums(0, 1, 2, 5), 5, fixt_numdom_nums(0, 1, 2));
      testThis(fixt_numdom_nums(7, 8, 9), 5, fixt_numdom_nums(7, 8, 9));
      testThis(fixt_numdom_nums(0, 1, 2), 5, fixt_numdom_nums(0, 1, 2));
      testThis(fixt_numdom_nums(5), 5, fixt_numdom_nums());
    });

    describe('solved numdom', () => {
      test('should work with solved numdoms', () => {
        const nums = [0, 1, 10, 100, 1000, SUP - 1, SUP];
        for (let i = 0; i < nums.length; ++i) {
          const n = nums[i];
          // do a search that passes and one that fails
          // 'n=' + n + ',q=' + n
          expect(domain_removeValue(fixt_numdom_solved(n), n)).toBe(
            fixt_dom_empty()
          );
          // 'n=' + n + ',q=5'
          expect(domain_removeValue(fixt_numdom_solved(n), 5)).toBe(
            fixt_numdom_solved(n)
          );
        }
      });
    });
  });

  describe('domain_sharesNoElements', () => {
    test('should exist', () => {
      expect(typeof domain_sharesNoElements).toBe('function');
    });

    describe('strdom', () => {
      test('unit tests', () => {
        expect(
          domain_sharesNoElements(
            fixt_strdom_range(1, SUP),
            fixt_strdom_range(500, 600)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(
            fixt_strdom_range(1, SUP - 10),
            fixt_strdom_range(SUP - 5, SUP)
          )
        ).toBe(true);
        expect(
          domain_sharesNoElements(
            fixt_strdom_range(500, 600),
            fixt_strdom_range(1, SUP)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(
            fixt_strdom_range(SUP - 5, SUP),
            fixt_strdom_range(1, SUP - 10)
          )
        ).toBe(true);
      });
    });

    describe('numdom', () => {
      test('unit tests', () => {
        expect(
          domain_sharesNoElements(
            fixt_numdom_range(1, 20),
            fixt_numdom_range(15, 25)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(
            fixt_numdom_range(1, 20),
            fixt_numdom_range(25, 27)
          )
        ).toBe(true);
        expect(
          domain_sharesNoElements(
            fixt_numdom_range(15, 25),
            fixt_numdom_range(1, 20)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(
            fixt_numdom_range(25, 27),
            fixt_numdom_range(1, 20)
          )
        ).toBe(true);
      });
    });

    describe('soldom', () => {
      test('unit tests', () => {
        //expect(domain_sharesNoElements(fixt_numdom_range(1, 20), fixt_numdom_solved(15))).to.eql(false);
        //expect(domain_sharesNoElements(fixt_numdom_range(1, 20), fixt_numdom_solved(25))).to.eql(true);
        //expect(domain_sharesNoElements(fixt_numdom_solved(15), fixt_numdom_range(1, 20))).to.eql(false);
        //expect(domain_sharesNoElements(fixt_numdom_solved(25), fixt_numdom_range(1, 20))).to.eql(true);
        expect(
          domain_sharesNoElements(
            fixt_numdom_solved(500),
            fixt_strdom_range(1, SUP)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(
            fixt_numdom_solved(SUP),
            fixt_strdom_range(1, SUP - 10)
          )
        ).toBe(true);
        expect(
          domain_sharesNoElements(
            fixt_numdom_solved(20),
            fixt_numdom_solved(20)
          )
        ).toBe(false);
        expect(
          domain_sharesNoElements(fixt_numdom_solved(20), fixt_numdom_solved(0))
        ).toBe(true);
        expect(
          domain_sharesNoElements(fixt_numdom_solved(0), fixt_numdom_solved(20))
        ).toBe(true);
      });
    });
  });

  describe('domain_min', () => {
    test('should exist', () => {
      expect(typeof domain_min).toBe('function');
    });

    test('arrdom', () => {
      expect(domain_min(fixt_strdom_ranges([0, 10], [100, 300]))).toBe(0);
      expect(domain_min(fixt_strdom_ranges([0, 10], [100, SUP]))).toBe(0);
      expect(domain_min(fixt_strdom_ranges([1, 1], [100, SUP]))).toBe(1);
      expect(domain_min(fixt_strdom_ranges([100, 100]))).toBe(100);
      expect(domain_min(fixt_strdom_ranges([SUP, SUP]))).toEqual(SUP);
      expect(domain_min(fixt_strdom_ranges([SUP - 1, SUP]))).toEqual(SUP - 1);
    });

    test('numdom', () => {
      for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
        // basically trying each small domain range from [0,30] to [30,30]
        // i + ' | i'
        expect(domain_min(fixt_numdom_nums(i))).toEqual(i);
        // i + ' | 30'
        expect(domain_min(fixt_numdom_nums(i, 30))).toEqual(i);
      }
    });
  });

  describe('domain_max', () => {
    test('should exist', () => {
      expect(typeof domain_max).toBe('function');
    });

    test('arrdom', () => {
      expect(domain_max(fixt_strdom_ranges([0, 10], [100, 300]))).toBe(300);
      expect(domain_max(fixt_strdom_ranges([0, 10], [100, SUP]))).toEqual(SUP);
      expect(domain_max(fixt_strdom_ranges([1, 1], [100, SUP]))).toEqual(SUP);
      expect(domain_max(fixt_strdom_ranges([100, 100]))).toBe(100);
      expect(domain_max(fixt_strdom_ranges([SUP, SUP]))).toEqual(SUP);
      expect(domain_max(fixt_strdom_ranges([SUP - 1, SUP]))).toEqual(SUP);
    });

    test('numdom', () => {
      for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
        // basically trying each small domain range from [0,30] to [30,30]
        // '0 | ' + i
        expect(domain_max(fixt_numdom_nums(0, i))).toEqual(i);
      }
    });
  });

  describe('domain_mergeOverlappingInline', () => {
    test('should exist', () => {
      expect(typeof _domain_str_mergeOverlappingRanges).toBe('function');
    });

    test('should throw for domains as numbers', () => {
      expect(_ =>
        _domain_str_mergeOverlappingRanges(fixt_numdom_nums(1))
      ).toThrowError('ONLY_STRDOM');
    });

    test('should return empty domain for empty domain', () => {
      expect(_domain_str_mergeOverlappingRanges(fixt_strdom_empty())).toEqual(
        fixt_strdom_empty()
      );
    });

    test('should return same range for single range domain', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(fixt_strdom_range(910, 9100)),
        fixt_strdom_range(910, 9100)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(fixt_strdom_range(930, 9213)),
        fixt_strdom_range(930, 9213)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(fixt_strdom_range(90, 91)),
        fixt_strdom_range(90, 91)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(fixt_strdom_range(SUP, SUP)),
        fixt_strdom_range(SUP, SUP)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(fixt_strdom_range(SUP - 1, SUP)),
        fixt_strdom_range(SUP - 1, SUP)
      );
    });

    test('should return same if not overlapping', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([910, 9100], [9200, 9300])
        ),
        fixt_strdom_ranges([910, 9100], [9200, 9300])
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [92, 92])
        ),
        fixt_strdom_ranges([90, 90], [92, 92])
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [SUP, SUP])
        ),
        fixt_strdom_ranges([90, 90], [SUP, SUP])
      );
    });

    test('should merge if two domains overlap', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 91], [91, 92])
        ),
        fixt_strdom_range(90, 92)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 950], [925, 975])
        ),
        fixt_strdom_range(90, 975)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([9213, 9278], [9244, 9364])
        ),
        fixt_strdom_range(9213, 9364)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([910, 920], [930, 940], [935, 945], [950, 960])
        ),
        fixt_strdom_ranges([910, 920], [930, 945], [950, 960])
      );
    });

    test('should merge if two domains touch', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [91, 91])
        ),
        fixt_strdom_range(90, 91)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 91], [92, 93])
        ),
        fixt_strdom_range(90, 93)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 910], [910, 920])
        ),
        fixt_strdom_range(90, 920)
      );
    });

    test('should chain merges', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [91, 91], [92, 92])
        ),
        fixt_strdom_range(90, 92)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 91], [91, 92], [92, 93])
        ),
        fixt_strdom_range(90, 93)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [91, 92], [92, 93])
        ),
        fixt_strdom_range(90, 93)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([91, 92], [92, 93])
        ),
        fixt_strdom_range(91, 93)
      );
    });

    test('should make sure resulting range wraps both ranges', () => {
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 90], [90, 91])
        ),
        fixt_strdom_range(90, 91)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges([90, 91], [90, 90])
        ),
        fixt_strdom_range(90, 91)
      );
      fixt_assertStrings(
        _domain_str_mergeOverlappingRanges(
          fixt_strdom_ranges(
            [90, 910],
            [914, 916],
            [915, 920],
            [916, 919],
            [917, 918]
          )
        ),
        fixt_strdom_ranges([90, 910], [914, 920])
      );
    });
  });

  describe('domain_simplifyInline', () => {
    test('should exist', () => {
      expect(typeof domain_str_simplify).toBe('function');
    });

    test('should throw for domains as numbers', () => {
      expect(_ => {
        domain_str_simplify(fixt_numdom_empty());
      }).toThrowError('ONLY_STRDOM');
      expect(_ => {
        domain_str_simplify(fixt_numdom_nums(1, 3, 9));
      }).toThrowError('ONLY_STRDOM');
      expect(_ => {
        domain_str_simplify();
      }).toThrowError('ONLY_STRDOM');
    });

    test('should work with empty domain', () => {
      const arr = fixt_strdom_empty();
      expect(domain_str_simplify(arr)).toEqual(fixt_dom_empty());
    });

    test('should return a solved domain if it has one range', () => {
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_range(90, 91)),
        fixt_strdom_range(90, 91)
      );
      expect(domain_str_simplify(fixt_strdom_range(SUP, SUP))).toEqual(
        fixt_numdom_solved(SUP)
      );
    });

    test('should work if domain is not changed', () => {
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([91, 92], [920, 930])),
        fixt_strdom_ranges([91, 92], [920, 930])
      );
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([91, 92], [920, SUP])),
        fixt_strdom_ranges([91, 92], [920, SUP])
      );
    });

    test('should simplify back-to-back domains', () => {
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([91, 92], [92, 93])),
        fixt_strdom_range(91, 93)
      );
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([91, 92], [92, SUP])),
        fixt_strdom_range(91, SUP)
      );
    });

    test('should simplify swapped back-to-back domains', () => {
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([92, 93], [91, 92])),
        fixt_strdom_range(91, 93)
      );
      fixt_assertStrings(
        domain_str_simplify(fixt_strdom_ranges([92, SUP], [91, 92])),
        fixt_strdom_range(91, SUP)
      );
    });
  });

  describe('intersection', () => {
    test('should exist', () => {
      expect(typeof domain_intersection).toBe('function');
    });

    test('should require two domains', () => {
      expect(() => {
        domain_intersection();
      }).toThrowError('ONLY_NORDOM');
      expect(() => {
        domain_intersection(fixt_numdom_empty());
      }).toThrowError('ONLY_NORDOM');
      expect(() => {
        domain_intersection(null, fixt_numdom_empty());
      }).toThrowError('ONLY_NORDOM');
    });

    test('should return empty numdom', () => {
      expect(
        domain_intersection(fixt_numdom_empty(), fixt_numdom_empty())
      ).toEqual(fixt_dom_empty());
    });

    test('should throw for EMPTY_STR', () => {
      expect(_ =>
        domain_intersection(fixt_strdom_empty(), fixt_strdom_empty())
      ).toThrowError('empty domains are always numdoms');
      expect(_ =>
        domain_intersection(fixt_strdom_empty(), fixt_numdom_empty())
      ).toThrowError('empty domains are always numdoms');
      expect(_ =>
        domain_intersection(fixt_numdom_empty(), fixt_strdom_empty())
      ).toThrowError('empty domains are always numdoms');
    });

    describe('strdom', () => {
      test('should handle empty domain with single element domain', () => {
        expect(
          domain_intersection(fixt_numdom_empty(), fixt_strdom_range(90, 91))
        ).toEqual(fixt_dom_empty());
      });

      test('should handle empty domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_empty(),
            fixt_strdom_ranges([90, 91], [93, 95])
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should handle single element domain with empty domain', () => {
        expect(
          domain_intersection(fixt_strdom_range(90, 91), fixt_numdom_empty())
        ).toEqual(fixt_dom_empty());
      });

      test('should handle single element domain with empty domain', () => {
        expect(
          domain_intersection(
            fixt_strdom_ranges([90, 91], [93, 95]),
            fixt_numdom_empty()
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should handle single element domains', () => {
        expect(
          domain_intersection(
            fixt_strdom_range(90, 91),
            fixt_strdom_range(93, 95)
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should intersect single element domains', () => {
        fixt_assertStrings(
          domain_intersection(
            fixt_strdom_range(90, 95),
            fixt_strdom_range(93, 100)
          ),
          fixt_strdom_range(93, 95)
        );
      });

      test('should intersect single element domains reversed', () => {
        fixt_assertStrings(
          domain_intersection(
            fixt_strdom_range(93, 100),
            fixt_strdom_range(90, 95)
          ),
          fixt_strdom_range(93, 95)
        );
      });

      test('should handle single element domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_strdom_range(90, 91),
            fixt_strdom_ranges([10, 20], [30, 40])
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should handle multi element domain with single element domain', () => {
        expect(
          domain_intersection(
            fixt_strdom_ranges([0, 1], [10, 120]),
            fixt_strdom_range(130, 140)
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should intersect single element domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_strdom_range(5, 16),
            fixt_strdom_ranges([10, 20], [30, 40])
          )
        ).toEqual(fixt_numdom_range(10, 16));
      });

      test('should intersect multi element domain with single element domain', () => {
        fixt_assertStrings(
          domain_intersection(
            fixt_strdom_ranges([0, 1], [25, 35]),
            fixt_strdom_range(30, 40)
          ),
          fixt_strdom_range(30, 35)
        );
      });

      test('should handle multi element domains', () => {
        expect(
          domain_intersection(
            fixt_strdom_ranges([0, 1], [10, 120]),
            fixt_strdom_ranges([130, 140], [150, 160])
          )
        ).toEqual(fixt_dom_empty());
      });

      test('should intersect multi element domains', () => {
        fixt_assertStrings(
          domain_intersection(
            fixt_strdom_ranges([0, 1], [10, 35]),
            fixt_strdom_ranges([30, 40], [50, 60])
          ),
          fixt_strdom_range(30, 35)
        );
      });

      test('should return two ranges if a range in one domain intersects with two ranges of the other domain', () => {
        fixt_assertStrings(
          domain_intersection(
            fixt_strdom_range(15, 35),
            fixt_strdom_ranges([10, 20], [30, 40])
          ),
          fixt_strdom_ranges([15, 20], [30, 35])
        );
      });

      test('should divide and conquer some random tests 1', () => {
        // copy(JSON.stringify(function f(n) {
        //   var arr = [];
        //   while (--n > 0) {
        //     var t = Math.floor(Math.random() * 100);
        //     arr.push(t, t+Math.floor(Math.random() * 20));
        //   }
        //   return arr;
        // }(10).map(function(a){
        //   return [Math.min(a[0],a[1]), Math.max(a[0], a[1])];
        // })).replace(/,/g, ', '))

        let a = fixt_strdom_ranges(
          [10, 23],
          [29, 38],
          [49, 49],
          [54, 68],
          [77, 78],
          [84, 100]
        );
        let b = fixt_strdom_ranges(
          [1, 1],
          [3, 21],
          [25, 38],
          [54, 67],
          [70, 84],
          [88, 107]
        );

        fixt_assertStrings(
          domain_intersection(a, b),
          fixt_strdom_ranges(
            [10, 21],
            [29, 38],
            [54, 67],
            [77, 78],
            [84, 84],
            [88, 100]
          )
        );
      });

      test('should divide and conquer some random tests 2', () => {
        let a = fixt_strdom_ranges([17, 23], [37, 78], [85, 104]);
        let b = fixt_strdom_ranges(
          [6, 25],
          [47, 56],
          [58, 60],
          [64, 67],
          [83, 103]
        );

        fixt_assertStrings(
          domain_intersection(a, b),
          fixt_strdom_ranges([17, 23], [47, 56], [58, 60], [64, 67], [85, 103])
        );
      });

      test('should divide and conquer some random tests 3', () => {
        let a = fixt_strdom_ranges([9, 36], [54, 66], [74, 77], [84, 96]);
        let b = fixt_strdom_range(1, 75);

        fixt_assertStrings(
          domain_intersection(a, b),
          fixt_strdom_ranges([9, 36], [54, 66], [74, 75])
        );
      });

      test('should normalize a numdom if the result is low enough', () => {
        let a = fixt_strdom_ranges([9, 30], [54, 67], [74, 77], [84, 96]);
        let b = fixt_strdom_range(28, 35);

        // only 28,29,30 intersects (crossing the numdom boundary)
        expect(domain_intersection(a, b)).toEqual(fixt_numdom_range(28, 30));
      });

      test('should return a solved numdom if the result is solved to a strdom value', () => {
        let a = fixt_strdom_ranges([9, 36], [54, 66], [74, 77], [84, 96]);
        let b = fixt_strdom_range(66, 70);

        // only 66 intersects
        // domain_toArr(domain_intersection(a, b))
        expect(domain_intersection(a, b)).toEqual(fixt_numdom_solved(66));
      });

      test('should return a solved numdom if the result is solved to a numdom value', () => {
        let a = fixt_strdom_ranges([9, 30], [54, 66], [74, 77], [84, 96]);
        let b = fixt_strdom_range(30, 35);

        // only 66 intersects
        expect(domain_intersection(a, b)).toEqual(fixt_numdom_solved(30));
      });
    });

    describe('numdom', () => {
      test('should return a small domain', () => {
        let arr1 = fixt_numdom_empty();
        let arr2 = fixt_numdom_empty();
        let out = domain_intersection(arr1, arr2);

        expect(out).toBe(fixt_numdom_empty());
      });

      test('should handle empty domain with single element domain', () => {
        expect(
          domain_intersection(fixt_numdom_empty(), fixt_numdom_range(0, 1))
        ).toEqual(fixt_numdom_empty());
      });

      test('should handle empty domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_empty(),
            fixt_numdom_nums(0, 1, 3, 4, 5)
          )
        ).toEqual(fixt_numdom_empty());
      });

      test('should handle single element domain with empty domain', () => {
        expect(
          domain_intersection(fixt_numdom_range(0, 1), fixt_numdom_empty())
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(fixt_numdom_empty(), fixt_numdom_range(0, 1))
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(
            fixt_numdom_nums(0, 1, 3, 4, 5),
            fixt_numdom_empty()
          )
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(
            fixt_numdom_empty(),
            fixt_numdom_nums(0, 1, 3, 4, 5)
          )
        ).toEqual(fixt_numdom_empty());
      });

      test('should handle single element domains', () => {
        expect(
          domain_intersection(fixt_numdom_range(0, 1), fixt_numdom_range(3, 5))
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(fixt_numdom_range(3, 5), fixt_numdom_range(0, 1))
        ).toEqual(fixt_numdom_empty());
      });

      test('should intersect single element domains', () => {
        expect(
          domain_intersection(fixt_numdom_range(0, 5), fixt_numdom_range(3, 10))
        ).toEqual(fixt_numdom_range(3, 5));
        expect(
          domain_intersection(fixt_numdom_range(3, 10), fixt_numdom_range(0, 5))
        ).toEqual(fixt_numdom_range(3, 5));
      });

      test('should handle single element domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_range(10, 15),
            fixt_numdom_range(0, 1)
          )
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(
            fixt_numdom_range(0, 1),
            fixt_numdom_range(10, 15)
          )
        ).toEqual(fixt_numdom_empty());
      });

      test('should handle multi element domain with single element domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_nums(5, 6, 7),
            fixt_numdom_nums(0, 1, 10, 11, 12, 13, 14, 15)
          )
        ).toEqual(fixt_numdom_empty());
        expect(
          domain_intersection(
            fixt_numdom_nums(0, 1, 10, 11, 12, 13, 14, 15),
            fixt_numdom_nums(5, 6, 7)
          )
        ).toEqual(fixt_numdom_empty());
      });

      test('should intersect single element domain with multi element domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_nums(0, 1, 10, 11, 12, 13, 14, 15),
            fixt_numdom_range(5, 15)
          )
        ).toEqual(fixt_numdom_range(10, 15));
        expect(
          domain_intersection(
            fixt_numdom_range(5, 15),
            fixt_numdom_nums(0, 1, 10, 11, 12, 13, 14, 15)
          )
        ).toEqual(fixt_numdom_range(10, 15));
      });

      test('should return two ranges if a range in one domain intersects with two ranges of the other domain', () => {
        expect(
          domain_intersection(
            fixt_numdom_range(5, 10),
            fixt_numdom_nums(4, 5, 6, 9, 10, 11)
          )
        ).toEqual(fixt_numdom_nums(5, 6, 9, 10));
        expect(
          domain_intersection(
            fixt_numdom_nums(4, 5, 6, 9, 10, 11),
            fixt_numdom_range(5, 10)
          )
        ).toEqual(fixt_numdom_nums(5, 6, 9, 10));
      });
    });

    describe('anydom', () => {
      test('should work with strdom and numdom', () => {
        expect(
          domain_intersection(
            fixt_strdom_range(0, 95),
            fixt_numdom_range(5, 10)
          )
        ).toEqual(fixt_numdom_range(5, 10));
      });

      test('should work with numdom and strdom', () => {
        expect(
          domain_intersection(
            fixt_numdom_range(5, 10),
            fixt_strdom_range(0, 95)
          )
        ).toEqual(fixt_numdom_range(5, 10));
      });
    });

    describe('solved numdom', () => {
      test('should work with two solved numdoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // test an intersection that succeeds and one that fails
          // 'i=' + i + ',yes'
          expect(
            domain_intersection(fixt_numdom_solved(i), fixt_numdom_solved(i))
          ).toBe(fixt_numdom_solved(i));
          // 'i=' + i + ',left, no'
          expect(
            domain_intersection(fixt_numdom_solved(i), fixt_numdom_solved(SUP))
          ).toBe(fixt_dom_empty());
          // 'i=' + i + ',right,no'
          expect(
            domain_intersection(fixt_numdom_solved(SUP), fixt_numdom_solved(i))
          ).toBe(fixt_dom_empty());
        }
      });

      test('should work with two numdoms, one solved', () => {
        // SUP left
        expect(
          domain_intersection(fixt_numdom_solved(SUP), fixt_numdom_nums(0, 1))
        ).toBe(fixt_dom_empty());
        // SUP right
        expect(
          domain_intersection(fixt_numdom_nums(0, 1), fixt_numdom_solved(SUP))
        ).toBe(fixt_dom_empty());

        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          // 'i=' + i + ',left'
          expect(
            domain_intersection(
              fixt_numdom_solved(i),
              fixt_numdom_nums(0, 1, i)
            )
          ).toBe(fixt_numdom_solved(i));
          // 'i=' + i + ',right'
          expect(
            domain_intersection(
              fixt_numdom_nums(0, 1, i),
              fixt_numdom_solved(i)
            )
          ).toBe(fixt_numdom_solved(i));
        }
      });

      test('should work with solved numdom and strdom', () => {
        let nums = [0, 1, 10, 100, 1000, SUP - 1, SUP];
        for (let i = 0; i < nums.length; ++i) {
          let n = nums[i];
          // check all values in nums left and right
          // 'i=' + n + ',left'
          expect(
            domain_intersection(
              fixt_numdom_solved(n),
              fixt_strdom_range(0, SUP)
            )
          ).toBe(fixt_numdom_solved(n));
          // 'i=' + n + ',left'
          expect(
            domain_intersection(
              fixt_strdom_range(0, SUP),
              fixt_numdom_solved(n)
            )
          ).toBe(fixt_numdom_solved(n));
          // check fixt_dom_empty() when strdom does not contain the needle
          // 'i=' + n + ',left'
          expect(
            domain_intersection(
              fixt_numdom_solved(n),
              fixt_strdom_nums(...nums.filter(x => x !== n))
            )
          ).toBe(fixt_dom_empty());
          // 'i=' + n + ',left'
          expect(
            domain_intersection(
              fixt_strdom_nums(...nums.filter(x => x !== n)),
              fixt_numdom_solved(n)
            )
          ).toBe(fixt_dom_empty());
        }
      });
    });
  });

  describe('domain_closeGapsStr', () => {
    test('should exist', () => {
      expect(typeof domain_str_closeGaps).toBe('function');
    });

    test('should requires two domains', () => {
      expect(() => {
        domain_str_closeGaps();
      }).toThrowError('ONLY_STRDOM');
      expect(() =>
        domain_str_closeGaps(fixt_strdom_empty(), undefined)
      ).toThrowError('ONLY_STRDOM');
      expect(() =>
        domain_str_closeGaps(undefined, fixt_strdom_empty())
      ).toThrowError('ONLY_STRDOM');
    });

    test('should accept EMPTY_STR domains', () => {
      expect(
        domain_str_closeGaps(fixt_strdom_empty(), fixt_strdom_empty())
      ).toEqual([fixt_strdom_empty(), fixt_strdom_empty()]);
    });

    test('should not change anything if left domain is empty', () => {
      let a = fixt_strdom_empty();
      let b = fixt_strdom_ranges(
        [10, 23],
        [29, 38],
        [49, 49],
        [54, 68],
        [77, 78],
        [84, 100]
      );

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], a);
      fixt_assertStrings(r[1], b);
      expect(r).toEqual([a, b]);
    });

    test('should not change anything if right domain is empty', () => {
      let a = fixt_strdom_ranges(
        [10, 23],
        [29, 38],
        [49, 49],
        [54, 68],
        [77, 78],
        [84, 100]
      );
      let b = fixt_strdom_empty();

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], a);
      fixt_assertStrings(r[1], b);
      expect(r).toEqual([a, b]);
    });

    test('should close gaps in right domain of len of only range in left domain', () => {
      let a = fixt_strdom_range(10, 20); // note: len is 11 because ranges are inclusive
      let b = fixt_strdom_ranges(
        [100, 110],
        [120, 200],
        [300, 310],
        [321, 400]
      ); // both gaps should be closed
      let c = fixt_strdom_range(10, 20);
      let d = fixt_strdom_ranges([100, 200], [300, 400]);

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], c);
      fixt_assertStrings(r[1], d);
      expect(r).toEqual([c, d]);
    });

    test('should not close bigger gaps', () => {
      let a = fixt_strdom_range(10, 20); // note: len is 11 because ranges are inclusive
      let b = fixt_strdom_ranges([300, 310], [322, 400]); // gap is 12
      let c = fixt_strdom_range(10, 20);
      let d = fixt_strdom_ranges([300, 310], [322, 400]);

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], c);
      fixt_assertStrings(r[1], d);
      expect(r).toEqual([c, d]);
    });

    test('should close gaps in left domain of len of only range in right domain', () => {
      let a = fixt_strdom_ranges(
        [100, 110],
        [120, 200],
        [300, 310],
        [321, 400]
      ); // both gaps should be closed
      let b = fixt_strdom_range(10, 20); // note: len is 11 because ranges are inclusive
      let c = fixt_strdom_ranges([100, 200], [300, 400]);
      let d = fixt_strdom_range(10, 20);

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], c);
      fixt_assertStrings(r[1], d);
      expect(r).toEqual([c, d]);
    });

    test('should close only gaps that are big enough', () => {
      // left spans 11, right spans 12. only left gets closed because
      // b's len = 10 and there are no 1-place gaps allowed in csis
      // (so max gap to close is 11)
      let a = fixt_strdom_ranges(
        [100, 110],
        [120, 200],
        [300, 310],
        [321, 400]
      );
      let b = fixt_strdom_range(10, 19); // len 10
      let c = fixt_strdom_ranges([100, 200], [300, 310], [321, 400]);
      let d = fixt_strdom_range(10, 19);

      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], c);
      fixt_assertStrings(r[1], d);
      expect(r).toEqual([c, d]);
    });

    test('should revisit domains after one (double) cycle if min size grew', () => {
      let a = fixt_strdom_ranges([1, 2], [4, 5], [8, 900]);
      let b = fixt_strdom_ranges([1, 2], [4, 5], [8, 900]);
      let c = fixt_strdom_range(1, 900);
      let d = fixt_strdom_range(1, 900);

      // first min size is 2, so 1~2..4~5 is closed but not 4~5-8~900,
      // then min size becomes 5 and 1~5..8~900 is closed.
      // (that holds both ways) so we end up with 1~900
      let r = domain_str_closeGaps(a, b);
      fixt_assertStrings(r[0], c);
      fixt_assertStrings(r[1], d);
      expect(r).toEqual([c, d]);
    });
  });

  describe('size', () => {
    test('should exist', () => {
      expect(typeof domain_size).toBe('function');
    });

    test('should require a domain', () => {
      expect(_ => {
        domain_size();
      }).toThrowError('ONLY_NORDOM');
    });

    test('should work with empty domains', () => {
      expect(domain_size(fixt_numdom_empty())).toBe(0);
    });

    test('should throw for empty strdoms', () => {
      expect(_ => {
        domain_size(fixt_strdom_empty());
      }).toThrowError('empty domains are always numdoms');
    });

    describe('arrdom', () => {
      test('should count the values', () => {
        expect(
          domain_size(fixt_strdom_ranges([0, 1], [4, 12], [115, 117]))
        ).toBe(14);
      });
    });

    describe('numdom', () => {
      test('should count the bits', () => {
        expect(domain_size(fixt_numdom_nums(2, 5, 7, 9, 11, 12))).toBe(6);
      });

      test('should count single values for each valid value', () => {
        expect(domain_size(fixt_numdom_nums(0))).toBe(1);
        expect(domain_size(fixt_numdom_nums(1))).toBe(1);
        expect(domain_size(fixt_numdom_nums(2))).toBe(1);
        expect(domain_size(fixt_numdom_nums(3))).toBe(1);
        expect(domain_size(fixt_numdom_nums(4))).toBe(1);
        expect(domain_size(fixt_numdom_nums(5))).toBe(1);
        expect(domain_size(fixt_numdom_nums(6))).toBe(1);
        expect(domain_size(fixt_numdom_nums(7))).toBe(1);
        expect(domain_size(fixt_numdom_nums(8))).toBe(1);
        expect(domain_size(fixt_numdom_nums(9))).toBe(1);
        expect(domain_size(fixt_numdom_nums(10))).toBe(1);
        expect(domain_size(fixt_numdom_nums(11))).toBe(1);
        expect(domain_size(fixt_numdom_nums(12))).toBe(1);
        expect(domain_size(fixt_numdom_nums(13))).toBe(1);
        expect(domain_size(fixt_numdom_nums(14))).toBe(1);
        expect(domain_size(fixt_numdom_nums(15))).toBe(1);
      });

      test('should count entire range', () => {
        expect(domain_size(fixt_numdom_range(0, 15))).toBe(16);
      });
    });

    describe('solved numdom', () => {
      test('should always be size=1', () => {
        let nums = [0, 1, 10, 100, 1000, SUP - 1, SUP];
        for (let i = 0; i < nums.length; ++i) {
          let n = nums[i];
          // 'n=' + n
          expect(domain_size(fixt_numdom_solved(n))).toBe(1);
        }
      });
    });
  });

  describe('domain_mul', () => {
    test('should exist', () => {
      expect(typeof domain_mul).toBe('function');
    });

    test('should require domains', () => {
      expect(() => {
        domain_mul();
      }).toThrowError('ONLY_NORDOM');
      expect(() => {
        domain_mul(fixt_strdom_empty());
      }).toThrowError('empty domains are always numdoms');
      expect(() => {
        domain_mul(null, fixt_strdom_empty());
      }).toThrowError('ONLY_NORDOM');
    });

    test('should accept empty domains', () => {
      expect(domain_mul(fixt_numdom_empty(), fixt_numdom_empty())).toEqual(
        fixt_numdom_empty()
      );
      expect(domain_mul(fixt_numdom_empty(), fixt_strdom_nums(50, 60))).toEqual(
        fixt_numdom_empty()
      );
      expect(domain_mul(fixt_strdom_nums(0, 1), fixt_numdom_empty())).toEqual(
        fixt_numdom_empty()
      );
    });

    test('should return empty domain if one is empty', () => {
      let a = fixt_numdom_nums(0, 1, 4, 5, 7, 8, 10, 11, 12, 15, 16, 17);
      expect(domain_mul(a, fixt_numdom_empty())).toEqual(fixt_numdom_empty());
      expect(domain_mul(fixt_numdom_empty(), a)).toEqual(fixt_numdom_empty());
    });

    test('should multiply two anydoms', () => {
      let A = fixt_numdom_range(5, 10);
      let B = fixt_strdom_range(50, 60);
      let E = fixt_strdom_range(250, 600);

      expect(domain_mul(A, B)).toEqual(E);
      expect(domain_mul(B, A)).toEqual(E);
    });

    test('should multiply two strdoms', () => {
      let A = fixt_strdom_ranges([5, 10], [20, 35]);
      let B = fixt_strdom_ranges([50, 60], [110, 128]);
      let E = fixt_strdom_ranges([250, 2100], [2200, 4480]);

      expect(domain_mul(A, B)).toEqual(E);
      expect(domain_mul(B, A)).toEqual(E);
    });

    test('should multiply two numdoms', () => {
      let A = fixt_numdom_nums(0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let B = fixt_numdom_nums(0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let E = fixt_strdom_ranges([0, 204], [225, 289]);

      expect(domain_mul(A, B)).toEqual(E);
      expect(domain_mul(B, A)).toEqual(E);
    });
  });

  describe('domain_divby', () => {
    test('should exist', () => {
      expect(typeof domain_divby).toBe('function');
      expect(typeof SUP).toBe('number');
    });

    test('should require domains', () => {
      expect(() => {
        domain_divby();
      }).toThrowError('ONLY_NORDOM');
      expect(() => {
        domain_divby(fixt_numdom_empty());
      }).toThrowError('ONLY_NORDOM');
      expect(() => {
        domain_divby(null, fixt_numdom_empty());
      }).toThrowError('ONLY_NORDOM');
    });

    test('should accept empty domains', () => {
      expect(domain_divby(fixt_numdom_empty(), fixt_numdom_empty())).toEqual(
        fixt_numdom_empty()
      );
    });

    test('should accept empty domains', () => {
      expect(domain_divby(fixt_numdom_empty(), fixt_numdom_empty())).toEqual(
        fixt_numdom_empty()
      );
    });

    test('should return empty domain if one is empty', () => {
      let A = fixt_strdom_ranges([0, 1], [4, 5], [7, 8], [10, 12], [15, 117]);

      expect(domain_divby(A.slice(0), fixt_numdom_empty())).toEqual(
        fixt_numdom_empty()
      );
      expect(domain_divby(fixt_numdom_empty(), A.slice(0))).toEqual(
        fixt_numdom_empty()
      );
    });

    test('should divide one range from another', () => {
      let A = fixt_strdom_range(500, 600);
      let B = fixt_strdom_range(5, 10);
      let E = fixt_strdom_range(50, 120);

      fixt_assertStrings(domain_divby(A, B), E);
    });

    test('should return a numdom if result is small enough', () => {
      let A = fixt_strdom_range(50, 60);
      let B = fixt_strdom_range(5, 10);
      let E = fixt_numdom_range(5, 12);

      expect(domain_divby(A, B)).toEqual(E);
    });

    test('should divide one domain from another; floored', () => {
      let A = fixt_strdom_ranges([5, 10], [20, 35]);
      let B = fixt_strdom_ranges([50, 60], [110, 128]);
      let E = fixt_numdom_solved(0);

      expect(domain_divby(A, B, FLOOR_FRACTIONS)).toEqual(E); // would be [0.0390625, 0.7] which gets floored to [0, 0.7] so [0,0]
    });

    test('should divide one domain from another (2); floored', () => {
      let A = fixt_numdom_nums(1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let B = fixt_numdom_nums(1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let E = fixt_numdom_nums(
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        15,
        16,
        17
      );

      expect(domain_divby(A, B, FLOOR_FRACTIONS)).toEqual(E);
    });

    test('should divide one domain from another; integer', () => {
      let A = fixt_strdom_ranges([5, 10], [20, 35]);
      let B = fixt_strdom_ranges([50, 60], [110, 128]);
      let E = fixt_numdom_empty();

      expect(domain_divby(A, B, CEIL_FRACTIONS)).toEqual(E); // would be [0.0390625, 0.7] but there are no ints in between that so its empty
    });

    test('should divide one domain from another (2); integer', () => {
      let A = fixt_numdom_nums(1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let B = fixt_numdom_nums(1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17);
      let E = fixt_numdom_nums(
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        15,
        16,
        17
      );

      expect(domain_divby(A, B, CEIL_FRACTIONS)).toEqual(E);
    });

    test('divide by zero should blow up', () => {
      let A = fixt_strdom_ranges([0, 1], [4, 12], [15, 117]);
      let B = fixt_strdom_ranges([0, 1], [4, 12], [15, 117]);
      let E = fixt_strdom_ranges([0, SUP]);

      fixt_assertStrings(domain_divby(A, B), E);
    });

    describe('simple examples with strdom result', () => {
      function doit(a, b, c) {
        test(`should pass [${a}] / [${b}] = [${c}]`, () => {
          a = domain_arrToSmallest(a);
          b = domain_arrToSmallest(b);
          c = domain_arrToSmallest(c);

          fixt_domainEql(domain_divby(a, b), c);
        });
      }

      doit([5, 10], [0, 1], [5, SUP]);
      doit([5000, 5000], [10, 10], [500, 500]);
      doit([SUP, SUP], [10, 10], [SUP / 10, SUP / 10]);
    });

    describe('simple examples with numdom result', () => {
      function doit(a, b, c) {
        test(`should pass [${a}] / [${b}] = [${c}]`, () => {
          a = domain_arrToSmallest(a);
          b = domain_arrToSmallest(b);
          c = domain_arrToSmallest(c);

          expect(domain_divby(a, b)).toEqual(c);
        });
      }

      doit([50, 60], [5, 5], [10, 12]);
      doit([50, 50, 60, 60], [5, 5], [10, 10, 12, 12]);
      doit([50, 60], [5, 5, 10, 10], [5, 6, 10, 12]);
      doit([50, 60], [5, 10], [5, 12]);
      doit([0, 0], [5, 10], [0, 0]);
      doit([0, 1], [5, 10], [0, 0]); // because all results are <1
      doit([0, 10], [2, 2], [0, 5]);
      doit([5, 10], [0, 0], []);
    });
  });

  describe('domain_isSolved', () => {
    test('should exist', () => {
      expect(typeof domain_isSolved).toBe('function');
    });

    describe('strdom', () => {
      test('should throw for solved strdoms', () => {
        expect(_ => {
          domain_isSolved(fixt_strdom_value(SUP));
        }).toThrowError('EXPECTING_STRDOM_NOT_TO_BE_SOLVED');
        expect(_ => {
          domain_isSolved(fixt_strdom_value(SUP - 1));
        }).toThrowError('EXPECTING_STRDOM_NOT_TO_BE_SOLVED');
        expect(_ => {
          domain_isSolved(fixt_strdom_value(SUP - 18));
        }).toThrowError('EXPECTING_STRDOM_NOT_TO_BE_SOLVED');
      });

      test('should return false if a domain is empty', () => {
        expect(domain_isSolved(fixt_numdom_empty())).toBe(false);
      });

      test('should return false if a domain covers more than one value', () => {
        expect(domain_isSolved(fixt_strdom_range(90, 91))).toBe(false);
        expect(domain_isSolved(fixt_strdom_range(918, 920))).toBe(false);
        expect(domain_isSolved(fixt_strdom_range(SUP - 50, SUP))).toBe(false);
        expect(
          domain_isSolved(
            fixt_strdom_ranges([SUP - 10, SUP - 5], [SUP - 1, SUP])
          )
        ).toBe(false);
        expect(domain_isSolved(fixt_strdom_ranges([0, 1], [5, SUP]))).toBe(
          false
        );
        expect(domain_isSolved(fixt_strdom_ranges([5, 8], [50, SUP]))).toBe(
          false
        );
        expect(
          domain_isSolved(fixt_strdom_ranges([5, 8], [23, 34], [50, SUP]))
        ).toBe(false);
      });
    });

    describe('numdom', () => {
      test('should reject numdoms that are actually soldoms', () => {
        for (let i = 0; i <= SMALL_MAX_NUM; ++i) {
          expect(_ => {
            domain_isSolved(fixt_numdom_nums(i));
          }).toThrowError('EXPECTING_SOLVED_NUMDOM_TO_BE_SOLDOM');
        }
      });

      test('should see double values', () => {
        expect(domain_isSolved(fixt_numdom_nums(0, 1))).toBe(false);
        expect(domain_isSolved(fixt_numdom_nums(0, 10))).toBe(false);
        expect(domain_isSolved(fixt_numdom_nums(0, 15))).toBe(false);
        expect(domain_isSolved(fixt_numdom_nums(10, 15))).toBe(false);
        expect(domain_isSolved(fixt_numdom_nums(4, 6))).toBe(false);
      });

      test('should see multiple values', () => {
        expect(domain_isSolved(fixt_numdom_nums(2, 5, 7, 9, 11, 12))).toBe(
          false
        );
      });

      test('should return false for entire range', () => {
        expect(domain_isSolved(fixt_numdom_range(0, 15))).toBe(false);
      });

      test('should return false for empty', () => {
        expect(domain_isSolved(fixt_numdom_empty())).toBe(false);
      });
    });
  });

  describe('domain_sortByRange', () => {
    test('should exist', () => {
      expect(typeof _domain_str_quickSortRanges).toBe('function');
    });

    test('should allow EMPTY_STR domains', () => {
      expect(_domain_str_quickSortRanges(fixt_strdom_empty())).toEqual(
        fixt_strdom_empty()
      );
    });

    test('should return the sorted strdom', () => {
      expect(_domain_str_quickSortRanges(fixt_strdom_range(0, 1))).toBe(
        fixt_strdom_range(0, 1)
      );
    });

    test('should keep pairs sorted', () => {
      expect(
        _domain_str_quickSortRanges(fixt_strdom_ranges([0, 1], [2, 3]))
      ).toEqual(fixt_strdom_ranges([0, 1], [2, 3]));
    });

    test('should sort range pairs by lo', () => {
      expect(
        _domain_str_quickSortRanges(fixt_strdom_ranges([2, 3], [0, 1]))
      ).toEqual(fixt_strdom_ranges([0, 1], [2, 3]));
    });

    test('should sort range pairs by hi if lo is equal', () => {
      expect(
        _domain_str_quickSortRanges(fixt_strdom_ranges([2, 3], [2, 1]))
      ).toEqual(fixt_strdom_ranges([2, 1], [2, 3]));
    });

    test('should not change domain if already sorted even when lo is equal', () => {
      expect(
        _domain_str_quickSortRanges(fixt_strdom_ranges([2, 3], [2, 6]))
      ).toEqual(fixt_strdom_ranges([2, 3], [2, 6]));
    });

    test('should accept solved domains', () => {
      expect(_domain_str_quickSortRanges(fixt_strdom_ranges([50, 50]))).toEqual(
        fixt_strdom_ranges([50, 50])
      );
    });

    test('should allow single value ranges', () => {
      expect(
        _domain_str_quickSortRanges(fixt_strdom_ranges([0, 1], [5, 10], [3, 3]))
      ).toEqual(fixt_strdom_ranges([0, 1], [3, 3], [5, 10]));
    });

    test('should work with 4 ranges', () => {
      expect(
        _domain_str_quickSortRanges(
          fixt_strdom_ranges([20, 30], [0, 1], [5, 10], [3, 3])
        )
      ).toEqual(fixt_strdom_ranges([0, 1], [3, 3], [5, 10], [20, 30]));
    });

    test('should work with 5 ranges', () => {
      expect(
        _domain_str_quickSortRanges(
          fixt_strdom_ranges([20, 30], [0, 1], [18, 19], [5, 10], [3, 3])
        )
      ).toEqual(
        fixt_strdom_ranges([0, 1], [3, 3], [5, 10], [18, 19], [20, 30])
      );
    });

    test('should work with 50 ranges', () => {
      // arr = []
      // for i in [0...50]
      //   arr.push (x=Mathf.floor(Math.random() * 100)), x + Math.floor(Math.random() * 100)

      let arr = [
        61,
        104,
        78,
        130,
        6,
        92,
        34,
        51,
        86,
        109,
        0,
        32,
        39,
        62,
        91,
        96,
        49,
        134,
        91,
        163,
        42,
        105,
        22,
        78,
        78,
        133,
        13,
        111,
        49,
        141,
        41,
        134,
        34,
        57,
        19,
        27,
        25,
        64,
        18,
        75,
        75,
        151,
        88,
        127,
        30,
        74,
        11,
        59,
        84,
        107,
        54,
        91,
        3,
        85,
        97,
        167,
        55,
        103,
        81,
        174,
        32,
        55,
        28,
        87,
        42,
        69,
        31,
        118,
        99,
        137,
        12,
        94,
        31,
        98,
        69,
        162,
        52,
        89,
        85,
        126,
        93,
        160,
        20,
        53,
        82,
        88,
        8,
        46,
        29,
        75,
        97,
        146,
        13,
        35,
        51,
        125,
        5,
        18,
        88,
        178,
      ];
      let out = [
        0,
        32,
        3,
        85,
        5,
        18,
        6,
        92,
        8,
        46,
        11,
        59,
        12,
        94,
        13,
        35,
        13,
        111,
        18,
        75,
        19,
        27,
        20,
        53,
        22,
        78,
        25,
        64,
        28,
        87,
        29,
        75,
        30,
        74,
        31,
        98,
        31,
        118,
        32,
        55,
        34,
        51,
        34,
        57,
        39,
        62,
        41,
        134,
        42,
        69,
        42,
        105,
        49,
        134,
        49,
        141,
        51,
        125,
        52,
        89,
        54,
        91,
        55,
        103,
        61,
        104,
        69,
        162,
        75,
        151,
        78,
        130,
        78,
        133,
        81,
        174,
        82,
        88,
        84,
        107,
        85,
        126,
        86,
        109,
        88,
        127,
        88,
        178,
        91,
        96,
        91,
        163,
        93,
        160,
        97,
        146,
        97,
        167,
        99,
        137,
      ];

      expect(_domain_str_quickSortRanges(domain_arrToSmallest(arr))).toEqual(
        domain_arrToSmallest(out)
      );
    });

    test('should work with 51 ranges', () => {
      let arr = [
        4,
        13,
        67,
        101,
        38,
        70,
        99,
        144,
        65,
        126,
        45,
        110,
        86,
        183,
        73,
        134,
        84,
        112,
        64,
        83,
        63,
        90,
        18,
        64,
        52,
        116,
        87,
        134,
        35,
        125,
        13,
        94,
        23,
        30,
        97,
        117,
        64,
        82,
        77,
        134,
        61,
        72,
        63,
        76,
        38,
        111,
        33,
        96,
        5,
        98,
        5,
        50,
        52,
        121,
        18,
        30,
        70,
        155,
        8,
        56,
        4,
        15,
        21,
        98,
        95,
        166,
        83,
        148,
        33,
        62,
        0,
        72,
        57,
        107,
        60,
        133,
        66,
        163,
        48,
        130,
        90,
        163,
        56,
        123,
        14,
        26,
        90,
        92,
        9,
        64,
        4,
        4,
        17,
        22,
        9,
        78,
        25,
        66,
        87,
        95,
        64,
        145,
      ];
      let out = [
        0,
        72,
        4,
        4,
        4,
        13,
        4,
        15,
        5,
        50,
        5,
        98,
        8,
        56,
        9,
        64,
        9,
        78,
        13,
        94,
        14,
        26,
        17,
        22,
        18,
        30,
        18,
        64,
        21,
        98,
        23,
        30,
        25,
        66,
        33,
        62,
        33,
        96,
        35,
        125,
        38,
        70,
        38,
        111,
        45,
        110,
        48,
        130,
        52,
        116,
        52,
        121,
        56,
        123,
        57,
        107,
        60,
        133,
        61,
        72,
        63,
        76,
        63,
        90,
        64,
        82,
        64,
        83,
        64,
        145,
        65,
        126,
        66,
        163,
        67,
        101,
        70,
        155,
        73,
        134,
        77,
        134,
        83,
        148,
        84,
        112,
        86,
        183,
        87,
        95,
        87,
        134,
        90,
        92,
        90,
        163,
        95,
        166,
        97,
        117,
        99,
        144,
      ];

      expect(_domain_str_quickSortRanges(domain_arrToSmallest(arr))).toEqual(
        domain_arrToSmallest(out)
      );
    });

    test('should work with 250 ranges', () => {
      // this should be very fast.

      let arr = [
        56,
        103,
        54,
        76,
        81,
        144,
        30,
        103,
        38,
        50,
        3,
        25,
        37,
        80,
        2,
        44,
        67,
        82,
        80,
        88,
        37,
        67,
        25,
        76,
        47,
        105,
        16,
        97,
        46,
        78,
        21,
        111,
        14,
        113,
        47,
        84,
        55,
        63,
        15,
        19,
        54,
        75,
        40,
        57,
        34,
        85,
        62,
        71,
        16,
        52,
        70,
        152,
        1,
        42,
        86,
        126,
        97,
        109,
        9,
        38,
        91,
        140,
        27,
        48,
        54,
        115,
        3,
        18,
        1,
        35,
        17,
        66,
        38,
        65,
        33,
        123,
        7,
        70,
        68,
        150,
        64,
        86,
        77,
        167,
        73,
        159,
        0,
        97,
        76,
        155,
        2,
        50,
        48,
        116,
        52,
        136,
        31,
        43,
        65,
        163,
        20,
        41,
        70,
        146,
        83,
        120,
        79,
        135,
        9,
        98,
        16,
        67,
        55,
        144,
        0,
        26,
        70,
        97,
        9,
        67,
        39,
        98,
        14,
        102,
        67,
        89,
        44,
        140,
        97,
        132,
        90,
        99,
        61,
        108,
        71,
        126,
        31,
        72,
        17,
        26,
        98,
        162,
        32,
        125,
        51,
        115,
        96,
        176,
        39,
        83,
        77,
        147,
        20,
        24,
        18,
        26,
        12,
        17,
        45,
        110,
        57,
        74,
        28,
        49,
        7,
        11,
        32,
        43,
        43,
        50,
        5,
        70,
        42,
        139,
        81,
        83,
        20,
        33,
        77,
        107,
        52,
        101,
        36,
        78,
        49,
        74,
        90,
        118,
        36,
        74,
        4,
        87,
        62,
        109,
        15,
        60,
        11,
        34,
        85,
        184,
        27,
        115,
        2,
        52,
        37,
        102,
        40,
        132,
        87,
        117,
        94,
        163,
        48,
        70,
        50,
        139,
        97,
        137,
        31,
        31,
        42,
        78,
        28,
        29,
        70,
        147,
        8,
        87,
        87,
        140,
        59,
        142,
        43,
        110,
        3,
        76,
        39,
        59,
        57,
        137,
        54,
        128,
        72,
        82,
        66,
        81,
        30,
        39,
        69,
        122,
        5,
        102,
        81,
        170,
        94,
        102,
        25,
        31,
        95,
        190,
        66,
        107,
        1,
        48,
        54,
        81,
        60,
        117,
        2,
        69,
        31,
        42,
        90,
        92,
        13,
        37,
        58,
        94,
        83,
        160,
        96,
        145,
        59,
        80,
        27,
        35,
        60,
        71,
        57,
        102,
        93,
        115,
        43,
        106,
        62,
        72,
        74,
        131,
        93,
        101,
        32,
        51,
        80,
        139,
        17,
        87,
        9,
        11,
        2,
        71,
        57,
        59,
        38,
        71,
        81,
        153,
        59,
        136,
        65,
        94,
        23,
        106,
        77,
        139,
        1,
        91,
        27,
        44,
        96,
        173,
        56,
        139,
        44,
        119,
        85,
        132,
        26,
        33,
        63,
        80,
        73,
        125,
        69,
        98,
        6,
        34,
        27,
        53,
        74,
        160,
        46,
        108,
        88,
        174,
        97,
        154,
        7,
        90,
        89,
        133,
        1,
        46,
        76,
        161,
        85,
        110,
        31,
        100,
        97,
        164,
        66,
        93,
        71,
        156,
        1,
        70,
        99,
        123,
        84,
        126,
        2,
        17,
        65,
        163,
        68,
        102,
        5,
        71,
        95,
        97,
        28,
        49,
        34,
        62,
        22,
        47,
        76,
        145,
        0,
        65,
        38,
        117,
        95,
        161,
        46,
        105,
        93,
        130,
        48,
        48,
        90,
        180,
        67,
        115,
        21,
        54,
        18,
        111,
        98,
        107,
        12,
        38,
        0,
        92,
        7,
        66,
        25,
        57,
        29,
        65,
        9,
        81,
        5,
        14,
        3,
        40,
        6,
        102,
        65,
        92,
        17,
        101,
        11,
        98,
        55,
        110,
        85,
        168,
        51,
        90,
        38,
        99,
        75,
        143,
        84,
        139,
        85,
        114,
        41,
        59,
        9,
        55,
        77,
        166,
        25,
        107,
        40,
        125,
        72,
        160,
        53,
        90,
        0,
        50,
        28,
        28,
        51,
        140,
        3,
        24,
        85,
        154,
        30,
        42,
        62,
        106,
        46,
        89,
        4,
        65,
        45,
        62,
        92,
        175,
        23,
        51,
        32,
        100,
        37,
        102,
      ];
      let out = [
        0,
        26,
        0,
        50,
        0,
        65,
        0,
        92,
        0,
        97,
        1,
        35,
        1,
        42,
        1,
        46,
        1,
        48,
        1,
        70,
        1,
        91,
        2,
        17,
        2,
        44,
        2,
        50,
        2,
        52,
        2,
        69,
        2,
        71,
        3,
        18,
        3,
        24,
        3,
        25,
        3,
        40,
        3,
        76,
        4,
        65,
        4,
        87,
        5,
        14,
        5,
        70,
        5,
        71,
        5,
        102,
        6,
        34,
        6,
        102,
        7,
        11,
        7,
        66,
        7,
        70,
        7,
        90,
        8,
        87,
        9,
        11,
        9,
        38,
        9,
        55,
        9,
        67,
        9,
        81,
        9,
        98,
        11,
        34,
        11,
        98,
        12,
        17,
        12,
        38,
        13,
        37,
        14,
        102,
        14,
        113,
        15,
        19,
        15,
        60,
        16,
        52,
        16,
        67,
        16,
        97,
        17,
        26,
        17,
        66,
        17,
        87,
        17,
        101,
        18,
        26,
        18,
        111,
        20,
        24,
        20,
        33,
        20,
        41,
        21,
        54,
        21,
        111,
        22,
        47,
        23,
        51,
        23,
        106,
        25,
        31,
        25,
        57,
        25,
        76,
        25,
        107,
        26,
        33,
        27,
        35,
        27,
        44,
        27,
        48,
        27,
        53,
        27,
        115,
        28,
        28,
        28,
        29,
        28,
        49,
        28,
        49,
        29,
        65,
        30,
        39,
        30,
        42,
        30,
        103,
        31,
        31,
        31,
        42,
        31,
        43,
        31,
        72,
        31,
        100,
        32,
        43,
        32,
        51,
        32,
        100,
        32,
        125,
        33,
        123,
        34,
        62,
        34,
        85,
        36,
        74,
        36,
        78,
        37,
        67,
        37,
        80,
        37,
        102,
        37,
        102,
        38,
        50,
        38,
        65,
        38,
        71,
        38,
        99,
        38,
        117,
        39,
        59,
        39,
        83,
        39,
        98,
        40,
        57,
        40,
        125,
        40,
        132,
        41,
        59,
        42,
        78,
        42,
        139,
        43,
        50,
        43,
        106,
        43,
        110,
        44,
        119,
        44,
        140,
        45,
        62,
        45,
        110,
        46,
        78,
        46,
        89,
        46,
        105,
        46,
        108,
        47,
        84,
        47,
        105,
        48,
        48,
        48,
        70,
        48,
        116,
        49,
        74,
        50,
        139,
        51,
        90,
        51,
        115,
        51,
        140,
        52,
        101,
        52,
        136,
        53,
        90,
        54,
        75,
        54,
        76,
        54,
        81,
        54,
        115,
        54,
        128,
        55,
        63,
        55,
        110,
        55,
        144,
        56,
        103,
        56,
        139,
        57,
        59,
        57,
        74,
        57,
        102,
        57,
        137,
        58,
        94,
        59,
        80,
        59,
        136,
        59,
        142,
        60,
        71,
        60,
        117,
        61,
        108,
        62,
        71,
        62,
        72,
        62,
        106,
        62,
        109,
        63,
        80,
        64,
        86,
        65,
        92,
        65,
        94,
        65,
        163,
        65,
        163,
        66,
        81,
        66,
        93,
        66,
        107,
        67,
        82,
        67,
        89,
        67,
        115,
        68,
        102,
        68,
        150,
        69,
        98,
        69,
        122,
        70,
        97,
        70,
        146,
        70,
        147,
        70,
        152,
        71,
        126,
        71,
        156,
        72,
        82,
        72,
        160,
        73,
        125,
        73,
        159,
        74,
        131,
        74,
        160,
        75,
        143,
        76,
        145,
        76,
        155,
        76,
        161,
        77,
        107,
        77,
        139,
        77,
        147,
        77,
        166,
        77,
        167,
        79,
        135,
        80,
        88,
        80,
        139,
        81,
        83,
        81,
        144,
        81,
        153,
        81,
        170,
        83,
        120,
        83,
        160,
        84,
        126,
        84,
        139,
        85,
        110,
        85,
        114,
        85,
        132,
        85,
        154,
        85,
        168,
        85,
        184,
        86,
        126,
        87,
        117,
        87,
        140,
        88,
        174,
        89,
        133,
        90,
        92,
        90,
        99,
        90,
        118,
        90,
        180,
        91,
        140,
        92,
        175,
        93,
        101,
        93,
        115,
        93,
        130,
        94,
        102,
        94,
        163,
        95,
        97,
        95,
        161,
        95,
        190,
        96,
        145,
        96,
        173,
        96,
        176,
        97,
        109,
        97,
        132,
        97,
        137,
        97,
        154,
        97,
        164,
        98,
        107,
        98,
        162,
        99,
        123,
      ];

      expect(_domain_str_quickSortRanges(domain_arrToSmallest(arr))).toEqual(
        domain_arrToSmallest(out)
      );
    });
  });

  describe('domain_removeGte', () => {
    test('should exist', () => {
      expect(typeof domain_removeGte).toBe('function');
    });

    test('should accept an empty domain', () => {
      expect(domain_removeGte(fixt_numdom_empty(), 5)).toEqual(
        fixt_numdom_empty()
      );
    });

    // case: v=5
    // 012 456 => 012 4
    // 012 45  => 012 4
    // 012 567 => 012
    // 012 5   => 012
    // 012 678 => 012
    // 5       => empty
    // 012     => NONE
    // 678     => empty

    describe('strdom', () => {
      function gteTest(domain, value, expected) {
        test(`should gte ${domain__debug(
          domain
        )} >= ${value} -> ${domain__debug(expected)}`, () => {
          let clone = fixt_dom_clone(domain);
          let result = domain_removeGte(domain, value);

          expect(result).toEqual(expected);
          expect(domain).toEqual(clone);
        });
      }

      gteTest(
        fixt_strdom_ranges([100, 110]),
        105,
        fixt_strdom_ranges([100, 104])
      );
      gteTest(
        fixt_strdom_ranges([100, 102], [104, 106]),
        105,
        fixt_strdom_ranges([100, 102], [104, 104])
      );
      gteTest(
        fixt_strdom_ranges([100, 102], [104, 105]),
        105,
        fixt_strdom_ranges([100, 102], [104, 104])
      );
      gteTest(
        fixt_strdom_ranges([100, 102], [105, 107]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      gteTest(
        fixt_strdom_ranges([100, 102], [105, 105]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      gteTest(
        fixt_strdom_ranges([100, 102], [106, 108]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      gteTest(fixt_strdom_ranges([105, 105]), 105, fixt_numdom_empty());
      gteTest(
        fixt_strdom_ranges([100, 102]),
        105,
        fixt_strdom_ranges([100, 102])
      );
      gteTest(fixt_strdom_ranges([106, 108]), 105, fixt_numdom_empty());
      gteTest(
        fixt_strdom_range(0, 1000),
        SMALL_MAX_NUM,
        fixt_numdom_range(0, SMALL_MAX_NUM - 1)
      );
      gteTest(
        fixt_strdom_range(0, 1000),
        SMALL_MAX_NUM + 1,
        fixt_numdom_range(0, SMALL_MAX_NUM)
      );
      gteTest(fixt_strdom_range(5, 50), 31, fixt_numdom_range(5, 30));
      gteTest(fixt_strdom_range(500, 501), 501, fixt_numdom_solved(500));
      gteTest(fixt_strdom_nums(500, 900), 900, fixt_numdom_solved(500));
      gteTest(fixt_strdom_nums(500, 900, 901), 900, fixt_numdom_solved(500));
    });

    describe('numdom', () => {
      function gteTest(domain, value, expected) {
        test(`should gte [${domain}] >= ${value} -> [${expected}]`, () => {
          let clone = fixt_dom_clone(domain);
          let result = domain_removeGte(domain, value);

          expect(result).toEqual(expected);
          expect(domain).toEqual(clone);
        });
      }

      gteTest(
        fixt_numdom_nums(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
        5,
        fixt_numdom_nums(0, 1, 2, 3, 4)
      );
      gteTest(
        fixt_numdom_nums(0, 1, 2, 4, 5, 6),
        5,
        fixt_numdom_nums(0, 1, 2, 4)
      );
      gteTest(fixt_numdom_nums(0, 1, 2, 4, 5), 5, fixt_numdom_nums(0, 1, 2, 4));
      gteTest(fixt_numdom_nums(0, 1, 2, 5, 6, 7), 5, fixt_numdom_nums(0, 1, 2));
      gteTest(fixt_numdom_nums(0, 1, 2, 5), 5, fixt_numdom_nums(0, 1, 2));
      gteTest(fixt_numdom_nums(0, 1, 2, 6, 7, 8), 5, fixt_numdom_nums(0, 1, 2));
      gteTest(fixt_numdom_nums(5), 5, fixt_numdom_empty());
      gteTest(fixt_numdom_nums(0, 1, 2), 5, fixt_numdom_nums(0, 1, 2));
      gteTest(fixt_numdom_nums(6, 7, 8), 5, fixt_numdom_empty());
      gteTest(fixt_numdom_nums(5, 6), 6, fixt_numdom_solved(5));
      gteTest(fixt_numdom_solved(20), 21, fixt_numdom_solved(20));
      gteTest(fixt_numdom_solved(10), 10, fixt_numdom_empty());

      test('should improve code coverage', () => {
        let numdom = fixt_numdom_range(0, 30);
        for (let i = 0; i <= 50; ++i) {
          let v = domain_removeGte(numdom, i);
          expect(typeof v).toBe('number');
        }
      });
    });

    describe('solved numdoms', () => {
      test('should work with solved domains', () => {
        let nums = [0, 1, 10, 100, 1000, SUP - 1, SUP];
        for (let i = 0; i < nums.length; ++i) {
          let n = nums[i];
          // check with needle being lt, eq, gt
          let lt = n - 1;
          let eq = n;
          let gt = n + 1;

          if (lt >= 0)
            // 'n=' + n + ',lt'
            expect(domain_removeGte(fixt_numdom_solved(n), lt)).toBe(
              fixt_dom_empty()
            );
          if (eq >= 0 && eq <= SUP)
            // 'n=' + n + ',eq'
            expect(domain_removeGte(fixt_numdom_solved(n), eq)).toBe(
              fixt_dom_empty()
            );
          if (gt <= SUP)
            // 'n=' + n + ',gt'
            expect(domain_removeGte(fixt_numdom_solved(n), gt)).toBe(
              fixt_numdom_solved(n)
            );
        }
      });
    });
  });

  describe('domain_removeGtUnsafe', () => {
    test('edge case 28,29 & 28', () => {
      expect(domain_removeGtUnsafe(domain_createRange(28, 29), 28)).toEqual(
        domain_createValue(28)
      );
    });

    test('edge case 29,30 & 29', () => {
      expect(domain_removeGtUnsafe(domain_createRange(29, 30), 29)).toEqual(
        domain_createValue(29)
      );
    });

    test('edge case 30,31 & 30', () => {
      expect(domain_removeGtUnsafe(domain_createRange(30, 31), 30)).toEqual(
        domain_createValue(30)
      );
    });

    test('edge case 31,32 & 31', () => {
      expect(domain_removeGtUnsafe(domain_createRange(31, 32), 31)).toEqual(
        domain_createValue(31)
      );
    });
  });

  describe('domain_toArr', () => {
    test('should exist', () => {
      expect(typeof domain_toArr).toBe('function');
    });

    test('should work with a bool', () => {
      expect(domain_toArr(fixt_strdom_range(0, 1))).toEqual(
        fixt_arrdom_range(0, 1)
      );
      expect(domain_toArr(fixt_numdom_nums(0, 1))).toEqual(
        fixt_arrdom_range(0, 1)
      );
      expect(domain_toArr(fixt_arrdom_range(0, 1))).toEqual(
        fixt_arrdom_range(0, 1)
      );
    });

    test('should clone the arr with param', () => {
      let A = fixt_arrdom_range(0, 1);

      expect(domain_toArr(A, true)).not.toBe(A);
      expect(domain_toArr(A, true)).toEqual(A);
      expect(domain_toArr(A, false)).toBe(A);
    });
  });

  describe('domain_removeLte', () => {
    test('should exist', () => {
      expect(typeof domain_removeLte).toBe('function');
    });

    test('should accept an empty domain', () => {
      expect(() => {
        domain_removeLte(fixt_numdom_empty(), 5);
      }).not.toThrowError();
    });

    // case: v=5
    // 456 89 => 6 89
    // 45  89 => 89
    // 567 9  => 67 9
    // 5   89 => 89
    // 5      => empty
    // 678    => NONE
    // 012    => empty

    describe('strdom', () => {
      function lteTest(domain, value, expected) {
        test(`should lte ${domain__debug(
          domain
        )} <= ${value} -> ${domain__debug(expected)}`, () => {
          let clone = fixt_dom_clone(domain);
          let result = domain_removeLte(domain, value);

          expect(result).toEqual(expected);
          expect(domain).toEqual(clone);
        });
      }

      lteTest(
        fixt_strdom_ranges([100, 110]),
        105,
        fixt_strdom_ranges([106, 110])
      );
      lteTest(
        fixt_strdom_ranges([104, 106], [108, 109]),
        105,
        fixt_strdom_ranges([106, 106], [108, 109])
      );
      lteTest(
        fixt_strdom_ranges([104, 105], [108, 109]),
        105,
        fixt_strdom_ranges([108, 109])
      );
      lteTest(
        fixt_strdom_ranges([105, 107], [109, 109]),
        105,
        fixt_strdom_ranges([106, 107], [109, 109])
      );
      lteTest(
        fixt_strdom_ranges([105, 105], [108, 109]),
        105,
        fixt_strdom_ranges([108, 109])
      );
      lteTest(fixt_strdom_ranges([105, 105]), 105, fixt_dom_empty());
      lteTest(
        fixt_strdom_ranges([106, 108]),
        105,
        fixt_strdom_ranges([106, 108])
      );
      lteTest(fixt_strdom_ranges([100, 104]), 105, fixt_dom_empty());
      lteTest(
        fixt_strdom_ranges([0, SMALL_MAX_NUM]),
        10,
        fixt_numdom_range(11, SMALL_MAX_NUM)
      );
      lteTest(fixt_strdom_range(500, 501), 500, fixt_numdom_solved(501)); // should be solved, later
      lteTest(fixt_strdom_nums(500, 900), 500, fixt_numdom_solved(900));
      lteTest(fixt_strdom_nums(500, 900, 901), 900, fixt_numdom_solved(901));
    });

    describe('numdom', () => {
      function lteTest(domain, value, expected) {
        test(`should lte [${domain}] <= ${value} -> [${expected}]`, () => {
          let clone = fixt_dom_clone(domain);
          let result = domain_removeLte(domain, value);

          // domain_toArr(result) + ' -> ' + domain_toArr(expected)
          expect(result).toEqual(expected);
          expect(domain).toEqual(clone);
        });
      }

      lteTest(
        fixt_numdom_nums(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
        5,
        fixt_numdom_nums(6, 7, 8, 9, 10)
      );
      lteTest(fixt_numdom_nums(4, 5, 6, 8, 9), 5, fixt_numdom_nums(6, 8, 9));
      lteTest(fixt_numdom_nums(4, 5, 8, 9), 5, fixt_numdom_nums(8, 9));
      lteTest(fixt_numdom_nums(5, 6, 7, 9), 5, fixt_numdom_nums(6, 7, 9));
      lteTest(fixt_numdom_nums(5, 8, 9), 5, fixt_numdom_nums(8, 9));
      lteTest(fixt_numdom_nums(5), 5, fixt_numdom_empty());
      lteTest(fixt_numdom_nums(6, 7, 8), 5, fixt_numdom_nums(6, 7, 8));
      lteTest(fixt_numdom_nums(0, 1, 2, 3, 4), 5, fixt_numdom_empty());
      lteTest(fixt_numdom_nums(5, 6), 5, fixt_numdom_solved(6));
      lteTest(fixt_numdom_solved(20), 19, fixt_numdom_solved(20));
      lteTest(fixt_numdom_solved(10), 10, fixt_numdom_empty());

      test('should improve code coverage', () => {
        let numdom = fixt_numdom_range(0, 30);
        for (let i = 0; i <= 50; ++i) {
          let v = domain_removeLte(numdom, i);
          expect(typeof v).toBe('number');
        }
      });
    });

    describe('solved numdoms', () => {
      test('should work with solved domains', () => {
        let nums = [0, 1, 10, 100, 1000, SUP - 1, SUP];
        for (let i = 0; i < nums.length; ++i) {
          let n = nums[i];
          // check with needle being lt, eq, gt
          let lt = n - 1;
          let eq = n;
          let gt = n + 1;

          if (lt >= 0)
            // 'n=' + n + ',lt'
            expect(domain_removeLte(fixt_numdom_solved(n), lt)).toBe(
              fixt_numdom_solved(n)
            );
          if (eq >= 0 && eq <= SUP)
            // 'n=' + n + ',eq'
            expect(domain_removeLte(fixt_numdom_solved(n), eq)).toBe(
              fixt_dom_empty()
            );
          if (gt <= SUP)
            // 'n=' + n + ',gt'
            expect(domain_removeLte(fixt_numdom_solved(n), gt)).toBe(
              fixt_dom_empty()
            );
        }
      });
    });
  });

  describe('domain_numToStr and domain_toList and domain_numstr and domain_fromList', () => {
    describe('numdom', () => {
      test('should work with all permutations', () => {
        // 27 is an arbitrary number (ok, prime) to not waste toooo much time on this
        for (let bitdom = 0; bitdom <= 0xffff; bitdom += 27) {
          let list = [];
          if (bitdom & (1 << 0)) list.push(0);
          if (bitdom & (1 << 1)) list.push(1);
          if (bitdom & (1 << 2)) list.push(2);
          if (bitdom & (1 << 3)) list.push(3);
          if (bitdom & (1 << 4)) list.push(4);
          if (bitdom & (1 << 5)) list.push(5);
          if (bitdom & (1 << 6)) list.push(6);
          if (bitdom & (1 << 7)) list.push(7);
          if (bitdom & (1 << 8)) list.push(8);
          if (bitdom & (1 << 9)) list.push(9);
          if (bitdom & (1 << 10)) list.push(10);
          if (bitdom & (1 << 11)) list.push(11);
          if (bitdom & (1 << 12)) list.push(12);
          if (bitdom & (1 << 13)) list.push(13);
          if (bitdom & (1 << 14)) list.push(14);
          if (bitdom & (1 << 15)) list.push(15);
          if (bitdom & (1 << 16)) list.push(16);
          if (bitdom & (1 << 17)) list.push(17);
          if (bitdom & (1 << 18)) list.push(18);
          if (bitdom & (1 << 19)) list.push(19);
          if (bitdom & (1 << 20)) list.push(20);
          if (bitdom & (1 << 21)) list.push(21);
          if (bitdom & (1 << 22)) list.push(22);
          if (bitdom & (1 << 23)) list.push(23);
          if (bitdom & (1 << 24)) list.push(24);
          if (bitdom & (1 << 25)) list.push(25);
          if (bitdom & (1 << 26)) list.push(26);
          if (bitdom & (1 << 27)) list.push(27);
          if (bitdom & (1 << 28)) list.push(28);
          if (bitdom & (1 << 29)) list.push(29);
          if (bitdom & (1 << 30)) list.push(30);

          let expNum = fixt_numdom_nums(...list);
          let expStr = fixt_strdom_nums(...list) || EMPTY;

          let outFromFlags = domain_numToStr(bitdom) || EMPTY;
          let outToList = domain_toList(bitdom);
          let outSmallest = domain_toSmallest(expStr);
          let outFromList = fixt_arrdom_nums(...list);

          let is = 'i=' + bitdom;
          // is
          expect(bitdom).toEqual(expNum); // more of a confirmation that the specs are proper
          // is
          expect(outFromFlags).toEqual(expStr);
          // is
          expect(outToList).toEqual(list);
          // is
          expect(outSmallest).toEqual(bitdom);
          // is
          expect(outFromList).toEqual(domain_toArr(bitdom));
        }
      });
    });
  });

  describe('domain_any__debug', () => {
    test('should work with all domain representations', () => {
      domain__debug(fixt_numdom_nums(0, 2, 15));
      domain__debug(fixt_strdom_nums(0, 2, 15, 200, SUP));
      domain__debug(fixt_arrdom_nums(0, 2, 15, 200));
      domain__debug(fixt_numdom_solved(100));
    });
  });

  describe('domain_isZero', () => {
    test('should return true if the domain is zero', () => {
      expect(domain_isZero(fixt_dom_nums(0))).toBe(true);
    });

    test('should return false if the domain is not zero', () => {
      expect(domain_isZero(fixt_dom_nums(0, 1))).toBe(false);
      expect(domain_isZero(fixt_dom_nums(0, 1, 2, 3, 4, 5))).toBe(false);
    });

    test('should return false if the domain has no zero', () => {
      expect(domain_isZero(fixt_dom_nums(1))).toBe(false);
      expect(domain_isZero(fixt_dom_nums(1, 2, 3))).toBe(false);
    });

    test('should return false if the domain is empty', () => {
      expect(domain_isZero(fixt_dom_empty())).toBe(false);
    });
  });

  describe('domain_hasNoZero', () => {
    test('should return false if the domain is zero', () => {
      expect(domain_hasNoZero(fixt_dom_nums(0))).toBe(false);
    });

    test('should return false if the domain is has zero', () => {
      expect(domain_hasNoZero(fixt_dom_nums(0, 1))).toBe(false);
      expect(domain_hasNoZero(fixt_dom_nums(0, 1, 2, 3, 4, 5))).toBe(false);
    });

    test('should return true if the domain has no zero', () => {
      expect(domain_hasNoZero(fixt_dom_nums(1))).toBe(true);
      expect(domain_hasNoZero(fixt_dom_nums(1, 2, 3))).toBe(true);
    });

    test('should return true if the domain is empty', () => {
      expect(domain_hasNoZero(fixt_dom_empty())).toBe(true);
    });
  });

  describe('domain_resolveAsBooly', () => {
    test('should remove the zero if result is true', () => {
      expect(domain_resolveAsBooly(fixt_dom_solved(0), true)).toEqual(
        fixt_dom_empty()
      );
      expect(domain_resolveAsBooly(fixt_dom_range(0, 10), true)).toEqual(
        fixt_dom_range(1, 10)
      );
      expect(domain_resolveAsBooly(fixt_dom_range(1, 10), true)).toEqual(
        fixt_dom_range(1, 10)
      );
      expect(domain_resolveAsBooly(fixt_dom_empty(), true)).toEqual(
        fixt_dom_empty()
      );
    });

    test('should remove the nonzeroes if result is false', () => {
      expect(domain_resolveAsBooly(fixt_dom_solved(0), false)).toEqual(
        fixt_dom_solved(0)
      );
      expect(domain_resolveAsBooly(fixt_dom_range(0, 10), false)).toEqual(
        fixt_dom_solved(0)
      );
      expect(domain_resolveAsBooly(fixt_dom_range(1, 10), false)).toEqual(
        fixt_dom_empty()
      );
      expect(domain_resolveAsBooly(fixt_dom_empty(), false)).toEqual(
        fixt_dom_empty()
      );
    });
  });
});
