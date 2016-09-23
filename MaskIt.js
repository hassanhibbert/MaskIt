(function (global) {
  'use strict';

  function MaskIt(maskPattern, element, options) {
    if (!(this instanceof MaskIt)) return new MaskIt(maskPattern, element, options);

    this.maskPattern = maskPattern;
    this.maskElement = document.querySelector(element);
    this.inputQueue = [];
    this.maskOutput = null;

    var defaults = {
      onInvalidHandler: null,
      onKeyupHandler: null,
      showError: true,
      maskDefinitions: {
        '0': { pattern: /\d/ },
        '9': { pattern: /\d/, optional: true },
        'A': { pattern: /[a-zA-Z]/ }
      }
    };
    this.options = isObject(options) ? extend(defaults, options) : defaults;
    this.mask();
    init.call(this);
  }


  MaskIt.prototype = {
    mask: function mask(value) {
      var maskPattern, maskDefinitionKeys, maskDefinition, maskItem, validDefinitionKeys, isItemDuplucate;

      maskPattern = this.maskPattern.split('');
      value = value ? value.split('') : this.maskElement.value.split('');
      maskDefinitionKeys = Object.keys(this.options.maskDefinitions);
      maskDefinition = this.options.maskDefinitions;

      for (var index = 0; index < maskPattern.length; index += 1) {
        maskItem = maskPattern[index];
        validDefinitionKeys = maskDefinitionKeys.indexOf(maskItem) < 0;
        isItemDuplucate = maskItem === value[index];

        if (validDefinitionKeys && index < value.length) {

          // Add custom delimiter
          !isItemDuplucate && value.splice(index, 0, maskItem);
        } else if (index < value.length && !maskDefinition[maskItem].pattern.test(value[index])) {
          var message = `The character ${value[index]} does not match this pattern: ${maskDefinition[maskItem].pattern}`;

          // pop the last error
          value.pop();

          // Display error messages or use custom callback
          if (isFunction(this.options.onInvalidHandler)) {
            this.options.onInvalidHandler.call(null, message);
          } else if (this.options.showError) {
            console.error(message);
          }
        }
      }

      // Prevents user from typing more than the mask length
      if (value.length <= this.maskPattern.length) {
        this.maskOutput = value.join('');
        this.maskElement.value = this.maskOutput;
      } else {
        this.maskElement.value = this.maskOutput;
      }

    }
  };

  function init() {
    this.maskElement.addEventListener('keyup', onKeyUpHandler.bind(this), false);
    //this.maskElement.addEventListener('change', maskEventHandler.bind(this), false);
    this.maskElement.addEventListener('keypress', onKeyPressHandler.bind(this), false);
  }

  function onKeyUpHandler(event) {
    event.preventDefault();
    if (this.inputQueue.length === 0) {
      this.mask(event.target.value);
    } else {
      this.inputQueue = event.target.value.split('');
    }
  }

  function onKeyPressHandler(event) {
    event.preventDefault();
    this.inputQueue.push(String.fromCharCode(event.keyCode || event.which || event.charCode));
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

  global.MaskIt = MaskIt;

})(window);



