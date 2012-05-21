/*
  mColorPicker
  Version: 1.0 r38
  
  Copyright (c) 2010 Meta100 LLC.
  http://www.meta100.com/
  
  Licensed under the MIT license 
  http://www.opensource.org/licenses/mit-license.php 
*/

// After this script loads set:
// $.fn.mColorPicker.init.replace = '.myclass'
// to have this script apply to input.myclass,
// instead of the default input[type=color]
// To turn of automatic operation and run manually set:
// $.fn.mColorPicker.init.replace = false
// To use manually call like any other jQuery plugin
// $('input.foo').mColorPicker({options})
// options:
// imageFolder - Change to move image location.
// swatches - Initial colors in the swatch, must an array of 10 colors.
// init:
// $.fn.mColorPicker.init.enhancedSwatches - Turn of saving and loading of swatch to cookies.
// $.fn.mColorPicker.init.allowTransparency - Turn off transperancy as a color option.
// $.fn.mColorPicker.init.showLogo - Turn on/off the meta100 logo (You don't really want to turn it off, do you?).

(function($){

  var $o, $i, i, $b,
      div = '<div>',
      img = '<img>',
      span = '<span>',
      $document = $(document),
      $mColorPicker = $(div),
      $mColorPickerBg = $(div),
      $mColorPickerTest = $(div),
      $mColorPickerInput = $('<input>'),
      rRGB = /^rgb[a]?\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d+\.\d+)*)?\)/,
      rHEX = /([a-f0-9])([a-f0-9])([a-f0-9])/,
      rHEX3 = /#[a-f0-9]{3}/,
      rHEX6 = /#[a-f0-9]{6}/,
      swatchlength = 8,
      sct = 0,
      lastclicked;

  $.fn.mColorPicker = function(options) {

    var swatches = null;

    $o = $.extend($.fn.mColorPicker.defaults, options);

    $.fn.mColorPicker.defaults.swatches.concat($o.swatches).slice(-swatchlength);

    //if ($i.enhancedSwatches && swatches) $o.swatches = swatches.split('||').concat($o.swatches).slice(0, swatchlength) || $o.swatches;

    if (!$("div#mColorPicker").length) $.fn.mColorPicker.drawPicker();
    if (!$('#css_disabled_color_picker').length) $('head').prepend('<meta data-remove-me="true"/><style id="css_disabled_color_picker" type="text/css">.mColorPicker[disabled] + span, .mColorPicker[disabled="disabled"] + span, .mColorPicker[disabled="true"] + span {filter:alpha(opacity=50);-moz-opacity:0.5;-webkit-opacity:0.5;-khtml-opacity: 0.5;opacity: 0.5;cursor:default;}</style>');

    $('meta[data-remove-me=true]').remove();

    this.each($.fn.mColorPicker.drawPickerTriggers);

    return this;
  };

  $.fn.mColorPicker.init = {
    replace: '[type=image]',
    index: 0,
    enhancedSwatches: false,
    allowTransparency: true,
    slogan: 'Meta100 - Designing Fun',
    showLogo: false
  };

  $.fn.mColorPicker.defaults = {
    currentId: false,
    currentInput: false,
    currentColor: false,
    changeColor: false,
    color: false,
    imageFolder: '/ts_includes/images/',
    swatches: [
      "",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#7204ff",
      "#ff4605",
      "#f004ff",
      "#d9d904",
    ]
  };

  
  $.fn.mColorPicker.start = function() {

    $('input[data-mcolorpicker!="true"]').filter(function() {
  
      return ($i.replace == '[type=image]')? this.getAttribute("type") == 'color': $(this).is($i.replace);
    }).mColorPicker();
  };

  $.fn.mColorPicker.events = function() {

    $("#mColorPickerBg").live('click', $.fn.mColorPicker.closePicker);

    $('.mColorPicker').live('keyup', function () {

      try {
  
        $(this).css({
          'background-color': $(this).val()
        }).css({
          'color': $.fn.mColorPicker.textColor($(this).css('background-color'))
        }).trigger('change');
      } catch (r) {}
    });

    $('.mColorPickerTrigger').live('click', $.fn.mColorPicker.colorShow).live('mousedown', function(e) { lastclicked = $(this) });
    

    $('.mColor, .mPastColor').live('mousemove', function(e) {

      if (!$o.changeColor) return false;
  
      var $t = $(this),
          offset = $t.offset(),
          $e = $o.currentInput,
          hex = $e.attr('data-hex') || $e.attr('hex');

      $o.color = $t.css("background-color");

      if ($t.hasClass('mPastColor')) $o.color = $.fn.mColorPicker.setColor($o.color, hex);
      else if ($t.hasClass('mColorTransparent')) $o.color = 'transparent';
      else if (!$t.hasClass('mPastColor')) $o.color = $.fn.mColorPicker.whichColor(e.pageX - offset.left, e.pageY - offset.top, hex);

      $o.currentInput.mSetInputColor($o.color);
    }).live('click', $.fn.mColorPicker.colorPicked);
  
    $('#mColorPickerInput').live('keyup', function (e) {
  
      try {
  
        $o.color = $(this).val();
        $o.currentInput.mSetInputColor($o.color);
    
        if (e.which == 13) $.fn.mColorPicker.colorPicked();
      } catch (r) {}

    }).live('blur', function () {
  
      $o.currentInput.mSetInputColor($o.color);
    });
  
    $('#mColorPickerWrapper').live('mouseout', function () {
  
      if (!$o.changeColor) return false;

      $o.currentInput.mSetInputColor($o.currentColor);
    });
  };

  $.fn.mColorPicker.drawPickerTriggers = function () {

    var $t = $(this),
        id = $t.attr('id') || 'color_' + $i.index++,
        hidden = $t.attr('text') == 'hidden' || $t.attr('data-text') == 'hidden'? true: false,
        color = $.fn.mColorPicker.setColor($t.val(), ($t.attr('data-hex') || $t.attr('hex'))),
        width = $t.width(),
        height = $t.height(),
        flt = $t.css('float'),
        $c = $(span),
        $trigger = $(span),
        colorPicker = '',
        $e;
    
    $t.attr({'class' : 'mColorPickerTrigger'}).css({ 'cursor' : 'pointer' });
    $c.attr({
      'id': 'color_work_area',
      'class': 'mColorPickerInput'
    }).appendTo($b)

    $trigger.insertAfter($t);

    $c.append($t);
    colorPicker = $c.html().replace(/type="color"/gi, 'type="' + (hidden? 'hidden': 'text') + '"');
    $c.html('').remove();
    $e = $(colorPicker).attr('id', id).addClass('mColorPicker').val(color).insertBefore($trigger);

    $e.mSetInputColor(color);
    if( sct < swatchlength ) { // HACK I know but this place has most of the data I need in one place
      $('#mColorPickerSwatches .mPastColor').each(function(index,doM){
          $(doM).bind('click',function(e) {
              
              var event_id = $(lastclicked).attr('e_id');
              var sched_id = $(lastclicked).attr('s_id');
              var a_id = $(lastclicked).attr('a_id');
              
              var dat;
              if(index == 0) {
                dat = { cmd : 'add_mood_color', 'json' : 1, 'event_id' : event_id , 'sched_id' : sched_id, 'account_id' : a_id, 'color_id' : 0, 'disable' : 1 };
              } else {
                dat = { cmd : 'add_mood_color', 'json' : 1, 'event_id' : event_id , 'sched_id' : sched_id, 'account_id' : a_id, 'color_id' : index };
              }
              $.ajax({
                  type : 'POST',
                  url : '/coa',
                  data : dat,
                  dataType: "xml",
                  success : function(received) {
                    if(index == 0) {
                      $("input[type='image'][e_id=" + event_id +"][s_id=" + sched_id +"]").css('background-color', '#CCCCCC');
                    } else {
                      $("input[type='image'][e_id=" + event_id +"][s_id=" + sched_id +"]").css('background-color', $(doM).css('background-color'));
                    }
                  }
              });        
          });
        sct++;
      });
    }
    return $e;
  };

  $.fn.mColorPicker.updateMoodOrder = function(sched_id,event_id) {
    
    $.ajax({
            type : 'POST',
            url : '/coa',
            dataType: "xml",
            data : { 'cmd' : 'update_mood_order', 'sched_id' : sched_id, 'event_id' : event_id },
            success : function(received) {
               
            }
          });       
  };

  $.fn.mColorPicker.drawPicker = function () {
  
    var $s = $(div),
        $l = $('<a>'),
        $f = $(div),
        $w = $(div);

    $mColorPickerBg.attr({
      'id': 'mColorPickerBg'
    }).css({
      'display': 'none',
      'background':'black',
      'opacity': .01,
      'position':'absolute',
      'top':0,
      'right':0,
      'bottom':0,
      'left':0
    }).appendTo($b);

    $mColorPicker.attr({
      'id': 'mColorPicker',
      'data-mcolorpicker': true
    }).css({
      'position':'absolute',
//      'border':'1px solid #ccc',
      'color':'#fff',
      'width':'194px',
      'height':'24px',
      'font-size':'12px',
      'font-family':'times',
      'display': 'none'
    }).appendTo($b);

    $mColorPickerTest.attr({
      'id': 'mColorPickerTest'
    }).css({
      'display': 'none'
    }).appendTo($b);

    $w.attr({
      'id': 'mColorPickerWrapper'
    }).css({
      'position':'relative'
      //'left' : '-73px'
      //'border':'solid 1px gray'
    }).appendTo($mColorPicker);

    $s.attr({
      'id': 'mColorPickerSwatches'
    }).css({
    //  'border-right':'1px solid #000'
    //'left' : '-60px'
    }).appendTo($w);

    $(div).addClass(
      'mClear'
    ).css({
      'clear': 'both'
    }).appendTo($s);

    for (i = (swatchlength-1); i > -1; i--) {
      var boo = $(div).attr({
        'id': 'cell' + i,
        'class': "mPastColor" + ((i > 0)? ' mNoLeftBorder': '')
      }).css({
        'background-color': $o.swatches[i].toLowerCase() ? $o.swatches[i].toLowerCase() : 'transparent',
        'height':'18px',
        'width':'18px',
        'border':'1px solid #222',
        'cursor' : 'pointer',
        'float':'left'
      }).html(
        '&nbsp;'
      );
      
      if(i == 0) {
        boo.attr('title', 'Disable').css({ 'background-image' : 'url(/ts_includes/images/cancel.gif)', 'background-repeat' : 'no-repeat', 'background-position' : 'center'  });
      }
      boo.prependTo($s);

/*      $("#cell" + i).bind('click', { 'i' : i, 'init' : $i, 'event_id' : event_id, 'sched_id' : sched_id }, function(e) {
        $.ajax({
            type : 'GET',
            url : '/coa',
            data : { cmd : 'add_mood_color', 'event_id' : event_id , 'sched_id' : sched_id, 'color_id' : e.data.i },
            success : function(received) {}
        });
        
      });*///alert(e.data.o.swatches[e.data.i].toLowerCase()); });
    }
    
    $mColorPickerInput.attr({
      'id': 'mColorPickerInput',
      'type': 'text'
    }).css({
      'border': 'solid 1px gray',
      'font-size': '10pt',
      'margin': '3px',
      'width': '80px'
    }).appendTo($f);

    if ($i.allowTransparency) $(span).attr({
      'id': 'mColorPickerTransparent',
      'class': 'mColor mColorTransparent'
    }).css({
      'font-size': '16px',
      'color': '#000',
      'padding-right': '30px',
      'padding-top': '3px',
      'cursor': 'pointer',
      'overflow': 'hidden',
      'float': 'right'
    }).text(
      'transparent'
    ).appendTo($f);

    //if ($i.showLogo) $l.attr({
    //  'href': 'http://meta100.com/',
    //  'title': $i.slogan,
    //  'alt': $i.slogan,
    //  'target': '_blank'
    //}).css({
    //  'float': 'right'
    //}).appendTo($f);
    
    //$(img).attr({
    //  'src': $o.imageFolder + 'meta100.png',
    //  'title': $i.slogan,
    //  'alt': $i.slogan
    //}).css({
    //  'border': 0,
    //  'border-left': '1px solid #aaa',
    //  'right': 0,
    //  'position': 'absolute'
    //}).appendTo($l);

    $('.mNoLeftBorder').css({
      'border-left':0
    });
  };

  $.fn.mColorPicker.closePicker = function () {

    $mColorPickerBg.hide();
    $mColorPicker.fadeOut()
  };

  $.fn.mColorPicker.colorShow = function () {

    var $t = $(this),
        id = $t.attr('id').replace('mcp_', ''),
        pos = $t.offset(),
        $i = $("#" + id),
        pickerTop = pos.top + $t.outerHeight(),
        pickerLeft = pos.left;

    if ($i.attr('disabled')) return false;

    $o.currentColor = $i.css('background-color')
    $o.changeColor = true;
    $o.currentInput = $i;
    $o.currentId = id;

    // KEEP COLOR PICKER IN VIEWPORT
    if (pickerTop + $mColorPicker.height() > $document.height()) pickerTop = pos.top - $mColorPicker.height();
    if (pickerLeft + $mColorPicker.width() > $document.width()) pickerLeft = pos.left - $mColorPicker.width() + $t.outerWidth();
  
    $mColorPicker.css({
      'top':(pickerTop) + "px",
      'left':(pickerLeft) + "px"
    }).fadeIn("fast");
  
    $mColorPickerBg.show();

  
    if ($('#' + id).attr('data-text')) $o.color = $t.css('background-color');
    else $o.color = $i.css('background-color');

    $o.color = $.fn.mColorPicker.setColor($o.color, $i.attr('data-hex') || $i.attr('hex'));

    $mColorPickerInput.val($o.color);
  };

  $.fn.mColorPicker.setInputColor = function (id, color) {

    $('#' + id).mSetInputColor(color);
  };

  $.fn.mSetInputColor = function (color) {
  
    var $t = $(this),
        css = {
//          'background-color': color,
          'background-color': (color == 'transparent')? '#CCCCCC' : color,
//          'background-image': (color == 'transparent')? "url('" + $o.imageFolder + "grid.gif')": '',
//          'background-image': (color == 'transparent')? "url('" + $o.imageFolder + "color.png')": '',
          'background-repeat' : 'no-repeat',
          'background-position': 'center',
          'background-size' : '25px 25px',
          'color': $.fn.mColorPicker.textColor(color)
        };

    $t.attr('title', 'Choose..');
  
    if ($t.attr('data-text') || $t.attr('text')) $t.next().css(css);

    $t.val(color).css(css).trigger('change');

    $mColorPickerInput.val(color);
  };

  $.fn.mColorPicker.textColor = function (val) {
  
    val = $.fn.mColorPicker.RGBtoHex(val);
  
    if (typeof val == 'undefined' || val == 'transparent') return "black";
  
    return (parseInt(val.substr(1, 2), 16) + parseInt(val.substr(3, 2), 16) + parseInt(val.substr(5, 2), 16) < 400)? 'white': 'black';
  };

  $.fn.mColorPicker.colorPicked = function () {

    $o.changeColor = false;
  
    $.fn.mColorPicker.closePicker();
  
    $o.currentInput.trigger('colorpicked');
  };
  
  $.fn.mColorPicker.whichColor = function (x, y, hex) {
  
    var color = [255, 255, 255];
  
    if (x < 32) {
  
      color[1] = x * 8;
      color[2] = 0;
    } else if (x < 64) {
  
      color[0] = 256 - (x - 32 ) * 8;
      color[2] = 0;
    } else if (x < 96) {
  
      color[0] = 0;
      color[2] = (x - 64) * 8;
    } else if (x < 128) {
  
      color[0] = 0;
      color[1] = 256 - (x - 96) * 8;
    } else if (x < 160) {
  
      color[0] = (x - 128) * 8;
      color[1] = 0;
    } else {
  
      color[1] = 0;
      color[2] = 256 - (x - 160) * 8;
    }
  
    for (var n = 0; n < 3; n++) {
  
      if (y < 64) color[n] += (256 - color[n]) * (64 - y) / 64;
      else if (y <= 128) color[n] -= color[n] * (y - 64) / 64;
      else if (y > 128) color[n] = 256 - ( x / 192 * 256 );
  
      color[n] = Math.round(Math.min(color[n], 255));
  
      if (hex == 'true') color[n] = $.fn.mColorPicker.decToHex(color[n]);
    }
  
    if (hex == 'true') return "#" + color.join('');
    
    return "rgb(" + color.join(', ') + ')';
  };

  $.fn.mColorPicker.setColor = function (color, hex) {

    if (hex == 'true') return $.fn.mColorPicker.RGBtoHex(color);

    return $.fn.mColorPicker.hexToRGB(color);
  }

  $.fn.mColorPicker.colorTest = function (color) {

    $mColorPickerTest.css('background-color', color);

    return $mColorPickerTest.css('background-color');
  }

  $.fn.mColorPicker.decToHex = function (color) {
  
    var hex_char = "0123456789ABCDEF";
  
    color = parseInt(color);
  
    return String(hex_char.charAt(Math.floor(color / 16))) + String(hex_char.charAt(color - (Math.floor(color / 16) * 16)));
  }
  
  $.fn.mColorPicker.RGBtoHex = function (color) {
  
    var decToHex = "#",
        rgb;
  
    color = color? color.toLowerCase(): false;
  
    if (!color) return '';
    if (rHEX6.test(color)) return color.substr(0, 7);
    if (rHEX3.test(color)) return color.replace(rHEX, "$1$1$2$2$3$3").substr(0, 7);
  
    if (rgb = color.match(rRGB)) {
  
      for (var n = 1; n < 4; n++) decToHex += $.fn.mColorPicker.decToHex(rgb[n]);
    
      return decToHex;
    }
  
    return $.fn.mColorPicker.colorTest(color);
  };
  
  $.fn.mColorPicker.hexToRGB = function (color) {
  
    color = color? color.toLowerCase(): false;
  
    if (!color) return '';
    if (rRGB.test(color)) return color;
  
    if (rHEX3.test(color)) {
  
      if (!rHEX6.test(color)) color = color.replace(rHEX, "$1$1$2$2$3$3");
  
      return 'rgb(' + parseInt(color.substr(1, 2), 16) + ', ' + parseInt(color.substr(3, 2), 16) + ', ' + parseInt(color.substr(5, 2), 16) + ')';
    }
  
    return $.fn.mColorPicker.colorTest(color);
  };
  
  $i = $.fn.mColorPicker.init;

  $document.ready(function () {
  
    $b = $('body');
  //
    $.fn.mColorPicker.events();
  //
  //  if ($i.replace) {
  //
  //    $.fn.mColorPicker.start();
  //
  //    if (typeof $.fn.livequery == "function") $($i.replace).livequery($.fn.mColorPicker.start);
  //    else $(document).live('ajaxSuccess.mColorPicker', $.fn.mColorPicker.start);
  //  }
  });
})(jQuery);
