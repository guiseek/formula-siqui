import { Camera, Follower, Input, Loader, Renderer } from "../core";
import { Updatable } from "../interfaces";
import { Volvo } from "../vehicles";
import { Track } from "../scenes";
import {
  Scene,
  Clock,
  SpotLight,
  PointLight,
  AmbientLight,
  PMREMGenerator,
  DirectionalLight,
} from "three";
import { inner } from "../utils";

export class World {
  #scene = new Scene();

  #clock = new Clock();

  #camera = new Camera();

  #renderer = new Renderer(app);

  #follower = new Follower(this.#camera);

  #ambientLight = new AmbientLight(0xffffff, 0.5);

  #pointLight = new PointLight(0xffaa00, 0.8, 30);

  #directionalLight = new DirectionalLight(0xffffff, 1);

  #spotLight = new SpotLight(0xffffff, 0.7, 50, Math.PI / 6);

  #updatables = new Set<Updatable>();

  #animation?: number;

  #input = Input.getInstance();

  #loader = Loader.getInstance();

  #pmremGenerator = new PMREMGenerator(this.#renderer);

  #track?: Track;

  #mcLaren?: Volvo;

  constructor() {
    this.#pmremGenerator.compileEquirectangularShader();

    this.#loader.rgbe.loadAsync("day_4k.hdr").then((texture) => {
      const renderTarget = this.#pmremGenerator.fromEquirectangular(texture);
      this.#scene.environment = renderTarget.texture;
      this.#scene.background = renderTarget.texture;
      renderTarget.texture.dispose();
      this.#pmremGenerator.dispose();
    });

    this.#scene.add(this.#ambientLight);

    this.#pointLight.position.set(2, 5, 2);
    this.#pointLight.castShadow = true;
    this.#scene.add(this.#pointLight);

    /**
     * Posição acima e à direita do ambiente
     */
    this.#directionalLight.position.set(5, 10, 5);

    /**
     * Ativa sombras
     */
    this.#directionalLight.castShadow = true;

    /**
     * Resolução do mapa de sombras
     */
    this.#directionalLight.shadow.mapSize.width = 1024;
    this.#directionalLight.shadow.mapSize.height = 1024;

    /**
     * Plano próximo do mapa de sombras
     */
    this.#directionalLight.shadow.camera.near = 0.5;

    /**
     * Plano distante do mapa de sombras
     */
    this.#directionalLight.shadow.camera.far = 50;

    this.#scene.add(this.#directionalLight);

    this.#spotLight.position.set(-5, 10, -5);

    /**
     * Aponta para o centro do ambiente
     */
    this.#spotLight.target.position.set(0, 0, 0);
    this.#spotLight.castShadow = true;

    this.#scene.add(this.#spotLight);
    this.#scene.add(this.#spotLight.target);

    this.#loader.gltf.loadAsync("track.glb").then(({ scene }) => {
      this.#track = new Track(scene);
      this.#scene.add(this.#track.model);
      this.#renderer.render(this.#scene, this.#camera);
    });

    addEventListener("resize", this.#onResize);

    this.#input.on("v", () => {
      this.#follower.toggleView();
    });

    this.#input.on("p", () => {
      this.pause();
    });
  }

  load() {
    this.#loader.gltf.loadAsync("volvo.glb").then(({ scene }) => {
      this.#mcLaren = new Volvo(scene);

      this.#updatables.add(this.#mcLaren);

      this.#scene.add(this.#mcLaren.model);

      this.#follower.setTarget(this.#mcLaren);

      this.start();
    });
  }

  start() {
    this.#animation = this.#animate();
    console.log(this.#animation);
    
  }

  pause() {
    if (this.#animation) this.stop();
    else this.start();
  }

  stop() {
    if (this.#animation) {
      cancelAnimationFrame(this.#animation);
    }
  }

  #animate = () => {
    const delta = this.#clock.getDelta();

    for (const object of this.#updatables) {
      object.update(delta);
    }

    this.#follower.update();

    this.#renderer.render(this.#scene, this.#camera);

    return requestAnimationFrame(this.#animate);
  };

  #onResize = () => {
    this.#camera.aspect = inner.ratio;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setPixelRatio(devicePixelRatio);
    this.#renderer.setSize(inner.width, inner.height);
  };
}
