import { describe, it, expect } from 'vitest';
import { getAPIUrl } from '../../utils/getAPIUrl';

describe('getAPIUrl', () => {
  describe('basic functionality', () => {
    it('should construct API URL with protocol, host and path', () => {
      const result = getAPIUrl('http://localhost:32400', '/library/sections');
      expect(result).toBe('http://localhost:32400/library/sections');
    });

    it('should work with HTTPS URLs', () => {
      const result = getAPIUrl('https://plex.example.com:32400', '/playlists');
      expect(result).toBe('https://plex.example.com:32400/playlists');
    });

    it('should handle paths with query parameters', () => {
      const result = getAPIUrl('http://localhost:32400', '/search?query=test');
      expect(result).toBe('http://localhost:32400/search?query=test');
    });

    it('should handle root path', () => {
      const result = getAPIUrl('http://localhost:32400', '/');
      expect(result).toBe('http://localhost:32400/');
    });
  });

  describe('port validation', () => {
    it('should throw error when port is missing', () => {
      expect(() => {
        getAPIUrl('http://localhost', '/path');
      }).toThrow('The link to the Roon extension seems invalid. The port number might be missing');
    });

    it('should throw error when URL has no port in hostname only format', () => {
      expect(() => {
        getAPIUrl('localhost', '/path');
      }).toThrow(); // URL constructor will fail or port will be missing
    });

    it('should work with explicit port numbers', () => {
      const ports = ['32400', '8080', '3000', '443', '80'];
      ports.forEach(port => {
        const result = getAPIUrl(`http://localhost:${port}`, '/test');
        expect(result).toBe(`http://localhost:${port}/test`);
      });
    });

    it('should work with default HTTPS port', () => {
      const result = getAPIUrl('https://plex.example.com:443', '/library');
      expect(result).toBe('https://plex.example.com:443/library');
    });

    it('should work with default HTTP port', () => {
      const result = getAPIUrl('http://plex.example.com:80', '/library');
      expect(result).toBe('http://plex.example.com:80/library');
    });
  });

  describe('URL parsing', () => {
    it('should handle complex hostnames', () => {
      const hostnames = [
        'localhost',
        '127.0.0.1',
        '192.168.1.100',
        'plex.local',
        'my-plex-server.home',
        'plex-server.example.com'
      ];

      hostnames.forEach(hostname => {
        const result = getAPIUrl(`http://${hostname}:32400`, '/test');
        expect(result).toBe(`http://${hostname}:32400/test`);
      });
    });

    it('should preserve protocol from original URL', () => {
      const protocols = ['http', 'https'];
      protocols.forEach(protocol => {
        const result = getAPIUrl(`${protocol}://localhost:32400`, '/test');
        expect(result).toBe(`${protocol}://localhost:32400/test`);
      });
    });

    it('should handle URLs with existing paths that get replaced', () => {
      const result = getAPIUrl('http://localhost:32400/old/path', '/new/path');
      expect(result).toBe('http://localhost:32400/new/path');
    });

    it('should handle URLs with query parameters that get replaced', () => {
      const result = getAPIUrl('http://localhost:32400?old=param', '/new/path');
      expect(result).toBe('http://localhost:32400/new/path');
    });

    it('should handle URLs with fragments that get replaced', () => {
      const result = getAPIUrl('http://localhost:32400#fragment', '/new/path');
      expect(result).toBe('http://localhost:32400/new/path');
    });
  });

  describe('path handling', () => {
    it('should handle paths starting with slash', () => {
      const result = getAPIUrl('http://localhost:32400', '/library/sections');
      expect(result).toBe('http://localhost:32400/library/sections');
    });

    it('should handle paths not starting with slash', () => {
      const result = getAPIUrl('http://localhost:32400', 'library/sections');
      expect(result).toBe('http://localhost:32400library/sections');
    });

    it('should handle empty paths', () => {
      const result = getAPIUrl('http://localhost:32400', '');
      expect(result).toBe('http://localhost:32400');
    });

    it('should handle complex paths', () => {
      const paths = [
        '/library/sections/1/all',
        '/library/metadata/123',
        '/playlists/456/items',
        '/search?query=artist%20name',
        '/library/sections?includeDetails=1'
      ];

      paths.forEach(path => {
        const result = getAPIUrl('http://localhost:32400', path);
        expect(result).toBe(`http://localhost:32400${path}`);
      });
    });

    it('should handle paths with special characters', () => {
      const specialPaths = [
        '/search?query=artist%20with%20spaces',
        '/library/metadata/123?includeConcerts=1&includeExtras=1',
        '/playlists?type=audio&smart=0'
      ];

      specialPaths.forEach(path => {
        const result = getAPIUrl('http://localhost:32400', path);
        expect(result).toBe(`http://localhost:32400${path}`);
      });
    });
  });

  describe('error handling', () => {
    it('should throw specific error message about Roon extension', () => {
      expect(() => {
        getAPIUrl('http://localhost', '/path');
      }).toThrow('The link to the Roon extension seems invalid. The port number might be missing');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        getAPIUrl('not-a-url', '/path');
      }).toThrow(); // URL constructor should throw
    });

    it('should handle invalid protocols', () => {
      expect(() => {
        getAPIUrl('ftp://localhost:32400', '/path');
      }).not.toThrow(); // URL constructor accepts various protocols
      
      const result = getAPIUrl('ftp://localhost:32400', '/path');
      expect(result).toBe('ftp://localhost:32400/path');
    });
  });

  describe('real-world usage patterns', () => {
    it('should work with typical Plex server configurations', () => {
      const configs = [
        { url: 'http://127.0.0.1:32400', path: '/library/sections' },
        { url: 'https://plex.myserver.com:32400', path: '/playlists' },
        { url: 'http://192.168.1.100:32400', path: '/library/metadata/12345' },
        { url: 'http://localhost:32400', path: '/search?query=Beatles' }
      ];

      configs.forEach(config => {
        const result = getAPIUrl(config.url, config.path);
        expect(result).toBe(`${config.url}${config.path}`);
        expect(result).toMatch(/^https?:\/\/[^:]+:\d+/);
      });
    });

    it('should work with Plex API endpoints', () => {
      const baseUrl = 'http://localhost:32400';
      const endpoints = [
        '/library/sections',
        '/library/sections/1/all',
        '/playlists',
        '/playlists/123/items',
        '/library/metadata/456',
        '/search?query=test',
        '/library/recentlyAdded',
        '/transcode/sessions'
      ];

      endpoints.forEach(endpoint => {
        const result = getAPIUrl(baseUrl, endpoint);
        expect(result).toBe(`${baseUrl}${endpoint}`);
      });
    });

    it('should handle dynamic port assignments', () => {
      const dynamicPorts = [32400, 32401, 32402, 8080, 9000];
      dynamicPorts.forEach(port => {
        const result = getAPIUrl(`http://localhost:${port}`, '/status');
        expect(result).toBe(`http://localhost:${port}/status`);
      });
    });
  });

  describe('URL component preservation', () => {
    it('should preserve protocol exactly', () => {
      const httpResult = getAPIUrl('http://localhost:32400', '/test');
      const httpsResult = getAPIUrl('https://localhost:32400', '/test');
      
      expect(httpResult.startsWith('http://')).toBe(true);
      expect(httpsResult.startsWith('https://')).toBe(true);
    });

    it('should preserve hostname exactly', () => {
      const hostnames = ['localhost', '127.0.0.1', 'plex.example.com'];
      hostnames.forEach(hostname => {
        const result = getAPIUrl(`http://${hostname}:32400`, '/test');
        expect(result).toContain(hostname);
      });
    });

    it('should preserve port exactly', () => {
      const ports = ['32400', '8080', '443', '80'];
      ports.forEach(port => {
        const result = getAPIUrl(`http://localhost:${port}`, '/test');
        expect(result).toContain(`:${port}`);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long paths', () => {
      const longPath = '/library/sections/' + 'a'.repeat(1000);
      const result = getAPIUrl('http://localhost:32400', longPath);
      expect(result).toBe(`http://localhost:32400${longPath}`);
    });

    it('should handle paths with Unicode characters', () => {
      const unicodePath = '/search?query=Björk';
      const result = getAPIUrl('http://localhost:32400', unicodePath);
      expect(result).toBe(`http://localhost:32400${unicodePath}`);
    });

    it('should handle IPv6 addresses with ports', () => {
      // Note: IPv6 URLs require brackets around the address
      const result = getAPIUrl('http://[::1]:32400', '/test');
      expect(result).toBe('http://[::1]:32400/test');
    });

    it('should handle unusual but valid port numbers', () => {
      const unusualPorts = ['1', '65535', '12345'];
      unusualPorts.forEach(port => {
        const result = getAPIUrl(`http://localhost:${port}`, '/test');
        expect(result).toBe(`http://localhost:${port}/test`);
      });
    });
  });

  describe('performance', () => {
    it('should handle many URL constructions efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        getAPIUrl(`http://localhost:${32400 + (i % 10)}`, `/path/${i}`);
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle complex URLs efficiently', () => {
      const complexUrl = 'https://very-long-hostname.example.com:32400';
      const complexPath = '/library/sections/1/all?includeDetails=1&includeConcerts=1&X-Plex-Container-Start=0&X-Plex-Container-Size=50';
      
      const start = performance.now();
      const result = getAPIUrl(complexUrl, complexPath);
      const end = performance.now();
      
      expect(result).toBe(`${complexUrl}${complexPath}`);
      expect(end - start).toBeLessThan(5); // Should be very fast
    });
  });
});