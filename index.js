//http://natureofcode.com/book/chapter-6-autonomous-agents/
/**
 * CONFIG
 */
var SEPARATION_WEIGHT = 5;
var ALIGNMENT_WEIGHT = 4;
var COHESION_WEIGHT = 3;
var BOUND_WEIGHT = 1;
var SEEK_WEIGHT = 2;
var NEIGHBOR_RADIUS = 50;
var ELBOW_ROOM = 20;
var MAX_SPEED = 50;
var MAX_FORCE = 1.5;
var FPS = 30;
var NUM_BOIDS = 50;



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
	return this.x * v.x + this.y * v.y;
}
Vector.prototype.angle = function(v) {
	return Math.acos(this.dot(v) / (this.magnitude() * v.magnitude()));
}
Vector.prototype.angle2 = function(v) {
	var dot = this.dot(v);
	var det = this.x * v.y - this.y * v.x;
	return Math.atan2(dot, det);
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

	this.name = opts.name;
}
Boid.prototype.tick = function(boids, dt) {
	dt = dt || 1;

	// Calculate force.
	var acc = new Vector;
	acc = acc.add(this.flock(boids));
	//acc = acc.add(this.seek(mouse).scale(SEEK_WEIGHT));
	//acc = acc.add(this.bound().scale(BOUND_WEIGHT));

	// Add acceleration to velocity and velocity to position.
	acc = acc.limit(this.max_force);
	this.velocity = this.velocity.add(acc).limit(this.max_speed);
	this.position = this.position.add(this.velocity.scale(dt));

	this.wrap();
}
Boid.prototype.flock = function(boids) {
	var neighbors = this.neighbors(boids);

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
				// Is it in its field of vision?
				if(this.velocity.angle(boid.position.sub(this.position)) < 3 * Math.PI / 4) {
					neighbors.push(boid);
				}
			}
		}
	}, this);

	return neighbors;
}
/**
 * RULES
 */
