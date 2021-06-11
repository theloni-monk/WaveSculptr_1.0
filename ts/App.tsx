import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import Plot from 'react-plotly.js';
import 'react-piano/dist/styles.css'; //TODO: write css to make pretty
import SculptView from './SculptView';
import AnalView from './AnalView';
import { WaveSynth } from '../pkg/index'; //for ts annotations
const wasmLoader = import('../pkg/index');
var samplerange: Float32Array;

const App = () => {
    const firstNote = MidiNumbers.fromNote('c4');
    const lastNote = MidiNumbers.fromNote('b4');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    const [wasm, loadWasm] = useState(null);
    const [synth, setSynth]: [WaveSynth, any] = useState(null);

    useEffect(async () => {
        const w = await wasmLoader;
        loadWasm(w);
    }, []);
    useEffect(() => {
        Promise.resolve().then(() =>
            setSynth(new wasm.WaveSynth())
        )
    }, [wasm]);
    useEffect(() => {
        //I wrap this in an empty promise so React can update state without hanging on it
        Promise.resolve().then(() => {
            let sampleRate = synth.get_sample_rate();
            let fftLen = synth.get_fft_len();
            samplerange = new Float32Array(fftLen);
            for (let i = 0; i < fftLen; i++) {
                samplerange[i] = (sampleRate / 2) * i / fftLen;
            }
            //plays for 100milis on startup 
            setTimeout(() => synth.end_note(71), 100); //end A note
        }
        )
    }, [synth]);

    return (
        <div>
            <h1>WaveSculptor_1.0</h1>
            <div style={{ display: 'grid', gridTemplateColumns:'60% 40%'}}>
                <Piano
                    noteRange={{ first: firstNote, last: lastNote }}
                    playNote={(midiNumber) => { if (synth) synth.start_note(midiNumber) }}
                    stopNote={(midiNumber) => { if (synth) synth.end_note(midiNumber) }}
                    width={800}
                    keyboardShortcuts={keyboardShortcuts}
                />
                <AnalView 
                        wasmInstance = {wasm}
                        synth = {synth}
                    />
                <SculptView
                    wasmInstance = {wasm}
                    synth={synth}
                />
            </div>
            <div style={{ display: 'flex' }}>
                
            </div>
        </div>
    );
}
export default App;