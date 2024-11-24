const stocks = [
  // 网易：总市值 557.16亿美元
  { symbol: 'NTES', name: '网易', market: 'US', currency: '$', shares: 0.644e9 },
  { symbol: '9999.HK', name: '网易', market: 'HK', currency: 'HK$', shares: 3.222e9 },
  // 百度：总市值 281.68亿美元
  { symbol: 'BIDU', name: '百度', market: 'US', currency: '$', shares: 0.3507e9 },
  { symbol: '9888.HK', name: '百度', market: 'HK', currency: 'HK$', shares: 2.805e9 },
  // 京东：总市值 502.69亿美元
  { symbol: 'JD', name: '京东', market: 'US', currency: '$', shares: 1.4495e9 },
  { symbol: '9618.HK', name: '京东', market: 'HK', currency: 'HK$', shares: 2.899e9 },
  // 阿里巴巴：总市值 1989亿美元
  { symbol: 'BABA', name: '阿里巴巴', market: 'US', currency: '$', shares: 2.393e9 },
  { symbol: '9988.HK', name: '阿里巴巴', market: 'HK', currency: 'HK$', shares: 19.083e9 },
  // 腾讯：总市值 3.71万亿港元
  { symbol: '0700.HK', name: '腾讯', market: 'HK', currency: 'HK$', shares: 9.261e9 },
  // 美团：总市值 1.02万亿港元
  { symbol: '3690.HK', name: '美团', market: 'HK', currency: 'HK$', shares: 6.104e9 },
  // 特斯拉：总市值 1.13万亿美元
  { symbol: 'TSLA', name: '特斯拉', market: 'US', currency: '$', shares: 3.20e9 },
  // 英伟达：总市值 3.48万亿美元
  { symbol: 'NVDA', name: '英伟达', market: 'US', currency: '$', shares: 24.51e9 },  // 更新股本以匹配实际市值
  // 微软：总市值 3.10万亿美元
  { symbol: 'MSFT', name: '微软', market: 'US', currency: '$', shares: 7.429e9 },
  // 谷歌：总市值 2.13万亿美元
  { symbol: 'GOOG', name: '谷歌', market: 'US', currency: '$', shares: 12.8e9 }
];

async function fetchStockData(symbol) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    )}`;

    const response = await fetch(proxyUrl);
    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents);

    const result = data.chart.result[0];
    const quote = result.meta;
    const previousClose = result.meta.previousClose;
    const currentPrice = quote.regularMarketPrice;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      price: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2)
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

function calculateMarketCap(price, shares, currency) {
  const marketCap = price * shares;

  if (currency === 'HK$') {
    if (marketCap >= 1e12) {
      return `${currency}${(marketCap / 1e12).toFixed(2)}万亿`;
    } else {
      return `${currency}${(marketCap / 1e8).toFixed(2)}亿`;
    }
  } else {
    return `${currency}${(marketCap / 1e8).toFixed(2)}亿`;
  }
}

function createStockCard(stock, data) {
  const isPositive = parseFloat(data.change) >= 0;
  const marketClass = stock.market === 'US' ? 'us-market' : 'hk-market';
  const marketCap = calculateMarketCap(parseFloat(data.price), stock.shares, stock.currency);

  return `
    <div class="stock-card">
      <div class="stock-header">
        <span class="stock-name">${stock.name}</span>
        <span class="market-tag ${marketClass}">${stock.market}</span>
      </div>
      <div class="stock-symbol">${stock.symbol}</div>
      <div class="price">${stock.currency}${data.price}</div>
      <div class="change ${isPositive ? 'positive' : 'negative'}">
        ${isPositive ? '+' : ''}${data.change} (${isPositive ? '+' : ''}${data.changePercent}%)
      </div>
      <div class="market-cap">市值: ${marketCap}</div>
    </div>
  `;
}

function updateTimeDisplay() {
  const now = new Date();
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  document.getElementById('updateTime').textContent =
    `最后更新: ${now.toLocaleTimeString('zh-CN', options)}`;
}

async function updateStockInfo() {
  const container = document.getElementById('stockContainer');
  container.innerHTML = '<div class="loading">正在加载股票数据...</div>';

  try {
    const stocksData = await Promise.all(stocks.map(async (stock) => {
      const data = await fetchWithRetry(stock.symbol);
      return { stock, data };
    }));

    const groupedStocks = {};
    stocksData.forEach(({ stock, data }) => {
      if (data) {
        if (!groupedStocks[stock.name]) {
          groupedStocks[stock.name] = [];
        }
        groupedStocks[stock.name].push({ stock, data });
      }
    });

    // 修改显示顺序
    const topRow = ['网易', '百度', '京东', '阿里巴巴'];
    const middleRow = ['腾讯', '美团', '特斯拉', '英伟达'];
    const bottomRow = ['微软', '谷歌'];

    const createRowHtml = (companies) => {
      return companies
        .map(company => {
          const stockData = groupedStocks[company] || [];
          if (stockData.length === 0) return '';

          return `
            <div class="company-group">
              <div class="company-name">${company}</div>
              <div class="stocks-row">
                ${stockData.map(({ stock, data }) => createStockCard(stock, data)).join('')}
              </div>
            </div>
          `;
        })
        .join('');
    };

    const topRowHtml = createRowHtml(topRow);
    const middleRowHtml = createRowHtml(middleRow);
    const bottomRowHtml = createRowHtml(bottomRow);

    container.innerHTML = `
      <div class="stock-row">${topRowHtml}</div>
      <div class="stock-row">${middleRowHtml}</div>
      <div class="stock-row">${bottomRowHtml}</div>
    `;

    updateTimeDisplay();
  } catch (error) {
    container.innerHTML = '<div class="error">获取数据失败，请稍后重试</div>';
    console.error('Error updating stock info:', error);
  }
}

async function fetchWithRetry(symbol, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const data = await fetchStockData(symbol);
      if (data) return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${symbol}`);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', updateStockInfo);
document.getElementById('refreshBtn').addEventListener('click', updateStockInfo);
setInterval(updateStockInfo, 5 * 60 * 1000);