import { Follower, Input, Loader, Scenario } from "../core";
import { FH750, Volvo } from "../vehicles";
import { Updatable } from "../interfaces";
import { Group } from "three";

export class World extends Scenario {
  #loader = Loader.getInstance();

  #input = Input.getInstance();

  #follower = new Follower(this.camera);

  constructor() {
    super();

    this.load().then();

    this.camera.position.z = 10;

    // this.#controls.minDistance = 10;
  }

  async load() {
    let volvo: Group;
    let fh750: Group;
    let track: Group;

    let selected: Updatable;

    let percent = {
      volvo: 0,
      fh750: 0,
      track: 0,
      envMap: 0,
    };

    this.#loader.rgbe
      .loadAsync("day_4k.hdr", ({ loaded, total }) => {
        const computed = (loaded / total) * 100;
        percent.envMap = parseInt(String(computed), 10);
      })
      .then((texture) => {
        this.scene.environment = texture;
        this.scene.background = texture;
        texture.dispose();
      });

    this.#loader.gltf
      .loadAsync("volvo.glb", ({ loaded, total }) => {
        const computed = (loaded / total) * 100;
        percent.volvo = parseInt(String(computed), 10);
      })
      .then(({ scene }) => {
        volvo = scene;
        volvo.position.x -= 1.3;
        volvo.scale.setScalar(0.6);

        this.scene.add(volvo);
      });

    this.#loader.gltf
      .loadAsync("track.glb", ({ loaded, total }) => {
        const computed = (loaded / total) * 100;
        percent.track = parseInt(String(computed), 10);
      })
      .then(({ scene }) => {
        track = scene;
      });

    this.#loader.gltf
      .loadAsync("fh-750.glb", ({ loaded, total }) => {
        const computed = (loaded / total) * 100;
        percent.fh750 = parseInt(String(computed), 10) ?? 100;
        progress.value =
          (percent.volvo + percent.track + percent.envMap + percent.fh750) / 4;

        if (progress.value === 100) {
          progress.hidden = true;

          const onVolvo = this.#input.wait("1", () => {
            onVolvo.off();
            this.scene.add(track);
            volvo.scale.setScalar(1);
            volvo.position.set(0, 0, 0);
            selected = new Volvo(volvo);
            this.scene.add(selected.model);
            this.scene.remove(fh750);
            this.#follower.setTarget(selected);
          });
          const onFH = this.#input.wait("2", () => {
            onFH.off();
            this.scene.add(track);
            fh750.scale.setScalar(1);
            fh750.position.set(0, 0, 0);
            selected = new FH750(fh750);
            this.scene.add(selected.model);
            this.scene.remove(volvo);
            this.#follower.setTarget(selected);
          });
        }
      })
      .then(({ scene }) => {
        fh750 = scene;
        fh750.position.x += 1.3;
        fh750.scale.setScalar(0.6);

        this.scene.add(fh750);
      });

    this.start((delta) => {
      if (!selected) {
        if (volvo) {
          volvo.rotation.y += delta * 0.4;
        }

        if (fh750) {
          fh750.rotation.y += delta * 0.4;
        }
      } else {
        selected.update(delta);
        this.#follower.update();
      }
    });
  }
}
