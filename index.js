//http://natureofcode.com/book/chapter-6-autonomous-agents/
/**
 * CONFIG
 */
var SEPARATION_WEIGHT = 5;
var ALIGNMENT_WEIGHT = 4;
var COHESION_WEIGHT = 3;
var BOUND_WEIGHT = 1;
var NEIGHBOR_RADIUS = 40;
var ELBOW_ROOM = 15;
var MAX_SPEED = 30;
var MAX_FORCE = 3;
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
Vector.prototype.setMagnitude = function(n) {
	return this.normalize().scale(n);
}
Vector.prototype.limit = function(n) {
	if(this.magnitude() > n) return this.setMagnitude(n);
	return this;
}
Vector.prototype.distance = function(v) {
	return v.sub(this).magnitude();
}
Vector.prototype.dot = function(v) {
	return new Vector(this.x * v.x, this.y * v.y);
}
Vector.prototype.angle = function(v) {
	return Math.acos(this.dot(v) / (this.magnitude() * v.magnitude()));
}
Vector.prototype.scalarProjection = function(v) {
	return v.setMagnitude(this.dot(v));
}



/**
 * BOID
 */
function Boid(opts) {
	if(typeof opts === "undefined") opts = [];

	this.position = opts.position || new Vector;
	this.velocity = opts.velocity || new Vector;

	this.max_speed = opts.max_speed || MAX_SPEED;
	this.max_force = opts.max_force || MAX_FORCE;
}
Boid.prototype.tick = function(boids, dt) {
	dt = dt || 1;

	var neighbors = this.neighbors(boids);

	var acc = this.flock(neighbors);
	acc = acc.add(this.bound());

	acc = acc.limit(MAX_FORCE);

	this.velocity = this.velocity.add(acc).limit(MAX_SPEED);

	this.position = this.position.add(this.velocity.scale(dt));
	//this.wrap();
}
Boid.prototype.flock = function(neighbors) {
	var separation = this.separate(neighbors).scale(SEPARATION_WEIGHT);
	var alignment = this.align(neighbors).scale(ALIGNMENT_WEIGHT);
	var cohesion = this.cohere(neighbors).scale(COHESION_WEIGHT);

	return separation.add(alignment).add(cohesion);
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
			var away = this.position.sub(boid.position);
			v = v.add(away.setMagnitude(ELBOW_ROOM - d));
			count++;
		}
	}, this);

	if(count == 0) return v;

	v = v.scale(1 / count);
	v = v.setMagnitude(this.max_speed);
	return this.steer(v);
}
Boid.prototype.align = function(neighbors) {
	var v = new Vector;
	if(neighbors.length == 0) return v;

	neighbors.forEach(function(boid){
		v = v.add(boid.velocity);
	}, this);

	v = v.scale(1 / neighbors.length);
	v = v.setMagnitude(this.max_speed);

	return this.steer(v);
}
Boid.prototype.cohere = function(neighbors) {
	var v = new Vector;
	if(neighbors.length == 0) return v;

	neighbors.forEach(function(boid){
		v = v.add(boid.position);
	}, this);

	v = v.scale(1 / neighbors.length);
	return this.seek(v);
}
Boid.prototype.steer = function(desired) {
	return desired.sub(this.velocity).limit(this.max_force);
}
Boid.prototype.seek = function(target) {
	var desired = target.sub(this.position);
	desired = desired.normalize().scale(this.max_speed);

	return this.steer(desired);
}
Boid.prototype.flee = function(target) {
	var desired = this.position.sub(target);
	desired = desired.normalize().scale(this.max_speed);

	return this.steer(desired);
}
Boid.prototype.arrive = function(target) {
	var desired = target.sub(this.position);
	var d = desired.magnitude();

	var arbitrary = 50;//.
	if(d < arbitrary) {
		desired = desired.setMagnitude(d * this.max_speed / arbitrary);
	} else {
		desired = desired.setMagnitude(this.max_speed);
	}

	return this.steer(desired);
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

function Fox() {
	Boid.call(this);
	this.asdf = 'hi';
}
Fox.prototype = new Boid;
//Fox.prototype = Object.create(Boid.prototype);
function spawn_fox() {
	var fox = new Fox;
	console.log(fox);
	console.log(fox.constructor);
	return;

	var boid = new Boid;
	boids.push(boid);
	console.log(boid);
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
$("#config").append('MAX_FORCE: <input type="number" id="MAX_FORCE" value="'+MAX_FORCE+'" onchange="MAX_FORCE=this.value"><br>');
