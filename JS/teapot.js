function teapotLoad() {
    this.RL = null; //  The Resource Loader
    this.shaderProgram = null; //  The Shader Program]
	this.vertexPositionBuffer = null;
	this.tVertexNormalBuffer = null;
	this.tIndexTriBuffer = null;
	this.tIndexEdgeBuffer = null;
}

teapotLoad.prototype.loadResources = function () {

    //  Request Resourcess
    this.RL = new ResourceLoader(this.resourcesLoaded, this);
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/teapot_vertex_shader.txt");
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/teapot_fragment_shader.txt");
	this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/teapot.txt");
    this.RL.loadRequestedResources();
};

teapotLoad.prototype.resourcesLoaded = function (teapotLoadReference) {
    // This will only run after the resouces have been loaded.
    teapotLoadReference.completeCheck();
	teapotLoadReference.parseOBJ();
	teapotLoadReference.calculateNormals();
    //teapotLoadReference.begin();
	initializeTerrainProgram();
};

teapotLoad.prototype.completeCheck = function () {
    //  Run a quick check
    //console.log(this.RL.RLStorage.TEXT[0]);
    //console.log(this.RL.RLStorage.TEXT[1]);
	//console.log(this.RL.RLStorage.TEXT[2]);
};

teapotLoad.prototype.begin = function () {
    // Begin running the app.  
    this.initShaders();
    this.initPerspectiveBuffers(this.shaderProgram);
    this.initSetupBuffers();

    //  Once everything has been finished call render from here.
    //render(0.0);
};

teapotLoad.prototype.parseOBJ = function(){
	var OBJLines = this.RL.RLStorage.TEXT[2].split("\n");
	var numLines = OBJLines.length;

	var numFaces = 0; //num triangles
	var numVertices = 0;
	var v = [];
	var f = [];
	var n = [];
	var rMat = mat4.create();
	mat4.rotateX(rMat, rMat, Math.PI/2);
	
	
	var line = "";
	var toks = null;
	for(var lineNumber = 0; lineNumber < numLines; lineNumber++){
		line = OBJLines[lineNumber];
		if(line.length === 0 || line.charAt(0) === "#") {
			
		}		
		else{
			toks = line.split(" ");
			switch(toks[0]) {
				case "v":
					if(toks.length < 3) {
						throw new Error("parse-obj: Invalid vertex :" + line);
					}
					var tempX,tempY,tempZ;
					tempX = parseFloat(toks[1]);
					tempY = parseFloat(toks[2]);
					tempZ = parseFloat(toks[3]);
					var currentVertex = vec3.fromValues(tempX,tempY,tempZ);
					var transformedVertex = vec3.create();
					vec3.transformMat4(transformedVertex, currentVertex, rMat);
					v.push(transformedVertex[0]);
					v.push(transformedVertex[1]);
					v.push(transformedVertex[2]);
					v.push(1.0);
					/*
					//v.push([toks[1], toks[2], toks[3]]);
					v.push(parseFloat(toks[1]));
					v.push(parseFloat(toks[2]));
					v.push(parseFloat(toks[3]));
					v.push(1.0);
					*/
					//add an empty normal array for this vertex that will be calculated later
					n.pushVec3(vec3.fromValues(0,0,0));
					numVertices++;
					break;	
				case "f":
					//get rid of the weird double space after the f if it exists
					if(toks[1] == ""){
						toks = [toks[0], toks[2], toks[3], toks[4]];
					}
					var position = new Array(toks.length-1);
					for(var i=1; i<toks.length; ++i) {
						var indices = toks[i].split("/");
						position[i-1] = (indices[0]|0)-1;
					}
					//f.push(position);
					f.push(position[0]);
					f.push(position[1]);
					f.push(position[2]);
					numFaces++;
					break;
				case "vp"://Ignore any of these
					break;
				case "s": //Ignore any of these
					break;
				case "o": //Ignore any of these
					break;
				case "g": //Ignore any of these
					break;
				case "usemtl": //Ignore any of these
					break;
				case "mtllib": //Ignore any of these
					break;
				default:
					throw new Error("parse-obj: Unrecognized directive: '" + toks[0] + "'");
			}
		}
	}

	this.numberOfFaces = numFaces;
	this.numberOfVertices = numVertices;
	this.vertices = v;
	this.faces = f;
	this.normals = n;
}


