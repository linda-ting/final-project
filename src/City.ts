import {vec3, vec2, mat4, vec4} from 'gl-matrix';
import { Z_ASCII } from 'zlib';
import Building from './Buildings/Building';
import Cube from './geometry/Cube';
import Square from './geometry/Square';
import RoadNetwork from './roads/RoadNetwork';

export default class City {
  center: vec3;
  buildings: Building[][] = [];
  roads: RoadNetwork;
  roadWidth: number = 0.1;
  roadPadding: number = 0.24;

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

  baseColor: vec4 = vec4.create();
  roadColor: vec4 = vec4.create();
  buildingColor: vec3 = vec3.create();
  colorA: vec3 = vec3.create();
  colorB: vec3 = vec3.create();
  colorC: vec3 = vec3.create();
  colorD: vec3 = vec3.create();

  constructor(center: vec3, side: number, gridSize: number, cube: Cube, square: Square) {
    this.center = center;
    this.side = side;
    this.gridSize = gridSize;
    this.maxIndex = side / gridSize;
    this.cube = cube;
    this.square = square;
    this.buildings = [];

    this.baseColor = vec4.fromValues(0.8, 1.2, 1.0, 1);
    this.roadColor = vec4.fromValues(1.3, 1.3, 1.1, 1);
    this.colorA = vec3.fromValues(0.838, 0.408, 1.078);
    this.colorB = vec3.fromValues(0.218, -0.362, 0.438);
    this.colorC = vec3.fromValues(-0.802, 0.858, 1.158);
    this.colorD = vec3.fromValues(-1.052, -0.892, -0.642);
    this.buildingColor = vec3.fromValues(0.6, 0.5, 0.3);

    // create roads
    this.roads = new RoadNetwork(side, gridSize, square, this.roadColor);
    this.roads.render();

    // create buildings
    this.init();
  }

  init() {
    // initialize buildings
    this.buildings = [];

    let centerIdx: number = this.maxIndex / 2.0;
    for (var i = 0; i < this.maxIndex; i++) {
      this.buildings[i] = [];
      for (var j = 0; j < this.maxIndex; j++) {
        let dims: vec3 = vec3.fromValues(this.gridSize - 2 * this.roadPadding,
                                         1.3 * this.gain(this.fbm(i, j), 0.55),
                                         this.gridSize - 2 * this.roadPadding);
        let corner: vec3 = vec3.fromValues((i - centerIdx) * this.gridSize,
                                           0,
                                           (j - centerIdx) * this.gridSize);
        this.buildings[i][j] = new Building(vec3.clone(corner), vec3.clone(dims));
      }
    }

    // merge buildings
    for(var i = 0; i < this.maxIndex; i++) {
      for (var j = 0; j < this.maxIndex; j++) {
        let building = this.buildings[i][j];
        if (building == null) continue;

        let xSize: number = 1;
        let zSize: number = 1;

        while (true && xSize + i < this.maxIndex && zSize + j < this.maxIndex) {
          let xExpand: boolean = true;
          let zExpand: boolean = true;
          
          // check if can expand in z dir
          for (var x = 0; x < xSize; x++) {
            let start: vec2 = vec2.fromValues(i + x + xSize, j);
            let end: vec2 = vec2.fromValues(i + x + xSize, j + 1);

            let xCheck = i + x + xSize;
            let zCheck = j + zSize;
            let buildingExists = this.buildingExists(xCheck, zCheck, i, j);

            if (this.roads.exists(start, end) || buildingExists) {
              xExpand = false;
              break;
            }
          }

          // check if can expand in x dir
          for (var z = 0; z < zSize; z++) {
            let start: vec2 = vec2.fromValues(i, j + z + zSize);
            let end: vec2 = vec2.fromValues(i + 1, j + z + zSize);

            let xCheck = i + xSize;
            let zCheck = j + z + zSize;
            let buildingExists = this.buildingExists(xCheck, zCheck, i, j);

            if (this.roads.exists(start, end) || buildingExists) {
              zExpand = false;
              break;
            }
          }

          if (Math.pow(Math.random(), xSize + zSize) < 0.7) break;
          if (xExpand) xSize++;
          if (zExpand) zSize++;
        }

        // expand building footprint
        let newWidth = xSize * this.gridSize - 2 * this.roadPadding;
        let newDepth = zSize * this.gridSize - 2 * this.roadPadding;
        this.buildings[i][j].setFootprint(newWidth, newDepth);

        // erase overlapped buildings
        if (xSize == 1 && zSize == 1) continue;
        for (var x = 0; x < xSize; x++) {
          for (var z = 0; z < zSize; z++) {
            if (x == 0 && z == 0) continue;
            this.buildings[i + x][j + z] = null;
          }
        }

        //console.log("expanded building", i, j, " by ", xSize, zSize);
      }
    }

    // expand buildings
    for (var i = 0; i < this.maxIndex; i++) {
      for (var j = 0; j < this.maxIndex; j++) {
        let building = this.buildings[i][j];
        if (building == null) continue;
        building.expand(1);
      }
    }
  }

