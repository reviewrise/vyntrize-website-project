const fs = require('fs');
const path = require('path');
const files = ['.env', 'apps/vyntrize-crm/.env'];

files.forEach(f => {
    const p = path.join(process.cwd(), f);
    if (fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/REDIS_HOST="localhost"/g, 'REDIS_HOST="127.0.0.1"');
        c = c.replace(/REDIS_URL="redis:\/\/localhost:6379"/g, 'REDIS_URL="redis://127.0.0.1:6379"');
        fs.writeFileSync(p, c);
        console.log('Updated Redis in ' + f);
    }
});
