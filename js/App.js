import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import Plot from 'react-plotly.js';
import _ from 'lodash';
import 'react-piano/dist/styles.css'; //TODO: write css to make pretty
const wasmLoader = import('../pkg/index');
var rust;
var syn;
var samplerange;

const App = () => {
    const firstNote = MidiNumbers.fromNote('c3');
    const lastNote = MidiNumbers.fromNote('c4');
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
            let sampleRate = syn.get_sample_rate();
            let fftLen = syn.get_fft_len();
            samplerange = new Float32Array(fftLen);
            for(let i in _.range(fftLen)){
                samplerange[i] = (sampleRate/2) * i / fftLen;
            }
            console.log(samplerange)
            //plays for one sec on startup 
            setTimeout(() => syn.end_note(), 1000);
        })
    }, []);

    //TODO: animate plots
    //TODO: make scultable
    return (
        <div>
            <header>WaveSculptor_1.0</header>
            <Piano
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midiNumber) => {
                    // Play a given note - see notes below
                    if (syn) syn.start_note(midiNumber);
                }}
                stopNote={(midiNumber) => {
                    // Stop playing a given note - see notes below
                    if (syn) syn.end_note();
                }}
                width={1000}
                keyboardShortcuts={keyboardShortcuts}
            />
            <button onClick={() => {
                if (syn) {
                    setTData(syn.get_tspace()); 
                }
            }}>get time domain</button>

            <button onClick={() => {
                if (syn) {
                    setFData(syn.get_fspace());
                }
            }}>get frequency domain</button>

            <Plot
                data={[
                    { //TODO: normalize this plot based on sample len
                        x: Array(tdata.length).keys(),
                        y: tdata,
                        type: 'scatter',
                        mode: 'lines+markers',
                        marker: { color: 'red' },
                    }
                ]}
                layout={{ width: 600, height: 240, title: 't domain plot' }}
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