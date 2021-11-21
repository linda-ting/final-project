import { vec3, mat4, vec4 } from 'gl-matrix';

export default class Turtle {
  position: vec3 = vec3.create();
  forward: vec3 = vec3.create();
  up: vec3 = vec3.create();
  right: vec3 = vec3.create();
  depth: number = 0;
  length: number = 0;
  thicknessScale: number = 0.9;
  defaultAngle: number = 17;
  defaultDist: number = 2;

  constructor(pos: vec3, forward: vec3, up: vec3, right: vec3, depth: number) {
    this.position = pos;
    this.forward = forward;
    this.up = up;
    this.right = right;
    this.depth = depth;
  }

  getTransformation() {
    let transform: mat4 = mat4.create();

    // scale
    let scale: mat4 = mat4.create();
    let scaleFactor: number = Math.pow(this.thicknessScale, this.length);
    mat4.scale(scale, scale, vec3.fromValues(scaleFactor, 1, scaleFactor));

    // rotate
    let rotation: mat4 = mat4.create();
    mat4.identity(rotation);
    mat4.set(rotation, this.right[0], this.right[1], this.right[2], 0,
                       this.up[0], this.up[1], this.up[2], 0,
                       this.forward[0], this.forward[1], this.forward[2], 0,
                       0, 0, 0, 1);

    // translate
    let translation: mat4 = mat4.create();
    mat4.fromTranslation(translation, this.position);

    mat4.multiply(transform, rotation, scale);
    mat4.multiply(transform, translation, transform);
    return transform;
  }

  getTransformationNoScale() {
    let transform: mat4 = mat4.create();
    // rotate
    let rotation: mat4 = mat4.create();
    mat4.identity(rotation);
    mat4.set(rotation, this.right[0], this.right[1], this.right[2], 0,
                       this.up[0], this.up[1], this.up[2], 0,
                       this.forward[0], this.forward[1], this.forward[2], 0,
                       0, 0, 0, 1);

    // translate
    let translation: mat4 = mat4.create();
    mat4.fromTranslation(translation, this.position);

    mat4.multiply(transform, translation, rotation);
    return transform;
  }

  setLength(len: number) {
    this.length = len;
  }

  moveUp(dist: number = this.defaultDist) {
    let delta: vec3 = vec3.create();
    vec3.scale(delta, this.up, dist);
    this.move(delta);
  }

  moveDown(dist: number = -this.defaultDist) {
    this.moveUp(dist);
  }

  moveForward(dist: number = this.defaultDist) {
    let delta: vec3 = vec3.create();
    vec3.scale(delta, this.forward, dist);
    this.move(delta);
  }

  moveRight(dist: number = this.defaultDist) {
    let delta: vec3 = vec3.create();
    vec3.scale(delta, this.right, dist);
    this.move(delta);
  }

  move(delta: vec3) {
    vec3.add(this.position, this.position, delta);
  }

  // rotate about up vec
  rotateUp(angle: number = this.defaultAngle) {
    let angleRad: number = angle * Math.PI / 180.0;
    // add some noise to angle
    angleRad += (Math.random() - 0.5) * 0.02;
    let rotation: mat4 = mat4.create(); 
    mat4.fromRotation(rotation, angleRad, this.up);
    this.rotate(rotation);
  }

  // rotate about forward vec
  rotateForward(angle: number = this.defaultAngle) {    
    let angleRad: number = angle * Math.PI / 180.0;
    // add some noise to angle
    angleRad += (Math.random() - 0.5) * 0.02;
    let rotation: mat4 = mat4.create(); 
    mat4.fromRotation(rotation, angleRad, this.forward);
    this.rotate(rotation);
  }

  // rotate about right vec
  rotateRight(angle: number = this.defaultAngle) {
    let angleRad: number = angle * Math.PI / 180.0;
    // add some noise to angle
    angleRad += (Math.random() - 0.5) * 0.02;
    let rotation: mat4 = mat4.create(); 
    mat4.fromRotation(rotation, angleRad, this.right);
    this.rotate(rotation);
  }

  rotate(rotation: mat4) {
    // transform up vec
    let newUp: vec4 = vec4.create();
    vec4.transformMat4(newUp, 
                       vec4.fromValues(this.up[0], this.up[1], this.up[2], 0), 
                       rotation);
    vec4.normalize(newUp, newUp);
    this.up = vec3.fromValues(newUp[0], newUp[1], newUp[2]);

    // transform right vec
    let newRight: vec4 = vec4.create();
    vec4.transformMat4(newRight, 
                       vec4.fromValues(this.right[0], this.right[1], this.right[2], 0), 
                       rotation);
    vec4.normalize(newRight, newRight);
    this.right = vec3.fromValues(newRight[0], newRight[1], newRight[2]);

    // transform forward vec
    let newForward: vec4 = vec4.create();
    vec4.transformMat4(newForward, 
                       vec4.fromValues(this.forward[0], this.forward[1], this.forward[2], 0), 
                       rotation);
    vec4.normalize(newForward, newForward);
    this.forward = vec3.fromValues(newForward[0], newForward[1], newForward[2]);
  }
}