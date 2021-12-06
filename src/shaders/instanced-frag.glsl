#version 300 es
precision highp float;

uniform float u_Time;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;

out vec4 out_Col;

float noise(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 244.1))) * 1288.002);
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

void main()
{
  out_Col = fs_Col;

  float t = perlin(0.1 * fs_Pos.xz + vec2(pow(0.0001 * u_Time, 5.0), pow(sin(-0.0005 * u_Time), 3.0)));

  // Material base color (before shading)
  vec4 diffuseColor = fs_Col * vec4(1.0 + t, 1.0 + t, 1.0 - t, 1.0);

  // Calculate the diffuse term for Lambert shading
  float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
  // Avoid negative lighting values
  diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

  float ambientTerm = 0.2;

  float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                      //to simulate ambient lighting. This ensures that faces that are not
                                                      //lit by our point light are not completely black.

  // Compute final shaded color
  out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
