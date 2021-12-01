import {vec3, mat4, vec2} from 'gl-matrix';

export default class RoadSegment {
  start: vec2 = vec2.create();
  end: vec2 = vec2.create();
  direction: vec2 = vec2.create();

  width: number = 0.2;

  constructor(start: vec2, dir: vec2) {
    this.start = start;
    this.direction = dir;
    this.end = vec2.fromValues(start[0] + dir[0], start[1] + dir[1]);
  }

  noise(p: vec2): number {
    let n = Math.abs((Math.sin(vec2.dot(p, vec2.fromValues(127.1, 311.7))) * 1288.002) % 1);
    return n;
  }

  getNext() : Map<number, RoadSegment> {
    let out: Map<number, RoadSegment> = new Map();

    // road continues in same direction
    let segment: RoadSegment = new RoadSegment(vec2.clone(this.end), vec2.clone(this.direction));
    out.set(0, segment);

    var newDir;
    if (this.direction[0] != 0) {
      // turn to +/- z direction
      newDir = vec2.fromValues(0, 1);
    } else {
      // turn to +/- x direction
      newDir = vec2.fromValues(1, 0);
    }

    let p = this.noise(this.start);

    if (p > 0.5 && p < 0.75) {
      out.set(1, new RoadSegment(vec2.clone(this.end), vec2.clone(newDir)));
    }

    if (p > 0.75 && p < 1.0) {
      out.set(2, new RoadSegment(vec2.clone(this.end), vec2.fromValues(-newDir[0], -newDir[1])));
    }

    return out;
  }

  getTransformation(side: number, gridSize: number): mat4 {
    let transform: mat4 = mat4.create();

    // scale
    let scale: mat4 = mat4.create();
    mat4.scale(scale, scale, vec3.fromValues(this.width, 1, gridSize + this.width));

    // rotate
    let rotation: mat4 = mat4.create();
    mat4.identity(rotation);
    if (vec2.equals(this.direction, vec2.fromValues(1, 0)) ||
        vec2.equals(this.direction, vec2.fromValues(-1, 0))) {
      mat4.fromRotation(rotation, Math.PI / 2, vec3.fromValues(0, 1, 0));
    }

    // translate
    let translation: mat4 = mat4.create();
    let shiftStart: vec2 = vec2.fromValues(this.start[0] - side / 2, this.start[1] - side / 2);
    let shiftEnd: vec2 = vec2.fromValues(this.end[0] - side / 2, this.end[1] - side / 2);
    let center: vec3 = vec3.fromValues(gridSize * (shiftStart[0] + shiftEnd[0]) / 2, 0, gridSize * (shiftStart[1] + shiftEnd[1]) / 2);
    mat4.fromTranslation(translation, center);

    mat4.multiply(transform, rotation, scale);
    mat4.multiply(transform, translation, transform);
    return transform;
  }

  equals(start: vec2, end: vec2): boolean {
    if (vec2.equals(this.start, start) && vec2.equals(this.end, end)) return true;
    if (vec2.equals(this.start, end) && vec2.equals(this.end, start)) return true;
    return false;
  }
}