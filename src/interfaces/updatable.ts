import { ObjectModel } from "./object-model";

export interface Updatable extends ObjectModel {
  update(deltaTime: number): void;
}
