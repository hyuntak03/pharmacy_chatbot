
const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs')
const http = require('http')
var data = fs.readFileSync("pharmacy_data.json", 'utf-8')
const obj = JSON.parse(data);
var id;

const apiRouter = express.Router();

setInterval( function() {
    http.get("https://pharmacy-chatbot.herokuapp.com/")
}, 900000)

setInterval( function() {
    fs.writeFileSync("pharmacy.txt","",'utf-8');
    fs.writeFileSync("pharmacy_search.txt","",'utf-8');
    fs.writeFileSync("status.txt","",'utf-8');
}, 86400000)

app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

function detectword(stringmsg) {
    var num = detect_num(stringmsg);
    if (stringmsg.includes("약국")) {
        return "검색"
    }else if(isNaN(num) == false){
        return "select";
    }else if(stringmsg.includes("재고 충분") || stringmsg.includes("재고 부족") || stringmsg.includes("판매 종료") || stringmsg.includes("정보 없음")){
        return "info_update"
    }else {
        return stringmsg
    }
}

function status(pharmacy) {
    var status = fs.readFileSync("status.txt", 'utf-8');
    var result = "정보 없음";
    var info;
    status = status.split("\n");
    for (var i = 0; i < status.length; i++) {
        info = status[i].split(":")
        if (info[0] == pharmacy) {
            result = info[1];
        }
    }
    return result;
}

function pharmacy_search(msg) {
    var search = fs.readFileSync("pharmacy_search.txt", 'utf-8');
    search = search.split("userid= ");
    var result,userid,select_num;
    for(var i = 0;i<search.length;i++){
        result = search[i].split("&");
        userid = result[0];
        if(userid == id){
            list = result[1].trim()
            //console.log(list)
            select_num = list.split(":")
        }
    }
    return search_2(select_num,msg)
}

function search_2(select_num,msg){
    for(var i = 1;i<select_num.length;i++){
        nlist = select_num[i].trim().split(".");
        num = nlist[0];
        if(num == msg){
            addr = nlist[1].trim();
        }
    }
    return addr;
}

function user_pharmacy(pharmacy){
    var last_data = fs.readFileSync("pharmacy.txt",'utf-8')
    var data = last_data + "\n" + id + ":" + pharmacy;
    fs.writeFileSync("pharmacy.txt","."+ data,'utf-8')
}

function detect_num(msg){
    msg = msg.toString().replace(/[^0-9]/g,'');
    if(msg == ""){
        msg = "!num"
    }
    return msg;
}

function num_change(msg){
    msg = msg.toString().replace(/[^0-9]/g,'');
    msg = msg+"선";
    return msg;
}

