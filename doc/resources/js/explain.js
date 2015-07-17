var exResults = [];


//viz. http://jsfiddle.net/KJQ9K/554/
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function prettify(json) {
    var pretty = syntaxHighlight(json);
    return "<pre>"+pretty+"</pre>";
}

function desc(str, func) {
    var out = "";
    out += "<p>"+str+"</p>";
    var funcBody = func.toString();
    funcBody = funcBody.substr(funcBody.indexOf("{")+1);
    funcBody = funcBody.substr(0,funcBody.lastIndexOf("\n"));
    funcBody = funcBody.split("\n").map(function(s) {
        return s.substr(4);
    }).join("\n");
    var exCount = 0;
    funcBody = funcBody.split("\n").map(function(s) {
        if(s.match(/^\s*ex\(/)) {
            exCount++;
            return ""+exCount+". "+s;
        } else {
            return s;
        }
    }).join("\n");
    out += "<pre>"+funcBody+"</pre>";
    exResults = [];
    func();
    out += "<ol>";
    for(var i = 0; i < exResults.length; i++) {
        var left = exResults[i].left;
        var right = exResults[i].right;
        if(left == right) {
            out += "<li class='good'>Ex "+i+":"+prettify(left);
        } else {
            out += "<li class='bad'>Ex "+i+": expected "+prettify(left)+", got:"+prettify(right);
        }
    }
    out += "</ol>";
    document.write(out);
    exResults = [];
}

function ex(v1, v2) {
    exResults.push({left:JSON.stringify(v1,null,2), right:JSON.stringify(v2,null,2)});
}