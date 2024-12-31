import {
  DRACOLoader,
  GLTFLoader,
  RGBELoader,
} from "three/examples/jsm/Addons.js";

export class Loader {
  private static instance: Loader;

  gltf: GLTFLoader;

  rgbe: RGBELoader;

  static getInstance() {
    if (!this.instance) {
      this.instance = new Loader();
    }

    return this.instance;
  }

  private constructor() {
    this.rgbe = new RGBELoader();
    this.rgbe.setPath("envs/");

    this.gltf = new GLTFLoader();
    this.gltf.setPath("models/");

    const draco = new DRACOLoader();
    draco.setDecoderPath("js/");

    this.gltf.setDRACOLoader(draco);
  }
}
