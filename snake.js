/**
 * @file Simple snake game engine
 * @author Andrei Makarov <xdersd@gmail.com>
 */


// Conform browser animation rate
var requestAnimationFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame;


/**
  * Merge with replace for JSON object attributes
  * @param {Object} obj - object with new data
  * @return {Object} merged object
  */
Object.prototype.update = function(obj) {
    for(var k in obj) {
        this[k] = obj[k];
    }
    return this;
};


/**
 * Snake prototype
 * @constructor
 * @param {Object} settings - custom settings
 */
var Snake = function(settings) {
    this.settings = {
        "color": "#F00"
    }.update(settings);

    this.directions = {
        "up": 1,
        "down": -1,
        "right": 2,
        "left": -2
    };

    this.state = 0;
    this.direction = this.directions.right;
    this.body = [{"x": 10, "y": 10}];
};

/**
 * Snake evolving method
 * @param {function} callback - callback for updating position data
 */
Snake.prototype.evolve = function(callback) {
    // Get position of the snake head
    var position = {"x": this.body[0].x, "y": this.body[0].y};
    
    // Move head of the snake
    switch(this.direction) {
        case this.directions.up:
            position.y -= 1;
            break;
        case this.directions.down:
            position.y += 1;
            break;
        case this.directions.right:
            position.x += 1;
            break;
        case this.directions.left:
            position.x -= 1;
            break;
    }

    // Add new position of head
    this.body.unshift(position);

    // Callback with new data
    position["v"] = this;
    callback([position]);
};

/**
 * Snake moving method
 * @param {function} callback - callback for updating position data
 */
Snake.prototype.move = function(callback) {
    // Evolve snake, one block forward
    this.evolve(callback);

    // Remove the last block of snake
    var position = this.body.pop();
    position["v"] = null;
    callback([position]);
};

/**
 * Check and update direction of the snake
 * @param {number} direction - direction internal id 
 */
Snake.prototype.updateDirection = function(direction) {
    if(Math.abs(direction) != Math.abs(this.direction)) {
        this.direction = direction;
    }
}


/**
 * Food prototype
 * @constructor
 * @param {Object} settings - custom settings
 */
var Food = function(settings) {
    this.settings = {
        "color": "#0F0",
        "score": Math.ceil(Math.random() * 10)
    }.update(settings);
}


/**
 * Scene prototype
 * @constructor
 * @param {Object} settings - custom settings
 */
var Scene = function(settings) {
    this.settings = {
        "id": "scene",
        "block_size": 10,
        "stage_size": {"x": 50, "y": 50},
        "border_size": 1,
        "border_padding": 3,
        "border_color": "#000",
        "stage_color": "#FFF",
        "stage_padding": 2,
        "text_color": "#123",
        "text_padding": 7,
        "text_size": 14,
        "snake_head_color": "#F57",
        "snake_body_color": "#F59",
        "food_color": "#AF0"
    }.update(settings);

    // Scene internals
    this.canvas = document.getElementById(this.settings.id);
    this.context = this.canvas.getContext("2d");

    // Create matrix filled with nulls (for faster indexation by position)
    this.stage = [];
    for(var i = 0; i < this.settings.stage_size.x; i++) {
        this.stage[i] = [];
        for(var j = 0; j < this.settings.stage_size.y; j++) {
            this.stage[i][j] = null;
        }
    }

    // Mutable array of positions (for faster stage draw)
    this.blocks = [];

    // Snake and food
    this.snake = new Snake({"color": this.settings.snake_body_color});
    this.snake.move(this.updateStage.bind(this));
    this.produceFood();
};

/**
 * Update stage data
 * @param {Object} data - array of blocks to handle
 */
