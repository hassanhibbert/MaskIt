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
  function constructor(maskPattern, selector = '', options = {}) {

    // Create new object context
    const ctx = Object.create(PublicAPI);

    ctx.maskDefinitions = {
      0: { pattern: /\d/ },
      A: { pattern: /[a-zA-Z]/ },
      Z: { pattern: /[a-zA-Z0-9]/ },
    };

    // Default options
    const defaults = {
      maskDefinitions: null,
      onInputHandler: () => {},
      onChangeHandler: () => {},
      onInvalidHandler: () => {},
      onComplete: () => {}
    };

    ctx.cursorBeforeState = 0;

    ctx.events = [
      { type: 'input', handler: ctx.onInputHandler.bind(ctx) },
      { type: 'change', handler: ctx.onChangeHandler.bind(ctx) },
      { type: 'keydown', handler: ctx.onKeyDownHandler.bind(ctx) }
    ];

    ctx.options = Object.assign(defaults, options);

    if (ctx.options.maskDefinitions)
      ctx.maskDefinitions = Object.assign(ctx.maskDefinitions, ctx.options.maskDefinitions);

    ctx.maskPatterns = [...maskPattern];

    if (selector) {
      ctx.elements = ctx.getElementList(selector);
      ctx.elements.length && ctx.initializeEvents();
    }

    return ctx;
  }

  // Extend objects prototypes and properties
  const Extend = (source, object) => Object.assign(Object.create(source), object);

  /*
   * Helper methods
   */
  const Helpers = {

    getCursorPosition(selection) {
      return selection.selectionEnd;
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
      return typeof string === 'string'
        ? string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
        : string;
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
        const characterValidity = mappedPatterns.some(characterPattern =>
          new RegExp(this.escapeRegExp(characterPattern)).test(character));

        if (!characterValidity)
          this.options.onInvalidHandler(`Invalid character ${character}.`, character);

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
      this.events.forEach((event) =>
        this.setListeners(this.elements, event.type, event.handler, true));
    },

    onKeyDownHandler(event) {
      this.cursorBeforeState = this.getCursorPosition(event.target);
    },

    onInputHandler(event) {
      const output = this.maskInput(event.target);
      this.options.onInputHandler(event.target, output);
    },

    onChangeHandler(event) {
      const output = this.maskInput(event.target);
      this.options.onChangeHandler(event.target, output);
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
      this.isMaskComplete(maskOutput) && this.options.onComplete(maskOutput);

      return maskOutput;
    },

    destroyEvents() {
      this.events.forEach((event) =>
        this.setListeners(this.elements, event.type, event.handler, false));
    }
  });

})(window);