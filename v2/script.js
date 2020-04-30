$(function () {
  $('a').attr('target', '_blank');

  var $arrow = $('.arrow');
  var arrows = {
    t: $arrow.filter('.top'),
    l: $arrow.filter('.left'),
    b: $arrow.filter('.bottom'),
    r: $arrow.filter('.right'),
    l_r: $arrow.filter('.left, .right'),
    t_b: $arrow.filter('.top, .bottom'),
    fake: $arrow.filter('.fake')
  };
  $.extend(true, $arrow, arrows);
  Object.keys(arrows).forEach(function (key) {
    arrows[key].i = arrows[key].find('.icon');
    arrows[key].t = arrows[key].find('.text');
  });

  var $body = $('body');
  var width, height, arrow_size;
  var resize = function () {
    width = $body.width();
    height = $body.height();
    $body.css('height', window.innerHeight);
    arrow_size = $arrow.fake.width();
    if (move) move(orig_v + offset_v, orig_h + offset_h);
  };
  $(window).resize(resize);
  resize();

  var $page = $('.page');
  $page.home = $page.filter('.home');
  $page.t = $page.filter('.top');
  $page.l = $page.filter('.left');
  $page.b = $page.filter('.bottom');
  $page.r = $page.filter('.right');

  var $square = $('.square');

  var current_v = 0, current_h = 0;

  var move = function (v, h, anim) {
    var duration = anim ? 500 : 0;
    current_v = v;
    current_h = h;

    var l_r = {
      'top': 50 * (1 - v) + '%',
      'margin-top': -arrow_size / 2 * (1 - v) + 'px'
    };
    $arrow.l.animate($.extend({}, l_r, {
      'left': -100 * h + '%',
      'margin-left': arrow_size * h + 'px'
    }), duration);
    $arrow.r.animate($.extend({}, l_r, {
      'right': 100 * h + '%',
      'margin-right': -arrow_size * h + 'px'
    }), duration);
    $arrow.l.animateRotate(-90 * (1 - 0.5 * v) + 180 * Math.min(h, 0), duration);
    $arrow.r.animateRotate(90 * (1 - 0.5 * v) + 180 * Math.max(h, 0), duration);
    $arrow.l.t.animateRotate(180 * Math.min(v, 0), duration);
    $arrow.r.t.animateRotate(180 * Math.min(v, 0), duration);

    var t_b = {
      'left': 50 * (1 - h) + '%',
      'margin-left': -arrow_size / 2 * (1 - h) + 'px'
    };
    $arrow.t.animate($.extend({}, t_b, {
      'top': -100 * v + '%',
      'margin-top': arrow_size * v + 'px'
    }), duration);
    $arrow.b.animate($.extend({}, t_b, {
      'bottom': 100 * v + '%',
      'margin-bottom': -arrow_size * v + 'px'
    }), duration);
    $arrow.t.animateRotate(-90 * (0.5 * h) + 180 * Math.min(v, 0), duration);
    $arrow.b.animateRotate(90 * (0.5 * h) + 180 * Math.max(v, 0), duration);
    $arrow.t.t.animateRotate(180 * Math.min(v, 0), duration);
    $arrow.b.t.animateRotate(180 * Math.max(v, 0), duration);

    $page.home.animate({
      'top': -50 * v + '%',
      'left': -50 * h + '%',
      'opacity': 1 - Math.abs(v) - Math.abs(h)
    }, duration);
    $page.t.animate({
      'top': -100 * (1 + v) + '%',
      'left': -100 * h + '%',
      'margin-top': (4 / 3) * (0.25 + v) * arrow_size
    }, duration);
    $page.l.animate({
      'left': -100 * (1 + h) + '%',
      'top': -100 * v + '%',
      'margin-left': (4 / 3) * (0.25 + h) * arrow_size
    }, duration);
    $page.b.animate({
      'bottom': -100 * (1 - v) + '%',
      'left': -100 * h + '%',
      'margin-bottom': (4 / 3) * (0.25 - v) * arrow_size
    }, duration);
    $page.r.animate({
      'right': -100 * (1 - h) + '%',
      'top': -100 * v + '%',
      'margin-right': (4 / 3) * (0.25 - h) * arrow_size
    }, duration);
  };

  var orig_v = 0, orig_h = 0;
  var click = function (v, h) {
    $arrow.removeClass('back');
    if (orig_v == v && orig_h == h) v = h = 0;
    else $(this).addClass('back');
    move(v + offset_v, h + offset_h, true);
    orig_v = v;
    orig_h = h;
  };
  $arrow.t.click(function () {
    click.call(this, -1, 0);
  });
  $arrow.b.click(function () {
    click.call(this, +1, 0);
  });
  $arrow.l.click(function () {
    click.call(this, 0, -1);
  });
  $arrow.r.click(function () {
    click.call(this, 0, +1);
  });

  var distance = function (dx, dy) {
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  };

  var offset_h = 0, offset_v = 0;
  var last_offset_v = 0, last_offset_h = 0;
  var control = function (ratio_v, ratio_h) {
    offset_v = ratio_v / 50;
    offset_h = ratio_h / 50;
    $square.css({
      'transform': 'rotateX(' + ratio_v * 45 + 'deg) rotateY(' + ratio_h * 45 + 'deg)'
    });

    if (distance(height * (offset_v - last_offset_v), width * (offset_h - last_offset_h)) < 1) return;
    move(orig_v + offset_v, orig_h + offset_h);
    last_offset_v = offset_v;
    last_offset_h = offset_h;
  };

  var endSplash = function (func) {
    setTimeout(function () {
      setTimeout(function () {
        if (func) func();
        else {
          $body.mousemove(function (e) {
            var x = e.pageX;
            var y = e.pageY;
            var ratio_v = y / height - 0.5;
            var ratio_h = x / width - 0.5;
            control(-ratio_v, ratio_h);
          });
        }
      }, 1000);
      $body.removeClass('splash');
    }, 500);
  };

  if (document.documentMode || /Edge/.test(navigator.userAgent)) {
    $('.i-hate-ie').css('display', 'block');
    endSplash();
    return;
  }

  var gn = new GyroNorm();
  gn.init({
    screenAdjusted: true,
    gravityNormalized: false,
    orientationBase: GyroNorm.WORLD,
    frequency: 30
  }).then(function () {
    if (gn.isAvailable(GyroNorm.DEVICE_ORIENTATION)) {
      endSplash(function () {
        var beta_zero = null;
        var gamma_zero = null;
        var adjust = function (v, r) {
          if (v < -r) return r * 2 + v;
          if (v > r) return v - r * 2;
          return v;
        };
        gn.start(function (data) {
          if (beta_zero == null && gamma_zero == null) {
            beta_zero = data.do.beta;
            gamma_zero = data.do.gamma;
          }
          var beta = data.do.beta - beta_zero;
          var gamma = data.do.gamma - gamma_zero;
          var y = adjust(beta, 180);
          var x = adjust(gamma, 90);
          control(y / 50, -x / 50);
        });
      });
    } else {
      endSplash();
    }
  }).catch(function () {
    endSplash();
  });
});

$.fn.animateRotate = function (angle, duration) {
  if (duration == 0) this.rotate(angle);
  else this.rotate({ animateTo: angle, duration: duration });
};
