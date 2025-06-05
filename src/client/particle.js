class Particle {
  constructor(x, y, dir, speed, group) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D();
    this.direction = dir;
    this.speed = speed;
    this.group = group;
  }

  setVelocity() {
    this.velocity.x = Math.cos(this.direction) * this.speed;
    this.velocity.y = -Math.sin(this.direction) * this.speed;
  }

  update(dt) {
    this.position.add(this.velocity.clone().multiply(dt));
  }

}

class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }

    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    add(v) {
        this.x += v.x; 
        this.y += v.y;
        return this;
    }

    subtract(v) {
        this.x -= v.x; 
        this.y -= v.y;
        return this;
    }

    multiply(scalar) {
       this.x *= scalar; 
       this.y *= scalar;
        return this;
    }

    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar; 
            this.y /= scalar;
            return this;
        } else {
            return this;
        }
    }
}

module.exports = Particle;