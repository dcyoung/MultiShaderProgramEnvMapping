var targetWidth = 1920;
var targetHeight = 1080;
var targetAspectRatio = targetWidth / targetHeight; // 16:9

var canvas = null; // JQuery Object
var canvasHolder = null; // JQuery Object
var canvasElement = null; // DOM Element
var gl = null; // WebGL Context.

var currentTimeStamp = 0.0;
var deltaTime = 0.0;
var previousTimeStamp = 0.0;

var tpotLoad = null;
var pos_x_img = null;
var pos_y_img = null;
var pos_z_img = null;
var neg_x_img = null;
var neg_y_img = null;
var neg_z_img = null;


var terrLoad = null;
var globalTerrainImage = null;
var globalTerrainTexture = null;

//View Parameters
var initialEyePt = vec3.fromValues(5,5,5);
var eyePt = vec3.fromValues(5, 5, 5);
var viewPt = vec3.fromValues(0, 0, 0);
var upVector = vec3.fromValues(0.0, 1.0, 0.0);


var quatComposite = quat.create();
var eyePt = vec3.fromValues(5, 5, 5);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var viewDirStart = vec3.fromValues(0.0,0.0,-1.0);
var upStart = vec3.fromValues(0.0,1.0,0.0);
var roll = 0;
var pitch = 0;
var yaw = 0;
var pitchMovementSensitivity = 0.003;
var rollMovementSensitivity = 0.005;
var yawMovementSensitivity = 0.005;

//---------------------------- Throttle Parameter Stuff ---------------------------------------------
var throttle = 0;
var minSpeed = 0.001;
var maxSpeed = 0.01;
var displacementVector =  vec3.create();


var teapotRotationAngle = 0;


$(document).ready(function () {
    // Set up the fullpage.js
    //  Set the scrollbar to be shown.
    $('#fullpage').fullpage({
        scrollBar: true
    });

    //  Disable Mouse Wheel Scrolling.
    $.fn.fullpage.setMouseWheelScrolling(true);
});

//  When the window loads.
$(window).load(function () {
    //  Set up the canvas to the correct dimensions
    setUpCanvas();
    initializeWebGL();
    initializeProgram();
});

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//  When the window is resized
$(window).resize(function () {
    //  Resize the canvas to the appropriate dimensions
    resizeCanvas();
    setGLViewport();
});

function setUpCanvas() {
    //  Get the DOM Elements through JQuery
    canvas = $("#canvas");
    canvasHolder = $("#canvasHolder");
    resizeCanvas();
}


function resizeCanvas() {
    //  Allow the canvas to have a maximum width and height
    var availableHeight = canvasHolder.height() * 0.95;
    var availableWidth = canvasHolder.width() * 0.95;


    //  Compute 
    var cWidth = targetWidth; //  
    var cHeight = targetHeight; //

    var scaleFactor = 1.0; //  



    if (cHeight > availableHeight) //  Check if it bound by the height
    {
        scaleFactor = availableHeight / cHeight; //  Calculate the scale, and scale down
        console.log("Scale Factor H : " + scaleFactor); //  This ensures that we are always within the height
        cWidth = cWidth * scaleFactor; //  
        cHeight = cHeight * scaleFactor; //  
    }

    if (cWidth > availableWidth) //  Check if it is then bound by the width
    {
        scaleFactor = availableWidth / cWidth; //  Calculate the scale, and scale down
        console.log("Scale Factor W : " + scaleFactor); //  This ensures that we are always within the width
        cWidth = cWidth * scaleFactor; //  
        cHeight = cHeight * scaleFactor; //  
    }

    // Now we are both within the width and the height.

    console.log("Width : " + cWidth); //
    console.log("Height : " + cHeight); //
    console.log("Aspect Ratio : " + cWidth / cHeight); //

    canvas.attr({
        width: targetWidth, //  Target Width is 1920
        height: targetHeight // Target Height is 1080
    });

    canvas.css({
        width: "" + cWidth + "px", //  CSS Width is dependent on the browser.
        height: "" + cHeight + "px" //  CSS Height is dependent on the browser.
    });

    var offsetX = (canvasHolder.width() - cWidth) / 2 + canvasHolder.position().left; //
    var offsetY = (canvasHolder.height() - cHeight) / 2 + canvasHolder.position().top; //

    canvas.offset({
        left: offsetX, //
        top: offsetY //
    });

}

