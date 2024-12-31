import { PerspectiveCamera } from "three";
import { inner } from "../utils/inner";

export class Camera extends PerspectiveCamera {
  constructor() {
    super(40, inner.ratio, 0.1, 10000);
    this.position.set(0, 1, -4);
  }
}
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
import {OrbitControls} from 'three/examples/jsm/Addons.js'
import {Renderer} from './renderer'
import {Camera} from './camera'

export class Controls extends OrbitControls {
  constructor(camera: Camera, renderer: Renderer) {
    super(camera, renderer.domElement)
    this.update()
  }
}
import { Updatable } from "../interfaces";
import { Camera } from "./camera";
import { Vector3 } from "three";

export class Follower {
  #camera: Camera;
  #target?: Updatable;

  /**
   * Offset para ajustar a posição
   * da câmera em relação ao carro
   */
  #offset = {
    back: new Vector3(0, 4, -16),
    front: new Vector3(0, 4, 16),
  };

  #current = this.#offset.back;

  /**
   * Interpolação suave (menores
   * valores = mais suavidade)
   */
  #followSpeed = 0.1;

  constructor(camera: Camera) {
    this.#camera = camera;

    this.update();
  }

  setTarget(target: Updatable) {
    this.#target = target;
    const { model } = this.#target;
    this.#camera.lookAt(model.position);
  }

  setView(view: "front" | "back") {
    this.#current = this.#offset[view];
  }

  toggleView() {
    if (this.#current === this.#offset.back) {
      this.#current = this.#offset.front;
    } else {
      this.#current = this.#offset.back;
    }
  }

  update() {
    if (!this.#target) return;

    const targetPosition = new Vector3()
      .copy(this.#target.model.position)
      .add(
        this.#current.clone().applyQuaternion(this.#target.model.quaternion)
      );

    /**
     * Interpola suavemente a posição da câmera
     */
    this.#camera.position.lerp(targetPosition, this.#followSpeed);

    /**
     * Faz a câmera olhar para o carro
     */
    this.#camera.lookAt(this.#target.model.position);
  }
}
export * from './camera';
export * from './cameraman';
export * from './controls';
export * from './follower';
export * from './input';
export * from './loader';
export * from './renderer';
type ControlKey = "up" | "right" | "down" | "left" | "space";

type EventKey = "p" | "v";

export class Input {
  private static instance: Input;

  #state = {
    up: false,
    right: false,
    down: false,
    left: false,
    space: false,
  };

  get state() {
    return this.#state;
  }

  #listeners = {
    p: new Set<VoidFunction>(),
    v: new Set<VoidFunction>(),
  };

  static getInstance() {
    if (!this.instance) {
      this.instance = new Input();
    }

    return this.instance;
  }

  private constructor() {
    onkeydown = this.#onKeyDown;
    onkeyup = this.#onKeyUp;
  }

  #onKeyDown = ({ code }: KeyboardEvent) => {
    const key = this.#normalize(code);
    if (this.#isControl(key)) {
      this.#state[key] = true;
    }
    if (this.#isEvent(key)) {
      for (const cb of this.#listeners[key]) cb();
    }
  };

  #onKeyUp = ({ code }: KeyboardEvent) => {
    const key = this.#normalize(code);
    if (this.#isControl(key)) {
      this.#state[key] = false;
    }
  };

  on(event: EventKey, callback: VoidFunction) {
    this.#listeners[event].add(callback);
    return { off: () => this.#listeners[event].delete(callback) };
  }

  #isControl(key: string): key is ControlKey {
    return Object.keys(this.#state).includes(key);
  }

  #isEvent(key: string): key is EventKey {
    return ["p", "v"].includes(key);
  }

  #normalize(code: string) {
    return code.replace("Arrow", "").replace("Key", "").toLowerCase();
  }
}
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
import { WebGLRenderer } from 'three';

export class Renderer extends WebGLRenderer {
  constructor(container: HTMLElement) {
    super({ antialias: true });
    // this.setClearColor(0xffffff);
    this.setPixelRatio(devicePixelRatio);
    this.setSize(innerWidth, innerHeight);
    container.appendChild(this.domElement);
  }
}
export * from './object-model';
export * from './updatable';
import { Object3D } from "three";

