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
  function constructor(maskPattern, selector, options = {}) {

    // Create new object context
    const ctx = Object.create(PublicAPI);

    ctx.maskDefinitions = {
      0: { pattern: /\d/ },
      A: { pattern: /[a-zA-Z]/ },
      Z: { pattern: /[a-zA-Z0-9]/ },
    };

    const defaults = {
      maskDefinitions: null,
      onInputHandler: null,
      onChangeHandler: null,
      onInvalidCharacter: null,
      onComplete: null
    };

    ctx.cursorBeforeState = 0;

    ctx.events = [
      { type: 'input', handler: ctx.onInputHandler.bind(ctx) },
      { type: 'change', handler: ctx.onChangeHandler.bind(ctx) },
      { type: 'keydown', handler: ctx.onKeyDownHandler.bind(ctx) }
    ];

    ctx.options = Object.assign(defaults, options);

    if (ctx.options.maskDefinitions) {
      ctx.maskDefinitions = Object.assign(ctx.maskDefinitions, ctx.options.maskDefinitions);
    }

    ctx.maskPatterns = [...maskPattern];
    ctx.elements = ctx.getElementList(selector);
    ctx.initializeEvents();

    return ctx;
  }


  // Extend objects prototypes and properties
  const Extend = (source, object) => Object.assign(Object.create(source), object);

  /*
   * Helper methods
   */
  const Helpers = {

    getCursorPosition(selection) {
      let position = 0;
      const selectStart = selection.selectionStart;
      //position = selectStart || selectStart === 0 ? selectStart : position
      if (selectStart) {
        if (selectStart || selectStart === 0) position = selectStart;
      }
      return position;
    },

    setCursorPosition(selection, position) {
      if (selection.setSelectionRange) {
        selection.focus();
        selection.setSelectionRange(position, position);
      }
    },

    getElementList(elements) {
      if (typeof elements === 'string') {
        return [...document.querySelectorAll(elements)];
      } else if (typeof elements === 'undefined' || elements instanceof Array) {
        return elements;
      } else {
        return [elements];
      }
    },

    setListeners(elements, events, eventHandler, remove) {
      if (elements && events && eventHandler) {
        let method = (remove ? 'add' : 'remove') + 'EventListener';
        for (let i = 0, length = elements.length; i < length; i++) {
          elements[i][method](events, eventHandler, false);
        }
      }
    },

    escapeRegExp(string) {
      if (typeof string === 'string') {
        return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      }
      return string;
    }
  };

  /*
   * Internal methods
   */
  const MaskMethods = Extend(Helpers, {
    isMaskComplete(currentOutput) {
      return this.maskPatterns.length === currentOutput.length;
    },



    unmask(string = '') {
      const stringParts = string.split('');
      const removedDuplicatePatterns = this.removeDuplicatesPatterns(this.maskPatterns);
      const mappedPatterns = this.mapPatternToMaskDefinitions(removedDuplicatePatterns);

      const unmaskedCharacters = stringParts.filter((character) => {
        const characterValidity = mappedPatterns
          .some(characterPattern => new RegExp(this.escapeRegExp(characterPattern)).test(character));

        if (this.options.onInvalidCharacter && !characterValidity)
          this.options.onInvalidCharacter({ invalidCharacter: character });

        return characterValidity;
      });
      return unmaskedCharacters.join('');
    },

    maskInput(element) {
      const input = element;
      const maskOutput = this.mask(input.value);
      const cursorPosition = this.getCursorPosition(input);
      const inputLength = input.value.length;
      const maskLength = maskOutput.length;
      const newPosition = this.calculateCursorPosition(cursorPosition, inputLength, maskLength);
      if (!inputLength) return '';
      input.value = maskOutput;
      this.setCursorPosition(input, newPosition);
      return maskOutput;
    },

    removeDuplicatesPatterns(maskDefinitions) {
      return maskDefinitions.reduce((reducedList, maskDefinition) => {
        if (reducedList.indexOf(maskDefinition) < 0) reducedList.push(maskDefinition);
        return reducedList;
      }, []);
    },

    getPatternsForMask() {
      return this.maskPatterns.reduce((maskPattern, key) => {
        const maskDefinition = this.maskDefinitions[key];
        const patternNotInList = maskDefinition && maskPattern.indexOf(maskDefinition.pattern) < 0;
        if (patternNotInList) maskPattern.push(maskDefinition.pattern);
        return maskPattern;
      }, []);
    },

    mapPatternToMaskDefinitions(maskPatterns) {
      return maskPatterns.map((key) => {
        const maskDefinition = this.maskDefinitions[key];
        return maskDefinition ? maskDefinition.pattern : key;
      });
    },

    calculateCursorPosition(cursorPosition, inputLength, maskLength) {
      const inputOutputDiff = maskLength - inputLength;
      const updatedCursorPosition = cursorPosition + inputOutputDiff;
      const backspaceDetected = this.cursorBeforeState > cursorPosition && inputOutputDiff === 1
        || Math.sign(inputOutputDiff) < 0;
      const newCursorPosition = updatedCursorPosition > 1  ? updatedCursorPosition : cursorPosition;
      return backspaceDetected ? cursorPosition : newCursorPosition;
    }
  });

  const MaskEvents = Extend(MaskMethods, {
    initializeEvents() {
      this.events.forEach((event) => {
        this.setListeners(this.elements, event.type, event.handler, true);
      });
    },

    onKeyDownHandler(event) {
      this.cursorBeforeState = this.getCursorPosition(event.target);
    },

    onInputHandler(event) {
      const output = this.maskInput(event.target);
      if (this.options.onInputHandler) {
        this.options.onInputHandler({ output, event });
      }
    },

    onChangeHandler(event) {
      if (this.options.onChangeHandler) {
        const output = this.maskInput(event.target);
        this.options.onChangeHandler({ output, event });
      }
    }
  });

  const PublicAPI = Extend(MaskEvents, {
    mask(string = '') {
      const patternMappedToMask = this.mapPatternToMaskDefinitions(this.maskPatterns);
      const unmaskedCharacters = [...this.unmask(string)];
      const mask = [];

      for (let position = 0; position < patternMappedToMask.length; position += 1) {
        const pattern = patternMappedToMask[position];
        const character = unmaskedCharacters[position];
        const characterRegExp = new RegExp(this.escapeRegExp(pattern), 'g');

        if (characterRegExp.test(character)) {
          mask.push(character);
        } else if (typeof pattern !== 'object') {
          unmaskedCharacters.splice(position, 0, pattern);
          mask.push(pattern);
        } else if (mask.length < patternMappedToMask.length && unmaskedCharacters[position] !== undefined) {
          unmaskedCharacters.splice(position, 1);
          position -= 1;
        } else {
          return mask.join('');
        }
      }

      const maskOutput = mask.join('');
      if (this.isMaskComplete(maskOutput))
        this.options.onComplete && this.options.onComplete({ complete: maskOutput });

      return maskOutput;
    },

    destroyEvents() {
      this.events.forEach((event) => {
        this.setListeners(this.elements, event.type, event.handler, false);
      });
    }
  });

})(window);
/*
(function (global) {
  'use strict';

  function MaskIt(maskPattern, ...options) {

    if (!(this instanceof MaskIt)) {
      return new MaskIt(maskPattern, ...options);
    }

    var _this = this, defaults;

    this.maskValue = '';
    this.maskPattern = maskPattern.split('');
    this.maskElement = !isObject(options[0]) && getElementList(options[0]);

    this.events = {
      onChangeHandler: _onChangeHandler.bind(_this),
      onInputHandler: _onInputHandler.bind(_this)
    };

    this.maskDefinitions = {
      '0': { pattern: /\d/ },
      'A': { pattern: /[a-zA-Z]/ },
      'Z': { pattern: /[a-zA-Z0-9]/ }
    };

    defaults = {
      maskOnInput: true,
      maskOnChange: true,
      onInvalidHandler: null,
      onInputHandler: null,
      onChangeHandler: null,
      onComplete: null,
      maskDefinitions: null
    };

    this.options = isObject(options[1] || options[0]) ? extend(defaults, options[1] || options[0]) : defaults;

    if (this.options.maskDefinitions) {
      extend(this.maskDefinitions, this.options.maskDefinitions);
    }

    if (this.maskElement) {
      for (let i = 0, length = this.maskElement.length; i < length; i += 1) {
        this.maskElement[i].value = this.mask(this.maskElement[i].value);
      }
      initializeEvents.call(this);
    }
  }

  MaskIt.prototype = {
    mask: function mask(value) {

      var valueParts = value.split(''),
          maskPattern = this.maskPattern,
          maskDefinition = this.maskDefinitions,
          maskDefinitionKeys = Object.keys(maskDefinition),
          validDefinitionKeys,
          isItemDuplicate,
          removeCount,
          valueLength,
          maskValue,
          maskItem,
          message;

      for (let index = 0, length = maskPattern.length; index < length; index += 1) {

        maskItem = maskPattern[index];
        validDefinitionKeys = maskDefinitionKeys.indexOf(maskItem) < 0;
        isItemDuplicate = maskItem === valueParts[index];
        valueLength = valueParts.length;

        if (maskItem && validDefinitionKeys && index < valueLength) {

          // add mask item
          !isItemDuplicate && valueParts.splice(index, 0, maskItem);

        } else if (valueParts[index] && (maskDefinition[maskItem] && !maskDefinition[maskItem].pattern.test(valueParts[index]))) {
          message = `The character ${valueParts[index]} does not match this pattern: ${maskDefinition[maskItem].pattern}`;

          // Error handling option
          if (isFunction(this.options.onInvalidHandler)) {
            this.options.onInvalidHandler.call(null, message, valueParts[index], maskDefinition[maskItem].pattern);
          }

          // Remove the item that caused the error
          valueParts.splice(index, 1);

          // Decrement index by 1 since an item has been removed
          index -= 1;

        } else if (maskItem && index <= valueLength && validDefinitionKeys && valueLength > this.maskValue.length) {

          // add mask item
          !isItemDuplicate && valueParts.splice(index, 0, maskItem);
        }
      }

      maskValue = valueParts.join('');

      // On complete callback
      if (isFunction(this.options.onComplete) && valueParts.length === maskPattern.length) {
        this.options.onComplete.call(null, maskValue);
      }

      if (maskValue.length <= maskPattern.length) {

        // Assign masked valueParts
        this.maskValue = maskValue;

      } else if (maskValue.length > maskPattern.length) {

        // Remove extra characters
        removeCount = maskValue.length - maskPattern.length;
        valueParts.splice(maskPattern.length, removeCount);
        this.maskValue = valueParts.join('');
      }

      // Return masked value
      return this.maskValue;

    },

    destroyEvents: function destroyEvents() {
      removeListeners.call(this);
    }
  };

  function removeListeners() {
    this.options.maskOnChange && setListeners(this.maskElement, 'change', this.events.onChangeHandler, false);
    this.options.maskOnInput && setListeners(this.maskElement, 'input', this.events.onInputHandler, false);
  }

  function initializeEvents() {
    this.options.maskOnChange && setListeners(this.maskElement, 'change', this.events.onChangeHandler, true);
    this.options.maskOnInput && setListeners(this.maskElement, 'input', this.events.onInputHandler, true);
  }

  function _onChangeHandler(event) {
    event.preventDefault();
    maskAndUpdateCaret.call(this, event.target, this.options.onChangeHandler);
  }

  function _onInputHandler(event) {
    event.preventDefault();
    maskAndUpdateCaret.call(this, event.target, this.options.onInputHandler);
  }

  function maskAndUpdateCaret(element, callback) {
    // Info before caret position is changed
    let lengthBefore = this.maskValue.length;
    let caretPositionBefore = getCaretPosition(element);
    let lengthAfter, caretPosition;

    const maskedValue = this.mask(event.target.value);
    isFunction(callback) && callback.call(null, element, maskedValue);
    element.value = maskedValue;

    // Update caret position
    lengthAfter = element.value.length;
    caretPosition = lengthBefore < lengthAfter && element.value.charAt(caretPositionBefore + 1).trim() === ''
      ? caretPositionBefore + 1
      : caretPositionBefore;
    setCaretPosition(element, caretPosition);
  }

  function getCaretPosition(selection) {
    if (selection.selectionStart) {
      var pos = 0, selectStart = selection.selectionStart;
      if (selectStart || selectStart === 0) {
        pos = selectStart;
      }
      return pos;
    }
  }

  function setCaretPosition(selection, pos) {
    if (selection.setSelectionRange) {
      selection.focus();
      selection.setSelectionRange(pos, pos);
    }
  }

  // utils
  function extend(source, properties) {
    var property;
    for (property in properties) {
      if (properties.hasOwnProperty(property)) {
        source[property] = properties[property];
      }
    }
    return source;
  }

  function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  function isFunction(obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
  }

  function getElementList(elements) {
    if (typeof elements === 'string') {
      return [...document.querySelectorAll(elements)];
    } else if (typeof elements === 'undefined' || elements instanceof Array) {
      return elements;
    } else {
      return [elements];
    }
  }

  function setListeners(elements, events, eventHandler, remove) {
    var method = (remove ? 'add' : 'remove') + 'EventListener';
    for (let i = 0, length = elements.length; i < length; i++) {
      elements[i][method](events, eventHandler, false);
    }
  }

  global.MaskIt = MaskIt;

})(window);
*/