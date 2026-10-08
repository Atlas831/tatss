const fs = require('fs');
const p = 'app.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const e = j.expo;
e.name = 'TATS';
e.slug = 'tats';
e.icon = './icon.png';
e.ios = e.ios || {};
e.ios.bundleIdentifier = 'com.atlas.tats';
e.ios.infoPlist = Object.assign({}, e.ios.infoPlist, {
  NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
  NSLocalNetworkUsageDescription: 'TATS, PC kumandasi icin yerel agdaki bilgisayara baglanir.',
});
fs.writeFileSync(p, JSON.stringify(j, null, 2));
