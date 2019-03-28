import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

export default [
  // UMD Development
  {
    input: 'src/index.js',
    output: {
      file: 'dist/fdlib.js',
      format: 'umd',
      name: 'fdlib',
      indent: false,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel(),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
    ],
  },

  // UMD Production
  {
    input: 'src/index.js',
    output: {
      file: 'dist/fdlib.min.js',
      format: 'umd',
      name: 'fdlib',
      indent: false,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel(),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      terser({
        compress: {
          pure_funcs: [
            // domain_lib
            'domain_arr_max',
            'domain_arrToStr',
            'domain_str_decodeValue',
            'domain_str_getValue',
            'domain_bit_getValue',
            'domain_sol_getValue',
            'domain_num_createRange',
            'domain_createEmpty',
            'domain_createValue',
            'domain_str_decodeValue',
            'domain_toList',
            'domain_max',
            'domain_size',
            'domain_min',
            'domain_isSolved',
            'domain_isZero',
            'domain_hasNoZero',
            'domain_hasZero',
            'domain_isBool',
            'domain_isBooly',
            'domain_sharesNoElements',
            'domain_createRange',
            'domain_createRangeTrimmed',
            'domain_toArr',
            'domain_toStr',
            'domain_toSmallest',
            'domain_anyToSmallest',
            'domain_arrToSmallest',
            'domain_str_closeGaps',
            'domain_containsValue',
            'domain_num_containsValue',
            'domain_createBoolyPair',
            'domain__debug',
            'domain_getFirstIntersectingValue',
            'domain_getValue',
            'domain_intersection',
            'domain_intersectionValue',
            'domain_isBoolyPair',
            'domain_isEmpty',
            'domain_numToStr',
            'domain_removeGte',
            'domain_removeGtUnsafe',
            'domain_removeLte',
            'domain_removeLtUnsafe', // "Unsafe" here just means input is not validated first
            'domain_removeValue',
            'domain_resolveAsBooly',
            'domain_str_encodeRange',
            'domain_minus',
            'domain_plus',

            /* impure
            'domain_numnum_createRangeZeroToMax',
            'domain_str_simplify',
            'domain_divby',
            'domain_mulByValue',
            'domain_divByValue',
            'domain_invMul',
            'domain_middleElement',
            'domain_fromListToArrdom',
            'domain_mul',
            'domain_invMulValue',
            */


            // helpers
            'INSPECT',
            'getTerm',

            /* impure
            'SUSH',
            'THROW',
            'setTerm',
            */

            // trie
            'trie_create',
            '_trie_debug',
            'trie_get',
            'trie_getNum',
            'trie_getValueBitsize',
            'trie_has',
            'trie_hasNum',

            /* impure
            'trie_add',
            'trie_addNum',
            */

          ],
          pure_getters: true,
          unsafe: true,
          unsafe_comps: false,
          warnings: false,
        },
      }),
    ],
  },
];
