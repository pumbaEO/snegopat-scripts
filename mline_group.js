$engine JScript
$uname mline_group
$dname Группировка длинных строк

/* (c) Александр Орефков
 * Скрипт предназначен для быстрой вставки маркеров группировки текста //{ и //}
 * перед и после многострочных литералов.
 * Содержит два макроса:
 *   СгруппироватьВсе - вставляет маркеры группировки вокруг всех многострочных
 *       литералов текущего модуля
 *   СгруппироватьТекущий - вставляет маркеры группировки вокруг многострочного
 *       литерала, в котором находится курсор.
 */

var reMultiLine = /^\s*[|"]/
var reMarkerOpen = /^\s*\/\/[^}]*{/
var reMarkerClose = /^\s*\/\/[^{]*}/

function getIndent(s)
{
    var m = s.match(/^\s+/)
    return m ? m[0] : ''
}

function macrosСгруппироватьТекущий()
{
    var wnd = snegopat.activeTextWindow()
    if(!wnd || wnd.isReadOnly)
        return false
    var sel = wnd.getSelection()
    var line = wnd.line(sel.beginRow)
    if(!reMultiLine.test(line))    // Это не мульти-строка
        return
    var text = [line], modified = false
    for(var i = sel.beginRow - 1; i > 0; i--)
    {
        line = wnd.line(i)
        if(!reMultiLine.test(line))    // это не мульти-строка
        {
            if(!reMarkerOpen.test(line))   // это не открывающий маркер
            {
                text.unshift(getIndent(wnd.line(i + 1)) + "//{")
                modified = true;
            }
            break
        }
        text.unshift(line)
    }
    for(var j = sel.beginRow + 1, c = wnd.linesCount; j <= c; j++)
    {
        line = wnd.line(j)
        if(!reMultiLine.test(line))    // это не мульти-строка
        {
            if(!reMarkerClose.test(line))  // это не закрывающий маркер
            {
                text.push(getIndent(wnd.line(j - 1)) + "//}")
                modified = true
            }
            break
        }
        text.push(line)
    }
    if(modified)
    {
        wnd.setSelection(i + 1, 1, j, 1)
        wnd.selectedText = text.join('\n') + '\n'
        wnd.setCaretPos(i + 1, 1)
    }
}

function macrosСгруппироватьВсе()
{
    var wnd = snegopat.activeTextWindow()
    if(!wnd || wnd.isReadOnly)
        return false
    var inMultiLine = false, hasMarker = false, modified = false
    var text = []
    for(var i = 1, c = wnd.linesCount; i <= c; i++)
    {
        var line = wnd.line(i)
        if(reMultiLine.test(line)) // это мульти-строка
        {
            if(!inMultiLine)    // это первая мульти-строка
            {
                if(!hasMarker)  // перед ней не было маркера //{
                {
                    text.push(getIndent(line) + "//{")
                    modified = true
                }
                inMultiLine = true
            }
        }
        else    // это не мульти строка
        {
            if(inMultiLine) // До этого шли мульти-строки
            {
                if(!reMarkerClose.test(line))   // это не закрывающий маркер
                {
                    text.push(getIndent(wnd.line(i - 1)) + "//}")
                    modified = true
                }
                inMultiLine = false
            }
            hasMarker = reMarkerOpen.test(line)
        }
        text.push(line)
    }
    if(modified)
    {
        wnd.setSelection(1, 1, c + 1, 1)
        wnd.selectedText = text.join('\n')
    }
    return true;
}