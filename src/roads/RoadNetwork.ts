import { Console } from 'console';
import { timingSafeEqual } from 'crypto';
import {vec3, mat4, vec2} from 'gl-matrix';
import Square from '../geometry/Square';
import RoadSegment from './RoadSegment';

export default class RoadNetwork {
  roads: RoadSegment[] = [];
  side: number;
  gridSize: number;
  grid: number[][] = [];
  maxIndex: number;

  square: Square;
  quadTransfArrX: number[] = [];
  quadTransfArrY: number[] = [];
  quadTransfArrZ: number[] = [];
  quadTransfArrW: number[] = [];
  quadColorArr: number[] = [];
  numQuad: number = 0;

  constructor(side: number, gridSize: number, square: Square) {
    this.side = side;
    this.maxIndex = side / gridSize
    this.gridSize = gridSize;
    this.square = square;

    /*
    // initialize road grid
    let gridIdx: number = side / gridSize + 1;
    for (var i = 0; i < gridIdx; i++) {
      this.grid[i] = [];
      for (var j = 0; j < gridIdx; j++) {
        this.grid[i][j] = 0;
      }
    }*/

    this.init();
  }

  init() {
    this.roads = [];
    let queue: Map<number, RoadSegment> = new Map();

    // add starter road segments
    let start1: vec2 = vec2.fromValues(0, 0);
    let dir1: vec2 = vec2.fromValues(0, 1);
    queue.set(0, new RoadSegment(start1, dir1));

    let start2: vec2 = vec2.fromValues(this.maxIndex, this.maxIndex);
    let dir2: vec2 = vec2.fromValues(-1, 0);
    queue.set(1, new RoadSegment(start2, dir2));

    let start3: vec2 = vec2.fromValues(1, this.maxIndex);
    let dir3: vec2 = vec2.fromValues(0, -1);
    queue.set(2, new RoadSegment(start3, dir3));

    let start4: vec2 = vec2.fromValues(this.maxIndex, 0);
    let dir4: vec2 = vec2.fromValues(-1, 0);
    queue.set(3, new RoadSegment(start4, dir4));

    while (queue.size > 0) {
      // remove highest priority segment
      queue = new Map([...queue].sort());
      let key: number = Array.from(queue.keys())[0];
      let segment: RoadSegment = queue.get(key);
      queue.delete(key);

      console.log("key: " + key);
      console.log(segment);
      
      // check validity of segment
      if (!this.isValidSegment(segment)) continue;

      // add road if valid
      this.add(segment);

      // add new possible road segments
      let newSegments: Map<number, RoadSegment> = segment.getNext();
      for (let newKey of Array.from(newSegments.keys())) {
        let newSeg = newSegments.get(newKey);
        queue.set(key + newKey + 1, newSeg);
      }
    }
  }

  add(segment: RoadSegment) {
    this.roads.push(segment);
  }

  isValidSegment(segment: RoadSegment): boolean {
    if (segment.start[0] < 0 || segment.start[0] > this.maxIndex ||
        segment.start[1] < 0 || segment.start[1] > this.maxIndex) {
      return false;
    }

    if (segment.end[0] < 0 || segment.end[0] > this.maxIndex ||
        segment.end[1] < 0 || segment.end[1] > this.maxIndex) {
    return false;
    }

    for (var i = 0; i < this.roads.length; i++) {
      let existing = this.roads[i];
      if (vec2.equals(segment.start, existing.start) && vec2.equals(segment.end, existing.end)) {
        return false;
      } else if (vec2.equals(segment.start, existing.end) && vec2.equals(segment.end, existing.start)) {
        return false;
      }
    }

    return true;
  }

  render() {
    for (var i = 0; i < this.roads.length; i++) {
      let road = this.roads[i];
      let transform: mat4 = road.getTransformation(this.side, this.gridSize);
      this.quadTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
      this.quadTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
      this.quadTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
      this.quadTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
      this.quadColorArr.push(0.3, 0.3, 0.3, 1);
      this.numQuad++;
    }

    let quadTransfX: Float32Array = new Float32Array(this.quadTransfArrX);
    let quadTransfY: Float32Array = new Float32Array(this.quadTransfArrY);
    let quadTransfZ: Float32Array = new Float32Array(this.quadTransfArrZ);
    let quadTransfW: Float32Array = new Float32Array(this.quadTransfArrW);
    let quadColors: Float32Array = new Float32Array(this.quadColorArr);
    this.square.setInstanceVBOs(quadTransfX, quadTransfY, quadTransfZ, quadTransfW, quadColors);
    this.square.setNumInstances(this.numQuad);
  }

  log() {
    for (var i = 0; i < this.roads.length; i++) {
      let road = this.roads[i];
      console.log(i + ": " + road.start + " " + road.end);
    }
  }
}