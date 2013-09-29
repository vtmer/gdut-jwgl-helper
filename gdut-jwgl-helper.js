// ==UserScript==
// @name       GDUT 教务管理系统 helper
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description	better experience on gdut jwgl system
// @match      http://jwgl.gdut.edu.cn/*
// @match      http://jwgldx.gdut.edu.cn/*	
// @copyright  2013, VTM STUDIO
// @require http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.3.min.js
// ==/UserScript==

var url = document.URL.toString();
var loginPage = "http://jwgl.gdut.edu.cn";
var xsjxpj = /.*xsjxpj\.aspx.*/;
var xscj = /.*xscj\.aspx.*/;
var default2 = /.*default2\.aspx.*/i;
var error = /.*zdy\.htm.*/;
var user = {
    'name': '',
    'password': '',
    'is_autologin': '',
    // 记录连续登录次数
    'login_time': '',
    // 上次登录是否成功
    'login_successed': '',
    // 是否需要重新输入用户信息
    'need_setup': ''
};

//获取用户信息
function LoadSettings() {
    user.name = localStorage.name;
    user.password = localStorage.password;
    user.is_autologin = parseInt(localStorage.is_autologin, 10) || 0;
    user.login_time = parseInt(localStorage.login_time, 10) || 0;
    user.login_successed = parseInt(localStorage.login_successed, 10) || 0;
    // 之前必须登录成功过
    if (user.name && user.password && user.login_successed) {
        user.need_setup = false;
    } else {
        user.need_setup = true;
    }
}

//显示配置信息
function ShowSettings() {
    if (default2.test(url)) {
        // 登录页
        $('.login_right dl').after(
            '<input type="checkbox" name="auto_login" />' +
            '<label for="auto_login">以后自动登录</label>'
        );
        if (user.is_autologin) {
            $('input[name=auto_login]').attr({checked: 'checked'});
        }

        $('input#Button1').click(function() {
            user.name = $('#TextBox1').val();
            user.password = $('#TextBox2').val();
            if ($('input[name="auto_login"]').is(':checked')) {
                user.is_autologin = 1;
            } else {
                user.is_autologin = 0;
            }
            _save_user_settings();
        });
    } else {
        // 登录后安全退出要取消自动登录
        $('.info ul a#likTc').click(function() {
            user.is_autologin = 0;
            user.login_successed = 0;
            _save_user_settings();
        });
    }
}

//保存配置信息到 localStorage
function _save_user_settings() {
    var prop;
    for (prop in user) {
        localStorage.setItem(prop, user[prop]);
    }
}

function SaveSettings() {
    // 还在首页不做保存
    if (default2.test(url))
        return;

    // 成功登录，登录次数置零
    user.login_time = 0;
    user.login_successed = 1;
    _save_user_settings();
}

var GPA = {
    scores: [],
    GPA: [],
    credits: [],
    avgScore: 0,
    avgGPA: 0,
    sumGPA: 0,
    sumCredit: 0
};

// 初始化
GPA.init = function() {
    if (!xscj.test(url))
        return;
    this.table = $("#DataGrid1");
    this.rows = $('tr',this.table);

    var tb = $('tbody')[0];
    var lastrow = document.createElement('tr');

    var td1 = document.createElement('td');
    td1.colSpan = "2";
    td1.id = "avgGPA";

    var td2 = document.createElement('td');
    td2.colSpan = "2";
    td2.id = "avgScore";

    this.Calculate();

    this.td1 = td1;
    this.td2 = td2;

    lastrow.appendChild(td1);
    lastrow.appendChild(td2);
    tb.appendChild(lastrow);

    this.Show();
};

// 显示平均绩点和平均分
GPA.Show = function() {
    this.td1.innerHTML = "平均绩点：" + this.avgGPA.toFixed(2);
    this.td2.innerHTML = "平均分：" + this.avgScore.toFixed(2);
};

// 计算平均绩点和平均分
GPA.Calculate = function() {
    var rows = this.rows;
    var scores = this.scores;
    var GPA = this.GPA;
    var credits = this.credits;
    var avgScore = 0;
    var avgGPA = 0;
    var sumGPA = 0;
    var sumCredit = 0;

    // 第0行不是成绩
    for (var i = 1, length = rows.length; i < length; i++) {
        var tds = $(rows[i]).children();
        var score = $(tds[3]).text().trim();
        if (score == '优秀') scores[i] = 95;
        else if (score == '良好') scores[i] = 85;
        else if (score == '中等') scores[i] = 75;
        else if (score == '及格') scores[i] = 65;
        else if (score == '不及格') scores[i] = 0;
        else if (!isNaN(parseInt(score, 10))) scores[i] = score;
        /**
         * TODO GPA NaN
         * 有时候会出现“免修”，那么这个时候绩点怎么算？
         */
        else continue;

        if ((scores[i] - 50) >= 10) {
            GPA[i] = (scores[i] - 50) / 10; 
        } else {
            GPA[i] = 0;
        }
        credits[i] = parseFloat($(tds[7]).text().trim());
    }

    for (var i = 1, length = scores.length; i<length; i++) {
        avgScore += parseFloat(scores[i]);
        sumGPA += GPA[i] * credits[i];
        sumCredit += credits[i];
    }

    avgScore /= scores.length - 1;
    avgGPA = sumGPA / sumCredit;

    if (avgScore === 0 )
        return;
    else {
        this.avgScore = avgScore;
        this.avgGPA = avgGPA;
    }
};

