$engine JScript
$uname queryParamsExtractor
$dname Query Parameters Extractor

// $addin global
// global.connectGlobals(SelfScript)

/* ======================================================================

AUTHOR: Василий Фролов aka Палыч, palytsh@mail.ru

DATE: 02.09.2011

COMMENT: 
	Макрос ExtractParameters позволяет сформировать код установки 
значений параметров запроса. 
Использование: в программном модуле выделить фрагмент вида 

	з = новый Запрос("текст запроса");
	
и вызвать макрос (по-умолчанию Ctrl + Shift + Q). Код описания параметров 
запроса будет вставлен в модуль ниже выделенного блока.

========================================================================= */

function getPredefinedHotkeys(predef){
	predef.setVersion(1);
	predef.add("ExtractParameters", "Ctrl + Shift + Q");
}

function macrosExtractParameters(){
	var w = snegopat.activeTextWindow();
	if (!w) return false;
	
	var sel = w.getSelection();
	var selText = w.selectedText;
	if (selText == '') return false;

	var qParams = getQueryParams(selText);
	if (!qParams) return false;
	
	var qVarName = getQueryVarName(selText);
	var offset = getTextBlockOffset(w.line(sel.endRow - 1));
        //var offset = getTextBlockOffset(w.document.ПолучитьСтроку(sel.endRow - 1));
	
	var paramsText = "";
	for (var i = 0; i < qParams.length; i++){
		paramsText += '\n' + offset + qVarName + //'\r\n'
			'.УстановитьПараметр("' + qParams[i] + '", );';
	};
	
    selText += paramsText + '\n'; //'\r\n';
    w.selectedText = selText;
        //w.document.ВставитьСтроку(sel.endRow, paramsText + '\r\n');

	return true;
}

function getQueryParams(str){
	var matches = str.match(/&([^*\s+-/\(\)\{\}]+)/ig);
	if (!matches) return null;

        if (!Array.prototype.indexOf) {
          Array.prototype.indexOf = function (obj, fromIndex) {
            if (fromIndex == null) {
                fromIndex = 0;
            } else if (fromIndex < 0) {
                fromIndex = Math.max(0, this.length + fromIndex);
            }
            for (var i = fromIndex, j = this.length; i < j; i++) {
                if (this[i] === obj)
                    return i;
            }
            return -1;
          };
        }
	
	var res = new Array();
    var arrUpperCase = new Array();
	for (var i = 0; i < matches.length; i++){
        param = matches[i].replace(/^&/ig, "");
        paramU = param.toUpperCase();
        if(-1 == arrUpperCase.indexOf(paramU)){
            res.push(param);
            arrUpperCase.push(paramU);
        }
                //res.push(matches[i].replace(/^&/ig, ""));
	}
	return res;
}

function getQueryVarName(str){
	var matches = str.match(/([^\.\s]+)((\.текст\s*=\s*)|(\s*=\s*новый\s*запрос))/ig); // или "Имя.Текст =" или "Имя = Новый Запрос"
        //var matches = str.match(/([^\s]+)\s*=\s*новый\s*запрос/ig);
	var res = !matches ? "" : RegExp.$1.replace(/\s*/ig, "");
	return res;
}

function getTextBlockOffset(str){
	var match = str.match(/^([\s]+)/ig);
	var res = !match ? "" : match[0];
	return res;
}
