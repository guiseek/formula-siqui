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
