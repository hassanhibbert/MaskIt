'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

// Polyfill
if (!Math.sign) {
  Math.sign = function (x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  };
}

var Utils = {
  getCursorPosition: function getCursorPosition(selection) {
    var position = 0;
    var selectStart = selection.selectionStart;
    if (selectStart) {
      if (selectStart || selectStart === 0) position = selectStart;
    }
    return position;
  },
  setCursorPosition: function setCursorPosition(selection, position) {
    if (selection.setSelectionRange) {
      selection.focus();
      selection.setSelectionRange(position, position);
    }
  },
  getElementList: function getElementList(elements) {
    if (typeof elements === 'string') {
      return [].concat(_toConsumableArray(document.querySelectorAll(elements)));
    } else if (typeof elements === 'undefined' || elements instanceof Array) {
      return elements;
    } else {
      return [elements];
    }
  },
  setListeners: function setListeners(elements, events, eventHandler, remove) {
    if (elements && events && eventHandler) {
      var method = (remove ? 'add' : 'remove') + 'EventListener';
      for (var i = 0, length = elements.length; i < length; i++) {
        elements[i][method](events, eventHandler, false);
      }
    }
  },
  escapeRegExp: function escapeRegExp(string) {
    if (typeof string === 'string') {
      return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
    return string;
  }
};

var MaskIt = function () {
  function MaskIt(maskPattern) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, MaskIt);

    this.maskDefinitions = {
      0: { pattern: /\d/ },
      A: { pattern: /[a-zA-Z]/ },
      Z: { pattern: /[a-zA-Z0-9]/ }
    };
    var defaults = {
      element: null,
      maskDefinitions: null,
      onInputHandler: null,
      onChangeHandler: null,
      onInvalidCharacter: null,
      onComplete: null
    };

    this.cursorBeforeState;

    this.events = [{ type: 'input', handler: this.onInputHandler.bind(this) }, { type: 'change', handler: this.onChangeHandler.bind(this) }, { type: 'keydown', handler: this.onKeyDownHandler.bind(this) }];

    this.options = Object.assign(defaults, options);

    if (this.options.maskDefinitions) {
      this.maskDefinitions = Object.assign(this.maskDefinitions, this.options.maskDefinitions);
    }

    this.maskPatterns = [].concat(_toConsumableArray(maskPattern));

    if (this.options.element) {
      this.elements = Utils.getElementList(this.options.element);
      this.initializeEvents();
    }
  }

  _createClass(MaskIt, [{
    key: 'initializeEvents',
    value: function initializeEvents() {
      var _this = this;

      this.events.forEach(function (event) {
        Utils.setListeners(_this.elements, event.type, event.handler, true);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this2 = this;

      this.events.forEach(function (event) {
        Utils.setListeners(_this2.elements, event.type, event.handler, false);
      });
    }
  }, {
    key: 'isMaskComplete',
    value: function isMaskComplete(currentOutput) {
      return this.maskPatterns.length === currentOutput.length;
    }
  }, {
    key: 'onKeyDownHandler',
    value: function onKeyDownHandler(event) {
      this.cursorBeforeState = Utils.getCursorPosition(event.target);
    }
  }, {
    key: 'onInputHandler',
    value: function onInputHandler(event) {
      var output = this.maskInput(event.target);
      if (this.options.onInputHandler) {

        this.options.onInputHandler({ output: output, event: event });
      }
    }
  }, {
    key: 'onChangeHandler',
    value: function onChangeHandler(event) {
      if (this.options.onChangeHandler) {
        var output = this.maskInput(event.target);
        this.options.onChangeHandler({ output: output, event: event });
      }
    }
  }, {
    key: 'unmask',
    value: function unmask() {
      var _this3 = this;

      var string = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var stringParts = string.split('');
      var removedDuplicatePatterns = this.removeDuplicatesPatterns(this.maskPatterns);
      var mappedPatterns = this.mapPatternToMaskDefinitions(removedDuplicatePatterns);

      var unmaskedCharacters = stringParts.filter(function (character) {
        var characterValidity = mappedPatterns.some(function (characterPattern) {
          return new RegExp(Utils.escapeRegExp(characterPattern)).test(character);
        });

        if (_this3.options.onInvalidCharacter && !characterValidity) _this3.options.onInvalidCharacter({ invalidCharacter: character });

        return characterValidity;
      });
      return unmaskedCharacters.join('');
    }
  }, {
    key: 'removeDuplicatesPatterns',
    value: function removeDuplicatesPatterns(maskDefinitions) {
      return maskDefinitions.reduce(function (reducedList, maskDefinition) {
        if (reducedList.indexOf(maskDefinition) < 0) reducedList.push(maskDefinition);
        return reducedList;
      }, []);
    }
  }, {
    key: 'getPatternsForMask',
    value: function getPatternsForMask() {
      var _this4 = this;

      return this.maskPatterns.reduce(function (maskPattern, key) {
        var maskDefinition = _this4.maskDefinitions[key];
        var patternNotInList = maskDefinition && maskPattern.indexOf(maskDefinition.pattern) < 0;
        if (patternNotInList) maskPattern.push(maskDefinition.pattern);
        return maskPattern;
      }, []);
    }
  }, {
    key: 'mapPatternToMaskDefinitions',
    value: function mapPatternToMaskDefinitions(maskPatterns) {
      var _this5 = this;

      return maskPatterns.map(function (key) {
        var maskDefinition = _this5.maskDefinitions[key];
        return maskDefinition ? maskDefinition.pattern : key;
      });
    }
  }, {
    key: 'calculateCursorPosition',
    value: function calculateCursorPosition(cursorPosition, inputLength, maskLength) {
      var inputOutputDiff = maskLength - inputLength;
      var updatedCursorPosition = cursorPosition + inputOutputDiff;
      var backspaceDetected = this.cursorBeforeState > cursorPosition && inputOutputDiff === 1 || Math.sign(inputOutputDiff) < 0;
      var newCursorPosition = updatedCursorPosition > 1 ? updatedCursorPosition : cursorPosition;
      return backspaceDetected ? cursorPosition : newCursorPosition;
    }
  }, {
    key: 'mask',
    value: function mask() {
      var string = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var patternMappedToMask = this.mapPatternToMaskDefinitions(this.maskPatterns);
      var unmaskedCharacters = [].concat(_toConsumableArray(this.unmask(string)));
      var mask = [];

      for (var position = 0; position < patternMappedToMask.length; position += 1) {
        var pattern = patternMappedToMask[position];
        var character = unmaskedCharacters[position];
        var characterRegExp = new RegExp(Utils.escapeRegExp(pattern), 'g');

        if (characterRegExp.test(character)) {
          mask.push(character);
        } else if ((typeof pattern === 'undefined' ? 'undefined' : _typeof(pattern)) !== 'object') {
          unmaskedCharacters.splice(position, 0, pattern);
          mask.push(pattern);
        } else if (mask.length < patternMappedToMask.length && unmaskedCharacters[position] !== undefined) {
          unmaskedCharacters.splice(position, 1);
          position -= 1;
        } else {
          return mask.join('');
        }
      }

      var maskOutput = mask.join('');
      if (this.isMaskComplete(maskOutput)) this.options.onComplete && this.options.onComplete({ complete: maskOutput });

      return maskOutput;
    }
  }, {
    key: 'maskInput',
    value: function maskInput(element) {
      var input = element;
      var maskOutput = this.mask(input.value);
      var cursorPosition = Utils.getCursorPosition(input);
      var inputLength = input.value.length;
      var maskLength = maskOutput.length;
      var newPosition = this.calculateCursorPosition(cursorPosition, inputLength, maskLength);
      if (!inputLength) return;
      input.value = maskOutput;
      Utils.setCursorPosition(input, newPosition);
      return maskOutput;
    }
  }]);

  return MaskIt;
}();