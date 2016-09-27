'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

(function (global) {
  'use strict';

  function MaskIt(maskPattern, element, options) {

    if (!(this instanceof MaskIt)) {
      return new MaskIt(maskPattern, element, options);
    }

    var _this = this,
        defaults;

    this.maskValue = '';
    this.maskPattern = maskPattern.split('');
    this.maskElement = element && getElementList(element);

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
      maskOnChange: false,
      onInvalidHandler: null,
      onInputHandler: null,
      onChangeHandler: null,
      onComplete: null,
      maskDefinitions: null
    };

    this.options = isObject(options) ? extend(defaults, options) : defaults;

    if (this.options.maskDefinitions) {
      extend(this.maskDefinitions, this.options.maskDefinitions);
    }

    if (this.maskElement) {
      for (var i = 0, length = this.maskElement.length; i < length; i += 1) {
        this.maskElement[i].value = this.mask(this.maskElement[i].value);
      }
      initializeEvents.call(this);
    }
  }

  MaskIt.prototype = {
    mask: function mask(value) {
      value = getCleanValue.call(this, value).split('');
      var maskItem,
          maskPattern = this.maskPattern,
          maskDefinition = this.maskDefinitions,
          maskDefinitionKeys = Object.keys(maskDefinition),
          validDefinitionKeys,
          isItemDuplicate,
          message;

      for (var index = 0, length = maskPattern.length; index < length; index += 1) {
        maskItem = maskPattern[index];
        validDefinitionKeys = maskDefinitionKeys.indexOf(maskItem) < 0;
        isItemDuplicate = maskItem === value[index];

        if (validDefinitionKeys && index < value.length) {

          // add mask item
          !isItemDuplicate && value.splice(index, 0, maskItem);
        } else if (value[index] && maskDefinition[maskItem] && !maskDefinition[maskItem].pattern.test(value[index])) {
          message = 'The character ' + value[index] + ' does not match this pattern: ' + maskDefinition[maskItem].pattern;

          // Remove the item that caused the error
          value.splice(index, 1);

          // Error handling option
          if (isFunction(this.options.onInvalidHandler)) {
            this.options.onInvalidHandler.call(null, message, value[index], maskDefinition[maskItem].pattern);
          }
        } else if (index <= value.length && validDefinitionKeys && value.length > this.maskValue.length) {

          // add mask item
          !isItemDuplicate && value.splice(index, 0, maskItem);
        }
      }

      // Prevents user from typing more than the mask length
      if (value.length <= maskPattern.length) {
        this.maskValue = value.join('');
      }

      // On complete callback
      if (isFunction(this.options.onComplete) && value.length === maskPattern.length) {
        this.options.onComplete.call(null, this.maskValue);
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

    if (this.options.onChangeHandler) {
      this.options.onChangeHandler.call(null, event.target, this.mask(event.target.value));
    } else {
      event.target.value = this.mask(event.target.value);
    }
  }

  function _onInputHandler(event) {
    event.preventDefault();
    var updateCaretPosition = caretPosition(event.target);

    if (this.options.onInputHandler) {
      this.options.onInputHandler.call(null, event.target, this.mask(event.target.value));
    } else {
      event.target.value = this.mask(event.target.value);
      updateCaretPosition.call(this);
    }
  }

  function getCleanValue(value) {
    var cleanValue;
    for (var i = 0, length = this.maskPattern.length; i < length; i++) {
      if (Object.keys(this.maskDefinitions).indexOf(this.maskPattern[i]) < 0) {
        if (value.indexOf(this.maskPattern[i]) >= 0) {
          cleanValue = value.split(this.maskPattern[i]).join('');
        }
      }
    }
    return cleanValue ? cleanValue : value;
  }

  function caretPosition(selection) {
    var pos = 0,
        selectStart = selection.selectionStart;
    if (selectStart || selectStart === 0) {
      pos = selectStart + 1;
    }
    return function () {
      selection.focus();
      selection.setSelectionRange(pos, pos);
    };
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
      return [].concat(_toConsumableArray(document.querySelectorAll(elements)));
    } else if (typeof elements === 'undefined' || elements instanceof Array) {
      return elements;
    } else {
      return [elements];
    }
  }

  function setListeners(elements, events, eventHandler, remove) {
    var method = (remove ? 'add' : 'remove') + 'EventListener';
    for (var i = 0, length = elements.length; i < length; i++) {
      elements[i][method](events, eventHandler, false);
    }
  }

  global.MaskIt = MaskIt;
})(window);