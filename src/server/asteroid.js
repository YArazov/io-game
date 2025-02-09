const ObjectClass = require('./object');
const shortid = require('shortid'); //generates ids for asteroids and bullets

class Asteroid extends ObjectClass {
    constructor(x, y, r) {
        super(shortid(), x, y, Math.random(), 100);
        this.radius = r;
    }

    checkOutOfBounds() {
        return this.distanceTo({x: 0, y: 0}) > 1000;
    }

}

module.exports = Asteroid;