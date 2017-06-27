/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

// Polyfill
if (!Math.sign) {
  Math.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  };
}

const Utils = {
  getCursorPosition(selection) {
    let position = 0;
    const selectStart = selection.selectionStart;
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

class MaskIt {
  constructor(maskPattern, options = {}) {

    this.maskDefinitions = {
      0: { pattern: /\d/ },
      A: { pattern: /[a-zA-Z]/ },
      Z: { pattern: /[a-zA-Z0-9]/ },
    };
    const defaults = {
      element: null,
      maskDefinitions: null,
      onInputHandler: null,
      onChangeHandler: null,
      onInvalidCharacter: null,
      onComplete: null
    };

    this.cursorBeforeState;

    this.events = [
      { type: 'input', handler: this.onInputHandler.bind(this) },
      { type: 'change', handler: this.onChangeHandler.bind(this) },
      { type: 'keydown', handler: this.onKeyDownHandler.bind(this) }
    ];

    this.options = Object.assign(defaults, options);

    if (this.options.maskDefinitions) {
      this.maskDefinitions = Object.assign(this.maskDefinitions, this.options.maskDefinitions);
    }

    this.maskPatterns = [...maskPattern];

    if (this.options.element) {
      this.elements = Utils.getElementList(this.options.element);
      this.initializeEvents();
    }
  }

  initializeEvents() {
    this.events.forEach((event) => {
      Utils.setListeners(this.elements, event.type, event.handler, true);
    });
  }

  destroy() {
    this.events.forEach((event) => {
      Utils.setListeners(this.elements, event.type, event.handler, false);
    });
  }

  isMaskComplete(currentOutput) {
    return this.maskPatterns.length === currentOutput.length;
  }

  onKeyDownHandler(event) {
    this.cursorBeforeState = Utils.getCursorPosition(event.target);
  }

  onInputHandler(event) {
    const output = this.maskInput(event.target);
    if (this.options.onInputHandler) {
      this.options.onInputHandler({ output, event });
    }
  }

  onChangeHandler(event) {
    if (this.options.onChangeHandler) {
      const output = this.maskInput(event.target);
      this.options.onChangeHandler({ output, event });
    }
  }

  unmask(string = '') {
    const stringParts = string.split('');
    const removedDuplicatePatterns = this.removeDuplicatesPatterns(this.maskPatterns);
    const mappedPatterns = this.mapPatternToMaskDefinitions(removedDuplicatePatterns);

    const unmaskedCharacters = stringParts.filter((character) => {
      const characterValidity = mappedPatterns
        .some(characterPattern => new RegExp(Utils.escapeRegExp(characterPattern)).test(character));

      if (this.options.onInvalidCharacter && !characterValidity)
        this.options.onInvalidCharacter({ invalidCharacter: character });

      return characterValidity;
    });
    return unmaskedCharacters.join('');
  }

  removeDuplicatesPatterns(maskDefinitions) {
    return maskDefinitions.reduce((reducedList, maskDefinition) => {
      if (reducedList.indexOf(maskDefinition) < 0) reducedList.push(maskDefinition);
      return reducedList;
    }, []);
  }

  getPatternsForMask() {
    return this.maskPatterns.reduce((maskPattern, key) => {
      const maskDefinition = this.maskDefinitions[key];
      const patternNotInList = maskDefinition && maskPattern.indexOf(maskDefinition.pattern) < 0;
      if (patternNotInList) maskPattern.push(maskDefinition.pattern);
      return maskPattern;
    }, []);
  }

  mapPatternToMaskDefinitions(maskPatterns) {
    return maskPatterns.map((key) => {
      const maskDefinition = this.maskDefinitions[key];
      return maskDefinition ? maskDefinition.pattern : key;
    });
  }

  calculateCursorPosition(cursorPosition, inputLength, maskLength) {
    const inputOutputDiff = maskLength - inputLength;
    const updatedCursorPosition = cursorPosition + inputOutputDiff;
    const backspaceDetected = this.cursorBeforeState > cursorPosition && inputOutputDiff === 1
      || Math.sign(inputOutputDiff) < 0;
    const newCursorPosition = updatedCursorPosition > 1  ? updatedCursorPosition : cursorPosition;
    return backspaceDetected ? cursorPosition : newCursorPosition;
  }

  mask(string = '') {
    const patternMappedToMask = this.mapPatternToMaskDefinitions(this.maskPatterns);
    const unmaskedCharacters = [...this.unmask(string)];
    const mask = [];

    for (let position = 0; position < patternMappedToMask.length; position += 1) {
      const pattern = patternMappedToMask[position];
      const character = unmaskedCharacters[position];
      const characterRegExp = new RegExp(Utils.escapeRegExp(pattern), 'g');

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
  }

  maskInput(element) {
    const input = element;
    const maskOutput = this.mask(input.value);
    const cursorPosition = Utils.getCursorPosition(input);
    const inputLength = input.value.length;
    const maskLength = maskOutput.length;
    const newPosition = this.calculateCursorPosition(cursorPosition, inputLength, maskLength);
    if (!inputLength) return '';
    input.value = maskOutput;
    Utils.setCursorPosition(input, newPosition);
    return maskOutput;
  }
}
