const https = require('https');
https.get('https://documenter.getpostman.com/view/10265205/2sA3rwLZD1', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/window\.documenterData\s*=\s*({.*?});/);
    if (match) {
      const parsed = JSON.parse(match[1]);
      console.log(JSON.stringify(parsed.collection, null, 2).substring(0, 2000));
      require('fs').writeFileSync('/app/applet/ameex.json', JSON.stringify(parsed.collection, null, 2));
    } else {
      console.log('No documenterData found');
    }
  });
});