reactword = function (keymsg, msg, callback) {
    var answer = '';
    var link = '';
    var buttons = [];
    var buttoncore = [];
    var addans = '';
    var iscallback = 0;

    switch (keymsg) {
        case '스마트 약국':
            answer = "약국 이름을 검색해주세요"
            break;
        case '검색':
            var result = "";
            var text = "";
            var add = "약국 번호를 입력해주세요"
            var num = 0;
            var search = fs.readFileSync("pharmacy_search.txt", 'utf-8');

            for (var i = 0; i < obj.length; i++) {
                if (msg == obj[i].name) {
                    num +=1;
                    result += num + ". " + obj[i].name + " (" + obj[i].addr + ")\n\n"
                    text += ":"+num +"선. " + obj[i].name + " (" + obj[i].addr + ")\n\n"
                }
            }
            fs.writeFileSync("pharmacy_search.txt",search + "\n" +"userid= "+ id + "&" + text,'utf-8')
            if(result == ""){
                result = "검색 결과가 없습니다."
                add = ""
            }
            answer = result;
            addans = add;
            break;
        case '테스트':
            answer = "test"
            break;
        case 'pharmacy':
            var data = fs.readFileSync("pharmacy.txt",'utf-8');
            if(data == null){
                answer = "정보 x"
            }else {
                answer = data;
            }
            break;
        case 'test':
            var search = fs.readFileSync("pharmacy_search.txt", 'utf-8');
            answer = search;
            break;
        case 'select' :
            var pharmacy_status;
            var select_num = num_change(msg).toString();
            var search = fs.readFileSync("pharmacy_search.txt", 'utf-8');
            var ans = pharmacy_search(select_num);
            user_pharmacy(ans);
            pharmacy_status = status(ans);
            answer = ans + "\n\n재고 상태: " + pharmacy_status ;
            addans = "재고 상태를 입력해주세요";
            buttons = ["재고 충분", "재고 부족", "판매 종료", "정보 없음"]
            buttoncore = ["재고 충분", "재고 부족", "판매 종료", "정보 없음"]
            break;
        case "info_update":
            var last_data = fs.readFileSync("status.txt", 'utf-8')
            var data = fs.readFileSync("pharmacy.txt", 'utf-8');
            var user_id;
            var addr;
            data = data.split("\n")
            for (var i = 0; i < data.length; i++) {
                info = data[i].split(":");
                user_id = info[0];
                if (user_id == id) {
                    addr = info[1];
                }
            }
            fs.writeFileSync("status.txt", last_data + "\n" + addr + ":" + msg, 'utf-8');
            answer = "정보가 업데이트 되었습니다.";
            addans = "주소: " + addr + ":" + msg;
            break;
        case "status":
            var data = fs.readFileSync("status.txt",'utf-8')
            if(data == null){
                answer = "정보 x"
            }else {
                answer = data;
            }
            break;
        case "정보 없음":
            answer = "알겠습니다."
            buttons = ['사용법']
            buttoncore = ['사용법']
            break;
        case "사용법":
            answer = "1. 정보를 알고 싶은 약국의 전체 이름을 입력해 주세요 (ex: 바른세상약국 o / 바른약국 x )"  
            + "\n\n"+ "2. 검색한 이름의 약국 목록이 나오면 주소를 보고 원하는 약국의 번호를 입력해 주세요 "
            + "\n\n"+"3. 정보를 확인하고 나오는 버튼을 통해 아는 정보를 입력하거나, 정보를 모른다면 '정보없음'을 선택해 주세요"
            addans = "*이 챗봇은 사용자분들의 정보 공유를 통해서 마스크 구매의 편의성을 높이고자 합니다!" 
                    +"\n" + "정확한 정보입력을 통해 서로서로 도움이 되었으면 합니다."
            break;
        default:
            answer = "[사용법]\n1. 정보를 알고 싶은 약국의 전체 이름을 입력해 주세요 (ex: 바른세상약국 o / 바른약국 x )"  
            + "\n\n"+ "2. 검색한 이름의 약국 목록이 나오면 주소를 보고 원하는 약국의 번호를 입력해 주세요 "
            + "\n\n"+"3. 정보를 확인하고 나오는 버튼을 통해 아는 정보를 입력하거나, 정보를 모른다면 '정보없음'을 선택해 주세요"
            addans = "*이 챗봇은 사용자분들의 정보 공유를 통해서 마스크 구매의 편의성을 높이고자 합니다!" 
            +"\n" + "정확한 정보입력을 통해 서로서로 도움이 되었으면 합니다."
            break;
    }
    if (iscallback == 0) {
        var answerresult = [];
        answerresult.push(answer);
        answerresult.push(buttons);
        answerresult.push(link);
        answerresult.push(buttoncore);
        answerresult.push(addans);
        callback(answerresult);
    }
}


app.use('/api', apiRouter);

apiRouter.post('/switch', function (req, res) {
    //console.log(req.body);
    var msg = req.body.userRequest.utterance;
    var userid = req.body.userRequest.user.id;
    id = userid;
    var userlang = req.body.userRequest.lang;
    var keyword = detectword(msg);
    console.log(msg);
    reactword(keyword, msg, reaction => {
        var answer = reaction[0];
        var buttons = reaction[1];
        var link = reaction[2];
        var buttoncore = reaction[3];
        var addans = reaction[4];
        console.log('answer:' + answer);


        var outputres = [];
        const tmpout1 = {
            simpleText: {
                text: answer
            }
        };
        outputres.push(tmpout1);
        if (addans != '') {
            const tmpout2 = {
                simpleText: {
                    text: addans
                }
            };
            outputres.push(tmpout2);
        }

        if (buttons.length == 0 && link == '') {
            const responseBody = {
                version: "2.0",
                template: {
                    outputs: outputres
                }
            };
            res.status(200).send(responseBody);
        }
        else if (link == '') {
            var buttonres = [];
            for (var i = 0; i < buttons.length; i++) {
                console.log(i + ' ' + buttons[i] + ' ' + buttoncore[i]);
                const tmpobj = {
                    label: buttons[i],
                    action: 'message',
                    messageText: buttoncore[i]
                }
                //console.log('\n'+tmpobj+'\n');
                buttonres.push(tmpobj);
            }
            //console.log('\n\nBUTRES\n' + buttonres);
            const responseBody = {
                version: "2.0",
                template: {
                    outputs: outputres,
                    quickReplies: buttonres
                }
            };
            res.status(200).send(responseBody);
        }
    });
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('서버 실행중...');
});