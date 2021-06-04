import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import Plot from 'react-plotly.js';
import 'react-piano/dist/styles.css'; //TODO: write css to make pretty
import SculptView from './SculptView';
import { WaveSynth } from '../pkg/index';
const wasmLoader = import('../pkg/index');
var rust;
var syn: WaveSynth;
var samplerange;

const App = () => {
    const firstNote = MidiNumbers.fromNote('c4');
    const lastNote = MidiNumbers.fromNote('c5');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    const [tdata, setTData] = useState(new Float32Array());
    const [fdata, setFData] = useState(new Float32Array());

    useEffect(() => {
        wasmLoader.then((wasm) => {
            rust = wasm;
            syn = new rust.WaveSynth();
            //resolutino of fft is from 0hz to half of the sample rate
            let sampleRate = syn.get_sample_rate();
            let fftLen = syn.get_fft_len();
            samplerange = new Float32Array(fftLen);
            for(let i= 0; i<fftLen; i++){
                samplerange[i] = (sampleRate/2) * i / fftLen;
            }
            //plays for one sec on startup 
            setTimeout(() => syn.end_note(), 100);
        })
    }, []);

    return (
        <div>
            <header>WaveSculptor_1.0</header>
            <Piano
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midiNumber) => { if (syn) syn.start_note(midiNumber);}}
                stopNote={(midiNumber) => {if (syn) syn.end_note();}}
                width={1000}
                keyboardShortcuts={keyboardShortcuts}
            />
            <button onClick={() => {
                if (syn) {
                    setFData(syn.get_fspace());
                }
            }}>get frequency domain</button>
            <SculptView 
            synth = {syn}
            />
            <Plot
                data={[
                    {
                        x: samplerange,
                        y: fdata,
                        type: 'scatter',
                        mode: 'lines+markers',
                        marker: { color: 'red' },
                    }
                ]}
                layout={{ width: 600, height: 240, title: 'f domain plot' }}
            />

        </div>
    );
}
export default App;