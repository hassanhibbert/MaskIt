describe('Setup MaskIt', function () {
  it('should initialize a function', function () {
    expect(typeof MaskIt).toBe('function');
    expect(typeof MaskIt('')).toBe('object');
  });
});

describe('Basic masks', function () {
  var simpleMask;

  it('should only return numbers', function () {
    simpleMask = MaskIt('0000');
    expect(simpleMask.mask('1234')).toBe('1234');
    expect(simpleMask.mask('1e3jhhh4iopph')).toBe('134');
    expect(simpleMask.mask('12*45')).toBe('1245');
  });

  it('should update mask pattern on-the-fly', function () {
    simpleMask = MaskIt('000000');
    expect(simpleMask.mask('123456')).toBe('123456');
    expect(simpleMask.mask('123abc7')).toBe('1237');
    expect(simpleMask.mask('12_345a67')).toBe('123456');

    // update on the fly
    simpleMask = MaskIt('000.000');
    expect(simpleMask.mask('123')).toBe('123.');
    expect(simpleMask.mask('123abc7')).toBe('123.7');
    expect(simpleMask.mask('12_245a67')).toBe('122.456');
  });

  it('should format normally when input is the same as mask characters', function () {
    simpleMask = MaskIt('00.00.000');
    expect(simpleMask.mask('00')).toBe('00.');
    expect(simpleMask.mask('00.00')).toBe('00.00.');
    expect(simpleMask.mask('00.00.000')).toBe('00.00.000');
    expect(simpleMask.mask('00.0z.000')).toBe('00.00.00');
  });

});

describe('MaskIt().mask(): Input values with special characters', function () {

  it('should format numbers with phone mask', function () {
    var phoneMask = MaskIt('(000) 000-0000');
    expect(phoneMask.mask('1')).toBe('(1');
    expect(phoneMask.mask('12')).toBe('(12');
    expect(phoneMask.mask('123')).toBe('(123) ');
    expect(phoneMask.mask('1234')).toBe('(123) 4');
    expect(phoneMask.mask('12345')).toBe('(123) 45');
    expect(phoneMask.mask('123456')).toBe('(123) 456-');
    expect(phoneMask.mask('1234567')).toBe('(123) 456-7');
    expect(phoneMask.mask('12345678')).toBe('(123) 456-78');
    expect(phoneMask.mask('123456789')).toBe('(123) 456-789');
    expect(phoneMask.mask('1234567890')).toBe('(123) 456-7890');
  });

  it('should format special characters with phone mask', function() {
    var phoneMask = MaskIt('(000) 000-0000');
    expect(phoneMask.mask('(1')).toBe('(1');
    expect(phoneMask.mask('(123)')).toBe('(123) ');
    expect(phoneMask.mask('(123) 4567')).toBe('(123) 456-7');
    expect(phoneMask.mask('12_34lll56-789')).toBe('(123) 456-789');
    expect(phoneMask.mask('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('should format numbers with date mask', function() {
    var dateMask = MaskIt('00/00/0000');
    expect(dateMask.mask('0')).toBe('0');
    expect(dateMask.mask('12')).toBe('12/');
    expect(dateMask.mask('12345678')).toBe('12/34/5678');
    expect(dateMask.mask('1234567890')).toBe('12/34/5678');
    expect(dateMask.mask('12/34/56/78/90')).toBe('12/34/5678');
  });

  it('should format mixed characters and numbers with mask', function() {
    var mixMask = MaskIt('AA-00-A0A0.00');
    expect(mixMask.mask('ab')).toBe('ab-');
    expect(mixMask.mask('abcdef')).toBe('ab-');
    expect(mixMask.mask('ab09')).toBe('ab-09-');
    expect(mixMask.mask('ab09kk0')).toBe('ab-09-k0');
    expect(mixMask.mask('ab09kk0a433')).toBe('ab-09-k0a4.33');
  });
});

describe('Mask({options})', function () {

  it('should mask a value with custom mask characters', function() {

    var customMask = MaskIt('$$/$$/$$$$', '', {
      maskDefinitions: {
        '$': { pattern: /\d/ }
      }
    });

    expect(customMask.mask('1234')).toBe('12/34/');
    expect(customMask.mask('12345678')).toBe('12/34/5678');
    expect(customMask.mask('1d3r5678')).toBe('13/56/78');
  });

  // onComplete

  var dateMask, completedValue, error = [];
  beforeEach(function() {
    dateMask = MaskIt('00/00/0000', '', {
      onComplete: function (element, value) {
        completedValue = value;
      },
      onInvalidHandler: function (errorMessage, incorrectValue) {
        error.push(incorrectValue);
      }
    });
    spyOn(dateMask.options, 'onComplete').and.callThrough();
    spyOn(dateMask.options, 'onInvalidHandler').and.callThrough();
    dateMask.mask('12345678');
    dateMask.mask('1a3r567');
  });

  it("onComplete() should be called", function() {
    expect(dateMask.options.onComplete).toHaveBeenCalled();
  });

  it("onComplete() should be called 1 time", function() {
    expect(dateMask.options.onComplete).toHaveBeenCalledTimes(1);
  });

  it("onComplete() value should be 12/34/5678", function() {
    expect(completedValue).toEqual('12/34/5678');
  });

  it("onInvalidHandler() should be called 2 times", function() {
    expect(dateMask.options.onInvalidHandler).toHaveBeenCalledTimes(2);
  });

  it("callback onInvalidHandler caught errors should be 'a' and 'r' ", function() {
    expect(error[0]).toEqual('a');
    expect(error[1]).toEqual('r');
  });
});

// TODO: setup dom testing
describe('MaskIt() Dom element', function () {
  var inputs = [];
  beforeEach(function () {
    inputs = fixture.set('<input id="firstName" name="firstName" value="Hello World">');
  });
  it('should do something', function () {
    expect(inputs[0].value).toBe('Hello World');
  });
});
