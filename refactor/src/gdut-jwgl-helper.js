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


// 助手部分

var page = new Page;


// 登录页
page.on('default2.aspx', function () {});


// 成绩页面

// GPA 计算
page.on('xscj.aspx', function () {
});


// 记录成绩情况
page.on('xscj.aspx', function () {
});


// 评价页面
page.on('xsjpj.aspx', function() {
});


page.run();
