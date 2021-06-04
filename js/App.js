import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import Plot from 'react-plotly.js';
import 'react-piano/dist/styles.css'; //TODO: write css to make pretty
import SculptView from './SculptView';
var wasmLoader = import('../pkg/index');
var rust;
var syn;
var samplerange;
var App = function () {
    var firstNote = MidiNumbers.fromNote('c4');
    var lastNote = MidiNumbers.fromNote('c5');
    var keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    var _a = useState(new Float32Array()), tdata = _a[0], setTData = _a[1];
    var _b = useState(new Float32Array()), fdata = _b[0], setFData = _b[1];
    useEffect(function () {
        wasmLoader.then(function (wasm) {
            rust = wasm;
            syn = new rust.WaveSynth();
            //resolutino of fft is from 0hz to half of the sample rate
            var sampleRate = syn.get_sample_rate();
            var fftLen = syn.get_fft_len();
            samplerange = new Float32Array(fftLen);
            for (var i = 0; i < fftLen; i++) {
                samplerange[i] = (sampleRate / 2) * i / fftLen;
            }
            //plays for one sec on startup 
            setTimeout(function () { return syn.end_note(); }, 100);
        });
    }, []);
    return (React.createElement("div", null,
        React.createElement("header", null, "WaveSculptor_1.0"),
        React.createElement(Piano, { noteRange: { first: firstNote, last: lastNote }, playNote: function (midiNumber) { if (syn)
                syn.start_note(midiNumber); }, stopNote: function (midiNumber) { if (syn)
                syn.end_note(); }, width: 1000, keyboardShortcuts: keyboardShortcuts }),
        React.createElement("button", { onClick: function () {
                if (syn) {
                    setFData(syn.get_fspace());
                }
            } }, "get frequency domain"),
        React.createElement(SculptView, { synth: syn }),
        React.createElement(Plot, { data: [
                {
                    x: samplerange,
                    y: fdata,
                    type: 'scatter',
                    mode: 'lines+markers',
                    marker: { color: 'red' },
                }
            ], layout: { width: 600, height: 240, title: 'f domain plot' } })));
};
export default App;
