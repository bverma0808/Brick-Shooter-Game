
//************************************************
//************* SOME GLOBAL VARIABLES ************
//************************************************

var canvas;            //reference to canvas
var context;           //reference to canvasContext
var brickFactory;      //reference to BrickFactory object
var gun                //reference to Gun object
var collisionDetector  //reference to collision detector
var target             //reference to the Target
var gameLevel = 1;     //level in game
var backgroundColors = ["white","black","lightgrey"]
var brickColors = ["red","red","blue"]
var gunColors = ["black","black", "red"]
var bulletColors = ["black","green", "red"]

//this will serve as an array of background images for canvas, which we will change according to the level of game
var bgImages = [
                 "http://1.bp.blogspot.com/-nUTEBtVnKcE/T2WRZ5QZG5I/AAAAAAAAANs/bsEUeJ2I2Pg/s1600/Desert+Background.jpg",
                 "http://content.chupamobile.com/user-upload2/product-image-screenshot/Kt9JZSjh84SuZQtOptFd3xQj_3_bg3.png",
                 "http://bestgameswallpapers.com/wp-content/uploads/2014/09/game-backgrounds-oe1u6nhl.jpg"
               ]




/**
 * This will act like "Brick" class
 * One Object of this class represents one brick on the canvas
 * @param x => Starting x position of brick
 * @param y => Starting y position of brick
 * @param brickWidth
 * @param brickHeight
 * @param brickColor
 * @constructor
 */
function Brick(x, y, brickWidth, brickHeight, brickColor){
    var xPosition = x;
    var yPosition = y;
    var width = brickWidth;
    var height = brickHeight;
    var color = brickColor;
    var onCanvas = true        //This will tell whether the brick is currently present on canvas or not
    var destroyed = false

    //This function moves the brick forward, by updating the xPosition of the brick
    this.moveBrick = function(){
        xPosition += width + 2;                          //we are adding an extra 2 here, that would make the spacing between two horizontally adjacent bricks

        //check whether the brick is inside or not
        if(xPosition > canvas.width){
            //if its outside the canvas, that means its not visible anymore
            //therefore make isOnCanvas 'false', so that it can be deleted
            //from the list of on canvas bricks
            onCanvas = false;
        }
    }

    //this function will make the brick disappear when a bullet hits it
    this.destroyBrick = function () {
        context.clearRect ( xPosition, y , width, height);
    }

    //this function will clear the brick from the canvas
    this.clearBrick = function(){
        context.clearRect ( xPosition-width-2 , y , width, height);
    }

    //This function will draw the brick on canvas
    this.drawBrick = function(){
        context.fillStyle = brickColor;
        context.fillRect(xPosition, yPosition, width, height);
    }

    //To make the brick look actually moving, we need to
    //clear it from its previous position on canvas, and draw
    //it again at its new position
    this.reDrawBrick = function(){
        this.clearBrick()
        this.drawBrick()
    }

    //this function will mark the brick as out of canvas
    this.markOutOfCanvas = function(outOfCanvas){
        onCanvas = outOfCanvas;
    }


    //-----------getter functions-------------

    this.getX = function () {
        return xPosition;
    }

    this.getY = function () {
        return yPosition;
    }

    this.getWidth = function () {
        return width;
    }

    this.getHeight = function () {
        return height;
    }

    this.isOnCanvas = function(){
        return onCanvas;
    }
}


/**
 * Only one object of this class is sufficient to set up the BrickFactory
 * for the Shooter Game, This factory needs the following information about
 * the bricks which it is going to make
 * @param rows => Number of horizontal rows which will be moving in the game
 * @param width => width of a brick
 * @param height => height of a brick
 * @param color => color of the brick
 * @constructor
 */
