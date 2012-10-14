// note: $ is zepto
// note: namespace `Facebook` should be loaded

var State = (function() {  // no pun intended
  var KEY = 'uslicenseplates';
  var BACKUPURL = 'http://backup.uslicensespotter.com/';
//  var BACKUPURL = 'http://backup.uslicensespotter.local/';

  var _state;

  function load() {
    _state = $.jStorage.get(KEY, {});
  }

  function save() {
    $.jStorage.set(KEY, _state);
  }

  function backup(id) {
    $.post(BACKUPURL + id, $.jStorage.get('uslicenseplates'), function() {
      var then = new Date();
      $.jStorage.set('lastbackupdate', then.getTime());
      $('.last-backup code').text(timeSince(then.getTime()));
    });
  }

  function backup_delete(id, state) {
    $.post(BACKUPURL + id + '/delete', {state: state}, function() {
      var then = new Date();
      $.jStorage.set('lastbackupdate', then.getTime());
      $('.last-backup code').text(timeSince(then.getTime()));
    });
  }

  function restore(id) {
    $.getJSON(BACKUPURL + id, function(response) {
      var any = false;
      $.each(response, function(name, ts) {
        _state[name] = ts;
        StatesForm.switch_on($('#' + name), ts, false);
        any = true;
      });
      if (any) {
        StatesForm.update_numbers();
        save();
      }
    });
  }

  return {
     backup: backup,
     backup_delete: backup_delete,
      restore: restore,
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
        if (o === null) o = ts;
        else if (ts < o) o = ts;
      });
      return o;
    }
  };
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
    fuzzy = 'a minute ago';
  } else if (delta < hour) {
    fuzzy = Math.floor(delta / minute) + ' minutes ago';
  } else if (Math.floor(delta / hour) == 1) {
    fuzzy = '1 hour ago';
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
  var start_interval = 60 * 1000;
  var interval = start_interval;
  var c, uc;

  function update_numbers() {
    c = $('form a.btn-success').size();
    uc = 50 - c;
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
  function switch_on($el, timestamp, use_facebook) {
    $el.addClass('btn-success');
    $('i', $el).addClass('icon-white').removeClass('icon-remove').addClass('icon-check');
    $('span', $el).text(timeSince(timestamp));
    if (use_facebook && Facebook.is_logged_in()) {
      var state = $.trim($el.html().split('<span>')[0].split('</i>')[1]);
      Facebook.startBragging(state, c + 1, uc - 1);
    }
  }

  function switch_off($el) {
    $el.removeClass('btn-success');
    $('i', $el).removeClass('icon-white').removeClass('icon-check').addClass('icon-remove');
    $('span', $el).text('');
    State.backup_delete($.jStorage.get('facebookinfo').id, $el.attr('id'));
  }

  return {
     switch_on: switch_on,
      update_numbers: update_numbers,
     preload: function() {
       State.load();
       State.iterate(function(name, date) {
         switch_on($('#' + name), date, false);
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
          switch_on($el, new Date(), true);
          State.add(id);
          State.backup($.jStorage.get('facebookinfo').id);
        }
        update_numbers();
        interval = start_interval;
        return false;
      });
    },
    update_loop: function() {
      State.load();
      State.iterate(function(name, date) {
        switch_on($('#' + name), date, false);
      });
      var oldest = State.oldest();
      if (oldest) {
        $('#times-ago').text(timeSince(oldest));
      }
      interval += 60 * 1000;  // add 1 minute
      interval = Math.min(interval, 60 * 60 * 1000);
      setTimeout(StatesForm.update_loop, interval);
    }

  };
})();


var Nav = (function() {
  return {
     bind: function() {
       $('a.open-extra-nav').click(function() {
         $('#extra-nav').toggle();
         return false;
       });
       $('a.nav-close,a.go-back').click(function() {
         $('#extra-nav').hide();
         $('.page').hide();
         $('#form').show();
         $('#spotted-outer').show();
         if (location.hash) {
           location.hash = '';
         }
         return false;
       });
       $('a.nav-about').click(function() {
         $('#form').hide();
         $('#spotted-outer').hide();
         $('.page').hide();
         $('#extra-nav').hide();
         $('#about').show();//fadeIn(300);
         return false;
       });
       $('a.nav-rules').click(function() {
         $('#form').hide();
         $('#spotted-outer').hide();
         $('.page').hide();
         $('#extra-nav').hide();
         $('#rules').show();//fadeIn(300);
         return false;
       });
       $('a.nav-facebook').click(function() {
         $('#form').hide();
         $('#spotted-outer').hide();
         $('.page').hide();
         $('#extra-nav').hide();
         $('#facebook').show();//fadeIn(300);
         return false;
       });
       $('a.nav-backup').click(function() {
         var last_backup_date = $.jStorage.get('lastbackupdate');
         if (last_backup_date) {
           $('.last-backup code').text(timeSince(last_backup_date));
         }
         $('#form').hide();
         $('#spotted-outer').hide();
         $('.page').hide();
         $('#extra-nav').hide();
         $('#backup').show();//fadeIn(300);
         return false;
       });
     }
  };
})();

$(function() {
  StatesForm.preload();
  StatesForm.bind();
  Nav.bind();
  setTimeout(function(){
    // Hide the address bar!
    window.scrollTo(0, 1);
  }, 0);
  setTimeout(StatesForm.update_loop, 60 * 1000);
  if (location.hash === '#about') {
    $('#form').hide();
    $('#spotted-outer').hide();
    $('.page').hide();
    $('#extra-nav').hide();
    $('#about').show();
  }
  var last_backup_date = $.jStorage.get('lastbackupdate');
  if (last_backup_date) {
    $('.last-backup code').text(timeSince(last_backup_date));
  }
});
