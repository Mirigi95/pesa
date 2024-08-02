const express = require('express');
const ccxt = require('ccxt');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files (like HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize exchanges with timeout options
const exchanges = [
    new ccxt.bybit({ timeout: 30000 }),    // Bybit with 30 seconds timeout
    new ccxt.kraken({ timeout: 30000 }),   // Kraken with 30 seconds timeout
   // new ccxt.binance({ timeout: 30000 }),  // Binance with 30 seconds timeout
    new ccxt.okx({ timeout: 30000 }),      // OKX with 30 seconds timeout
    new ccxt.huobi({ timeout: 30000 }),    // Huobi with 30 seconds timeout
    new ccxt.mexc({ timeout: 30000 }) ,
    new ccxt.bingx({ timeout: 30000 }),
    new ccxt.bitfinex({ timeout: 30000 }),
    new ccxt.bitget({ timeout: 30000 }),
    new ccxt.cryptocom({ timeout: 30000 })                 // MEXC with 30 seconds timeout
];

async function fetchSymbols() {
    const promises = exchanges.map(async (exchange) => {
        try {
            const symbols = await exchange.loadMarkets();
           // console.log(symbols);
            return { [exchange.id]: Object.keys(symbols) };
        } catch (e) {
            console.error(`Error fetching markets from ${exchange.id}:`, e);
            return { [exchange.id]: [] };
        }
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
}

function findCommonSymbols(symbolsPerExchange) {
    let commonSymbols = new Set(Object.values(symbolsPerExchange)[0]);
    for (const symbols of Object.values(symbolsPerExchange)) {
        commonSymbols = new Set([...commonSymbols].filter(x => symbols.includes(x)));
    }
    return commonSymbols;
}

async function fetchPricesForCommonSymbols(commonSymbols) {
    const promises = [...commonSymbols].map(async (symbol) => {
        const prices = await Promise.all(exchanges.map(async (exchange) => {
            try {
                const ticker = await exchange.fetchTicker(symbol);
                return { [exchange.id]: ticker['last'] };
            } catch (e) {
                console.error(`Error fetching ticker for ${symbol} from ${exchange.id}:`, e);
                return { [exchange.id]: undefined };
            }
        }));
        return { [symbol]: Object.assign({}, ...prices) };
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
}

function checkArbitrageOpportunities(commonSymbolPrices) {
    const arbitrageOpportunities = [];
    for (const [symbol, prices] of Object.entries(commonSymbolPrices)) {
        const exchangePrices = Object.entries(prices).filter(([_, price]) => price !== undefined);
        for (let i = 0; i < exchangePrices.length; i++) {
            for (let j = i + 1; j < exchangePrices.length; j++) {
                const [exchange1, price1] = exchangePrices[i];
                const [exchange2, price2] = exchangePrices[j];
                const priceDifference = Math.abs(price1 - price2);
                const percentageDifference = (priceDifference / ((price1 + price2) / 2)) * 100;
                if (percentageDifference > 0.3) {
                    arbitrageOpportunities.push({
                        symbol,
                        exchange1,
                        price1,
                        exchange2,
                        price2,
                        percentageDifference: percentageDifference.toFixed(2)
                    });
                }
            }
        }
    }
    return arbitrageOpportunities;
}

app.get('/arbitrage', async (_req, res) => {
    try {
        const symbolsPerExchange = await fetchSymbols();
        const commonSymbols = findCommonSymbols(symbolsPerExchange);
        const commonSymbolPrices = await fetchPricesForCommonSymbols(commonSymbols);
        const arbitrageOpportunities = checkArbitrageOpportunities(commonSymbolPrices);
        console.log(arbitrageOpportunities)
        res.json(arbitrageOpportunities);
    } catch (e) {
        console.error("Error in /arbitrage route:", e);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app; // Export the app for Vercel
