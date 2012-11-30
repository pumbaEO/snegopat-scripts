$engine JScript
$uname codegen_create_type
$dname Генератор Описания типов... 
$addin codegen_manager
$addin stdlib
$addin vbs

// (c) Александр Орефков orefkov at gmail.com
//      Сосна Евгений <shenja@sosna.zp.ua>
// Скрипт - генератор кода, обманим подсказку 1С.
//

var attrTypeCategory        = "{30E571BC-A897-4A78-B2E5-1EA6D48B5742}" 
var СтандартныеРеквизиты    = ["Код", "Наименование", "Родитель", "Владелец", "ПометкаУдаления", "Ссылка"]
codegen_manager.registerCodeGen("#Если _ Тогда/Справочник", genarateNewRefs);
codegen_manager.registerCodeGen("#Если _ Тогда/Документ", genarateNewDoc);
codegen_manager.registerCodeGen("#Если _ Тогда/ПроизвольныйТип", genarateNewType);

function getWordUnderCursor(){
    extSearch = stdlib.require(stdlib.getSnegopatMainFolder()+'scripts\\extSearch.js').GetExtSearch();
    selText = ''
    w = extSearch.watcher.getActiveTextWindow();
    if (!w) return ''
    var selText = w.GetSelectedText();
    if (selText == '')
        selText = w.GetWordUnderCursor();

    return selText
    
}

function genarateNewRefs(param)
{
    // Для начала выберем вид справочника
    var docKind = snegopat.parseTemplateString('<?"Выберите вид справочника", Справочник>')
    if(!docKind.length)
        return false
    selText = getWordUnderCursor();
    if (!selText.length){
        selText ="спр" + docKind 
    }
    vbs.result = selText
    var varName = vbs.DoExecute('InputString result, "Укажите название переменной"')
    
    // Получим список возможных типов
    var tf = new codegen_manager.TypeFinder()
        
    var mdObj = param.mdCont.rootObject.childObject("Справочники", docKind)
 
    var defLangID = stdlib.getUuidFomMDRef(param.mdCont.rootObject.property("ОсновнойЯзык"))
    var defLangMD = param.mdCont.findByUUID(defLangID)
    var syn = mdObj.synonym(defLangMD.property("КодЯзыка"))
    if(!syn.length)
        syn = docKind
    
    var text = "#Если _ Тогда\n";
    text += varName + ' = Справочники.' + docKind + '.СоздатьЭлемент();\n'
    text +="#КонецЕсли"
    param.text = text
    return true
}

function genarateNewDoc(param)
{
    // Для начала выберем вид справочника
    var docKind = snegopat.parseTemplateString('<?"Выберите вид справочника", Документ>')
    if(!docKind.length)
        return false
    selText = getWordUnderCursor();
    if (!selText.length){
        selText ="док" + docKind 
    }
    vbs.result = selText
    var varName = vbs.DoExecute('InputString result, "Укажите название переменной"')
    
    // Получим список возможных типов
    var tf = new codegen_manager.TypeFinder()
        
    var mdObj = param.mdCont.rootObject.childObject("Документы", docKind)
    
    var defLangID = stdlib.getUuidFomMDRef(param.mdCont.rootObject.property("ОсновнойЯзык"))
    var defLangMD = param.mdCont.findByUUID(defLangID)
    var syn = mdObj.synonym(defLangMD.property("КодЯзыка"))
    if(!syn.length)
        syn = docKind
    
    var text = "#Если _ Тогда\n";
    text += varName + ' = Документы.' + docKind + '.СоздатьДокумент();\n'
    text +="#КонецЕсли"
    param.text = text
    return true
}

function genarateNewType(param)
{
    // Для начала выберем вид справочника
    var docKind = snegopat.parseTemplateString('<?"Выберите тип ", КонструкторОписанияТипов>')
    if(!docKind.length)
        return false
    selText = getWordUnderCursor();
    if (!selText.length){
        selText ="Элемент"
    }
    vbs.result = selText
    var varName = vbs.DoExecute('InputString result, "Укажите название переменной"')
    
    // Получим список возможных типов
    var tf = new codegen_manager.TypeFinder()
    
    var re = new RegExp('(Новый\\s)ОписаниеТипов\\(\\"([А-я_0-9]{1,})\\"\\).*', 'gi');
    var matches = re.exec(docKind);
    if (matches && matches.length) 
    {        
        var text = "#Если _ Тогда\n";
        text += varName + ' = ' + matches[1] + ''+matches[2]+';\n';
        text +="#КонецЕсли"
        param.text = text
    }else {
        return false;
    }
    return true
}
