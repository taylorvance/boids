/**
 * CONFIG
 */
var SEPARATION_WEIGHT = 2;
var ALIGNMENT_WEIGHT = 5;
var COHESION_WEIGHT = 4;
var BOUND_WEIGHT = 5;
var NEIGHBOR_RADIUS = 40;
var ELBOW_ROOM = 15;
var MAX_SPEED = 30;
var MAX_ACCELERATION = 3;
var FPS = 30;
var NUM_BOIDS = 100;



/**
 * VECTOR
 */
function Vector(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}
Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
}
Vector.prototype.sub = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
}
Vector.prototype.scale = function(n) {
	return new Vector(this.x * n, this.y * n);
}
Vector.prototype.magnitude = function() {
	return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
}
Vector.prototype.normalize = function() {
	return this.scale(1 / this.magnitude());
}
Vector.prototype.limit = function(n) {
	if(this.magnitude() > n) return this.normalize().scale(n);
	return this;
}
Vector.prototype.distance = function(v) {
	return v.sub(this).magnitude();
}



/**
 * BOID
 */
function Boid(opts) {
	this.position = opts.position || new Vector;
	this.velocity = opts.velocity || new Vector;
}
Boid.prototype.tick = function(boids, dt) {
	dt = dt || 1;

	var neighbors = this.neighbors(boids);

	var acc = this.flock(neighbors);
	acc = acc.add(this.bound());
	//this.jitter();
	//this.wrap();

	acc = acc.limit(MAX_ACCELERATION);

	this.velocity = this.velocity.add(acc).limit(MAX_SPEED);

	this.position = this.position.add(this.velocity.scale(dt));
}
Boid.prototype.flock = function(neighbors) {
	var separation = this.separate(neighbors);
	var alignment = this.align(neighbors);
	var cohesion = this.cohere(neighbors);

	return separation.add(alignment).add(cohesion);

	var acceleration = separation.add(alignment).add(cohesion);
	acceleration = acceleration.limit(MAX_ACCELERATION);

	this.velocity = this.velocity.add(acceleration).limit(MAX_SPEED);
}
Boid.prototype.neighbors = function(boids) {
	var neighbors = [];

	boids.forEach(function(boid){
		if(boid == this) return;
		// Is it within the circle's outer square?
		if(boid.position.x > this.position.x - NEIGHBOR_RADIUS &&
			boid.position.x < this.position.x + NEIGHBOR_RADIUS &&
			boid.position.y > this.position.y - NEIGHBOR_RADIUS &&
			boid.position.y < this.position.y + NEIGHBOR_RADIUS)
		{
			// If it's close-ish, check the actual distance.
			if(boid.position.distance(this.position) < NEIGHBOR_RADIUS) {
				neighbors.push(boid);
			}
		}
	}, this);

	return neighbors;
}
/**
 * RULES
 */
Boid.prototype.separate = function(neighbors) {
	var v = new Vector;
	var count = 0;

	neighbors.forEach(function(boid){
		var d = this.position.distance(boid.position);
		if(d < ELBOW_ROOM) {
			v = v.add(this.position.sub(boid.position).scale(Math.pow(ELBOW_ROOM - d, 2)));
			count++;
		}
	}, this);

	//if(count > 0) v = v.scale(1 / count);

	return v.scale(SEPARATION_WEIGHT);
}
Boid.prototype.align = function(neighbors) {
	var v = new Vector;

	neighbors.forEach(function(boid){
		v = v.add(boid.velocity);
	}, this);

	if(neighbors.length > 0) v = v.scale(1 / neighbors.length);

	return v.scale(ALIGNMENT_WEIGHT);
}
Boid.prototype.cohere = function(neighbors) {
	var v = new Vector;

	neighbors.forEach(function(boid){
		v = v.add(boid.position.sub(this.position));
	}, this);

	if(neighbors.length > 0) v = v.scale(1 / neighbors.length);

	return v.scale(COHESION_WEIGHT);

	return v.sub(this.position).scale(1 / 100);
}
Boid.prototype.bound = function() {
	var x_min = 50;
	var x_max = canvas.width - x_min;
	var y_min = 50;
	var y_max = canvas.height - y_min;
	var v = new Vector;

	if(this.position.x < x_min) v.x = x_min - this.position.x;
	else if(this.position.x > x_max) v.x = x_max - this.position.x;

	if(this.position.y < y_min) v.y = y_min - this.position.y;
	else if(this.position.y > y_max) v.y = y_max - this.position.y;

	return v.scale(BOUND_WEIGHT);

	this.velocity = this.velocity.add(v.scale(BOUND_WEIGHT)).limit(MAX_SPEED);
}
Boid.prototype.jitter = function() {
	var v = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
	this.velocity = this.velocity.add(v.scale(5)).limit(MAX_SPEED);
}
Boid.prototype.wrap = function() {
	if(this.position.x < 0) this.position.x = canvas.width;
	else if(this.position.x > canvas.width) this.position.x = 0;
	if(this.position.y < 0) this.position.y = canvas.height;
	else if(this.position.y > canvas.height) this.position.y = 0;
}



/**
 * FLOCK
 */
function Flock(opts) {
}
Flock.prototype.something = function() {
	console.log('hi');
}



/**
 * RENDER
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 400
canvas.height = 400
function render() {
	ctx.fillStyle = 'rgba(255,241,235,0.25)' // '#FFF1EB'
	//ctx.fillStyle = '#FFF1EB'
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	boids.forEach(function(boid){
		ctx.fillStyle = '#543D5E'
		ctx.fillRect(boid.position.x, boid.position.y, 2, 2)
	});
}



/**
 * TEST
 */
var boids = [];
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
console.log(boids);

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

var lastUpdate = Date.now();
setInterval(tick, 1000/FPS);

$("#config").append('SEPARATION_WEIGHT: <input type="number" id="SEPARATION_WEIGHT" value="'+SEPARATION_WEIGHT+'" onchange="SEPARATION_WEIGHT=this.value"><br>');
$("#config").append('ALIGNMENT_WEIGHT: <input type="number" id="ALIGNMENT_WEIGHT" value="'+ALIGNMENT_WEIGHT+'" onchange="ALIGNMENT_WEIGHT=this.value"><br>');
$("#config").append('COHESION_WEIGHT: <input type="number" id="COHESION_WEIGHT" value="'+COHESION_WEIGHT+'" onchange="COHESION_WEIGHT=this.value"><br>');
$("#config").append('BOUND_WEIGHT: <input type="number" id="BOUND_WEIGHT" value="'+BOUND_WEIGHT+'" onchange="BOUND_WEIGHT=this.value"><br>');
$("#config").append('NEIGHBOR_RADIUS: <input type="number" id="NEIGHBOR_RADIUS" value="'+NEIGHBOR_RADIUS+'" onchange="NEIGHBOR_RADIUS=this.value"><br>');
$("#config").append('ELBOW_ROOM: <input type="number" id="ELBOW_ROOM" value="'+ELBOW_ROOM+'" onchange="ELBOW_ROOM=this.value"><br>');
$("#config").append('MAX_SPEED: <input type="number" id="MAX_SPEED" value="'+MAX_SPEED+'" onchange="MAX_SPEED=this.value"><br>');
$("#config").append('MAX_ACCELERATION: <input type="number" id="MAX_ACCELERATION" value="'+MAX_ACCELERATION+'" onchange="MAX_ACCELERATION=this.value"><br>');
