/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: responseData });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function syncTelegramWebhook() {
  console.log('🔄 Checking for active ngrok tunnel...');
  
  try {
    const tunnelsData = await fetchJson('http://localhost:4040/api/tunnels');
    const httpsTunnel = tunnelsData.tunnels.find(t => t.public_url.startsWith('https://'));
    
    if (!httpsTunnel) {
      console.log('❌ No HTTPS ngrok tunnel found. Is ngrok running on port 3000?');
      return;
    }
    
    const url = httpsTunnel.public_url;
    console.log(`✅ Found ngrok URL: ${url}`);
    
    console.log('🔄 Sending webhook URL to Veridian settings...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const result = await postJson(`${appUrl}/api/telegram/set-webhook`, {
      webhookUrl: `${url}/api/telegram/webhook`
    });
    
    if (result.ok) {
      console.log(`🎉 Success! Telegram webhook set to ${url}/api/telegram/webhook`);
    } else {
      console.log(`❌ Failed to set webhook. Status: ${result.status}`);
      console.log(`Make sure your Next.js server is running and TELEGRAM_BOT_TOKEN is set in .env.local`);
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.log('❌ Could not connect to ngrok or Next.js. Are they running?');
    } else {
      console.error('❌ Error synchronizing webhook:', err.message);
    }
  }
}

syncTelegramWebhook();
