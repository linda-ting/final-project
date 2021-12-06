#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;
uniform float u_AvgFreq;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec4 vs_Transform1;
in vec4 vs_Transform2;
in vec4 vs_Transform3;
in vec4 vs_Transform4;
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_LightVec;

const vec4 lightPos = vec4(8, 15, 8, 1);

vec3 random3(vec3 p) {
	return fract(sin(vec3(
                    dot(p, vec3(127.1, 311.7, 99.2)),
                    dot(p, vec3(269.5, 183.3, 77.9)),
                    dot(p, vec3(381.8, 98.2, 149.4))))
                 * 1.5);
}

float worley(vec3 p) {
  p *= 60.0;
  vec3 pInt = floor(p);
  vec3 pFract = fract(p);
  float minDist = 1.0;
  
  for (int z = -1; z <= 1; ++z) {
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            vec3 neighbor = vec3(float(x), float(y), float(z)); 
            vec3 point = random3(pInt + neighbor);
            vec3 diff = neighbor + point - pFract;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }
  }
  
  return minDist;
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

void main()
{
  // transform using input transformation
  mat4 transform = mat4(vs_Transform1, vs_Transform2, vs_Transform3, vs_Transform4);
  fs_Pos = transform * vs_Pos;

  float xz = 0.08 * gain(u_AvgFreq / 255.0, 0.75) + 0.8;
  float y = 0.1 * worley(fs_Pos.xxz) + 0.8;
  fs_Pos = fs_Pos * vec4(vec3(xz, y, xz), 1.0);

  float theta = u_Time * 0.001;
  mat4 rotation = mat4(cos(theta), 0, sin(theta), 0,
                       0, 1, 0, 0,
                       -sin(theta), 0, cos(theta), 0,
                       0, 0, 0, 1);
  fs_Pos = rotation * fs_Pos;

  vec3 newNor = (rotation * transform * vs_Nor).xyz;
  fs_Nor = vec4(normalize(newNor), 1);
  fs_Col = vs_Col;
  fs_LightVec = lightPos - fs_Pos;
  
  gl_Position = u_ViewProj * fs_Pos;
}
