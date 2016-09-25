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

    this.maskValue = null;
    this.maskPattern = maskPattern;
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
      onInvalidHandler: null,
      onInputHandler: null,
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
      value = value.split('');
      var maskItem,
          maskPattern = this.maskPattern.split(''),
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

          // Update value with the custom delimiter
          !isItemDuplicate && value.splice(index, 0, maskItem);
        } else if (index < value.length && !maskDefinition[maskItem].pattern.test(value[index])) {
          message = 'The character ' + value[index] + ' does not match this pattern: ' + maskDefinition[maskItem].pattern;

          // Remove the last item which caused the error
          value.pop();

          // Error handling option
          if (isFunction(this.options.onInvalidHandler)) {
            this.options.onInvalidHandler.call(null, message, value[index], maskDefinition[maskItem].pattern);
          }
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
    setListeners(this.maskElement, 'change', this.events.onChangeHandler, false);
    setListeners(this.maskElement, 'input', this.events.onInputHandler, false);
  }

  function initializeEvents() {
    setListeners(this.maskElement, 'change', this.events.onChangeHandler, true);
    setListeners(this.maskElement, 'input', this.events.onInputHandler, true);
  }

  function _onChangeHandler(event) {
    event.target.value = this.mask(event.target.value);
  }

  function _onInputHandler(event) {
    event.preventDefault();

    if (this.options.onInputHandler) {
      this.options.onInputHandler(event.target, this.mask(event.target.value));
    } else {
      event.target.value = this.mask(event.target.value);
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