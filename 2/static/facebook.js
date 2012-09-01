var Facebook = (function() {
  var KEY = 'facebookinfo';
  var _is_logged_in = false;
  var container = $('#facebook');
  var _state;
  var _no_spotted;
  var _no_remaining;

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

  function loggedIn(response) {
    _is_logged_in = true;
    $('.login', container).hide();
    $('.logout', container).show();
    FB.api('/me', function(response) {
      $.jStorage.set(KEY, response);
      $('.logout .name', container).html('<strong>'+ response.name + '</strong>, you\'re logged in.');
    });
  }

  function loggedOut(response) {
    $('.logout .name', container).text('');
    $('.logout', container).hide();
    $('.login', container).show()();
    $.jStorage.deleteKey(KEY);
  }

  function onload() {
    $('#facebook .logout button').click(function() {
      FB.logout(function(response) { }, {});
      return false;
    });

    $('#facebook .login button').click(function() {
      //FB.login(function(response) { }, {scope:'email'});
      // see https://developers.facebook.com/docs/authentication/permissions/
      // on comma separated list of permissions.
      FB.login(function(response) { }, {});
      return false;
    });

    $('.start-bragging button.proceed', container).click(function() {
      confirmBragging();
      return false;
    });

    $('.confirm-bragging button.proceed', container).click(function() {
      var filename = _state.toLowerCase().replace(' ','') + '.jpg';
      // CDN?
      var picture_url = 'http://uslicensespotter.com/static/plates/' + filename;
      FB.ui({
         method: 'feed',
        link: 'http://uslicensespotter.com/',
        picture: picture_url,
        name: 'I spotted ' + _state + '!',
        caption: 'License Spotter',
        description: getDescription(false)
      }, function(response) {
        console.log(response);
        $('.facebook-dialog').hide();
      });

      return false;
    });

    $('.start-bragging button.cancel, .confirm-bragging button.cancel', container).click(function() {
      $('.facebook-dialog').hide();
      return false;
    });


  }

  function handleStatusChange(response) {
    //console.log('handleStatusChange RESPONSE:', response);

    if (response.authResponse) {
      //console.log(response);
      loggedIn(response);
    } else if (_is_logged_in) {
      loggedOut(response);
    } else {
      $('.login', container).show();
    }
  }

  function confirmBragging() {
    $('.start-bragging', container).hide();

    var c = $('.confirm-bragging', container);
    $('.text', c).html(getDescription(true));
    c.show();
  }

  function startBragging(state, no_spotted, no_remaining) {
    $('.confirm-bragging', container).hide();
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