export interface ObjectModel {
  get model(): Object3D;
}
import { ObjectModel } from "./object-model";

export interface Updatable extends ObjectModel {
  update(deltaTime: number): void;
}
import { World } from "./scenes";
import "./style.scss";

const world = new World();

const onMouseMove = () => {
  // const start = new Audio("sounds/start-engine.wav");
  // start.play();

  world.load();

  removeEventListener("keydown", onMouseMove);
};

addEventListener("keydown", onMouseMove);
export * from './track';
export * from './world';
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
import { Group } from "three";

export function getByName<R>(group: Group, name: string) {
  const child = group.getObjectByName(name);
  if (!child) throw `${name} not found in ${group.name}`;
  return child as R;
}
export * from './get-by-name';
export * from './inner';
export const inner = {
  get width() {
    return innerWidth;
  },
  get height() {
    return innerHeight;
  },
  get ratio() {
    return this.width / this.height;
  },
};
export * from './volvo';
import { Group, Mesh, Object3D, Vector3 } from "three";
import { Updatable } from "../interfaces";
import { getByName } from "../utils";
import { Input } from "../core";

const DEG2RAD = Math.PI / 180;

export class Volvo implements Updatable {
  #model: Group;

  get model() {
    return this.#model;
  }

  #input = Input.getInstance();

  /**
   * Massa do carro em kg
   */
  #carMass = 610;

  /**
   * Força do motor em N
   */
  #tractionForceValue = 16000;

  /**
   * Resistência do ar
   */
  #airResistance = 0.02;

  /**
   * Resistência ao rolamento
   */
  #rollingResistance = 8;

  /**
   * Atrito com o chão
   */
  #groundFriction = 0.96;

  #currentVelocity = new Vector3();
  #localAcceleration = new Vector3();
  #netForce = new Vector3();
  #resistanceForce = new Vector3();
  #tractionForce = new Vector3();
  #angularVelocity = 0;

  #currentSteering = 0;
  #steeringAngle = 0;

  #wfl: Mesh;
  #wfr: Mesh;
  #wbl: Mesh;
  #wbr: Mesh;
  #wflParent: Object3D;
  #wfrParent: Object3D;

  constructor(scene: Group) {
    this.#model = scene;
    this.#wfl = getByName(scene, "Volvo-WFL");
    this.#wfr = getByName(scene, "Volvo-WFR");

    // Nó adicional para separar a rotação de direção
    this.#wflParent = this.#wfl.parent as Object3D;
    this.#wfrParent = this.#wfr.parent as Object3D;

    this.#wbl = getByName(scene, "Volvo-WBL");
    this.#wbr = getByName(scene, "Volvo-WBR");
  }

  update(delta: number) {
    this.updateCar(delta);
    this.rotateWheels(delta);
  }

