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
    // Fetch real Nifty data from Finnhub
    const response = await fetch(
      'https://finnhub.io/api/v1/quote?symbol=^NSEI&token=d2mlpopr01qog4449uqgd2mlpopr01qog4449ur0',
      {
        method: 'GET',
        headers: {
          'X-Finnhub-Token': 'd2mlpopr01qog4449uqgd2mlpopr01qog4449ur0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Finnhub API failed');
    }
    
    const data = await response.json();
    
    // Return the data with additional metadata
    res.json({
      ...data,
      timestamp: new Date().toISOString(),
      source: 'Finnhub via Vercel Proxy'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
