$engine JScript
$uname format_script
$dname Форматирование модуля

// (с) Александр Орефков orefkov@gmail.com
// Скрипт с разными полезными для форматирования текста модуля макросами

function fillLine(symbol, count)
{
    var text = ""
    while(count--)
        text += symbol
    return text
}

/*
 * Макрос для выравнивания знаков =
 * Выстраивает знаки = в выделенном тексте в одну колонку.
 */
function macrosВыровнятьЗнакиРавно()
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd)
        return
    var sel = txtWnd.getSelection()
    var endRow = sel.endRow
    if(sel.endCol == 1)
        endRow--
    if(endRow <= sel.beginRow)
        return
    var tabSize = profileRoot.getValue("ModuleTextEditor/TabSize");
    var replaceTabOnInput = profileRoot.getValue("ModuleTextEditor/ReplaceTabOnInput");
    
    lines = new Array()
    var maxEqualPos = -1
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var line = {text: txtWnd.line(l)}
        line.eqRealPos = line.text.indexOf("=")
        if(line.eqRealPos >= 0)
        {
            line.eqPosInSpaces = 0
            for(var k = 0; k < line.eqRealPos; k++)
            {
                if(line.text.charAt(k) == "\t")
                    line.eqPosInSpaces += tabSize - (line.eqPosInSpaces % tabSize)
                else
                    line.eqPosInSpaces++
            }
            if(line.eqPosInSpaces > maxEqualPos)
                maxEqualPos = line.eqPosInSpaces
        }
        lines.push(line)
    }
    var text = ""
    if (!replaceTabOnInput){
        maxEqualPos = Math.ceil(maxEqualPos/tabSize)*tabSize;
    }
    for(var l in lines)
    {
        var line = lines[l]

        var symbol = replaceTabOnInput ? ' ':'\t';
        var count = (maxEqualPos - line.eqPosInSpaces);

        if (!replaceTabOnInput){
            count = Math.ceil(count/tabSize);
        }
        //count = (count==0) ? 1 : count;
        text += line.text.substr(0, line.eqRealPos) + fillLine(symbol, count) + line.text.substr(line.eqRealPos) + "\n"
    }
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
}


/*
 * Макрос для сдвига текста за символом | (для форматирования запросов)
 * Сдвигает текст вправо/влево вставляя/удаляя при этом заданный символ
 */
function MoveBlock(toLeft, spaceChar)
{
    //debugger
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd || txtWnd.isReadOnly)
        return
    var sel = txtWnd.getSelection()
    var endRow = sel.endRow
 //   if(sel.endCol == 1)
        endRow--
    if(endRow < sel.beginRow)
        return
    var text = ""
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var str = txtWnd.line(l)
        var vlRealPos = str.indexOf("|")
        if(vlRealPos >= 0)
        {
               if (toLeft) //to left
                str = str.replace("|" + spaceChar, "|")
            else //to right
                str = str.replace("|", "|" + spaceChar)
        }
        text += str + "\n"
    }
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
}
function macrosСдвинутьБлокВлевоНаПробел() //hotkey: ctrl+;
{
    MoveBlock(true, " ")
}
function macrosСдвинутьБлокВправоНаПробел() //hotkey: ctrl+'
{
    MoveBlock(false, " ")
}
function macrosСдвинутьБлокВлевоНаТаб() //hotkey: ctrl+shift+;
{
    MoveBlock(true, "\t")
}
function macrosСдвинутьБлокВправоНаТаб() //hotkey: ctrl+shift+'
{
    MoveBlock(false, "\t")
}

// Макрос удаляет white-space символы в конце строк, а также заменяет все \r\n на \n
function macrosУдалитьКонцевыеПробелы()
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd || txtWnd.isReadOnly)
        return
    var replaces = 0, symbols = 0, crnl = 0
    var text = txtWnd.text.replace(/[ \t]+\r*\n/g, function(str)
        {
            replaces++
            symbols += str.length - 1
            if(str.length > 2 && str.charAt(str.length - 2) == '\r')
                crnl++, symbols--
            return '\n'
        }
    )
    if(replaces)
    {
        Message("Исправлено cтрок: " + replaces + "\nУбрано символов: " + symbols + "\nУбрано CR: " + crnl)
        var caretPos = txtWnd.getCaretPos()
        txtWnd.setSelection(1, 1, txtWnd.linesCount + 1, 1)
        txtWnd.selectedText = text;
        txtWnd.setCaretPos(caretPos.beginRow, caretPos.beginCol)
    }
    else
        Message("Все чисто")
}

/*
 * Макрос для выравнивания текста по первой запятой
 * Выстраивает знаки = в выделенном тексте в одну колонку.
 */
function macrosВыровнятьПоПервойЗапятой()
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd)
        return
    var sel = txtWnd.getSelection()
    var endRow = sel.endRow
    if(sel.endCol == 1)
        endRow--
    if(endRow <= sel.beginRow)
        return
    var tabSize = profileRoot.getValue("ModuleTextEditor/TabSize")
    var replaceTabOnInput = profileRoot.getValue("ModuleTextEditor/ReplaceTabOnInput");
    lines = new Array()
    var maxEqualPos = -1
    for(var l = sel.beginRow; l <= endRow; l++)
    {
        var line = {text: txtWnd.line(l)}
        line.eqRealPos = line.text.indexOf(",")
        if(line.eqRealPos >= 0)
        {
            line.eqPosInSpaces = 0
            for(var k = 0; k < line.eqRealPos; k++)
            {
                if(line.text.charAt(k) == "\t")
                    line.eqPosInSpaces += tabSize - (line.eqPosInSpaces % tabSize)
                else
                    line.eqPosInSpaces++
            }
            if(line.eqPosInSpaces > maxEqualPos)
                maxEqualPos = line.eqPosInSpaces
        }
        lines.push(line)
    }
    var text = ""
    if (!replaceTabOnInput){
        maxEqualPos = Math.ceil(maxEqualPos/tabSize)*tabSize;
    }
    for(var l in lines)
    {

        var line = lines[l]

        var symbol = replaceTabOnInput ? ' ':'\t';
        var count = (maxEqualPos - line.eqPosInSpaces);
        if (!replaceTabOnInput){
            count = Math.ceil(count/tabSize);
        }

        //count = (count==0) ? 1 : count;

        var t1 = line.text.substr(0, line.eqRealPos + 1)
        var t2 = line.text.substr(line.eqRealPos + 1).replace(/^\s+/, "")
        text += t1 + fillLine(" ", maxEqualPos - line.eqPosInSpaces + 1) + t2 + "\n"

    }
    txtWnd.setSelection(sel.beginRow, 1, endRow + 1, 1)
    txtWnd.selectedText = text
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(0)
    predef.add("ВыровнятьЗнакиРавно", "Ctrl + =")
    predef.add("СдвинутьБлокВлевоНаПробел", "Ctrl + ;")
    predef.add("СдвинутьБлокВправоНаПробел", "Ctrl + '")
    predef.add("СдвинутьБлокВлевоНаТаб", "Ctrl + Shift + ;")
    predef.add("СдвинутьБлокВправоНаТаб", "Ctrl + Shift + '")
}
