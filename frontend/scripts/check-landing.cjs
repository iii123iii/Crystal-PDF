const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = require('child_process').spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1'], {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
(async () => {
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('Local:'))resolve()});server.on('exit',code=>reject(new Error('server exit '+code)));});
 const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']});
 const page = await browser.newPage({reducedMotion:'reduce'});
 await page.route('https://**/*', route => route.abort());
 const results=[];
 for (const width of [320,360,375,390,414,640,768,820,1024,1440]) {
  for (const fontSize of [16,32]) {
   await page.setViewportSize({width,height:900});
   await page.goto('http://127.0.0.1:5173/');
   await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',fontSize);
   const issues=await page.evaluate(()=>{
    const failures=[];
    const width=document.documentElement.clientWidth;
    if(document.documentElement.scrollWidth>width+1)failures.push('page overflow: '+[...document.querySelectorAll('.landing-page h1,.landing-page h2,.landing-page p')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim()).join('|'));
    for(const el of document.querySelectorAll('.landing-page a')) {
     const r=el.getBoundingClientRect();
     if(r.left < -1 || r.right>width+1)failures.push('link outside viewport: '+el.textContent);
     if(r.height<44)failures.push('short touch target: '+el.textContent);
     if(el.scrollWidth>el.clientWidth+1)failures.push('link text overflow: '+el.textContent);
    }
    for(const el of document.querySelectorAll('.tool-card p'))if(el.scrollWidth>el.clientWidth+1)failures.push('card text overflow');
    return failures;
   });
   results.push({width,fontSize,issues});
   if(fontSize===16 && [320,390,768,1440].includes(width))await page.screenshot({path:__dirname+'/preview-'+width+'.png',fullPage:true});
  }
 }
 console.log(JSON.stringify(results,null,2));
 require('fs').writeFileSync(__dirname+'/browser-results.json',JSON.stringify(results,null,2));
 await browser.close();
 server.kill();
 if(results.some(r=>r.issues.length))process.exitCode=1;
})().catch(e=>{console.error(e);server.kill();process.exit(1)});
