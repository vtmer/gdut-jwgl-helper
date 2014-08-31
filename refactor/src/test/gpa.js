describe('gpa', function () {
    describe('realScore', function () {
        it('should return expected score', function () {
            GPA.realScore('免修').should.equal(95);
            GPA.realScore('优秀').should.equal(95);
            GPA.realScore('良好').should.equal(85);
            GPA.realScore('中等').should.equal(75);
            GPA.realScore('及格').should.equal(65);
            GPA.realScore('不及格').should.equal(0);
            GPA.realScore('').should.equal(0);  // 重修
            GPA.realScore(85).should.equal(85);
        });
    });

    describe('fromScoreOrGradeLevel', function () {
        it('should return expected gpa from score', function () {
            GPA.fromScoreOrGradeLevel(90).should.equal(4);
            GPA.fromScoreOrGradeLevel(85).should.equal(3.5);
            GPA.fromScoreOrGradeLevel(70).should.equal(2);
            GPA.fromScoreOrGradeLevel(60).should.equal(1);
            GPA.fromScoreOrGradeLevel(55).should.equal(0);
            GPA.fromScoreOrGradeLevel(25).should.equal(0);
        });

        it('should return expected gpa from grade level', function () {
            GPA.fromScoreOrGradeLevel('免修').should.equal(4.5);
            GPA.fromScoreOrGradeLevel('优秀').should.equal(4.5);
            GPA.fromScoreOrGradeLevel('良好').should.equal(3.5);
            GPA.fromScoreOrGradeLevel('中等').should.equal(2.5);
            GPA.fromScoreOrGradeLevel('及格').should.equal(1.5);
            GPA.fromScoreOrGradeLevel('不及格').should.equal(0);
            GPA.fromScoreOrGradeLevel('').should.equal(0);  // 重修
        });
    });

    describe('creditGPA', function () {
        it('should return expected credit gpa', function () {
            var mockedLecture = {credit: 3.5, gpa: 3.5};

            GPA.creditGPA(mockedLecture).should.equal(12.25);
        });
    });

    describe('sumCredit', function () {
        it('should return expected credit sum', function () {
            var mockedLectures = [
                {credit: 5.5},
                {credit: 3.5}
            ];

            GPA.sumCredit(mockedLectures).should.equal(9);
        });
    });

    describe('avgScore', function () {
        it('should return expected average score', function () {
            var mockedLectures = [
                { grade: {score: 95} },
                { grade: {score: 85} }
            ];

            GPA.avgScore(mockedLectures).should.equal(90);
        });

        it('should return 0 for empty lectures collection', function () {
            GPA.avgScore([]).should.equal(0);
        });
    });

    describe('avgCreditGPA', function () {
        it('should return expected average credit gpa', function () {
            var mockedLectures = [
                { gpa: 2.3, credit: 4.5 },
                { gpa: 4.5, credit: 3 }
            ];

            GPA.avgCreditGPA(mockedLectures).should.equal(3.18);
        });

        it('should return 0 for empty lectures collection', function () {
            GPA.avgCreditGPA([]).should.equal(0);
        });
    });

    describe('avgWeightedScore', function () {
        it('should return expected average weighted score', function () {
            var mockedLectures = [
                { grade: {score: 90}, credit: 2 },
                { grade: {score: 80}, credit: 3 }
            ];
            
            GPA.avgWeightedScore(mockedLectures).should.equal(84);
        });
        
        it('should return 0 for empty lectures collection', function () {
            GPA.avgWeightedScore([]).should.equal(0);
        });
    });
});
