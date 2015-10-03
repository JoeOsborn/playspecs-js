var exResults = [];


//viz. http://jsfiddle.net/KJQ9K/554/
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;');//.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    return "<pre>" + pretty + "</pre>";
}

var descCounter = 0;

function desc(str, func) {
    if(!func) {
        document.write(str);
        return;
    }
    var out = "";
    out += str;
    var funcBody = func.toString();
    funcBody = funcBody.substr(funcBody.indexOf("{") + 1);
    funcBody = funcBody.substr(0, funcBody.lastIndexOf("\n"));
    funcBody = funcBody.split("\n").map(function (s) {
        return s.substr(4);
    }).join("\n");
    funcBody = syntaxHighlight(funcBody);
    var exCount = 0;
    funcBody = funcBody.split("\n").map(function (s) {
        if (s.match(/^\s*ex\(/)) {
            exCount++;
            return "<span class='ex-index'>" + exCount + ".</span>" + s.substr(2);
        } else {
            return s;
        }
    }).join("\n");
    out += "<pre>" + funcBody + "</pre>";
    exResults = [];
    func();
    out += "<ol class='examples'>";
    var errorCount = 0;
    for (var i = 0; i < exResults.length; i++) {
        var left = exResults[i].left;
        var right = exResults[i].right;
        var renderer = exResults[i].renderer;
        if (left == right || right === undefined) {
            out += "<li class='good'>" +
                "<details>" +
                "<summary>ex " + (i + 1) + " as expected.</summary>" +
                renderer(left) +
                "</details>";
        } else {
            out += "<li class='bad'>" +
                "<details open='true'>" +
                "<summary>ex " + (i + 1) + " not as expected.</summary>" +
                renderer(left) +
                renderer(right) +
                "</details>";
            console.error("Got",left,"expected",right);
            errorCount++;
        }
    }
    out += "</ol>";
    document.write(out);
    if (errorCount) {
        console.error("Desc " + descCounter + " had " + errorCount + " errors");
    } else {
        console.info("Desc " + descCounter + " OK");
    }
    exResults = [];
    descCounter++;
}

function isString(s) {
    return typeof s === 'string' || s instanceof String;
}

function fnReplacer(_key, value) {
    if(typeof(value) == "function") {
        return value.toString().replace(/\n/g,"<br/>");
    }
    return value;
}

function preRenderer(val) {
    return "<pre>"+val+"</pre>";
}

function jsonRenderer(val) {
    return JSON.stringify(val, fnReplacer, 2);
}

function ex(v1, v2, renderer) {
    var result;
    if (isString(v1) && (v2 === undefined || isString(v2))) {
        result = {
            left: v1,
            right: v2,
            renderer: renderer || preRenderer
        };
    } else {
        result = {
            left: JSON.stringify(v1, fnReplacer, 2),
            right: (v2 === undefined ? undefined : JSON.stringify(v2, fnReplacer, 2)),
            renderer: renderer || prettify
        };
    }
    exResults.push(result);
}

document.addEventListener("DOMContentLoaded", function(_e) {
    var elts = document.getElementsByClassName("diagram");
    for(var i = 0; i < elts.length; i++) {
        var elt = elts[i];
        elt.innerHTML = Viz(elt.textContent);
    }
});