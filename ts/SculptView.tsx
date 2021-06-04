import React, { useState, useLayoutEffect, useEffect} from 'react';
import { WaveSynth } from '../pkg';
var ctx:CanvasRenderingContext2D;
var cv: HTMLCanvasElement;
const SculptView = (props:{synth: WaveSynth}) => {

    const [data, setData] = useState(new Float32Array());
    // the canvas rendering context is not immediately avalaible
    // the canvas node first needs to be added to the DOM by react
    useLayoutEffect(() => {
        cv = (document.getElementById('cv') as HTMLCanvasElement)
        ctx = cv.getContext("2d");
        console.log(ctx);
        if (props.synth) {
            setData(props.synth.get_wave_tspace());
        }
        drawWave();
    }, []);

    useLayoutEffect(() => {
        drawWave();
    }, [props]); //redraw when user updates data

    //canvas mapped to x: 0->len(waveData), y: -1->1
    const drawWave = () =>{
        let waveData = data;
        if(!(props.synth&&waveData)) return;
        let step = cv.width / waveData.length;
        let heightMult = cv.height / 2;
        ctx.moveTo(0,  (cv.height/2) - (waveData[0] * heightMult / 2));
        for(let i = 0; i< waveData.length; i++){
            let x = i * step;
            let y = (cv.height/2) - (waveData[i] * heightMult / 2);
            ctx.lineTo(x,y);
            ctx.moveTo(x,y);
        }
        ctx.stroke(); 
    }

    return (
        <div>
            <canvas id = 'cv' />
        </div>);
}

export default SculptView;
