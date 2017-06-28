/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 - 2017 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

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
      maskOnChange: false,
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

    if (this.options.onChangeHandler) {
      this.options.onChangeHandler.call(null, event.target, this.mask(event.target.value));
    } else {
      event.target.value = this.mask(event.target.value);
    }

  }

  function _onInputHandler(event) {
    event.preventDefault();

    // Info before caret position is changed
    var lengthBefore = this.maskValue.length,
        caretPositionBefore = getCaretPosition(event.target),
        lengthAfter, caretPosition;

    if (this.options.onInputHandler) {
      this.options.onInputHandler.call(null, event.target, this.mask(event.target.value));
    } else {
      event.target.value = this.mask(event.target.value);

      // Update caret position
      lengthAfter = event.target.value.length;
      caretPosition = lengthBefore < lengthAfter && event.target.value.charAt(caretPositionBefore + 1).trim() === ''
        ? caretPositionBefore + 1
        : caretPositionBefore;
      setCaretPosition(event.target, caretPosition);
    }
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