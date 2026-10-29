// Optional browser verification; not a site runtime dependency.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.OCULAIRE_PLAYWRIGHT||'playwright');
const project=path.resolve(__dirname,'../..');
const output=path.resolve(process.env.OCULAIRE_QA_OUTPUT||path.join(project,'course/validation/oculaire'));
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.OCULAIRE_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const report={environment:'Chromium headless / software WebGL, static files supplied through Playwright route fulfillment; no public network or physical iPhone test',errors:[],cases:[]};
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.setDefaultTimeout(60000);
    page.on('pageerror',error=>report.errors.push(error.stack));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
    await page.route('http://oculaire.test/**',async route=>{
      const name=new URL(route.request().url()).pathname,file=path.join(project,name);
      if(!file.startsWith(project+path.sep)){await route.fulfill({status:403,body:'Forbidden'});return;}
      try{await route.fulfill({status:200,body:fs.readFileSync(file),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.glb':'model/gltf-binary','.png':'image/png','.wav':'audio/wav'})[path.extname(file)]||'application/octet-stream'});}
      catch(error){await route.fulfill({status:404,body:String(error)});}
    });
    await page.goto('http://oculaire.test/course/oculaire-preview.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#world').dataset.oculaire==='ready');
    report.gl=await page.locator('#world').evaluate(canvas=>{
      const gl=canvas.getContext('webgl2'),debug=gl?.getExtension('WEBGL_debug_renderer_info');
      return gl?{version:gl.getParameter(gl.VERSION),renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}:null;
    });assert.ok(report.gl,'real WebGL 2 context required');
    for(const [name,width,height,s,x] of [
      ['portrait-open',390,844,2400,0],['portrait-tunnel',390,844,6000,0],
      ['portrait-control',390,844,8400,5],['landscape-open',844,390,3000,-5],
      ['narrow-frontier',320,740,11700,0]
    ]) {
      await page.setViewportSize({width,height});
      const measured=await page.evaluate(({s,x})=>{
        const {view,race}=window.oculairePreview;race.s=s;race.x=x;view.reset();view.render(race,1/60);
        return {status:view.inspectOculaire(),metrics:view.metrics};
      },{s,x});
      assert.equal(measured.status.state,'ready');assert.equal(measured.status.meshes,243);assert.equal(measured.status.features.length,11);
      assert.ok(measured.status.screen.min[0]>-1&&measured.status.screen.max[0]<1,`${name}: horizontal bounds`);
      assert.ok(measured.status.screen.min[1]>.05&&measured.status.screen.max[1]<1,`${name}: vertical bounds`);
      if(name==='portrait-tunnel')assert.equal(measured.status.occludedAtCenter,true,'tunnel roof must occlude the face');
      report.cases.push({name,width,height,s,x,...measured});
      await page.screenshot({path:path.join(output,name+'.png')});
      console.log(name,JSON.stringify(measured));
    }
    report.raf=await page.evaluate(()=>new Promise(resolve=>{
      const samples=[];let last;
      function tick(now){if(last!==undefined)samples.push(now-last);last=now;if(samples.length<30){requestAnimationFrame(tick);return;}const sorted=samples.slice().sort((a,b)=>a-b);resolve({samples:samples.length,meanMs:samples.reduce((a,b)=>a+b)/samples.length,medianMs:sorted[15],p95Ms:sorted[28]});}
      requestAnimationFrame(tick);
    }));
    await page.goto('http://oculaire.test/course.html',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#world').dataset.oculaire==='ready');
    await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.raceState==='RACE');
    await page.screenshot({path:path.join(output,'actual-game-portrait.png')});report.actualGame={state:await page.locator('body').getAttribute('data-race-state'),oculaire:await page.locator('#world').getAttribute('data-oculaire')};
    await page.locator('#pause').click();assert.equal(await page.locator('body').getAttribute('data-race-state'),'PAUSE');
    await page.locator('#resume').click();assert.equal(await page.locator('body').getAttribute('data-race-state'),'RACE');report.pauseResume=true;
    assert.deepEqual(report.errors,[]);report.passed=true;
  } finally {
    fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
