const axios = require('axios');

async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post('https://valorexinthium.com/api/user/appUser/login', {
            email: 'liangszekai@gmail.com',
            password: 'Skai0509.',
            loginType: 1
        });

        let token = loginRes.data?.result?.token;
        let url = 'https://valorexinthium.com';

        console.log("Token:", token);

        if (token) {
            console.log("\nFetching symbols list...");
            const symRes = await axios.get(`${url}/api/trade/appSymbol/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Symbols list:", JSON.stringify(symRes.data).substring(0, 500));

            console.log("\nFetching price for XAUUSD...");
            const priceRes = await axios.get(`${url}/api/trade/appSymbol/price?symbol=XAUUSD`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Price XAUUSD:", JSON.stringify(priceRes.data));

            console.log("\nFetching kline for XAUUSD...");
            const klineRes = await axios.get(`${url}/api/trade/appSymbol/klineList?symbol=XAUUSD&period=1min&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Kline XAUUSD:", JSON.stringify(klineRes.data).substring(0, 500));
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
            console.error("Response status:", e.response.status);
        }
    }
}
test();
