export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Try multiple data sources for Nifty data
    let niftyData = null;
    
    // Source 1: Try Yahoo Finance API (free)
    try {
      const yahooResponse = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (yahooResponse.ok) {
        const yahooData = await yahooResponse.json();
        const result = yahooData.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        niftyData = {
          c: meta.regularMarketPrice, // current price
          o: quote.open[quote.open.length - 1], // open
          h: quote.high[quote.high.length - 1], // high  
          l: quote.low[quote.low.length - 1], // low
          pc: meta.previousClose, // previous close
          timestamp: new Date().toISOString(),
          source: 'Yahoo Finance via Vercel Proxy'
        };
      }
    } catch (yahooError) {
      console.log('Yahoo Finance failed:', yahooError.message);
    }
    
    // Source 2: Fallback to Alpha Vantage (if Yahoo fails)
    if (!niftyData) {
      try {
        const alphaResponse = await fetch(
          'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NIFTY&apikey=demo'
        );
        
        if (alphaResponse.ok) {
          const alphaData = await alphaResponse.json();
          const quote = alphaData['Global Quote'];
          
          if (quote && quote['05. price']) {
            niftyData = {
              c: parseFloat(quote['05. price']),
              o: parseFloat(quote['02. open']),
              h: parseFloat(quote['03. high']),
              l: parseFloat(quote['04. low']),
              pc: parseFloat(quote['08. previous close']),
              timestamp: new Date().toISOString(),
              source: 'Alpha Vantage via Vercel Proxy'
            };
          }
        }
      } catch (alphaError) {
        console.log('Alpha Vantage failed:', alphaError.message);
      }
    }
    
    // Source 3: Mock realistic data (if all APIs fail)
    if (!niftyData) {
      const basePrice = 24550;
      const variation = (Math.random() - 0.5) * 100; // ±50 points variation
      const currentPrice = basePrice + variation;
      
      niftyData = {
        c: Math.round(currentPrice * 100) / 100,
        o: Math.round((currentPrice - Math.random() * 20 + 10) * 100) / 100,
        h: Math.round((currentPrice + Math.random() * 30) * 100) / 100,
        l: Math.round((currentPrice - Math.random() * 30) * 100) / 100,
        pc: Math.round((currentPrice - Math.random() * 40 + 20) * 100) / 100,
        timestamp: new Date().toISOString(),
        source: 'Realistic Mock Data (APIs unavailable)'
      };
    }
    
    res.json(niftyData);
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Return mock data on any error
    const basePrice = 24550;
    const variation = (Math.random() - 0.5) * 100;
    const currentPrice = basePrice + variation;
    
    res.json({
      c: Math.round(currentPrice * 100) / 100,
      o: Math.round((currentPrice - Math.random() * 20 + 10) * 100) / 100,
      h: Math.round((currentPrice + Math.random() * 30) * 100) / 100,
      l: Math.round((currentPrice - Math.random() * 30) * 100) / 100,
      pc: Math.round((currentPrice - Math.random() * 40 + 20) * 100) / 100,
      timestamp: new Date().toISOString(),
      source: 'Fallback Mock Data',
      error: 'Live data temporarily unavailable'
    });
  }
}
