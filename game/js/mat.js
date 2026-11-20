// 小物の共通マテリアル（トゥーン・頂点色）。頂点色が負の所は「差し色」で、
// インスタンス色または持ち主の色（aTer）に置きかえる
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonRamp } from './terrain.js?v=20261026a';

export const RAMP = toonRamp([140, 200, 255]);
const C = new THREE.Color();

export function toonMat(U, opts = {}) {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: RAMP });
  m.flatShading = opts.flat !== false;
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uOwner = U.uOwner;
    sh.uniforms.uSeason = U.uSeason;
    const head = 'uniform float uTime; uniform sampler2D uOwner; uniform vec4 uSeason; varying vec3 vWPos; varying float vMark;\n' + (opts.noboriVis ? 'attribute vec2 aTer2;\n' : opts.owner ? 'attribute float aTer;\n' : '');
    sh.vertexShader = head + sh.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${opts.noboriVis ? `{
          vec4 oa = texelFetch(uOwner, ivec2(int(aTer2.x + 0.5), 3), 0), ob = texelFetch(uOwner, ivec2(int(aTer2.y + 0.5), 3), 0);
          if (oa.g < 0.5 || oa.r == ob.r) transformed *= 0.0;   // 同じ勢力どうしの境には立てない
        }` : ''}
        ${opts.sway ? `if (color.r < 0.0) {
          float ph = 0.0;
          #ifdef USE_INSTANCING
            ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4;
          #endif
          transformed.x += sin(uTime * 3.2 + ph + transformed.y * 2.0) * ${opts.sway.toFixed(3)} * transformed.y;
        }` : ''}`)
      .replace('#include <color_vertex>', `
        vColor = vec4(1.0);
        vMark = color.r < 0.0 ? 1.0 : 0.0;
        #ifdef USE_INSTANCING_COLOR
          vColor.rgb = vMark > 0.5 ? instanceColor.rgb : color * mix(vec3(1.0), instanceColor.rgb, 0.08);
        #else
          vColor.rgb = vMark > 0.5 ? vec3(1.0) : color;
        #endif
        ${opts.noboriVis ? 'if (vMark > 0.5) vColor.rgb = texelFetch(uOwner, ivec2(int(aTer2.x + 0.5), 0), 0).rgb;' : opts.owner ? 'if (vMark > 0.5) vColor.rgb = texelFetch(uOwner, ivec2(int(aTer + 0.5), 0), 0).rgb;' : ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wp0 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp0 = instanceMatrix * wp0;
        #endif
        vWPos = (modelMatrix * wp0).xyz;`);
    sh.fragmentShader = 'varying vec3 vWPos; varying float vMark; uniform float uTime;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${opts.windows ? `{
          vec3 fn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
          if (abs(fn.y) < 0.4 && vMark < 0.5) {
            float fl = fract(vWPos.y * 6.0);
            float hz = fract((abs(fn.x) > 0.5 ? vWPos.z : vWPos.x) * 7.0);
            float win = step(0.38, fl) * step(fl, 0.86) * step(0.22, hz) * step(hz, 0.78);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.66, 0.86), win * 0.85);
          }
        }` : ''}`);
  };
  m.customProgramCacheKey = () => 'toon:' + JSON.stringify(opts);
  return m;
}

// 頂点色つきの部品。c に null を渡すと差し色
export function part(geo, c, m) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (m) g.applyMatrix4(m);
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  if (c === null) a.fill(-1);
  else { C.set(c); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
export const merge = parts => mergeGeometries(parts);
export const M4 = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// 切妻屋根（x 方向に棟）
export function gableRoof(w, d, h) {
  const x = w / 2, z = d / 2;
  const p = [
    -x, 0, -z, x, h, 0, x, 0, -z, -x, 0, -z, -x, h, 0, x, h, 0,     // 北の斜面
    -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0,        // 南の斜面
    -x, 0, -z, -x, 0, z, -x, h, 0, x, 0, -z, x, h, 0, x, 0, z       // 妻
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}
