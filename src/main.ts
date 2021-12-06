import {mat4, quat, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import * as THREE from 'three';
import Cylinder from './geometry/Cylinder';
import Cube from './geometry/Cube';
import Mesh from './geometry/Mesh';
import ScreenQuad from './geometry/ScreenQuad';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystem from './lsystem/LSystem'
import RoadNetwork from './roads/RoadNetwork';
import City from './City';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  song: 'zombie',
  numBlocks: 6,
  blockSize: 1
};

let loader: THREE.AudioLoader = new THREE.AudioLoader();
let listener: THREE.AudioListener = new THREE.AudioListener();
let audio: THREE.Audio = new THREE.Audio(listener);
let fftSize: number = 128;
let analyzer: THREE.AudioAnalyser;
let songData: Uint8Array;

let city: City;
let roads: RoadNetwork;

let cube: Cube;
let square: Square;
let screenQuad: ScreenQuad;
let cylinder: Cylinder;
let leaf: Mesh;
let banana: Mesh;
let lsystem: LSystem;
let time: number = 0.0;

function loadSong(filename: string) {
  if (audio.isPlaying) audio.stop();

  var file = 'music/' + filename + '.mp3';
  loader.load(file, function (buffer: any) {
    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.play();
  });

  analyzer = new THREE.AudioAnalyser(audio, fftSize);
  songData = analyzer.getFrequencyData();
}

function readObj(filename: string) : string {
  var outstr = "";
  var client = new XMLHttpRequest();
  client.open('GET', filename, false);
  client.onreadystatechange = function() {
    if(client.status === 200 || client.status == 0)
    {
      outstr = client.responseText;
    }
  }
  client.send(null);
  return outstr;
}

function loadScene() {
  loadSong(controls.song);

  square = new Square();
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0), 1);
  cube.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  city = new City(vec3.fromValues(0, 0, 0), 6, 1, cube, square);
  city.setSongAnalyzer(analyzer);
  city.update(0);
}

function main() {
  //loadSong('music/zombie.mp3');

  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  /*
  const playControl = gui.add(controls, 'play', false);
  playControl.onChange(function() {
    audio.play();  
    city.setSongAnalyzer(analyzer);
    city.update(0);
  })*/

  const songControl = gui.add(controls, 'song', ['zombie', 'truman', 'omg']);
  songControl.onFinishChange(function() {
    loadSong(controls.song);
    city.setSongAnalyzer(analyzer);
    city.update(0);
  })

  var obj = { add:function(){ console.log("clicked") }};
  gui.add(obj,'add');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);
  gl.enable(gl.DEPTH_TEST);

  // Initial call to load scene
  loadScene();
  //loadLSystem();

  const camera = new Camera(vec3.fromValues(3, 8, 8), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.9, 0.72, 0, 1);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    instancedShader.setAvgFreq(analyzer.getAverageFrequency());
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    city.update(time);

    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [square, cube]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
