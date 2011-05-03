describe("SearchQuery", function() {
  it("should have q param", function() {
    query = new SearchQuery({q: 'ipad'});
    expect(query.get('q')).toEqual('ipad');
  });
});
