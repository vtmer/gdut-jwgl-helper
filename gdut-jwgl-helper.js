// ==UserScript==
// @name       GDUT 教务管理系统 helper
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  hack
// @match      http://jwgl.gdut.edu.cn/*
// @copyright  2013, Link
// @require http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.3.min.js
// ==/UserScript==

var url = document.URL.toString();
var xsjxpj = /.*xsjxpj.aspx.*/;
var xscj = /.*xscj.aspx.*/;
var default2 = /.*default2.aspx.*/;

var helper = {
    scores:[],
    points:[], 
    credits:[],
    avgScore:0,
    avgPoint:0,
    sumPoint:0,
    sumCredit:0,
    total:0
}

//显示平均绩点和平均分
function ShowAvgPoint(){
    if(!xscj.test(url)) return;

    var table = $("#DataGrid1");
    var rows = $('tr',table);

    for(var i=1; i<rows.length; i++){
        var tds = $(rows[i]).children();
        var score = $(tds[3]).text().trim();
        if(score == '优秀') helper.scores[i] = 95;
        else if(score == '良好') helper.scores[i] = 85;
        else if(score == '中等') helper.scores[i] = 75;
        else if(score == '及格') helper.scores[i] = 65;
        else if(score == '不及格') helper.scores[i] = 0;
        else helper.scores[i] = score;
        helper.points[i] = (helper.scores[i]-50)/10;
        helper.credits[i] = parseFloat($(tds[7]).text().trim());
    }

    for(var i=1; i<helper.scores.length; i++){
        helper.avgScore += parseFloat(helper.scores[i]);
        helper.sumPoint += helper.points[i] * helper.credits[i];
        helper.sumCredit += helper.credits[i];
    }

    helper.avgScore /= helper.scores.length - 1;
    helper.avgPoint = helper.sumPoint / helper.sumCredit;

    var tb = $('tbody')[0];
    var lastrow = document.createElement('tr');
    var td1 = document.createElement('td');
    td1.innerHTML = "平均绩点：" + helper.avgPoint;
    td1.colSpan = "2";
    var td2 = document.createElement('td');
    td2.innerHTML = "平均分：" + helper.avgScore;
    td2.colSpan = "2";
    lastrow.appendChild(td1);
    lastrow.appendChild(td2);
    tb.appendChild(lastrow);
}


//填写验证码
function FillCaptcha()
{
    if(!default2.test(url)) return;
    //var img = $("[src$='CheckCode.aspx']");
    var imgs = document.getElementsByTagName("img");
    var img = imgs[3];
    img.onload = function(){
        var code = getCode(img);
        $("#TextBox3").val(code);
    }
}

function getCode(img){
    var code = "";
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    var c = ctx.getImageData(0,0,img.width,img.height);
    for(i=0; i<c.height; i++){
        for(j=0; j<c.width; j++){
            var x = (i*4)*c.width+(j*4); 
            var r = c.data[x];
            var g = c.data[x+1];
            var b = c.data[x+2];
            if(r+g+b > 350){
                c.data[x] = c.data[x+1] = c.data[x+2] = 0;
            }
            else{
                c.data[x] = c.data[x+1] = c.data[x+2] = 255;
            }
        }
    }
    for(var i=0;i<5;i++)
    {
        var x1 = i*9+5;
        var x2 = i*9+13;
        code += getNum(c,x1,5,x2,17);
    }
    return code;
}


function getNum(imgData,x1,y1,x2,y2){
    var num = 0;
    for(i=y1; i<y2; i++){
        for(j=x1; j<x2; j++){
            var x = (i*4)*imgData.width+(j*4);
            if(imgData.data[x] == 255)num++;
        }
    }
    switch(num)
    {
        case 56:{
            j = (x1+x2)/2;
            i = (y1+y2)/2;
            var x = (i*4)*imgData.width+(j*4);
            if(imgData.data[x] == 255)
                return 8;
            else
                return 0;
        }
        case 30:return 1;
        case 50:return 2;
        case 51:return 3;
        case 48:return 4;
        case 57:return 5;
        case 58:{
            i = y2-2;
            j = x1;
            var x = (i*4)*imgData.width+(j*4);
            if(imgData.data[x] == 255)
                return 9;
            else
                return 6;
        }
        case 37:return 7;
        default:return 0;
    }
}

//教学质量评价
function AutoRank(){
    if(!xsjxpj.test(url)) return;
    var tds = $("td");
    var td = tds[1];

    var sels = $("select");
    var save = $("#Button1");

    //好的评价
    var good = document.createElement("input");
    good.value = "老师我爱你";
    good.type = "button"; 
    good.onclick = function(){
        for(var i = 2; i< sels.length - 1; i++)
            sels[i].selectedIndex = 1;
        sels[1].selectedIndex = sels[sels.length - 1].selectedIndex = 2;
        save.click();
    }
    
    //坏的评价
    var bad = document.createElement("input");
    bad.value = "老师我恨你";
    bad.type = "button";
    bad.onclick = function(){
        for(var i = 2; i< sels.length - 1; i++)
            sels[i].selectedIndex = 5;
        sels[1].selectedIndex = sels[sels.length - 1].selectedIndex = 4;
        save.click();
    }
    
    //随机评价
    var random = document.createElement("input");
    random.value = "老师祝你好运吧!";
    random.type = "button";
    random.onclick = function(){
        for(var i = 1; i< sels.length; i++)
            sels[i].selectedIndex = Math.ceil(Math.random() * 10) % 5 + 1;
        save.click();
    }
    td.appendChild(good);
    td.appendChild(bad);
    td.appendChild(random);
}
function init(){
    document.onmousedown = null;
    ShowAvgPoint();
    FillCaptcha();
    AutoRank();
}

init();
