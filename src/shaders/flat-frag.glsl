#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

float noise(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 244.1))) * 1288.002);
}

float interpNoise(float x, float y) {
  int intX = int(floor(x));
  float fractX = fract(x);
  int intY = int(floor(y));
  float fractY = fract(y);

  float v1 = noise(vec2(intX, intY));
  float v2 = noise(vec2(intX + 1, intY));
  float v3 = noise(vec2(intX, intY + 1));
  float v4 = noise(vec2(intX + 1, intY + 1));

  float i1 = mix(v1, v2, fractX);
  float i2 = mix(v3, v4, fractX);
  return mix(i1, i2, fractY);;
}

float fbm(vec2 p) {
  float x = p.x;
  float y = p.y;
  float total = 0.;

  float persistence = 0.72;
  int octaves = 4;

  for(int i = 1; i <= octaves; i++) {
    float freq = pow(2.f, float(i));
    float amp = pow(persistence, float(i));
    total += interpNoise(x * freq, y * freq) * amp;
  }
  return total;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec3 a = vec3(.8,.7,.6);
  vec3 b = vec3(.3,.2,.7);
  vec3 c = vec3(.2,.5,.7);
  vec3 d = vec3(1,.5,.2);
  float t = 1.0 - fbm(0.1 * fs_Pos + vec2(cos(0.001 * u_Time), cos(-0.0005 * u_Time)));

  out_Col = vec4(palette(t, a, b, c, d), 1.0);
}
