// Derivatives data collector - fetches futures/options data from Coinglass
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Coinglass public endpoints (may require API key for some data)
    // Using alternative free sources as backup
    
    let derivativesData = {
      date: new Date().toISOString().split('T')[0],
      open_interest: null,
      funding_rate: null,
      long_short_ratio: null,
      liquidations_24h: null
    };

    // Try Coinglass API (free tier available)
    try {
      const oiResponse = await fetch(
        'https://open-api.coinglass.com/public/v2/open_interest?symbol=BTC&time_type=all',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KriptoWallet/1.0'
          }
        }
      );

      if (oiResponse.ok) {
        const oiData = await oiResponse.json();
        if (oiData.data) {
          derivativesData.open_interest = oiData.data.openInterest || null;
        }
      }
    } catch (e) {
      console.warn('Coinglass OI fetch failed:', e.message);
    }

    // Try funding rate
    try {
      const fundingResponse = await fetch(
        'https://open-api.coinglass.com/public/v2/funding?symbol=BTC',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KriptoWallet/1.0'
          }
        }
      );

      if (fundingResponse.ok) {
        const fundingData = await fundingResponse.json();
        if (fundingData.data && fundingData.data.length > 0) {
          // Average funding rate across exchanges
          const avgFunding = fundingData.data.reduce((sum, d) => sum + (d.rate || 0), 0) / fundingData.data.length;
          derivativesData.funding_rate = avgFunding;
        }
      }
    } catch (e) {
      console.warn('Coinglass funding fetch failed:', e.message);
    }

    // Try long/short ratio from CryptoQuant or similar
    try {
      const lsResponse = await fetch(
        'https://open-api.coinglass.com/public/v2/long_short?symbol=BTC&time_type=h24',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KriptoWallet/1.0'
          }
        }
      );

      if (lsResponse.ok) {
        const lsData = await lsResponse.json();
        if (lsData.data) {
          derivativesData.long_short_ratio = lsData.data.longRate ? 
            lsData.data.longRate / (100 - lsData.data.longRate) : null;
        }
      }
    } catch (e) {
      console.warn('Coinglass L/S fetch failed:', e.message);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: derivativesData,
      note: 'Some derivatives data may require API key for full access'
    });

  } catch (error) {
    console.error('Derivatives data collection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
