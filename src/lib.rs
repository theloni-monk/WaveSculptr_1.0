use wasm_bindgen::prelude::*;
use web_sys::console;
use web_sys::{AudioContext};
use js_sys::{Float32Array};
use rustfft::{Fft, FftPlanner, FftDirection, num_complex::Complex};

//util
pub fn midi_to_freq(note: u8) -> f32 { 27.5 * 2f32.powf((note as f32 - 21.0) / 12.0) }
const FFTSIZE:usize = 256;
const SAMPLESIZE:usize = 128;


//arbitrary periodic wave
struct WaveForm{
    fseries: Vec<Complex<f32>>,
    amp: Vec<Complex<f32>> //only real used
}

pub fn split_complex_vec(input: &Vec<Complex<f32>>) -> (Vec<f32>, Vec<f32>) {
    let mut re_buff = vec![0f32; input.len()];
    let mut im_buff = vec![0f32; input.len()];
    for i in 0usize..input.len(){
        re_buff[i] = input[i].re;
        im_buff[i] = input[i].im;
    }
    return (re_buff, im_buff);
}

impl WaveForm{
    //gen basic sin wave on construction
    pub fn new(fft:&dyn Fft<f32>, bufferlen:usize) -> WaveForm{
        let step = 2 as f64 * std::f64::consts::PI / bufferlen as f64;

        let mut buff = vec![Complex{re: 0f32, im: 0f32}; bufferlen]; // empty complex buffer
        for i in 0usize..bufferlen{
            //init as basic sine wave from 0->2pi in real component
            buff[i] = Complex{ re: ((i as f64) * step).sin() as f32, im: 0f32 };
        }
        let amp = buff.clone(); //save amplitude vals

        fft.process(&mut buff); //process in place
        let fseries = buff;
        return 
        WaveForm{
            fseries,
            amp,
        };
    }

    //NOTE: fft must be in correct direction before calling these
    pub fn update_amp(&mut self, fft: &dyn Fft<f32>){
        //use inverse
        assert_eq!(fft.fft_direction(), FftDirection::Inverse);

        let mut new_a = self.fseries.clone();
        fft.process(&mut new_a);

        self.amp = new_a;
    }

    pub fn update_fseries(&mut self, fft: &dyn Fft<f32>){
        //use forward
        assert_eq!(fft.fft_direction(), FftDirection::Forward);

        let mut new_f = self.amp.clone();
        fft.process(&mut new_f);
        self.fseries = new_f;
    }
}

#[wasm_bindgen]
pub struct WaveSynth {
    // websys stuff
    ctx: AudioContext,
    samplerate: f32,
    osc: web_sys::OscillatorNode,
    per_wave: web_sys::PeriodicWave,
    gain_node: web_sys::GainNode,
    anal: web_sys::AnalyserNode,
    // our stuff
    gain_val: f32,
    wavelet: WaveForm,
    curr_note: u8, //currently mono
    fft_planner: FftPlanner<f32>
}

//mono periodic synth
#[wasm_bindgen]
impl WaveSynth{
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WaveSynth, JsValue>{
        // Create our web audio objects.
        let ctx = web_sys::AudioContext::new().unwrap();
        let samplerate = ctx.sample_rate();
        let osc = ctx.create_oscillator().unwrap();
        let gain_node = ctx.create_gain().unwrap();
        let anal = ctx.create_analyser().unwrap();
        //link nodes
        osc.connect_with_audio_node(&anal)?; //osc to anal
        anal.connect_with_audio_node(&gain_node)?; //anal to gain
        gain_node.connect_with_audio_node(&ctx.destination())?; //connect gain to speakers

        //init fft lib stuff
        let mut fft_planner = FftPlanner::new();
        let fft = fft_planner.plan_fft_forward(FFTSIZE);
        let wavelet = WaveForm::new(fft.as_ref(), FFTSIZE);
        anal.set_fft_size(FFTSIZE as u32);

        //init js-bound stuff
        let curr_note = 71u8; //A4
        osc.frequency().set_value(midi_to_freq(curr_note)); 
        let gain_val = 1f32; //start at ful vol
        gain_node.gain().set_value(gain_val); 
        
        //set initial periodic wave with fseries of simple sin wave
        let (mut real, mut imag) = split_complex_vec(&wavelet.fseries);
        let per_wave = ctx.create_periodic_wave(real.as_mut_slice(), imag.as_mut_slice()).unwrap();
        osc.set_periodic_wave(&per_wave);

        //start osc
        osc.start()?;
        
        return Ok(
            WaveSynth{
                ctx,
                samplerate,
                osc,
                per_wave,
                gain_node,   
                anal,
                wavelet,
                gain_val,
                curr_note,
                fft_planner
            }
        )
    }

