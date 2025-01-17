import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Square extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  offsets: Float32Array; // Data for bufTranslate
  transform1: Float32Array;
  transform2: Float32Array;
  transform3: Float32Array;
  transform4: Float32Array;

  constructor() {
    super(); // Call the constructor of the super class. This is required.
  }

  create() {
    this.indices = new Uint32Array([0, 1, 2,
                                    0, 2, 3]);
    this.positions = new Float32Array([-0.5, 0, -0.5, 1,
                                      0.5, 0, -0.5, 1,
                                      0.5, 0, 0.5, 1,
                                     -0.5, 0, 0.5, 1]);
    this.normals = new Float32Array([0, 1, 0, 0,
                                     0, 1, 0, 0,
                                     0, 1, 0, 0,
                                     0, 1, 0, 0]);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();
    this.generateTransform1();
    this.generateTransform2();
    this.generateTransform3();
    this.generateTransform4();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created square`);
  }

  setInstanceVBOs(transform1: Float32Array, transform2: Float32Array, transform3: Float32Array, transform4: Float32Array, colors: Float32Array) {    this.transform1 = transform1;
    this.transform1 = transform1;
    this.transform2 = transform2;
    this.transform3 = transform3;
    this.transform4 = transform4;
    this.colors = colors;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform1);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform1, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform2);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform2, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform3);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform3, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform4);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform4, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
  }
};

export default Square;