/** Move away from boids that are too close. */
Boid.prototype.separate = function(neighbors) {
	var v = new Vector;
	var count = 0;

	neighbors.forEach(function(boid){
		var d = this.position.distance(boid.position);
		// If it's too close for comfort...
		if(d < ELBOW_ROOM) {
			// find the vector pointing away from the boid...
			var away = this.position.sub(boid.position);
			// ...and weight that vector by distance (smaller distance => greater repulsion).
			v = v.add(away.setMagnitude(1 / d));
			count++;
		}
	}, this);

	if(count == 0) return v;

	// Steer away AFAP (as fast as possible).
	return this.steer(v.setMagnitude(this.max_speed));
}
/** Find the average direction and steer in that direction. */
Boid.prototype.align = function(neighbors) {
	var v = new Vector;
	if(neighbors.length == 0) return v;

	neighbors.forEach(function(boid){
		// Add the boid's current velocity.
		v = v.add(boid.velocity);
	}, this);

	// Steer in the average direction of neighbors AFAP.
	return this.steer(v.setMagnitude(this.max_speed));
}
/** Find the center of mass and move toward it. */
Boid.prototype.cohere = function(neighbors) {
	var v = new Vector;
	if(neighbors.length == 0) return v;

	neighbors.forEach(function(boid){
		// Add the boid's current position.
		v = v.add(boid.position);
	}, this);

	// Add the boid's current position.
	v = v.scale(1 / neighbors.length);
	return this.arrive(v);
}
Boid.prototype.steer = function(desired) {
	return desired.sub(this.velocity).limit(this.max_force);
}
Boid.prototype.seek = function(target) {
	var desired = target.sub(this.position);
	return this.steer(desired.setMagnitude(this.max_speed));
}
Boid.prototype.flee = function(target) {
	var desired = this.position.sub(target);
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
	var v = new Vector;

	//.change these
	var x_min = 50;
	var x_max = canvas.width - x_min;
	var y_min = 50;
	var y_max = canvas.height - y_min;

	if(this.position.x < x_min) v.x = x_min - this.position.x;
	else if(this.position.x > x_max) v.x = x_max - this.position.x;

	if(this.position.y < y_min) v.y = y_min - this.position.y;
	else if(this.position.y > y_max) v.y = y_max - this.position.y;

	return v;
}
Boid.prototype.wrap = function() {
	if(this.position.x < 0) this.position.x = canvas.width;
	else if(this.position.x > canvas.width) this.position.x = 0;
	if(this.position.y < 0) this.position.y = canvas.height;
	else if(this.position.y > canvas.height) this.position.y = 0;
}
Boid.prototype.draw = function() {
	drawTriangle(this.position, 5, this.velocity.angle2(new Vector(1, 0)), '#543D5E');
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
 * RED
 */
function Red(opts) {
	Boid.call(this, opts);
	this.name = 'red';
}
Red.prototype = new Boid;
Red.prototype.draw = function() {
	var neighbors = this.neighbors(boids);
	neighbors.forEach(function(boid){
		ctx.beginPath();
		ctx.arc(boid.position.x, boid.position.y, 7, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'rgba(255,0,0,0.3)';
		ctx.fill();
	});
	var sep = this.separate(neighbors).scale(5 * SEPARATION_WEIGHT);
	var ali = this.align(neighbors).scale(5 * ALIGNMENT_WEIGHT);
	var coh = this.cohere(neighbors).scale(5 * COHESION_WEIGHT);
	var acc = sep.add(ali).add(coh);
	//velocity
	ctx.strokeStyle = '#bbb';
	ctx.beginPath();
	ctx.moveTo(this.position.x, this.position.y);
	ctx.lineTo(this.position.x + this.velocity.x, this.position.y + this.velocity.y);
	ctx.stroke();
	//sep
	ctx.strokeStyle = '#f00';
	ctx.beginPath();
	ctx.moveTo(this.position.x, this.position.y);
	ctx.lineTo(this.position.x + sep.x, this.position.y + sep.y);
	ctx.stroke();
	//align
	ctx.strokeStyle = '#0f0';
	ctx.beginPath();
	ctx.moveTo(this.position.x, this.position.y);
	ctx.lineTo(this.position.x + ali.x, this.position.y + ali.y);
	ctx.stroke();
	//cohere
	ctx.strokeStyle = '#00f';
	ctx.beginPath();
	ctx.moveTo(this.position.x, this.position.y);
	ctx.lineTo(this.position.x + coh.x, this.position.y + coh.y);
	ctx.stroke();
	//acceleration
	ctx.strokeStyle = '#000';
	ctx.beginPath();
	ctx.moveTo(this.position.x, this.position.y);
	ctx.lineTo(this.position.x + acc.x, this.position.y + acc.y);
	ctx.stroke();
	//boid
	drawTriangle(this.position, 9, this.velocity.angle2(new Vector(1, 0)), '#f00');
	//neighborhood
/*
	ctx.strokeStyle = '#bbb';
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, NEIGHBOR_RADIUS, 0, 2 * Math.PI, false);
	ctx.stroke();
*/
}



/**
 * RENDER
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 400
canvas.height = 400
function render() {
	//ctx.fillStyle = 'rgba(255,241,235,0.25)' // '#FFF1EB'
	ctx.fillStyle = '#FFF1EB'
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
	ctx.lineTo(radius / 2, radius / 2);
	ctx.lineTo(-radius / 2, radius / 2);
	ctx.lineTo(0,-radius);
	ctx.stroke();
	ctx.fillStyle = color || '#543D5E';
	ctx.fill();
	ctx.restore();
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
spawn_red();
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

var lastUpdate = Date.now();
setInterval(tick, 1000/FPS);

$("#config").append('SEPARATION_WEIGHT: <input type="number" id="SEPARATION_WEIGHT" value="'+SEPARATION_WEIGHT+'" onchange="SEPARATION_WEIGHT=this.value"><br>');
$("#config").append('ALIGNMENT_WEIGHT: <input type="number" id="ALIGNMENT_WEIGHT" value="'+ALIGNMENT_WEIGHT+'" onchange="ALIGNMENT_WEIGHT=this.value"><br>');
$("#config").append('COHESION_WEIGHT: <input type="number" id="COHESION_WEIGHT" value="'+COHESION_WEIGHT+'" onchange="COHESION_WEIGHT=this.value"><br>');
$("#config").append('BOUND_WEIGHT: <input type="number" id="BOUND_WEIGHT" value="'+BOUND_WEIGHT+'" onchange="BOUND_WEIGHT=this.value"><br>');
$("#config").append('NEIGHBOR_RADIUS: <input type="number" id="NEIGHBOR_RADIUS" value="'+NEIGHBOR_RADIUS+'" onchange="NEIGHBOR_RADIUS=this.value"><br>');
$("#config").append('ELBOW_ROOM: <input type="number" id="ELBOW_ROOM" value="'+ELBOW_ROOM+'" onchange="ELBOW_ROOM=this.value"><br>');
