# Full 3D renderer.

Good lord this was hard to get to work up to where I wanted to get it. This is basically a mainly vibe-coded 3D rendering engine. It is a bit of a Frankenstein monster, where I used bits and pieces from older projects I already had (like the cube asset, the backface culling and initial shaders), and some pieces from other PoC repositories that I also vibe coded together. That in combination with iterating on the project. I like how now the git history actually shows how it can be set up. This is the order in which I did it now:

- Set up the "Hello, World!" boiler plate for a new html5 canvas project.
- Set up very simple projection and wireframe output, using mat4 as a basis already
- Add a UVN based camera and have that be part of the MVP transformation
- Add backface-culling
- Add a simple flat-shader to move to solid modelling
- Add support for directional light
- Add support for point light + adding a gouraud shader
- Add support for spotlight
- Add perspective-correct textured gouraud shader
- Introduce z-buffer support
- Add object removal checks
- Handle off-screen pixel clamping in rasterizers
- Implement near-z plane clipping

Probably one of the hardest parts of any 3D engine like this is the shader. There are so many things to take into account once these shaders start to handle many things at the same time. Even a simple flat shader isn't the easiest thing in the world, but the complexity just keeps mounting the more you throw at it. By the time you get to a perspective correct gouraud-texture shader that takes into account clipping, z-buffer and that can compensate for near-z plane clipped fresh triangles, variables are just dancing around in your head.

The order in which I set up this project is still good, but I think I would have moved to take into account culling and clipping sooner if I had to do it again (I'll probably do it again). It is of great importance, and it's probably good to do it already at the level you're at rather than as an afterthought. The various clipping and culling techniques used now are:

- Mesh culling. Just throw whole meshes out when you can detect they fall outside of the view frustum
- Backface culling. No need to keep the faces that face away from the camera around (if they are single-sided at least).
- Polygon culling. When you see that a polygon falls outside of the view frustum, you can also remove it.
- Near-plane clipping.
- Raster clipping. This takes place inside the rasterizers.

The problems with using Cursor to do this are still many, but it is also great. The main problem is of course it still makes decisions that are very intrusive that are hard to follow sometimes. But also, the output is hard to trust. It outputs a lot and there can be still glaringly obvious mistakes, like instantiating a static const variable at every step in a nested inner loop, rather than hoist that outside to define only once. But it also removes stuff when you don't know it, which is very hard. It also runs into trouble all the time, but it can clean up after itself. Some steps to keep the vibe coding violence in check:

- Set a clear sub-goal and commit to the repo often. That way when you get into big trouble, you can just revert back to the last state, back up the truck, and start again on the next milestone you want to get to. I think for the near-plane clipping part I actually did this multiple times.
- Probably some sub-goals turn out to be too ambitious, so it's good to break it up into smaller steps. Do just small steps that show you that things are working and go one by one. Might also lead to having to commit incomplete steps to the repo, but at least you can retrace them later.
- Debug and diagnose. Put break points or some console.log output here and there, but also it's good to add debugging to the visual output. Things like adding a wireframe back on top, having a birds-eye or side-eye view showing, outputting some of the data on the canvas, showing the surface normals as lines, showing light sources as "sun" points on the screen. These can all help to get a grip on what's going on - especially when things start to go south.
- Benchmarking. I actually didn't really do this for the current repo, but it is probably pretty important. AI can put some disastrous decisions in there and you wouldn't know it because things still run smooth. Probably good to have at least some FPS or stopwatch showing how we're currently doing. Of course animation can already play that part, but having some numbers around and noticing when those numbers start going down might be good alarm triggers.
- Ask clarification. Even though AI sometimes still incists on mistakes it made being correct, it is good to sometimes switch and ask why it did some things it did. Strangely, it can also help to ask it to spot mistakes in the code that it wrote itself, where it can still fish out bad things.
- Something like a 3D rendering engine can be overwhelming, so also make sure to got for small PoC repositories where you just focus on one element and get that right. After that, you probably understand it better and then you can also alway Frankenstein it back in when you go for the big picture.

Things to do next:

- If you'd have a static world, it makes more sense to bake in the lighting rather than have a source recalculate it all the time at every frame. It's very time consuming and can probably be avoided. But that does demand a different kind of approach.
- The gouraud shading is still "rough" and interpolates from point A to B, but it might be better to interpolate the surface normal from A to B and then calculate the light intensity at each step to get a more smooth rendition - even though that might also mean you'd have to calculate the surface normals based on vertex corners. I can see that also potentially getting messy in combination with near-z clipping. It can get intense but might be interesting to try later.
- BSP trees. Now we don't make such discriminations, but it would be cool to incorporate BSP tree logic here.
- Build a damn 3D rendering engine without AI vibe coding.
