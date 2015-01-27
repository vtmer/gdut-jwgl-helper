// ## 页面地址路由
//
// ```javascript
// var page = new Page;
//
//  // 挂载预先运行回调
//  page.before(function () {
//      console.log('Allo!');
//  });
//
//  // 挂载对应页面的回调
//  page.on('/a/page/that/i/will/edit', function () {
//      console.log('in page: a-page-that-i-will-edit');
//  });
//
//  // 通过正则来进行匹配
//  page.on(/regex\/([\w]+)/, function (matched) {
//      console.log('in page: ' + matched);
//  });
//
//  // 如果当前页面地址为: http://example.com/a/page/that/i/will/edit
//  // 显示: `in page: a-page-that-i-will-edit`;
//  // 如果当前页面地址为: http://example.com/regex/hello-world
//  // 显示: `in page: hello-world`。
//  page.run();
//
// ```
function Page() {
    // 预先运行的回调函数组
    this._beforeRoutes = [];

    // 回调函数组
    this._routes = {};
}

// 注册一个预先运行的回调函数
Page.prototype.before = function (callback) {
    this._beforeRoutes.push(callback);

    return this;
};

// 注册一个回调函数
Page.prototype.on = function (pattern, callback) {
    var compiledPattern;

    if (this._routes[pattern] === undefined) {
        if (pattern instanceof RegExp) {
            compiledPattern = pattern;
        } else {
            compiledPattern = new RegExp('^' + pattern + '$');
        }

        this._routes[pattern] = {
            compiled: compiledPattern,
            callbacks: []
        };
    }

    this._routes[pattern].callbacks.push(callback);

    return this;
}

// 进行匹配、运行对应回调函数
Page.prototype.run = function (url) {
    // 默认使用不带最开始 back slash 的 `location.pathname`
    if (url === undefined) {
        url = location.pathname.slice(1, location.pathname.length);
    }

    // 执行预先运行的回调函数组
    for (var i = 0; i < this._beforeRoutes.length; i++) {
        this._beforeRoutes[i]();
    }

    // 检查是否有满足条件的回调函数
    var matchedParts,
        foundMatched = false;

    for (var pattern in this._routes) {
        matchedParts = this._routes[pattern].compiled.exec(url);

        // 找到匹配的，执行已注册的回调函数
        if (matchedParts !== null) {
            foundMatched = true;
            
            matchedParts.shift();

            this._routes[pattern].callbacks.forEach(function (callback) {
                callback.apply(matchedParts);
            });
        }
    }

    return foundMatched;
};


// ## GPA 计算器
var GPA = {
    // 等级对应成绩
    //
    // - 免修、优秀： 95
    // - 良好：85
    // - 中等：75
    // - 及格：65
    // - 不及格： 0
    // - 重修：0
    realScore: function (score) {
        if (score === '免修') return 95;
        else if (score === '优秀') return 95;
        else if (score === '良好') return 85;
        else if (score === '中等') return 75;
        else if (score === '及格') return 65;
        else if (score === '不及格') return 0;
        // 没有填写的情况当作 0 （出现在重修栏）
        else if (score === '') return 0;
        else return parseFloat(score);
    },

    // 从分数或等级计算绩点
    //
    // 绩点计算公式：
    //      
    //      GPA = (s - 50) / 10         (s >= 60)
    //            0                     (s < 60)
    fromScoreOrGradeLevel: function (score) {
        score = GPA.realScore(score);

        return (score < 60) ? 0 : ((score - 50) / 10);
    },

    // 计算一门课程的学分绩点
    //
    // 计算公式：
    //      
    //      CreditGPA = Credit * GPA      
    creditGPA: function (lecture) { return lecture.credit * lecture.gpa },

    // 计算若干门课程的总绩点
    sumCredit: function (lectures) {
        return lectures.reduce(function (sum, lecture) {
            return sum + lecture.credit;
        }, 0);
    },

    // 计算若干门课程的平均分
    avgScore: function (lectures) {
        if (lectures.length === 0) {
            return 0;
        }

        return lectures.reduce(function (sum, lecture) {
            return sum + GPA.realScore(lecture.grade.score);
        }, 0) / lectures.length;
    },

    // 计算若干门课程的平均学分绩点
    avgCreditGPA: function (lectures) {
        if (lectures.length === 0) {
            return 0;
        }

        var sumCreditGPA = lectures.reduce(function (sum, lecture) {
            return sum + GPA.creditGPA(lecture);
        }, 0);

        return sumCreditGPA / GPA.sumCredit(lectures);
    },

    // 计算若干门课程的加权平均分
    avgWeightedScore: function (lectures) {
        if (lectures.length === 0) {
            return 0;
        }

        var sumWeighedScore = lectures.reduce(function (sum, lecture) {
            return sum + lecture.credit * GPA.realScore(lecture.grade.score);
        }, 0);

        return sumWeighedScore / GPA.sumCredit(lectures);
    }
};

