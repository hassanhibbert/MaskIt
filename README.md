# MaskIt

A javaScript tool to apply a predefined mask to an input field.

## Demo & Examples

http://hassanhibbert.github.io/maskit/

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

Using callbacks

```javascript
MaskIt('00:00:0000', '#time', {

  onInvalidHandler: function(errorMessage, incorrectValue, maskPattern) {
    console.log(errorMessage);
  },
  
  // This callback fires everytime the value of the input field changes
  onInputHandler: function(element, maskedValue) {
    console.log('Input changed: ', element, ' Masked value: ', maskedValue);
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
MaskIt('(000) 000-0000').mask(4075555555); // (407) 555-5555
```

##Compatibility

- Chrome 7+
- Firefox 4+
- IE9+
- Safari 5.1+
- Opera 12+
