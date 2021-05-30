use wasm_bindgen::prelude::*;
use web_sys::console;
use web_sys::{AudioContext, OscillatorType};
use rustfft::{Fft, FftPlanner, FftDirection, num_complex::Complex};

//  Tests funcs
// Import the `window.alert` function from the Web.
#[wasm_bindgen]
extern "C"{
    fn alert(s: &str);
}
// Export a `greet` function from Rust to JavaScript
#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}

//our stuff:
//util
pub fn midi_to_freq(note: u8) -> f32 {
    27.5 * 2f32.powf((note as f32 - 21.0) / 12.0)
}

const SampleSize:usize = 1024;

#[wasm_bindgen]
struct WaveForm{
    fseries: Vec<Complex<f32>>,
    amp: Vec<Complex<f32>> //only real used
}

impl WaveForm{
    //gen basic sin wave on construction
    pub fn new( fft:& dyn Fft<f32>) -> Result<WaveForm, JsValue>{
        assert_eq!(fft.fft_direction(), FftDirection::Forward);

        let step = 2 as f64 * std::f64::consts::PI / SampleSize as f64;
        let buff = Vec::new();
        for i in 0usize..SampleSize{
            //init as basic cosine wave from 0->2pi
            buff.push(Complex{ re: ((i as f64) * step).cos() as f32,im: 0f32 });
        }
        let amp = buff.clone(); //save amplitude vals

        fft.process(&mut buff); //process in place
        let fseries = buff;

        return 
        Ok(WaveForm{
            fseries,
            amp,
        });
    }

    //NOTE: fft must be in correct direction before calling these
    pub fn update_amp(&mut self, fft: &dyn Fft<f32>){
        //use inverse
        assert_eq!(fft.fft_direction(), FftDirection::Inverse);

        let newA = self.fseries.clone();
        fft.process(&mut newA);

        self.amp = newA;
    }

    pub fn update_fseries(&mut self, fft: &dyn Fft<f32>){
        //use forward
        assert_eq!(fft.fft_direction(), FftDirection::Forward);

        let newF = self.amp.clone();
        fft.process(&mut newF);
        self.fseries = newF;
    }
}

#[wasm_bindgen]
struct WaveSynth {
    // websys stuff
    ctx: AudioContext,
    osc: web_sys::OscillatorNode,
    gain: web_sys::GainNode,
    // our stuff
    wavelet: WaveForm,
    curr_notes: Vec<u8>,
    fft_planner: FftPlanner<f32>,
    fft: dyn Fft<f32>,
}

#[wasm_bindgen]
impl WaveSynth{
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WaveSynth, JsValue>{
        //init
        let fft_planner = FftPlanner::new();
        let fft = fft_planner.plan_fft_forward(SampleSize);
        let wavelet = WaveForm::new(fft.as_ref());

        return Ok(
            WaveSynth{

            }
        )
    }

    #[wasm_bindgen]
    pub fn start_note(&mut self, note:u8){

    }
    #[wasm_bindgen]
    pub fn end_note(&mut self, note:u8){

    }
    
    pub fn setWave(&mut self, wave: WaveForm){

    }
}


// entry point
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    // Your code goes here!
    console::log_1(&JsValue::from_str("rust linked successfully"));


    return Ok(());
}
