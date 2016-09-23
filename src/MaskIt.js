(function (global) {
  'use strict';

  function MaskIt(maskPattern, element, options) {
    if (!(this instanceof MaskIt)) return new MaskIt(maskPattern, element, options);

    this.maskPattern = maskPattern;
    this.maskElement = element && getElementList(element)[0];
    this.inputQueue = [];
    this.maskValue = null;
    this.bypassCodes = [37, 38,39, 40, 9, 16, 18, 17];

    var defaults = {
      onInvalidHandler: null,
      onKeyupHandler: null,
      showError: false,
      maskDefinitions: {
        '0': { pattern: /\d/ },
        '9': { pattern: /\d/, optional: true },
        'A': { pattern: /[a-zA-Z]/ }
      }
    };

    this.options = isObject(options) ? extend(defaults, options) : defaults;
    if (this.maskElement) this.mask();
    if (this.maskElement) initializeEvents.call(this);
  }


  MaskIt.prototype = {
    mask: function mask(value) {
      var maskPattern, maskDefinitionKeys, maskDefinition, maskItem, validDefinitionKeys, isItemDuplucate;

      maskPattern = this.maskPattern.split('');
      value = value ? value.split('') : this.maskElement.value.split('');
      maskDefinitionKeys = Object.keys(this.options.maskDefinitions);
      maskDefinition = this.options.maskDefinitions;

      for (var index = 0, length = maskPattern.length; index < length; index += 1) {
        maskItem = maskPattern[index];
        validDefinitionKeys = maskDefinitionKeys.indexOf(maskItem) < 0;
        isItemDuplucate = maskItem === value[index];

        if (validDefinitionKeys && index < value.length) {

          // Update value with the custom delimiter
          !isItemDuplucate && value.splice(index, 0, maskItem);

        } else if (index < value.length && !maskDefinition[maskItem].pattern.test(value[index])) {
          var message = `The character ${value[index]} does not match this pattern: ${maskDefinition[maskItem].pattern}`;

          // Remove the last item which caused the error
          value.pop();

          // Display error messages or use 'onInvalidHandler' option to handle messages
          if (isFunction(this.options.onInvalidHandler)) {
            this.options.onInvalidHandler.call(null, message);
          } else if (this.options.showError) {
            console.error(message);
          }
        }
      }

      // Prevents user from typing more than the mask length
      if (value.length <= this.maskPattern.length) this.maskValue = value.join('');


      if (this.options.onKeyupHandler) {
        // Return the masked value if 'onKeyupHandler' option is available
        return this.maskValue;
      } else if (this.maskElement && !this.options.onKeyupHandler) {
        this.maskElement.value = this.maskValue;
      }

    },

    removeEvents: function removeEvents() {
      this.maskElement.removeEventListener('keyup', _onKeyupHandler, false);
      this.maskElement.removeEventListener('keypress', _onKeypressHandler, false);
      this.maskElement.removeEventListener('change', _onChangeHandler, false);
    }
  };

  function initializeEvents() {
    this.maskElement.addEventListener('keyup', _onKeyupHandler.bind(this), false);
    this.maskElement.addEventListener('change', _onChangeHandler.bind(this), false);

    // Disable this option if 'onKeyupHandler' is available
    if (!this.options.onKeyupHandler) {
      this.maskElement.addEventListener('keypress', _onKeypressHandler.bind(this), false);
    }
  }

  function _onChangeHandler(event) {
    this.mask(event.target.value);
  }

  function _onKeyupHandler(event) {
    event.preventDefault();
    var keyCode = event.keyCode || event.which;

    // return here to bypass masking
    if (this.bypassCodes.indexOf(keyCode) >= 0) return;

    if (this.inputQueue.length === 0 && !this.options.onKeyupHandler) {
      // This will be the default that will run in case a device isn't able
      // to update the 'this.inputQueue'. This happens when the 'keypress' event doesn't fire
      this.mask(event.target.value);
    } else if (this.options.onKeyupHandler) {
      this.options.onKeyupHandler(event.target, this.mask(event.target.value))
    } else if (this.inputQueue.length >= 1) {
      this.inputQueue = event.target.value.split('');
    }

  }

  function _onKeypressHandler(event) {
    event.preventDefault();
    var keyCode = event.keyCode || event.which;

    // return here to bypass masking
    if (this.bypassCodes.indexOf(keyCode) >= 0) return;

    this.inputQueue.push(String.fromCharCode(keyCode));
    this.mask(this.inputQueue.join(''));
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

  global.MaskIt = MaskIt;

})(window);



