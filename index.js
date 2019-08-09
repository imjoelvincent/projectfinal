var Phaser = Phaser || {};

/*
let request = require('request');
let apiKey = '05cb6392f95fddb478b6c3602ff28e78';
let city = 'cincinnati';
let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

request(url, function (err, response, body)){
        if(err){
    console.log()
}
        }
*/

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

/*$( document ).ready(function() {
    weather();
    alert(background_image);
});*/


var game = new Phaser.Game(config);

var map;
var player;
var cursors;
var stars;
var groundLayer;//, coinLayer;
var text;
var score = 0;
var bombs;
var gameOver = false;
var starScore = 0;
var scoreText;
var music;
var background_image;

$( document ).ready(function() {
    weather();
    alert(background_image);
});


Phaser.Component.Health = function() {};


function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');

    // tiles in spritesheet 
    this.load.spritesheet('tiles', 'assets/tiles.png', {frameWidth: 70, frameHeight: 70});
    
    // simple coin image
    this.load.image('coin', 'assets/coinGold.png');
    
    //load bomb
    this.load.image('bomb', 'assets/bomb.png');
    
    //stars
    this.load.image('star', 'assets/star.png');
    
    this.load.audio('music', 'assets/music.mp3');
    
    this.load.image('rainy', 'assets/rain.jpg')
    
    // player animations
    this.load.atlas('player', 'assets/player.png', 'assets/player.json');    
    
}

function weather(){
    //var request = require('request');
    var apiKey = '05cb6392f95fddb478b6c3602ff28e78';
    //var city = 'cincinnati';
    var url = 'http://api.openweathermap.org/data/2.5/weather?zip=33563,us&appid=' + apiKey; 
    //q='+ city + '&appid=' + apiKey;

    $.ajax({
        url:url,
        mehtod:'GET',
        dataType:'json',
        async:false,
        success:function(data){
            background_image = data.weather[0].description;
        }
    });
return background_image;
}

function create() {
    // load the map 
    map = this.make.tilemap({key: 'map'});
    
/*    let backgroundMusic = this.sound.add('music');
    backgroundMusic.play();*/
    
/*    music.play({
        volume: .3,
        loop: true
    })*/
    
        // set background color, so the sky is not black    
    //this.cameras.main.setBackgroundColor('#ccccff');
    if(background_image.indexOf('rain') !== -1){
        
        //this.cameras.main.setBackgroundColor('#0000FF'); 
        this.add.image(800, 800, 'rainy');
    }
    else if(background_image.indexOf('clear') !== -1){
        this.cameras.main.setBackgroundColor('#ccccff');
    }
    
    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // coin image used as tileset
    //var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    //coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // create the player sprite    
    player = this.physics.add.sprite(200, 200, 'player');
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width, player.height-8);
    
    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, player);

/*
    coinLayer.setTileIndexCallback(17, collectCoin, this);
    // when the player overlaps with a tile with index 17, collectCoin 
    // will be called    
    this.physics.add.overlap(player, coinLayer);
*/

    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });


    cursors = this.input.keyboard.createCursorKeys();

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);



    // this text will show the score
    text = this.add.text(20, 20, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    
    scoreText = this.add.text(40, 18, 'score: 0', {
        fontSize: '24px', 
        fill: '#ffffff'
    });    

    // fix the text to the camera
    text.setScrollFactor(0);
    scoreText.setScrollFactor(0);
    
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: {x: 12, y: 0, stepX: 175}
    });
    stars.children.iterate(function (child){
        child.setBounceY(Phaser.Math.FloatBetween(0.4,0.8));
    });
    this.physics.add.collider(stars, groundLayer);
    this.physics.add.overlap(player, stars, collectStar, null, this);    
    
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, groundLayer);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    
}

function update(time, delta) {
    if (cursors.left.isDown)
    {
        player.body.setVelocityX(-200);
        player.anims.play('walk', true); // walk left
        player.flipX = true; // flip the sprite to the left
    }
    else if (cursors.right.isDown)
    {
        player.body.setVelocityX(200);
        player.anims.play('walk', true);
        player.flipX = false; // use the original sprite looking to the right
    } else {
        player.body.setVelocityX(0);
        player.anims.play('idle', true);
    }
    // jump 
    if (cursors.up.isDown && player.body.onFloor())
    {
        player.body.setVelocityY(-500);        
    }
}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    score++; // add 10 points to the score
    text.setText(score); // set the text to show the current score
    return false;
}

function collectStar (player, star){
    
    //tommorow set it up so there is one star! when the star is picked up... the bomb will arrive ... hopefully?
    star.disableBody(true, true);
    
    score += 10;
    scoreText.setText('Score: ' + score);
    
    if (stars.countActive(true) === 0){
        stars.children.iterate(function (child){
            child.enableBody(true, child.x, 0, true, true);
        });
        
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
    
}

function hitBomb(player, bomb){
    
    this.physics.pause();
    player.setTint(0xff0000);
    gameOver = true;
}
