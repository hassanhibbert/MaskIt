describe('Basic usage', function () {
  it('should return a masked date string', function () {
    var date = MaskIt('00/00/0000');
    expect(date.mask('11131989'))
      .toBe('11/13/1989');
  });
});
