/**
 * RENDER
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = document.documentElement.clientWidth
canvas.height = document.documentElement.clientHeight
function render() {
	//ctx.fillStyle = 'rgba(255,241,235,0.25)'
	ctx.fillStyle = '#def'
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	boids.forEach(function(boid){
		boid.draw();
	});
}
function drawTriangle(center, radius, angle, color) {
	ctx.save();
	ctx.translate(center.x, center.y);
	ctx.rotate(angle);
	ctx.moveTo(0, -radius);
	ctx.lineTo(radius * 0.6, radius * 0.8);
	ctx.lineTo(-radius * 0.6, radius * 0.8);
	ctx.lineTo(0,-radius);
	ctx.stroke();
	ctx.fillStyle = color || '#fed';
	ctx.fill();
	ctx.restore();
}



var boids = [];
function init() {
	boids = [];
	var x_min = 50;
	var x_max = canvas.width - x_min;
	var y_min = 50;
	var y_max = canvas.height - y_min;
	for(var i = 0; i < NUM_BOIDS; i++) {
		boids.push(new Boid({
			position: new Vector(Math.random() * (x_max - x_min) + x_min, Math.random() * (y_max - y_min) + y_min),
			velocity: new Vector(Math.random() * (MAX_SPEED + MAX_SPEED) - MAX_SPEED, Math.random() * (MAX_SPEED + MAX_SPEED) - MAX_SPEED)
		}));
	}
	spawn_red();
	console.log(boids);
}
init();

function tick() {
	var now = Date.now();
	var dt = (now - lastUpdate) / 1000;
	lastUpdate = now;

	boids.forEach(function(boid){
		boid.tick(boids, dt);
	});

	render();
}

function more_boids() {
	for(var i = 0; i < 50; i++) {
		boids.push(new Boid({
			position: new Vector(i*canvas.width/50, canvas.height),
			velocity: new Vector(0, -MAX_SPEED)
		}));
	}
}
function spawn_red() {
	boids.push(new Red({
		position: new Vector(Math.random() * canvas.width, Math.random() * canvas.height),
		velocity: new Vector(Math.random() * (MAX_SPEED + MAX_SPEED) - MAX_SPEED, Math.random() * (MAX_SPEED + MAX_SPEED) - MAX_SPEED),
	}));
}

var mouse = new Vector;
function mousemove(x, y) {
	mouse.x = x;
	mouse.y = y;
}

var intervalID;
var lastUpdate;
function play() {
	lastUpdate = Date.now();
	intervalID = setInterval(tick, 1000/FPS);
}
function pause() {
	clearInterval(intervalID);
}
play();

$("#config").append('SEPARATION_WEIGHT: <input type="number" id="SEPARATION_WEIGHT" value="'+SEPARATION_WEIGHT+'" onchange="SEPARATION_WEIGHT=this.value"><br>');
$("#config").append('ALIGNMENT_WEIGHT: <input type="number" id="ALIGNMENT_WEIGHT" value="'+ALIGNMENT_WEIGHT+'" onchange="ALIGNMENT_WEIGHT=this.value"><br>');
$("#config").append('COHESION_WEIGHT: <input type="number" id="COHESION_WEIGHT" value="'+COHESION_WEIGHT+'" onchange="COHESION_WEIGHT=this.value"><br>');
$("#config").append('BOUND_WEIGHT: <input type="number" id="BOUND_WEIGHT" value="'+BOUND_WEIGHT+'" onchange="BOUND_WEIGHT=this.value"><br>');
$("#config").append('NEIGHBOR_RADIUS: <input type="number" id="NEIGHBOR_RADIUS" value="'+NEIGHBOR_RADIUS+'" onchange="NEIGHBOR_RADIUS=this.value"><br>');
$("#config").append('ELBOW_ROOM: <input type="number" id="ELBOW_ROOM" value="'+ELBOW_ROOM+'" onchange="ELBOW_ROOM=this.value"><br>');

