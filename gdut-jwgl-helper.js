// ==UserScript==
// @name       GDUT教务管理系统helper
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  hack
// @match      http://jwgl.gdut.edu.cn/*
// @copyright  2013, Link
// @require http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.3.min.js
// ==/UserScript==

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

function ShowAvgPoint(){
    var table = $('#DataGrid1');
    if(table == null) return;

    var rows = $('tr',table);
    var tds = $(rows[0]).children();
    if($(tds[0]).text().trim() != '课程代码') return;

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
    td1.innerHTML = "Æ½¾ù¼¨µã£º" + helper.avgPoint;
    td1.colSpan = "2";
    var td2 = document.createElement('td');
    td2.innerHTML = "Æ½¾ù·Ö£º" + helper.avgScore;
    td2.colSpan = "2";
    lastrow.appendChild(td1);
    lastrow.appendChild(td2);
    tb.appendChild(lastrow);

}



function init(){
    document.onmousedown = null;
    ShowAvgPoint();
}

init();