// ## 课程成绩记录定义
// 
// * code        :  课程代码
// * name        :  课程名称
// * type        :  课程性质（公共基础？专业基础？）
// * attribution :  课程归属（人文社科？工程基础？）
// * is_minor    :  是否是辅修专业课？
// * grade:
//    - score    :  课程成绩
//    - makeup   :  补考成绩
//    - rework   :  重修成绩
// * credit      :  学分
// * gpa         :  绩点
function Lecture() {
    this.code = null;
    this.name = null;
    this.type = null;
    this.attribution = null;
    this.isMinor = false;
    this.credit = 0.0;
    this.grade = {
        score: 0.0,
        makeup: 0.0,
        rework: 0.0
    };
    this.gpa = 0.0;
}

// 从 `table tr` 中获取一个课程信息
Lecture.fromTableRow = function (row) {
    var _t, _f, _p;

    var _parseText = _t = function (x) { return $(x).text().trim() ;},
        _parseFloatOrText = _f = function (x) {
            var parsedText = _parseText(x),
                parsedFloat = parseFloat(parsedText);
            
            return isNaN(parsedFloat) ? parsedText : parsedFloat;
        };

    var $cols = $('td', row),
        lecture = new Lecture,
        _takeFromRows = _p = function (idx, parser) { return parser($cols[idx]); }

    lecture.code = _p(0, _t);
    lecture.name = _p(1, _t);
    lecture.type = _p(2, _t);
    lecture.grade.score = _p(3, _f) || 0.0;
    lecture.attribution = _p(4, _t);
    lecture.grade.makeup = _p(5, _f) || 0.0;
    lecture.grade.rework = _p(6, _f) || 0.0;
    lecture.credit = _p(7, _f);
    lecture.isMinor = _p(8, _t) === '1';
    lecture.gpa = GPA.fromScoreOrGradeLevel(lecture.grade.score);

    return lecture;
};

// 从 `table` 中获取一系列课程信息
Lecture.fromRows = function (rows) {
    return $.map(rows, Lecture.fromTableRow);
};


// ## 评价生成器
var RatingMaker = {
    // 创建一个包含 n 个**不全部**相同元素的序列
    // 取值范围为： [lo, hi) 间的整数
    makeSequenceBetween: function (n, lo, hi) {
        // 确保生成序列中的元素不全部相同
        if (n <= 1) return [];
        if (lo >= hi - 1) return [];

        var length = hi - lo,
            seq = [],
            x;

        for (var i = 0; i < n; i++) {
            // 生成一个在 [lo, hi - 1] 范围内的整数
            x = Math.floor(Math.random() * length) + lo;
            seq.push(x);
        }

        return seq;
    }
};


// ## 助手部分

var page = new Page;

// ### 检查是否为 `Object moved` 页
page.before(function () {
    var isObjectMoved = $('body h2').text().search('Object moved') !== -1;

    // 重定向到首页登录页
    if (isObjectMoved) {
        location.href = 'http://' + location.host;
    }
});


// ### 登录页
page.on('default2.aspx', function () {});


// ### 成绩页面

