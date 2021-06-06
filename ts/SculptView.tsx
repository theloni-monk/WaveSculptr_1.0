import * as _ from 'lodash';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { WaveSynth } from '../pkg';

const deepcopy = buff => buff.map(el => el);

//hackky
var ctx: CanvasRenderingContext2D;
var cv: HTMLCanvasElement;
const SculptView = (props: { synth: WaveSynth }) => {

  const [synth, setSynth] = useState(null); //schrodingers synthesizer
  const [waveBuff, setWaveBuff] = useState(null);

  useLayoutEffect(() => {
    cv = (document.getElementById('cv') as HTMLCanvasElement)
    ctx = cv.getContext("2d");
    console.log(ctx);
  }, []);
  useEffect(() => {
    if (props.synth && (props.synth !== synth)) {
      setSynth(props.synth);
      console.log('set synth to', props.synth);
    }
  }, [props]); 
  useEffect(() => {
    console.log('synth set to', synth);
    Promise.resolve().then(()=>setWaveBuff(synth.get_wave_tspace()));
  }, [synth]);
  useEffect(()=>{
    drawWave();
  }, [waveBuff]);

  //canvas mapped to x: 0 -> len(waveData), y: -1 -> 1
  const drawWave = () => {
    if (synth) { } else return;
    let waveData = waveBuff;
    let step = cv.width / waveData.length;
    let heightMult = cv.height / 2;
    ctx.fillStyle= "#050505";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#02FF00";
    ctx.moveTo(0, (cv.height / 2) - (waveData[0] * heightMult / 2));
    for (let i = 0; i < waveData.length; i++) {
      let x = i * step;
      let y = (cv.height / 2) - (waveData[i] * heightMult / 2);
      ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  const [sculpting, setSculpting] = useState(false);
  const mouseMove = (evt:MouseEvent) => {
    if(!sculpting) return;
    let mx = evt.clientX - cv.offsetLeft;
    let my = evt.clientY - cv.offsetHeight;
    let waveData = deepcopy(waveBuff);//deepcopy from rust
    let floatIndex = Math.trunc((mx / cv.clientWidth) * waveData.length);
    let curFloat = waveData[floatIndex];
    let newFloat = 4 * ((cv.clientHeight - my) / cv.clientHeight) - 2;
    newFloat = _.clamp(newFloat,-1,1);
    waveData[floatIndex] = newFloat; //FIXME: when setting new float lerp those around it to avoid spikes 
    setWaveBuff(waveData);
    //synth.set_wave_from_amp(waveData);
    drawWave();
  }
  const mouseDown = (evt) => {
    setSculpting(true);
  }
  const mouseUp = (evt) => {
    setSculpting(false);
  }

  return (
    <div>
      <h2>Working Waveform:</h2>
      <div id = 'cv-container' onMouseMove = {mouseMove} onMouseDown = {mouseDown} onMouseUp = {mouseUp} onMouseOut = {mouseUp}>
        <canvas id='cv' />
      </div>
    </div>
    );
}

export default SculptView;
