const https = require('https');
https.get('https://documenter.getpostman.com/view/10265205/2sA3rwLZD1', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/https:\/\/documenter\.getpostman\.com\/api\/collections\/[^"']+/g);
    if (match) {
        console.log("Found URLs:", match);
    }
    const scriptMatch = data.match(/<script[^>]*>(.*?)<\/script>/gs);
    if(scriptMatch) {
       // console.log("Scripts found", scriptMatch.length);
    }
    
    // Let's just try to fetch the collection directly using the ID
    // 10265205-2sA3rwLZD1 is not the collection ID, it's workspace-collection or something.
    // Actually the URL is https://documenter.getpostman.com/api/collections/10265205-2sA3rwLZD1 ? No, the ID is usually a UUID.
  });
});
