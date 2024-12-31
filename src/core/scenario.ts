import { Updatable } from "../interfaces";
import { Renderer } from "./renderer";
import { Camera } from "./camera";
import { inner } from "../utils";
import {
  Clock,
  Scene,
  SpotLight,
  PointLight,
  AmbientLight,
  DirectionalLight,
} from "three";

export abstract class Scenario {
  protected scene = new Scene();

  protected clock = new Clock();

  protected camera = new Camera();

  protected renderer = new Renderer(app);

  protected updatables = new Set<Updatable>();

  ambientLight = new AmbientLight(0xffffff, 0.5);

  pointLight = new PointLight(0xffaa00, 0.8, 30);

  directionalLight = new DirectionalLight(0xffffff, 1);

  spotLight = new SpotLight(0xffffff, 0.7, 50, Math.PI / 6);

  animation?: number;

  animationFn?: (delta: number) => void;

  constructor() {
    this.scene.add(this.ambientLight);

    this.pointLight.position.set(2, 5, 2);
    this.pointLight.castShadow = true;
    this.scene.add(this.pointLight);

    /**
     * Posição acima e à direita do ambiente
     */
    this.directionalLight.position.set(5, 10, 5);

    /**
     * Ativa sombras
     */
    this.directionalLight.castShadow = true;

    /**
     * Resolução do mapa de sombras
     */
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;

    /**
     * Plano próximo do mapa de sombras
     */
    this.directionalLight.shadow.camera.near = 0.5;

    /**
     * Plano distante do mapa de sombras
     */
    this.directionalLight.shadow.camera.far = 50;

    this.scene.add(this.directionalLight);

    this.spotLight.position.set(-5, 10, -5);

    /**
     * Aponta para o centro do ambiente
     */
    this.spotLight.target.position.set(0, 0, 0);
    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    addEventListener("resize", this.#onResize);
  }

  start(animationFn?: (delta: number) => void) {
    this.animationFn = animationFn;

    this.animation = this.animate();
    console.log(this.animation);
  }

  pause() {
    if (this.animation) this.stop();
    else this.start(this.animationFn);
  }

  stop() {
    if (this.animation) {
      cancelAnimationFrame(this.animation);
      this.animation = undefined;
    }
  }

  animate = () => {
    
    const delta = this.clock.getDelta();
    
    if (this.animationFn) {
      this.animationFn(delta);
    }
    
    for (const object of this.updatables) {
      object.update(delta);
    }
    
    this.renderer.render(this.scene, this.camera);
    
    this.animation = requestAnimationFrame(this.animate);
    return this.animation
  };

  #onResize = () => {
    this.camera.aspect = inner.ratio;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(inner.width, inner.height);
  };
}
