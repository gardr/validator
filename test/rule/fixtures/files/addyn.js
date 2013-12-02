__ADTECH_CODE__ = "";
__theDocument = document;
__theWindow = window;
__bCodeFlushed = false;

function __flushCode() {
  if (!__bCodeFlushed) {
    var span = parent.document.createElement("SPAN");
    span.innerHTML = __ADTECH_CODE__;
    window.frameElement.parentNode.appendChild(span);
    __bCodeFlushed = true;
  }
}

if (typeof inFIF != "undefined") {
  document.write = function(str) {
    __ADTECH_CODE__ += str;
  };
  document.writeln = function(str) {
    document.write(str + "\n");
  };
  __theDocument = parent.document;
  __theWindow = parent;
}
document.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n");
document.write("<html xmlns=\"http://www.w3.org/1999/xhtml\">\n");
document.write("<head>\n");
document.write("<meta http-equiv=\"Content-Type\" content=\"text/html;charset=utf-8\"/>\n");
document.write("<title>Bavaria</title>\n");
document.write("<style type=\"text/css\">\n");
document.write("html, body {\n");
document.write("margin: 0;\n");
document.write("}\n");
document.write("#Wrapper {\n");
document.write("margin: 0 auto;/* max-width: 984px;*/\n");
document.write("min-width: 150px;\n");
document.write("height: 225px;\n");
document.write("position: relative;\n");
document.write("width: 100%;/* Opp til 680px som er landskap for m.finn og App *//* width: 100%;Dersom man Ã¸nsker at annonsen skal strekkes i det uendelige*/\n");
document.write("overflow: hidden;\n");
document.write("max-width: 1000px;\n");
document.write("}\n");
document.write(".bilde {\n");
document.write("background-image: url(http://annonsestyring.finn.no/landing/--Mobilbannere--/2013/Motor/Bavaria/1338/bg.jpg);\n");
document.write("background-position: center;\n");
document.write("background-repeat: no-repeat;\n");
document.write("background-size: auto auto;\n");
document.write("}\n");
document.write("#Shader {\n");
document.write("width: 100%;\n");
document.write("max-width: 1000px;\n");
document.write("height: 75px;\n");
document.write("position: absolute;\n");
document.write("top: 130px;\n");
document.write("background: -moz-linear-gradient(left, rgba(117,117,117,0.65) 28%, rgba(117,117,117,0) 100%);/* FF3.6+ */\n");
document.write("background: -webkit-gradient(linear, left top, right top, color-stop(28%, rgba(117,117,117,0.65)), color-stop(100%, rgba(117,117,117,0)));/* Chrome,Safari4+ */\n");
document.write("background: -webkit-linear-gradient(left, rgba(117,117,117,0.65) 28%, rgba(117,117,117,0) 100%);/* Chrome10+,Safari5.1+ */\n");
document.write("background: -o-linear-gradient(left, rgba(117,117,117,0.65) 28%, rgba(117,117,117,0) 100%);/* Opera 11.10+ */\n");
document.write("background: -ms-linear-gradient(left, rgba(117,117,117,0.65) 28%, rgba(117,117,117,0) 100%);/* IE10+ */\n");
document.write("background: linear-gradient(to right, rgba(117,117,117,0.65) 28%, rgba(117,117,117,0) 100%);/* W3C */\n");
document.write("filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#a6757575', endColorstr='#00757575', GradientType=1 );/* IE6-9 */\n");
document.write("}\n");
document.write("#Header {\n");
document.write("position: absolute;\n");
document.write("top: 120px;\n");
document.write("left: 15px;\n");
document.write("}\n");
document.write("._header {\n");
document.write("color: #FFF;\n");
document.write("font-family: Arial, Helvetica, sans-serif;\n");
document.write("font-size: 18px;\n");
document.write("font-weight: 600;\n");
document.write("text-shadow: 1px 1px 1px #000;\n");
document.write("}\n");
document.write("#Lenke {\n");
document.write("position: absolute;\n");
document.write("top: 50px;\n");
document.write("left: 15px;\n");
document.write("}\n");
document.write("._lenke {\n");
document.write("color: #FFF;\n");
document.write("font-family: Arial, Helvetica, sans-serif;\n");
document.write("font-size: 16px;\n");
document.write("text-shadow: 1px 1px 1px #000;\n");
document.write("}\n");
document.write("#Logo {\n");
document.write("position: absolute;\n");
document.write("left: 20px;\n");
document.write("top: 15px;\n");
document.write("}\n");
document.write("@media only screen and (min-width: 200px) and (max-width: 400px) {\n");
document.write("#Header {\n");
document.write("position: absolute;\n");
document.write("top: 135px;\n");
document.write("left: 30px;\n");
document.write("}\n");
document.write("._header {\n");
document.write("font-size: 34px;\n");
document.write("font-weight: 600;\n");
document.write("}\n");
document.write("#Lenke {\n");
document.write("top: 173px;\n");
document.write("left: 30px;\n");
document.write("}\n");
document.write("._lenke {\n");
document.write("font-size: 15px;\n");
document.write("}\n");
document.write(".bilde {\n");
document.write("background-image: url(http://annonsestyring.finn.no/landing/--Mobilbannere--/2013/Motor/Bavaria/1338/bg.jpg);\n");
document.write("background-position: right;\n");
document.write("background-repeat: no-repeat;\n");
document.write("background-size: auto auto;\n");
document.write("}\n");
document.write("}\n");
document.write("@media only screen and (min-width: 400px) and (max-width: 7000px) {\n");
document.write("#Header {\n");
document.write("position: absolute;\n");
document.write("top: 135px;\n");
document.write("left: 30px;\n");
document.write("}\n");
document.write("._header {\n");
document.write("font-size: 34px;\n");
document.write("font-weight: 600;\n");
document.write("}\n");
document.write("#Lenke {\n");
document.write("top: 173px;\n");
document.write("left: 30px;\n");
document.write("}\n");
document.write("._lenke {\n");
document.write("font-size: 22px;\n");
document.write("}\n");
document.write("}\n");
document.write("</style>\n");
document.write("</head>\n");
document.write("<body>\n");
document.write("<div id=\"Wrapper\" class=\"bilde\" onclick=\"window.open(&quot;http://helios.finn.no/adlink|989|4527464|0|16|AdId=9437473;BnId=1;itime=983038279;nodecode=yes;link=&quot;+'http://bavaria.no/','new_window');\">\n");
document.write("  <div id=\"Logo\"><img src=\"http://annonsestyring.finn.no/landing/--Mobilbannere--/2013/Motor/Bavaria/1334/logo.png\"/></div>\n");
document.write("  <div id=\"Shader\"></div>\n");
document.write("  <div id=\"Header\" class=\"_header\">Finn din BMW</div>\n");
document.write("  <div id=\"Lenke\" class=\"_lenke\">Vi har 350 nyere brukte biler pÃ¥ lager</div>\n");
document.write("</div>\n");
document.write("</body>\n");
document.write("</html>\n");
function cleanUp() {
 if (typeof __parent.swappedRefs4527464 == "undefined") {
   __parent.swappedRefs4527464 = new Array();
 }

 while (__parent.swappedRefs4527464.length > 0) {
   var ref = __parent.swappedRefs4527464.pop();
   if (ref != "swappedRefs4527464") {
     __parent[ref] = null;
   }
 }
}

if (typeof inFIF != "undefined" && inFIF == true) {
 __parent = window.parent;
 window.onunload = cleanUp;
 cleanUp();

 for (var ref in window) {
   if ((typeof __parent[ref] == "undefined" || __parent[ref] == null)
         && ref != "frameElement" && ref != "event" && ref != "swappedRefs4527464" && ref != "onunload") {
     try {__parent[ref] = window[ref]; __parent.swappedRefs4527464.push(ref);} catch (e) {}
  }
 }
}


if (typeof inFIF != "undefined" && inFIF) {
  __flushCode();
}

if (typeof inFIF != "undefined" && inFIF == true) {
try {parent.write = write;
} catch (e) {}try {parent.writeln = writeln;
} catch (e) {}try {parent.__flushCode = __flushCode;
} catch (e) {}}

