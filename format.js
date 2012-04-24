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
    var tabSize = profileRoot.getValue("ModuleTextEditor/TabSize")
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
    for(var l in lines)
    {
        var line = lines[l]
        if(line.eqRealPos < 0)
            text += line.text + "\n"
        else
            text += line.text.substr(0, line.eqRealPos) + fillLine(" ", maxEqualPos - line.eqPosInSpaces) + line.text.substr(line.eqRealPos) + "\n"
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
    if(!txtWnd)
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

function getPredefinedHotkeys(predef)
{
    predef.setVersion(0)
    predef.add("ВыровнятьЗнакиРавно", "Ctrl + =")
    predef.add("СдвинутьБлокВлевоНаПробел", "Ctrl + ;")
    predef.add("СдвинутьБлокВправоНаПробел", "Ctrl + '")
    predef.add("СдвинутьБлокВлевоНаТаб", "Ctrl + Shift + ;")
    predef.add("СдвинутьБлокВправоНаТаб", "Ctrl + Shift + '")
}
