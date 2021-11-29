import {vec3, mat4} from 'gl-matrix';
import LSystem from './lsystem/LSystem';
import Building from './Buildings/Building';
import Cube from './geometry/Cube';

export default class City {
  center: vec3;
  //buildings: LSystem;
  buildings: Building[][] = [];

  side: number;
  gridSize: number;
  maxIndex: number;

  freqData: Uint8Array;
  songAnalyzer: THREE.AudioAnalyser;
  songFreq: Uint8Array;
  fftSize: number = 64;

  cube: Cube;
  cubeTransfArrX: number[] = [];
  cubeTransfArrY: number[] = [];
  cubeTransfArrZ: number[] = [];
  cubeTransfArrW: number[] = [];
  cubeColorArr: number[] = [];
  numCube: number = 0;

  roadWidth: number = 0.3;

  constructor(center: vec3, side: number, gridSize: number, cube: Cube) {
    this.center = center;
    this.side = side;
    this.gridSize = gridSize;
    this.maxIndex = side / gridSize;
    this.cube = cube;

    // TODO create roads

    // TODO create buildings
    this.init();
  }

  init() {
    // TODO

    // initialize buildings
    let dims: vec3 = vec3.fromValues(this.gridSize - 0.4,
                                     1,
                                     this.gridSize - 0.4);
    let centerIdx: number = this.maxIndex / 2.0;
    for (var i = 0; i < this.maxIndex; i++) {
      this.buildings[i] = [];
      for (var j = 0; j < this.maxIndex; j++) {
        let corner: vec3 = vec3.fromValues((i - centerIdx) * this.gridSize,
                                           0,
                                           (j - centerIdx) * this.gridSize);
        this.buildings[i][j] = new Building(vec3.clone(corner), vec3.clone(dims));
      }
    }
  }

  reset() {

  }

  setSongAnalyzer(analyzer: THREE.AudioAnalyser) {
    this.songAnalyzer = analyzer;
  }

  setSongFreq(freq: Uint8Array) {
    this.songFreq = freq;
  }

  update(time: number) {
    // get latest frequency data
    if (this.songAnalyzer == null) return;
    this.songFreq = this.songAnalyzer.getFrequencyData();

    // reset all
    this.cubeTransfArrX = [];
    this.cubeTransfArrY = [];
    this.cubeTransfArrZ = [];
    this.cubeTransfArrW = [];
    this.cubeColorArr = [];
    this.numCube = 0;

    // base
    let baseTransform: mat4 = mat4.create();

    let scale: mat4 = mat4.create();
    mat4.scale(scale, scale, vec3.fromValues(this.side + this.roadWidth, 0.2, this.side + this.roadWidth));

    let translation: mat4 = mat4.create();
    mat4.fromTranslation(translation, vec3.fromValues(this.center[0],
                                                      this.center[1] - 0.1 - 0.01,
                                                      this.center[2]));

    mat4.multiply(baseTransform, translation, scale);
    this.cubeTransfArrX.push(baseTransform[0], baseTransform[1], baseTransform[2], baseTransform[3]);
    this.cubeTransfArrY.push(baseTransform[4], baseTransform[5], baseTransform[6], baseTransform[7]);
    this.cubeTransfArrZ.push(baseTransform[8], baseTransform[9], baseTransform[10], baseTransform[11]);
    this.cubeTransfArrW.push(baseTransform[12], baseTransform[13], baseTransform[14], baseTransform[15]);
    this.cubeColorArr.push(0.2, 0.9, 0.9, 1);
    this.numCube++;

    // buildings
    for (var i = 0; i < this.maxIndex; i++) {
      for (var j = 0; j < this.maxIndex; j++) {
        let building = this.buildings[i][j];
        let freq = this.songFreq[i * this.maxIndex + j];
        let transform: mat4 = building.getTransformation(freq, time);
        this.cubeTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
        this.cubeTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
        this.cubeTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
        this.cubeTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
        this.cubeColorArr.push(0.8, 1.0, 0.3, 1);
        this.numCube++;
      }
    }

    let cubeTransfX: Float32Array = new Float32Array(this.cubeTransfArrX);
    let cubeTransfY: Float32Array = new Float32Array(this.cubeTransfArrY);
    let cubeTransfZ: Float32Array = new Float32Array(this.cubeTransfArrZ);
    let cubeTransfW: Float32Array = new Float32Array(this.cubeTransfArrW);
    let cubeColors: Float32Array = new Float32Array(this.cubeColorArr);
    this.cube.setInstanceVBOs(cubeTransfX, cubeTransfY, cubeTransfZ, cubeTransfW, cubeColors);
    this.cube.setNumInstances(this.numCube);
  }

  log() {
    console.log("num buildings: " + this.maxIndex * this.maxIndex);
  }
}