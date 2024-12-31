type ControlKey = "up" | "right" | "down" | "left" | "space";

type EventKey = "p" | "v";

type ChoiceKey = "1" | "2" | "3";

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

  #selected = {
    1: new Set<VoidFunction>(),
    2: new Set<VoidFunction>(),
    3: new Set<VoidFunction>(),
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

    if (this.#isChoice(key)) {
      for (const cb of this.#selected[key]) cb();
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

  wait(option: ChoiceKey, callback: VoidFunction) {
    this.#selected[option].add(callback);
    return { off: () => this.#selected[option].delete(callback) };
  }

  #isControl(key: string): key is ControlKey {
    return Object.keys(this.#state).includes(key);
  }

  #isEvent(key: string): key is EventKey {
    return ["p", "v"].includes(key);
  }

  #isChoice(key: string): key is ChoiceKey {
    return ["1", "2", "3"].includes(key);
  }

  #normalize(code: string) {
    return code
      .replace("Arrow", "")
      .replace("Key", "")
      .replace("Digit", "")
      .toLowerCase();
  }
}
