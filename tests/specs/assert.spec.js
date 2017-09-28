import { ASSERT } from '../../src/assert';

describe('src/assert.spec', () => {
  describe('ASSERT', () => {
    test('should exist', () => {
      expect(typeof ASSERT).toBe('function');
    });

    test('should do nothing when you pass true', () => {
      expect(ASSERT(true)).toBeUndefined();
    });

    test('should throw if you pass on false', () => {
      expect(() => ASSERT(false)).toThrowError('Assertion fail: ');
    });
  });
});
