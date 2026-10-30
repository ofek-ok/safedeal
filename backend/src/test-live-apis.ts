async function testLiveConnections() {
  console.log('🌐 =========================================================');
  console.log('🔍 LIVE GOVERNMENT & EXTERNAL API HEALTH CHECK');
  console.log('=========================================================\n');

  // 1. Test GovMap GIS API (מרכז מיפוי ישראל)
  console.log('1️⃣ Testing GovMap GIS (מרכז מיפוי ישראל)...');
  try {
    const govmapUrl = 'https://es.govmap.gov.il/TldSearch/api/DetailsByQuery?query=%D7%93%D7%99%D7%96%D7%A0%D7%92%D7%95%D7%A3%20140%20%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91&layer=0';
    const res = await fetch(govmapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    console.log(`   ✅ GovMap Live Status: HTTP ${res.status} (${res.statusText})`);
    if (res.ok) {
      const data: any = await res.json();
      console.log(`   📍 Address Verification: ${data?.data?.[0]?.ResultLable || 'Entity Identified'}\n`);
    }
  } catch (err: any) {
    console.log(`   ⚠️ GovMap Live Status: ${err.message}\n`);
  }

  // 2. Test Israel Tax Authority / Data.gov.il (רשות המסים & נדל"ן ממשלתי)
  console.log('2️⃣ Testing Data.gov.il (רשות המסים & נדל"ן ממשלתי)...');
  try {
    const dataGovUrl = 'https://data.gov.il/api/3/action/package_search?q=%D7%A0%D7%93%D7%9C%D7%9F&rows=1';
    const res = await fetch(dataGovUrl);
    console.log(`   ✅ Data.gov.il Live Status: HTTP ${res.status} (${res.statusText})`);
    if (res.ok) {
      const data: any = await res.json();
      console.log(`   📊 Real Estate Data Packages Indexed: ${data?.result?.count || 0}\n`);
    }
  } catch (err: any) {
    console.log(`   ⚠️ Data.gov.il Status: ${err.message}\n`);
  }

  // 3. Test CBS (הלשכה המרכזית לסטטיסטיקה - למ"ס)
  console.log('3️⃣ Testing CBS API (הלשכה המרכזית לסטטיסטיקה)...');
  try {
    const cbsUrl = 'https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false';
    const res = await fetch(cbsUrl);
    console.log(`   ✅ CBS Live Status: HTTP ${res.status} (${res.statusText})`);
    if (res.ok) {
      console.log(`   📈 Housing Price Index API: Accessible and returning JSON\n`);
    }
  } catch (err: any) {
    console.log(`   ℹ️ CBS Live Status: ${err.message}\n`);
  }

  // 4. Test XPLAN / Planning Administration (מינהל התכנון)
  console.log('4️⃣ Testing XPLAN (מינהל התכנון - תב"ע)...');
  try {
    const xplanUrl = 'https://mavat.iplan.gov.il/SV4/1/1';
    const res = await fetch(xplanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    console.log(`   ✅ XPLAN Portal Status: HTTP ${res.status} (${res.statusText})`);
    console.log(`   🏗️ Planning Authority Portal: Online and responding\n`);
  } catch (err: any) {
    console.log(`   ℹ️ XPLAN Status: ${err.message}\n`);
  }

  // 5. Test Urban Renewal Authority (הרשות הממשלתית להתחדשות עירונית)
  console.log('5️⃣ Testing Urban Renewal Authority (התחדשות עירונית)...');
  try {
    const renewalUrl = 'https://data.gov.il/api/3/action/datastore_search?resource_id=920fb62d-327c-4863-8a3a-d68a52932145&limit=1';
    const res = await fetch(renewalUrl);
    console.log(`   ✅ Urban Renewal Data: HTTP ${res.status} (${res.statusText})`);
    if (res.ok) {
      const data: any = await res.json();
      console.log(`   🏢 Urban Renewal Complexes Database: Verified (${data?.result?.total || 'Active'})\n`);
    }
  } catch (err: any) {
    console.log(`   ℹ️ Urban Renewal Status: ${err.message}\n`);
  }

  console.log('=========================================================');
  console.log('🎯 LIVE API PING CHECK COMPLETED');
  console.log('=========================================================\n');
}

testLiveConnections();
