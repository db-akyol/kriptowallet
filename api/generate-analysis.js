// Gemini AI Analysis Generator
// Generates daily crypto market analysis using collected data

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    // 1. Collect all current data from multiple sources
    const [btcDataRes, globalRes, onchainRes, btcHistoryRes, newsRes] = await Promise.all([
      // Market data
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&sparkline=false', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'KriptoWallet/1.0' }
      }).then(r => r.json()).catch(() => null),
      // Global market data
      fetch('https://api.coingecko.com/api/v3/global', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'KriptoWallet/1.0' }
      }).then(r => r.json()).catch(() => null),
      // On-chain data
      fetch('https://api.blockchain.info/stats', {
        headers: { 'Accept': 'application/json' }
      }).then(r => r.json()).catch(() => null),
      // Price history for technical indicators (30 days)
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'KriptoWallet/1.0' }
      }).then(r => r.json()).catch(() => null),
      // News from CryptoPanic
      fetch('https://cryptopanic.com/api/v1/posts/?auth_token=public&public=true&filter=hot&currencies=BTC,ETH', {
        headers: { 'Accept': 'application/json' }
      }).then(r => r.json()).catch(() => null)
    ]);

    const btc = Array.isArray(btcDataRes) ? btcDataRes.find(c => c.id === 'bitcoin') : null;
    const eth = Array.isArray(btcDataRes) ? btcDataRes.find(c => c.id === 'ethereum') : null;

    // Calculate technical indicators from price history
    let technicalData = null;
    if (btcHistoryRes?.prices && btcHistoryRes.prices.length > 14) {
      const prices = btcHistoryRes.prices.map(p => p[1]);
      technicalData = {
        rsi_14: calculateRSI(prices, 14),
        sma_7: calculateSMA(prices, 7),
        sma_20: calculateSMA(prices, 20),
        price_change_7d: prices.length >= 7 ? ((prices[prices.length-1] - prices[prices.length-7]) / prices[prices.length-7] * 100) : null,
        price_change_30d: prices.length >= 30 ? ((prices[prices.length-1] - prices[0]) / prices[0] * 100) : null,
        volatility: calculateVolatility(prices.slice(-7))
      };
    }

    // Parse news
    const newsData = (newsRes?.results || []).slice(0, 5).map(n => ({
      title: n.title,
      sentiment: n.votes?.positive > n.votes?.negative ? 'positive' : 
                 n.votes?.negative > n.votes?.positive ? 'negative' : 'neutral'
    }));

    // Market data
    const marketData = {
      btc_price: btc?.current_price,
      btc_24h_change: btc?.price_change_percentage_24h,
      btc_market_cap: btc?.market_cap,
      btc_volume: btc?.total_volume,
      eth_price: eth?.current_price,
      eth_24h_change: eth?.price_change_percentage_24h,
      total_market_cap: globalRes?.data?.total_market_cap?.usd,
      btc_dominance: globalRes?.data?.market_cap_percentage?.btc
    };

    // On-chain data
    const onchainData = {
      hash_rate: onchainRes?.hash_rate,
      difficulty: onchainRes?.difficulty,
      transaction_count: onchainRes?.n_tx,
      mempool_size: onchainRes?.mempool_size || 0,
      blocks_mined: onchainRes?.n_blocks_mined
    };

    const prompt = buildAnalysisPrompt({
      market: marketData,
      technicals: technicalData,
      news: newsData,
      onchain: onchainData,
      derivatives: null // Can be added later with Coinglass API key
    });

    // 3. Call AI API (Groq or Gemini)
    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    let analysisText = '';

    if (groqApiKey) {
      // Use Groq API (preferred - faster and more reliable)
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
      }

      const groqData = await groqResponse.json();
      analysisText = groqData.choices?.[0]?.message?.content || 'Analiz oluşturulamadı.';
      
    } else if (geminiApiKey) {
      // Fallback to Gemini
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Analiz oluşturulamadı.';
    } else {
      return res.status(500).json({
        success: false,
        error: 'No AI API key configured (GROQ_API_KEY or GEMINI_API_KEY required)'
      });
    }

    // 4. Parse the analysis
    const analysis = {
      date: new Date().toISOString().split('T')[0],
      analysis: analysisText,
      summary: extractSummary(analysisText),
      sentiment: extractSentiment(analysisText),
      timestamp: new Date().toISOString()
    };

    // 5. Save to Supabase if configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('ai_analyses').upsert({
        date: analysis.date,
        analysis: analysis.analysis,
        summary: analysis.summary,
        sentiment: analysis.sentiment
      }, { onConflict: 'date' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function buildAnalysisPrompt(data) {
  const today = new Date().toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `Sen deneyimli bir kripto para analistisin. Aşağıdaki verilere dayanarak bugünün (${today}) Bitcoin ve kripto piyasası hakkında kapsamlı bir Türkçe analiz yaz.

## PİYASA VERİLERİ
${data.market ? `
- Bitcoin Fiyatı: $${data.market.btc_price?.toLocaleString()}
- Bitcoin 24s Değişim: %${data.market.btc_24h_change?.toFixed(2)}
- Bitcoin Market Değeri: $${(data.market.btc_market_cap / 1e9)?.toFixed(2)}B
- Bitcoin Hacim: $${(data.market.btc_volume / 1e9)?.toFixed(2)}B
- Ethereum Fiyatı: $${data.market.eth_price?.toLocaleString()}
- Toplam Market Değeri: $${(data.market.total_market_cap / 1e12)?.toFixed(2)}T
` : 'Piyasa verileri mevcut değil.'}

## TEKNİK İNDİKATÖRLER
${data.technicals ? `
- RSI (14): ${data.technicals.rsi_14?.toFixed(2)} ${data.technicals.rsi_14 > 70 ? '(Aşırı Alım)' : data.technicals.rsi_14 < 30 ? '(Aşırı Satım)' : '(Nötr)'}
- SMA 7 Günlük: $${data.technicals.sma_7?.toLocaleString()}
- SMA 20 Günlük: $${data.technicals.sma_20?.toLocaleString()}
- 7 Günlük Değişim: %${data.technicals.price_change_7d?.toFixed(2)}
- 30 Günlük Değişim: %${data.technicals.price_change_30d?.toFixed(2)}
- 7 Günlük Volatilite: $${data.technicals.volatility?.toFixed(2)}
` : 'Teknik veriler mevcut değil.'}

## ON-CHAIN VERİLERİ
${data.onchain ? `
- Hash Rate: ${(data.onchain.hash_rate / 1e12)?.toFixed(2)} TH/s
- Mempool Boyutu: ${data.onchain.mempool_size} işlem
- Günlük İşlem: ${data.onchain.transaction_count?.toLocaleString()}
` : 'On-chain verileri mevcut değil.'}

## TÜREV VERİLERİ
${data.derivatives ? `
- Open Interest: $${data.derivatives.open_interest ? (data.derivatives.open_interest / 1e9)?.toFixed(2) + 'B' : 'N/A'}
- Funding Rate: ${data.derivatives.funding_rate ? (data.derivatives.funding_rate * 100)?.toFixed(4) + '%' : 'N/A'}
- Long/Short Oranı: ${data.derivatives.long_short_ratio?.toFixed(2) || 'N/A'}
` : 'Türev verileri mevcut değil.'}

## SON HABERLER
${data.news?.length > 0 ? data.news.slice(0, 5).map(n => `- ${n.title} (${n.sentiment})`).join('\n') : 'Haber verisi mevcut değil.'}

---

ÖNEMLİ TALİMATLAR:
- KESİN ve NET yorumlar yap, ortada kalma!
- Her zaman BOĞA veya AYI tarafını seç, "nötr" sadece gerçekten belirsizse
- Güçlü, kararlı ifadeler kullan: "kesinlikle", "açıkça", "şiddetle"
- Somut fiyat tahminleri ve hedefler ver
- Riskleri ve fırsatları net belirt
- Sentiment analizi sonucunu açıkça yaz

Lütfen şu formatta yanıt ver:

## 📊 GÜNLÜK ANALİZ

### 🎯 Bugünün Özeti
[2-3 cümle AMA keskin ve kararlı yorum. Net bir BOĞA veya AYI görüşü belirt.]

### 📈 Teknik Analiz
[RSI, SMA ve fiyat hareketlerine dayalı KESİN yorumlar. "Muhtemelen" yerine "kesinlikle" kullan.]

### 💰 Kritik Seviyeler
- **Güçlü Destek:** [fiyat] - [neden önemli]
- **Güçlü Direnç:** [fiyat] - [neden önemli]
- **Hedef Fiyat:** [kısa vadeli tahmin]

### 🔮 BENİM TAHMİNİM
**Yön:** [YUKARI ⬆️ / AŞAĞI ⬇️]
**Beklenen Hareket:** [% kaç hareket bekliyorsun, örn: %5-10 yükseliş]

**Yükselmesi İçin Gerekenler:**
- [koşul 1, örn: $88,000 direncini kırması]
- [koşul 2, örn: RSI'ın 60 üzerine çıkması]
- [koşul 3, örn: Hacmin artması]

**Düşmesi İçin Sebepler:**
- [risk 1, örn: $85,000 desteğini kaybetmesi]
- [risk 2, örn: Negatif haber akışı]
- [risk 3, örn: Global piyasalarda satış baskısı]

### ⚡ SONUÇ: [BOĞA 🐂 / AYI 🐻]
[Net ve kararlı 1-2 cümlelik değerlendirme. Ortada kalma!]

### 📰 Piyasa Duyarlılığı
[Haberlerden ve verilerden çıkarılan genel sentiment: Çok Olumlu / Olumlu / Olumsuz / Çok Olumsuz]

### ⚠️ Riskler ve Fırsatlar
**Fırsatlar:**
- [somut fırsat 1]
- [somut fırsat 2]

**Riskler:**
- [somut risk 1]
- [somut risk 2]`;
}

function extractSummary(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.slice(0, 3).join(' ').substring(0, 300);
}

function extractSentiment(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('boğa') || lowerText.includes('bullish') || lowerText.includes('yükseliş')) {
    return 'bullish';
  } else if (lowerText.includes('ayı') || lowerText.includes('bearish') || lowerText.includes('düşüş')) {
    return 'bearish';
  }
  return 'neutral';
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

// SMA Calculation
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Volatility Calculation (standard deviation)
function calculateVolatility(prices) {
  if (prices.length < 2) return null;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  return Math.sqrt(variance);
}