//填写验证码
function FillCaptcha()
{
    if (!default2.test(url)) return;
    var imgs = document.getElementsByTagName("img");
    var image = imgs[3];
    $(image).load(function(){
        var canvas = document.createElement('canvas');                 
        var ctx = canvas.getContext("2d");                 
        var numbers = [
          "110000111000000100011000001111000011110000111100001111000011110000111100000110001000000111000011",
          "111100111110001111000011100100111011001111110011111100111111001111110011111100111111001111110011",
          "110000111000000100011100001111001111110011111001111100011110001111000111100111110000000000000000",
          "110000011000000000111100111111001110000111100001111110001111110000111100000110001000000111000011",
          "111110011111000111110001111000011100100111001001100110010011100100000000000000001111100111111001",
          "100000011000000110011111000111110000001100000001001110001111110000111100000110001000000111000011",
          "110000011000000010011100001111110010001100000001000110000011110000111100100111001000000111000011",
          "000000000000000011111001111100111111001111100111111001111110011111000111110011111100111111001111",
          "110000111000000100111100001111000011110010000001100000010011110000111100001111001000000111000011",
          "110000111000000100111001001111000011110000011000100000001100010011111100001110010000000110000011"
        ];
        var captcha = "";
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        for (var i = 0; i < 5; i++) {
            var pixels = ctx.getImageData(9 * i + 5, 5, 8, 12).data;
            var ldString = "";
            for (var j = 0,length = pixels.length; j < length; j += 4) {
                ldString = ldString + (+(pixels[j] * 0.3 + pixels[j + 1] * 0.59 + pixels[j + 2] * 0.11 >= 140));
            }    
            var comms = numbers.map(function (value) {
                return ldString.split("").filter(function (v, index) {
                return value[index] === v;
                }).length;
            });
            captcha += comms.indexOf(Math.max.apply(null, comms));
        }
        document.querySelector("input[name=TextBox3]").value = captcha;
        if (!user.need_setup) {
            document.getElementById("TextBox1").value = user.name;
            document.getElementById("TextBox2").value = user.password;

            if (user.is_autologin) {
                document.getElementById("Button1").click();
            }
        }
    });
}


//教学质量评价
function AutoRank(){
    if (!xsjxpj.test(url)) return;
    var tds = $("td");
    var td = tds[1];

    var sels = $("select");
    var save = $("#Button1");

    //好的评价
    var good = document.createElement("input");
    good.value = "老师我爱你";
    good.type = "button"; 
    good.onclick = function(){
        for (var i = 2; i< sels.length - 1; i++)
            sels[i].selectedIndex = 1;
        sels[1].selectedIndex = sels[sels.length - 1].selectedIndex = 2;
        save.click();
    };
    
    //坏的评价
    var bad = document.createElement("input");
    bad.value = "老师我恨你";
    bad.type = "button";
    bad.onclick = function(){
        for (var i = 2; i< sels.length - 1; i++)
            sels[i].selectedIndex = 5;
        sels[1].selectedIndex = sels[sels.length - 1].selectedIndex = 4;
        save.click();
    };
    
    //随机评价
    //和谐版
    var randomGood = document.createElement("input");
    randomGood.value = "老师祝你好运吧!(和谐版)";
    randomGood.type = "button";
    randomGood.onclick = function(){
	do{
        for (var i = 1; i< sels.length; i++)
         sels[i].selectedIndex = Math.ceil(Math.random() * 10) % 3 + 1;
	} while (isSame());
        save.click();
    };
    //凶残版
    var randomBad = document.createElement("input");
    randomBad.value = "老师祝你好运吧!(凶残版)";
    randomBad.type = "button";
    randomBad.onclick = function(){
	do{
         for (var i = 1; i< sels.length; i++)
         sels[i].selectedIndex = Math.ceil(Math.random() * 10) % 3 + 3;
	} while (isSame());
        save.click();
    };

    //判断是否所有评价一样
    function isSame(){
        var n = sels.length - 1;
        if (sels[n] == sels[n-1] && sels[n] == sels[n-2]) {
            return true;
        } else {
            return false;
        }
    }
    
    //设置margin
    good.style.margin = "5px";
    bad.style.margin = "5px";
    randomGood.style.margin = "5px";
    randomBad.style.margin = "5px";

    //添加到页面中
    td.appendChild(good);
    td.appendChild(bad);
    td.appendChild(randomGood);
    td.appendChild(randomBad);
}

function ErrorPage() {
    if (error.test(url)) {
        location.href = loginPage;
    }
}

function init() {
    document.onmousedown = null;
    //ErrorPage();
    //LoadSettings();
    //ShowSettings();
    //FillCaptcha();
    GPA.init();
    AutoRank();
    //SaveSettings();
}

init();
