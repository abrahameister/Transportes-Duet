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
  
  const vfhjw = jsText.includes('vfhjwlnwuctuvqsxkmoz');
  const ocaci = jsText.includes('ocacitnhmeqvduwqszpj');
  
  console.log("DEV project (vfhjw) in live JS:", vfhjw);
  console.log("PROD project (ocaci) in live JS:", ocaci);
}
checkLiveEnv();
