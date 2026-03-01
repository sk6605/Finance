const axios = require('axios');
async function run() {
    try {
        const t = await axios.get('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=PAXG_USDT');
        console.log("Ticker:", t.data);
        const k = await axios.get('https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=PAXG_USDT&interval=1m&limit=2');
        console.log("Kline:", k.data);
    } catch (e) {
        console.error(e.message);
    }
}
run();
