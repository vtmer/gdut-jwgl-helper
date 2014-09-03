describe('RatingMaker', function () {
    describe('makeSequenceBetween', function () {
        it('should return non-all-same sequence', function () {
            var seq = RatingMaker.makeSequenceBetween(5, 1, 3),
                isAllSame = true;

            for (var i = 1; i < seq.length; i++) {
                if (seq[i] !== seq[i - 1]) {
                    isAllSame = false;
                    break;
                }
            }

            isAllSame.should.be.false;
        });

        it('should return elements in range [lo, hi)', function () {
            var lo = 1, hi = 3,
                seq = RatingMaker.makeSequenceBetween(100000, lo, hi);

            for (var i = 0; i < seq.length; i++) {
                seq[i].should.be.within(lo, hi - 1);
            }
        });

        it('should return n elements', function () {
            var n = 500,
                seq = RatingMaker.makeSequenceBetween(n, 1, 5);
            
            seq.length.should.equal(n);
        });

        it('should return empty seq when n is 1', function () {
            RatingMaker.makeSequenceBetween(1, 1, 5).should.be.empty;
        });

        it('should return empty seq when lo is gte hi - 1', function () {
            RatingMaker.makeSequenceBetween(100, 1, 2).should.be.empty;
        });
    });
});