function BrickFactory(rows, width, height, color){
    var horizontalRowCount = rows;
    var brickWidth = width;
    var brickHeight = height;
    var brickColor = color;
    var bricksRemaining = 50 + gameLevel * 50
    var activeBricks = new Array();

    //this function will create a pile of bricks on the canvas
    this.createBrickPile = function(){
        var x = 0, y = 0;
        for(var i=0; i<horizontalRowCount; i++){
            var rand = Math.floor((Math.random() * 500) + 1);
            if(rand%2==0 && bricksRemaining>0) {
                var newBrick = new Brick(x, y, brickWidth, brickHeight, color);
                activeBricks.push(newBrick);
                bricksRemaining--
            }
            y += brickHeight + 2;            //we are adding an extra 2 here, that would make the spacing between two vertically adjacent bricks
        }
    }

    //this function will move the existing brick piles forward
    this.moveBrickPile = function(){
        for(var i=0; i<activeBricks.length; i++){
            activeBricks[i].moveBrick()
        }
    }

    //this function will remove the bricks which are out of canvas
    //Its a kind of memory management
    this.removeOutOfCanvasBricks = function(){
        for(var i=0; i<activeBricks.length; i++){
            if(!activeBricks[i].isOnCanvas()){
               activeBricks.splice(i,1);
            }
        }
    }

    //this function will redraw each brick on the canvas
    this.reDrawBricks = function(){
        for(var i=0; i<activeBricks.length; i++){
           activeBricks[i].reDrawBrick();
        }
    }

    //This function produces a new brick pile on the canvas
    //by first making space on Left Hand Side by removing the
    //pile on the Right hand side, and then creating a new pile
    //on Left Hand side
    this.startFactory = function(){
        this.removeOutOfCanvasBricks()
        this.moveBrickPile()

        if(bricksRemaining>0) {
            this.createBrickPile()
        }

        this.reDrawBricks()
    }

    //----getter function--------
    this.getActiveBricks = function () {
        return activeBricks
    }

    this.getBricksRemainingCount = function(){
        return bricksRemaining
    }
}


/**
 * One object of this class represents one bullet
 * @param xStart  => X-Coord of bullet at starting position
 * @param yStart  => Y-Coord of bullet at starting position
 * @param bulletColor
 * @param bulletRadius
 * @param bulletSpeed
 * @constructor
 */
function Bullet(xStart, yStart, bulletColor, bulletRadius, bulletSpeed){
    var color = bulletColor;
    var radius = bulletRadius;
    var xPosition = xStart;
    var yPosition = yStart;
    var speed = bulletSpeed;
    var onCanvas = true             //This will tell whether the bullet is currently present on canvas or not
    var destroyed = false

    //This function will draw the bullet on canvas
    this.drawBullet = function(){
        context.fillStyle = color;
        context.beginPath();
        context.arc(xPosition,yPosition,radius,0,2*Math.PI);
        context.fill();
    }

    //This function moves the bullet forward, by updating the yPosition (of center) of the bullet
    this.moveBullet  = function(){
        yPosition -= speed
        if(yPosition<-radius){
            onCanvas = false
        }
    }

    //this function will
    this.destroyBullet = function(){
        context.clearRect ( xPosition-radius , yPosition-radius , radius*2, radius*2);
    }

    //this function will clear the bullet from the canvas
    this.clearBullet = function(){
        context.clearRect ( xPosition-radius , yPosition+speed-radius , radius*2, radius*2);
    }

    //To make the bullet look actually moving, we need to
    //clear it from its previous position on canvas, and draw
    //it again at its new position
    this.reDrawBullet = function(){
        this.clearBullet()
        this.drawBullet()
    }

    //---------------getter functions----------------
    this.isOnCanvas = function(){
        return onCanvas;
    }

    this.markOutOfCanvas = function(outOfCanvas){
        onCanvas = outOfCanvas;
    }

    this.getX = function(){
        return xPosition;
    }

    this.getY = function(){
        return yPosition;
    }

    this.getRadius = function(){
        return radius;
    }
}


/**
 * One object of this class represents one Gun on canvas
 * @param gColor  => Color of the Gun
 * @param bColor  => Color of the bullets, the gun will fire
 * @param bRadius => radius of the bullets, the gun will fire
 * @param bSpeed  => speed of the bullets, the gun will fire
 * @constructor
 */
