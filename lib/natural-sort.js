/*
 * natural-sort.js
 *
 * Javascript natural sort algorithm with unicode support
 * based on chunking idea by Dave Koelle
 * original implementation by Jim Palmer (Version 0.8.1)
 * modified by Olaf Ennen
 *
 * https://github.com/yobacca/node-natural-sort
 * released under MIT License
 */
'use strict';

var defaultOptions = {
  caseSensitive: true,
  order: 'ASC',
  getter: function getter(val) {
    return val;
  }
};

module.exports = function (userOptions) {
  var options = Object.assign({}, defaultOptions, userOptions || {});

  return function (valueA, valueB) {
    // const re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g;
    var re = /(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g;
    var sre = /^\s+|\s+$/g; // trim pre-post whitespace
    var snre = /\s+/g; // normalize all whitespace to single ' ' character
    var dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/;
    var hre = /^0x[0-9a-f]+$/i;
    var ore = /^0/;
    var i = function i(s) {
      return (!options.caseSensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
    };
    // convert all to strings strip whitespace
    var x = i(
    // switch parameter for descending order
    options.order === 'DESC' ? options.getter(valueB) : options.getter(valueA));
    var y = i(
    // switch parameter for descending order
    options.order === 'DESC' ? options.getter(valueA) : options.getter(valueB));
    // chunk/tokenize
    var xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0');
    var yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0');
    // numeric, hex or date detection
    var xD = parseInt(x.match(hre), 16) || xN.length !== 1 && Date.parse(x);
    var yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null;
    // normalize spaces; find floats not starting with '0',
    // string or 0, if not defined (Clint Priest)
    var normChunk = function normChunk(s, l) {
      return (!s.match(ore) || l === 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
    };
    var oFxNcL = void 0;
    var oFyNcL = void 0;
    // first try and sort Hex codes or Dates
    if (yD) {
      if (xD < yD) {
        return -1;
      } else if (xD > yD) {
        return 1;
      }
    }
    // natural sorting through split numeric strings and default strings
    for (var cLoc = 0, xNl = xN.length, yNl = yN.length, numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
      oFxNcL = normChunk(xN[cLoc] || '', xNl);
      oFyNcL = normChunk(yN[cLoc] || '', yNl);
      // handle numeric vs string comparison - number < string - (Kyle Adams)
      if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
        return isNaN(oFxNcL) ? 1 : -1;
      }
      // if unicode use locale comparison
      if (/[^\x00-\x80]/.test(oFxNcL + oFyNcL) && oFxNcL.localeCompare) {
        var comp = oFxNcL.localeCompare(oFyNcL);
        return comp / Math.abs(comp);
      }
      if (oFxNcL < oFyNcL) {
        return -1;
      } else if (oFxNcL > oFyNcL) {
        return 1;
      }
    }
    return 0;
  };
};