import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HyperSystemToolError, ERROR_CODES, getConfig } from '../lib.mjs';
import { withTimeout } from '../utils.mjs';
import { convert as htmlToText } from 'html-to-text';

const MAX_CONTENT_LENGTH = 20000;
const URL_FETCH_TIMEOUT_MS = 10000;

// Helper function to extract URLs from a string (kept for potential future use with prompt-based input)
// function extractUrls(text: string): string[] {
//   const urlRegex = /(https?:\/\/[^\s]+)/g;
//   return text.match(urlRegex) || [];
// }

// Helper function to convert HTML to text using html-to-text library
function convertHtmlToText(html: string): string {
  return htmlToText(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: false } }, // 显示链接URL
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
    ],
  });
}

// Helper function to check if URL is private/local
function isPrivateIp(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    // Check for private IP ranges
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipRegex);
    
    if (match) {
      const octets = match.slice(1, 5).map(Number);
      const [a, b] = octets;
      
      // Private IP ranges
      return (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    }
    
    return false;
  } catch {
    return false;
  }
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HyperChat/1.0 (Web Fetch Tool)',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

const webFetchSchema = z.object({
  url: z.string().url().describe('The URL to fetch content from'),
});

export function registerWebFetchTool(server: McpServer): void {
  server.tool(
    'web_fetch',
    'Fetches content from a web URL. Supports both public and private/local URLs.',
    webFetchSchema.shape,
    async ({ url }) => {
      const config = getConfig();
      
      try {
        // Validate URL format
        try {
          new URL(url);
        } catch {
          throw new HyperSystemToolError(
            `Invalid URL format: ${url}`,
            ERROR_CODES.INVALID_INPUT
          );
        }

        // Convert GitHub blob URL to raw URL
        let fetchUrl = url;
        if (url.includes('github.com') && url.includes('/blob/')) {
          fetchUrl = url
            .replace('github.com', 'raw.githubusercontent.com')
            .replace('/blob/', '/');
        }

        // Check if it's a private/local URL
        const isPrivate = isPrivateIp(fetchUrl);
        
        // Fetch the content with timeout
        const response = await withTimeout(
          () => fetchWithTimeout(fetchUrl, URL_FETCH_TIMEOUT_MS),
          config.fileOperationTimeout,
          'Web fetch operation timed out'
        );

        if (!response.ok) {
          throw new HyperSystemToolError(
            `HTTP ${response.status}: ${response.statusText}`,
            ERROR_CODES.FILE_READ_ERROR
          );
        }

        // Get content type
        const contentType = response.headers.get('content-type') || '';
        let content = '';

        if (contentType.includes('text/html')) {
          // Handle HTML content
          const html = await response.text();
          content = convertHtmlToText(html);
        } else if (contentType.includes('text/') || contentType.includes('application/json')) {
          // Handle text/JSON content
          content = await response.text();
        } else {
          throw new HyperSystemToolError(
            `Unsupported content type: ${contentType}`,
            ERROR_CODES.INVALID_INPUT
          );
        }

        // Limit content length
        if (content.length > MAX_CONTENT_LENGTH) {
          content = content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to length...]';
        }

        // Add metadata
        const metadata = {
          url: url,
          actualUrl: fetchUrl !== url ? fetchUrl : undefined,
          contentType: contentType,
          contentLength: content.length,
          isPrivate: isPrivate,
        };

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
            {
              type: 'text', 
              text: `\n\n--- Metadata ---\n${JSON.stringify(metadata, null, 2)}`,
            },
          ],
        };

      } catch (error) {
        if (error instanceof HyperSystemToolError) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new HyperSystemToolError(
          `Failed to fetch URL ${url}: ${errorMessage}`,
          ERROR_CODES.NETWORK_ERROR
        );
      }
    }
  );
}