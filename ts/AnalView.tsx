import * as _ from 'lodash';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { WaveSynth } from '../pkg';


//these rlly should be inside the function but whatever
var ctx: CanvasRenderingContext2D;
var cv: HTMLCanvasElement;
const AnalView = (props: { wasmInstance: any, synth: WaveSynth }) => {

  const [synth, setSynth] = useState(null); //schrodingers synthesizer
  const [analBuff, setAnalBuff] = useState(null);

  useLayoutEffect(() => {
    cv = (document.getElementById('fcv') as HTMLCanvasElement)
    ctx = cv.getContext("2d");
  }, []);
  useEffect(() => {
    if (props.synth && (props.synth !== synth)) {
      setSynth(props.synth);
    }
  }, [props]);
  useEffect(() => {
    drawAnal();
  }, [analBuff]);

  //TODO: change colors for clarity
  const drawAnal = () => {
    if (synth) { } else return;
    let step = cv.clientWidth / analBuff.length;
    let heightMult = cv.clientHeight / 100;
    ctx.fillStyle = "#0505F5";
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.beginPath();
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#02FF00";
    ctx.moveTo(0, (cv.height / 2) - (analBuff[0] * heightMult + 75));
    for (let i = 0; i < analBuff.length; i++) {
      let x = i * step;
      let y = (cv.height / 2) - (analBuff[i] * heightMult + 75); //flat pixel offset of 75 is hacky
      ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  const animate = (dt:number) => {
    Promise.resolve().then(() => setAnalBuff(synth.get_fspace()));
    requestAnimationFrame(animate);
  }

  

  return (
    <div>
      <h2>Spectrogram</h2>
      <div id='fcv-container' >
        <canvas id='fcv'/>
      </div>
      <button onClick = {()=>Promise.resolve().then(() => requestAnimationFrame(animate))}>start</button>
    </div>
  );
}


/**---------UTILS---------**/
//cheap way to deepcopy in js
const deepcopy = (buff:Float32Array):Float32Array => buff.map(el => el);

export default AnalView;
