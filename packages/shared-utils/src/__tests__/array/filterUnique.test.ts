import { describe, it, expect } from 'vitest';
import { filterUnique } from '../../array/filterUnique';

describe('filterUnique', () => {
  describe('basic functionality', () => {
    it('should filter out duplicate strings', () => {
      const array = ['a', 'b', 'a', 'c', 'b', 'd'];
      const result = array.filter(filterUnique);
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should filter out duplicate numbers', () => {
      const array = [1, 2, 1, 3, 2, 4];
      const result = array.filter(filterUnique);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle empty array', () => {
      const array: string[] = [];
      const result = array.filter(filterUnique);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const array = ['a', 'b', 'c'];
      const result = array.filter(filterUnique);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('edge cases', () => {
    it('should handle single element array', () => {
      const array = ['single'];
      const result = array.filter(filterUnique);
      expect(result).toEqual(['single']);
    });

    it('should handle array with all same elements', () => {
      const array = ['same', 'same', 'same'];
      const result = array.filter(filterUnique);
      expect(result).toEqual(['same']);
    });

    it('should handle null and undefined values', () => {
      const array = [null, undefined, null, 'value', undefined];
      const result = array.filter(filterUnique);
      expect(result).toEqual([null, undefined, 'value']);
    });

    it('should handle mixed data types', () => {
      const array = [1, '1', true, 1, '1', false, true];
      const result = array.filter(filterUnique);
      expect(result).toEqual([1, '1', true, false]);
    });
  });

  describe('object references', () => {
    it('should compare object references, not values', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 1 };
      const array = [obj1, obj2, obj1];
      const result = array.filter(filterUnique);
      expect(result).toEqual([obj1, obj2]);
      expect(result).toHaveLength(2);
    });

    it('should handle array of objects with same reference', () => {
      const obj = { id: 1 };
      const array = [obj, obj, obj];
      const result = array.filter(filterUnique);
      expect(result).toEqual([obj]);
      expect(result).toHaveLength(1);
    });
  });

  describe('performance considerations', () => {
    it('should handle large arrays efficiently', () => {
      const size = 10000;
      const array = Array.from({ length: size }, (_, i) => i % 100);
      const result = array.filter(filterUnique);
      
      expect(result).toHaveLength(100);
      expect(result).toEqual(Array.from({ length: 100 }, (_, i) => i));
    });

    it('should maintain original order of first occurrences', () => {
      const array = ['c', 'a', 'b', 'a', 'c', 'd'];
      const result = array.filter(filterUnique);
      expect(result).toEqual(['c', 'a', 'b', 'd']);
    });
  });

  describe('function signature verification', () => {
    it('should be compatible with Array.prototype.filter', () => {
      const array = [1, 2, 1, 3];
      // This should not throw and should work as expected
      const result = array.filter(filterUnique);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should receive correct parameters from filter', () => {
      const array = ['a', 'b', 'a'];
      const calls: Array<{val: string, index: number, array: string[]}> = [];
      
      const testFilter = (val: string, index: number, arr: string[]) => {
        calls.push({ val, index, array: arr });
        return filterUnique(val, index, arr);
      };

      array.filter(testFilter);

      expect(calls).toHaveLength(3);
      expect(calls[0]).toEqual({ val: 'a', index: 0, array: ['a', 'b', 'a'] });
      expect(calls[1]).toEqual({ val: 'b', index: 1, array: ['a', 'b', 'a'] });
      expect(calls[2]).toEqual({ val: 'a', index: 2, array: ['a', 'b', 'a'] });
    });
  });
});