$engine JScript
$uname codegen_create_doc
$dname Генератор Документов

// (c) Александр Орефков orefkov at gmail.com
// Скрипт - генератор кода создания нового документа
//
var docMdClassID            = "{061D872A-5787-460E-95AC-ED74EA3A3E84}"
var docAttrMdClassID        = "{45E46CBC-3E24-4165-8B7B-CC98A6F80211}"
var docTPmdClassID          = "{21C53E09-8950-4B5E-A6A0-1054F1BBC274}"
var typeMdPropID            = "{B1053250-ABE6-11D4-9434-004095E12FC7}"
var commentMdPropID         = "{CF4ABEA4-37B2-11D4-940F-008048DA11F9}"
var attrTypeCategory        = "{30E571BC-A897-4A78-B2E5-1EA6D48B5742}"
var docTPAttrMdClass        = "{888744E1-B616-11D4-9436-004095E12FC7}"

function macrosСоздатьНовый()
{
    // Для начала выберем вид документа
    var docKind = snegopat.parseTemplateString('<?"Выберите вид документа", Документ>')
    if(!docKind.length)
        return
    var varName = snegopat.parseTemplateString('<?"Введите имя переменной">')
    
    // Получим список возможных типов
    var tf = new TypeFinder()
        
    var mdObj = findMDObjectInChilds(metadata.current.rootObject, docMdClassID, docKind)
    
    var text = "//{ Создание документа " + docKind + " в " + varName +"\n" + varName + " = Документы." + docKind + ".СоздатьДокумент();\n"
    // Обработаем реквизиты документа
    text += processAttribs(" Заполнение реквизитов", "", "", varName, mdObj, docAttrMdClassID, tf)
    // Обработаем табличные части
    var tabPartsCount = mdObj.childObjectsCount(docTPmdClassID)
    if(tabPartsCount)
    {
        var lineVarName = varName + "Строка"
        if(tabPartsCount > 1)
            text += "//{  Заполнение табличных частей\n"
        for(var i = 0; i < tabPartsCount; i++)
        {
            var tp = mdObj.childObject(docTPmdClassID, i)
            text += processAttribs("  Заполнение табличной части " + tp.name,
                "Для Каждого Из Цикл\n\t" + lineVarName + " = " + varName + "." + tp.name + ".Добавить();\n" , "КонецЦикла;\n",
                "\t" + lineVarName, tp, docTPAttrMdClass, tf)
        }
        if(tabPartsCount > 1)
            text += "//}  Заполнение табличных частей\n"
    }
    text += "//} Создание документа " + docKind + " в " + varName
    textOut(text, true)
}

function textOut(text, caretInBegin)
{
    var txtWnd = snegopat.activeTextWindow()
    if(!txtWnd)
        Message(text)
    else
    {
        // Надо получить отступ
        var sel = txtWnd.getSelection()
        var textLine = txtWnd.line(sel.beginRow)
        // Курсор может быть за концом строки
        while(textLine.length < sel.beginCol - 1)	
            textLine += ' '
        // Оставим только часть строки перед курсором
        textLine = textLine.substr(0, sel.beginCol - 1)
        var m = textLine.match(/^\s+/)
        if(m)	// Есть пробельные символы в начале строки
            text = text.replace(/\n/g, '\n' + m[0])	// Заменим переводы строк на перевод строк + отступ
        text = text.replace(/\s+$/m, '')			// СокрП
        // Вставим текст
        txtWnd.selectedText = text
        if(caretInBegin)
            txtWnd.setCaretPos(sel.beginRow, sel.beginCol)
    }
}

function processAttribs(comment, header, footer, line, obj, attrMdClass, tf)
{
    var lines = []
    for(var i = 0, cnt = obj.childObjectsCount(attrMdClass); i < cnt; i++)
    {
        var attr = obj.childObject(attrMdClass, i)
        var l = line + "." + attr.name + " = ; // " + tf.getTypeString(attr)
        var c = attr.property(commentMdPropID)
        if(c.length)
            l += " / " + c + " /"
        lines.push(l)
    }
    if(lines.length)
        return "//{ " + comment + "\n" + header + formatAssign(lines) + footer + "//} " + comment + "\n"
    else
        return ""
}

function findMDObjectInChilds(parent, childMdClass, name)
{
    for(var i = 0, cnt = parent.childObjectsCount(childMdClass); i < cnt; i++)
    {
        var mdObj = parent.childObject(childMdClass, i)
        if(mdObj.name == name)
            return mdObj
    }
    return undefined
}

function TypeFinder()
{
    var types = new VBArray(metadata.current.typeList(attrTypeCategory, 1)).toArray()
    for(var i in types)
    {
        var t = types[i].split(",")
        this[t[1]] = t[0]
    }
}

TypeFinder.prototype.getTypeString = function(mdObj)
{
    var text = []
    var types = new VBArray(mdObj.types()).toArray()
    for(var i in types)
        text.push(this[types[i]]);
    return text.join(", ")
}

// Функция, обрабатывает переданный массив строк, выравнивая в них знаки "="
function formatAssign(lines)
{
    var tabSize = profileRoot.getValue("ModuleTextEditor/TabSize")
    var ll = []
    maxEqualPos = -1
    for(var l in lines)
    {
        var line = {text: lines[l]}
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
        ll.push(line)
    }
    var text = ""
    for(var l in ll)
    {
        var line = ll[l]
        if(line.eqRealPos < 0)
            text += line.text + "\n"
        else
            text += line.text.substr(0, line.eqRealPos) + fillLine(" ", maxEqualPos - line.eqPosInSpaces) + line.text.substr(line.eqRealPos) + "\n"
    }
    return text
}

function fillLine(symbol, count)
{
    var text = ""
    while(count--)
        text += symbol
    return text
}
