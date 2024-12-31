import { PerspectiveCamera } from "three";
import { inner } from "../utils/inner";

export class Camera extends PerspectiveCamera {
  constructor() {
    super(40, inner.ratio, 0.1, 10000);
    this.position.set(0, 1, -4);
  }
}