  updateCar(deltaTime: number) {
    /**
     * Rotação do carro
     */
    const carRotation = this.#model.rotation.y;
    const sinRotation = Math.sin(carRotation);
    const cosRotation = Math.cos(carRotation);

    /**
     * Aplica força de tração
     */
    if (this.#input.state.up) {
      this.#tractionForce.set(0, 0, this.#tractionForceValue);
    } else if (this.#input.state.down) {
      this.#tractionForce.set(0, 0, -this.#tractionForceValue);
    } else {
      this.#tractionForce.set(0, 0, 0);
    }

    /**
     * Adiciona downforce proporcional à velocidade
     */
    const downforce = 0.1 * this.#currentVelocity.lengthSq(); // 0.1 é o coeficiente de downforce
    const effectiveMass = this.#carMass + downforce; // Massa efetiva do carro aumenta com a downforce

    /**
     * Transforma a força de tração para o espaço global
     */
    const globalTractionX =
      sinRotation * this.#tractionForce.z + cosRotation * this.#tractionForce.x;
    const globalTractionZ =
      cosRotation * this.#tractionForce.z - sinRotation * this.#tractionForce.x;

    /**
     * Adiciona forças de resistência
     */
    this.#resistanceForce.x = -(
      this.#airResistance *
        this.#currentVelocity.x *
        Math.abs(this.#currentVelocity.x) +
      this.#rollingResistance * this.#currentVelocity.x
    );

    this.#resistanceForce.z = -(
      this.#airResistance *
        this.#currentVelocity.z *
        Math.abs(this.#currentVelocity.z) +
      this.#rollingResistance * this.#currentVelocity.z
    );

    this.#netForce
      .set(globalTractionX, 0, globalTractionZ)
      .add(this.#resistanceForce);

    /**
     * Calcula aceleração (F = ma)
     */
    this.#localAcceleration.copy(this.#netForce).divideScalar(effectiveMass);

    /**
     * Atualiza velocidade
     */
    this.#currentVelocity.addScaledVector(this.#localAcceleration, deltaTime);

    /**
     * Ajusta o atrito para maior aderência com o downforce
     */
    const dynamicFriction = this.#groundFriction + downforce * 0.001; // Atrito aumenta com a downforce
    this.#currentVelocity.multiplyScalar(dynamicFriction);

    /**
     * Impõe limite mínimo para parar completamente
     */
    if (this.#currentVelocity.length() < 0.05) {
      this.#currentVelocity.set(0, 0, 0);
    }

    /**
     * Atualiza posição do carro
     */
    this.#model.position.x += this.#currentVelocity.x * deltaTime;
    this.#model.position.z += this.#currentVelocity.z * deltaTime;

    /**
     * Calcula a direção da velocidade no espaço local
     */
    const localVelocityZ = this.#currentVelocity.dot(
      new Vector3(Math.sin(carRotation), 0, Math.cos(carRotation))
    );

    /**
     * Raio fictício para giro
     */
    const turningRadius = 4;

    /**
     * Atualiza rotação do carro baseado no steering
     */
    this.#angularVelocity =
      (this.#currentSteering * Math.abs(localVelocityZ)) / turningRadius;

    // Ajusta a rotação do carro considerando a direção da velocidade
    const velocityDirection = localVelocityZ >= 0 ? 1 : -1;
    this.#model.rotation.y +=
      this.#angularVelocity * deltaTime * velocityDirection;
  }

  rotateWheels(deltaTime: number) {
    const steeringSpeed = 3 * deltaTime;
    const steeringInput =
      (this.#input.state.left ? 1 : 0) - (this.#input.state.right ? 1 : 0);

    // Atualiza o valor do steering
    if (steeringInput === 0) {
      // Gradualmente retorna para a posição inicial
      if (this.#currentSteering > 0) {
        this.#currentSteering = Math.max(
          0,
          this.#currentSteering - steeringSpeed
        );
      } else if (this.#currentSteering < 0) {
        this.#currentSteering = Math.min(
          0,
          this.#currentSteering + steeringSpeed
        );
      }
    } else {
      // Atualiza o steering com base no input
      this.#currentSteering += steeringInput * steeringSpeed;
      this.#currentSteering = Math.max(-1, Math.min(1, this.#currentSteering));
    }

    // Calcula o ângulo de direção
    this.#steeringAngle = this.#currentSteering * 25 * DEG2RAD;

    /**
     * Aplica o ângulo de direção nos nós pais das rodas dianteiras
     */
    this.#wflParent.rotation.y = this.#steeringAngle;
    this.#wfrParent.rotation.y = this.#steeringAngle;

    /**
     * Calcula a rotação das rodas sincronizada com a velocidade
     */
    const wheelRadius = 0.33; // Raio da roda em metros
    const wheelRotation =
      (this.#currentVelocity.length() / wheelRadius) * deltaTime;

    /**
     * Rodas dianteiras giram apenas no eixo X para movimento
     */
    this.#wfl.rotation.x += wheelRotation;
    this.#wfr.rotation.x += wheelRotation;

    /**
     * Rodas traseiras giram no eixo X
     */
    this.#wbl.rotation.x += wheelRotation;
    this.#wbr.rotation.x += wheelRotation;
  }
}
/// <reference types="vite/client" />


declare const app: HTMLDivElement
