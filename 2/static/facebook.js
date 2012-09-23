var Facebook = (function() {
  var KEY = 'facebookinfo';
  var BACKUPURL = 'http://backup.uslicensespotter.com/';
  var _is_logged_in = false;
  var container = $('#facebook');
  var _state;
  var _no_spotted;
  var _no_remaining;

  function backup() {
    var id = $.jStorage.get(KEY).id;
    $.post(BACKUPURL + id, $.jStorage.get('uslicenseplates'));
  }

  function getDescription(use_html) {
    var second_sentence;
    if (_no_spotted > _no_remaining) {
      second_sentence = 'Only ' + _no_remaining + ' left to spot.';
    } else {
      second_sentence = _no_spotted + ' spotted so far and counting.';
    }
    var text = 'I just spotted a license plate from ';
    if (use_html) {
      text += '<strong>' + _state + '</strong>!<br>';
    } else {
      text += _state + '!\n';
    }
    text += second_sentence;
    return text;
  }

  function showLoggedIn(data) {
    $('.logout .name', container).html('<strong>'+ data.name + '</strong>, you\'re logged in.');
  }

  function loggedIn(response) {
    _is_logged_in = true;
    $('.login', container).hide();
    $('.logout', container).show();
    FB.api('/me', function(response) {
      $.jStorage.set(KEY, response);
      showLoggedIn(response);
    });
  }

  function loggedOut() {
    $('.logout .name', container).text('');
    $('.logout', container).hide();
    $('.login', container).show();
  }

  function onload() {
    if (!_is_logged_in && $.jStorage.get(KEY)) {
      // we don't know if Facebook has said we're logged in yet
      // but we know what the details probably will be
      $('.login', container).hide();
      $('.logout', container).show();
      showLoggedIn($.jStorage.get(KEY));
      setTimeout(function() {
        if (!_is_logged_in) {
          $('.login', container).show();
          $('.logout', container).hide();
        }
      }, 3 * 1000);
    } else {
      $('.login', container).show();
    }

    $('.logout button', container).click(function() {
      $.jStorage.deleteKey(KEY);
      loggedOut();
      FB.logout(function(response) { }, {});
      _is_logged_in = false;
      return false;
    });

    $('.login button', container).click(function() {
      //FB.login(function(response) { }, {scope:'email'});
      // see https://developers.facebook.com/docs/authentication/permissions/
      // on comma separated list of permissions.
      FB.login(function(response) { }, {});
      return false;
    });

    $('.start-bragging button.proceed', container).click(function() {
      var filename = _state.toLowerCase().replace(' ','') + '.jpg';
      var cdn = 'd1xair11r8dkna.cloudfront.net';
      var picture_url = 'http://' + cdn + '/static/plates/' + filename;
      FB.ui({
         method: 'feed',
        link: 'http://uslicensespotter.com/#about',
        picture: picture_url,
        name: 'I spotted ' + _state + '!',
        caption: 'License Spotter',
        description: getDescription(false)
      }, function(response) {
        _state = null;
        _no_spotted = null;
        _no_spotted = null;
        $('.facebook-dialog').hide();
      });

      return false;
    });

    $('.start-bragging button.cancel', container).click(function() {
      $('.facebook-dialog').hide();
      _state = null;
      _no_spotted = null;
      _no_remaining = null;
      return false;
    });

  }

  function handleStatusChange(response) {
    //console.log('handleStatusChange RESPONSE:', response);
    if (response.authResponse) {
      loggedIn(response);
    } else if (_is_logged_in) {
      loggedOut();
      _is_logged_in = false;
    } else {
      $('.login', container).show();
    }
  }

  function startBragging(state, no_spotted, no_remaining) {
    var c = $('.start-bragging', container);
    _state = state;
    _no_spotted = no_spotted;
    _no_remaining = no_remaining;
    $('h3', c).text(state + '!');
    c.show(100);
    setTimeout(function() {
      window.scrollTo(0, 1);
    }, 1000);

  }

  return {
     backup: backup,
     onload: onload,
     handleStatusChange: handleStatusChange,
     startBragging: startBragging,
     is_logged_in: function() { return _is_logged_in; }
  };
})();

window.fbAsyncInit = function() {
  FB.init({
     appId      : '435443603167177', // App ID
    channelUrl : '//uslicensespotter.com/channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });

  FB.Event.subscribe('auth.statusChange', Facebook.handleStatusChange);
};


// Load the SDK Asynchronously
(function(d){
  var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement('script'); js.id = id; js.async = true;
  js.src = "//connect.facebook.net/en_US/all.js";
  ref.parentNode.insertBefore(js, ref);
}(document));

$(function() {
  Facebook.onload();
});
