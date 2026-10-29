// Development-only verification. Real Chromium/WebGL; no public-site or physical-device claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.OCULAIRE_PLAYWRIGHT||'playwright');
const project=path.resolve(__dirname,'../..'),output=path.resolve(process.env.OCULAIRE_QA_OUTPUT||path.join(project,'course/validation/oculaire'));
const baseline=process.env.OCULAIRE_BASELINE;fs.mkdirSync(output,{recursive:true});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg'};
const harness=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>html,body{margin:0;background:#090714}canvas{width:100vw;height:100vh;display:block}</style><canvas id="world"></canvas><script type="module">
import {createRenderer} from '/course/renderer.js?v=oculaire-003';import {createRace} from '/course/simulation.js?v=oculaire-003';
const race=createRace(),view=createRenderer(document.getElementById('world'),false);Object.assign(race,{state:'RACE',s:2400,time:50,speed:48});window.bench={race,view};view.render(race,1/60);
</script>`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.OCULAIRE_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const report={environment:'Chromium headless / software WebGL, Playwright static HTTP fulfillment; forced deterministic states for cinematic coverage; physical iPhone not tested',errors:[],cases:[]};
 async function pageFor(root=project,expose=false,errorSink=report.errors){const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.setDefaultTimeout(60000);
  page.on('pageerror',e=>errorSink.push(e.stack));page.on('console',m=>{if(m.type()==='error')errorSink.push(m.text());});
  await page.route('http://oculaire.test/**',async route=>{
   const name=new URL(route.request().url()).pathname;
   if(name==='/bench.html'){await route.fulfill({body:harness,contentType:'text/html'});return;}
   const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){await route.fulfill({status:403,body:'Forbidden'});return;}
   try{let body=fs.readFileSync(file);if(expose&&name==='/course/main.js')body=body.toString()+`\nwindow.oculaireGame={get race(){return race},get clock(){return clock},renderer,launch,hud,paintState};`;
    await route.fulfill({body,contentType:mime[path.extname(file)]||'application/octet-stream'});
   }catch(e){await route.fulfill({status:404,body:String(e)});}
  });return page;
 }
 try{
  const page=await pageFor();await page.goto('http://oculaire.test/bench.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.bench?.view.oculaireStatus?.state==='ready');
  report.gl=await page.locator('#world').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),debug=gl?.getExtension('WEBGL_debug_renderer_info');return gl?{version:gl.getParameter(gl.VERSION),renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}:null;});assert.ok(report.gl);
  for(const [name,width,height,s,x]of[
   ['portrait-open-left',390,844,2400,-5],['portrait-open-center',390,844,3000,0],['portrait-open-right',390,844,3650,5],
   ['portrait-tunnel',390,844,6000,0],['portrait-control',390,844,8400,5],['landscape-open',844,390,3000,-5],['narrow-frontier',320,740,11700,0]
  ]){
   await page.setViewportSize({width,height});const measured=await page.evaluate(({s,x})=>{const {view,race}=bench;Object.assign(race,{s,x,state:'RACE',result:null,time:s/48,seed:5678});view.reset();for(let i=0;i<20;i++)view.render(race,1/60);return {head:view.inspectOculaire(),metrics:view.metrics};},{s,x});
   assert.equal(measured.head.state,'ready');assert.equal(measured.head.features.length,11);for(const eye of measured.head.gazes)assert.ok(eye.errorRadians<1e-6);
   assert.ok(measured.head.screen.min[0]>-1&&measured.head.screen.max[0]<1,`${name}: horizontal bounds`);assert.ok(measured.head.screen.min[1]>.02&&measured.head.screen.max[1]<1,`${name}: vertical bounds`);
   if(name==='portrait-tunnel')assert.equal(measured.head.occludedAtCenter,true);assert.ok(measured.metrics.calls<350);
   report.cases.push({name,width,height,s,x,...measured});await page.screenshot({path:path.join(output,name+'.png')});console.log(name,measured.metrics.calls,'draws');
  }
  await page.setViewportSize({width:390,height:844});
  for(const ending of['escape','love']){
   await page.evaluate(ending=>{const {race,view}=bench;Object.assign(race,{s:13000,x:0,state:'ARRIVAL',result:{won:true,ending},cinematic:0});view.reset();},ending);
   for(let i=0;i<=28;i++){
    const t=i/4;const measured=await page.evaluate(t=>{bench.race.cinematic=t;for(let i=0;i<8;i++)bench.view.render(bench.race,1/60);return {head:bench.view.inspectOculaire(),metrics:bench.view.metrics};},t);
    assert.equal(measured.head.fragments,t>=4.7?1000:0);assert.equal(measured.head.markVisible,t>=1.85&&t<4.7);
    if([0,1,2,3,4,4.75,5.25,6.5,7].includes(t))await page.screenshot({path:path.join(output,ending+'-'+t+'.png')});
    report.cases.push({name:ending+'-'+t,...measured});
   }
   console.log('cinematic',ending,'observed 0–7 s');
  }
  for(const t of[2.6,5.05]){
   const frozen=await page.evaluate(t=>{const {race,view}=bench;race.cinematic=t;race.state='PAUSE';view.render(race,1/60);const before=view.inspectOculaire();for(let i=0;i<20;i++)view.render(race,.25);const after=view.inspectOculaire();return {before,after};},t);
   assert.deepEqual(frozen.before.position,frozen.after.position);assert.deepEqual(frozen.before.gazes,frozen.after.gazes);
  }report.cinematicPause=true;
  for(const ending of['caught','escape','love']){
   const snapshot=await page.evaluate(ending=>{const {race,view}=bench;Object.assign(race,{state:ending==='caught'?'INTERCEPTION':'ARRIVAL',result:{won:ending!=='caught',ending},cinematic:3});view.setReduced?.(true);view.configure({quality:'eco',reduced:true});view.render(race,1/60);return view.inspectOculaire();},ending);
   assert.equal(snapshot.markVisible,ending!=='caught');if(ending==='caught')assert.equal(snapshot.fragments,0);
  }report.reducedMotion=true;
  // Use the original production UI with only a read/test handle appended by the test transport.
  await page.close();const game=await pageFor(project,true);await game.goto('http://oculaire.test/course.html',{waitUntil:'networkidle'});await game.waitForFunction(()=>window.oculaireGame&&document.querySelector('#world').dataset.oculaire==='ready');await game.locator('#start').click();
  await game.evaluate(()=>{oculaireGame.clock.advance(.25);});await game.waitForFunction(()=>document.body.dataset.raceState==='RACE');
  await game.screenshot({path:path.join(output,'actual-game-portrait.png')});
  await game.locator('#pause').click();assert.equal(await game.locator('body').getAttribute('data-race-state'),'PAUSE');await game.locator('#resume').click();assert.equal(await game.locator('body').getAttribute('data-race-state'),'RACE');
  await game.locator('#settings').click();await game.locator('#engineSound').uncheck();assert.equal(await game.locator('#masterVolume').inputValue(),'75');await game.locator('#preferences .close').click();assert.equal(await game.locator('body').getAttribute('data-race-state'),'PAUSE');await game.locator('#resume').click();
  await game.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal(await game.locator('body').getAttribute('data-race-state'),'PAUSE');await game.locator('#resume').click();report.uiPauseSettingsBlur=true;
  for(const ending of['escape','love','caught']){
   await game.evaluate(async ending=>{const {race,renderer}=oculaireGame;const {finish}=await import('/course/simulation.js?v=oculaire-003');Object.assign(race,{state:'RACE',s:13000,speed:48,ending:()=>ending});finish(race,ending!=='caught','TEST INTERCEPTION');oculaireGame.paintState();renderer.render(race,1/60);},ending);
   const limit=ending==='love'?14:ending==='escape'?7:4.5;
   for(let t=.25;t<=limit+.25;t+=.25)await game.evaluate(()=>{oculaireGame.clock.advance(.25);oculaireGame.renderer.render(oculaireGame.race,1/60);oculaireGame.hud();oculaireGame.paintState();});
   assert.equal(await game.locator('body').getAttribute('data-race-state'),'RESULTS');report.cases.push({name:'actual-ui-'+ending,title:await game.locator('#resultTitle').innerText()});await game.screenshot({path:path.join(output,'result-'+ending+'.png')});
   await game.locator('#replay').click();const head=await game.evaluate(()=>oculaireGame.renderer.inspectOculaire());assert.equal(head.fragments,0);assert.equal(head.markVisible,false);assert.equal(head.phase,'sky');await game.waitForFunction(()=>document.body.dataset.raceState==='RACE');
  }report.restartAndBothEndings=true;
  await game.close();
  const expectedErrors=[],failed=await pageFor(project,true,expectedErrors);
  await failed.route('**/course/assets/oculaire/portrait-data.js*',route=>route.fulfill({status:404,body:'Deliberate QA missing portrait'}));
  await failed.goto('http://oculaire.test/course.html',{waitUntil:'networkidle'});await failed.waitForFunction(()=>document.querySelector('#world').dataset.oculaire==='error');
  assert.equal(await failed.locator('#start').isEnabled(),true);await failed.locator('#start').click();await failed.waitForFunction(()=>document.body.dataset.raceState==='RACE');
  report.failedPortrait={gameStillRuns:true,state:await failed.locator('#world').getAttribute('data-oculaire'),error:await failed.locator('#world').getAttribute('data-oculaire-error'),expectedErrors};assert.ok(expectedErrors.length);await failed.close();
  async function performanceCase(root){const p=await pageFor(root);await p.goto('http://oculaire.test/bench.html',{waitUntil:'networkidle'});await p.waitForFunction(()=>window.bench&&(!bench.view.oculaireStatus||bench.view.oculaireStatus.state==='ready'));
   const result=await p.evaluate(()=>{const {view,race}=bench;Object.assign(race,{s:3000,x:0,result:null,state:'RACE'});view.reset();const gl=document.getElementById('world').getContext('webgl2');const times=[];for(let i=0;i<28;i++){const start=performance.now();view.render(race,1/60);gl.finish();if(i>=8)times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {frames:times.length,medianMs:times[10],p95Ms:times[18],metrics:view.metrics};});await p.close();return result;
  }
  report.performance={current:await performanceCase(project)};if(baseline)report.performance.baseline=await performanceCase(path.resolve(baseline));
  assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify({passed:true,cases:report.cases.length,performance:report.performance}));
 }finally{fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
