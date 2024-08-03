// netlify-functions/arbitrage.js
const ccxt = require('ccxt');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // Initialize exchanges with timeout options
        const exchanges = [
            new ccxt.bybit({ timeout: 30000 }),    // Bybit with 30 seconds timeout
            new ccxt.kraken({ timeout: 30000 }),   // Kraken with 30 seconds timeout
            new ccxt.binance({ timeout: 30000 }),  // Binance with 30 seconds timeout
            new ccxt.okx({ timeout: 30000 }),      // OKX with 30 seconds timeout
            new ccxt.huobi({ timeout: 30000 }),    // Huobi with 30 seconds timeout
            new ccxt.mexc({ timeout: 30000 }),
            new ccxt.bingx({ timeout: 30000 }),
            new ccxt.bitfinex({ timeout: 30000 }),
            new ccxt.bitget({ timeout: 30000 }),
            new ccxt.cryptocom({ timeout: 30000 })  // Crypto.com with 30 seconds timeout
        ];

        async function fetchSymbols() {
            const promises = exchanges.map(async (exchange) => {
                try {
                    const symbols = await exchange.loadMarkets();
                    return { [exchange.id]: Object.keys(symbols) };
                } catch (e) {
                    if (e instanceof ccxt.RateLimitExceeded) {
                        console.error(`Rate limit exceeded for ${exchange.id}:`, e.message);
                    } else if (e instanceof ccxt.ExchangeNotAvailable) {
                        console.error(`Exchange not available for ${exchange.id}:`, e.message);
                    } else if (e instanceof ccxt.NetworkError) {
                        console.error(`Network error for ${exchange.id}:`, e.message);
                    } else {
                        console.error(`Error fetching markets from ${exchange.id}:`, e.message);
                    }
                    return { [exchange.id]: [] };
                }
            });

            try {
                const results = await Promise.all(promises);
                return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
            } catch (e) {
                console.error("Error in fetchSymbols:", e.message);
                throw e; // Rethrow error to be caught in the handler
            }
        }

        function findCommonSymbols(symbolsPerExchange) {
            try {
                let commonSymbols = new Set(Object.values(symbolsPerExchange)[0]);
                for (const symbols of Object.values(symbolsPerExchange)) {
                    commonSymbols = new Set([...commonSymbols].filter(x => symbols.includes(x)));
                }
                return commonSymbols;
            } catch (e) {
                console.error("Error in findCommonSymbols:", e.message);
                throw e; // Rethrow error to be caught in the handler
            }
        }

        async function fetchPricesForCommonSymbols(commonSymbols) {
            const promises = [...commonSymbols].map(async (symbol) => {
                const prices = await Promise.all(exchanges.map(async (exchange) => {
                    try {
                        const ticker = await exchange.fetchTicker(symbol);
                        return { [exchange.id]: ticker['last'] };
                    } catch (e) {
                        if (e instanceof ccxt.RateLimitExceeded) {
                            console.error(`Rate limit exceeded for ${exchange.id}:`, e.message);
                        } else if (e instanceof ccxt.ExchangeNotAvailable) {
                            console.error(`Exchange not available for ${exchange.id}:`, e.message);
                        } else if (e instanceof ccxt.NetworkError) {
                            console.error(`Network error for ${exchange.id}:`, e.message);
                        } else {
                            console.error(`Error fetching ticker for ${symbol} from ${exchange.id}:`, e.message);
                        }
                        return { [exchange.id]: undefined };
                    }
                }));
                return { [symbol]: Object.assign({}, ...prices) };
            });

            try {
                const results = await Promise.all(promises);
                return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
            } catch (e) {
                console.error("Error in fetchPricesForCommonSymbols:", e.message);
                throw e; // Rethrow error to be caught in the handler
            }
        }

        function checkArbitrageOpportunities(commonSymbolPrices) {
            try {
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
            } catch (e) {
                console.error("Error in checkArbitrageOpportunities:", e.message);
                throw e; // Rethrow error to be caught in the handler
            }
        }

        // Handle request
        const symbolsPerExchange = await fetchSymbols();
        const commonSymbols = findCommonSymbols(symbolsPerExchange);
        const commonSymbolPrices = await fetchPricesForCommonSymbols(commonSymbols);
        const arbitrageOpportunities = checkArbitrageOpportunities(commonSymbolPrices);

        return {
            statusCode: 200,
            body: JSON.stringify(arbitrageOpportunities),
        };
    } catch (e) {
        console.error("Error in function:", e.message);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};
