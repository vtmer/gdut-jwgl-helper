describe('lecture', function () {
    var $table = $('#lectures-table-sample table');

    describe('fromTableRow', function () {
        it('should return expected lecture.', function () {
            var lecture = Lecture.fromTableRow($table.first());

            lecture.code.should.equal('24100735');
            lecture.name.should.equal('计算机组成原理');
            lecture.type.should.equal('专业基础课');
            lecture.attribution.should.equal('');
            lecture.grade.score.should.equal(96);
            lecture.grade.makeup.should.equal(0);  // 我不挂科 =,=
            lecture.grade.rework.should.equal(0);
            lecture.credit.should.equal(3.5);
            lecture.isMinor.should.false;
        });
    });

    describe('fromRows', function () {
        it('should return expected lectures.', function () {
            var lectures = Lecture.fromRows($table.find('tr').not('.datelisthead'));

            lectures.should.have.a.lengthOf(5);
        });
    });
});
