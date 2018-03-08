# MaskIt [![Build Status](https://travis-ci.org/hassanhibbert/MaskIt.svg?branch=master)](https://travis-ci.org/hassanhibbert/MaskIt)


A JavaScript tool to apply a predefined mask to an input field.

## Demo & Examples

http://hassanhibbert.github.io/maskit/

## Installation

You can download MaskIt with bower by running: 
`bower install mask-it --save`

## Setup 

Load the script in your page

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MaskIt</title>
</head>
<body>
<input type="text" id="date"/>
<script src="maskit.min.js"></script>
</body>
</html>
```

## Usage

Basic usage

```javascript
MaskIt('00/00/0000', '#date');
```

Passing an html element instead of selector

```javascript
var dateInput = document.querySelector('#date');
MaskIt('00/00/0000', dateInput);
```

Using different listeners. Default: `maskOnInput = true`
> DEPRECATED: Options to mask element on-input and on-change events

```javascript
MaskIt('(000) 000-0000', '#phone', {
  maskOnChange: true,
  maskOnInput: false
});
```

Using callbacks

```javascript
MaskIt('00:00:00', '#time', {

  onInvalidHandler: function(errorMessage, incorrectValue) {
    console.log(errorMessage);
  },
  
  // This callback fires everytime the value of the input field changes
  onInputHandler: function(element, maskedValue) {
    console.log('Input changed: ', element, ' Masked value: ', maskedValue);
  },
  
  onChangeHandler: function(element, maskedValue) {
    console.log('Change event: ', maskedValue);
  },
  
  onComplete: function(maskedValue) {
    console.log('Complete! ', maskedValue);
  }
});
```

Destroying events

```javascript
var date = MaskIt('00/00/0000', '#date');

// Later destroy the event listeners
date.destroyEvents();
```

Using the mask method

```javascript
MaskIt('00/00/0000').mask('05231995'); // 05/23/1995
MaskIt('(000) 000-0000').mask('4075555555'); // (407) 555-5555
```

Using your own mask definition

```javascript
MaskIt('$$/$$/$$$$', '#date', {
  maskDefinitions = {
    '$': { pattern: /\d/ } 
  }
})
```

Combine different mask definitions

```javascript
MaskIt('AAA-000-AAA-00', '#mixed-pattern'); // abc-123-efg-45
```

##Compatibility

- Chrome 7+
- Firefox 4+
- IE9+
- Safari 5.1+
- Opera 12+
