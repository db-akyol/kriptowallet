# DenoWallet — Kripto Portföy Takibi ve AI Piyasa Analisti

DenoWallet, birden fazla borsa ve cüzdandaki kripto varlıklarınızı tek ekranda toplayan, canlı fiyatlarla kâr/zarar hesaplayan ve yapay zekâ destekli günlük Bitcoin piyasa analizi sunan bir web uygulamasıdır. Portföy verileri tarayıcınızda (localStorage) saklanır; fiyatlar CoinGecko üzerinden, analizler ise Vercel serverless fonksiyonları aracılığıyla toplanan piyasa/teknik/on-chain/haber verileri kullanılarak LLM ile üretilir. Kendi varlık dağılımını disiplinli takip etmek isteyen bireysel kripto yatırımcıları için tasarlanmıştır. Arayüz tamamen Türkçedir ve AI analisti de Türkçe yanıt verir.

[![Vue](https://img.shields.io/badge/Vue-3.3-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Özellikler

### Portföy Yönetimi
- **Çoklu portföy desteği** — 20 hazır borsa/cüzdan tanımı (Binance, Coinbase, Kraken, KuCoin, Bybit, OKX, Gate.io, Bitfinex, MEXC, BingX, Bitget, Crypto.com, HTX, Gemini, Bitstamp, Paribu, BtcTurk, MetaMask, Trust Wallet, Cold Wallet) arasından seçerek istediğiniz kadar portföy oluşturma.
- **Genel Bakış (aggregate) görünümü** — Tüm portföylerdeki aynı coinler tek satırda birleştirilir; ağırlıklı ortalama alış fiyatı, toplam bakiye ve toplam değer otomatik hesaplanır.
- **İşlem bazlı maliyet takibi** — Her alım `{miktar, fiyat, tarih}` olarak kaydedilir; yeni alımlarda ortalama alış fiyatı ağırlıklı olarak yeniden hesaplanır.
- **Kâr/zarar hesaplaması** — Varlık ve portföy seviyesinde PnL tutarı, PnL yüzdesi, 24 saatlik ağırlıklı değişim ve dağılım (allocation) yüzdesi.
- **Varlık düzenleme ve silme** — Miktar ve ortalama alış fiyatını düzenleme modalı, silme işlemleri için onay modalı.
- **1000+ coin arasından arama** — CoinGecko `coins/markets` uç noktasından 4 sayfa (250'şer kayıt) paralel çekilir, market cap'e göre sıralanır ve modal içinde canlı filtrelenir.

### Canlı Fiyat Katmanı
- **30 saniyede bir otomatik fiyat güncelleme** (`setInterval`) ve kenar çubuğundan manuel yenileme butonu.
- **Rate-limit dayanıklılığı** — HTTP 429 durumunda artan bekleme süresiyle (incremental backoff) 3 denemeye kadar yeniden deneme; fiyat geçmişi istekleri için bellek içi cache.
- **Kalıcılık ve veri göçü** — Portföyler `localStorage`'a yazılır; eski kayıtlarda eksik `coingeckoId` alanları açılışta otomatik olarak doldurulur (migration).

### Grafikler
- **Portföy değer geçmişi grafiği** — 24h / 7d / 30d / 90d / all zaman aralıkları. Her zaman noktası için, o tarihteki işlem geçmişinden bakiye ve CoinGecko `market_chart/range` verisinden en yakın fiyat bulunarak portföy değeri geriye dönük yeniden inşa edilir; seçilen dönem için başlangıç/bitiş değeri ve dönemsel PnL üretilir.
- **Varlık dağılımı grafiği** — Değere göre sıralanmış doughnut grafik (Chart.js).

### AI Kripto Analist
- **Günlük piyasa analizi** — Fiyat, global market cap, RSI(14), SMA 7/20, 7 ve 30 günlük değişim, volatilite, hash rate, mempool, işlem sayısı ve güncel haber başlıkları tek bir prompt'ta toplanır; LLM'den destek/direnç seviyeleri, hedef fiyat, yön tahmini ve risk/fırsat listesi içeren yapılandırılmış Türkçe analiz istenir.
- **Sentiment rozeti** — Üretilen metinden BOĞA / AYI / NÖTR duyarlılığı çıkarılır ve başlıkta rozet olarak gösterilir.
- **Markdown bölüm ayrıştırma** — Analiz metni başlıklarına göre parçalanır, her bölüme uygun ikon atanarak kart düzeninde render edilir.
- **Sohbet arayüzü** — Serbest soru sorma, hazır soru önerileri, yazıyor animasyonu. Güncel analizin ilk 1000 karakteri bağlam (context) olarak modele iletilir.

### Veri Toplama Servisleri (serverless)
| Uç nokta | Kaynak | Ürettiği veri |
|---|---|---|
| `/api/collect-market` | CoinGecko | BTC/ETH fiyat, 24s değişim, market cap, hacim, toplam piyasa değeri |
| `/api/collect-technicals` | CoinGecko (200 günlük geçmiş) | RSI(14), MACD, EMA 20/50/100/200, SMA 20/50/100/200, Bollinger Bantları |
| `/api/collect-onchain` | blockchain.info | Hash rate, difficulty, işlem sayısı, mempool boyutu, kazılan blok/BTC |
| `/api/collect-news` | CryptoPanic | Son 10 BTC/ETH haberi + oy tabanlı sentiment |
| `/api/collect-derivatives` | Coinglass | Open interest, funding rate, long/short oranı |
| `/api/aggregate-data` | Yukarıdakiler (paralel) | Hepsini birleştirip Supabase tablolarına upsert eder |
| `/api/generate-analysis` | Tüm kaynaklar + LLM | Günlük analizi üretir ve `ai_analyses` tablosuna yazar |
| `/api/get-analysis` | Supabase | En güncel analizi döner |
| `/api/chat` | LLM | Bağlam destekli soru-cevap |
| `/api/coingecko/*` | CoinGecko | CORS ve 30 sn edge cache'li proxy |

> **Not:** Teknik indikatör hesaplamaları (RSI, MACD, EMA, SMA, Bollinger) harici bir kütüphane kullanılmadan sıfırdan JavaScript ile yazılmıştır.

---

## Teknolojiler

### Bağımlılıklar
| Paket | Sürüm | Kullanım amacı |
|---|---|---|
| `vue` | ^3.3.11 | Composition API ve `<script setup>` ile SFC tabanlı arayüz |
| `vue-router` | ^4.6.3 | HTML5 history modunda istemci tarafı yönlendirme, lazy-loaded route'lar |
| `chart.js` | ^4.4.1 | Portföy geçmişi (line) ve varlık dağılımı (doughnut) grafikleri |
| `axios` | ^1.7.9 | `useCoinPrices` içindeki fiyat isteklerinde HTTP istemcisi |
| `@supabase/supabase-js` | ^2.87.2 | Serverless fonksiyonlardan PostgreSQL okuma/yazma |

### Geliştirme Bağımlılıkları
| Paket | Sürüm | Kullanım amacı |
|---|---|---|
| `vite` | ^5.4.11 | Geliştirme sunucusu, dev proxy ve üretim derlemesi |
| `@vitejs/plugin-vue` | ^4.5.2 | Vue SFC derleyicisi |
| `tailwindcss` | ^3.4.0 | Utility-first stil katmanı (koyu tema, glassmorphism, gradient'ler) |
| `postcss` | ^8.4.32 | CSS işleme hattı |
| `autoprefixer` | ^10.4.16 | Tarayıcı ön ek desteği |

**Harici servisler:** CoinGecko API, blockchain.info API, CryptoPanic API, Coinglass API, Groq (`llama-3.3-70b-versatile`), Google Gemini (`gemini-2.0-flash-exp`, yedek), Supabase (PostgreSQL), Vercel.

---

## Mimari

Uygulama üç katmandan oluşur ve her katman yalnızca bir alt katmanla konuşur:

```
┌──────────────────────────────────────────────────────────────────┐
│  1. FRONTEND  (Vue 3 SPA — tarayıcı)                             │
│                                                                  │
│  MainLayout ─ AppHeader ─ <router-view>                          │
│    ├─ /            Dashboard   → PortfolioSidebar, HoldingsTable │
│    │                             + Chart.js (history/allocation) │
│    ├─ /markets     MarketsView   (yapım aşamasında)              │
│    ├─ /portfolio   PortfolioView (yapım aşamasında)              │
│    └─ /ai-analyst  AIAnalystView (analiz + sohbet sekmeleri)     │
│                                                                  │
│  Durum yönetimi: composables (singleton ref'ler)                 │
│    usePortfolios · useCoins · useCoinPrices · usePortfolio       │
│  Kalıcılık: localStorage ("crypto-portfolios")                   │
└───────────────┬──────────────────────────────────────────────────┘
                │  fetch / axios  →  /api/*
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. SERVERLESS API  (Vercel Functions — Node.js, api/*.js)       │
│                                                                  │
│  • coingecko.js         CORS proxy + edge cache (s-maxage=30)    │
│  • collect-*.js         Harici kaynaklardan veri toplama         │
│  • aggregate-data.js    Paralel toplama + Supabase'e upsert      │
│  • generate-analysis.js Prompt inşası + LLM çağrısı + kayıt      │
│  • get-analysis.js      En güncel analizi okuma                  │
│  • chat.js              Bağlam destekli soru-cevap               │
│                                                                  │
│  Sırlar yalnızca burada: SUPABASE_SERVICE_KEY, LLM anahtarları   │
└───────────────┬──────────────────────────────────────────────────┘
                │  @supabase/supabase-js (service key)
                ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. VERİTABANI  (Supabase / PostgreSQL — supabase/schema.sql)    │
│                                                                  │
│  market_data · technical_indicators · news_data · onchain_data   │
│  derivatives_data · ai_analyses · chat_history                   │
│  Tarih alanları UNIQUE + indeksli → günlük idempotent upsert     │
└──────────────────────────────────────────────────────────────────┘
```

**Tasarım kararları:**

- **Portföy verisi sunucuya gitmez.** Bakiyeler, işlemler ve maliyetler yalnızca tarayıcının `localStorage`'ında tutulur; veritabanı sadece piyasa verisi ve AI analizleri için kullanılır. Böylece uygulama hesap açmadan çalışır.
- **CoinGecko proxy'si** hem CORS sorununu çözer hem de `Cache-Control: s-maxage=30, stale-while-revalidate=60` ile Vercel edge cache üzerinden rate-limit baskısını azaltır. Geliştirme ortamında aynı yol Vite dev proxy'si ile CoinGecko'ya yönlendirilir, böylece frontend kodu iki ortamda da değişmeden çalışır.
- **Toplayıcı fonksiyonlar bağımsızdır.** `aggregate-data` alt toplayıcıları `Promise.all` ile paralel çağırır ve her biri başarısız olursa `{ success: false }` ile sessizce düşer — tek bir kaynağın çökmesi tüm toplamayı bozmaz.
- **LLM sağlayıcısı takas edilebilir.** `generate-analysis` önce `GROQ_API_KEY` arar, yoksa Gemini'ye düşer; ikisi de yoksa açık bir hata döner.
- **Idempotent günlük kayıt.** Tüm ölçüm tabloları `date` üzerinde `UNIQUE` olduğundan toplama işi gün içinde defalarca çalıştırılabilir; kayıt mükerrerleşmez.

---

## Ortam Değişkenleri

Depoda `.env.example` bulunur; kurulum için bu dosyayı `.env` olarak kopyalayın. **`.env` dosyası `.gitignore` ile dışlanmıştır, asla depoya eklemeyin.**

### `.env.example` içindeki değişkenler

| Değişken | Katman | Açıklama |
|---|---|---|
| `VITE_SUPABASE_URL` | Tarayıcı | Supabase proje URL'i. `src/lib/supabase.js` içindeki istemciyi kurar; tanımlı değilse istemci `null` olur ve uygulama uyarı verip çalışmaya devam eder. |
| `VITE_SUPABASE_ANON_KEY` | Tarayıcı | Supabase publishable (anon) anahtarı. `VITE_` öneki taşıdığı için derlemeye gömülür — buraya yalnızca herkese açık anahtar yazılmalıdır. |
| `SUPABASE_URL` | Sunucu | `api/` altındaki serverless fonksiyonların kullandığı Supabase proje URL'i. |
| `SUPABASE_SERVICE_KEY` | Sunucu | Service role (gizli) anahtar. `aggregate-data`, `generate-analysis` ve `get-analysis` tabloları okur/yazar. Tarayıcıya asla sızdırılmamalıdır. |

### Kodun ayrıca okuduğu sunucu tarafı değişkenler

Aşağıdaki iki değişken `.env.example` dosyasında yer almaz, ancak AI özelliklerinin çalışması için gereklidir (`api/chat.js`, `api/generate-analysis.js`):

| Değişken | Açıklama |
|---|---|
| `GROQ_API_KEY` | Groq API anahtarı. Hem sohbet hem günlük analiz için birincil sağlayıcıdır (`llama-3.3-70b-versatile`). `/api/chat` yalnızca bu anahtarla çalışır. |
| `GEMINI_API_KEY` | Google Gemini API anahtarı. `GROQ_API_KEY` tanımlı değilse günlük analiz üretiminde yedek sağlayıcı olarak kullanılır (`gemini-2.0-flash-exp`). |

> Supabase ve LLM anahtarları tanımlanmadan da uygulama açılır: portföy takibi ve canlı fiyatlar çalışmaya devam eder, yalnızca AI Analist sekmesi boş durum gösterir.

---

## Kurulum

**Gereksinimler:** Node.js 18+ (yerleşik `fetch` API'si serverless fonksiyonlarda kullanılıyor) ve npm.

```bash
# 1. Depoyu klonlayın
git clone https://github.com/<kullanici-adi>/kripto-app.git
cd kripto-app

# 2. Bağımlılıkları yükleyin
npm install

# 3. Ortam değişkenlerini hazırlayın
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
```

`.env` dosyasını açıp kendi değerlerinizi girin. AI özelliklerini kullanacaksanız `GROQ_API_KEY` (veya `GEMINI_API_KEY`) satırını da ekleyin.

**Veritabanı kurulumu (opsiyonel, yalnızca AI Analist için):** Supabase panelinde yeni bir proje oluşturun, SQL Editor'ü açın ve `supabase/schema.sql` dosyasının içeriğini çalıştırın. Bu betik 7 tabloyu ve tarih indekslerini `IF NOT EXISTS` ile oluşturur, dolayısıyla tekrar çalıştırılabilir.

---

## Çalıştırma

```bash
npm run dev       # Vite geliştirme sunucusu (varsayılan: http://localhost:5173)
npm run build     # Üretim derlemesi → dist/
npm run preview   # Derlenmiş çıktıyı yerelde önizleme
```

`npm run dev` ile çalışırken `/api/coingecko/*` istekleri Vite proxy'si üzerinden doğrudan CoinGecko'ya iletilir; bu sayede fiyat takibi ve portföy özellikleri serverless fonksiyonlara ihtiyaç duymadan çalışır.

`api/` altındaki fonksiyonları yerelde ayağa kaldırmak için Vercel CLI kullanılabilir:

```bash
npx vercel dev
```

---

## Dağıtım (Deployment)

Proje Vercel üzerinde çalışacak şekilde yapılandırılmıştır.

1. Depoyu Vercel'e import edin. Vite projesi otomatik algılanır: build komutu `npm run build`, çıktı dizini `dist`.
2. **Settings → Environment Variables** altına `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY` (ve isterseniz `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) değerlerini ekleyin.
3. `api/` dizinindeki her `.js` dosyası ayrı bir Serverless Function olarak dağıtılır; ek yapılandırma gerekmez.

`vercel.json` şunları yapar:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/api/coingecko/(.*)", "destination": "/api/coingecko" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- İlk rewrite, `/api/coingecko/` altındaki tüm alt yolları tek bir proxy fonksiyonuna yönlendirir (fonksiyon yolu kendisi `req.url` üzerinden ayrıştırır).
- İkinci rewrite, `/api/` ile başlamayan tüm istekleri `index.html`'e düşürerek SPA history modunda derin bağlantıların (`/ai-analyst` gibi) doğrudan açılmasını sağlar.

`vite.config.js` içindeki rollup çıktısı, hash'siz sabit dosya adları (`assets/[name].js`) üretecek şekilde ayarlanmıştır.

**Günlük analizi otomatikleştirme:** `/api/aggregate-data` ve `/api/generate-analysis` uç noktaları GET ile tetiklenebildiği için bir zamanlayıcıya (Vercel Cron, GitHub Actions vb.) bağlanarak günlük çalıştırılabilir.

---

## Proje Yapısı

```
kripto-app/
├── api/                          # Vercel Serverless Functions (Node.js)
│   ├── coingecko.js              # CoinGecko CORS proxy + edge cache
│   ├── collect-market.js         # BTC/ETH + global piyasa verisi
│   ├── collect-technicals.js     # RSI, MACD, EMA, SMA, Bollinger (elle hesaplanır)
│   ├── collect-onchain.js        # blockchain.info zincir metrikleri
│   ├── collect-news.js           # CryptoPanic haber akışı + sentiment
│   ├── collect-derivatives.js    # Coinglass OI / funding / long-short
│   ├── aggregate-data.js         # Paralel toplama + Supabase upsert
│   ├── generate-analysis.js      # Prompt inşası + Groq/Gemini + kayıt
│   ├── get-analysis.js           # En güncel analizi döner
│   └── chat.js                   # Bağlam destekli AI sohbet
│
├── src/
│   ├── main.js                   # Uygulama giriş noktası
│   ├── App.vue                   # Kök bileşen
│   ├── router/index.js           # 4 route (biri eager, üçü lazy)
│   ├── layouts/
│   │   └── MainLayout.vue        # Gradient arka plan + geçiş animasyonlu router-view
│   ├── views/
│   │   ├── Dashboard.vue         # Ana ekran: grafikler + tablo + sidebar
│   │   ├── AIAnalystView.vue     # Analiz kartları + sohbet arayüzü
│   │   ├── MarketsView.vue       # Placeholder (yapım aşamasında)
│   │   └── PortfolioView.vue     # Placeholder (yapım aşamasında)
│   ├── components/
│   │   ├── PortfolioSidebar.vue  # Portföy listesi, Genel Bakış, yenileme
│   │   ├── HoldingsTable.vue     # Varlık tablosu (fiyat, PnL, dağılım)
│   │   ├── AddCoinModal.vue      # Coin arama + işlem girişi
│   │   ├── AddPortfolioModal.vue # Borsa/cüzdan seçimi
│   │   ├── EditCoinModal.vue     # Miktar ve ortalama maliyet düzenleme
│   │   ├── DeleteConfirmModal.vue# Ortak silme onayı
│   │   ├── AppHeader.vue         # Üst navigasyon
│   │   └── charts/               # Bağımsız Chart.js sarmalayıcıları
│   ├── composables/
│   │   ├── usePortfolios.js      # Ana durum: CRUD, fiyat döngüsü, geçmiş, PnL
│   │   ├── useCoins.js           # 1000 coin listesi (4 sayfa paralel)
│   │   ├── useCoinPrices.js      # Backoff'lu fiyat çekme
│   │   ├── usePortfolio.js       # Eski/basit portföy yardımcısı
│   │   └── useDefaultPortfolios.js
│   ├── data/exchanges.js         # 20 borsa/cüzdan tanımı
│   ├── lib/supabase.js           # Tarayıcı tarafı Supabase istemcisi (opsiyonel)
│   ├── style.css                 # Global stiller + özel scrollbar
│   └── tailwind.css              # Tailwind direktifleri
│
├── supabase/schema.sql           # 7 tablo + indeksler (PostgreSQL)
├── vite.config.js                # Vue plugin, dev proxy, rollup çıktı adları
├── tailwind.config.js            # İçerik tarama yolları
├── postcss.config.js             # Tailwind + autoprefixer
├── vercel.json                   # SPA rewrite + proxy rewrite
└── .env.example                  # Ortam değişkeni şablonu
```

---

## Yol Haritası

- `/markets` — Genel piyasa ekranı (şu an placeholder)
- `/portfolio` — Detaylı portföy analiz araçları (şu an placeholder)
- Coinglass verilerinin API anahtarıyla tam entegrasyonu (`liquidations_24h` alanı şemada hazır)
- `chat_history` tablosunun sohbet arayüzüne bağlanması (şema hazır, henüz yazılmıyor)

---

## Sorumluluk Reddi

Bu uygulama ve ürettiği AI analizleri **yatırım tavsiyesi değildir**. Kripto para piyasaları yüksek volatilite içerir; kararlarınızı kendi araştırmanıza dayandırın.

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. Telif hakkı © 2025 Deniz Akyol.