//  Initialize WebGL
function initializeWebGL() {
    try {
        canvasElement = document.getElementById("canvas"); //   Get the DOM Element
        gl = canvasElement.getContext("webgl"); //  Get the GL Context
        setGLViewport(); //  Set the GL Viewport
    } catch (e) {

    }

    if (!gl) {
        alert("Could not initialize WebGL"); // If it fails for some reason.
    };
}

function setGLViewport() {
    console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); //
}

function initializeProgram() {
	//initialize the teapot program and when its resources are loaded 
	//it will call the initializeTerrainProgram from inside teapot.js
	initializeTeapotProgram();
}

function initializeTeapotProgram(){
	
	pos_x_img = new Image();
	pos_x_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/pos_x.jpg";
	neg_x_img = new Image();
	neg_x_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/neg_x.jpg";
	
	pos_y_img = new Image();
	pos_y_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/pos_y.jpg";
	neg_y_img = new Image();
	neg_y_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/neg_y.jpg";
	
	pos_z_img = new Image();
	pos_z_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/pos_z.jpg";
	neg_z_img = new Image();
	neg_z_img.src = "JS/Assets/IMAGE/Skyboxes/yokohomaSmall/neg_z.jpg";
	
	/*
	pos_x_img = new Image();
	pos_x_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/pos_x.jpg";
	neg_x_img = new Image();
	neg_x_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/neg_x.jpg";
	
	pos_y_img = new Image();
	pos_y_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/pos_y.jpg";
	neg_y_img = new Image();
	neg_y_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/neg_y.jpg";
	
	pos_z_img = new Image();
	pos_z_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/pos_z.jpg";
	neg_z_img = new Image();
	neg_z_img.src = "JS/Assets/IMAGE/Skyboxes/stpeters_cross/neg_z.jpg";
	*/
	
	/*
	pos_x_img = new Image();
	pos_x_img.src = "JS/Assets/IMAGE/randomImgs/pos_x.png";
	neg_x_img = new Image();
	neg_x_img.src = "JS/Assets/IMAGE/randomImgs/neg_x.png";
	
	pos_y_img = new Image();
	pos_y_img.src = "JS/Assets/IMAGE/randomImgs/pos_y.png";
	neg_y_img = new Image();
	neg_y_img.src = "JS/Assets/IMAGE/randomImgs/neg_y.png";
	
	pos_z_img = new Image();
	pos_z_img.src = "JS/Assets/IMAGE/randomImgs/pos_z.png";
	neg_z_img = new Image();
	neg_z_img.src = "JS/Assets/IMAGE/randomImgs/neg_z.png";
	
	
	pos_x_img = new Image();
	pos_x_img.src = "JS/Assets/IMAGE/numbers/1.jpg";
	neg_x_img = new Image();
	neg_x_img.src = "JS/Assets/IMAGE/numbers/2.jpg";
	
	pos_y_img = new Image();
	pos_y_img.src = "JS/Assets/IMAGE/numbers/3.jpg";
	neg_y_img = new Image();
	neg_y_img.src = "JS/Assets/IMAGE/numbers/4.jpg";
	
	pos_z_img = new Image();
	pos_z_img.src = "JS/Assets/IMAGE/numbers/5.jpg";
	neg_z_img = new Image();
	neg_z_img.src = "JS/Assets/IMAGE/numbers/6.jpg";
	*/
	
	// Create a new teapot program 
    tpotLoad = new teapotLoad();
    // Load all the resources before doing anything else.
    tpotLoad.loadResources();
	
}


function initializeTerrainProgram(){
	globalTerrainImage = new Image();
	globalTerrainImage.src = "JS/Assets/IMAGE/Test.jpg";
	
	//create a new terrain program
	terrLoad = new terrainLoad();
	
	//load all the resources before doing anything else
	terrLoad.loadResources();
	
	//setup some other stuff
	updateCameraOrientation();
    //Setup the controls/inputs so the user can move the camera
    addThrottleControls();
	
	//wait 3 seconds for all the resources to load, and then kick off render
	setTimeout(function(){ render(0.0); }, 3000);
}


//----------------------------------------------------------------------------------
var throttleSensitivity = 0.005;
function addThrottleControls(){
    document.body.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;
        var value = String.fromCharCode(e.keyCode);
        switch(value) {
            case "e":
                throttle = Math.min(1, throttle + throttleSensitivity);
                break;
            case "q":
            	throttle = Math.max(0, throttle - throttleSensitivity);
                break;
            default:
                break;
        }
        
    });
}

