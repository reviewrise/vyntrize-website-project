const fs = require('fs');
const path = require('path');
const files = ['.env', 'apps/vyntrize-crm/.env', 'apps/vyntrize-website/.env', 'packages/@platform/vyntrize-db/.env'];

files.forEach(f => {
    const p = path.join(process.cwd(), f);
    if (fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/localhost:5432/g, '127.0.0.1:5432');
        fs.writeFileSync(p, c);
        console.log('Updated ' + f);
    }
});
