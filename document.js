var State = (function() {  // no pun intended
  var KEY = 'uslicenseplates';
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
      if (typeof _state[name] !== 'number') return 60 * 60 * 24 * 4;  // legacy
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
  } else if (delta < day * 2) {
    fuzzy = 'yesterday';
  }
  return fuzzy;
}


var StatesForm = (function() {
  var state;
  function update_numbers() {
    var container = $('#states');
    var c = 0, uc = 0;
    $('input.custom', container).each(function() {
      (this.checked) ? c++ : uc++;
    });
    $('#no-spotted', container).text(c);
    $('#no-remaining', container).text(uc);
    var oldest = State.oldest();
    if (oldest) {
      $('#times-ago-outer').show();
      $('#times-ago').text(timeSince(oldest));
    } else {
      $('#times-ago-outer').hide();
    }

  }
  return {
     preload: function() {
       State.load();
       State.iterate(function(name, date) {
         $('#' + name).attr('checked', true).checkboxradio('refresh');
       });
       update_numbers();
     },
    bind: function() {
      var fieldset = $('#states');
      $('input.custom', fieldset).click(function(event) {
        update_numbers();
        var id = $(this).attr('id');
        if (this.checked) {
          State.add(id);
        } else {
          if (State.age(id) > 60 * 60) {
            if (confirm("Are you sure you didn't see this?")) {
              State.remove(id);
            } else {
              $(this).attr('checked', true).checkboxradio('refresh');
              return false;
            }
          } else {
            // so recently added it was probably a mistake
            State.remove(id);
          }
        }
      });
    }

  }
})();


$(function() {
  $(document).delegate("#states", "pageinit", function() {
    StatesForm.preload();
    StatesForm.bind();
  });
});