function Gun(gColor, bColor, bRadius, bSpeed){
    var gunColor = gColor;
    var gunHeadPositionX = canvas.width/2
    var gunHeadPositionY = canvas.height-90
    var bulletColor = bColor;
    var bulletRadius = bRadius;
    var bulletSpeed = bSpeed;
    var bulletsRemaining = 100 + gameLevel * 50
    var activeBullets = new Array();

    //This function will draw the Gun on the canvas
    this.drawGun = function() {
        context.fillStyle = gunColor;
//        context.moveTo(gunHeadPositionX-20, gunHeadPositionY+70);
//        context.lineTo(gunHeadPositionX-20, gunHeadPositionY+30);
//        context.lineTo(gunHeadPositionX, gunHeadPositionY);
//        context.lineTo(gunHeadPositionX+20, gunHeadPositionY+30);
//        context.lineTo(gunHeadPositionX+20, gunHeadPositionY+70);
//        context.closePath();

        context.fillRect(gunHeadPositionX-30, gunHeadPositionY+70, 60, 20);
        context.beginPath();
        context.arc(gunHeadPositionX,gunHeadPositionY+70, 30, 0, Math.PI, true);
        context.fill();


        context.fillRect(gunHeadPositionX-7, gunHeadPositionY, 14, 42);
    }

    //this function will fire a new bullet
    //this will only be called through an event (e.g. pressing of shoot button)
    this.shoot = function(){
        if(bulletsRemaining > 0) {
            bulletsRemaining--;  //decrease bullet count
            this.displayBulletsRemaining()
            this.createBullet()
        }
    }

    this.displayBulletsRemaining = function(){
        document.getElementById("remaining-bullets").innerHTML = "BULLETS : " + bulletsRemaining
    }

    //this will create a new bullet and put it on to the canvas
    this.createBullet = function(){
        var x = gunHeadPositionX;
        var y = gunHeadPositionY - 2;
        var newBullet = new Bullet(x, y, bulletColor, bulletRadius, bulletSpeed);
        activeBullets.push(newBullet);
    }

    //it will move all the active bullets forward
    this.moveBullets = function(){
        for(var i=0; i<activeBullets.length; i++){
            activeBullets[i].moveBullet()
        }
    }

    //this function will remove the bullets which are out of canvas
    //Its a kind of memory management
    this.removeOutOfCanvasBullets = function(){
        for(var i=0; i<activeBullets.length; i++){
            if(!activeBullets[i].isOnCanvas()){
                activeBullets.splice(i,1);
            }
        }
    }

    //this function will redraw each bullet on the canvas
    this.reDrawBullets = function(){
        for(var i=0; i<activeBullets.length; i++){
            activeBullets[i].reDrawBullet();
        }
    }

    //this function will translate the active bullets on the canvas towards the bricks
    this.translateBullets = function(){
        this.removeOutOfCanvasBullets()
        this.moveBullets()
        this.reDrawBullets()
    }

    //----getter function--------
    this.getActiveBullets = function () {
        return activeBullets
    }

    this.getBulletsRemainingCount = function(){
        return bulletsRemaining
    }
}


/**
 * Collision Detector will check whether any collision has happened or not
 * if a collision has happened , then it will destroy the brick as well as the
 * bullet which are collided, and will increase the collision counter by 1
 * @constructor
 */
function CollisionDetector(){

    var collisionCount  = 0   //total number of collisions

    //This function will detect whether the first bullet on the way has collided with any
    //brick yet or not
    this.detectCollision = function(){
        var activeBullets = gun.getActiveBullets()

        //get the center coordinates and radius for the first bullet on the way to bricks
        var centerXBullet = activeBullets[0].getX();
        var centerYBullet = activeBullets[0].getY();
        var bulletRadius = activeBullets[0].getRadius();

        //iterate over the set of bricks in the canvas
        //and find to which brick the bullet is gonna collide
        var activeBricks = brickFactory.getActiveBricks();
        for(var i=0; i<activeBricks.length; i++){

            //get the x and y coordinates of the top left corner of the brick
            var x = activeBricks[i].getX()
            var y = activeBricks[i].getY()
            var width = activeBricks[i].getWidth()
            var height = activeBricks[i].getHeight()

            //check for collision
            if(centerYBullet-bulletRadius <= y+height && centerXBullet>=x && centerXBullet<=x+width){
                //collision occurs, so we will destroy the bullet as well as the brick
                activeBricks[i].markOutOfCanvas(false)
                activeBricks[i].destroyBrick()
                activeBricks.splice(i,1)

                activeBullets[0].markOutOfCanvas(false);
                activeBullets[0].destroyBullet()
                activeBullets.splice(0,1);

                collisionCount++;
                this.displayScore()
                break;
            }
        }
    }

    //---getter function ----
    this.getCollisionCount = function(){
        return collisionCount
    }

    this.displayScore = function(){
        document.getElementById("hits").innerHTML = "SCORE : " + collisionCount
    }
}


/**
 * This function specifies the total number of bricks to be destroyed by the player to
 * cross the level
 * @constructor
 */
