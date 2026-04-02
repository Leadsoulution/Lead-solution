fetch('https://app.sendit.ma/docs/api-docs.json').then(r => r.json()).then(j => console.log(JSON.stringify(j, null, 2).substring(0, 1500)))
