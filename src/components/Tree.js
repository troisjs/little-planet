import Object3D from './Object3D';
import { createTree } from './factory.js';
import { Easing, Tween, remove as removeTween } from '@tweenjs/tween.js';

export default {
  name: 'Tree',
  extends: Object3D,
  props: {
    tSize: Number,
    bSize: Number,
    tColor: [Number, String],
    bColor: [Number, String],
  },
  created() {
    this.tree = createTree(this.tSize, this.bSize, this.tColor, this.bColor);
    this.initObject3D(this.tree);
  },
  mounted() {
    this.tree.scale.set(0, 0, 0);
    this.tween = new Tween(this.tree.scale)
      .to({ x: 1, y: 1, z: 1 }, this.duration)
      .delay(this.delay)
      .easing(Easing.Elastic.Out)
      .start();
  },
  unmounted() {
    if (this.tween) removeTween(this.tween);
    new Tween(this.tree.scale)
      .to({ x: 0, y: 0, z: 0 }, this.duration / 2)
      .easing(Easing.Elastic.In)
      .onComplete(() => {
        this.removeFromParent();
        this.tree.dispose();
      })
      .start();
  },
};
