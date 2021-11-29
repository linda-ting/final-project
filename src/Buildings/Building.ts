import {vec3, mat4, vec2} from 'gl-matrix';
import BuildingBlock from './BuildingBlock';

export default class Building {
  blocks: BuildingBlock[] = [];
  corner: vec3 = vec3.create();
  dimensions: vec3 = vec3.create();

  constructor(corner: vec3, dims: vec3) {
    this.corner = corner;
    this.dimensions = dims;
  }

  grow() {
    // TODO
  }
}