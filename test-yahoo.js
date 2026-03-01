const http = require('https');

http.get('https://query2.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => console.log(data.substring(0, 1000)));
}).on('error', (err) => console.log(err.message));
