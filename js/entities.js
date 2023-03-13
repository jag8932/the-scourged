class Player extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(app.loader.resources[ "images/bk_player_assets/player_9mmhandgun.png"].texture);
        this.anchor.set(0.5, 0.5);
        this.health = 100;
        this.x = x;
        this.y = y;
        this.state = "alive";
        this.healthTag = new PIXI.Text('Health: ' +this.health);
        this.tagStyle = new PIXI.TextStyle({
            fill: 'black',
            fontSize: 25,
            fontFamily: 'JetBrains Mono',
            stroke: 0xFF0000,
            strokeThickness: 1
        });
        this.healthTag.style = this.tagStyle;
        this.healthTag.x = 50;
        this.healthTag.y = 40;
        gameScene.addChild(this.healthTag);
    }
    
    detectHit(enemy) {
        let disx = this.x - enemy.x;
        let disy = this.y - enemy.y;
        let dist = Math.sqrt(disx * disx + disy * disy);
        if (dist < 30) {
            return true;
        }
    }
    updateText() {
        this.healthTag.text = 'Health: ' + this.health;
    }
    dead(audio) {
        audio.play();
    }
    hurt(audio, dmg = 25) {
        audio.play();
        this.health -= dmg;
    }
    moveLeft() {
        if (this.x > 0) {
            this.x -= 10;
        }
    }
    moveRight() {
        if (this.x < app.view.width) {
            this.x += 10;
        }
    }
    moveUp() {
        if (this.y > 0) {
            this.y -= 10;
        }
    }
    moveDown() {
        if (this.y < app.view.height) {
            this.y += 10;
        }

    }
    // Due to the difficulty in figuring out how to get the player rotation to follow
    // the mouse, I looked at http://proclive.io/shooting-tutorial/ to help as well as
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
    // to understand the atan2 function. This function calculates the distances of the x points and 
    // y points and inserts them into an atan2 function. It returns the result.
    rotateToMouse(mouseX, mouseY, x = this.x, y = this.y) {
        let distY = mouseY - y;
        let distX = mouseX - x;
        let angle = Math.atan2(distY, distX);
        return angle;
    }
}

// Enemy
class Enemy extends PIXI.Sprite {
    constructor(x = 0, y = 0, strength = 1) {
        super(app.loader.resources["images/zombie1.png"].texture);
        this.anchor.set(.5, .5);
        this.scale.set(.5);
        this.x = x;
        this.y = y;
        this.strength = strength;
        this.health = 30;
        this.alive = true;
        this.speedRan = Math.random(0, 1);
    }

// Can be used to see if bullet is touching the enemy.
    detectHit(bulletX, bulletY) {
        let disx = this.x - bulletX;
        let disy = this.y - bulletY;
        let dist = Math.sqrt(disx * disx + disy * disy);
        if (dist < 30) {
            return true;
        }
    }
    facePlayer(playerX, playerY, x = this.x, y = this.y) {
        let distY = playerY - y;
        let distX = playerX - x;
        let angle = Math.atan2(distY, distX);
        return angle;
    }

    gotoPlayer(playerX, playerY) {
        if (this.x < playerX && this.x < app.view.width) {
            this.x += 1 + this.speedRan*1.1;
        }
        if (this.x > playerX && this.x > 0) {
            this.x -= 1 + this.speedRan*1.1;
        }
        if (this.y < playerY && this.y < app.view.height) {
            this.y += 1 + this.speedRan*1.1;
        }
        if (this.y > playerY && this.y > 0) {
            this.y -= 1 + this.speedRan*1.1;
        }
    }
    
} 

