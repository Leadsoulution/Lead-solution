const fs = require('fs');
fetch('https://app.sendit.ma/docs/api-docs.json').then(r => r.json()).then(j => fs.writeFileSync('/app/applet/sendit-api.json', JSON.stringify(j, null, 2)))
