import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
const [label='candidate', baseUrl='http://127.0.0.1:4173', outDir='./test-results/landing']=process.argv.slice(2);
const allowGoogleFonts = process.env.LANDING_ALLOW_GOOGLE_FONTS === '1';
const allowedOrigins = new Set([new URL(baseUrl).origin]);
if (allowGoogleFonts) {
  allowedOrigins.add('https://fonts.googleapis.com');
  allowedOrigins.add('https://fonts.gstatic.com');
}
const routeRequest = route => allowedOrigins.has(new URL(route.request().url()).origin) ? route.continue() : route.abort();
await fs.mkdir(outDir,{recursive:true});
const executablePath=process.env.BROWSER_PATH;
if (!executablePath) throw new Error('Set BROWSER_PATH to an installed Chrome, Chromium, or Brave executable. No browser is downloaded by this script.');
const browser=await chromium.launch({executablePath,headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const checks=[]; const metrics=[];
const check=(name,ok,detail)=>checks.push({name,passed:Boolean(ok),detail});
try {
  for(const width of [320,360,390,640,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference',isMobile:width<640,hasTouch:width<640});
    await context.route('**/*',routeRequest);
    const page=await context.newPage();const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
    const response=await page.goto(baseUrl,{waitUntil:'networkidle'});await page.waitForTimeout(1100);
    if (allowGoogleFonts) {
      const loaded = await page.evaluate(async () => (await document.fonts.load('600 24px "Cormorant Garamond"')).length);
      check(`${width}:display-font-loaded`, loaded > 0, loaded);
    }
    const m=await page.evaluate(()=>{
      const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      const sections=[...document.querySelectorAll('section')];
      const links=[...document.querySelectorAll('nav a,section a')].map(e=>({text:e.textContent.trim(),href:e.getAttribute('href'),...box(e)}));
      const heading=document.querySelector('h1');const nav=document.querySelector('nav');
      const textOutside=[...document.querySelectorAll('h1,h2,h3,p,a')].filter(e=>{const b=box(e);return b.width>0&&b.height>0&&(b.x < -1||b.right>innerWidth+1)}).map(e=>({text:e.textContent.trim(),...box(e)}));
      const cards=[...document.querySelectorAll('section .tool-card')].map(box);
      const heroLinks=[...sections[0].querySelectorAll('a')].map(box);
      return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,heading:heading?.textContent,nav:box(nav),links,textOutside,cards,heroLinks,fonts:document.fonts.status};
    }); metrics.push(m);
    check(`${width}:HTTP200`,response.status()===200,response.status());
    check(`${width}:no-runtime-errors`,exceptions.length===0,exceptions);
    check(`${width}:no-horizontal-overflow`,m.documentWidth<=width+1&&m.bodyWidth<=width+1,{documentWidth:m.documentWidth,bodyWidth:m.bodyWidth});
    check(`${width}:text-within-viewport`,m.textOutside.length===0,m.textOutside);
    check(`${width}:all-eight-tools`,m.cards.length===8,m.cards.length);
    check(`${width}:navigation-and-CTA-targets`,m.links.every(a=>a.width>=44&&a.height>=44),m.links);
    check(`${width}:auth-links-preserved`,m.links.filter(a=>a.href==='/register').length===3&&m.links.filter(a=>a.href==='/login').length===3,m.links.map(a=>a.href));
    if(width<640)check(`${width}:hero-actions-stacked`,m.heroLinks.length===2&&m.heroLinks[1].y>=m.heroLinks[0].bottom-1,m.heroLinks);
    if([320,390,768,1440].includes(width))await page.screenshot({path:path.join(outDir,`${width}.png`),fullPage:true,animations:'disabled'});
    if(width===390){
      await page.keyboard.press('Tab');check('keyboard:home-first',await page.locator('nav a').first().evaluate(e=>e===document.activeElement));
      await page.getByRole('link',{name:'Start for free',exact:true}).click();check('navigation:register-route',new URL(page.url()).pathname==='/register',page.url());
      await page.goto(baseUrl,{waitUntil:'networkidle'});await page.getByRole('link',{name:'Sign in to workspace',exact:true}).click();check('navigation:login-route',new URL(page.url()).pathname==='/login',page.url());
    }
    await context.close();
  }
  const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await reduced.route('**/*',routeRequest);
  const page=await reduced.newPage();await page.goto(baseUrl,{waitUntil:'networkidle'});
  const motion=await page.evaluate(()=>({head:getComputedStyle(document.querySelector('h1')).animationName,prism:getComputedStyle(document.querySelector('.prism'),'::before').animationName}));
  check('reduced-motion:animations-disabled',motion.head==='none'&&motion.prism==='none',motion);await reduced.close();
} finally {await browser.close();}
const report={label,baseUrl,observedAt:new Date().toISOString(),browser:'Installed Chromium browser via playwright-core; isolated headless contexts',externalRequests:allowGoogleFonts?'Google Fonts only; all other external requests blocked':'blocked to make fallback-font checks deterministic',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,metrics};
await fs.writeFile(path.join(outDir,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({label,passed:report.passed,failed:report.failed,failures:checks.filter(c=>!c.passed).map(c=>({name:c.name,detail:c.detail})),outDir},null,2));
process.exitCode=report.failed?1:0;