    //FIXME: ramp gain to remove clicking
    //TODO: ramp frequency based on glide parameter
    #[wasm_bindgen]
    pub fn start_note(&mut self, note:u8){
        self.curr_note = note;
        let freq = midi_to_freq(note);
        self.osc.frequency().set_value(freq);
        self.gain_node.gain().set_value(self.gain_val); // turn on gain
    }

    #[wasm_bindgen]
    pub fn end_note(&mut self, note: u8){
        if note != self.curr_note {return};
        self.gain_node.gain().set_value(0f32);
        //just turn off gain
    }

    #[wasm_bindgen]  //note only next note will be at requested volume
    pub fn set_gain_node(&mut self, g:f32){ self.gain_val = g; }

    #[wasm_bindgen]
    pub fn get_sample_rate(&self) -> Result<f32, JsValue>{ Ok(self.samplerate) }

    #[wasm_bindgen]
    pub fn get_fft_len(&self) -> Result<f32, JsValue>{ Ok(SAMPLESIZE as f32) }

    #[wasm_bindgen]
    pub fn get_tspace(&self) -> Result<Float32Array,JsValue>{
        let buff: &mut [f32; FFTSIZE] = &mut [0f32; FFTSIZE];
        self.anal.get_float_time_domain_data(buff);
        let js_buff = Float32Array::new(&JsValue::from_f64(FFTSIZE as f64)); //this is hacky
        js_buff.copy_from(buff);
        return Ok(
            js_buff
        );
    }

    #[wasm_bindgen]
    pub fn get_fspace(&self) -> Result<Float32Array,JsValue>{
        let buff: &mut [f32; SAMPLESIZE] =  &mut [0f32; SAMPLESIZE];
        self.anal.get_float_frequency_data(buff);
        let js_buff = Float32Array::new(&JsValue::from_f64(SAMPLESIZE as f64)); //this is hacky
        js_buff.copy_from(buff);
        return Ok(
            js_buff
        );
    }

    #[wasm_bindgen]
    pub fn get_wave_tspace(&self) -> Result<Float32Array,JsValue>{
        let (mut re_buff, _im_buff) = split_complex_vec(&self.wavelet.amp);
        let js_buff = Float32Array::new(&JsValue::from_f64(FFTSIZE as f64)); //this is hacky
        js_buff.copy_from(re_buff.as_mut_slice());
        return Ok(
            js_buff
        );
    }

    #[wasm_bindgen]
    pub fn get_wave_fspace(&self) -> Result<Float32Array,JsValue>{
        let buff: &mut [f32; SAMPLESIZE] =  &mut [0f32; SAMPLESIZE];
        //WRITEME: convert wavelet fseries to float frequency data
        self.anal.get_float_frequency_data(buff); // for now just use anal node
        let js_buff = Float32Array::new(&JsValue::from_f64(SAMPLESIZE as f64)); //this is hacky
        js_buff.copy_from(buff);
        return Ok(
            js_buff
        );
    }

    fn update_osc(&mut self){
        let (mut re_buff, mut im_buff) = split_complex_vec(&self.wavelet.fseries);
        self.per_wave = self.ctx.create_periodic_wave(re_buff.as_mut_slice(), im_buff.as_mut_slice()).unwrap();
        self.osc.set_periodic_wave(&self.per_wave);
        console::log_1(&JsValue::from_str("rust updated osc"));
    }

}

// we have to have setters as external functions because js is already borrowing the synth and the synth cant borrow itself from that
// but js can pass its mutable borrow to an external function
#[wasm_bindgen]
pub fn set_wave_from_amp_external(syn: &mut WaveSynth, js_buff: Vec<f32>){
    assert_eq![js_buff.len(), FFTSIZE];
    for i in 0usize..js_buff.len(){
        syn.wavelet.amp[i] = Complex{re: js_buff[i], im: 0f32};
    }
    let fft = syn.fft_planner.plan_fft_forward(FFTSIZE);
    syn.wavelet.update_fseries(fft.as_ref());
    std::mem::forget(fft);
    syn.update_osc();
}

// entry point
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    console::log_1(&JsValue::from_str("rust linked successfully"));

    return Ok(());
}