class Bullet extends PIXI.Sprite {
    constructor(x, y, rotation) {
        super(app.loader.resources["images/bullet1.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.bulletSpeed = 50;
        this.rotation = rotation;
        this.isActive = true;
      //  this.rot = rotation;
    }

    move() {
        this.x += Math.cos(this.rotation) * this.bulletSpeed;
        this.y += Math.sin(this.rotation) * this.bulletSpeed;
    }
    detectHit(targetX, targetY) {
        let disx = this.x - targetX;
        let disy = this.y - targetY;
        let dist = Math.sqrt(disx * disx + disy * disy);
        if (dist < 20) {
            return true;
        }
    }
}

class Blood extends PIXI.Sprite {
    constructor(x, y, imgSrc) {
        super(app.loader.resources[imgSrc].texture);
        this.x = x + Math.random()*10;
        this.y = y + Math.random()*10;
        this.anchor.set(.5,.5);
        this.isActive = true;
    } 
}

class GunTurret extends PIXI.Sprite {
    constructor(x, y) {
        super(app.loader.resources['images/turretGun.png'].texture);
        this.x = x;
        this.y = y;
        this.anchor.set(.5, .5);
        this.ammo = 100;
        this.ammoTag = new PIXI.Text(this.ammo);
        this.tagStyle = new PIXI.TextStyle({
            fill: 'black',
            fontSize: 25,
            fontFamily: 'JetBrains Mono',
            stroke: 0xFF0000,
            strokeThickness: 1
        });
        this.ammoTag.style = this.tagStyle;
        this.ammoTag.x = this.x - 25;
        this.ammoTag.y = this.y + 50;
        gameScene.addChild(this.ammoTag);
    }
    faceTarget(targetX = this.target.x, targetY = this.target.y, x = this.x, y = this.y) {
        let distY = targetY - y;
        let distX = targetX - x;
        let angle = Math.atan2(distY, distX);
        this.rotation = angle;
    }

    updateTag(){
     //   this.ammoTag.rotation = this.rotation;
        this.ammoTag.text = this.ammo;
        if (this.ammo === 0) {
            gameScene.removeChild(this.ammoTag);
        }
    }

}
// Barricade class
class Barricade extends PIXI.Sprite {
    constructor(x, y) {
        super(app.loader.resources['images/barricade.png'].texture);
        this.x = x;
        this.y = y;
      //  this.anchor.set(.5, .5);
        this.width = 90;
        this.height = 20;
        this.health = 1000;
        this.alive = true;
    }
    // Checks if invader is overlapping and repels them.
    repelInvader(enemy, dmg) {
        if (enemy.x > this.x - 10&& enemy.x < this.x + this.width 
            && enemy.y > this.y - 10&& enemy.y < this.y + this.height)
             {
                enemy.y -= 20;
                this.health -= dmg;
             }
    }
}

class Boss extends PIXI.Sprite {
    constructor(x, y) {
        super(app.loader.resources['images/theScurged.png'].texture);
        this.x = x;
        this.y = y;
        this.anchor.set(.5,.5);
        this.speed = 2;
        this.health = 200;
        this.alive = true;
        this.target = null;
    }

    gotoTarget(target) {
        this.target = target;
        if (this.x > target.x && this.x > 0) {
            this.x -= this.speed;
        }
        if (this.x < target.x && this.x < app.view.width) {
            this.x += this.speed;
        } 
    }
    
    faceTarget(targetX = this.target.x, targetY = this.target.y, x = this.x, y = this.y) {
        let distY = targetY - y;
        let distX = targetX - x;
        let angle = Math.atan2(distY, distX);
        return angle;
    }

}

class Fireball extends PIXI.Sprite {
    constructor(x, y, rotation) {
        super(app.loader.resources["images/fireball.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.fireBall = 50;
        this.rotation = rotation;
        this.isActive = true;
    }

    move() {
        this.x += Math.cos(this.rotation) * this.fireBall;
        this.y += Math.sin(this.rotation) * this.fireBall;
    }
    detectHit(targetX, targetY, distTarg=30) {
        let disx = this.x - targetX;
        let disy = this.y - targetY;
        let dist = Math.sqrt(disx * disx + disy * disy);
        if (dist < distTarg) {
            return true;
        }
    }
}