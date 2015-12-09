
function terrainLoad() {
    this.RL = null; //  The Resource Loader
    this.shaderProgram = null; //  The Shader Program
}

terrainLoad.prototype.loadResources = function () {

    //  Request Resourcess
    this.RL = new ResourceLoader(this.resourcesLoaded, this);
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/terrain_vertex_shader.txt");
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/terrain_fragment_shader.txt");
    this.RL.loadRequestedResources();
};

terrainLoad.prototype.resourcesLoaded = function (terrainLoadReference) {
    // This will only run after the resouces have been loaded.
	terrainLoadReference.generateTheTerrain();
    terrainLoadReference.completeCheck();
    terrainLoadReference.begin();
};

terrainLoad.prototype.completeCheck = function () {
    //  Run a quick check
    //console.log(this.RL.RLStorage.TEXT[0]);
    //console.log(this.RL.RLStorage.TEXT[1]);
};

terrainLoad.prototype.begin = function () {
    // Begin running the app.  
    this.initShaders();
    this.initPerspectiveBuffers(this.shaderProgram);
    this.initSetupBuffers();

	this.setupTextures();
    //Once everything has been finished call render from here.
    //render(0.0);
};



terrainLoad.prototype.initShaders = function () {

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

terrainLoad.prototype.createShader = function (shaderSource, shaderType) {
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

terrainLoad.prototype.initPerspectiveBuffers = function (shaderProgram) {
    //  Create the matrix
    var cameraMatrix = mat4.create();

    // Load it with a perspective matrix.
    mat4.perspective(cameraMatrix, Math.PI / 3, 16.0 / 9.0, 0.1, 60.0);

    //  Create a view matrix
    var viewMatrix = mat4.create();
    //  An identity view matrix
    mat4.identity(viewMatrix);
	
	
    var mMatrix = mat4.create();
    //  Set the view matrix - we are 5 units away from all the axes.
    //mat4.lookAt(viewMatrix, vec3.fromValues(5, 5, 5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1.0, 0));
	 mat4.lookAt(viewMatrix, eyePt, viewPt, upVector);
	 
    //  Get the perspective matrix location
    var pMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    //  Get the view matrix location
    var vMatrixUniform = gl.getUniformLocation(shaderProgram, "viewMatrix");

    var mMatrixUniform = gl.getUniformLocation(shaderProgram, "modelMatrix");
	
	

    //  Send the perspective matrix
    gl.uniformMatrix4fv(pMatrixUniform, false, cameraMatrix);
    //  Send the view matrix
    gl.uniformMatrix4fv(vMatrixUniform, false, viewMatrix);
    //  Send the model Matrix.
    gl.uniformMatrix4fv(mMatrixUniform, false, mMatrix);

}
terrainLoad.prototype.generateTheTerrain = function(){
	this.vTerrain=[];
    this.fTerrain=[];
    this.nTerrain=[];
    this.eTerrain=[];
	this.texCoord = [];
    gridN=Math.pow(2, 4); //has to be a power of 2 for the diamond square algorithm to work
    gridMaxCoordinate = 3;
	this.numVertices =(gridN+1)*(gridN+1);
	
	this.numT = terrainFromIteration(gridN, -gridMaxCoordinate,gridMaxCoordinate,-gridMaxCoordinate,gridMaxCoordinate, this.vTerrain, this.fTerrain, this.nTerrain, this.texCoord);
}

terrainLoad.prototype.initSetupBuffers = function () {
	/*
	this.vTerrain=[];
    this.fTerrain=[];
    this.nTerrain=[];
    this.eTerrain=[];
	this.texCoord = [];
    gridN=Math.pow(2, 4); //has to be a power of 2 for the diamond square algorithm to work
    gridMaxCoordinate = 3;
	this.numVertices =(gridN+1)*(gridN+1);
	
	var numT = terrainFromIteration(gridN, -gridMaxCoordinate,gridMaxCoordinate,-gridMaxCoordinate,gridMaxCoordinate, vTerrain, fTerrain, nTerrain, texCoord);
	*/
	
	//vertex positions
	tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = this.numVertices;
    
	vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition"); //
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer); //  
    gl.enableVertexAttribArray(vertexPositionAttribute); //  
    gl.vertexAttribPointer(vertexPositionAttribute, tVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //  

	
	//texture coordinates
	terrainTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoord),
                gl.STATIC_DRAW);
	terrainTextureCoordBuffer.itemSize = 2;
	terrainTextureCoordBuffer.numItems = this.numVertices;
	
	texCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
	gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordBuffer);
	gl.enableVertexAttribArray(texCoordAttribute);
	gl.vertexAttribPointer(texCoordAttribute, terrainTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = this.numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(this.fTerrain,this.eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = this.eTerrain.length;
	
	
	this.shaderProgram.UniformColor = gl.getUniformLocation(this.shaderProgram, "UniformColor");
	gl.uniform3fv(this.shaderProgram.UniformColor, [109/255,143/255,75/255]);
	/*
	var colors = [];
	for(var i = 0; i < numVertices; i++){
		colors.push(109/255);
		colors.push(143/255);
		colors.push(75/255);
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
}

terrainLoad.prototype.setupTextures = function() {
	globalTerrainTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, globalTerrainTexture);
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
	
	
	//below was previously in "HandleTextureLoaded" function
	gl.bindTexture(gl.TEXTURE_2D, globalTerrainTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, globalTerrainImage);
	// Check if the image is a power of 2 in both dimensions.
	if (isPowerOf2(globalTerrainImage.width) && isPowerOf2(globalTerrainImage.height)) {
		// Yes, it's a power of 2. Generate mips.
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		//console.log("Loaded power of 2 texture");
	} else {
		// No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
		gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		//console.log("Loaded non-power of 2 texture");
	  }
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}



terrainLoad.prototype.drawTerrain = function(){
	//console.log("In draw");
	gl.polygonOffset(0,0);
	
	// Set the texture coordinates attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, terrainTextureCoordBuffer);
	gl.vertexAttribPointer(this.shaderProgram.texCoordAttribute, terrainTextureCoordBuffer.itemSize, 
						gl.FLOAT, false, 0, 0);
	
	//bind and specify the vertex positions buffers and attributes
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);
	
	// Specify the texture to map onto the terrain
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, globalTerrainTexture);
	gl.uniform1i(gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);
	
	
	//Draw 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
	gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

terrainLoad.prototype.drawEdges = function(){
	//gl.polygonOffset(1,1);
	gl.uniform3fv(this.shaderProgram.UniformColor,[1,1,1]);
	gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);
	
	//Draw 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
	gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);  
}

terrainLoad.prototype.draw = function () {
    //  Draw function - called from render in index.js
    //gl.clearColor(0.1, 0.1, 0.1, 1.0); //  Set the clear color
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //  Clear the color as well as the depth buffer
  
	this.drawTerrain();
	this.drawEdges();
}