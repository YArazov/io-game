const Vector2D = require('./vector');

class Object {
  constructor(id, x, y, vx, vy, dir) {
    this.id = id;
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(vx, vy);
    this.acceleration = new Vector2D(0, 0);
    this.direction = dir;
  }

  updatePosition(dt, velocityLimit=null) {
    this.velocity.add(this.acceleration.clone().multiply(dt));
    if (velocityLimit) {
      this.limitVelocity(velocityLimit);
    }
    this.position.add(this.velocity.clone().multiply(dt));
  }

  limitVelocity(velocityLimit) {
    const currentVelocity = this.velocity.magnitude();
    if (currentVelocity > velocityLimit) {
      this.velocity.setMagnitude(velocityLimit);
    }
  }

  distanceTo(object) {
    return this.position.clone().subtract(object.position).magnitude();
  }

  setDirection(dir) {
    this.direction = dir;
  }

  serializeForUpdate() {
    return {
      id: this.id,
      x: this.position.x,
      y: this.position.y,
    };
  }
}

module.exports = Object;
