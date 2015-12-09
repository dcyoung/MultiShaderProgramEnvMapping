function exampleLoad() {
    this.RL = null; //  The Resource Loader
    this.shaderProgram = null; //  The Shader Program
}

exampleLoad.prototype.loadResources = function () {

    //  Request Resourcess
    this.RL = new ResourceLoader(this.resourcesLoaded, this);
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/default_vertex_shader.txt");
    this.RL.addResourceRequest("TEXT", "JS/Assets/TEXT/default_fragment_shader.txt");
    this.RL.loadRequestedResources();
};

exampleLoad.prototype.resourcesLoaded = function (exampleLoadReference) {
    // This will only run after the resouces have been loaded.
    exampleLoadReference.completeCheck();
    exampleLoadReference.begin();
};


exampleLoad.prototype.completeCheck = function () {
    //  Run a quick check
    console.log(this.RL.RLStorage.TEXT[0]);
    console.log(this.RL.RLStorage.TEXT[1]);

};

exampleLoad.prototype.begin = function () {
    // Begin running the app.  
    this.initShaders();
    this.initPerspectiveBuffers(this.shaderProgram);
    this.initSetupBuffers();

    //  Once everything has been finished call render from here.
    render(0.0);
};


exampleLoad.prototype.initShaders = function () {

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

exampleLoad.prototype.createShader = function (shaderSource, shaderType) {
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

exampleLoad.prototype.initPerspectiveBuffers = function (shaderProgram) {
    //  Create the matrix
    var cameraMatrix = mat4.create();

    // Load it with a perspective matrix.
    mat4.perspective(cameraMatrix, Math.PI / 3, 16.0 / 9.0, 0.1, 60.0);

    //  Create a view matrix
    var viewMatrix = mat4.create();
    //  An identity view matrix
    mat4.identity(viewMatrix);

    var mMatrix = mat4.create();
    //  Set the view matrix - we are 20 units away from all the axes.
    mat4.lookAt(viewMatrix, vec3.fromValues(20, 20, 20), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1.0, 0));

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

exampleLoad.prototype.initSetupBuffers = function () {

    //  Set up buffers!
    var vertices = [0, 0, 0, 1.0,
                    1.0, 0, 0, 1.0,
                    0, 0, 1.0, 1.0,
                    1.0, 0, 1.0, 1.0];

    basicSquare = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, basicSquare);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


    vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "vertexPosition"); //
    gl.bindBuffer(gl.ARRAY_BUFFER, basicSquare); //  
    gl.enableVertexAttribArray(vertexPositionAttribute); //  
    gl.vertexAttribPointer(vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0); //  



    var colors = [0.0 / 255.0, 62 / 255.0, 80 / 255, 1.0,
                 0.0 / 255.0, 62 / 255.0, 80 / 255, 1.0,
                 0.0 / 255.0, 62 / 255.0, 80 / 255, 1.0,
                 0.0 / 255.0, 62 / 255.0, 80 / 255, 1.0];

    basicColors = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, basicColors);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


    vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "vertexColor"); //  
    gl.bindBuffer(gl.ARRAY_BUFFER, basicColors); //  
    gl.enableVertexAttribArray(vertexColorAttribute); //  
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0); //  

}


exampleLoad.prototype.draw = function () {
    //  Draw function - called from render in index.js
    gl.clearColor(0.1, 0.1, 0.1, 1.0); //  Set the clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //  Clear the color as well as the depth buffer
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); //  Draw
}