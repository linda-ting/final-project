import {vec3, mat4} from 'gl-matrix';
import LSystem from './lsystem/LSystem';

export default class City {
  buildings: LSystem;
  freqData: Uint8Array;
  side: number;
  gridSize: number;

  constructor(center: vec3, side: number, gridSize: number) {
    // TODO create roads

    // TODO create buildings
  }

  init() {
    // TODO
    
  }

  reset() {

  }

  setSongData(freq: Uint8Array) {
    this.freqData = freq;
  }

  render() {

  }
}