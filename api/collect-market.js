// Market data collector - fetches BTC, ETH and market overview from CoinGecko
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Fetch BTC and ETH data
    const coinsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?' +
      new URLSearchParams({
        vs_currency: 'usd',
        ids: 'bitcoin,ethereum',
        order: 'market_cap_desc',
        sparkline: 'false'
      }),
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KriptoWallet/1.0'
        }
      }
    );

    if (!coinsResponse.ok) {
      throw new Error(`CoinGecko API error: ${coinsResponse.status}`);
    }

    const coinsData = await coinsResponse.json();
    const btc = coinsData.find(c => c.id === 'bitcoin');
    const eth = coinsData.find(c => c.id === 'ethereum');

    // Fetch global market data
    const globalResponse = await fetch(
      'https://api.coingecko.com/api/v3/global',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KriptoWallet/1.0'
        }
      }
    );

    const globalData = await globalResponse.json();

    const marketData = {
      date: new Date().toISOString().split('T')[0],
      btc_price: btc?.current_price || 0,
      btc_24h_change: btc?.price_change_percentage_24h || 0,
      btc_market_cap: btc?.market_cap || 0,
      btc_volume: btc?.total_volume || 0,
      eth_price: eth?.current_price || 0,
      eth_24h_change: eth?.price_change_percentage_24h || 0,
      total_market_cap: globalData?.data?.total_market_cap?.usd || 0
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      success: true,
      data: marketData
    });

  } catch (error) {
    console.error('Market data collection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
