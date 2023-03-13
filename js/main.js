"use strict";

const app = new PIXI.Application({
    width: 800,
    height: 800
});
document.body.appendChild(app.view);
// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// pre-load the images
app.loader.
    add([
      //  "images/explosions.png",
        "images/bk_player_assets/player_9mmhandgun.png",
        "images/crosshair.png",
        "images/zombie1.png",
        "images/blood2.png",
        "images/largeblood.png",
        "images/bullet1.png",
        "images/barricade.png",
        "images/theScurged.png",
        "images/turretGun.png",
        "images/fireball.png"
    ]);
//app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(setup);
app.loader.load();

// aliases
let stage;

// game variables
let mousePosX, mousePosY;
let startScene;
// sounds
let atmospheric,death, hurt, finalMusic, shot, hit, monster, monsterHurt, boss, boom, ready;
let gameScene,scoreLabel,lifeLabel,fireballSound;
let gameOverScene;
let player;
let bloodTexture = [];
let bloodFloor;
let bulletFloor;
let crosshair;
let bullets = [];
let enemies = [];
let gunTurrets = [];
let barricades = [];
let fireballs = [];
let explosions = [];
let explosionTextures;
let kills = 0;
let totalKills = 0;
let life = 10;
let levelNum = 0;
let paused = true;
let finalStage = false;
let barricadeAvailable = false;
let sentryAvailable = false;
let finalScene;
let theScurged;
let notificationText1;
let notificationText2;
let timeInterval = 0;
let numLock = 0;
let numLock2 = 0;
let bossTag;
let backgroundRender;
let gameOverText;
//let menuSound = PIXI.sound.from('sounds/zapsplat_atmospheric.mp3');

function loadSounds(){
    atmospheric = new Howl({
        src:  ['sounds/zapsplat_atmospheric.mp3']
    });
    // Found this really good track on zapsplat.com that I just had to use.
    // Credit for the track goes to Dave Miles.
    finalMusic = new Howl({
        src: ['sounds/music_dave_miles_dramatic_climax_008.mp3']
    });
    hurt = new Howl({
        src: ['sounds/damaged.mp3']
    });
    shot = new Howl({
        src: ['sounds/warfare_gunshot_exterior_001.mp3']
    });
    death = new Howl({
        src: ['sounds/death.mp3']
    });
    monsterHurt = new Howl({
        src: ['sounds/monster_death.mp3']
    });
    hit = new Howl({
        src: ['sounds/bullet_impact.mp3']
    });
    fireballSound = new Howl({
        src: ['sounds/fireball.mp3']
    });
    boom = new Howl({
        src: ['sounds/mine_explosion.mp3']
    });
    ready = new Howl({
        src: ['sounds/ready.mp3']
    });
}

function loadSpriteSheet() {
    let spriteSheet = PIXI.BaseTexture.from("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for(let i=0; i< numFrames;i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
        textures.push(frame);
    }
    return textures;
}
function setup() {
    stage = app.stage;
    backgroundRender = new PIXI.Container();
    bloodFloor = new PIXI.Container();
    bulletFloor = new PIXI.Container();
    backgroundRender.visible = false;
    bulletFloor.visible = false;
    bloodFloor.visible = false;
    stage.addChild(backgroundRender);
    stage.addChild(bloodFloor);
    stage.addChild(bulletFloor);
    // Loaded before anything else in order to play at menu screen.
   loadSounds();
	// #1 - Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);
    atmospheric.play();
 
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;

    
    stage.addChild(gameScene);
	// #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    finalScene = new PIXI.Container();
    finalScene.visible = false;
    stage.addChild(finalScene);
    stage.addChild(gameOverScene);
	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();
	// #5 - Create Player
    player = new Player(500, 200);

    explosionTextures = loadSpriteSheet();
	// #8 - Start update loop
	app.ticker.add(gameLoop);
	// #9 - Start listening for click events on the canvas
	if (finalStage) {
        finalMusic.play();
    }
	// Now our `startScene` is visible
	// Clicking the button calls startGame()
}

