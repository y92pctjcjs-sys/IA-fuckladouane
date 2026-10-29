import {sectorAt,stageAt} from './track.js?v=fld-world-002';
import {BPM,STEP_SECONDS,scoreEvents,frequency} from './score.js?v=fld-world-002';
export {BPM};
export function engineTone(speed,previousGear=1){
 const limits=[0,10,21,33,46,61,76];let gear=Math.max(1,Math.min(6,previousGear));
 while(gear<6&&speed>limits[gear]+.6)gear++;
 while(gear>1&&speed<limits[gear-1]-2.2)gear--;
 const load=Math.max(0,Math.min(1,(speed-limits[gear-1])/(limits[gear]-limits[gear-1])));
 return {gear,hz:34+load*40+gear*1.5,cutoff:180+load*160};
}
export function createAudio(onInterruption=()=>{},makeContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
 let context,master,musicBus,fxBus,engineBus,engineFilter,compressor,engine,sub,siren,wind,skid,boost,tunnel;
 let active=false,userSuspended=false,timer=null,nextTime=0,nextStep=0,lastHit=0,lastSector=-1,lastArrival=false,lastReveal=0,gear=1;
 let latest={state:'MENU',s:0,time:0,speed:0,pressure:0,drifting:false,boosting:false,hitSerial:0};
 let volumes={master:.75,music:.72,effects:.7,engine:.28,engineEnabled:true},noiseBuffer;
 const voices=new Set(),loops=[];
 function smooth(param,value,tau=.08){param.setTargetAtTime(value,context.currentTime,tau);}
 function oscillator(type,bus){
  const node=context.createOscillator(),gain=context.createGain();node.type=type;gain.gain.value=0;node.connect(gain);gain.connect(bus);node.start();loops.push(node,gain);return {node,gain};
 }
 function noiseLoop(filterType,freq){
  const node=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  node.buffer=noiseBuffer;node.loop=true;filter.type=filterType;filter.frequency.value=freq;gain.gain.value=0;
  node.connect(filter);filter.connect(gain);gain.connect(fxBus);node.start();loops.push(node,filter,gain);return {node,filter,gain};
 }
 function initialize(){
  context=makeContext();master=context.createGain();musicBus=context.createGain();fxBus=context.createGain();engineBus=context.createGain();engineFilter=context.createBiquadFilter();compressor=context.createDynamicsCompressor();
  compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.008;compressor.release.value=.18;
  musicBus.connect(master);fxBus.connect(master);engineFilter.connect(engineBus);engineBus.connect(master);master.connect(compressor);compressor.connect(context.destination);
  engineFilter.type='lowpass';engineFilter.frequency.value=260;engineFilter.Q.value=.45;
  // A quiet stereo echo gives the original arpeggios space without an external reverb file.
  for(const side of [-1,1]){
   const delay=context.createDelay(1),feedback=context.createGain(),lowpass=context.createBiquadFilter(),pan=context.createStereoPanner(),wet=context.createGain();
   delay.delayTime.value=60/BPM*(side<0?.75:1.25);feedback.gain.value=.24;wet.gain.value=.16;pan.pan.value=side*.75;lowpass.type='lowpass';lowpass.frequency.value=2100;
   musicBus.connect(delay);delay.connect(lowpass);lowpass.connect(feedback);feedback.connect(delay);lowpass.connect(wet);wet.connect(pan);pan.connect(master);loops.push(delay,feedback,lowpass,pan,wet);
  }
  noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const bytes=noiseBuffer.getChannelData(0);
  let random=0x89f1;for(let i=0;i<bytes.length;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;bytes[i]=random/2147483648-1;}
  engine=oscillator('triangle',engineFilter);sub=oscillator('sine',engineFilter);siren=oscillator('sine',fxBus);
  wind=noiseLoop('lowpass',1400);skid=noiseLoop('bandpass',1700);boost=noiseLoop('highpass',600);tunnel=noiseLoop('lowpass',220);
  context.onstatechange=()=>{if(active&&!userSuspended&&['interrupted','suspended'].includes(context.state)){stopTimer();onInterruption();}};
  applyVolumes();
 }
 function applyVolumes(){if(!context)return;smooth(master.gain,volumes.master*.65);smooth(musicBus.gain,volumes.music);smooth(fxBus.gain,volumes.effects);smooth(engineBus.gain,volumes.engineEnabled?volumes.engine:0);}
 function stopTimer(){if(timer!==null){clearInterval(timer);timer=null;}}
 function cancelVoices(){for(const voice of [...voices]){try{voice.source.stop();}catch{}voice.cleanup();}voices.clear();}
 function voice(event,time,bus=musicBus){
  if(voices.size>=96)return;
  const gain=context.createGain(),filter=context.createBiquadFilter(),pan=context.createStereoPanner(),duration=event.duration;
  const noise=['hat','snare','scrape','crash','boost'].includes(event.kind),source=noise?context.createBufferSource():context.createOscillator();
  source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(bus);pan.pan.value=event.pan||0;
  filter.type=noise?'highpass':'lowpass';filter.frequency.value=noise?(event.kind==='hat'?6500:event.kind==='snare'?1700:240):event.kind==='bass'?650:event.kind==='pad'?1450:event.kind==='lead'?1800:3200;
  filter.Q.value=event.kind==='bass'?2:.5;
  if(noise)source.buffer=noiseBuffer;
  else{
   source.type=['pad','lead'].includes(event.kind)?'sawtooth':event.kind==='bass'?'triangle':event.kind==='kick'?'sine':'triangle';
   const hz=frequency(event.midi);source.frequency.setValueAtTime(event.kind==='kick'?140:hz,time);
   if(event.kind==='kick')source.frequency.exponentialRampToValueAtTime(38,time+.14);
   if(event.kind==='pad')source.detune.value=(event.midi%3-1)*7;
   if(event.kind==='lead'){source.detune.value=-4;filter.frequency.setValueAtTime(850,time);filter.frequency.linearRampToValueAtTime(2100,time+.22);}
   if(event.kind==='impact'){source.frequency.setValueAtTime(90,time);source.frequency.exponentialRampToValueAtTime(29,time+.22);}
  }
  const attack=event.kind==='pad'?.32:event.kind==='lead'?.045:.008,release=event.kind==='pad'?.55:event.kind==='lead'?.32:.09;
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(event.volume,time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+duration+release);
  const entry={source,cleanup(){source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();voices.delete(entry);}};
  voices.add(entry);source.onended=entry.cleanup;source.start(time);source.stop(time+duration+release+.02);
 }
 function tick(){
  if(!active||context?.state!=='running'||userSuspended)return;
  // Drop late notes after an OS stall; never fire a burst of old beats.
  if(nextTime<context.currentTime-.1){const skipped=Math.ceil((context.currentTime-nextTime)/STEP_SECONDS);nextStep+=skipped;nextTime+=skipped*STEP_SECONDS;}
  let budget=8;
  while(nextTime<context.currentTime+.12&&budget-->0){
   const arrival=Boolean(latest.result?.won),sector=sectorAt(latest.s);
   for(const event of scoreEvents(nextStep,sector,latest.pressure,arrival))voice(event,nextTime+event.offset);
   nextStep++;nextTime+=STEP_SECONDS;
  }
 }
 function startTimer(){stopTimer();if(!active||userSuspended||context.state!=='running')return;tick();timer=setInterval(tick,25);}
 function silenceLoops(){if(!context)return;for(const layer of[engine,sub,siren,wind,skid,boost,tunnel])smooth(layer.gain.gain,0,.03);}
 return {get enabled(){return active;},get status(){return !active?'off':context?.state||'off';},
  get diagnostics(){return {voices:voices.size,scheduler:timer!==null,bpm:BPM,step:nextStep,state:context?.state||'uninitialized',engineLevel:volumes.engineEnabled?volumes.engine:0,effectsLevel:volumes.effects,musicLevel:volumes.music,gear};},
  configure(settings){volumes={...volumes,...settings};applyVolumes();},
  async toggle(){
   try{
    if(active){active=false;userSuspended=true;stopTimer();cancelVoices();silenceLoops();await context.suspend();return false;}
    if(!context)initialize();active=true;userSuspended=false;nextTime=context.currentTime+.045;await context.resume();startTimer();return true;
   }catch{active=false;stopTimer();return false;}
  },
  suspend(){userSuspended=true;stopTimer();if(context&&context.state!=='closed')context.suspend().catch(()=>{});},
  async resume(){if(!active||!context)return;userSuspended=false;try{await context.resume();if(nextTime<context.currentTime)nextTime=context.currentTime+.035;startTimer();}catch{userSuspended=true;onInterruption();}},
  reset(){stopTimer();cancelVoices();nextStep=0;lastHit=0;lastSector=-1;lastArrival=false;lastReveal=0;gear=1;if(context){nextTime=context.currentTime+.045;silenceLoops();}latest={state:'COUNTDOWN',s:0,speed:0,pressure:0,time:0,hitSerial:0,revealSerial:0};},
  update(r){
   latest=r;if(!active||!context||context.state!=='running'||userSuspended)return;
   const on=r.state==='RACE',now=context.currentTime,tone=engineTone(r.speed,gear);gear=tone.gear;
   smooth(engine.node.frequency,tone.hz,.11);smooth(sub.node.frequency,tone.hz*.5,.14);smooth(engineFilter.frequency,tone.cutoff,.12);
   smooth(engine.gain.gain,on?.024:0);smooth(sub.gain.gain,on?.020:0);
   smooth(wind.gain.gain,on?.016*(r.speed/55)**2:0);smooth(wind.filter.frequency,500+r.speed*24);
   smooth(skid.gain.gain,on&&r.drifting?.026*r.driftBlend: r.scraping?.015:0);
   smooth(boost.gain.gain,on&&r.boosting?.038:0);
   const inTunnel=stageAt(r.s).kind==='tunnel';smooth(tunnel.gain.gain,on&&inTunnel?.018:0,.3);
   const proximity=Math.max(0,...(r.cops||[]).filter(c=>c.active).map(c=>1-Math.abs(r.s-c.s)/95));
   const sirenGate=(Math.sin(r.time*1.6)>-.3?1:.22);smooth(siren.node.frequency,600+Math.sin(r.time*4.2)*180,.07);smooth(siren.gain.gain,on?.013*proximity*sirenGate:0,.25);
   if(on&&r.revealSerial&&r.revealSerial!==lastReveal){lastReveal=r.revealSerial;for(const [i,n] of [57,64,69].entries())voice({kind:'bell',midi:n,duration:.24,volume:.065},now+i*.085,fxBus);}
   if(r.hitSerial!==lastHit&&on){lastHit=r.hitSerial;voice({kind:r.impactKind==='scrape'?'scrape':'crash',midi:0,duration:.16,volume:.13},now,fxBus);voice({kind:'impact',midi:40,duration:.22,volume:.22},now,fxBus);}
   const sector=sectorAt(r.s);if(on&&sector!==lastSector){if(lastSector>=0)for(const [i,n] of[64,67,71].entries())voice({kind:'bell',midi:n,duration:.25,volume:.07},now+i*.09,fxBus);lastSector=sector;}
   if(r.result?.won&&!lastArrival){lastArrival=true;cancelVoices();nextTime=now+.04;nextStep=Math.ceil(nextStep/16)*16;for(const [i,n] of[52,59,64,67].entries())voice({kind:'bell',midi:n,duration:1.8,volume:.08},now+i*.12,fxBus);}
  },
  dispose(){active=false;stopTimer();cancelVoices();for(const node of loops){try{node.stop?.();}catch{}node.disconnect();}if(context){context.onstatechange=null;context.close().catch(()=>{});}}
 };
}
