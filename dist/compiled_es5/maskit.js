'use strict';

/*
 * MaskIt: A JavaScript masking tool
 * By Hassan Hibbert <http://hassanhibbert.com/>
 * Copyright 2016 - 2017 Hassan Hibbert, under the MIT License
 * <https://opensource.org/licenses/mit-license.php/>
 */

HTMLElement.prototype.MaskIt = function (maskPattern, options) {

	this.maskValue = '';
	this.maskPattern = maskPattern.split('');
	this.maskElement = this;
	this.maskDefinitions = {
		'0': { pattern: /\d/ },
		'A': { pattern: /[a-zA-Z]/ },
		'Z': { pattern: /[a-zA-Z0-9]/ }
	};

	this.defaults = {
		maskOnInput: true,
		maskOnChange: false,
		onInvalidHandler: null,
		onInputHandler: null,
		onChangeHandler: null,
		onComplete: null,
		maskDefinitions: null
	};

	this.init = function () {
		this.setOptions();
		this.initializeEvents();
	};

	this.setOptions = function () {
		this.options = this.isObject(options) ? this.extend(this.defaults, options) : this.defaults;

		if (this.options.maskDefinitions) {
			this.extend(this.maskDefinitions, this.options.maskDefinitions);
		};
	};

	this.initializeEvents = function () {
		this.options.maskOnChange && this.setListeners(this.maskElement, 'change', this.events.onChangeHandler, true);
		this.options.maskOnInput && this.setListeners(this.maskElement, 'input', this.events.onInputHandler, true);
	};

	this.mask = function (value) {

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

		for (var index = 0, length = maskPattern.length; index < length; index += 1) {

			maskItem = maskPattern[index];
			validDefinitionKeys = maskDefinitionKeys.indexOf(maskItem) < 0;
			isItemDuplicate = maskItem === valueParts[index];
			valueLength = valueParts.length;

			if (maskItem && validDefinitionKeys && index < valueLength) {

				// add mask item
				!isItemDuplicate && valueParts.splice(index, 0, maskItem);
			} else if (valueParts[index] && maskDefinition[maskItem] && !maskDefinition[maskItem].pattern.test(valueParts[index])) {
				message = 'The character ' + valueParts[index] + ' does not match this pattern: ' + maskDefinition[maskItem].pattern;

				// Error handling option
				if (this.isFunction(this.options.onInvalidHandler)) {
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
		if (this.isFunction(this.options.onComplete) && valueParts.length === maskPattern.length) {
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
	};

	this.destroyEvents = function destroyEvents() {
		this.removeListeners.call(this);
	};

	this.removeListeners = function () {
		this.options.maskOnChange && this.setListeners(this.maskElement, 'change', this.events.onChangeHandler, false);
		this.options.maskOnInput && this.setListeners(this.maskElement, 'input', this.events.onInputHandler, false);
	};

	this._onChangeHandler = function (event) {
		event.preventDefault();

		if (this.options.onChangeHandler) {
			this.options.onChangeHandler.call(null, event.target, this.mask(event.target.value));
		} else {
			event.target.value = this.mask(event.target.value);
		}
	};

	this._onInputHandler = function (event) {
		event.preventDefault();

		// Info before caret position is changed
		var lengthBefore = this.maskValue.length,
		    caretPositionBefore = this.getCaretPosition(event.target),
		    lengthAfter,
		    caretPosition;

		if (this.options.onInputHandler) {} else {
			event.target.value = this.mask(event.target.value);

			// Update caret position
			lengthAfter = event.target.value.length;
			caretPosition = lengthBefore < lengthAfter && event.target.value.charAt(caretPositionBefore + 1).trim() === '' ? caretPositionBefore + 1 : caretPositionBefore;
			this.setCaretPosition(event.target, caretPosition);
		}
	};

	this.getCaretPosition = function (selection) {
		if (selection.selectionStart) {
			var pos = 0,
			    selectStart = selection.selectionStart;
			if (selectStart || selectStart === 0) {
				pos = selectStart;
			}
			return pos;
		}
	};

	this.setCaretPosition = function (selection, pos) {
		if (selection.setSelectionRange) {
			selection.focus();
			selection.setSelectionRange(pos, pos);
		}
	};

	// utils
	this.extend = function (source, properties) {
		var property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	};

	this.isObject = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	this.isFunction = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Function]';
	};

	this.setListeners = function (element, events, eventHandler, remove) {
		var method = (remove ? 'add' : 'remove') + 'EventListener';

		element[method](events, eventHandler, false);
	};

	// events and init
	this.events = {
		onChangeHandler: this._onChangeHandler.bind(this),
		onInputHandler: this._onInputHandler.bind(this)
	};

	this.init();
};