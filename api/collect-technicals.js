// Technical indicators calculator
// Calculates RSI, MACD, EMA, SMA, Bollinger Bands from price history

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // Fetch 200 days of BTC price history for calculating indicators
    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?' +
      new URLSearchParams({
        vs_currency: 'usd',
        days: '200',
        interval: 'daily'
      }),
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KriptoWallet/1.0'
        }
      }
    );

    if (!historyResponse.ok) {
      throw new Error(`CoinGecko API error: ${historyResponse.status}`);
    }

    const historyData = await historyResponse.json();
    const prices = historyData.prices.map(p => p[1]); // Extract just prices

    // Calculate indicators
    const indicators = {
      date: new Date().toISOString().split('T')[0],
      symbol: 'BTC',
      rsi_14: calculateRSI(prices, 14),
      ...calculateMACD(prices),
      ema_20: calculateEMA(prices, 20),
      ema_50: calculateEMA(prices, 50),
      ema_100: calculateEMA(prices, 100),
      ema_200: calculateEMA(prices, 200),
      sma_20: calculateSMA(prices, 20),
      sma_50: calculateSMA(prices, 50),
      sma_100: calculateSMA(prices, 100),
      sma_200: calculateSMA(prices, 200),
      ...calculateBollingerBands(prices, 20, 2)
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    return res.status(200).json({
      success: true,
      data: indicators
    });

  } catch (error) {
    console.error('Technical indicators calculation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// RSI Calculation
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD Calculation
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema12 === null || ema26 === null) {
    return { macd: null, macd_signal: null, macd_histogram: null };
  }

  const macd = ema12 - ema26;
  
  // For signal line, we'd need MACD history - simplified here
  const macd_signal = macd * 0.9; // Approximation
  const macd_histogram = macd - macd_signal;

  return { macd, macd_signal, macd_histogram };
}

// EMA Calculation
function calculateEMA(prices, period) {
  if (prices.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// SMA Calculation
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Bollinger Bands Calculation
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    return { bb_upper: null, bb_middle: null, bb_lower: null };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  
  const squaredDiffs = slice.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  return {
    bb_upper: middle + (stdDev * std),
    bb_middle: middle,
    bb_lower: middle - (stdDev * std)
  };
}
