# MultiShaderProgramEnvMapping
A raw webgl program that loads obj models, generates terrain from heightmaps using texture mapping, and reflects environment using a cubemap.

-Controls are WASD for rotating the teapot
-Teapot is loaded from a mesh stored as an obj file. It is parsed using a custom parser.
-Terrain is generated procedurally and then heights for each terrain vertex are set in the vertex shader
-Rendering uses perspective projection
-Hidden surfaces are removed
-The models are lit realistically using shading techniques in the vertex shader. Note that the light parameters are hard coded in the shader.
-The teapot reflects an environment using a cubemap. The environment is not drawn to the scene as a separate object.
-The model view setup for this branch uses cylindrical coordinates for the eyept while always looking at the center of the teapot.
The environment rotates with the eye... as if rotating the teapot in the environment. 