Scene.prototype.updateStage = function(data) {
    for(var idx in data) {
        var d = data[idx];

        // Snake parts: check block and change snake's state (= score of block)
        if(d.v instanceof Snake) {
            if(this.stage[d.x] === undefined || this.stage[d.x][d.y] === undefined) {
                // Wall
                this.snake.state = -1;
            } else {
                var block = this.stage[d.x][d.y];
                if(block instanceof Snake) {
                    // Snake
                    this.snake.state = -1;
                } else if(block instanceof Food) {
                    // Food
                    this.snake.state = block.settings.score;
                } else {
                    // Empty
                    this.snake.state = 0;
                }
            }
        }

        // Visible blocks
        if(this.stage[d.x] !== undefined && this.stage[d.x][d.y] !== undefined) {
            this.stage[d.x][d.y] = d.v;
            // Remove block
            for(var idx in this.blocks) {
                var b = this.blocks[idx];
                if(b.x === d.x && b.y === d.y) {
                    this.blocks.splice(idx, 1); 
                }
            }
            // Add non-empty block
            if(d.v !== null) {
                this.blocks.unshift(d);
            }
        }
    }
};

/**
 * Get random color
 * @return {string} random hex of color with limited brightness
 */
Scene.prototype.getRandomColor = function() {
    return "#" + Math.random().toString(16).slice(-6).replace("f", "5");
};

/**
 * Get random position on the stage (not strict)
 * @return {Object} position with valid coordinates within the stage
 */
Scene.prototype.getRandomPosition = function() {
    return {"x": Math.ceil(Math.random() * (this.settings.stage_size.x - 1)),
            "y": Math.ceil(Math.random() * (this.settings.stage_size.y - 1))};
};

/**
 * Create one new Food instance, change color and update stage
 */
Scene.prototype.produceOneFood = function() {
    while(1) {
        var position = this.getRandomPosition();
        if(this.stage[position.x][position.y] === null) {
            food = new Food({"color": this.settings.food_color});
            food.settings.color = ["sienna", "tomato", "tan",
                                   "silver", "salmon", "orange",
                                   "lime", "khaki", "gold"][food.settings.score];
            position["v"] = food;
            this.updateStage([position]);
            break;
        }
    }
};

/**
 * Produce many Food instances
 */
Scene.prototype.produceFood = function() {
    var packages = Math.ceil(Math.random() * 1) + 1
    for(var i = 0; i < packages; i++) {
        this.produceOneFood();
    }
    this.produceOneFood();
};

/**
 * Transform matrix coordinate to valid canvas coordinate value
 * @param {number} coordinate - matrix coordinate value
 * @return {number} canvas coordinate value
 */
Scene.prototype.getStageAxisValue = function(coordinate) {
    return coordinate * this.settings.block_size + this.settings.border_size + this.settings.border_padding;
}

/**
 * Create path for polygon within canvas context
 * @param {array} path - tuple of verteces
 */
Scene.prototype.pathPolygon = function(path) {
    var ctx = this.context;

    ctx.beginPath();
    
    var vtx = path.shift();
    ctx.moveTo(this.getStageAxisValue(vtx.x), this.getStageAxisValue(vtx.y));

    for(var idx in path) {
        vtx = path[idx];
        ctx.lineTo(this.getStageAxisValue(vtx.x), this.getStageAxisValue(vtx.y));
    }

    ctx.closePath();
}

/**
 * Draw polygon
 * @param {Object} position - center position of polygon
 * @param {array} mod - tuple of modifiers of position coordinates for verteces
 * @param {string} color - filling color
 */
Scene.prototype.drawPolygon = function(position, mod, color) {
    this.context.fillStyle = color;
    var path = [];
    for(var idx in mod) {
        path[idx] = {"x": position.x + mod[idx][0], "y": position.y + mod[idx][1]};
    }
    this.pathPolygon(path);
    this.context.fill();
};

/**
 * Draw square block
 * @param {Object} position - center position of square
 */
