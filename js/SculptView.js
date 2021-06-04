import React, { useState, useLayoutEffect } from 'react';
var ctx;
var cv;
var SculptView = function (props) {
    var _a = useState(new Float32Array()), data = _a[0], setData = _a[1];
    // the canvas rendering context is not immediately avalaible
    // the canvas node first needs to be added to the DOM by react
    useLayoutEffect(function () {
        cv = document.getElementById('cv');
        ctx = cv.getContext("2d");
        console.log(ctx);
        if (props.synth) {
            setData(props.synth.get_wave_tspace());
        }
        drawWave();
    }, []);
    useLayoutEffect(function () {
        drawWave();
    }, [props]); //redraw when user updates data
    //canvas mapped to x: 0->len(waveData), y: -1->1
    var drawWave = function () {
        var waveData = data;
        if (!(props.synth && waveData))
            return;
        var step = cv.width / waveData.length;
        var heightMult = cv.height / 2;
        ctx.moveTo(0, (cv.height / 2) - (waveData[0] * heightMult / 2));
        for (var i = 0; i < waveData.length; i++) {
            var x = i * step;
            var y = (cv.height / 2) - (waveData[i] * heightMult / 2);
            ctx.lineTo(x, y);
            ctx.moveTo(x, y);
        }
        ctx.stroke();
    };
    return (React.createElement("div", null,
        React.createElement("canvas", { id: 'cv' })));
};
export default SculptView;
