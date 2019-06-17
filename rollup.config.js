import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
//import { terser } from 'rollup-plugin-terser';

export default [
  // Core Node builds
  {
    input: 'src/fdlib.js',
    plugins: [
      resolve(),
      commonjs({ include: 'node_modules/**' }),
      babel(),
//      terser({
//        sourcemap: true,
//        compress: {
//          pure_funcs: [
//            // assert
//            /* no pure functions in production */

//            // constraints
//            /* no pure functions in production */

//            // domain_lib
//            'domain_arr_max',
//            'domain_arrToStr',
//            'domain_str_decodeValue',
//            'domain_str_getValue',
//            'domain_bit_getValue',
//            'domain_sol_getValue',
//            'domain_num_createRange',
//            'domain_createEmpty',
//            'domain_createValue',
//            'domain_str_decodeValue',
//            'domain_toList',
//            'domain_max',
//            'domain_size',
//            'domain_min',
//            'domain_isSolved',
//            'domain_isZero',
//            'domain_hasNoZero',
//            'domain_hasZero',
//            'domain_isBool',
//            'domain_isBooly',
//            'domain_sharesNoElements',
//            'domain_createRange',
//            'domain_createRangeTrimmed',
//            'domain_toArr',
//            'domain_toStr',
//            'domain_toSmallest',
//            'domain_anyToSmallest',
//            'domain_arrToSmallest',
//            'domain_str_closeGaps',
//            'domain_containsValue',
//            'domain_num_containsValue',
//            'domain_createBoolyPair',
//            'domain__debug',
//            'domain_getFirstIntersectingValue',
//            'domain_getValue',
//            'domain_intersection',
//            'domain_intersectionValue',
//            'domain_isBoolyPair',
//            'domain_isEmpty',
//            'domain_numToStr',
//            'domain_removeGte',
//            'domain_removeGtUnsafe',
//            'domain_removeLte',
//            'domain_removeLtUnsafe', // "Unsafe" here just means input is not validated first
//            'domain_removeValue',
//            'domain_resolveAsBooly',
//            'domain_str_encodeRange',

//            // domain_minus
//            'domain_minus',

//            // domain_plus
//            'domain_plus',

//            // helpers
//            'INSPECT',
//            'getTerm',

//            // trie
//            'trie_create',
//            '_trie_debug',
//            'trie_get',
//            'trie_getNum',
//            'trie_getValueBitsize',
//            'trie_has',
//            'trie_hasNum',

//            /* impure
//            // domain_lib
//            'domain_numnum_createRangeZeroToMax',
//            'domain_str_simplify',
//            'domain_divby',
//            'domain_mulByValue',
//            'domain_divByValue',
//            'domain_invMul',
//            'domain_middleElement',
//            'domain_fromListToArrdom',
//            'domain_mul',
//            'domain_invMulValue',

//            // helpers
//            'SUSH',
//            'THROW',
//            'setTerm',

//            // trie
//            'trie_add',
//            'trie_addNum',
//            */

//            /* Should not be used in production
//            // assert
//            'ASSERT',
//            'ASSERT_ANYDOM',
//            'ASSERT_ARRDOM',
//            'ASSERT_BITDOM',
//            'ASSERT_LOG',
//            'ASSERT_NORDOM',
//            'ASSERT_NUMDOM',
//            'ASSERT_SET_LOG',
//            'ASSERT_SOLDOM',
//            'ASSERT_STRDOM',
//            'ASSERT_VARDOMS_SLOW',
//            'TRACE',
//            'TRACE_MORPH',
//            'TRACE_SILENT',
//            'isTracing',
//            'setTracing',

//            // domain_lib
//            'domain_str_rangeIndexOf',
//            '_domain_str_quickSortRanges',
//            '_domain_str_mergeOverlappingRanges',
//            */
//          ],
//          pure_getters: true,
//          unsafe: true,
//          unsafe_comps: false, // TODO: find out why things break when this is true
//          warnings: false,
//        },
//      }),
    ],
    external: ['fs', 'path', 'events', 'module', 'util'],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    output: [
      { file: 'dist/fdlib.js', format: 'cjs', sourcemap: true },
      { file: 'dist/fdlib.es.js', format: 'esm' },
    ],
  },
];
