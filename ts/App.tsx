import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import Plot from 'react-plotly.js';
import 'react-piano/dist/styles.css'; //TODO: write css to make pretty
import SculptView from './SculptView';
import { WaveSynth } from '../pkg/index'; //for ts annotations
const wasmLoader = import('../pkg/index');
var samplerange: Float32Array;

const App = () => {
    const firstNote = MidiNumbers.fromNote('c4');
    const lastNote = MidiNumbers.fromNote('c5');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });

    const [wasm, loadWasm] = useState(null);
    const [synth, setSynth]: [WaveSynth, any] = useState(null);
    const [fdata, setFData] = useState(new Float32Array());

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
        Promise.resolve().then(() => {
            let sampleRate = synth.get_sample_rate();
            let fftLen = synth.get_fft_len();
            samplerange = new Float32Array(fftLen);
            for (let i = 0; i < fftLen; i++) {
                samplerange[i] = (sampleRate / 2) * i / fftLen;
            }
            //plays for 100milis on startup 
            setTimeout(() => synth.end_note(), 100);
        }
        )
    }, [synth]);

    return (
        <div>
            <h1>WaveSculptor_1.0</h1>
            <div style={{ display: 'grid', gridTemplateColumns:'70% 30%'}}>
                <Piano
                    noteRange={{ first: firstNote, last: lastNote }}
                    playNote={(midiNumber) => { if (synth) synth.start_note(midiNumber); }}
                    stopNote={(midiNumber) => { if (synth) synth.end_note(); }}
                    width={800}
                    keyboardShortcuts={keyboardShortcuts}
                />
                <SculptView
                    synth={synth}
                />
            </div>
            <div style={{ display: 'flex' }}>
                <button onClick={() => {
                    if (synth) {
                        setFData(synth.get_fspace());
                    }
                }}>get spectrum</button>
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
        </div>
    );
}
export default App;