function loadMap() {
    for (let i = 0; i < 20; i++) {
        for (let k = 0; k < 20; k++) {
            const tile = new PIXI.Sprite.from("images/tile.png");
            tile.x = i * 40;
            tile.y = k * 40;
            backgroundRender.addChild(tile);
            }
        }
    }

    function createLabelsAndButtons() {
        let buttonStyle = new PIXI.TextStyle({
            fill: "crimson",
            fontSize: 48,
            fontFamily: 'JetBrains Mono'
        });

        let gameLabel = new PIXI.Text("The Scourged");
        gameLabel.style = new PIXI.TextStyle({
            fill: 'crimson',
            fontSize: 96,
            fontFamily: 'JetBrains Mono'
        });
        gameLabel.x = app.view.width/14;
        gameLabel.y = 200;
        startScene.addChild(gameLabel);

     
        
        let startButton = new PIXI.Text("Begin your trials...");
        startButton.style = buttonStyle;
        startButton.x = app.view.width/4;
        startButton.y = gameLabel.y + 200;
        startButton.interactive = true;
        startButton.buttonMode = true;
        startButton.on("pointerup", startGame);
        startButton.on('pointerover', e=>e.target.alpha = .7);
        startButton.on('pointerout', e=>e.currentTarget.alpha = 1.0);
        startScene.addChild(startButton);

        let textStyle = new PIXI.TextStyle({
            fill: 'crimson',
            fontSize: 25,
            fontFamily: 'JetBrains Mono',
            stroke: 0xFF0000,
            strokeThickness: 1
        });
        let description = new PIXI.Text("To move use the (wasd) keys" + "\n" +
        "To shoot click the mouse." + "\n" +
        "Kill atleast 100 zombies to summon The Scurged." + "\n" +
        "If you kill more than 5 zombies you unlock a \n barrier that you can place by pressing q." + "\n" +
        "If you kill more than 50 zombies you unlock a \n gun turret that has an ammo capacity of 100."
        );
        description.style = textStyle;
        description.x = 10;
        description.y = sceneHeight - 300;
        startScene.addChild(description);
        scoreLabel = new PIXI.Text("Kills");
        scoreLabel.style = textStyle;
        scoreLabel.x = 5;
        scoreLabel.y = 5;
        gameScene.addChild(scoreLabel);
        increaseScoreBy(0);

        lifeLabel = new PIXI.Text("Health: ");
        lifeLabel.style = textStyle;
        lifeLabel.x = 5;
        lifeLabel.y = 56;
        gameScene.addChild(lifeLabel);
        

        gameOverText = new PIXI.Text("Game Over");
        textStyle = new PIXI.TextStyle({
	    fill: 'crimson',
	    fontSize: 64,
	    fontFamily: "JetBrains Mono",
	    stroke: 0xFF0000,
	    strokeThickness: 1
        });
        let readyStyle = new PIXI.TextStyle({
            fill: 'green',
            fontSize: 24,
            fontFamily: "JetBrains Mono",
            stroke:0xFF0000,
            strokeThickness: 1
        })
        gameOverText.style = textStyle;
        gameOverText.x = 100;
        gameOverText.y = sceneHeight/2 - 160;
        gameOverScene.addChild(gameOverText);

        notificationText1 = new PIXI.Text();
        notificationText1.style = readyStyle;
        notificationText1.x = sceneWidth/2 - 200;
        notificationText1.y = 5;
        gameScene.addChild(notificationText1);

        notificationText2 = new PIXI.Text();
        notificationText2.style = readyStyle;
        notificationText2.x = sceneWidth/2 - 200;
        notificationText2.y = 50;
        gameScene.addChild(notificationText2);

        bossTag = new PIXI.Text("Boss: ");
        bossTag.style =textStyle;
        bossTag.fontSize = 24;
        bossTag.x = sceneWidth - 100;
        bossTag.y = 5;
        gameScene.addChild(bossTag);
        
// 3B - make "play again?" button
        let playAgainButton = new PIXI.Text("Play Again?");
        playAgainButton.style = buttonStyle;
        playAgainButton.x = 150;
        playAgainButton.y = sceneHeight - 100;
        playAgainButton.interactive = true;
        playAgainButton.buttonMode = true;
        playAgainButton.on("pointerup",startGame); // startGame is a function reference
        playAgainButton.on('pointerover',e=>e.target.alpha = 0.7); // concise arrow function with no brackets
        playAgainButton.on('pointerout',e=>e.currentTarget.alpha = 1.0); // ditto
        gameOverScene.addChild(playAgainButton);
    }

    function startGame() {
      backgroundRender.visible = true;
      player.health = 100;
      loadMap();
      updateLife();
      
    while(gameScene.children[4]) {
        gameScene.removeChild(gameScene.children[4])
    }
    while(bullets[0])  {
        bullets.pop(bullets[0]);
        
    }
    while(bulletFloor.children[0]) {
        bulletFloor.removeChild(bulletFloor.children[0]);
    }
    while(enemies[0]) {
        enemies.pop(enemies[0]);
    }
    while(bloodFloor[0]) {
        bloodTexture.pop(bloodTexture[0]);
        bloodFloor.removeChild(bloodFloor.children[0]);
    }
    while(gunTurrets[0]) {
        gunTurrets.pop(gunTurrets[0]);
    }
        kills = 0;
        totalKills = 0;
        barricadeAvailable = false;
        sentryAvailable = false;
        atmospheric.stop();
        startScene.visible = false;
        gameOverScene.visible = false;
        gameScene.visible = true;
        bloodFloor.visible = true;
        bulletFloor.visible = true;
        finalStage = false;
        numLock = 0;
        numLock2 = 0;
        gameScene.addChild(player);
        loadEnemies(1);
    }

    function increaseScoreBy(integer) {
        kills += integer;
        totalKills += integer;
        scoreLabel.text = `Kills: ${kills}`;
    }
    function decreaseLifeBy(integer) {
        life -= integer;
       // life = parseInt(life);
        // Draw life hearts. Got the heart text from copying pasting from google.
   /*     for (let i = 0; i < health; i++) {
            lifeLabel.text += '♥ ';
        } */
    }

    function updateLife() {
        lifeLabel.text = "Health: " + player.health;
    }
    function updateBossHealth() {
        bossTag.text = "Boss: " + theScurged.health;
    }
    function gameLoop() {
       // if (paused) return;
     
       // #1 - Calculate "delta time"
       let dt = 1/app.ticker.FPS;
       if(dt > 1/12) dt=1/12;
       timeInterval++;
    // #2 - Handle Player
    player.healthTag.visible = true;
    player.updateText();

    if (player.state = "alive") {
         mousePosX = app.renderer.plugins.interaction.mouse.global.x;
         mousePosY = app.renderer.plugins.interaction.mouse.global.y;
         player.rotation = player.rotateToMouse(mousePosX, mousePosY, player.x, player.y);

         if (timeInterval % 40 === 0 && player.health + 5 < 101) {
             player.health += 5;
             updateLife();
         }
         // Check whether bonuses are available or not. Only while alive.
         if(kills -5 >= 0) {
             barricadeAvailable = true;
             
         } else {barricadeAvailable = false}
         if(kills - 25 >= 0 ) {
             sentryAvailable = true;
         } else {sentryAvailable = false}
         if (barricadeAvailable) {
             notificationText1.text = "Barricade Ready (Press Q To Place)";
         } else if (!barricadeAvailable) {
            notificationText1.text = "";
         }
         if (sentryAvailable) {
             notificationText2.text = "Gun Turret Ready (Press E To Deploy)";
         } else if (!sentryAvailable) {
             notificationText2.text = "";
         }
    //Keyboard movement
     document.addEventListener('keydown', keyHandler);
     
     if(gameScene.visible) {
     window.addEventListener('mousedown', shootgun);
  
     // Load enemies again after killing the previous generation.
     // Make sure previous generation is dead by checking enemies.length.
     if (enemies.length === 0 && !finalStage) {
        levelNum += 1;
         loadEnemies(levelNum);
     }
     if (totalKills >= 100) {
        //gameScene.visible = false;
        finalScene.visible = true;
        if (numLock2 == 0) {
            spawnBoss();
            numLock2++;
        }

     }
    }
    // Check bullets. Active bullets move. If they touch the sides they get removed.
     for (let i of bullets) {
         if (i.isActive === true) {
        i.move(); //move bullets
         }
        if (i.x > sceneWidth || i.x < 0 ||i.y > sceneHeight ||i.y < 0) {
           // bullets.pop(i);
            bulletFloor.removeChild(i);
        }
    }
    
}
    // #3 - Handle Enemies
        for (let i = 0; i < enemies.length; i++) {
          if (enemies[i].alive) {
                enemies[i].rotation = enemies[i].facePlayer(player.x, player.y);
                enemies[i].gotoPlayer(player.x, player.y);
                if (player.detectHit(enemies[i])) {
                    player.hurt(hurt);
                    updateLife();
                    drawBlood(player.x, player.y,"images/blood2.png");
                    enemies[i].y -= 20;
                    if (player.health <= 0) {
                        for(let en of enemies) {
                            enemies.pop(en);
                        }
                        drawBlood(player.x - 40, player.y - 40,"images/largeblood.png");
                        player.dead(death);
                        gameScene.visible = false;
                        gameOverScene.visible = true;
                        for (let i = 0; i < gameScene.length; i++) {
                            gameScene.removeChild(gameScene.children[i]);
                            
                        }
                    }
                }
            }
        }
        
        // Finalstage tags.
	if (finalStage) {
        theScurged.rotation = theScurged.faceTarget(player.x, player.y);
        theScurged.gotoTarget(player);
        updateBossHealth();
        bossTag.visible = true;
    }
	
	// #4 - Get rid of too much blood textures.
    if (bloodTexture.length > 10) {
        bloodTexture.pop(bloodTexture[0]);
        bloodFloor.removeChild(bloodFloor.children[0]);

    }

	// #5 - Check for Collisions
	for (let j of enemies) {
        for (let i of bullets) {
            if(j.detectHit(i.x, i.y)) {
                j.health -= 10;
                hit.play();
                drawBlood(j.x, j.y, "images/blood2.png");
                if (j.health <= 0) {
                gameScene.removeChild(j);
                j.alive = false;
                i.isActive = false;
                increaseScoreBy(1);
                monsterHurt.play();
            }
        
                bulletFloor.removeChild(i);
                
            }
        }
        for (let b of barricades) {
            b.repelInvader(j, 20);
        }
    }
  
// Check collisions for boss fight
    if (finalStage) {
        for(let b of bullets) {
            if(b.detectHit(theScurged.x, theScurged.y)) {
                theScurged.health -= 10;
            }
        }
        if (timeInterval % 100 === 0) {
            spawnFireball();
        }
        for(let f of fireballs) {
            f.move();
            if (f.detectHit(player.x, player.y)) {
                player.hurt(death, 20);
             }
             for(let b of barricades) {
                 if (f.detectHit(b.x, b.y, 50)) {
                     b.health -= 50;
                     fireballs.pop(f);
                     bulletFloor.removeChild(f);
                 }
             }
            if (f.x > sceneWidth || f.x < 0 || f.y > sceneHeight) {
                fireballs.pop(f);
                bulletFloor.removeChild(f);
            }
        }
        if (player.health <= 0) {
            gameScene.visible = false;
            finalStage = false;
            gameOverScene.visible = true;
            gameOverText.text = "You Lose!";
        }
        // Win conditions
        if(theScurged.health <= 0) {
            gameScene.visible = false;
            finalStage = false;
            gameOverScene.visible = true;
            gameOverText.text = "You Win!";
        }  
    }
   
    // Cycle through turrets.
    // Distance formula.
    function dist(x1, y1, x2, y2) {
        let distx = x2 -x1;
        let disty = y2 - y1;
        return Math.sqrt(distx*distx, disty*disty);
    }
    // Algorithm to find the closest enemy to the turret. Sets target to enemy.
    function findClosestEnemy(thisTurret) {
        let target = enemies[0];
        for(let i = 0; i < enemies.length-1; i++) {
            if(dist(enemies[i].x, enemies[i.y, thisTurret.x, thisTurret.y]) < dist(enemies[i+1].x, enemies[i+1].y,thisTurret.x,thisTurret.y)) {
                target = enemies[i+1];
            }
        }
        return target;
    }
    // If gameScene is visible, manage the turrets.
    if(gameScene.visible) {
    for (let t of gunTurrets) {
        if (enemies.length > 0)  {
        t.faceTarget(findClosestEnemy(t).x, findClosestEnemy(t).y);
        }
        if (t.ammo > 0 ) {
            if(timeInterval % 10 === 0) {
            shot.play();
            let bullet = new Bullet(t.x, t.y, t.rotation);
            bullets.push(bullet);
            bulletFloor.addChild(bullet); 
            t.ammo -= 1;
            t.updateTag();
            } 
        } else {
            gunTurrets.pop(t);
            gameScene.removeChild(t);
        }
    }
} 
    // Cycle through barricades.
    for (let b of barricades) {
        if (b.health <= 0) {
            b.alive = false;
            barricades.pop(b);
            gameScene.removeChild(b);
        }
    }
	// #6 - Now do some clean up
    enemies = enemies.filter(e=>e.alive);
    bullets = bullets.filter(b=>b.isActive);
    barricades = barricades.filter(b=>b.alive);
	// #7 - Is game over
    // #8 - Load next level
    // Reset time interval to avoid huge numbers.
    if (timeInterval > 1500) {
        timeInterval = 0;
    } 
    }
 // Spawns bullet.
    function shootgun() {
        shot.play();
        let bullet = new Bullet(player.x, player.y, player.rotation);
        bullets.push(bullet);
        bulletFloor.addChild(bullet);
    }
