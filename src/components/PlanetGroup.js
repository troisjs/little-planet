import { Group } from 'three';
import Object3D from './Object3D.js';

export default {
  name: 'PlanetGroup',
  extends: Object3D,
  created() {
    this.group = new Group();
    this.initObject3D(this.group);
  },
};