function Target(target){
    var targetScore = target;

    //get target
    this.getTarget = function(){
        return targetScore
    }

    this.displayTarget = function(){
        document.getElementById("target").innerHTML = "TARGET : " + targetScore
    }
}



/**
 * ********************************************************
 * *************** MAIN GAME LOOP *************************
 * ********************************************************
 */
function runGameLoop(){

    //thread-1 , this will keep on moving the bricks on the canvas
    var brickProductionThread = setInterval(function () {
                                    brickFactory.startFactory()
                                }, 1200-200*gameLevel);

    //thread-2 , this will keep on moving the bullets, on firing
    var bulletFiringThread =  setInterval(function () {
                                  gun.translateBullets()
                              }, 1000/60);

    //thread-3, this will detect collision of bricks and bullets
    var collisionDetectorThread = setInterval(function(){
                                      var activeBullets = gun.getActiveBullets()
                                      if(activeBullets.length>0) {
                                          collisionDetector.detectCollision()
                                      }
                                  },10);

    //thread-4, this will check whether the target has been reached or not
    //and whether the bullets are finished before the target is reached
    //and if that happened then mark the game as over
    var gameFinisherThread = setInterval(function(){
                                 if(target.getTarget()!=0 && target.getTarget()==collisionDetector.getCollisionCount()){
                                     clearInterval(brickProductionThread);
                                     clearInterval(bulletFiringThread);
                                     clearInterval(collisionDetectorThread);
                                     clearInterval(gameFinisherThread);

                                     gameLevel++

                                     if(gameLevel==6){
                                         alert("Congratulations!! You have cleared all the Rounds of this Game");
                                         alert("START AGAIN");
                                         gameLevel=1
                                     }
                                     else{
                                         alert("Congratulations!! See you in next level");
                                     }

                                     triggerGame()
                                 }
                                 else if(gun.getActiveBullets().length==0 && gun.getBulletsRemainingCount()==0 ||
                                         brickFactory.getActiveBricks().length==0 && brickFactory.getBricksRemainingCount()==0){
                                     clearInterval(brickProductionThread);
                                     clearInterval(bulletFiringThread);
                                     clearInterval(collisionDetectorThread);
                                     clearInterval(gameFinisherThread);
                                     alert("GAME OVER !! START AGAIN");
                                     gameLevel = 1
                                     triggerGame()
                                 }
                             },10);
}


/**
 * ********************************************************
 * *************** INITIALIZATIONS ************************
 * ********************************************************
 */
function initialiseGameEngine(){

    document.getElementById("game-level").innerHTML = "LEVEL - " + gameLevel

    //initialise canvas
    canvas = document.getElementById("arenaCanvas");

    //set color theme according to level
    var index = gameLevel%3 - 1
    if(index==-1) {
        index = 2
    }

    var canvasBG = backgroundColors[index]
    canvas.style.backgroundColor = canvasBG
    canvas.style.backgroundImage = "url('" + bgImages[index] + "')"
    var brickColor = brickColors[index]
    var gunColor = gunColors[index]
    var bulletColor = bulletColors[index]


    //initialise canvas context
    context = canvas.getContext("2d");

    //set a background image in canvas
    context.strokeStyle = '#f00';
    context.lineWidth   = 6;
    context.lineJoin    = 'round';
    context.strokeRect(140,60,40,40);
    var img = document.getElementsByTagName('img')[0];
    img.src = canvas.toDataURL();


    //clear canvas
    context.clearRect(0,0,canvas.width,canvas.height);


    //set up brick factory
    //first arg  => number of brick rows
    //second arg => width of brick
    //third arg  => height of brick
    //fourth arg => color of brick
    brickFactory = new BrickFactory(3,canvas.width/26, 30, brickColor);


    //make a gun
    //first arg  => color of gun
    //second arg => color of bullets
    //third arg  => radius of bullets
    //fourth arg => speed of bullets
    gun = new Gun(gunColor, bulletColor, 7, 8)
    gun.displayBulletsRemaining()

    //initialise collision detector
    collisionDetector = new CollisionDetector()
    collisionDetector.displayScore()

    //set the target for the player
    target = new Target(gameLevel*30)
    target.displayTarget()

    //draw the gun on canvas
    gun.drawGun()
}


/**
 * ********************************************************
 * *************** MAIN STARTING FUNCTION *****************
 * ********************************************************
 */
function triggerGame(){
    initialiseGameEngine()
    runGameLoop()
}
