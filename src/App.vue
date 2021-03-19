<template>
  <div>
    <Renderer
      ref="renderer"
      antialias alpha shadow
      mouse-move
      resize="window"
      :orbit-ctrl="{ enableDamping: true }"
      @mousemove="onMouseMove"
    >
      <Camera :position="{ z: 400 }" />
      <Scene>
        <AmbientLight color="#808080" />
        <Group ref="lightGroup">
          <DirectionalLight
            ref="light"
            :intensity="1"
            :position="{ x: 0, y: 300, z: 0 }"
            cast-shadow :shadow-camera="{ top: 120, bottom: -120, left: -120, right: 120 }"
          />
        </Group>
        <LittlePlanet v-if="show" ref="planet" v-bind="planetProps" />
      </Scene>
    </Renderer>
  </div>
</template>

<script>
/**
 * Not optimized, trees and rocks are not instanced (randomized geometries)
 */
import { update as updateTweens } from '@tweenjs/tween.js';
import Tweakpane from 'tweakpane';
import chroma from 'chroma-js';

import LittlePlanet from './components/LittlePlanet.vue';

export default {
  components: { LittlePlanet },
  data() {
    return {
      show: true,
      planetProps: {
        radius: 100,
        detail: 15,

        // planet noise
        noiseConf: {
          noiseF: 0.015,
          noiseD: 10,
          noiseWaterTreshold: 0.4,
          noiseWaterLevel: 0.2,
        },

        maxTrees: 400,
        maxRocks: 100,
        treeSize: 1,
        rockSize: 1,

        // colors
        treeTrunkColor: '#764114',
        treeBodyColor1: '#509A36',
        treeBodyColor2: '#FF5A36',
        treeBodyColor3: '#509A36',
        treeBodyColor4: '#FFC236',
        treeBodyColor5: '#509A36',
        rockColor: '#808080',
        groundColor: '#417B2B',
        waterColor: '#2080D0',

        duration: 2000,
        delay: 1000,
      },
    };
  },
  mounted() {
    this.initPane();

    const lightGroup = this.$refs.lightGroup.group;
    this.$refs.renderer.onBeforeRender(() => {
      updateTweens();
      lightGroup.rotation.z += 0.005;
    });
  },
  beforeUnmount() {
    this.pane.dispose();
  },
  methods: {
    random() {
      const props = this.planetProps;
      const noiseConf = this.planetProps.noiseConf;
      noiseConf.noiseF = 0.0001 + Math.random() * 0.05;
      noiseConf.noiseD = 5 + Math.random() * 45;
      noiseConf.noiseWaterTreshold = Math.random();
      noiseConf.noiseWaterLevel = Math.random();
      props.maxTrees = Math.round(50 + Math.random() * 450);
      props.maxRocks = Math.round(50 + Math.random() * 450);
      props.treeSize = 0.5 + Math.random() * 2;
      props.rockSize = 0.5 + Math.random() * 2;
      props.treeTrunkColor = chroma.random().css();
      props.treeBodyColor1 = chroma.random().css();
      props.treeBodyColor2 = chroma.random().css();
      props.treeBodyColor3 = chroma.random().css();
      props.treeBodyColor4 = chroma.random().css();
      props.treeBodyColor5 = chroma.random().css();
      props.rockColor = chroma.random().css();
      props.groundColor = chroma.random().css();
      props.waterColor = chroma.random().css();
      this.pane.refresh();
      this.refresh();
    },
    refresh() {
      this.show = false;
      this.$nextTick(() => { this.show = true; });
    },
    initPane() {
      const pane = new Tweakpane();
      pane.addInput(this.planetProps, 'maxTrees', { min: 1, max: 750, step: 1 });
      pane.addInput(this.planetProps, 'maxRocks', { min: 1, max: 750, step: 1 });
      pane.addInput(this.planetProps, 'treeSize', { min: 0.5, max: 5 });
      pane.addInput(this.planetProps, 'rockSize', { min: 0.5, max: 5 });
      pane.addInput(this.planetProps, 'radius', { min: 10, max: 200, step: 1 });
      pane.addInput(this.planetProps, 'detail', { min: 3, max: 50, step: 1 });

      let folder = pane.addFolder({ title: 'Tree Colors', expanded: false });
      folder.addInput(this.planetProps, 'treeBodyColor1', { label: 'BodyColor1' });
      folder.addInput(this.planetProps, 'treeBodyColor2', { label: 'BodyColor2' });
      folder.addInput(this.planetProps, 'treeBodyColor3', { label: 'BodyColor3' });
      folder.addInput(this.planetProps, 'treeBodyColor4', { label: 'BodyColor4' });
      folder.addInput(this.planetProps, 'treeBodyColor5', { label: 'BodyColor5' });

      folder = pane.addFolder({ title: 'Other Colors', expanded: false });
      folder.addInput(this.planetProps, 'rockColor', { label: 'RockColor' });
      folder.addInput(this.planetProps, 'groundColor', { label: 'GroundColor' });
      folder.addInput(this.planetProps, 'waterColor', { label: 'WaterColor' });

      folder = pane.addFolder({ title: 'Planet Config', expanded: false });
      folder.addInput(this.planetProps.noiseConf, 'noiseF', { label: 'Noise', min: 0.0001, max: 0.05 });
      folder.addInput(this.planetProps.noiseConf, 'noiseD', { label: 'Displacement', min: 0, max: 50, step: 1 });
      folder.addInput(this.planetProps.noiseConf, 'noiseWaterTreshold', { label: 'WaterTreshold', min: 0, max: 1 });
      folder.addInput(this.planetProps.noiseConf, 'noiseWaterLevel', { label: 'WaterLevel', min: 0, max: 1 });

      // pane.addButton({ title: 'New Planet' }).on('click', () => { this.$refs.planet.init(); });
      pane.addButton({ title: 'New Planet' }).on('click', this.refresh);
      pane.addButton({ title: 'Random Planet' }).on('click', this.random);
      pane.addButton({ title: 'Remove Trees' }).on('click', () => { this.$refs.planet.deleteTrees(); });
      pane.addButton({ title: 'Remove Rocks' }).on('click', () => { this.$refs.planet.deleteRocks(); });

      this.pane = pane;
    },
    onMouseMove() {
      if (!this.$refs.planet) return;
      const { mouse, camera } = this.$refs.renderer.three;
      const p = this.$refs.planet.raycast(mouse, camera);
      if (p) {
        if (this.oldP && this.oldP.distanceTo(p) < 10) return;
        this.oldP = p.clone();
        this.$refs.planet.addSomething({
          position: { x: p.x, y: p.y, z: p.z },
          duration: 750 + Math.random() * 500,
        });
      }
    },
  },
};
</script>

<style>
body, html {
  margin: 0;
  height: 100%;
}
body {
  background-image: radial-gradient(circle, #73aad6, #003962, #000);
  cursor: pointer;
}
canvas {
  display: block;
}
</style>
