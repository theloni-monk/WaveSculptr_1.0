import React, { useState, useEffect } from 'react';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
const rust = import('../pkg/index');

const App = () => {
    const firstNote = MidiNumbers.fromNote('c3');
    const lastNote = MidiNumbers.fromNote('c4');
    const keyboardShortcuts = KeyboardShortcuts.create({
        firstNote: firstNote,
        lastNote: lastNote,
        keyboardConfig: KeyboardShortcuts.HOME_ROW,
    });
    var r;
    var syn;
    useEffect(()=>{
        rust.then((wasm)=>{
            r = wasm;
            syn = new r.WaveSynth();
            //plays for one sec on startup 
            setTimeout(()=>syn.end_note(), 1000);
        })
    });

    //TODO: integrate
    return (
        <div>
            <header>WaveSculptor_1.0</header>
            <Piano
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midiNumber) => {
                    // Play a given note - see notes below
                    if(syn) syn.start_note(midiNumber);
                }}
                stopNote={(midiNumber) => {
                    // Stop playing a given note - see notes below
                    if(syn) syn.end_note();
                }}
                width={1000}
                keyboardShortcuts={keyboardShortcuts}
            />
        </div>
    );
}
export default App;