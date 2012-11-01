$engine JScript
$uname codegen_create_doc
$dname Генератор Документов
$addin codegen_manager
$addin stdlib
$addin vbs

// (c) Александр Орефков orefkov at gmail.com
// Скрипт - генератор кода создания нового документа
//

var attrTypeCategory        = "{30E571BC-A897-4A78-B2E5-1EA6D48B5742}"
var СтандартныеРеквизиты    = {"Номер":"", "Дата":"",
                            "ПометкаУдаления":"", "Ссылка":"",
                            "Проведен":""
                            }


codegen_manager.registerCodeGen("Документы/Новый/С заполнением всех реквизитов", genarateNewDoc)

function genarateNewDoc(param)
{
    // Для начала выберем вид документа
    var docKind = snegopat.parseTemplateString('<?"Выберите вид документа", Документ>')
    if(!docKind.length)
        return false
    vbs.result = "док" + docKind
    var varName = vbs.DoExecute('InputString result, "Укажите название переменной"')
    
    // Получим список возможных типов
    var tf = new codegen_manager.TypeFinder()
        
    var mdObj = param.mdCont.rootObject.childObject("Документы", docKind)
    
    var defLangID = stdlib.getUuidFomMDRef(param.mdCont.rootObject.property("ОсновнойЯзык"))
    //var defLangMD = metadata.current.rootObject.childObject("Языки", defLangID)
    var defLangMD = param.mdCont.findByUUID(defLangID)
    var syn = mdObj.synonym(defLangMD.property("КодЯзыка"))
    if(!syn.length)
        syn = docKind
    
    var text = '//{ Создание документа "' + syn + '" в ' + varName +'\n' + varName + ' = Документы.' + docKind + '.СоздатьДокумент();\n'
    // Обработаем стандартные реквизиты документа. 
    text += processStanartAttribs(" Заполнение стандартных реквизитов", "", "", СтандартныеРеквизиты, varName, mdObj, tf);
     // Обработаем реквизиты документа
    text += processAttribs(" Заполнение реквизитов", "", "", varName, mdObj, tf)
    // Обработаем табличные части
    var tabPartsCount = mdObj.childObjectsCount("ТабличныеЧасти")
    if(tabPartsCount)
    {
        var lineVarName = varName + "Строка",
            indent = profileRoot.getValue("ModuleTextEditor/ReplaceTabOnInput") ? codegen_manager.fillLine(" ", profileRoot.getValue("ModuleTextEditor/TabSize")) : "\t"
        if(tabPartsCount > 1)
            text += "//{  Заполнение табличных частей\n"
        for(var i = 0; i < tabPartsCount; i++)
        {
            var tp = mdObj.childObject("ТабличныеЧасти", i)
            text += processAttribs("  Заполнение табличной части " + tp.name,
                "Для Каждого Из Цикл\n" + indent + lineVarName + " = " + varName + "." + tp.name + ".Добавить();\n" , "КонецЦикла;\n",
                indent + lineVarName, tp, tf)
        }
        if(tabPartsCount > 1)
            text += "//}  Заполнение табличных частей\n"
    }
    text += "//} Создание документа " + docKind + " в " + varName
    param.text = text
    return true
}

function processAttribs(comment, header, footer, line, obj, tf)
{
    var lines = []
    for(var i = 0, cnt = obj.childObjectsCount("Реквизиты"); i < cnt; i++)
    {
        var attr = obj.childObject("Реквизиты", i)
        var l = line + "." + attr.name + " = ; // " + tf.getTypeString(attr)
        var c = attr.comment
        if(c.length)
            l += " / " + c
        lines.push(l)
    }
    if(lines.length)
        return "//{ " + comment + "\n" + header + codegen_manager.formatAssign(lines) + footer + "//} " + comment + "\n"
    else
        return ""
}


function processStanartAttribs(comment, header, footer, attributes, line, obj, tf) {
    var lines = []
    for (var key in attributes) {
        var l = line + "." + key + " = ; // " //+ tf.getTypeString(attr) 
        lines.push(l);
    }
    if(lines.length)
        return "//{ " + comment + "\n" + header + codegen_manager.formatAssign(lines) + footer + "//} " + comment + "\n"
    else
        return ""
}
