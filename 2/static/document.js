var State = (function() {  // no pun intended
  var KEY = 'uslicenseplates-2';
  var _state;
  function load() {
    _state = $.jStorage.get(KEY, {});
  }
  function save() {
    $.jStorage.set(KEY, _state);
  }
  return {
     load: load,
      save: save,
      add: function(name) {
        _state[name] = (new Date()).getTime();
        save();
      },
    remove: function(name) {
        delete _state[name];
        save();
      },
    iterate: function(callback) {
        $.each(_state, function(name, date) {
          callback(name, date);
        });
      },
    age: function(name) {
      return ((new Date()).getTime() - _state[name]) / 1000;
    },
    oldest: function() {
      var o = null;
      $.each(_state, function(name, ts) {
        if (typeof ts !== 'number') {
          //ts = 60 * 60 * 24 * 4 * 1000;  // legacy
          ts = Date.parse(ts);
        }
        if (o == null) o = ts;
        else if (ts < o) o = ts;
      });
      return o;
    }
  }
})();

function timeSince(date) {
  var delta = Math.round((new Date().getTime() - date) / 1000);

  var minute = 60,
    hour = minute * 60,
    day = hour * 24,
    week = day * 7;

  var fuzzy;

  if (delta < 30) {
    fuzzy = 'just now';
  } else if (delta < minute) {
    fuzzy = delta + ' seconds ago';
  } else if (delta < 2 * minute) {
    fuzzy = 'a minute ago'
  } else if (delta < hour) {
    fuzzy = Math.floor(delta / minute) + ' minutes ago';
  } else if (Math.floor(delta / hour) == 1) {
    fuzzy = '1 hour ago'
  } else if (delta < day) {
    fuzzy = Math.floor(delta / hour) + ' hours ago';
  } else if (delta < day) {
    fuzzy = 'today';
  } else if (delta < day * 2) {
    fuzzy = 'yesterday';
  } else if (delta < week) {
    fuzzy = Math.floor(delta / day) + ' days ago';
  } else if (Math.floor(delta / week) == 1) {
    fuzzy = '1 week ago';
  } else if ((delta / week) > 1) {
    fuzzy = Math.floor(delta / week) +' weeks ago';
  }
  return fuzzy;
}


var StatesForm = (function() {
  var state;
  function update_numbers() {
    var container = $('');
    var c = 0, uc = 0;
    $('form a.btn').each(function() {
      ($(this).hasClass('btn-success')) ? c++ : uc++;
    });
    $('#no-spotted').text(c);
    $('#no-remaining').text(uc);
    var oldest = State.oldest();
    if (oldest) {
      $('#times-ago-outer').show();
      $('#times-ago').text(timeSince(oldest));
    } else {
      $('#times-ago-outer').hide();
    }

  }
  function switch_on($el, timestamp) {
    $el.addClass('btn-success');
    $('i', $el).addClass('icon-white').removeClass('icon-remove').addClass('icon-check');
    $('span', $el).text(timeSince(timestamp));
  }

  function switch_off($el) {
    $el.removeClass('btn-success');
    $('i', $el).removeClass('icon-white').removeClass('icon-check').addClass('icon-remove');
    $('span', $el).text('');
  }

  return {
     preload: function() {
       State.load();
       State.iterate(function(name, date) {
         switch_on($('#' + name), date);
       });
       update_numbers();
       $('#loading').hide();
       $('#spotted-outer').show();
       $('#form').show();
     },
    bind: function() {
      //var fieldset = $('#states');
      $('form a.btn').click(function(event) {
        var $el = $(this);
        var id = $el.attr('id');
        if ($el.hasClass('btn-success')) {
          if (State.age(id) > 60) {
            if (confirm("Are you sure?")) {
              State.remove(id);
            } else {
              return false;
            }
          } else {
            // so recently added it was probably a mistake
            State.remove(id);
          }
          switch_off($el);
        } else {
          switch_on($el, new Date());
          State.add(id);
        }
        update_numbers();
        return false;
      });
    }

  }
})();


var Nav = (function() {
  return {
     bind: function() {
       $('a.nav-close').click(function() {
         $('a.btn-navbar').click();
         $('#form:hidden').show();
         $('#spotted-outer:hidden').show();
         $('#about:visible').hide();
         return false;
       });
       $('a.nav-about').click(function() {
         console.log('CLICKED');
         $('#form').hide();
         $('#spotted-outer').hide();
         $('#about').show();
         $('a.btn-navbar').click();
         return false;
       });
     }
  }
})();

$(function() {
  StatesForm.preload();
  StatesForm.bind();
  Nav.bind();
  setTimeout(function(){
    // Hide the address bar!
    window.scrollTo(0, 1);
  }, 0);
});
