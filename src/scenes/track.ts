import { ObjectModel } from "../interfaces";
import { Body, Trimesh } from "cannon-es";
import { getByName } from "../utils";
import { Group, Mesh } from "three";

export class Track implements ObjectModel {
  #model: Group;

  get model() {
    return this.#model;
  }

  #road: Mesh;

  constructor(scene: Group) {
    this.#model = scene;

    this.#road = getByName<Mesh>(this.model, "Road");
  }

  getRoadBody() {
    /**
     * Garante que os bounds estão calculados
     */
    this.#road.geometry.computeBoundingBox();

    /**
     * Calcula a esfera de bounding (otimiza Cannon-ES)
     */
    this.#road.geometry.computeBoundingSphere();

    /**
     * Converte Geometry (three) para Trimesh (cannon)
     */

    if (!this.#road.geometry.attributes.position) {
      throw new Error("Track geometry does not have position attribute.");
    }

    const vertices = Array.from(this.#road.geometry.attributes.position.array);
    const indices = Array.from(this.#road.geometry.index?.array ?? []);

    if (indices.length === 0) {
      throw new Error("Track geometry does not have indices.");
    }

    const shape = new Trimesh(vertices, indices);

    const body = new Body({ mass: 0, shape });

    body.position.set(
      this.model.position.x,
      this.model.position.y,
      this.model.position.z
    );

    body.quaternion.set(
      this.model.quaternion.x,
      this.model.quaternion.y,
      this.model.quaternion.z,
      this.model.quaternion.w
    );

    return body;
  }
}