Scene.prototype.drawBlock = function(position) {
    this.drawPolygon(position, [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
                     position.color || this.settings.stage_color);
};

/**
 * Draw food (8-edge polygon)
 * @param {Object} position - center position of polygon
 */
Scene.prototype.drawFood = function(position) {
    var mod = [
        [-0.5, -0.25], [-0.25, -0.5], [0.25, -0.5], [0.5, -0.25],
        [0.5, 0.25], [0.25, 0.5], [-0.25, 0.5], [-0.5, 0.25]
    ];
 
    this.drawPolygon(position, mod, position.color);
}

/**
 * Draw head of the snake
 * @param {Object} position - center position of polygon
 */
Scene.prototype.drawSnakeHead = function(position) {
    var snake = position.v,
        mods = {};

    mods[snake.directions["up"]] = [[-0.5, 0], [0, -0.5], [0.5, 0], [0.5, 0.5], [-0.5, 0.5]];
    mods[snake.directions["down"]] = [[-0.5, 0], [-0.5, -0.5], [0.5, -0.5], [0.5, 0], [0, 0.5]];
    mods[snake.directions["right"]] = [[-0.5, -0.5], [0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0.5]];
    mods[snake.directions["left"]] = [[-0.5, 0], [0, -0.5], [0.5, -0.5], [0.5, 0.5], [0, 0.5]];

    this.drawPolygon(position, mods[snake.direction], this.settings.snake_head_color);
};

/**
 * Draw a message
 * @param {Object} message - position (x, y), size, color and text of message
 */
Scene.prototype.drawMessage = function(message) {
    this.context.fillStyle = message.color || this.settings.text_color;
    this.context.font = "bold " + (message.size || this.settings.text_size) + "px Arial";
    this.context.fillText(message.text, message.x + this.settings.text_padding, message.y + this.settings.text_padding);
};

/**
 * Draw the status line
 * @param {Object} data - score and game state data
 */
Scene.prototype.drawStatus = function(data) {
    var score = {
        "x": this.settings.border_size - this.settings.text_padding,
        "y": this.settings.stage_size.y * this.settings.block_size + this.settings.border_size + this.settings.text_padding,
        "size": this.settings.text_size,
        "color": this.settings.text_color,
        "text": "SCORE: " + data.score
    };
    this.drawMessage(score);

    var message = {
        "x": this.settings.stage_size.x * this.settings.block_size - this.settings.text_padding,
        "y": this.settings.stage_size.y * this.settings.block_size + this.settings.border_size + this.settings.text_padding,
        "size": this.settings.text_size,
        "color": this.settings.text_color,
        "text": ""
    };
    switch(data.state) {
        case 0:
            message.text = "Press SPACE or RETURN to start the game.";
            break;
        case 1:
            message.text = "FEED YOUR HEAD";
            message.color = this.getRandomColor();
            break;
        case 2:
            message.text = "IN ~ PAUSE ~ RELAX";
            break;
        case 3:
            message.text = "GAME OVER";
            break;
    }
    message.x -= this.context.measureText(message.text).width;
    this.drawMessage(message);
};

/**
 * Draw the stage
 */
Scene.prototype.drawStage = function() {
    // Draw stage border
    this.context.lineWidth = this.settings.border_size;
    this.context.strokeStyle = this.settings.border_color;
    this.context.strokeRect(0, 0,
                            this.settings.stage_size.x * this.settings.block_size,
                            this.settings.stage_size.y * this.settings.block_size);

    // Head detection flag
    var snake_body = false;

    // Draw all visible blocks
    for(var idx in this.blocks) {
        var position = this.blocks[idx];
        
        if(position && position.hasOwnProperty("v") && position.v !== null) {
            position.color = position.v.settings.color;
        }

        // Check if special method for drawing block needed
        if(position.v instanceof Snake && !snake_body) {
            this.drawSnakeHead(position);
            snake_body = true;
        } else if(position.v instanceof Food) {
            this.drawFood(position);
        } else {
            this.drawBlock(position);
        }
    }
};

/**
 * Clear canvas context (refresh)
 */
Scene.prototype.clear = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};


