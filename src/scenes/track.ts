import { ObjectModel } from "../interfaces";
import { Group } from "three";

export class Track implements ObjectModel {
  #model: Group;

  get model() {
    return this.#model;
  }

  constructor(scene: Group) {
    this.#model = scene;
  }
}
