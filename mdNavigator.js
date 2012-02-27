$engine JScript
$uname mdNavigator
$dname Навигатор по метаданным

// (c) Евгений JohnyDeath Мартыненков

function printMdObj(mdObj, indent, text, parentName)
{
    // Получим и покажем класс объекта
    var mdc = mdObj.mdclass;
    var curName;
    if (mdObj == metadata.current.rootObject) {
        curName = "Конфигурация";
    }
    else{
        curName = (parentName == "Конфигурация" ? "" : parentName + ".") + mdc.name(1) + "." + mdObj.property("Имя");
    };

    text.push(curName + "|" + mdObj.id);

    // Перебираем классы потомков (например у Документа это Реквизиты, ТабличныеЧасти, Формы)
    for(var i = 0; i < mdc.childsClassesCount; i++)
    {
        var childMdClass = mdc.childClassAt(i)
        //Реквизиты пропустим
        if (childMdClass.name(1, true) == "Реквизиты") {continue;};

        // Для остального переберем потомков этого класса.
        for(var chldidx = 0, c = mdObj.childObjectsCount(i); chldidx < c; chldidx++){
            var childObject = mdObj.childObject(i, chldidx);
            printMdObj(childObject, indent + "\t", text, curName);
        }
    }
}

function PropsOfMdObj(mdObj){
    var text = []
    var mdc = mdObj.mdclass
    var okStr = "Модуль,Картинка,Форма,МодульОбъекта,МодульМенеджера,";

    for(var i = 0, c = mdc.propertiesCount; i < c; i++)
    {
        var mdPropName = mdc.propertyAt(i).name(1);
        if (okStr.search(mdPropName + '\,') != -1)
            text.push(mdPropName);
    }

    return text;
}

SelfScript.self['macrosОткрыть объект метаданных'] = function()
{
    text = [];
    printMdObj(metadata.current.rootObject, "", text, "");

    var svc = new ActiveXObject("Svcsvc.Service");
    var Path =  "";
    //Path = svc.SelectInTree(text.join('\n'),"", false , false);
    Path = svc.FilterValue(text.join('\n'),1 + 512,"",0,0)

    var re = /(\S+\|)(\S+)/
    Path = Path.replace(re, "$2")

    if (Path == "") return;

    var nObject = metadata.current.rootObject;
    if (nObject.id != Path)
        nObject = metadata.current.findByUUID(Path);

    var arProps = PropsOfMdObj(nObject);
    var propName = "Активировать в дереве" + '\n' + "Открыть редактор объекта"; //эти действия применимы ко всем объектам

    //if (arProps.length > 1)
        var propName = svc.FilterValue(propName + '\n' + arProps.join('\n'), 1 + 512, "", 0, 0)

    switch (propName) {
        case "":
            return;
            break;
        case "Активировать в дереве":
            nObject.activateInTree();
            break;
        case "Открыть редактор объекта":
            nObject.openEditor();
            break;
        default:
            nObject.editProperty(propName);
    }

}
