/*
       $#__ greeter.js __#$
  Version 1.0 © 2017 Miraculous Owonubi <omiraculous@gmail.com>
  This file is a part of The ArtanOS WebLock Project
  Do not copy or redistribute code!, except on granted permissions!
  Do not edit if not a certified Artifix Personel!
*/

var active_users = 0;
if (!('lightdm' in window)) {
  try {
    var lightdmMock = lightdmMock || {};
    window.lightdm = new lightdmMock(true, 0, false);
    if ('lightdm' in window) {
      console.log('LightDM Mock initialised', 'lightdm');
    }
  } catch (err) {
    console.error('LightDM Mock failed to initialise');
  }
} else {
  // DETECTED NATIVE
}

//LightDM callbacks
window.show_prompt = (prompt, type = 'password') => {
  $('#pass_entry').attr('placeholder', prompt.replace(':', ''));
  $('#pass_entry').val('');
  setTimeout(() => {
    $('#pass_entry').focus();
  }, 250);
  $('#pass_entry').attr('type', type);
}
window.show_message = (msg, type = 'info') => {
  opts = {}; //Pre defined options
  switch (type) {
    case 'error':
      type = 'danger';
      opts = {
        placement: {
          from: "bottom",
          align: "left"
        }
      };
      attr = {
        icon: "fa fa-exclamation-circle"
      };
      break;
    case 'warning':
      attr = {
        icon: 'fa fa-bell-o'
      }
      break;
    case 'success':
      attr = {
        icon: 'fa fa-unlock'
      }
      break;
  }
  if (typeof attr != "undefined") {
    opts = mixIn(opts, {
      type: type
    });
  } else {
    attr = type;
  }
  notify(msg, attr, opts);
}
window.authentication_complete = () => {
  if (lightdm.is_authenticated) {
    $('#submit').attr('go', true);
    show_message('Access Granted', 'success');
    setTimeout(() => {
      try {
        lightdm.start_session(data.session);
      } catch (e) {
        lightdm.login(data.selected_user, data.session);
      }
    }, 1000);
  } else {
    $('#submit').attr('go', false);
    setTimeout(() => {
      $('#submit').attr('go', '');
    }, 2000);
    show_message('Access Denied', 'error');
    authUser(data.selected_user);
  }
}

window.cancel_authentication = () => {
  prev_user = data.selected_user;
  data.selected_user = null;
  lightdm.cancel_authentication();
  return prev_user;
}

window.mock_reload = () => {
  setTimeout(() => {
    $(".option#" + data.selected_user).find('.user_locked').each(function() {
      $(this)
        .addClass('fa fa-circle')
        .css({
          'font-family': '',
          'font-size': '7pt',
          'position': 'absolute',
          'right': '12px',
          'padding-top': '18px',
          'color': '#33D900'
        });
    });
    $('#submit').attr('go', "");
    show_prompt("Password:", "password");
  }, 1000);
}

//Personal Functions
function user_clicked(event) {
  if (data.selected && event.target.getAttribute('id') == data.selected_user) {
    show_message("Already authenticating " + data.selected.display_name, 'warning');
  }
  if (lightdm.in_authentication) {
    cancel_authentication();
  }
  authUser(event.target.getAttribute('id'));
}

function respond(event) {
  lightdm.respond($('#pass_entry').val());
}

function init() {
  try {
    prepShoot();
    //Set the image
    //Init the timer
    //Set Hostname
    //Init the Sessions
    //Init the user list
    initUsers();
  } catch (exception) {
    console.error('Error:\n' + exception);
  }
}

function initUsers() {
  var $name_template = $('#username_template');
  var $name_parent = $name_template.parent();
  $name_template.remove();
  for (var i = 0; i < lightdm.users.length; i++) {
    selected_user = lightdm.users[i];
    $userNode = $name_template.clone();
    $children = $name_template.children().clone(true, true);
    dispName = selected_user.display_name;
    $userNode.html(c$.reduce(12, dispName));
    $children.each(function() {
      $userNode.append(this);
    });
    if (selected_user.logged_in) {
      ++active_users;
      $($userNode).find('.user_locked').each(function() {
        $(this)
          .addClass('fa fa-circle')
          .css({
            'font-family': '',
            'font-size': '7pt',
            'position': 'absolute',
            'right': '12px',
            'padding-top': '18px',
            'color': '#33D900'
          });
      });
    }
    // Implement the trial count
    $userNode.attr('id', selected_user.username);
    $userNode.get(0).onclick = user_clicked;
    $userNode.attr('session', (selected_user.session) ? selected_user.session : lightdm.default_session);
    $name_parent.append($userNode);
  }
  user = lightdm.users[0].username;
  authUser(user);
  $name_parent.data('selected', user);
  $('.user_selector').niceSelect('update');
}

function setUserImage(user, box) {
  if (box.attr('rpath') != user.image) {
    $('#user_image').fadeOut(250, () => {
      if (user.image) {
        box.attr('src', user.image);
        box.attr('rpath', user.image);
        box.on('error', () => {
          box.attr('src', 'src/img/avatar/default.png');
        });
      } else {
        box.attr('src', 'src/img/avatars/default.png');
      }
    }).fadeIn(250);
  }
}

function authUser(user) {
  data.selected_user = user;
  data.selected = getPack(user);
  data.session = $("#" + user).attr('session');
  setUserImage(data.selected, $('#user_image'));
  if (user) {
    lightdm.authenticate(user);
  }
}

