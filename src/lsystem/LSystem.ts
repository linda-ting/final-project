import {vec3, mat4} from 'gl-matrix';
import Cylinder from '../geometry/Cylinder';
import Mesh from '../geometry/Mesh';
import Turtle from './Turtle';
import ExpansionRule from './ExpansionRule'
import DrawingRule from './DrawingRule'

export default class LSystem {
  numIter: number;
  axiom: string;
  angle: number;
  expansionRules: Map<string, ExpansionRule> = new Map();
  drawingRules: Map<String, DrawingRule> = new Map();
  turtle: Turtle;
  cylinder: Cylinder;
  leaf: Mesh;
  banana: Mesh;

  numCyl: number = 0;
  cylTransfArrX: number[] = [];
  cylTransfArrY: number[] = [];
  cylTransfArrZ: number[] = [];
  cylTransfArrW: number[] = [];
  cylColorArr: number[] = [];

  numLeaf: number = 0;
  leafTransfArrX: number[] = [];
  leafTransfArrY: number[] = [];
  leafTransfArrZ: number[] = [];
  leafTransfArrW: number[] = [];
  leafColorArr: number[] = [];

  numBanana: number = 0;
  banaTransfArrX: number[] = [];
  banaTransfArrY: number[] = [];
  banaTransfArrZ: number[] = [];
  banaTransfArrW: number[] = [];
  banaColorArr: number[] = [];

  constructor(cylinder: Cylinder, leaf: Mesh, banana: Mesh, 
              axiom: string = "FFFFFFFFF^++A[//------FF++++B]-&&A///^^^A++",
              angle: number = 20,
              numIter: number = 6) {
    this.cylinder = cylinder;
    this.leaf = leaf;
    this.banana = banana;
    this.axiom = axiom;
    this.angle = angle;
    this.numIter = numIter;
    this.init();
  }

  // set up expansion and drawing rules
  init() {
    let ruleA = new ExpansionRule("A");
    ruleA.addPostCondition(0.8, "[F^//---A][F&++G]");
    ruleA.addPostCondition(0.15, "[^++A]//G");
    ruleA.addPostCondition(0.05, "--F//A");
    this.expansionRules.set("A", ruleA);

    let ruleB = new ExpansionRule("B");
    ruleB.addPostCondition(0.7, "[C][&&C][&&&+C][&&++C][&+C]//dB");
    ruleB.addPostCondition(0.3, "[C][^C][&-C][&&++C][&++C]\\dB");
    this.expansionRules.set("B", ruleB);

    let ruleG = new ExpansionRule("G");
    ruleG.addPostCondition(1, "[+F+E]-\\\\E");
    this.expansionRules.set("G", ruleG);

    // branch
    this.drawingRules.set("F", new DrawingRule("F", this.cylinder, () => {
      let transform: mat4 = this.turtle.getTransformation();
      this.cylTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
      this.cylTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
      this.cylTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
      this.cylTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
      this.cylColorArr.push(0.8, 0.6, 0.3, 1);
      this.numCyl++;
    }));

    // leaves
    this.drawingRules.set("E", new DrawingRule("E", this.leaf, () => {
      let transform: mat4 = this.turtle.getTransformationNoScale();
      this.leafTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
      this.leafTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
      this.leafTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
      this.leafTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
      this.leafColorArr.push(0.4, 0.8, 0.3, 1);
      this.numLeaf++;
    }));

    // banana
    this.drawingRules.set("C", new DrawingRule("C", this.cylinder, () => {
      let transform: mat4 = this.turtle.getTransformationNoScale();
      this.banaTransfArrX.push(transform[0], transform[1], transform[2], transform[3]);
      this.banaTransfArrY.push(transform[4], transform[5], transform[6], transform[7]);
      this.banaTransfArrZ.push(transform[8], transform[9], transform[10], transform[11]);
      this.banaTransfArrW.push(transform[12], transform[13], transform[14], transform[15]);
      this.banaColorArr.push(0.9, 0.7, 0.1, 1);
      this.numBanana++;
    }));
  }

  // reset all geometry in preparation for redraw
  reset() {
    this.cylTransfArrX = [];
    this.cylTransfArrY = [];
    this.cylTransfArrZ = [];
    this.cylTransfArrW = [];
    this.cylColorArr = [];

    this.leafTransfArrX = [];
    this.leafTransfArrY = [];
    this.leafTransfArrZ = [];
    this.leafTransfArrW = [];
    this.leafColorArr = [];

    this.banaTransfArrX = [];
    this.banaTransfArrY = [];
    this.banaTransfArrZ = [];
    this.banaTransfArrW = [];
    this.banaColorArr = [];

    this.cylinder.setInstanceVBOs(new Float32Array([]), 
                                  new Float32Array([]),
                                  new Float32Array([]),
                                  new Float32Array([]),
                                  new Float32Array([]));

    this.leaf.setInstanceVBOs(new Float32Array([]), 
                              new Float32Array([]),
                              new Float32Array([]),
                              new Float32Array([]),
                              new Float32Array([]));
                              
    this.banana.setInstanceVBOs(new Float32Array([]), 
                                new Float32Array([]),
                                new Float32Array([]),
                                new Float32Array([]),
                                new Float32Array([]));
                                
    this.numCyl = 0;
    this.numLeaf = 0;
    this.numBanana = 0;
    this.cylinder.setNumInstances(0);
    this.leaf.setNumInstances(0);
    this.banana.setNumInstances(0);
  }

