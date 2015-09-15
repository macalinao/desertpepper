$(function() {
  window.keydown = {};

  function keyName(event) {
    return jQuery.hotkeys.specialKeys[event.which] ||
      String.fromCharCode(event.which).toLowerCase();
  }

  $(document).bind("keydown", function(event) {
    keydown[keyName(event)] = true;
  });

  $(document).bind("keyup", function(event) {
    keydown[keyName(event)] = false;
  });

  initGame($("#theCanvas")[0]);
});

function initGame(canvas) {
  (new Game(canvas)).start();
}

function Game(canvas) {
  this.canvas = canvas;
  this.cx = canvas.getContext("2d");

  this.player = new Player(this);
  this.clouds = new Clouds(this);
  this.pepperManager = new PepperManager(this);

  var images = this.images = {};
  ['bg', 'redpepper', 'greenpepper', 'clouds', 'mexican', 'mexicanEat'].map(function(el) {
    var img = new Image();
    img.src = 'img/' + el + '.png';
    images[el] = img;
  });

  this.sounds = {
    bg: (function() {
      var aSound = document.createElement('audio');
      aSound.setAttribute('src', 'mariachi.ogg');
      aSound.load();
      return aSound;
    })()
  };

  // Some vars
  this.score = 0;
  this.reds = 0;

  var that = this;

  this.start = function() {
    var that = this;
    this.sounds.bg.play();
    setInterval(function() {
      that.tick(50);
    }, 50);
  };

  this.tick = function(delta) {
    this.update(delta);
    this.draw();
  };

  this.update = function(delta) {
    this.player.update(delta);
    this.clouds.update(delta);
    this.pepperManager.update(delta);

  };

  this.draw = function() {
    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.cx.drawImage(this.images.bg, 0, 0);

    // Draw player
    this.player.draw();
    this.clouds.draw();
    this.pepperManager.draw();

    // Draw score
    this.cx.font = "40px Arial";
    this.cx.fillStyle = "#000000";
    this.cx.fillText("Peppers: " + this.score, 20, 40);

    // Draw reds
    for (var i = 0; i < this.reds; i++) {
      this.cx.drawImage(this.images.redpepper, 750 - (i * 50), 5);
    }
  };
}

function Player(game) {
  this.game = game;
  this.x = 50;
  this.y = 450;
  this.speed = 300;
  this.reds = 0;

  this.eating = false;
  this.doneTime = 0;

  this.update = function(delta) {
    if (keydown.left || keydown.a) {
      if (this.x > 0) {
        this.x -= this.speed * (delta / 1000);
      }
    }

    if (keydown.right || keydown.d) {
      if (this.x < 725) {
        this.x += this.speed * (delta / 1000);
      }
    }

    if (this.eating && this.doneTime < Date.now()) {
      this.eating = false;
    }
  };

  this.draw = function() {
    if (this.eating) {
      this.game.cx.drawImage(this.game.images.mexicanEat, this.x, this.y);
    } else {
      this.game.cx.drawImage(this.game.images.mexican, this.x, this.y);
    }
  };

  this.isNowEating = function() {
    this.eating = true;
    this.doneTime = Date.now() + 200;
  };
}

function Clouds(game) {
  this.game = game;
  this.x = 0;
  this.y = 50;
  this.speed = 100;

  this.update = function(delta) {
    this.x -= this.speed * (delta / 1000);
    if (this.x < -800) {
      this.x = 0;
    }
  };

  this.draw = function() {
    this.game.cx.drawImage(game.images.clouds, this.x, this.y);
    this.game.cx.drawImage(game.images.clouds, this.x + 800, this.y);
  };
}

function PepperManager(game) {
  this.game = game;
  this.lastSpawn = Date.now();
  this.peppers = [];

  this.player = this.game.player;

  this.getPepperSpawnX = function() {
    return Math.random() * 751;
  };

  this.spawnPepper = function(Pepper) {
    this.peppers.push(new Pepper(this.game, this.getPepperSpawnX(), 100));
  };

  this.spawnPeppers = function() {
    var now = Date.now();
    if (now - this.lastSpawn > 1000) {
      if (Math.random() < 0.8) {
        this.spawnPepper(RedPepper);
      } else {
        this.spawnPepper(GreenPepper);
      }
      this.lastSpawn = now;
    }
  };

  this.update = function(delta) {
    this.spawnPeppers();

    for (var i = 0; i < this.peppers.length; i++) {
      var pepper = this.peppers[i];
      pepper.update(delta);

      // Check for pepper eat
      if (pepper.x > this.player.x && pepper.x < this.player.x + 50 && pepper.y > this.player.y && pepper.y < this.player.y + 150) {
        this.peppers.splice(i, 1);
        pepper.eat();
        this.player.isNowEating();
        continue;
      }

      if (pepper.y > 550) {
        this.peppers.splice(i, i);
      }
    }
  };

  this.draw = function() {
    for (var i = 0; i < this.peppers.length; i++) {
      this.peppers[i].draw();
    }
  };
}

function RedPepper(game, x, speed) {
  this.game = game;
  this.x = x;
  this.y = 0;
  this.speed = speed;

  this.update = function(delta) {
    this.y += this.speed * (delta / 1000);
  };

  this.draw = function() {
    game.cx.drawImage(game.images.redpepper, this.x, this.y);
  };

  this.eat = function() {
    this.game.reds += 1;
  };
}

function GreenPepper(game, x, speed) {
  this.game = game;
  this.x = x;
  this.y = 0;
  this.speed = speed;

  this.update = function(delta) {
    this.y += this.speed * (delta / 1000);
  };

  this.draw = function() {
    game.cx.drawImage(game.images.greenpepper, this.x, this.y);
  };

  this.eat = function() {
    this.game.score += 1;
  };
}
