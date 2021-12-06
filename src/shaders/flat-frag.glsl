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

float surflet(vec2 p, vec2 gridPoint) {
  vec2 t2 = abs(p - gridPoint);
  vec2 t = vec2(1.0) - 6.0 * pow(t2, vec2(5.0)) + 15.0 * pow(t2, vec2(4.0)) - 10.0 * pow(t2, vec2(3.0));
  vec2 gradient = noise(gridPoint) * 2.0 - vec2(1.0);
  vec2 diff = p - gridPoint;
  float height = dot(diff, gradient);
  return height * t.x * t.y;
}

float perlin(vec2 p) {
	float surfletSum = 0.f;
	for(int dx = 0; dx <= 1; ++dx) {
		for(int dy = 0; dy <= 1; ++dy) {
				surfletSum += surflet(p, floor(p) + vec2(dx, dy));
		}
	}
	return surfletSum;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

float bias(float time, float bias) {
  return (time / ((((1.0 / bias) - 2.0) * (1.0 - time)) + 1.0));
}

float gain(float time, float gain) {
  if(time < 0.5)
    return bias(time * 2.0, gain) / 2.0;
  else
    return bias(time * 2.0 - 1.0, 1.0 - gain) / 2.0 + 0.5;
}

void main() {
  vec3 a = vec3(0.838, 0.408, 1.078);
  vec3 b = vec3(0.218, -0.362, 0.438);
  vec3 c = vec3(-0.802, 0.858, 1.158);
  vec3 d = vec3(-1.052, -0.892, -0.642);

  float t = perlin(0.13 * fs_Pos + vec2(pow(0.0001 * u_Time, 3.0), pow(sin(-0.0005 * u_Time), 2.0)));
  t = bias(t, 0.7);

  out_Col = vec4(palette(t, a, b, c, d), 1.0);
}
