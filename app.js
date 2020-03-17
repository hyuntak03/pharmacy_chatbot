
const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs')
var data = fs.readFileSync("pharmacy_data.json", 'utf-8')
const obj = JSON.parse(data);
var id;

const apiRouter = express.Router();

app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

function detectword(stringmsg) {
    if (stringmsg.includes("약국")) {
        return "검색"
    } else if (stringmsg.includes("번")) {
    } else if(isNaN(stringmsg) == true){
        return "1선";
    }else {
        return stringmsg
    }
}

function status(pharmacy) {
    var status = fs.readFileSync("status.txt",'utf-8');
    var result = "정보 없음";
    var search;
    status = status.split(":");
    search = status[0].toString().replace(/\n/g, "")
    for(var i = 0; i< search.length; i++){
        if(search == pharmacy){
            result = status[1]
        }
    }
    return result
}

function user_pharmacy(pharmacy){
    var last_data = fs.readFileSync("pharmacy.txt",'utf-8')
    var data = last_data + "\n" + id + ":" + pharmacy;
    fs.writeFileSync("pharmacy.txt","."+ data,'utf-8')
}

function num(msg){
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
                    fs.writeFileSync("pharmacy_search.txt",search + "\n" +"userid= "+ id + text,'utf-8')
                }
            }
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
        case '1선' :
            var search = fs.readFileSync("pharmacy_search.txt", 'utf-8');
            var pharmacy_status;
            var result;
            var ans;
            search = search.split("userid= ")
            var search_pharmacy = search[1].split(":")
            for (var i = 0; i < search.length; i++) {
                if (search[i].includes(id)) {
                    if (search_pharmacy[i].includes(msg)) {
                        result = search_pharmacy[i].split('.')
                        ans = result[1].toString().replace(/\n/g, "")
                        ans = ans.trim()
                    }
                }
            }
            user_pharmacy(ans);
            pharmacy_status = status(ans);
            answer = ans + "\n\n재고 상태: " + pharmacy_status ;
            addans = "재고 상태를 입력해주세요";
            buttons = ["재고 충분", "재고 부족", "판매 종료", "정보 없음"]
            buttoncore = ["재고 충분", "재고 부족", "판매 종료", "정보 없음"]
            break;
        case "재고 부족":
        case "판매 종료":
        case "정보 없음":
        case "재고 충분":
            var last_data = fs.readFileSync("status.txt", 'utf-8')
            var data = fs.readFileSync("pharmacy.txt", 'utf-8');
            var result;
            data = data.split(".")
            data = data[1];
            data = data.split(":")
            var search = data[0].toString().replace(/\n/g, "")
            for (var i = 0; i < search.length; i++) {
                if (search == id) {
                    result = data[1].toString().replace(/\n/g, "")
                    fs.writeFileSync("status.txt", last_data + "\n" + data[1] + ":" + msg, 'utf-8');
                }
            }
            answer = "정보가 업데이트 되었습니다.";
            break;
        case "status":
            var data = fs.readFileSync("status.txt",'utf-8')
            if(data == null){
                answer = "정보 x"
            }else {
                answer = data;
            }
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