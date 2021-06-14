import * as _ from 'lodash';
import React, { useState, useLayoutEffect, useEffect,useRef } from 'react';
import { WaveSynth } from '../pkg';



const SculptView = (props: { wasmInstance: any, synth: WaveSynth }) => {

  const [synth, setSynth] = useState(null);
  const [waveBuff, setWaveBuff] = useState(null);
  const [doneLoading, setDoneLoading] = useState(false);
  let canvasRef = useRef();

  useEffect(() => {
    if (props.synth && (props.synth !== synth)) {
      setSynth(props.synth);
    }
  }, [props]);
  useEffect(() => {
    //I wrap this in an empty promise so React can update state without hanging on it
    Promise.resolve().then(() => ignoreErrors(()=>setWaveBuff(synth.get_wave_tspace())));
  }, [synth]);
  useEffect(() => {
    drawWave();
    //I wrap this in an empty promise so React can update state without hanging on it
    Promise.resolve().then(() => ignoreErrors(()=>props.wasmInstance.set_wave_from_amp_external(synth, waveBuff)));
  }, [waveBuff]);

  //canvas mapped to x: 0 -> len(waveData), y: -1 -> 1
  const drawWave = () => {
    if (!synth) return; 
    let cv: HTMLCanvasElement = canvasRef.current;
    let ctx = cv.getContext('2d');
    let step = cv.clientWidth / waveBuff.length;
    let heightMult = cv.clientHeight / 2;
    ctx.fillStyle = "#050505";
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.beginPath();
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#02FF00";
    ctx.moveTo(0, (cv.height / 2) - (waveBuff[0] * heightMult / 2));
    for (let i = 0; i < waveBuff.length; i++) {
      let x = i * step;
      let y = (cv.height / 2) - (waveBuff[i] * heightMult / 1.2); //dividing by  1.2 gives 10% margin top and bottom to the canvas
      ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  const [sculpting, setSculpting] = useState(false);
  const mouseMove = (evt: MouseEvent) => { //FIXME: mouse loc is broken again --account for scroll
    if (!sculpting) return;
    let cv: HTMLCanvasElement = canvasRef.current;
    let mx = evt.clientX - cv.offsetLeft;
    let my = evt.clientY - cv.offsetTop;
    let waveData = deepcopy(waveBuff);

    let floatIndex = Math.trunc((mx / cv.clientWidth) * waveData.length); //where we are in array
    let newFloat = 2 * ((cv.clientHeight - my) / cv.clientHeight) - 1; //remap to -1 -> 1
    newFloat *= 1.2;  //acount for 10% margin in the canvas

    //lerp along a slope datapoints around the index to account for mousemove event not polling for every pixel
    let lerpRange = 3;
    let startI = _.clamp(floatIndex - lerpRange, 0, waveData.length);
    let endI = _.clamp(floatIndex + lerpRange, waveData.length - 1);
    let slopeStrength = 0.2;
    for (let i = startI; i < endI; i++) {
      let range = endI - startI;
      let slope = (waveBuff[endI] - waveBuff[startI]) / range;
      let distance = i - floatIndex;
      waveData[i] = _.clamp(newFloat + (slope * distance * slopeStrength), -1, 1);
    }
    setWaveBuff(waveData);
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
      <div id='cv-container' >
        <canvas id='cv' ref={canvasRef} onMouseMove={mouseMove} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseOut={mouseUp} />
      </div>
    </div>
  );
}


/**---------UTILS---------**/
//cheap way to deepcopy in js
function deepcopy(buff: Float32Array){return buff.map(el => el)};

function ignoreErrors(cb:Function){
  try{
    cb();
  }
  catch(e){} //drop errors
}

export default SculptView;
