$engine JScript
$uname TextWindow
$dname Класс TextWindow
$addin global
$addin stdlib

function GetTextWindow() {
    
    var activeWnd = snegopat.activeTextWindow();
    
    if (activeWnd)
        return new _TextWindow(activeWnd);
        
    return null;
}

////////////////////////////////////////////////////////////////////////////////////////
//// TextWindow
////

/** Класс-обертка вокруг ITextWindow, поддерживающий одновременно 
интерфейс объектов ITextWindow, так и ТекстовыйДокумент. */
function _TextWindow(textWindow) {
    this.textWindow = textWindow;
}

//{ Реализация основных методов
_TextWindow.prototype.IsActive = function() {
    return (this.textWindow != null);
}

_TextWindow.prototype.GetHwnd = function () {
    return this.textWindow.hwnd;
}

_TextWindow.prototype.GetText = function() {
    return this.textWindow.text;
}

_TextWindow.prototype.SetText = function(text) {
    this.Range(1,1,this.textWindow.linesCount).SetText(text);
}

_TextWindow.prototype.ExtName = function() {
    return this.textWindow.extName;
}

_TextWindow.prototype.GetCaretPos = function() {
    return this.textWindow.getCaretPos();    
}

_TextWindow.prototype.SetCaretPos = function(row, col) {
    return this.textWindow.setCaretPos(row, col);    
}

_TextWindow.prototype.GetSelection = function() {
    return this.textWindow.getSelection();    
}

_TextWindow.prototype.SetSelection = function(beginRow, beginCol, endRow, endCol) {
    return this.textWindow.setSelection(beginRow, beginCol, endRow, endCol);    
}

_TextWindow.prototype.GetSelectedText = function() {
    return this.textWindow.selectedText;
}

_TextWindow.prototype.SetSelectedText = function(text) {
    this.textWindow.selectedText = text;
}

_TextWindow.prototype.GetLine = function(rowNum) {
    return this.textWindow.line(rowNum);    
}

_TextWindow.prototype.LinesCount = function() {
    return this.textWindow.linesCount;    
}

_TextWindow.prototype.IsReadOnly = function() {
    return this.textWindow.readOnly;    
}

_TextWindow.prototype.DeleteLine = function(rowNum) {
	
	if (rowNum < 1 || rowNum > this.LinesCount())
		return;

	var nextLine = this.GetLine(rowNum + 1);
	this.Range(rowNum, 1, rowNum+1, nextLine.length + 1).SetText(nextLine);
}

_TextWindow.prototype.AddLine = function(strLine) {
    var linesCount = this.LinesCount();
    if (linesCount > 0)
    {
        var lastLine = this.GetLine(linesCount);
        this.Range(linesCount, 1, linesCount).SetText(lastLine + "\n" + strLine);
    }
    else 
    {
        this.Range().SetText(strLine);
    }
}

_TextWindow.prototype.InsertLine = function(rowNum, strLine) {

    var linesCount = this.LinesCount();

    if (rowNum < 0 || rowNum > linesCount + 1)
        throw "_TextWindow.InsertLine(): Индекс за границами диапазона!";
        
    if (rowNum == linesCount + 1)
    {    
        this.AddLine(strLine);
    }
    else 
    {
        var curLine = this.GetLine(rowNum);
        this.Range(rowNum, 1, rowNum).SetText(strLine + "\n" + curLine);
    }
}

_TextWindow.prototype.ReplaceLine = function(rowNum, strLine) {
    this.Range(rowNum, 1, rowNum).SetText(strLine);
}

_TextWindow.prototype.Clear = function () {
    this.Range().SetText("");
}

