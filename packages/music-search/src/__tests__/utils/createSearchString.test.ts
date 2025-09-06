import { describe, it, expect } from 'vitest';
import { createSearchString } from '../../utils/createSearchString';

describe('createSearchString', () => {
    describe('basic functionality', () => {
        it('should convert string to lowercase', () => {
            expect(createSearchString('HELLO WORLD')).toBe('hello world');
            expect(createSearchString('MiXeD CaSe')).toBe('mixed case');
        });

        it('should trim whitespace', () => {
            expect(createSearchString('  hello world  ')).toBe('hello world');
            expect(createSearchString('\n\t test \r\n')).toBe('test');
        });

        it('should handle empty string', () => {
            expect(createSearchString('')).toBe('');
        });

        it('should handle whitespace-only string', () => {
            expect(createSearchString('   ')).toBe('');
            expect(createSearchString('\n\t\r')).toBe('');
        });
    });

    describe('diacritic normalization', () => {
        describe('a variants', () => {
            it('should normalize à, á, â, ã, ä, å to a', () => {
                expect(createSearchString('àáâãäå')).toBe('aaaaaa');
                expect(createSearchString('Café')).toBe('cafe');
                expect(createSearchString('naïve')).toBe('naive');
            });
        });

        describe('e variants', () => {
            it('should normalize è, é, ê, ë to e', () => {
                expect(createSearchString('èéêë')).toBe('eeee');
                expect(createSearchString('résumé')).toBe('resume');
                expect(createSearchString('Élève')).toBe('eleve');
            });
        });

        describe('i variants', () => {
            it('should normalize ì, í, î, ï to i', () => {
                expect(createSearchString('ìíîï')).toBe('iiii');
                expect(createSearchString('naïve')).toBe('naive');
            });
        });

        describe('o variants', () => {
            it('should normalize ò, ó, ô, õ, ö to o', () => {
                expect(createSearchString('òóôõö')).toBe('ooooo');
                expect(createSearchString('coöperation')).toBe('cooperation');
            });
        });

        describe('u variants', () => {
            it('should normalize ù, ú, û, ü to u', () => {
                expect(createSearchString('ùúûü')).toBe('uuuu');
                expect(createSearchString('München')).toBe('munchen');
            });
        });

        describe('y variants', () => {
            it('should normalize ý, ÿ to y', () => {
                expect(createSearchString('ýÿ')).toBe('yy');
            });
        });

        describe('special characters', () => {
            it('should normalize æ to ae', () => {
                expect(createSearchString('æ')).toBe('ae');
                expect(createSearchString('Ægis')).toBe('aegis');
            });

            it('should normalize œ to oe', () => {
                expect(createSearchString('œ')).toBe('oe');
                expect(createSearchString('cœur')).toBe('coeur');
            });

            it('should normalize ç to c', () => {
                expect(createSearchString('ç')).toBe('c');
                expect(createSearchString('français')).toBe('francais');
            });

            it('should normalize ñ to n', () => {
                expect(createSearchString('ñ')).toBe('n');
                expect(createSearchString('español')).toBe('espanol');
            });
        });
    });

    describe('real-world examples', () => {
        it('should normalize music artist names', () => {
            expect(createSearchString('Björk')).toBe('bjork');
            expect(createSearchString('Sigur Rós')).toBe('sigur ros');
            expect(createSearchString('Mötley Crüe')).toBe('motley crue');
            expect(createSearchString('Céline Dion')).toBe('celine dion');
        });

        it('should normalize song titles', () => {
            expect(createSearchString('La Vie En Rose')).toBe('la vie en rose');
            expect(createSearchString('Für Elise')).toBe('fur elise');
            expect(createSearchString('Água de Beber')).toBe('agua de beber');
        });

        it('should handle mixed content', () => {
            expect(createSearchString('Café del Mar (Ibiza)')).toBe('cafe del mar (ibiza)');
            expect(createSearchString('Ángel - Remastered 2004')).toBe('angel - remastered 2004');
        });
    });

    describe('edge cases', () => {
        it('should handle strings with only diacritics', () => {
            expect(createSearchString('àáâãäåæç')).toBe('aaaaaaeac');
        });

        it('should handle mixed case with diacritics', () => {
            expect(createSearchString('BJÖRK')).toBe('bjork');
            expect(createSearchString('SiGuR rÓs')).toBe('sigur ros');
        });

        it('should handle numbers and special characters', () => {
            expect(createSearchString('Track #1 - Café')).toBe('track #1 - cafe');
            expect(createSearchString('50% Français')).toBe('50% francais');
        });

        it('should handle very long strings', () => {
            const longString = `${'á'.repeat(1000)  } café ${  'é'.repeat(1000)}`;
            const result = createSearchString(longString);
            expect(result).toBe(`${'a'.repeat(1000)  } cafe ${  'e'.repeat(1000)}`);
        });
    });

    describe('performance', () => {
        it('should handle large strings efficiently', () => {
            const largeString = 'Björk Guðmundsdóttir '.repeat(1000);
            const start = performance.now();
            const result = createSearchString(largeString);
            const end = performance.now();
      
            expect(result).toContain('bjork gudmundsdottir');
            expect(end - start).toBeLessThan(100); // Should complete in under 100ms
        });
    });

    describe('consistency', () => {
        it('should be idempotent', () => {
            const input = 'Björk Guðmundsdóttir';
            const firstCall = createSearchString(input);
            const secondCall = createSearchString(firstCall);
            expect(firstCall).toBe(secondCall);
        });

        it('should handle null/undefined gracefully', () => {
            // Note: Function expects string, but let's test type coercion
            expect(createSearchString(undefined as any)).toBe('undefined');
            expect(createSearchString(null as any)).toBe('null');
        });
    });
});