// ==UserScript==
// @name        GDUT 教务管理系统 helper
// @namespace   https://github.com/vtmer/gdut-jwgl-helper
// @version     0.2.0
// @description	make jwgl.gdut.edu.cn better.
// @match       http://jwgl.gdut.edu.cn/*
// @match       http://jwgldx.gdut.edu.cn/*	
// @match       http://222.200.98.201/*
// @match       http://222.200.98.204/*
// @match       http://222.200.98.205/*
// @match       http://222.200.98.206/*
// @copyright   2013, VTM STUDIO
// @require     http://cdn.staticfile.org/jquery/2.1.1-rc2/jquery.min.js
// ==/UserScript==

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
            // 生成一个在 [0, length] 范围内的整数
            x = Math.floor(Math.random() * length);

        for (var i = 0; i < n; i++) {
            seq.push(x + lo);
            x = (x + 1) % length;
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

// ### 学生个人课表
page.on('xskbcx.aspx', function() {
    if (!Date.prototype.toISOString) {
        (function() {

            function pad(number) {
                if (number < 10) {
                    return '0' + number;
                }
                return number;
            }

            Date.prototype.toISOString = function() {
                return this.getUTCFullYear() +
                    '-' + pad(this.getUTCMonth() + 1) +
                    '-' + pad(this.getUTCDate()) +
                    'T' + pad(this.getUTCHours()) +
                    ':' + pad(this.getUTCMinutes()) +
                    ':' + pad(this.getUTCSeconds()) +
                    '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                    'Z';
            };

        }());
    }

    function addDays(date, days) {
        date.setDate(date.getDate() + days);
    }

    function getTime(order) {
        var arr = [],
            start = ["8:30", "9:20", "10:25", "11:15", "13:50", "14:40", "15:30", "16:30", "17:20", "18:30", "19:20", "20:10"],
            end = ["9:15", "10:05", "11:10", "12:00", "14:35", "15:25", "16:15", "17:15", "18:05", "19:15", "20:05", "20:55"];
        arr.push(start[order[0] - 1]);
        arr.push(end[order[order.length - 1] - 1]);
        return arr;
    }

    function getCourseDate(startDay, weekOffset, dayOffset) {
        var courseDate = new Date(startDay);
        addDays(courseDate, dayOffset);
        addDays(courseDate, weekOffset * 7);
        return courseDate;
    }

    function stringifyDate(date) {
        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate());
    }

    function getCourseTime(startDay, weekOffset, dayOffset, time) {
        var date = getCourseDate(startDay, weekOffset, dayOffset),
            t = time.split(':');
        date.setHours(t[0], t[1]);
        return date.toISOString().replace(/\.\d\d\d/, "").replace(/[-:]/g, "");
    }

    /**
     * data 的元素也是数组
     *   0:"数字逻辑与系统设计"  // 课程名称
     *   1:"周一第3,4节{第1-4周}"// 上课时间
     *   2:"xxx"                 // 老师
     *   3:"教3-412"             // 上课地点
     *   4:"2016年12月27日(14:00-16:00)" // 课程考试时间
     *   5:"教2-314"                     // 课程考试地点
     */
    function getData() {
        var table = document.getElementById("Table1"),
            data = [];

        for (var i = 2; i < 12; i++) {
            var row = table.rows[i],
                length = row.cells.length;
            if (length < 4) continue;

            for (var j = 1; j < length; j++) {
                var cell = row.cells[j].innerHTML;
                if (cell.length < 40) continue;
                var arrs = cell.split(/<br[^<]*><br[^<]*>/);

                for (var k = 0; k < arrs.length; k += 1) {
                    var e = arrs[k].split(/<br[^<]*>/);
                    data.push(e);
                }
            }
        }
        return data;
    }

    function getCSV(startDay) {
        var data = getData(),
            result = "Subject,Start Date,Start Time,End Date,End Time,Location\n";

        for (var i = 0; i < data.length; i++) {
            var when = data[i][1],
                dayOffset = "一二三四五六日".indexOf(when.charAt(1)),         /* 课程在一周内的偏移 */
                classOrder = when.match(/第.*节/)[0].slice(1, -1).split(','), /* 节次 */
                time = getTime(classOrder),                                   /* 上课和下课时间 */
                weeks = when.match(/{.*}/)[0].slice(2, -2).split('-');        /* 周次 */

            for (var weekOffset = weeks[0] - 1; weekOffset < weeks[1]; weekOffset++) {
                var arr = [],
                    date = stringifyDate(getCourseDate(startDay, weekOffset, dayOffset));

                arr.push(data[i][0]);
                arr.push(date);
                arr.push(time[0]);
                arr.push(date);
                arr.push(time[1]);
                arr.push(data[i][3]);
                result += arr.join(',') + '\n';
            }
        }
        return result;
    }

    function getICS(startDay) {
        var data = getData(),
            result = "BEGIN:VCALENDAR\n" +
                "PRODID:-//vtmer/gdut-jwgl-helper//Calendar 1.0//EN\n" +
                "VERSION:2.0\n" +
                "CALSCALE:GREGORIAN\n" +
                "METHOD:PUBLISH\n" +
                "X-WR-CALNAME:课程表\n" +
                "X-WR-TIMEZONE:Asia/Shanghai\n";

        for (var i = 0; i < data.length; i++) {
            var when = data[i][1],
                dayOffset = "一二三四五六日".indexOf(when.charAt(1)),         /* 课程在一周内的偏移 */
                classOrder = when.match(/第.*节/)[0].slice(1, -1).split(','), /* 节次 */
                time = getTime(classOrder),                                   /* 上课和下课时间 */
                weeks = when.match(/{.*}/)[0].slice(2, -2).split('-'),
                weekOffset = weeks[0] - 1,                                    /* 首次上课的周次偏移 */
                count = weeks[1] - weeks[0] + 1,                              /* 上课周数 */
                day = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][dayOffset];

            result += "BEGIN:VEVENT\n";
            result += "DTSTART:" + getCourseTime(startDay, weekOffset, dayOffset, time[0]) + "\n";
            result += "DTEND:" + getCourseTime(startDay, weekOffset, dayOffset, time[1]) + "\n";
            result += "RRULE:FREQ=WEEKLY;BYDAY=" + day + ";COUNT=" + count + "\n";
            result += "LOCATION:" + data[i][3] + "\n";
            result += "SUMMARY:" + data[i][0] + "\n";
            result += "END:VEVENT\n";
        }
        result += "END:VCALENDAR\n";
        return result;
    }

    /* 用于返回回调函数的函数 */
    function getGenerateFunc(fileType) {
        var func = null,
            exName, mime;

        if (fileType.toLowerCase() === "ics") {
            func = getICS;
            exName = "ics";
            mime = "text/calendar";
        } else {
            func = getCSV;
            exName = "csv";
            mime = "text/csv";
        }

        function clickFunc() {
            var value = startDayC.value;

            if (!/^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$/.test(value)) {
                alert('你输入的日期无效！请输入有效的日期，如 "2016-08-29"');
                return;
            }

            var url = "data:" + mime + ";charset=utf-8," + encodeURIComponent(func(value)),
                fileName = "curriculum." + exName,
                link = document.createElement("a");

            if (link.download !== undefined) {
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                var event = new MouseEvent('click');
                link.dispatchEvent(event);
            }
        }
        return clickFunc;
    }

    var btn, label,
        bar = document.getElementById("Table2"),
        barRow = bar.insertRow(bar.length),
        startDayC = document.createElement("input"); /* 创建输入开学日期的文本框 */

    startDayC.type = "text";
    startDayC.size = 10;
    startDayC.maxLength = 10;
    startDayC.value = "2016-08-29";
    startDayC.onfocus = function(event) {
        event.target.select();
    };

    label = document.createElement("label");
    label.innerText = "开学第一天：";
    label.appendChild(startDayC);
    barRow.insertCell(0).appendChild(label);

    btn = document.createElement("input");
    btn.type = "button";
    btn.style.cursor = "pointer";
    btn.style.margin = "0 0 0 10px";
    btn.value = "导出 CSV";
    btn.onclick = getGenerateFunc("csv");
    barRow.cells[0].appendChild(btn);

    btn = document.createElement("input");
    btn.type = "button";
    btn.style.cursor = "pointer";
    btn.style.margin = "0 0 0 10px";
    btn.value = "导出 ICS";
    btn.onclick = getGenerateFunc("ics");
    barRow.cells[0].appendChild(btn);
});


// ### 莫名其妙错误页 _(:з」∠)_
page.on('zdy.htm', function() {
    location.href = 'http://' + location.host;
});


page.run();