/** RangeObject _TextWindow::Range([beginRow [,beginCol [,endRow [,endCol]]]]) */
_TextWindow.prototype.Range = function() {
    var tw = this.textWindow;

    /* Нумерация строк и колонок в текстовом документе - с 1. 
    Если документ пустой, то linesCount == 0, поэтому для корректной работы 
    объекта Range() приводим значения аргументов при помощи выражения (index || 1). */
    
    var beginRow = (arguments.length > 0 ? arguments[0] : 1) || 1;
    var endRow  = (arguments.length > 2 ? arguments[2] : tw.linesCount) || 1;
    
    if (beginRow > endRow)
        throw "_TextWindow: Индекс первой строки области не может быть больше индекса последней строки области!";

    var beginCol = (arguments.length > 1 ? arguments[1] : 1) || 1;
    var endCol =  (arguments.length > 3 ? arguments[3] : tw.line(endRow).length) || 1;
    
    if (beginRow == endRow && beginCol > endCol)
        throw "_TextWindow: Индекс первого символа области строки не может быть больше индекса последнего символа области!";

     // Возвращает строки области как массив.
     var getLines = function() {
        
        var lines = [];        

        /* Чтобы не ошибиться в индексах, надо помнить:
         - в строках js нумерация символов начинается с 0;
         - строки и колонки в ITextWindow нумеруются с 1;
         - в substr второй параметр - длина подстроки, которую требуется получить.*/

        ////// Область - подстрока одной строки.

        if (beginRow == endRow)
        {
            lines.push(tw.line(beginRow).substr(beginCol-1, endCol));
            return lines;
        }

        ////// Область - несколько строк.            
        
        // 1. Первая строка - от первой колонки области и до конца этой строки.
        lines.push(tw.line(beginRow).substr(beginCol - 1));
        
        // 2. Строки, начиная со второй и до предпоследней.
        for (var row=beginRow + 1; row <= endRow - 1; row++)
            lines.push(tw.line(row));

        // 3. Последняя строка - от первого символа и до последней колонки области.
        lines.push(tw.line(endRow).substr(0, endCol));

        return lines;
    };

    // Возвращает строки области в виде одной мультистроки (разделитель строк - \n).
    var getText = function() {
        return getLines().join("\n");
    };

    var setText = function(text) {        
        
        ////1. Запомнить текущую позицию курсора и выделение.        
        var curPos = tw.getCaretPos();
        var curSel = tw.getSelection();
        
        ////2. установить выделение в соответствии с координатами Range
        
        /* И снова чехарда с индексами: выделение включает символы
        вплоть до позиции каретки, т.е. если мы хотим, чтобы символ 
        в позиции endCol попал в выделение, мы каретку должны поставить
        в позицию (endCol + 1). */
        
        tw.setSelection(beginRow, beginCol, endRow, endCol+1);
        
        ////3. установить выделенный текст
        tw.selectedText = text;
        
        ////4. вернуть положение курсора в прежнюю позицию.
        tw.setSelection(curSel.beginRow, curSel.beginCol, curSel.endRow, curSel.endCol);
        tw.setCaretPos(curPos.beginRow, curPos.beginCol);
    }
    
    // Возвращаем наш псевдо - Range
    return { GetLines: getLines, GetText: getText, SetText: setText };

}

/** Array _TextWindow::Lines([from [,to]])*/
_TextWindow.prototype.GetLines = function () {

    // Если не задано ни одного параметра, то возвращаем все строки.
    // Если задан только первый параметр, то возвращается заданная строка.
    // Если заданы оба параметра, возвращаем диапазон строк.

    var beginRow, endRow;

    if (!arguments.length)
    {
        beginRow = 1;
        endRow = this.textWindow.linesCount;
    }
    else if (arguments.length == 1) 
    {
        beginRow = arguments[0];
        endRow = beginRow;
    }
    else if (arguments.length > 1)
    {
        beginRow = arguments[0];
        endRow = arguments[1];
    }
    
    return this.Range(beginRow, 1, endRow).GetLines();
}
//} Реализация основных методов

