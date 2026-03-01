const axios = require('axios');

async function testApi(name, url) {
    try {
        const start = Date.now();
        await axios.get(url, { timeout: 5000 });
        console.log(`[PASS] ${name} reached in ${Date.now() - start}ms`);
    } catch (e) {
        console.log(`[FAIL] ${name} failed: ${e.message}`);
    }
}

async function run() {
    await testApi('Binance REST', 'https://api.binance.com/api/v3/ping');
    await testApi('OKX REST', 'https://www.okx.com/api/v5/public/instruments?instType=SPOT');
    await testApi('MEXC REST', 'https://api.mexc.com/api/v3/ping');
    await testApi('Gate.io REST', 'https://api.gateio.ws/api/v4/spot/currencies');
    await testApi('Kucoin REST', 'https://api.kucoin.com/api/v1/timestamp');
}

run();
