async function checkLiveEnv() {
  const htmlRes = await fetch('https://duetgo.netlify.app/');
  const html = await htmlRes.text();
  const scriptMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  
  if (!scriptMatch) {
    console.log("No JS bundle found");
    return;
  }
  
  const jsUrl = `https://duetgo.netlify.app${scriptMatch[1]}`;
  const jsRes = await fetch(jsUrl);
  const jsText = await jsRes.text();
  
  // The anon key usually starts with eyJhb...
  const anonKeyMatch = jsText.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  if (anonKeyMatch) {
    console.log(anonKeyMatch[0]);
  } else {
    console.log("Anon key not found in JS bundle");
  }
}
checkLiveEnv();
