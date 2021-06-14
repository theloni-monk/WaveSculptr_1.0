import * as _ from 'lodash';
import React, { useState, useEffect, useRef } from 'react';
import { WaveSynth } from '../pkg';

//TODO: export reused func to utils
function ignoreErrors(cb:Function){
  try{
    cb();
  }
  catch(e){} //drop errors
}
//these rlly should be inside the function but whatever
const AnalView = (props: { wasmInstance: any, synth: WaveSynth }) => {

  const [synth, setSynth] = useState(null);
  //TODO: optimize with sharedarraybuffer
  const [analBuff, setAnalBuff]:[Float32Array, any] = useState(null);
  const [doneLoading, setDoneLoading] = useState(false);
  let canvasRef = useRef();

  const drawAnal = () => {
    let cv: HTMLCanvasElement = canvasRef.current;
    let ctx = cv.getContext('2d');
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

  //starts animation loop
  const init = () => {
    if (!(synth && analBuff)) return;
    let requestId;
    const animate = (dt: number) => {
      let newBuff = synth.get_fspace();
      setAnalBuff(newBuff);
      requestId = requestAnimationFrame(animate);
    }
    animate(0);

    //return callback to cleanup
    return () => cancelAnimationFrame(requestId);
  }

  //long chain of useeffect waits for each thing to be set before triggering a dependent thing
  useEffect(() => {
    if (props.synth && (props.synth !== synth)) {
      Promise.resolve().then(() => ignoreErrors(()=>{setSynth(props.synth);}));
    }
  }, [props]);
  useEffect(() => {
    Promise.resolve().then(() => ignoreErrors(()=>{setAnalBuff(synth.get_fspace());}));
  }, [synth]);
  useEffect(() => {
    if(analBuff == null) return;
    if(doneLoading) {
      drawAnal(); 
    }
    else Promise.resolve().then(() => setDoneLoading(true));
  }, [analBuff])
  useEffect(() => {
    if(doneLoading){
      console.log('spectrogram finished loading')
      init();
    }
  }, [doneLoading])

  return (
    <div>
      <h2>Spectrogram</h2>
      {!doneLoading ? 'Loading...' : ''}
      <div id='cv-container' >
        <canvas ref={canvasRef} id='fcv' />
      </div>
    </div>
  );
}

export default AnalView;
