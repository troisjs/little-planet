<template>
  <PlanetGroup ref="group">
    <Globe ref="globe" :duration="2000" :delay="1000"
      :radius="radius" :detail="detail" :noise-conf="noiseConf"
      :groundColor="groundColor" :waterColor="waterColor"
    />
    <Tree v-for="(tree, key) in trees" :key="key" v-bind="tree" />
    <Rock v-for="(rock, key) in rocks" :key="key" v-bind="rock" />
    <Icosahedron ref="raycastMesh" :radius="radius" :detail="detail">
      <BasicMaterial transparent :opacity="0" />
    </Icosahedron>
  </PlanetGroup>
</template>

<script>
/**
 * Not optimized, trees and rocks are not instanced (randomized geometries)
 */
// import { watch } from 'vue';
import { MathUtils, Plane, Raycaster, Vector3 } from 'three';
import { Easing, Tween, remove as removeTween } from '@tweenjs/tween.js';
import chroma from 'chroma-js';

// import Object3D from './Object3D.js';
import PlanetGroup from './PlanetGroup.js';
import Globe, { globeProps } from './Globe.js';
import Tree from './Tree.js';
import Rock from './Rock.js';
import { getFibonacciSpherePoints } from './factory.js';

const { randFloat } = MathUtils;

export const planetProps = {
  ...globeProps,
  maxTrees: { type: Number, default: 600 },
  maxRocks: { type: Number, default: 200 },
  treeSize: { type: Number, default: 1 },
  rockSize: { type: Number, default: 1 },
  treeTrunkColor: { type: String, default: '#764114' },
  treeBodyColor1: { type: String, default: '#509A36' },
  treeBodyColor2: { type: String, default: '#FF5A36' },
  treeBodyColor3: { type: String, default: '#509A36' },
  treeBodyColor4: { type: String, default: '#FFC236' },
  treeBodyColor5: { type: String, default: '#509A36' },
  rockColor: { type: String, default: '#808080' },
  duration: { type: Number, default: 750 },
  delay: { type: Number, default: 0 },
};

export default {
  name: 'LittlePlanet',
  // extends: Object3D,
  components: { PlanetGroup, Globe, Tree, Rock },
  inject: ['three', 'scene', 'rendererComponent'],
  props: planetProps,
  setup() {
    return {
      // counters (used for keys)
      treesCounter: 0,
      rocksCounter: 0,
      // raycasting
      raycaster: new Raycaster(),
      mousePlane: new Plane(new Vector3(0, 0, 1), 0),
      mouseV3: new Vector3(),
    };
  },
  data() {
    return {
      // don't use array to avoid re-render all the trees & rocks (on array splice)
      trees: {},
      rocks: {},
    };
  },
  mounted() {
    this.groupC = this.$refs.group;
    this.group = this.groupC.group;
    this.globeC = this.$refs.globe;
    this.globe = this.globeC.globe;

    // trees colors
    this.cscale = chroma.scale([this.treeBodyColor1, this.treeBodyColor2, this.treeBodyColor3, this.treeBodyColor4, this.treeBodyColor5]);
    // ['treeBodyColor1'].forEach(prop => {
    //   watch(() => this[prop], () => {
    //     this.cscale = chroma.scale([this.treeBodyColor1, this.treeBodyColor2, this.treeBodyColor3, this.treeBodyColor4, this.treeBodyColor5]);
    //   });
    // });

    this.init();
    this.group.scale.set(0, 0, 0);
    this.tween = new Tween(this.group.scale)
      .to({ x: 1, y: 1, z: 1 }, this.duration)
      .delay(this.delay)
      .easing(Easing.Elastic.Out)
      .start();
  },
  unmounted() {
    if (this.tween) removeTween(this.tween);
    new Tween(this.group.scale)
      .to({ x: 0, y: 0, z: 0 }, this.duration / 2)
      .easing(Easing.Elastic.In)
      .onComplete(() => {
        this.globeC.removeFromParent();
        this.globe.geometry.dispose();
        this.globe.material.dispose();
        this.groupC.removeFromParent();
      })
      .start();
  },
  methods: {
    init() {
      this.deleteTrees();
      this.deleteRocks();
      const { vNoise, dispV } = this.globeC;
      const { noiseF, noiseWaterLevel } = this.noiseConf;
      const max = this.maxTrees + this.maxRocks;
      const points = getFibonacciSpherePoints(max, this.radius);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (vNoise(p, noiseF) === noiseWaterLevel) continue;
        dispV(p);
        this.addSomething({
          position: { x: p.x, y: p.y, z: p.z },
          duration: 1000 + Math.random() * 2000,
          delay: Math.random() * 20000,
        });
      }
    },
    addSomething(o) {
      const percent = this.maxRocks / (this.maxTrees + this.maxRocks);
      if (Math.random() > percent) {
        this.addTree(o);
      } else {
        this.addRock(o);
      }
    },
    addTree(tree) {
      const keys = Object.keys(this.trees);
      const length = keys.length;
      if (length >= this.maxTrees) delete this.trees[keys[0]];

      const tSize = randFloat(5, 15) * this.treeSize;
      const bSize = tSize * randFloat(0.5, 0.7) * this.treeSize;
      const vn2 = this.globeC.vNoise(tree.position, 0.01);
      const bColor = this.cscale(vn2).hex();

      this.trees[`tree-${this.treesCounter++}`] = {
        tSize, tColor: this.treeTrunkColor,
        bSize, bColor,
        lookAt: { x: 0, y: 0, z: 0 },
        ...tree,
      };
    },
    deleteTrees() {
      Object.keys(this.trees).forEach(key => delete this.trees[key]);
    },
    addRock(rock) {
      const keys = Object.keys(this.rocks);
      const length = keys.length;
      if (length >= this.maxRocks) delete this.rocks[keys[0]];

      this.rocks[`rock-${this.rocksCounter++}`] = {
        color: this.rockColor,
        size: randFloat(2, 4) * this.rockSize,
        ...rock,
      };
    },
    deleteRocks() {
      Object.keys(this.rocks).forEach(key => delete this.rocks[key]);
    },
    raycast(mouse, camera) {
      this.raycaster.setFromCamera(mouse, camera);
      const objects = this.raycaster.intersectObject(this.$refs.raycastMesh.mesh);
      if (objects.length) {
        const { vNoise, dispV } = this.globeC;
        const { noiseF, noiseWaterLevel } = this.noiseConf;
        const p = objects[0].point;
        if (vNoise(p, noiseF) !== noiseWaterLevel) {
          dispV(p);
          return p;
        };
      }
    },
    // show(onComplete) {
    //   if (this.tween) removeTween(this.tween);
    //   this.globe.scale.set(0, 0, 0);
    //   this.tween = new Tween(this.globe.scale)
    //     .to({ x: 1, y: 1, z: 1 }, this.duration)
    //     .delay(this.delay)
    //     .easing(Easing.Elastic.Out)
    //     .onComplete(onComplete)
    //     .start();
    // },
    // hide(onComplete) {
    //   if (this.tween) removeTween(this.tween);
    //   this.tween = new Tween(this.globe.scale)
    //     .to({ x: 0, y: 0, z: 0 }, this.duration)
    //     .easing(Easing.Elastic.In)
    //     .onComplete(onComplete)
    //     .start();
    // },
  },
};
</script>
