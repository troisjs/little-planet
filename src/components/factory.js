import {
  CylinderGeometry,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
  VertexColors,
} from 'three';
import { Geometry } from 'three/examples/jsm/deprecated/Geometry.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import SimplexNoise from 'simplex-noise';

const { randFloat: rnd, randFloatSpread: rndFS } = MathUtils;
const { random, PI } = Math;
const simplex = new SimplexNoise();

/**
 * Procedural low poly planet
 */
export function createGlobe(radius, detail, groundColor, waterColor, noiseConf) {
  const { noiseF, noiseD, noiseWaterTreshold, noiseWaterLevel } = noiseConf;
  const time = Date.now() * 0.001;

  // noise buffer for faces colors
  const noises = [];

  // noise function
  const vNoise = (v, f, i) => {
    const nv = new Vector3(v.x, v.y, v.z).multiplyScalar(f).addScalar(time);
    let noise = (simplex.noise3D(nv.x, nv.y, nv.z) + 1) / 2;
    noise = (noise > noiseWaterTreshold) ? noise : noiseWaterLevel;
    if (Number.isInteger(i)) noises[i] = noise;
    return noise;
  };

  // displacement function
  const dispV = (v, i) => {
    const dv = new Vector3(v.x, v.y, v.z);
    dv.add(dv.clone().normalize().multiplyScalar(vNoise(dv, noiseF, i) * noiseD));
    v.x = dv.x; v.y = dv.y; v.z = dv.z;
  };

  // globe geometry
  const geometry = new Geometry().fromBufferGeometry(new IcosahedronGeometry(radius, detail));
  geometry.mergeVertices();
  for (let i = 0; i < geometry.vertices.length; i++) dispV(geometry.vertices[i], i);
  geometry.computeFlatVertexNormals();

  // globe geometry - faces colors
  for (let i = 0; i < geometry.faces.length; i++) {
    const f = geometry.faces[i];
    f.color.set(groundColor);
    if (noises[f.a] === noiseWaterLevel && noises[f.b] === noiseWaterLevel && noises[f.c] === noiseWaterLevel) {
      f.color.set(waterColor);
    }
  }

  // globe mesh
  const material = new MeshPhongMaterial({ shininess: 30, flatShading: true, vertexColors: VertexColors });
  const mesh = new Mesh(geometry.toBufferGeometry(), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { globe: mesh, vNoise, dispV };
}

/**
 * Procedural low poly tree
 * @param {Number} tsize
 * @param {Number} bsize
 * @param {Color} tcolor
 * @param {Color} bcolor
 */
export function createTree(tsize, bsize, tcolor, bcolor) {
  const tradius = tsize * 0.1;
  const t1size = tsize / 2, t1radius = tradius * 0.7;

  const tmaterial = new MeshPhongMaterial({ color: tcolor, flatShading: true, shininess: 30 });
  const bmaterial = new MeshPhongMaterial({ color: bcolor, flatShading: true, shininess: 0, transparent: true, opacity: 0.9 });

  const tree = new Object3D();

  // trunk
  let tgeometry = new CylinderGeometry(tradius * 0.7, tradius, tsize, 5, 3, true);
  tgeometry.translate(0, tsize / 2, 0);
  tgeometry.rotateX(-PI / 2);
  tgeometry = rdnGeo(tgeometry, tradius * 0.2);

  // body
  let bgeometry = new SphereGeometry(bsize, 4, 4);
  bgeometry.translate(0, tsize + bsize * 0.7, 0);
  bgeometry.rotateX(-PI / 2);
  bgeometry = rdnGeo(bgeometry, bsize * 0.2);

  if (random() > 0.5) {
    // trunk 1
    let t1geometry = new CylinderGeometry(t1radius * 0.5, t1radius, t1size, 4, 2, true);
    t1geometry.translate(0, t1size / 2, 0);
    t1geometry.rotateZ(PI / 3 + rnd(0, 0.2));
    t1geometry.rotateY(rndFS(PI / 2));
    t1geometry.translate(0, tsize * rnd(0.2, 0.7), 0);
    t1geometry.rotateX(-PI / 2);
    t1geometry = rdnGeo(t1geometry, tradius * 0.1);
    tgeometry = BufferGeometryUtils.mergeBufferGeometries([tgeometry, t1geometry]);

    // body 1
    const b1size = bsize * rnd(0.5, 0.8);
    const t1bp = getTrunkBodyPosition(t1geometry, b1size);
    let b1geometry = new SphereGeometry(b1size, 4, 4);
    b1geometry.translate(t1bp.x, t1bp.y, t1bp.z);
    b1geometry = rdnGeo(b1geometry, b1size * 0.2);
    bgeometry = BufferGeometryUtils.mergeBufferGeometries([bgeometry, b1geometry]);
  }

  if (random() > 0.5) {
    // trunk 2
    let t2geometry = new CylinderGeometry(t1radius * 0.5, t1radius, t1size, 4, 2, true);
    t2geometry.translate(0, t1size / 2, 0);
    t2geometry.rotateZ(-PI / 3 + rnd(0, 0.2));
    t2geometry.rotateY(rndFS(PI / 2));
    t2geometry.translate(0, tsize * rnd(0.2, 0.7), 0);
    t2geometry.rotateX(-PI / 2);
    t2geometry = rdnGeo(t2geometry, tradius * 0.1);
    tgeometry = BufferGeometryUtils.mergeBufferGeometries([tgeometry, t2geometry]);

    // body 2
    const b2size = bsize * rnd(0.5, 0.8);
    const t2bp = getTrunkBodyPosition(t2geometry, b2size);
    let b2geometry = new SphereGeometry(b2size, 4, 4);
    b2geometry.translate(t2bp.x, t2bp.y, t2bp.z);
    b2geometry = rdnGeo(b2geometry, b2size * 0.2);
    bgeometry = BufferGeometryUtils.mergeBufferGeometries([bgeometry, b2geometry]);
  }

  const tmesh = new Mesh(tgeometry, tmaterial);
  tmesh.castShadow = true;
  // tmesh.receiveShadow = true;
  tree.add(tmesh);

  const bmesh = new Mesh(bgeometry, bmaterial);
  bmesh.castShadow = true;
  // bmesh.receiveShadow = true;
  tree.add(bmesh);

  tree.dispose = () => {
    tmesh.geometry.dispose();
    tmesh.material.dispose();
    bmesh.geometry.dispose();
    bmesh.material.dispose();
  };

  return tree;
}

/**
 * Procedural low poly rock
 * @param {Number} size
 */
export function createRock(size, color) {
  const material = new MeshPhongMaterial({ color, flatShading: true });
  let geometry = new SphereGeometry(size, 4, 3);
  geometry = rdnGeo(geometry, size * 0.2);
  const rock = new Mesh(geometry, material);

  rock.dispose = () => {
    rock.geometry.dispose();
    rock.material.dispose();
  };

  return rock;
}

/**
 * Trunk helper
 */
function getTrunkBodyPosition(geo, bsize) {
  // todo : proper
  const g = new Geometry().fromBufferGeometry(geo);
  g.mergeVertices();
  let v1 = g.vertices[0], v2 = g.vertices[g.vertices.length - 1];
  v1 = new Vector3(v1.x, v1.y, v1.z);
  v2 = new Vector3(v2.x, v2.y, v2.z);
  const dv = v1.clone().sub(v2).normalize().multiplyScalar(bsize * 0.5);
  return v1.add(dv);
}

/**
 * Randomize buffer geometry
 */
function rdnGeo(bgeo, d) {
  const geo = new Geometry().fromBufferGeometry(bgeo);
  geo.mergeVertices();

  let v;
  for (let i = 0; i < geo.vertices.length; i++) {
    v = geo.vertices[i];
    v.x += rndFS(2 * d);
    v.y += rndFS(2 * d);
    v.z += rndFS(2 * d);
  }

  geo.computeFlatVertexNormals();
  return geo.toBufferGeometry();
}

/**
 * Get random points on sphere
 */
export function getFibonacciSpherePoints(samples, radius, randomize) {
  samples = samples || 1;
  radius = radius || 1;
  randomize = randomize || true;
  let random = 1;
  if (randomize) {
    random = Math.random() * samples;
  }
  const points = [];
  const offset = 2 / samples;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    let y = ((i * offset) - 1) + (offset / 2);
    const distance = Math.sqrt(1 - Math.pow(y, 2));
    const phi = ((i + random) % samples) * increment;
    let x = Math.cos(phi) * distance;
    let z = Math.sin(phi) * distance;
    x = x * radius;
    y = y * radius;
    z = z * radius;
    points.push({ x, y, z });
  }
  return points;
}