//Simply moves the plane forward along its view direction vector by a distance proportional to its speed
function updatePlane(){
	var movementInterval = minSpeed + throttle*(maxSpeed-minSpeed);
	vec3.normalize(displacementVector, viewDir);
	vec3.scale(displacementVector, displacementVector, movementInterval);
	vec3.add(eyePt, eyePt, displacementVector);
}


var rotationAngle = 1.5;//0;
var verticleMovementSensitivity = 0.1;
var rotationalMovementSensitivity = Math.PI/10; //radians
var radius = Math.sqrt(50);
var zCoord = 7;//0;
//handle mouse events
var map = [];  //map of all gets currently pressed down.
onkeydown = onkeyup = function(e){
    e = e || event; // to deal with IE
    map[e.keyCode] = e.type == 'keydown';
	//if w is pressed
	if(map[87]){
		//quat.multiply(quatComposite, quatComposite, quat.fromValues(-pitchMovementSensitivity, 0, 0, 1));  
		zCoord += verticleMovementSensitivity;
		if(zCoord > 20){zCoord = 20;}
	}
	//is s is pressed
	if(map[83]){
		//quat.multiply(quatComposite, quatComposite, quat.fromValues(pitchMovementSensitivity, 0, 0, 1));
		zCoord -= verticleMovementSensitivity;
		if(zCoord < -5){zCoord = -5;}
	}
	//if a is pressed 
	if(map[65]){
		//quat.multiply(quatComposite, quatComposite, quat.fromValues(0, 0, rollMovementSensitivity, 1)); 
		rotationAngle = rotationAngle - rollMovementSensitivity;
		if(rotationAngle < (-2*Math.PI)){
			rotationAngle = rotationAngle + 2*Math.PI;
		}
		
	}
	//if d is pressed
	if(map[68]){
		//quat.multiply(quatComposite, quatComposite, quat.fromValues(0, 0, -rollMovementSensitivity, 1));
		rotationAngle = rotationAngle + rollMovementSensitivity;
		if(rotationAngle > (2*Math.PI)){
			rotationAngle = rotationAngle - 2*Math.PI;
		}
	}
}



function updateCameraOrientation(){
	var xCoord, yCoord;
	xCoord = radius * Math.cos(rotationAngle);
	yCoord = radius * Math.sin(rotationAngle);
	eyePt = vec3.fromValues(xCoord,yCoord,zCoord);
	
	//calculate the view dir
	vec3.subtract(viewDir, viewPt, eyePt);
	//normalize the view Dir
	vec3.normalize(viewDir, viewDir);
	
	//calculate the tangent vector
	var tangentX, tangentY;
	tangentX = -radius*Math.sin(rotationAngle);
	tangentY = radius*Math.cos(rotationAngle);
	var tangent = vec3.fromValues(tangentX, tangentY, 0);
	//normalize the tangent vector
	vec3.normalize(tangent,tangent);
	
	//calculate the up vector
	vec3.cross(upVector, tangent, viewDir);//tangent, viewDir);
	vec3.normalize(upVector, upVector);
	
	//update viewDir and up vector
	/*
	quat.normalize(quatComposite, quatComposite);
	vec3.transformQuat(viewDir, viewDirStart,quatComposite);
	vec3.transformQuat(upVector, upStart, quatComposite);
	vec3.normalize(upVector, upVector);
	vec3.normalize(viewDir, viewDir);
	*/
}


// The Render Function
function render(newTimeStamp) {
	//console.log("in render");
	teapotRotationAngle += 0.005;
	teapotRotationAngle = teapotRotationAngle%(2*Math.PI);
	//var rotateMat = mat4.create();
	//mat4.identity(rotateMat);
	//mat4.rotateY(rotateMat, rotateMat, teapotRotationAngle)
	//vec3.transformMat4(eyePt, initialEyePt, rotateMat);
	
	
	updateCameraOrientation();
	//updatePlane();
	
	// We want to look down -z, so create a lookat point in that direction    
    //vec3.add(viewPt, eyePt, viewDir);
	
	
	
    currentTimeStamp = newTimeStamp * 0.001;
    deltaTime = currentTimeStamp - previousTimeStamp;

	gl.clearColor(0.1, 0.1, 0.1, 1.0); //  Set the clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //  Clear the color as well as the depth buffer
	gl.enable(gl.DEPTH_TEST);
  
    //  Call your program's render function here.
	terrLoad.begin();
	terrLoad.draw();
	tpotLoad.begin();
    tpotLoad.draw();
	window.requestAnimationFrame(render);
}