$engine JScript
$uname MetadataChanges
$dname Изменеия метаданных
$addin vbs
$addin global
$addin stdlib

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// для внутреннего пользования... 
// история изменения модулей конфигурации.

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript)

var changes = {}
var propsModules = {"Модуль":"","МодульОбъекта":"", "Форма":"","МодульМенеджера":""}
// Получить полное имя объекта метаданных
function getFullMDName(mdObj)
{
    if(!mdObj)
        return "no object"
    var names = []
    while(true)
    {
        names.unshift(mdObj.name)
        var className = mdObj.mdclass.name(1)
        if(!className.length || !mdObj.parent)
        {
            names.unshift(mdObj.container.identifier)
            break
        }
        names.unshift(className)
        mdObj = mdObj.parent
    }
    return names.join('.')
}

function onMetaDataEvent(e)
{
    /*
        e.kind - 
        e.request - 
            
     */
    if (e.kind < 5 ) {

        var fullname = getFullMDName(e.obj);
        if (!changes[fullname]) {
            var action = "";
            switch (e.kind) {
                case 0:
                    action = "Добавлен";
                    break;
                case 1:
                    action = "Измененно свойство";
                    break;
                case 2:
                    action = "Удаление";
                    break;
                case 3:
                    action = "Изменение объекта";
                    break;
                default:
                    action = "Не знаю почему это выбралось";
                    break;
            }
            changes[fullname+'.'+e.prop.name(1)]=action;
            if(e.prop) {
                if (!(propsModules[e.prop.name(1)]==undefined)){
                    //is module
                    //mdobj["module"]=e.obj.getModuleText(e.prop.name(1))
                    //mdobj["propsModules"] = e.prop.name(1);
                } else {
                   //mdobj["property"] = e.prop.name(1);
                }
            }
        }
    } else {
        if (e.kind > 4 ) {
            changes = {}
        } 
    }
    //}
    // var text = "Metadata event " + e.kind +
        // "\n request: " + e.request +
        // "\n result: " + e.result +
        // "\n container: " + e.container.identifier +
        // "\n object: " + e.obj.name
    // if(e.prop)
        // text += "\n property: " + e.prop.name(1)
    // text += "\n full metadata "+getFullMDName(e.obj)
    // Message(text)
}

function macrosЗапуститьЛогированиеСобытийМетаданных(){
    events.connect(metadata, "MetaDataEvent", SelfScript.self, "onMetaDataEvent")
}

function macrosВывестиИзменныеОбъекты() {
    for (var key in changes){
        Message(key+"\n        "+changes[key]
    }
}

function macrosClearChanges(){
    changes = {}
}

SelfScript.self["macrosОчистить список изменений"] = function(){
    macrosClearChanges();
}
function findMdObj(uuid)
{
    if(uuid == metadata.current.rootObject.id)
        return metadata.current.rootObject
    return metadata.current.findByUUID(uuid);
}
