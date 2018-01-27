//SOCKET
const socket = io();

//THREE
let width = window.innerWidth;
let height = window.innerHeight;

const render = new THREE.WebGLRenderer();
render.shadowMap.enabled = true;
render.shadowMap.type = THREE.PCFSoftShadowMap;
render.setSize(width, height);
document.getElementById('render').appendChild(render.domElement);

const scene_game = new THREE.Scene();
const scene_game_camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);

scene_game_camera.position.set(12, 12, 40);

const composer = new THREE.EffectComposer( render );
composer.addPass( new THREE.RenderPass( scene_game, scene_game_camera ) );

let fxaa = new THREE.ShaderPass(THREE.FXAAShader);
fxaa.uniforms.resolution.value.x = 1/width;
fxaa.uniforms.resolution.value.y = 1/height;
fxaa.renderToScreen = true;
composer.addPass(fxaa);

function onWindowResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    scene_game_camera.aspect = width / height;
    scene_game_camera.updateProjectionMatrix();
    render.setSize(width, height);
    composer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize, false );

let world;
socket.on('world_init', function(worldScrape){
    world = new World.create(worldScrape);
    scene_game.add(world.floor.obj3D);
    let obj3Ds = world.getObj3Ds();
    for (let i = 0; i < obj3Ds.length; i++) {
        scene_game.add(obj3Ds[i]);
    }
});

socket.on('update', function(changed){
    for (let i = 0; i < changed.length; i++) {
        if (world.children.hasOwnProperty(changed[i].id)) {
            if (world.children[changed[i].id].update !== undefined) {
                world.children[changed[i].id].update(changed[i].x, changed[i].y);
            }
        }
    }

});

//Basic controls
keys = [];
document.addEventListener("keydown", function (event) {
    let index = keys.indexOf(event.code);
    if (index < 0) {
        console.log('down', event.code);
        keys.push(event.code);
    }
});
document.addEventListener("keyup", function (event) {
    let index = keys.indexOf(event.code);
    if (index > -1) {
        console.log('up', event.code);
        keys.splice(index, 1);
    }
});

let speed = 0.1;
const clock = new THREE.Clock();
//Animation
function animate() {
    requestAnimationFrame( animate );
    let dir = [0, 0];
    for (let i = 0; i < keys.length; i++) {
        switch (keys[i]) {
            case 'KeyW': dir[1] = dir[1]+1; break;
            case 'KeyS': dir[1] = dir[1]-1; break;
            case 'KeyA': dir[0] = dir[0]-1; break;
            case 'KeyD': dir[0] = dir[0]+1; break;
        }
    }
    //console.log(dir);
    //console.log(control);
    scene_game_camera.position.x = scene_game_camera.position.x + speed * dir[0];
    scene_game_camera.position.y = scene_game_camera.position.y + speed * dir[1];

    for (let ent in world.children) {
        if (world.children.hasOwnProperty(ent)) {
            if (world.children[ent].animate !== undefined) {
                world.children[ent].animate(clock.getDelta());
            }
        }
    }

    //render.render( scene_game, scene_game_camera );
    composer.render();
}
animate();