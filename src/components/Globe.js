import Object3D from './Object3D';
import { createGlobe } from './factory.js';

export const globeProps = {
  radius: { type: Number, default: 100 },
  detail: { type: Number, default: 15 },
  groundColor: { type: String, default: '#417B2B' },
  waterColor: { type: String, default: '#2080D0' },
  noiseConf: {
    type: Object,
    default: () => {
      return {
        noiseF: 0.015,
        noiseD: 15,
        noiseWaterTreshold: 0.4,
        noiseWaterLevel: 0.2,
      };
    },
  },
};

export default {
  name: 'Globe',
  extends: Object3D,
  props: globeProps,
  created() {
    const { globe, vNoise, dispV } = createGlobe(this.radius, this.detail, this.groundColor, this.waterColor, this.noiseConf);
    this.globe = globe;
    this.vNoise = vNoise;
    this.dispV = dispV;
    this.initObject3D(this.globe);
  },
  mounted() {
  },
  unmounted() {
    // this.globe.geometry.dispose();
    // this.globe.material.dispose();
  },
};