  buildingExists(x: number, z: number, thisI: number, thisJ: number): boolean {    
    if (x < 0 || x > this.maxIndex || z < 0 || z > this.maxIndex) return false;

    let diff = Math.floor(this.maxIndex / 2);
    
    for (var i = 0; i <= x && i < this.maxIndex; i++) {
      for (var j = 0; j <= z && j < this.maxIndex; j++) {
        if (i == thisI && j == thisJ) continue;

        let building = this.buildings[i][j];
        if (building == null) continue;

        let start = vec3.clone(building.corner);
        vec3.add(start, start, [diff, 0, diff]);

        let dims = vec3.create();
        vec3.add(dims, building.dimensions, [2 * this.roadPadding, 0, 2 * this.roadPadding]);
        vec3.divide(dims, dims, [this.gridSize, 1, this.gridSize]);

        let notExpanded = dims[0] == 1 && dims[2] == 1;
        if (notExpanded) continue;

        let end = vec3.create();
        vec3.add(end, start, dims);

        if (start[0] <= x && end[0] >= x && start[2] <= z && end[2] >= z) {
          return true;
        }
      }
    }

    return false;
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
    this.cubeColorArr.push(this.baseColor[0], this.baseColor[1], this.baseColor[2], this.baseColor[3]);
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
        let t = 200 * this.fbm(j, i);
        let color: vec3 = this.palette(t, this.colorA, this.colorB, this.colorC, this.colorD);
        vec3.multiply(color, [1.4, 1.6, 1.0], color);
        this.cubeColorArr.push(color[0], 0.3 * i / this.maxIndex + color[1], 0.3 * (1 - j / this.maxIndex) + color[2], 1.0);
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

  noise(p: vec2): number {
    let n = Math.abs((Math.sin(vec2.dot(p, vec2.fromValues(127.1, 311.7))) * 1288.002) % 1.0);
    if (n > 1) console.log("n " + n);
    return n;
  }

  interpNoise(x: number, y: number): number {
    let intX = Math.floor(x);
    let fractX = x % 1.0;
    let intY = Math.floor(y);
    let fractY = y % 1.0;
  
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
    let persistence: number = 0.78;
    let octaves: number = 4;
  
    for(var i = 1; i <= octaves; i++) {
      let freq = Math.pow(2, i);
      let amp = Math.pow(persistence, i);
      total += this.interpNoise(x * freq, y * freq) * amp;
    }

    return total;
  }

  bias(time: number, bias: number)
  {
    return (time / ((((1.0 / bias) - 2.0) * (1.0 - time)) + 1.0));
  }

  gain(time: number, gain: number)
  {
    if(time < 0.5)
      return this.bias(time * 2.0, gain) / 2.0;
    else
      return this.bias(time * 2.0 - 1.0, 1.0 - gain) / 2.0 + 0.5;
  }

  palette(t: number, a: vec3, b: vec3, c: vec3, d: vec3) 
  {
    let red = a[0] + b[0] * Math.cos(Math.PI * 1.0 * (c[0] * t + d[0]));
    let green = a[1] + b[1] * Math.cos(Math.PI * 1.0 * (c[1] * t + d[1]));
    let blue = a[2] + b[2] * Math.cos(Math.PI * 1.0 * (c[2] * t + d[2]));
    return vec3.fromValues(red, green, blue);
  }
}