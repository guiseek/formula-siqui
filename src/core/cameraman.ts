import { Updatable } from "../interfaces";
import { Camera } from "./camera";
import { Vector3 } from "three";

export class Cameraman {
  #target?: Updatable;

  constructor(private camera: Camera) {
    this.camera.position.set(0, 2, -6);
  }

  setTarget(target: Updatable) {
    this.#target = target;
    const { model } = this.#target;
    this.camera.lookAt(model.position);
  }

  update() {
    if (!this.#target) return;

    const offset = new Vector3(0, 2, -6);
    const { model } = this.#target;

    const targetPosition = model.position.clone();

    const cameraPosition = targetPosition.add(
      offset.applyQuaternion(model.quaternion)
    );

    this.camera.position.copy(cameraPosition);

    this.camera.lookAt(model.position);
  }
}