function setTheme(theme) {
  box = window.themes[theme];
  if (box.font) {
    $("*:not(.fa)").css("font-family", box.font);
  }
  if (box.container_radius) {
    $("#login_container").css("border-radius", box.container_radius);
  }
  if (box.user_image_size) {
    $("#user_image").css("width", box.user_image_size);
    $("#user_image").css("height", box.user_image_size);
  }
  if (box.user_image_radius) {
    $("#user_image").css("border-radius", box.user_image_radius);
  }
  if (box.submit_button_text) {
    $("#submit")[0].value = box.submit_button_text;
  }
}

function getPack(username) {
  for (var i = 0; i < lightdm.users.length; i++) {
    if (lightdm.users[i].username == username) {
      return lightdm.users[i];
    }
  }
}

function prepShoot() {
  $('select, .user_selector').niceSelect();
  FastClick.attach(document.body);
  initFPB();
  initTooltip();
  $('#loading').fadeOut(100);
}

function notify(msg = '', ...args) {
  var type = 'info',
    attr = options = {};
  if (args[0] && typeof args[0] === 'string') {
    type = args[0];
  } else if (args[0] && typeof args[0] === 'object') {
    attr = args[0];
  }
  if (args[1] && typeof args[1] === 'object') {
    options = args[1];
  }
  return $.notify(mixIn({
    message: msg,
    title: "ArtanOS Lock",
    icon: "fa fa-bell"
  }, attr), mixIn({
    type: type,
    newest_on_top: true,
    z_index: 11,
    delay: 2000,
    timer: 500,
    animate: {
      enter: 'animated ' + ((type == 'danger') ? 'flipInY' : 'bounceInDown'),
      exit: 'animated ' + ((type == 'danger') ? 'flipOutX' : 'bounceOutUp')
    },
    template: '\
    <div data-notify="container" class="col-xs-11 col-sm-4 alert alert-{0}" role="alert">\
      <button type="button" aria-hidden="true" class="close" data-notify="dismiss">&times;</button>\
      <span data-notify="icon"></span>\
      <span data-notify="title">\
        <b>{1}</b>\
      </span> <br />\
      <span data-notify="message">{2}</span>\
      <div class="progress" data-notify="progressbar">\
         <div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>\
      </div>\
      <a href="{3}" target="{4}" data-notify="url"></a>\
    </div>'
  }, options));
}

function mixIn(orig, other) {
  final = {};
  for (key in orig) {
    final[key] = orig[key];
  }
  for (key in other) {
    final[key] = other[key];
  }
  return final;
}

function initFPB() {
  function toggleMenu() {
    $('.power-btn-sm').toggleClass('scale-out');
    if (!$('.power-card').hasClass('scale-out')) {
      $('.power-card').toggleClass('scale-out');
    }
  }

  function toggleLmtr() {
    if ($("#powerLmtr").is(":visible")) {
      $("#powerLmtr").fadeOut(500);
    } else {
      $("#powerLmtr").fadeIn(500);
    }
  }
  $('#powerBtn, #powerLmtr').click(function() {
    toggleMenu();
    toggleLmtr();
  });
  /* Mobile Device Support
  $("#pass_entry").focusin(function () {
    $('#powerBtn').fadeOut(200);
  }).focusout(function () {
    $('#powerBtn').fadeIn(200);
  });
  */
  $('.power-btn-sm').click(function() {
    var btn = $(this);
    var card = $('.power-card');

    if ($('.power-card').hasClass('scale-out')) {
      $('.power-card').toggleClass('scale-out');
    }
    if (btn.hasClass('power-btn-shutdown')) {
      card.css('background-color', '#d32f2f');
    } else if (btn.hasClass('power-btn-hibernate')) {
      card.css('background-color', '#fbc02d');
    } else if (btn.hasClass('power-btn-restart')) {
      card.css('background-color', '#388e3c');
    }
    $('#power-yes')[0].onclick = function() {
      eval(btn.parent().attr('action'));
    };
  });
}

function initTooltip() {
  $('[tooltip]').hover(function(evt) {
    ordin8 = getCoord(evt.currentTarget, 'top', 'left');
    $that = $(evt.currentTarget);
    tooltip = $that.attr('tooltip');
    display_text = forMatr(tooltip, {
      '%html': $that.html(),
      '%text': $that.text(),
      '%id': $that.attr('id')
    });
    $('#tooltip-box')
      .html(display_text)
      .css('left', (ordin8.left) + 'px')
      .css('top', (ordin8.top + $that.outerHeight() + 5) + 'px')
      .show();
  }, function() {
    $('#tooltip-box').hide();
  });
}

function getCoord(el, ...direction) {
  function get(el, pos) {
    var scrollTop = $(window).scrollTop(),
      elementOffset = $(el).offset()[pos];
    return (elementOffset - scrollTop);
  }
  if (direction.length > 1) {
    res = {};
    for (i = 0; i < direction.length; i++) {
      res[direction[i]] = get(el, direction[i]);
    }
  } else {
    res = get(el, direction[0]);
  }
  return res;
}

function forMatr(txt, ...format) {
  if (format.length == 1 && typeof format[0] === 'object') {
    dict = format[0];
    for (i in dict) {
      txt = txt.replace(i, dict[i]);
    }
  } else if (typeof format[0] === 'string' && typeof format[1] === 'string') {
    txt = txt.replace(format[0], format[1]);
  } else {
    console.error('forMatr:: Illegal formatting');
  }
  return txt;
}

function toggleVisibility() {
  $el = $("#visibility_toggler");
  $box = $('#pass_entry');
  if ($box.attr('type') == 'password') {
    $box.attr('type', 'text');
    $el.removeClass('fa-eye').addClass('fa-eye-slash');
  } else {
    $box.attr('type', 'password');
    $el.removeClass('fa-eye-slash').addClass('fa-eye');
  }
  $box.focus();
}

/* FOR DEBUG ONLY */

function showP(tag = 'html') {
  alert($(tag).html());
}