//efficiently compute per-vertex normals averaged from the face normals incident upon the vertex
//assumes mesh is in an indexed representation
teapotLoad.prototype.calculateNormals = function(){
	
    //for each face in the faceArray
    for(var faceCount = 0; faceCount < this.numberOfFaces; faceCount++){
    	//next triangle (face) is made up of the following 3 vertices    	
    	var f = this.faces.getVec3(faceCount, 3);

    	//since face is a triangle, the normal can be computed by cross product of vectors 
    	//corresponding to two of the 3 sides of the triangle. 
    	//First create two vectors along the face (2 sides of the triangle)
    	var tempTriangleVert0 = this.vertices.getVec3(f[0], 4);
    	var tempTriangleVert1 = this.vertices.getVec3(f[1], 4);
    	var tempTriangleVert2 = this.vertices.getVec3(f[2], 4);
    	
    	var tempTriangleSideVec0 = vec3.create();
    	var tempTriangleSideVec1 = vec3.create();
    	vec3.subtract(tempTriangleSideVec0, tempTriangleVert1, tempTriangleVert0);
    	vec3.subtract(tempTriangleSideVec1, tempTriangleVert2, tempTriangleVert0);
    	
    	//use them to compute the cross product for the normal
    	var normalVec = vec3.create();
    	vec3.cross(normalVec, tempTriangleSideVec0, tempTriangleSideVec1);
    	
    	//sum up the additions of those normal vectors for that vertex
    	for(var i = 0; i < 3; i++){
    		var currentNormal = this.normals.getVec3(f[i],3);
    		var incrementedNormal = vec3.create();
    		vec3.add(incrementedNormal, currentNormal, normalVec);
    		this.normals.replaceVec3(f[i], incrementedNormal, 3);
    	}
    }
    //make sure the normal vectors are all unit length
    for(var n = 0; n < this.numberOfVertices; n++){
    	var normalized = vec3.create();
    	vec3.normalize(normalized, this.normals.getVec3(n, 3));
    	this.normals.replaceVec3(n, normalized, 3);
    }
}

teapotLoad.prototype.initShaders = function () {

    //  Initialize shaders - we're using that have been loaded in.
    var vertexShader = this.createShader(this.RL.RLStorage.TEXT[0], gl.VERTEX_SHADER); //  
    var fragmentShader = this.createShader(this.RL.RLStorage.TEXT[1], gl.FRAGMENT_SHADER); //  

    this.shaderProgram = gl.createProgram(); //  
    gl.attachShader(this.shaderProgram, vertexShader); //  
    gl.attachShader(this.shaderProgram, fragmentShader); //  
    gl.linkProgram(this.shaderProgram); //  

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) //  
    {
        alert("Unable to initialize the shader program."); //  
    }
	
    gl.useProgram(this.shaderProgram); //
	
};

teapotLoad.prototype.createShader = function (shaderSource, shaderType) {
    //  Create a shader, given the source and the type
    var shader = gl.createShader(shaderType); //  
    gl.shaderSource(shader, shaderSource); //  
    gl.compileShader(shader); //  

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) //  
    {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)); //
        return null; //
    }

    return shader; //
};

teapotLoad.prototype.initPerspectiveBuffers = function (shaderProgram) {
    //  Create the matrix
    var cameraMatrix = mat4.create();

    // Load it with a perspective matrix.
    mat4.perspective(cameraMatrix, Math.PI / 3, 16.0 / 9.0, 0.1, 60.0);

    //  Create a view matrix
    var viewMatrix = mat4.create();
    //  An identity view matrix
    mat4.identity(viewMatrix);	
	
	//create a model matrix
    var mMatrix = mat4.create();
	//mat4.rotateY(mMatrix, mMatrix, teapotRotationAngle);
	
    //  Set the view matrix - we are 5 units away from all the axes.
    mat4.lookAt(viewMatrix, eyePt, viewPt, upVector);
	
	//Added: Create the normal transformation matrix
	var nMatrix = mat3.create();
	mat3.fromMat4(nMatrix,viewMatrix);
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);

	
	
    //  Get the perspective matrix location
    var pMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    //  Get the view matrix location
    var vMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");

    var mMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");

	var nMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");
	

    //  Send the perspective matrix
    gl.uniformMatrix4fv(pMatrixUniform, false, cameraMatrix);
    //  Send the view matrix
    gl.uniformMatrix4fv(vMatrixUniform, false, viewMatrix);
    //  Send the model Matrix.
    gl.uniformMatrix4fv(mMatrixUniform, false, mMatrix);
	// Sent the normal matrix
	gl.uniformMatrix3fv(nMatrixUniform, false, nMatrix);

}


