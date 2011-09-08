var RequestDetail = require('../lib/request_detail');
var FakeRequest = require('./spec_helper').FakeRequest;

describe('RequestDetail', function() {

  it('should record the body as it comes in', function() {
    var request = new FakeRequest('GET', 'http://google.com'); 
    var detail = new RequestDetail(request);
    request.write('hello');
    request.end();
    expect(detail.buffer.toString()).toBe('hello');
  });

  it('should emit "ready" when finished retrieving the request body', function() {
    var request = new FakeRequest('GET', 'http://google.com');
    var detail = new RequestDetail(request);
    var _this = this;
    detail.on('ready', function() {
      _this.called = true;
    });
    request.end(); // trigger
    waitsFor(function() {
      return typeof(_this.called) === 'boolean';
    });
    expect(this.called).toBe(true);
  });

  describe('#host', function() {

    it('should return the proper host', function() {
      var request = new FakeRequest('GET', 'http://google.com');
      var detail = new RequestDetail(request);
      expect(detail.host()).toBe('google.com');
    });

  });

  describe('protocol', function() {

    it('should return the proper protocol', function() {
      var request = new FakeRequest('GET', 'http://google.com');
      var detail = new RequestDetail(request);
      expect(detail.protocol()).toBe('http');
    });

  });

  describe('port', function() {

    it('should return default http port', function() {
      var request = new FakeRequest('GET', 'http://google.com');
      var detail = new RequestDetail(request);
      expect(detail.port()).toBe(80);
    });

    it('should return default https port', function() {
      var request = new FakeRequest('GET', 'https://google.com');
      var detail = new RequestDetail(request);
      expect(detail.port()).toBe(443);
    });

    it('should return the port when it has it explicitly', function() {
      var request = new FakeRequest('GET', 'http://google.com:8080');
      var detail = new RequestDetail(request);
      expect(detail.port()).toBe(8080);
    });

    it('should return nothing for an unknown protocol', function() {
      var request = new FakeRequest('GET', 'ftp://google.com');
      var detail = new RequestDetail(request);
      expect(detail.port()).toBe(undefined);
    });

  });

  describe('method', function() {
    
    it('should return the method', function() {
      var request = new FakeRequest('PUT', 'http://google.com');
      var detail = new RequestDetail(request);
      expect(detail.method()).toBe('PUT');
    });

  });

  describe('path', function() {

    it('should include a basic path', function() {
      var request = new FakeRequest('GET', 'http://google.com/jobs');
      var detail = new RequestDetail(request);
      expect(detail.path()).toBe('/jobs');
    });

    it('should include a hash if given', function() {
      var request = new FakeRequest('GET', 'http://google.com/jobs#one');
      var detail = new RequestDetail(request);
      expect(detail.path()).toBe('/jobs#one');
    });

    it('should include query parameters if given', function() {
      var request = new FakeRequest('GET', 'http://google.com/jobs?q=john#one');
      var detail = new RequestDetail(request);
      expect(detail.path()).toBe('/jobs?q=john#one');
    });

  });

  describe('headers', function() {
   
    it('should return the headers given', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'h1': 'v1' });
      var detail = new RequestDetail(request);
      expect(detail.headers().h1).toBe('v1');
    });

    it('should add the host header', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'h1': 'v1' });
      var detail = new RequestDetail(request);
      expect(detail.headers().host).toBe('google.com');
    });

    it('should override the host header', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'host': 'localhost' });
      var detail = new RequestDetail(request);
      expect(detail.headers().host).toBe('google.com');
    });

    it('should override the host header regardless of original case', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'HOST': 'localhost' });
      var detail = new RequestDetail(request);
      expect(detail.headers().host).toBe('google.com');
    });

    it('should not break when no headers are given', function() {
      var request = new FakeRequest('GET', 'http://google.com');
      var detail = new RequestDetail(request);
      expect(detail.headers().host).toBe('google.com');
    });

  });

  describe('cacheKey', function() {

    var keys = {};

    it('should be computed with a basic url', function() {
      var detail = new RequestDetail(new FakeRequest('GET', 'http://google.com'));
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(undefined);
      keys[cacheKey] = true;
    });

   it('should change based on request method', function() {
      var detail = new RequestDetail(new FakeRequest('PUT', 'http://google.com'));
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(undefined);
      keys[cacheKey] = true;
    });

   it('should change based on body content', function() {
      var request = new FakeRequest('PUT', 'http://google.com');
      var detail = new RequestDetail(request);
      request.write('hello');
      request.end();
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(undefined);
      keys[cacheKey] = true;
    });

    it('should change based on an authorization header', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'authorization': 'abc' });
      var detail = new RequestDetail(request);
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(undefined);
      keys[cacheKey] = true;
    });

    it('should change based on a custom header', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'x-custom': 'abc' });
      var detail = new RequestDetail(request);
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(undefined);
      keys[cacheKey] = true;
    });

    it('should not change based on an if-modified-since header', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'if-modified-since': 'abc' });
      var detail = new RequestDetail(request);
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(true);
    });

    it('should not change based on an if-modified-since header (rgdls of case)', function() {
      var request = new FakeRequest('GET', 'http://google.com', { 'if-modified-SINCE': 'abc' });
      var detail = new RequestDetail(request);
      var cacheKey = detail.cacheKey();
      expect(keys[cacheKey]).toBe(true);
    });

  });

});
