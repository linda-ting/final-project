import {vec3, mat4} from 'gl-matrix';
import Building from './Building';

export default class BuildingBlock {
  parent: Building;
  corner: vec3 = vec3.create();
  dimensions: vec3 = vec3.create();

  constructor(parent: Building, corner: vec3, dims: vec3) {
    this.parent = parent;
    this.corner = corner;
    this.dimensions = dims;
  }

  expand() {
    // TODO
    let newBlocks: BuildingBlock[] = [];
    
    // add new blocks
    for (var i = 0; i < newBlocks.length; i++){
      this.parent.addBlock(newBlocks[i]);
    }
  }
}