teapotLoad.prototype.initSetupBuffers = function () {
	
	//specify the vertex positions
    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	this.vertexPositionBuffer.itemSize = 4;
    this.vertexPositionBuffer.numItems = this.numberOfVertices;
	
	vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition"); //
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer); //  
    gl.enableVertexAttribArray(vertexPositionAttribute); //  
    gl.vertexAttribPointer(vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //  
	
	
	//console.log(this.normals);
	// Specify vertex normals 
    this.tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals),
                  gl.STATIC_DRAW);
    this.tVertexNormalBuffer.itemSize = 3;
    this.tVertexNormalBuffer.numItems = this.numberOfVertices;
	
	vertexNormalAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexNormal"); //
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tVertexNormalBuffer); //  
    gl.enableVertexAttribArray(vertexNormalAttribute); //  
    gl.vertexAttribPointer(vertexNormalAttribute, this.tVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0); //  
	
	//specify the faces for the mesh
    this.tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces),
                  gl.STATIC_DRAW);
    this.tIndexTriBuffer.itemSize = 1;
    this.tIndexTriBuffer.numItems = this.numberOfFaces*3;
	
	
	//Setup Edges
	var edges = [];
    generateLinesFromIndexedTriangles(this.faces, edges);  
    this.tIndexEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tIndexEdgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(edges),
                  gl.STATIC_DRAW);
    this.tIndexEdgeBuffer.itemSize = 1;
    this.tIndexEdgeBuffer.numItems = edges.length;
	
	
	//setup the color buffer (won't end up using if shading)
	/*
	var colors = [];
	for(var i = 0; i < this.numberOfVertices; i++){
		colors.push(245/255);
		colors.push(163/255);
		colors.push(163/255);
		colors.push(1.0);
	}

    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	vertexColorBuffer.itemSize = 4;
	vertexColorBuffer.numItems = this.numberOfVertices;

    vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor"); //  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer); //  
    gl.enableVertexAttribArray(vertexColorAttribute); //  
    gl.vertexAttribPointer(vertexColorAttribute, vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0); // 
	*/	
	
	var red = new Uint8Array([255, 0, 0, 255]);
	var green = new Uint8Array([0, 255, 0, 255]);
	var blue = new Uint8Array([0, 0, 255, 255]);
	var cyan = new Uint8Array([0, 255, 255, 255]);
	var magenta = new Uint8Array([255, 0, 255, 255]);
	var yellow = new Uint8Array([255, 255, 0, 255]); 
	
	this.cubeMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, red);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, green);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, blue);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, cyan);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, yellow);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA,
		1, 1, 0, gl.RGBA,gl.UNSIGNED_BYTE, magenta);
	gl.activeTexture( gl.TEXTURE0 );
	
	gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "texMap"),0);
	
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	
	
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pos_x_img);
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, neg_x_img);
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pos_y_img);
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, neg_y_img);
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pos_z_img);
	gl.texImage2D( gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, neg_z_img);
	
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S , gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T , gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER , gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER , gl.LINEAR);
	
	
}

teapotLoad.prototype.setupTextures = function() {
	globalTerrainTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, globalTerrainTexture);
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));

}


teapotLoad.prototype.draw = function () {
    //  Draw function - called from render in index.js
  
	//draw the teapot
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	//gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, 
    //                     gl.FLOAT, false, 0, 0); 
	
	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tVertexNormalBuffer);
	//gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.tVertexNormalBuffer.itemSize,
    //                       gl.FLOAT, false, 0, 0); 

	//bind face buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tIndexTriBuffer);
	
	gl.drawElements(gl.TRIANGLES, this.tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0); 
	
	/*
	//draw the edges 
	gl.polygonOffset(1,1);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, 
							 gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tIndexEdgeBuffer);
	gl.drawElements(gl.LINES, this.tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
	*/
}