// Bot detection utility

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /google/i,
  /baidu/i,
  /bing/i,
  /msn/i,
  /duckduckgo/i,
  /teoma/i,
  /slurp/i,
  /yandex/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /webdriver/i,
  /scraper/i,
];

/**
 * Check if user agent appears to be a bot
 */
export function isBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Check if request appears to be from a bot based on various signals
 */
export function isBotRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent');
  
  // Check user agent
  if (isBot(userAgent || '')) {
    return true;
  }
  
  // Check for missing user agent (suspicious)
  if (!userAgent) {
    return true;
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-automated',
    'x-bot',
    'x-crawler',
  ];
  
  for (const header of suspiciousHeaders) {
    if (request.headers.has(header)) {
      return true;
    }
  }
  
  return false;
}
