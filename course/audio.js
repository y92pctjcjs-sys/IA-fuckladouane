import {sectorAt,stageAt} from './track.js';
import {BPM,STEP_SECONDS,scoreEvents,frequency} from './score.js';
export {BPM};
export function createAudio(onInterruption=()=>{},makeContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()){
 let context,master,musicBus,fxBus,compressor,engine,sub,siren,wind,skid,boost,tunnel;
 let active=false,userSuspended=false,timer=null,nextTime=0,nextStep=0,lastHit=0,lastSector=-1,lastArrival=false;
 let latest={state:'MENU',s:0,time:0,speed:0,pressure:0,drifting:false,boosting:false,hitSerial:0};
 let volumes={master:.75,music:.65,effects:.7},noiseBuffer;
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
  context=makeContext();master=context.createGain();musicBus=context.createGain();fxBus=context.createGain();compressor=context.createDynamicsCompressor();
  compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.008;compressor.release.value=.18;
  musicBus.connect(master);fxBus.connect(master);master.connect(compressor);compressor.connect(context.destination);
  noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const bytes=noiseBuffer.getChannelData(0);
  let random=0x89f1;for(let i=0;i<bytes.length;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;bytes[i]=random/2147483648-1;}
  engine=oscillator('sawtooth',fxBus);sub=oscillator('triangle',fxBus);siren=oscillator('sine',fxBus);
  wind=noiseLoop('lowpass',1400);skid=noiseLoop('bandpass',1700);boost=noiseLoop('highpass',600);tunnel=noiseLoop('lowpass',220);
  context.onstatechange=()=>{if(active&&!userSuspended&&['interrupted','suspended'].includes(context.state)){stopTimer();onInterruption();}};
  applyVolumes();
 }
 function applyVolumes(){if(!context)return;smooth(master.gain,volumes.master*.65);smooth(musicBus.gain,volumes.music);smooth(fxBus.gain,volumes.effects);}
 function stopTimer(){if(timer!==null){clearInterval(timer);timer=null;}}
 function cancelVoices(){for(const voice of [...voices]){try{voice.source.stop();}catch{}voice.cleanup();}voices.clear();}
 function voice(event,time,bus=musicBus){
  if(voices.size>=96)return;
  const gain=context.createGain(),filter=context.createBiquadFilter(),duration=event.duration;
  const noise=['hat','snare','scrape','crash','boost'].includes(event.kind),source=noise?context.createBufferSource():context.createOscillator();
  source.connect(filter);filter.connect(gain);gain.connect(bus);
  filter.type=noise?'highpass':'lowpass';filter.frequency.value=noise?(event.kind==='hat'?6500:event.kind==='snare'?1700:240):event.kind==='bass'?550:event.kind==='pad'?1200:2800;
  filter.Q.value=event.kind==='bass'?2:.5;
  if(noise)source.buffer=noiseBuffer;
  else{
   source.type=event.kind==='pad'?'triangle':event.kind==='bass'?'sawtooth':event.kind==='kick'?'sine':'triangle';
   const hz=frequency(event.midi);source.frequency.setValueAtTime(event.kind==='kick'?140:hz,time);
   if(event.kind==='kick')source.frequency.exponentialRampToValueAtTime(38,time+.14);
   if(event.kind==='pad')source.detune.value=(event.midi%3-1)*5;
   if(event.kind==='impact'){source.frequency.setValueAtTime(90,time);source.frequency.exponentialRampToValueAtTime(29,time+.22);}
  }
  const attack=event.kind==='pad'?.24:.008,release=event.kind==='pad'?.45:.09;
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(event.volume,time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+duration+release);
  const entry={source,cleanup(){source.disconnect();filter.disconnect();gain.disconnect();voices.delete(entry);}};
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
  get diagnostics(){return {voices:voices.size,scheduler:timer!==null,bpm:BPM,step:nextStep,state:context?.state||'uninitialized'};},
  configure(settings){volumes={...volumes,...settings};applyVolumes();},
  async toggle(){
   try{
    if(active){active=false;userSuspended=true;stopTimer();cancelVoices();silenceLoops();await context.suspend();return false;}
    if(!context)initialize();active=true;userSuspended=false;nextTime=context.currentTime+.045;await context.resume();startTimer();return true;
   }catch{active=false;stopTimer();return false;}
  },
  suspend(){userSuspended=true;stopTimer();if(context&&context.state!=='closed')context.suspend().catch(()=>{});},
  async resume(){if(!active||!context)return;userSuspended=false;try{await context.resume();if(nextTime<context.currentTime)nextTime=context.currentTime+.035;startTimer();}catch{userSuspended=true;onInterruption();}},
  reset(){stopTimer();cancelVoices();nextStep=0;lastHit=0;lastSector=-1;lastArrival=false;if(context){nextTime=context.currentTime+.045;silenceLoops();}latest={state:'COUNTDOWN',s:0,speed:0,pressure:0,time:0,hitSerial:0};},
  update(r){
   latest=r;if(!active||!context||context.state!=='running'||userSuspended)return;
   const on=r.state==='RACE',now=context.currentTime,gear=Math.min(5,1+Math.floor(r.speed/11)),rpm=40+(r.speed%11)*7+gear*4;
   smooth(engine.node.frequency,rpm,.05);smooth(sub.node.frequency,rpm*.5,.07);
   smooth(engine.gain.gain,on?.041:0);smooth(sub.gain.gain,on?.048:0);
   smooth(wind.gain.gain,on?.016*(r.speed/55)**2:0);smooth(wind.filter.frequency,500+r.speed*24);
   smooth(skid.gain.gain,on&&r.drifting?.026*r.driftBlend: r.scraping?.015:0);
   smooth(boost.gain.gain,on&&r.boosting?.038:0);
   const inTunnel=stageAt(r.s).kind==='tunnel';smooth(tunnel.gain.gain,on&&inTunnel?.018:0,.3);
   const proximity=Math.max(0,...(r.cops||[]).filter(c=>c.active).map(c=>1-Math.abs(r.s-c.s)/95));
   smooth(siren.node.frequency,670+Math.sin(r.time*5)*230,.045);smooth(siren.gain.gain,on?.018*proximity:0,.35);
   if(r.hitSerial!==lastHit&&on){lastHit=r.hitSerial;voice({kind:r.impactKind==='scrape'?'scrape':'crash',midi:0,duration:.16,volume:.13},now,fxBus);voice({kind:'impact',midi:40,duration:.22,volume:.22},now,fxBus);}
   const sector=sectorAt(r.s);if(on&&sector!==lastSector){if(lastSector>=0)for(const [i,n] of[64,67,71].entries())voice({kind:'bell',midi:n,duration:.25,volume:.07},now+i*.09,fxBus);lastSector=sector;}
   if(r.result?.won&&!lastArrival){lastArrival=true;cancelVoices();nextTime=now+.04;nextStep=Math.ceil(nextStep/16)*16;for(const [i,n] of[52,59,64,67].entries())voice({kind:'bell',midi:n,duration:1.8,volume:.08},now+i*.12,fxBus);}
  },
  dispose(){active=false;stopTimer();cancelVoices();for(const node of loops){try{node.stop?.();}catch{}node.disconnect();}if(context){context.onstatechange=null;context.close().catch(()=>{});}}
 };
}
