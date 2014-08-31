describe('page', function () {
    var testCallback = function () { return 'test callback'; };

    describe('on', function () {
        it('should return page for chain usage', function () {
            var page = new Page;
            page.on('test-page', testCallback).should.exactly(page);
        });

        it('should support regex pattern', function () {
            var page = new Page;
            page.on(/test-page/, testCallback).should.exactly(page);
            page.run('test-page').should.be.true;
        });

        it('should support string pattern', function () {
            var page = new Page;
            page.on('test-page', testCallback).should.exactly(page);
            page.run('test-page').should.be.true;
        });
    });


    describe('run', function () {
        it('should return true for matched successfully', function () {
            var page = new Page;
            page.on('test-page', testCallback).should.exactly(page);
            page.run('test-page').should.be.true;
        });
        
        it('should return false for matched failed', function () {
            var page = new Page;
            page.on('test-page', testCallback).should.exactly(page);
            page.run('another-test-page').should.be.false;
        });
    });

});