  // expand axiom
  expand() {
    var expandedAxiom = "";
    for (var iter = 0; iter < this.numIter; iter++) {
      for (var i = 0; i < this.axiom.length; i++) {
        var symbol = this.axiom[i];
  
        if (symbol == "[" || symbol == "]") {
          expandedAxiom += symbol;
          continue;
        }
  
        let expansionRule = this.expansionRules.get(symbol);
        if (expansionRule) {
          // if rule exists for this character, add expanded expression
          var expandedSymbol = expansionRule.expand();
          expandedAxiom += expandedSymbol;
        } else {
          // otherwise, leave as is
          expandedAxiom += symbol;
        }
      }
  
      // replace axiom
      this.axiom = expandedAxiom;
      expandedAxiom = "";
    }
  }

  // draw l system
  draw() {
    let stack: Turtle[] = [];
    this.turtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 1), vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), 0);
  
    // draw expanded symbols
    let depth: number = 0;
    let branchLen: number = 0;
    for (var i = 0; i < this.axiom.length; i++) {
      var symbol = this.axiom[i];
  
      if (symbol == "[") {
        // push new Turtle to stack
        depth++;
        let newTurtle: Turtle = new Turtle(vec3.clone(this.turtle.position), 
                                           vec3.clone(this.turtle.forward), 
                                           vec3.clone(this.turtle.up), 
                                           vec3.clone(this.turtle.right), 
                                           depth);
        newTurtle.setLength(branchLen);
        stack.push(newTurtle);
        continue;
      } else if (symbol == "]") {
        depth--;
        this.turtle = stack.pop();
        branchLen = this.turtle.length;
        continue;
      } else if (symbol == "F" || symbol == "f") {
        this.turtle.moveUp();
        branchLen++;
        this.turtle.setLength(branchLen);
      } else if (symbol == "d") {
        this.turtle.moveDown();
        branchLen++;
        this.turtle.setLength(branchLen);
      } else if (symbol == "r") {
        this.turtle.moveRight();
        branchLen++;
        this.turtle.setLength(branchLen);
      } else if (symbol == "u") {
        this.turtle.moveForward();
        branchLen++;
        this.turtle.setLength(branchLen);
      } else if (symbol == "+") {
        this.turtle.rotateForward(this.angle);
      } else if (symbol == "-") {
        this.turtle.rotateForward(-this.angle);
      } else if (symbol == "&") {
        this.turtle.rotateRight(this.angle);
      } else if (symbol == "^") {
        this.turtle.rotateRight(-this.angle);
      } else if (symbol == "\\") {
        this.turtle.rotateUp(this.angle);
      } else if (symbol == "/") {
        this.turtle.rotateUp(-this.angle);
      }
  
      let drawingRule = this.drawingRules.get(symbol);
      if (drawingRule == null) continue;
      drawingRule.draw();
    }
  
    let cylTransfX: Float32Array = new Float32Array(this.cylTransfArrX);
    let cylTransfY: Float32Array = new Float32Array(this.cylTransfArrY);
    let cylTransfZ: Float32Array = new Float32Array(this.cylTransfArrZ);
    let cylTransfW: Float32Array = new Float32Array(this.cylTransfArrW);
    let cylColors: Float32Array = new Float32Array(this.cylColorArr);
    this.cylinder.setInstanceVBOs(cylTransfX, cylTransfY, cylTransfZ, cylTransfW, cylColors);
    this.cylinder.setNumInstances(this.numCyl);
  
    let leafTransfX: Float32Array = new Float32Array(this.leafTransfArrX);
    let leafTransfY: Float32Array = new Float32Array(this.leafTransfArrY);
    let leafTransfZ: Float32Array = new Float32Array(this.leafTransfArrZ);
    let leafTransfW: Float32Array = new Float32Array(this.leafTransfArrW);
    let leafColors: Float32Array = new Float32Array(this.leafColorArr);
    this.leaf.setInstanceVBOs(leafTransfX, leafTransfY, leafTransfZ, leafTransfW, leafColors);
    this.leaf.setNumInstances(this.numLeaf);

    let banaTransfX: Float32Array = new Float32Array(this.banaTransfArrX);
    let banaTransfY: Float32Array = new Float32Array(this.banaTransfArrY);
    let banaTransfZ: Float32Array = new Float32Array(this.banaTransfArrZ);
    let banaTransfW: Float32Array = new Float32Array(this.banaTransfArrW);
    let banaColors: Float32Array = new Float32Array(this.banaColorArr);
    this.banana.setInstanceVBOs(banaTransfX, banaTransfY, banaTransfZ, banaTransfW, banaColors);
    this.banana.setNumInstances(this.numBanana);
  }

  // something has been updated! expand the axiom and draw again
  redraw() {
    this.reset();
    this.expand();
    this.draw();
  }

  // set number of iterations
  setNumIter(iter: number) {
    this.numIter = iter;
  }

  // set axiom
  setAxiom(axiom: string) {
    this.axiom = axiom;
  }

  // set rotation angle
  setAngle(angle: number) {
    this.angle = angle;
  }
}