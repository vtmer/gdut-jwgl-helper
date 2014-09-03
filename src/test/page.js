describe('page', function () {
    var testCallback = function () { return 'test callback'; };

    describe('before', function () {
        it('should return page for chain usage', function () {
            var page = new Page;
            page.before(testCallback).should.exactly(page);
        });

        it('should run every time', function () {
            var page = new Page,
                outsider = 41,
                updateOutsider = function () { outsider += 1; };

            page.before(updateOutsider);
            page.run('some-where');

            outsider.should.equal(42);
        });
    });

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
