'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 - 2017 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

(function (root) {

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

  // Export module
  if (typeof exports !== 'undefined') {
    typeof module !== 'undefined' && module.exports && (exports = module.exports = constructor);
    exports.MaskIt = constructor;
  } else if (typeof root !== 'undefined') {
    root.MaskIt = constructor;
  }

  /**
   * Constructor function used to create new instances
   * @param {string} maskPattern - The mask to apply
   * @param {string|HTMLElement} selector - css selector of an element or the HTML dom element
   * @param {object} options
   * @returns {object}
   */
  function constructor(maskPattern) {
    var selector = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];


    // Create new object context
    var ctx = Object.create(PublicAPI);

    ctx.maskDefinitions = {
      0: { pattern: /\d/ },
      A: { pattern: /[a-zA-Z]/ },
      Z: { pattern: /[a-zA-Z0-9]/ }
    };

    // Default options
    var defaults = {
      maskDefinitions: null,
      onInputHandler: function onInputHandler() {},
      onChangeHandler: function onChangeHandler() {},
      onInvalidHandler: function onInvalidHandler() {},
      onComplete: function onComplete() {}
    };

    ctx.cursorBeforeState = 0;

    ctx.events = [{ type: 'input', handler: ctx.onInputHandler.bind(ctx) }, { type: 'change', handler: ctx.onChangeHandler.bind(ctx) }, { type: 'keydown', handler: ctx.onKeyDownHandler.bind(ctx) }];

    ctx.options = Object.assign(defaults, options);

    if (ctx.options.maskDefinitions) ctx.maskDefinitions = Object.assign(ctx.maskDefinitions, ctx.options.maskDefinitions);

    ctx.maskPatterns = [].concat(_toConsumableArray(maskPattern));

    // Initialize dom if a selector/HTMLElement is available
    ctx.elements = selector && ctx.getElementList(selector);
    ctx.elements && ctx.initializeEvents();

    return ctx;
  }

  // Extend objects prototypes and properties
  var Extend = function Extend(source, object) {
    return Object.assign(Object.create(source), object);
  };

  /*
   * Helper methods
   */
  var Helpers = {
    getCursorPosition: function getCursorPosition(selection) {
      var position = 0;
      var selectStart = selection.selectionStart;
      return selectStart ? selectStart : position;
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
      return typeof string === 'string' ? string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : string;
    }
  };

  /*
   * Internal methods
   */
  var MaskMethods = Extend(Helpers, {
    isMaskComplete: function isMaskComplete(currentOutput) {
      return this.maskPatterns.length === currentOutput.length;
    },
    unmask: function unmask() {
      var _this = this;

      var string = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var stringParts = string.split('');
      var removedDuplicatePatterns = this.removeDuplicatesPatterns(this.maskPatterns);
      var mappedPatterns = this.mapPatternToMaskDefinitions(removedDuplicatePatterns);
      var unmaskedCharacters = stringParts.filter(function (character) {
        var characterValidity = mappedPatterns.some(function (characterPattern) {
          return new RegExp(_this.escapeRegExp(characterPattern)).test(character);
        });

        if (!characterValidity) _this.options.onInvalidHandler('Invalid character ' + character + '.', character);

        return characterValidity;
      });
      return unmaskedCharacters.join('');
    },
    maskInput: function maskInput(element) {
      var input = element;
      var maskOutput = this.mask(input.value);
      var cursorPosition = this.getCursorPosition(input);
      var inputLength = input.value.length;
      var maskLength = maskOutput.length;
      var newPosition = this.calculateCursorPosition(cursorPosition, inputLength, maskLength);
      if (!inputLength) return '';
      input.value = maskOutput;
      this.setCursorPosition(input, newPosition);
      return maskOutput;
    },
    removeDuplicatesPatterns: function removeDuplicatesPatterns(maskDefinitions) {
      return maskDefinitions.reduce(function (reducedList, maskDefinition) {
        if (reducedList.indexOf(maskDefinition) < 0) reducedList.push(maskDefinition);
        return reducedList;
      }, []);
    },
    getPatternsForMask: function getPatternsForMask() {
      var _this2 = this;

      return this.maskPatterns.reduce(function (maskPattern, key) {
        var maskDefinition = _this2.maskDefinitions[key];
        var patternNotInList = maskDefinition && maskPattern.indexOf(maskDefinition.pattern) < 0;
        if (patternNotInList) maskPattern.push(maskDefinition.pattern);
        return maskPattern;
      }, []);
    },
    mapPatternToMaskDefinitions: function mapPatternToMaskDefinitions(maskPatterns) {
      var _this3 = this;

      return maskPatterns.map(function (key) {
        var maskDefinition = _this3.maskDefinitions[key];
        return maskDefinition ? maskDefinition.pattern : key;
      });
    },
    calculateCursorPosition: function calculateCursorPosition(cursorPosition, inputLength, maskLength) {
      var inputOutputDiff = maskLength - inputLength;
      var updatedCursorPosition = cursorPosition + inputOutputDiff;
      var backspaceDetected = this.cursorBeforeState > cursorPosition && inputOutputDiff === 1 || Math.sign(inputOutputDiff) < 0;
      var newCursorPosition = updatedCursorPosition > 1 ? updatedCursorPosition : cursorPosition;
      return backspaceDetected ? cursorPosition : newCursorPosition;
    }
  });

  var MaskEvents = Extend(MaskMethods, {
    initializeEvents: function initializeEvents() {
      var _this4 = this;

      this.events.forEach(function (event) {
        return _this4.setListeners(_this4.elements, event.type, event.handler, true);
      });
    },
    onKeyDownHandler: function onKeyDownHandler(event) {
      this.cursorBeforeState = this.getCursorPosition(event.target);
    },
    onInputHandler: function onInputHandler(event) {
      var output = this.maskInput(event.target);
      this.options.onInputHandler(event.target, output);
    },
    onChangeHandler: function onChangeHandler(event) {
      var output = this.maskInput(event.target);
      this.options.onChangeHandler(event.target, output);
    }
  });

  var PublicAPI = Extend(MaskEvents, {
    mask: function mask() {
      var string = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var patternMappedToMask = this.mapPatternToMaskDefinitions(this.maskPatterns);
      var unmaskedCharacters = [].concat(_toConsumableArray(this.unmask(string)));
      var mask = [];

      for (var position = 0; position < patternMappedToMask.length; position += 1) {
        var pattern = patternMappedToMask[position];
        var character = unmaskedCharacters[position];
        var characterRegExp = new RegExp(this.escapeRegExp(pattern), 'g');

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
      this.isMaskComplete(maskOutput) && this.options.onComplete(maskOutput);

      return maskOutput;
    },
    destroyEvents: function destroyEvents() {
      var _this5 = this;

      this.events.forEach(function (event) {
        return _this5.setListeners(_this5.elements, event.type, event.handler, false);
      });
    }
  });
})(window);