// Spawns scurged fireball.
    function spawnFireball() {
        fireballSound.play();
        let ball = new Fireball(theScurged.x,theScurged.y, theScurged.rotation);
        fireballs.push(ball);
        bulletFloor.addChild(ball);
    }
    function keyHandler(key) {
        // W keycode = 87
        // A keycode = 65
        // S keycode = 83
        // D keycode = 68
        let w = 87;
        let a = 65;
        let s = 83;
        let d = 68;
        if (key.keyCode === w) {
            player.moveUp();
        }
        if (key.keyCode === a) {
            player.moveLeft();
        }
        if (key.keyCode === s) {
            player.moveDown();
        }
        if (key.keyCode === d) {
            player.moveRight();
        }
        if (barricadeAvailable && key.keyCode === 81) {
            placeBarricade();
        }
        if (sentryAvailable && key.keyCode === 69) {
            placeGunTurret();
        }
    }
    function drawBlood(x, y, src) {
        let blood = new Blood(x, y, src);
        blood.rotation = Math.random() * 360;
        bloodTexture.push(blood);
        bloodFloor.addChild(blood);
        if (bloodTexture.length > 50) {
            bloodFloor.removeChild(bloodFloor.children[0]);
        }
       
    }
    // Load enemies based on state which is the number of zombies that will be generated.
    // They start at the top of the map
    function loadEnemies(state) {
            for (let i = 0; i < state; i++) {
               let enemy = new Enemy(Math.random(0, 1) * (sceneWidth - 50) + 25, Math.random(0, 1) * 100);
                enemies.push(enemy);
                gameScene.addChild(enemy);
            }
        
    }
    // Places destructable barricade in front of player. Costs 5 kills.
    function placeBarricade() {
        let b = new Barricade(player.x - 50, player.y - 30) 
        barricades.push(b);
        gameScene.addChild(b);
        barricadeAvailable = false;
        kills -= 5;
        ready.play();
    }
    // Places gun turret in front of player. Costs 50 kills.
    function placeGunTurret() {
        let t = new GunTurret(player.x, player.y);
        gunTurrets.push(t);
        gameScene.addChild(t);
        sentryAvailable = false;
        kills -= 50;
        ready.play();
    }
    //Spawn boss
    function spawnBoss() {
        finalStage = true;
        theScurged = new Boss(sceneWidth/4, 100);
        gameScene.addChild(theScurged);
        updateBossHealth();
        if (numLock == 0) {
            finalMusic.play();
            numLock++;
        }
    }
    // Doesn't work
    function createExplosion(x, y, frameWidth, frameHeight) {
        let w2 = frameWidth/2;
        let h2 = frameHeight/2;
        let expl = new PIXI.AnimatedSprite(explosionTextures);
        expl.x = x - w2;
        expl.y = y-h2;
        expl.animationSpeed = 1/7;
        expl.loop = false;
        expl.onComplete = e =>gameScene.removeChild(expl);
        explosions.push(expl);
        gameScene.addChild(expl);
        boom.play();
    }

   