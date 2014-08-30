// 页面地址路由
//
// ```javascript
// var page = new Page;
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
    // 回调函数组
    this._routes = {};
}

// 注册一个回调函数
Page.prototype.on = function (pattern, callback) {
    var compiledPattern;

    if (this._routes[pattern] === undefined) {
        if (pattern instanceof RegExp) {
            compiledPattern = pattern;
        } else {
            compiledPattern = new RegExp(pattern);
        }

        this._routes[pattern] = {
            compiled: compiledPattern,
            callbacks: []
        };
    }

    this._routes[pattern].callbacks.push(callback);
}

// 进行匹配、运行对应回调函数
Page.prototype.run = function (url) {
    // 默认使用不带最开始 back slash 的 `location.pathname`
    if (url === undefined) {
        url = location.pathname.slice(1, location.pathname.length);
    }

    var matchedParts;

    for (var pattern in this._routes) {
        matchedParts = this._routes[pattern].compiled.exec(url);

        // 找到匹配的，执行已注册的回调函数
        if (matchedParts !== null) {
            matchedParts.shift();

            this._routes[pattern].callbacks.forEach(function (callback) {
                callback.apply(matchedParts);
            });
        }
    }
};


// 创建一个 dom 元素并插入到指定父元素下
function makeElement(text, name, type, parent) {
    var element = document.createElement(type);

    element.id = name;
    element.innerText = text;

    if (parent) {
        $(parent).append(element);
    }

    return element;
}


// ## 助手部分

var page = new Page;


// ### 登录页
page.on('default2.aspx', function () {});


// ### 成绩页面

// 计算 GPA
page.on('xscj.aspx', function () {
    var $infoRows = $('#Table1 tbody'),
        $scoreTable = $('#DataGrid1'),
        $scoreTableHead = $('#DataGrid1 .datelisthead'),
        $scoreRows = $('#DataGrid1 tr').not('.datelisthead');

    // 插入汇总栏: 平均绩点、平均分、加权平均分
    var avgCell = document.createElement('tr'),
        avgGPA = makeElement('平均绩点: ', 'avg-gpa', 'td', avgCell),
        avgScore = makeElement('平均分: ', 'avg-score', 'td', avgCell),
        weightedAvgScore = makeElement('加权平均分: ', 'weighted-avg-score', 'td', avgCell);
    $infoRows.append(avgCell);

    // 插入各行汇总栏: 绩点、学分绩点、是否加入计算
    makeElement('绩点', '', 'td', $scoreTableHead);
    makeElement('学分绩点', '', 'td', $scoreTableHead);
    $('<input type="checkbox" class="lecture-check-all" />').appendTo(
        makeElement('全选 ', '', 'td', $scoreTableHead)
    );

    var rowCellsTmpl = [
        '<td class="gpa"></td>',
        '<td class="credit-gpa"></td>',
        '<td ><input type="checkbox" class="lecture-check"></input></td>'
    ];
    $(rowCellsTmpl.join('')).appendTo($scoreRows);

    
    // 计算 GPA
    // 
    // 计算公式：
    //  
    //      GPA = (s - 50) / 10         (s >= 60)
    //            0                     (s < 60)
    var calculateGPA = function (score) {
        return score < 60 ? 0 : (score - 50) / 10;
    };

    // 提取各行各栏课程数据
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
    var extractLecture = function (row) {
        var $cols = $('td', row),
            extractText = _t = function (x) { return $(x).text().trim(); },
            extractScore = _g = function (x) {
                var score = extractText(x);

                // 处理等级的情况
                if (score === '免修') return 95;
                else if (score === '优秀') return 95;
                else if (score === '良好') return 85;
                else if (score === '中等') return 75;
                else if (score === '及格') return 65;
                else if (score === '不及格') return 0;
                // 没有填写的情况当作 0 （出现在重修栏）
                else if (score === '') return 0;
                else return parseFloat(score);
            };

        return {
            'code': _t($cols[0]),
            'name': _t($cols[1]),
            'type': _t($cols[2]),
            'attribution': _t($cols[4]),
            'is_minor': _t($cols[8]) === '1',
            'credit': parseFloat(_t($cols[7])),
            'grade': {
                'score': _g($cols[3]),
                'makeup': _g($cols[5]),
                'rework': _g($cols[6])
            },
            'gpa': calculateGPA(_g($cols[3]))
        };
    };

    var lectures = $.map($scoreRows, extractLecture);

    // 插入到各栏中
    $scoreRows.each(function (i, row) {
        var $row = $(row),
            lecture = lectures[i];

        $row.find('.gpa').text(lecture.gpa.toFixed(2));
        $row.find('.credit-gpa').text((lecture.gpa * lecture.credit).toFixed(2));
    });

    // 绑定各栏的勾选事件
    $scoreRows.click(function () {
        var $checkbox = $(this).find('input');

        // 反转勾选状态
        $checkbox.prop('checked', !$checkbox.prop('checked')).trigger('change');
    });

    // 计算汇总
    //
    // * avgScore         :  平均成绩
    // * avgGPA           :  平均绩点
    // * weightedAvgScore :  加权平均分
    var summarize = function (lectures) {
        var totalLectures = lectures.length,
            sumScore = 0.0,
            sumGPA = 0.0,
            sumCredit = 0.0,
            sumWeightedScore = 0.0;

        if (totalLectures <= 0) {
            return {
                avgScore: 0.0,
                avgGPA: 0.0,
                weightedAvgScore: 0.0
            };
        }
        
        for (var i = 0; i < totalLectures; i++) {
            sumScore += lectures[i].grade.score;
            sumGPA += lectures[i].credit * lectures[i].gpa;
            sumCredit += lectures[i].credit;
            sumWeightedScore += lectures[i].credit * lectures[i].grade.score;
        }

        return {
            avgScore: sumScore / totalLectures,
            avgGPA: sumGPA / sumCredit,
            weightedAvgScore: sumWeightedScore / sumCredit
        };
    };

    // 插入到汇总栏中
    var insertSummarize = function (result) {
        avgGPA.innerHTML = '平均绩点: ' + result.avgGPA.toFixed(2);
        avgScore.innerHTML = '平均分: ' + result.avgScore.toFixed(2);
        weightedAvgScore.innerHTML = '加权平均分: ' + result.weightedAvgScore.toFixed(2);
    };

    // 绘制汇总栏
    var renderSummarize = function() {
        var checkedRows = $('.lecture-check:checked').parent().parent(),
            lectures = $.map(checkedRows, extractLecture);

        insertSummarize(summarize(lectures));
    };

    // 绑定勾选事件，重新计算汇总栏
    $('.lecture-check').change(renderSummarize);
    $('.lecture-check-all').change(function () {
        // 同步勾选状态
        $('.lecture-check').prop('checked', $('.lecture-check-all').is(':checked'));

        // 触发重新计算
        renderSummarize();
    });

    // 手动标记为全选
    $('.lecture-check-all').prop('checked', true).trigger('change');
});


// 记录成绩情况
page.on('xscj.aspx', function () {
});


// ### 评价页面
page.on('xsjpj.aspx', function() {
});


page.run();
