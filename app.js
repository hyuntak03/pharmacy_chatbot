
const express = require('express');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs')
var data = fs.readFileSync("pharmacy_data.json", 'utf-8')
const obj = JSON.parse(data);

const apiRouter = express.Router();

app.use(logger('dev', {}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

function detectword(stringmsg) {
    if (stringmsg.includes("약국")) {
        return "검색"
    } else {
        return stringmsg
    }
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
            var add = "약국을 선택해주세요"
            var bttn = ""
            for (var i = 0; i < obj.length; i++) {
                if (msg == obj[i].name) {
                    result += obj[i].name + " (" + obj[i].addr + ")\n"
                    bttn += "'" + obj[i].name + " (" + obj[i].addr + ")" + "', "
                }
            }
            if(result == ""){
                result = "검색 결과가 없습니다."
                add = ""
            }
            bttn = bttn.slice(0,-1)
            bttn = "[" + bttn + "]"
            answer = result;
            addans = add;
            buttons = bttn;
            buttoncore = bttn;
            break;
        case '테스트':
            answer = "test"
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