/**
 * Player prototype
 * @constructor
 * @param {Object} settings - custom settings
 */
var Player = function(settings) {
    this.settings = {
    
    }.update(settings);

    // Key-action bindings
    this.key_actions = {
        38: "up",
        40: "down",
        39: "right",
        37: "left",
        13: "start",
        32: "start"
    };

    this.score = 0;
    this.speed = 6;
};

/**
 * Get action by key code
 * @param {number} code - key code
 * @return {string} action id
 */
Player.prototype.getKeyAction = function(code) {
    if(this.key_actions.hasOwnProperty(code)) return this.key_actions[code];
};

/**
 * Get direction by action
 * @param {string} action - action id
 * @return {string} direction
 */
Player.prototype.getDirectionByAction = function(action) {
    return action;
}


/**
 * Game prototype
 * @constructor
 * @param {Object} settings - custom settings
 */
var Game = function(settings) {
    this.settings = {
        
    }.update(settings);

    /**
     * Game state:
     * 0 - welcome screen
     * 1 - in game
     * 2 - pause in game
     * 3 - game over
     */
    this.state = 0;

    this.scene = new Scene({});
    this.player = new Player({});

    this.update();

    document.addEventListener("keydown", this.onKeyDown.bind(this), false);
};

/**
 * Keyboard button pressure handler
 * @param {Event} e - event
 */
Game.prototype.onKeyDown = function(e) {
    var action = this.player.getKeyAction(e.keyCode);
    if(action == "start") {
        if(this.isStarted()) {
            this.pause();
        } else {
            this.start();
        }
    } else if(action) {
        if(this.isStarted()) {
            var direction = this.scene.snake.directions[this.player.getDirectionByAction(action)];
            this.scene.snake.updateDirection(direction);
        }
    } 
}

/**
 * Check if game is started
 * @return {boolean}
 */
Game.prototype.isStarted = function() {
    return this.state === 1;
};

/**
 * Start the game
 */
Game.prototype.start = function() {
    switch(this.state) {
        case 0:
        case 3:
            this.scene = new Scene({});
            this.player = new Player({});
            this.update();
        case 2:
            this.state = 1;
            this.loop();
            break;
        default:
            break;
    }
};

/**
 * Pause the game
 */
Game.prototype.pause = function() {
    switch(this.state) {
        case 1:
            this.state = 2;
            this.update();
            break;
        default:
            break;
    }
};

/**
 * Stop the game
 */
Game.prototype.stop = function() {
    switch(this.state) {
        case 0:
        case 1:
            this.state = 3;
            this.update();
            break;
        default:
            break;
    }
};

/**
 * Manager of the game (handles canvas updates, player score, snake position, food production)
 */
Game.prototype.update = function() {
    this.scene.clear();
    this.scene.drawStatus({"state": this.state, "score": this.player.score});

    this.scene.snake.move(this.scene.updateStage.bind(this.scene));

    switch(this.scene.snake.state) {
        case -1:
            this.stop();
            break;
        case 0:
            break;
        default:
            this.player.score += this.scene.snake.state;
            
            if(this.player.score % 5 === 0) {
                this.player.speed += this.scene.snake.state * 0.56;
            }

            this.scene.snake.evolve(this.scene.updateStage.bind(this.scene));
            this.scene.produceFood();

            break;
    }

    this.scene.drawStage();
}

/**
 * Game loop callback
 */
Game.prototype.loopCallback = function() {
    requestAnimationFrame(this.loop.bind(this));
};

/**
 * Main loop of the game
 */
Game.prototype.loop = function() {
    if(this.isStarted()) {
        this.update();
        setTimeout(this.loopCallback.bind(this), 1000/this.player.speed);
    }
};


/**
 * Initialize the engine on page load
 */
window.onload = function() {
    var game = new Game();
};

