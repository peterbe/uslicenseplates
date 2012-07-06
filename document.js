var State = (function() {  // no pun intended
  var _state;
  function load() {
    _state = $.jStorage.get('uslicenseplates', {});
  }
  function save() {
    $.jStorage.set('uslicenseplates', _state);
  }
  return {
     load: load,
      save: save,
      add: function(name) {
        _state[name] = new Date();
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
      }
  }
})();


var StatesForm = (function() {
  var state;
  function update_numbers() {
    var container = $('#states');
    var c = 0, uc = 0;
    $('input.custom', container).each(function() {
      this.checked && c++ || uc++;
    });
    $('#no-spotted', container).text(c);
    $('#no-remaining', container).text(uc);
  }
  return {
     preload: function() {
       State.load();
       State.iterate(function(name, date) {
         $('#' + name).attr('checked', true).checkboxradio('refresh');
       });
     },
    bind: function() {
      var fieldset = $('#states');
      $('input.custom', fieldset).click(function() {
        update_numbers();
        if (this.checked) {
          State.add($(this).attr('id'));
        } else {
          State.remove($(this).attr('id'));
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
