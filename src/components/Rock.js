import Object3D from './Object3D';
import { createRock } from './factory.js';
import { Easing, Tween, remove as removeTween } from '@tweenjs/tween.js';

export default {
  name: 'Rock',
  extends: Object3D,
  props: {
    size: Number,
    color: [Number, String],
  },
  created() {
    this.rock = createRock(this.size, this.color);
    this.initObject3D(this.rock);
  },
  mounted() {
    this.rock.scale.set(0, 0, 0);
    this.tween = new Tween(this.rock.scale)
      .to({ x: 1, y: 1, z: 1 }, this.duration)
      .delay(this.delay)
      .easing(Easing.Elastic.Out) 
      .start();
    // const { x, y, z  }  = this.rock.position;
    // this.rock.position.multiplyScalar(5 + Math.random() * 5);
    // new Tween(this.rock.position)
    //   .to({ x, y, z }, this.duration)
    //   .delay(this.delay)
    //   .easing(Easing.Bounce.InOut)
    //   .start();
  },
  unmounted() {
    if (this.tween) removeTween(this.tween);
    new Tween(this.rock.scale)
      .to({ x: 0, y: 0, z: 0 }, this.duration / 2)
      .easing(Easing.Elastic.In)
      .onComplete(() => {
        this.removeFromParent();
        this.rock.dispose();
      })
      .start();
  },
};
