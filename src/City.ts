import {vec3, vec2, mat4} from 'gl-matrix';
import Building from './Buildings/Building';
import Cube from './geometry/Cube';
import Square from './geometry/Square';
import RoadNetwork from './roads/RoadNetwork';

export default class City {
  center: vec3;
  buildings: Building[][] = [];
  roads: RoadNetwork;
  roadWidth: number = 0.3;

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

  square: Square;


  constructor(center: vec3, side: number, gridSize: number, cube: Cube, square: Square) {
    this.center = center;
    this.side = side;
    this.gridSize = gridSize;
    this.maxIndex = side / gridSize;
    this.cube = cube;
    this.square = square;

    // create roads
    this.roads = new RoadNetwork(side, gridSize, square);
    this.roads.render();
    this.roads.log();

    // create buildings
    this.init();
  }

  noise(p: vec2): number {
    let n = Math.abs((Math.sin(vec2.dot(p, vec2.fromValues(127.1, 311.7))) * 1288.002) % 1);
    return n;
  }

  interpNoise(x: number, y: number): number {
    let intX = Math.floor(x);
    let fractX = x % 1;
    let intY = Math.floor(y);
    let fractY = y % 1;
  
    let v1 = this.noise(vec2.fromValues(intX, intY));
    let v2 = this.noise(vec2.fromValues(intX + 1, intY));
    let v3 = this.noise(vec2.fromValues(intX, intY + 1));
    let v4 = this.noise(vec2.fromValues(intX + 1, intY + 1));
  
    let i1 = v1 * fractX + v2 * (1.0 - fractX);
    let i2 = v3 * fractX + v4 * (1.0 - fractX);
    let out = i1 * fractY + i2 * (1.0 - fractY)
    return out;
  }

  fbm(x: number, y: number) {
    let total: number = 0;
    let persistence: number = 0.72;
    let octaves: number = 4;
  
    for(var i = 1; i <= octaves; i++) {
      let freq = Math.pow(2, i);
      let amp = Math.pow(persistence, i);
      total += this.interpNoise(x * freq, y * freq) * amp;
    }

    return total;
  }

  init() {
    // TODO

    // initialize buildings
    let centerIdx: number = this.maxIndex / 2.0;
    for (var i = 0; i < this.maxIndex; i++) {
      this.buildings[i] = [];
      for (var j = 0; j < this.maxIndex; j++) {
        let dims: vec3 = vec3.fromValues(this.gridSize - 0.4,
                                         this.fbm(i, j),
                                         this.gridSize - 0.4);
        let corner: vec3 = vec3.fromValues((i - centerIdx) * this.gridSize,
                                           0,
                                           (j - centerIdx) * this.gridSize);
        this.buildings[i][j] = new Building(vec3.clone(corner), vec3.clone(dims));
      }
    }

    // merge buildings if possible
    var i = 0;
    var j = 0;
    /*
    while (i < this.maxIndex) {
      while (j < this.maxIndex) {*/
    for(var i = 0; i < this.maxIndex; i++) {
      for (var j = 0; j < this.maxIndex; j++) {
        let building = this.buildings[i][j];
        if (building == null) continue;

        let xSize: number = 1;
        let zSize: number = 1;

        // expand in x direction
        while (true && xSize < this.maxIndex - i && zSize < this.maxIndex - i) {
          /*for (var x = 0; x < xSize; x++) {
            for (var z = 0; z < zSize; z++) {

            }
          }*/

          let start: vec2 = vec2.fromValues(i + xSize, j);
          let end: vec2 = vec2.fromValues(i + xSize, j + 1);
          //console.log("checking if road ", i + xExpand, j, " to ", i + xExpand, j + 1, "exists");
          if (!this.roads.exists(start, end)) {
            xSize++
          } else {
            break;
          }
        }

        // expand building footprint
        let newWidth = xSize * this.gridSize - 0.4;
        let newDepth = zSize * this.gridSize - 0.4;
        this.buildings[i][j].setFootprint(newWidth, newDepth);

        console.log("expanded building", i, j, " by ", xSize, zSize);

        // erase overlapped buildings
        if (xSize > 1 || zSize > 1) {
          for (var x = 0; x < xSize; x++) {
            for (var z = 0; z < zSize; z++) {
              if (x == 0 && z == 0) continue;
              this.buildings[i + x][j + z] = null;

              //console.log("x", x, "z", z);
              //console.log("erasing building", i + x, j + z, "bc of expanded" , i, j);
            }
          }
        }
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
    mat4.scale(scale, scale, vec3.fromValues(this.side + this.roadWidth, 0.4, this.side + this.roadWidth));

    let translation: mat4 = mat4.create();
    mat4.fromTranslation(translation, vec3.fromValues(this.center[0],
                                                      this.center[1] - 0.2 - 0.01,
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
        if (building == null) continue;

        let freq = this.songFreq[i * this.maxIndex + j];
        let transform: mat4 = building.getTransformation(freq, time);
        this.cubeTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
        this.cubeTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
        this.cubeTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
        this.cubeTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
        this.cubeColorArr.push(1.5 * i / this.maxIndex, 1.5 * j / this.maxIndex, 1, 1);
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