//{ Русскоязычные аналоги основных методов объекта Текстовый документ (TextDocument).
_TextWindow.prototype.КоличествоСтрок = _TextWindow.prototype.LinesCount;
_TextWindow.prototype.УдалитьСтроку = _TextWindow.prototype.DeleteLine;
_TextWindow.prototype.ДобавитьСтроку = _TextWindow.prototype.AddLine;
_TextWindow.prototype.Очистить = _TextWindow.prototype.Clear;
_TextWindow.prototype.ВставитьСтроку = _TextWindow.prototype.InsertLine;
_TextWindow.prototype.ЗаменитьСтроку = _TextWindow.prototype.ReplaceLine; 
_TextWindow.prototype.ПолучитьТекст = _TextWindow.prototype.GetText;
_TextWindow.prototype.УстановитьТекст = _TextWindow.prototype.SetText;
//}

//{ Методы для обратной совместимости с интерфейсом ITextWindow Снегопата предыдущих версий.
_TextWindow.prototype.document = function () { return this; };
_TextWindow.prototype.Document = function () { return this; };
_TextWindow.prototype.extName = _TextWindow.prototype.ExtName;
_TextWindow.prototype.getCaretPos = _TextWindow.prototype.GetCaretPos;
_TextWindow.prototype.setCaretPos = _TextWindow.prototype.SetCaretPos;
_TextWindow.prototype.getSelection = _TextWindow.prototype.GetSelection;
_TextWindow.prototype.setSelection = _TextWindow.prototype.SetSelection;
_TextWindow.prototype.line = _TextWindow.prototype.GetLine;
_TextWindow.prototype.linesCount = _TextWindow.prototype.LinesCount;
_TextWindow.prototype.readOnly = _TextWindow.prototype.IsReadOnly;
_TextWindow.prototype.selectedText = _TextWindow.prototype.GetSelectedText;
_TextWindow.prototype.text = _TextWindow.prototype.GetText;
_TextWindow.prototype.hwnd = _TextWindow.prototype.GetHwnd;
//}

////////////////////////////////////////////////////////////////////////////////////////
//// StringUtils
////

//{ Вспомогательные методы для работы со строками и текстовыми блоками.
StringUtils = {
    
    /* Получить отступ блока текста (по первой строке блока).
     Возвращает строку - пробельные символы, формирующие отступ. */
    getIndent: function (code) {
        var matches = code.match(/(^\s+?)(\S|\n|\r)/);
        
        if (matches)
            return matches[1];
            
        return '';
    },

    /* Увеличивает отступ у текстового блока, добавляя строку пробельных символов,
    переданных в качестве значения второго параметра ind. 
    Возвращает текстовый блок с добавленным отступом. */
    shiftRight: function(code, ind) {
        if (ind)
            return ind + code.replace(/\n/gm, "\n" + ind);
            
        return code;
    },

    /* Уменьшает отступ у текстового блока, удаляя строку пробельных символов,
    совпадающую со строкой, переданной в качестве значения второго параметра ind.
    Возвращает текстовый блок с уменьшенным отступом. */
    shiftLeft: function(code, ind) {
        if (ind)
        {
            var re = new RegExp("^" + ind, 'gm');
            return code.replace(re, "");
        }
            
        return code;
    },

    /* Проверяет, оканчивается ли строка str подстрокой suffix.
    Возвращает true, если хвост строки совпадает с suffix, и false в противном случае. */ 
    endsWith: function(str, suffix)  {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    
    /* Разбивает переданный блок текста на строки и возвращает массив строк. */
    toLines: function(code, nl) {
        return code.split(nl ? nl : "\n");
    },
    
    /* Объединяет массив строк в строку - блок текста. */
    fromLines: function(linesArray, nl) {
        return linesArray.join(nl ? nl : "\n");
    },
    
    /* Экранирует все символы в строке. */
    addSlashes: function(str) {
        return str.replace(/([^\d\w\sА-я])/g, "\\$1");
    }

}
//} Вспомогательные методы для работы со строками и текстовыми блоками.