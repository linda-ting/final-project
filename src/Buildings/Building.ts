import {vec3, mat4, vec2} from 'gl-matrix';
import BuildingBlock from './BuildingBlock';

export default class Building {
  blocks: BuildingBlock[] = [];
  corner: vec3 = vec3.create();
  dimensions: vec3 = vec3.create();

  static roadWidth: number = 0.3;

  constructor(corner: vec3, dims: vec3) {
    this.corner = corner;
    this.dimensions = dims;
  }

  setRoadWidth(width: number) {
    Building.roadWidth = width;
  }

  grow() {
    // TODO
  }

  getTransformation(freq: number, time: number) {
    let transform: mat4 = mat4.create();

    // scale
    let scale: mat4 = mat4.create();
    let f = this.gain(freq / 255.0, 0.2);
    let height = f * this.dimensions[1] + 0.5;
    mat4.scale(scale, scale, vec3.fromValues(this.dimensions[0], 
                                             height,
                                             this.dimensions[2]));

    // rotate
    let rotation: mat4 = mat4.create();
    mat4.identity(rotation);

    // translate
    let translation: mat4 = mat4.create();
    let shift: vec3 = vec3.fromValues(this.corner[0] + this.dimensions[0] / 2 + 0.2,
                                      this.corner[1] + height / 2,
                                      this.corner[2] + this.dimensions[2] / 2 + 0.2);
    mat4.fromTranslation(translation, shift);

    mat4.multiply(transform, rotation, scale);
    mat4.multiply(transform, translation, transform);
    return transform;
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
}