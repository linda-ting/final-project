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

  getTransformation() {
    let transform: mat4 = mat4.create();

    // scale
    let scale: mat4 = mat4.create();
    mat4.scale(scale, scale, this.dimensions);

    // rotate
    let rotation: mat4 = mat4.create();
    mat4.identity(rotation);

    // translate
    let translation: mat4 = mat4.create();
    let shift: vec3 = vec3.fromValues(this.corner[0] + this.dimensions[0] / 2 + 0.2,
                                      this.corner[1] + this.dimensions[1] / 2,
                                      this.corner[2] + this.dimensions[2] / 2 + 0.2);
    mat4.fromTranslation(translation, shift);

    mat4.multiply(transform, rotation, scale);
    mat4.multiply(transform, translation, transform);
    return transform;
  }
}