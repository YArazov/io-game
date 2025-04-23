const ObjectClass = require('./object');
const shortid = require('shortid'); //generates ids for asteroids and bullets
const Constants = require('../shared/constants');

class Asteroid extends ObjectClass {
    constructor(x, y, r) {
        super(shortid(), x, y, 0, -100, Math.PI);
        this.radius = r;
        this.hp = Constants.ASTEROID_HP;
        this.direction;
    }

    checkOutOfBounds() {
        return this.position.y < 0;
    }

    serializeForUpdate() {
        return {
          ...(super.serializeForUpdate()),
          r: this.radius,
          hp: this.hp,
          direction: 0,
        };
      }
}

module.exports = Asteroid;