// 计算 GPA
page.on('xscj.aspx', function () {
    // 页面元素
    var $infoRows = $('#Table1 tbody'),
        $scoreTable = $('#DataGrid1'),
        $scoreTableHead = $('#DataGrid1 .datelisthead'),
        $scoreRows = $('#DataGrid1 tr').not('.datelisthead');


    // 课程信息
    var lectures = Lecture.fromRows($scoreRows);


    // 插入汇总栏: 平均绩点、平均分、加权平均分
    var $avgCell = $('<tr></tr>').appendTo($infoRows),
        $avgGPA = $('<td class="avg-gpa"></td>').appendTo($avgCell),
        $avgScore = $('<td class="avg-score"></td>').appendTo($avgCell),
        $weightedAvgScore = $('<td class="weighted-avg-score"></td>').appendTo($avgCell);


    // 插入各行汇总栏: 绩点、学分绩点、是否加入计算
    
    // 表头
    $('<td>绩点</td>').appendTo($scoreTableHead);
    $('<td>学分绩点</td>').appendTo($scoreTableHead);
    $('<td>全选 <input type="checkbox" class="lecture-check-all" /></td>').appendTo($scoreTableHead);

    // 各行
    var rowCellsTmpl = [
        '<td class="gpa"></td>',
        '<td class="credit-gpa"></td>',
        '<td ><input type="checkbox" class="lecture-check"></input></td>'
    ];
    $(rowCellsTmpl.join('')).appendTo($scoreRows);

    $scoreRows.each(function (i, row) {
        var $row = $(row),
            lecture = lectures[i];

        $row.find('.gpa').text(lecture.gpa.toFixed(2));
        $row.find('.credit-gpa').text(GPA.creditGPA(lecture).toFixed(2));
    });


    // 重新计算汇总成绩
    var renderSummarize = function (lectures) {
        var checkedRows = $('.lecture-check:checked').parent().parent(),
            l = Lecture.fromRows(checkedRows);

        $avgGPA.text('平均绩点: ' + GPA.avgCreditGPA(l).toFixed(2));
        $avgScore.text('平均分: ' + GPA.avgScore(l).toFixed(2));
        $weightedAvgScore.text('加权平均分: ' + GPA.avgWeightedScore(l).toFixed(2));
    };

    // 绑定各栏的勾选事件
    $scoreRows.click(function (e) {
        var $checkbox = $(this).find('input');

        // 反转勾选状态
        $checkbox.prop('checked', !$checkbox.prop('checked'));

        // 触发重新计算汇总栏
        renderSummarize();
    });

    $('.lecture-check-all').change(function () {
        // 同步勾选状态
        $('.lecture-check').prop('checked', $('.lecture-check-all').is(':checked'));

        // 触发重新计算汇总栏
        renderSummarize();
    });

    // 手动标记为全选
    $('.lecture-check-all').prop('checked', true).trigger('change');
});


// 记录成绩情况
page.on('xscj.aspx', function () {
});


// ### 评价页面
page.on('xsjxpj.aspx', function() {
    var $btnsGroup = $($('td')[1]),
        $selections = $('#trPjs select, #trPjc select'),
        $btnSave = $('#Button1');

    // 创建一个评价按钮
    //
    // 其中：
    // - text: 按钮文字
    // - choiceMake: 选项选择回调函数，接受一个 $selections 选项
    var makeBtn = function (text, choiceMaker) {
        var $btn = $('<input type="button" />');

        $btn.val(text).css('margin', '5px');

        $btn.click(function (e) {
            choiceMaker($selections);

            $btnSave.click();
        });

        $btn.appendTo($btnsGroup);

        return $btn;
    };

    makeBtn('老师我爱你', function ($choices) {
        var seq = RatingMaker.makeSequenceBetween($choices.length, 1, 3);

        for (var i = 0; i < seq.length; i++) {
            $choices[i].selectedIndex = seq[i];
        }
    });

    makeBtn('老师我恨你', function ($choices) {
        var seq = RatingMaker.makeSequenceBetween($choices.length, 4, 6);

        for (var i = 0; i < seq.length; i++) {
            $choices[i].selectedIndex = seq[i];
        }
    });

    makeBtn('老师祝你好运吧！(和谐版)', function ($choices) {
        var seq = RatingMaker.makeSequenceBetween($choices.length, 1, 4);

        for (var i = 0; i < seq.length; i++) {
            $choices[i].selectedIndex = seq[i];
        }
    });

    makeBtn('老师祝你好运吧！(凶残版)', function ($choices) {
        var seq = RatingMaker.makeSequenceBetween($choices.length, 3, 6);

        for (var i = 0; i < seq.length; i++) {
            $choices[i].selectedIndex = seq[i];
        }
    });
});


// ### 莫名其妙错误页 _(:з」∠)_
page.on('zdy.htm', function() {
    location.href = 'http://' + location.host;
});


page.run();
