// News data collector - fetches crypto news from CryptoPanic API
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // CryptoPanic free API (no auth required for basic access)
    const newsResponse = await fetch(
      'https://cryptopanic.com/api/v1/posts/?auth_token=public&public=true&filter=hot&currencies=BTC,ETH',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KriptoWallet/1.0'
        }
      }
    );

    let newsData = [];

    if (newsResponse.ok) {
      const data = await newsResponse.json();
      newsData = (data.results || []).slice(0, 10).map(article => ({
        title: article.title,
        source: article.source?.title || 'Unknown',
        url: article.url,
        sentiment: article.votes?.positive > article.votes?.negative ? 'positive' : 
                   article.votes?.negative > article.votes?.positive ? 'negative' : 'neutral',
        currencies: article.currencies?.map(c => c.code) || [],
        published_at: article.published_at
      }));
    } else {
      // Fallback: Return empty array with message
      console.warn('CryptoPanic API not available, using fallback');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

    return res.status(200).json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      data: newsData
    });

  } catch (error) {
    console.error('News collection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
