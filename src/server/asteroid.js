const ObjectClass = require('./object');
const shortid = require('shortid'); //generates ids for asteroids and bullets
const Constants = require('../shared/constants');

class Asteroid extends ObjectClass {
    constructor(x, y, r, angV) {
        const randomDirection = (Math.random() * 2 - 1) * 2 * Math.PI;
        super(shortid(), x, y, 0, -100, randomDirection);
        this.radius = r;
        this.hp = Constants.ASTEROID_HP;
        this.direction;
        this.angularVelocity = angV;
    }

    update(dt) {
      super.updatePosition(dt);
      this.direction += this.angularVelocity * dt;
    }

    checkOutOfBounds() {
        return this.position.y < 0;
    }

    serializeForUpdate() {
        return {
          ...(super.serializeForUpdate()),
          r: this.radius,
          hp: this.hp,
        };
      }
}

module.exports = Asteroid;