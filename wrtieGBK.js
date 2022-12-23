// https://topic.alibabacloud.com/a/nodejs-read-and-write-chinese-content-file-operation-__js_8_8_20188858.html

function WriteFile (file) {
    //test Chinese
    var str = "\n 中文 I am a person hello myself!";
    //Convert Chinese to byte array
    var arr = iconv.encode (str, ' GBK ');
    Console.log (arr);

    // AppendFile, if the file does not exist, it will automatically create a new file
    //If used WriteFile, then delete the old file, write the new file directly
    fs.appendFile ('file.txt', arr, function (err) {
        if (err)
            console.log ("fail" + err);
        else
            console.log ("Write file OK")

var str = "\n 中文 I am a person hello myself!"

const fs = require ('fs')
const iconv = require ('iconv-lite')
// const arr = iconv.encode (str, 'GBK')
var arr2 = iconv.encode (str, 'GB2312')
fs.writeFileSync('test2.csv', arr2, 'binary')

fs.writeFileSync('test2.csv', Buffer.from('EFBBBF', 'hex'))
fs.appendFileSync('test2.csv', str)

const fs = require('fs');

fs.writeFileSync('test.csv', Buffer.from('EFBBBF', 'hex'));
fs.appendFileSync('test.csv', '哈哈');

https://github.com/nodejs/help/issues/2153
我去貌似这个办法对csv也有效！