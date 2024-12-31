import { Body, Box, RaycastVehicle, Vec3 } from "cannon-es";
import { Group, Mesh, Object3D, Vector3 } from "three";
import { DEG2RAD } from "three/src/math/MathUtils.js";
import { Updatable } from "../interfaces";
import { getByName } from "../utils";
import { Input } from "../core";

export class Mercedez implements Updatable {
  #model: Group;

  get model() {
    return this.#model;
  }

  #input = Input.getInstance();

  /**
   * Massa do caminhão em kg
   */
  #carMass = 8000;

  /**
   * Força do motor em N
   */
  #tractionForceValue = 45000;

  /**
   * Resistência do ar
   */
  #airResistance = 0.015;

  /**
   * Resistência ao rolamento
   */
  #rollingResistance = 10;

  /**
   * Gravidade em m/s²
   */
  // #gravity = 9.81;

  /**
   * Força de freio em N
   */
  #brakeForce = 60000;

  /**
   * Coeficiente de atrito lateral
   */
  #lateralFriction = 0.7;

  /**
   * Velocidade máxima
   */
  #maxSpeed = 100; // ~360 km/h

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

  #body = new Body({ mass: 1500 });

  #vehicle: RaycastVehicle;

  constructor(scene: Group) {
    this.#model = scene;
    console.log(this.#model);

    this.#wfl = getByName(scene, "Mercedez-WFL");
    this.#wfr = getByName(scene, "Mercedez-WFR");

    // Nó adicional para separar a rotação de direção
    this.#wflParent = this.#wfl.parent as Object3D;
    this.#wfrParent = this.#wfr.parent as Object3D;

    this.#wbl = getByName(scene, "Mercedez-WBL");
    this.#wbr = getByName(scene, "Mercedez-WBR");

    const shape = new Box(new Vec3(1, 0.5, 2));
    this.#body.addShape(shape);
    this.#body.position.set(0, 1, 0);

    this.#vehicle = new RaycastVehicle({
      chassisBody: this.#body,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });

    const wheelPositions = [
      new Vec3(-1, -0.5, 2), // Frente esquerda
      new Vec3(1, -0.5, 2), // Frente direita
      new Vec3(-1, -0.5, -2), // Traseira esquerda
      new Vec3(1, -0.5, -2), // Traseira direita
    ];

    wheelPositions.forEach((position, index) => {
      const isFrontWheel = index < 2; // As duas primeiras rodas são dianteiras
      this.#vehicle.addWheel({
        chassisConnectionPointLocal: position,
        isFrontWheel,
        suspensionRestLength: 0.3,
        suspensionStiffness: 30,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        frictionSlip: 5,
        rollInfluence: 0.01,
        axleLocal: new Vec3(1, 0, 0),
        directionLocal: new Vec3(0, -1, 0),
        radius: 0.4,
      });
    });

    // this.#vehicle.addToWorld(world);
  }

  update(delta: number) {
    this.updateCar(delta);
    this.rotateWheels(delta);
  }

  updateCar(deltaTime: number) {
    const carRotation = this.#model.rotation.y;
    const sinRotation = Math.sin(carRotation);
    const cosRotation = Math.cos(carRotation);

    // Aplica força de tração
    if (this.#input.state.up) {
      this.#tractionForce.set(0, 0, this.#tractionForceValue);
    } else if (this.#input.state.down) {
      this.#tractionForce.set(0, 0, -this.#tractionForceValue * 0.5);
    } else {
      this.#tractionForce.set(0, 0, 0);
    }

    // Aplica força de freio
    const brakeForce = new Vector3();
    if (this.#input.state.space) {
      brakeForce
        .copy(this.#currentVelocity)
        .normalize()
        .multiplyScalar(-this.#brakeForce);
    }

    // Força de resistência
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

    // Força total
    const globalTractionX =
      sinRotation * this.#tractionForce.z + cosRotation * this.#tractionForce.x;
    const globalTractionZ =
      cosRotation * this.#tractionForce.z - sinRotation * this.#tractionForce.x;

    this.#netForce
      .set(globalTractionX, 0, globalTractionZ)
      .add(this.#resistanceForce)
      .add(brakeForce);

    // Calcula aceleração (F = ma)
    const effectiveMass = this.#carMass;
    this.#localAcceleration.copy(this.#netForce).divideScalar(effectiveMass);

    // Atualiza velocidade
    this.#currentVelocity.addScaledVector(this.#localAcceleration, deltaTime);

    // Limitar velocidade máxima
    if (this.#currentVelocity.length() > this.#maxSpeed) {
      this.#currentVelocity.setLength(this.#maxSpeed);
    }

    // Reduz componente lateral da velocidade
    const forwardDirection = new Vector3(
      Math.sin(carRotation),
      0,
      Math.cos(carRotation)
    ).normalize();

    const lateralVelocity = this.#currentVelocity
      .clone()
      .projectOnPlane(forwardDirection);

    this.#currentVelocity.sub(
      lateralVelocity.multiplyScalar(this.#lateralFriction)
    );

    // Parada mínima
    if (this.#currentVelocity.length() < 0.05) {
      this.#currentVelocity.set(0, 0, 0);
    }

    // Ajusta posição
    this.#model.position.addScaledVector(this.#currentVelocity, deltaTime);

    // Rotação do caminhão
    const localVelocityZ = this.#currentVelocity.dot(forwardDirection);
    const turningRadius = 10;
    this.#angularVelocity =
      (this.#currentSteering * Math.abs(localVelocityZ)) / turningRadius;

    const velocityDirection = localVelocityZ >= 0 ? 1 : -1;
    this.#model.rotation.y +=
      this.#angularVelocity * deltaTime * velocityDirection;
  }

  rotateWheels(deltaTime: number) {
    const steeringSpeed = 2 * deltaTime;
    const steeringInput =
      (this.#input.state.left ? 1 : 0) - (this.#input.state.right ? 1 : 0);

    // Atualiza direção
    if (steeringInput === 0) {
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
      this.#currentSteering += steeringInput * steeringSpeed;
      this.#currentSteering = Math.max(-1, Math.min(1, this.#currentSteering));
    }

    // Calcula ângulo de direção
    this.#steeringAngle = this.#currentSteering * 25 * DEG2RAD;

    // Aplica ângulo de direção
    this.#wflParent.rotation.y = this.#steeringAngle;
    this.#wfrParent.rotation.y = this.#steeringAngle;

    // Rotação sincronizada das rodas
    const wheelRadius = 0.5;
    const wheelRotation =
      (this.#currentVelocity.length() / wheelRadius) * deltaTime;

    this.#wfl.rotation.x += wheelRotation;
    this.#wfr.rotation.x += wheelRotation;
    this.#wbl.rotation.x += wheelRotation;
    this.#wbr.rotation.x += wheelRotation;
  }
}
