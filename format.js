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
