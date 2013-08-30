$engine JScript
$uname MetadataChanges
$dname Изменеия метаданных
$addin global
$addin stdlib

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// Тест истории изменения модулей конфигурации.

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
    if (e.kind < 4 ) {

        var fullname = (e.kind!=2)?getFullMDName(e.obj):""+e.container.identifier+" "+e.obj.name;
        
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
            var prop = "";
            if (e.prop) {
                var prop = e.prop.name(1);
            }

            changes[fullname+'.'+prop]=action;
            //Message(""+fullname + '.'+prop+" action "+action);
            //Оставлю этот кусочек на будущее, для получения текста модуля. 
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
     /*var text = "Metadata event " + e.kind +
         "\n request: " + e.request +
         "\n result: " + e.result +
         "\n container: " + e.container.identifier +
         "\n object: " + e.obj.name
     if(e.prop)
         text += "\n property: " + e.prop.name(1)
     text += "\n full metadata "+getFullMDName(e.obj)
    Message(text) */
}

function macrosЗапуститьЛогированиеСобытийМетаданных(){
    events.connect(metadata, "MetaDataEvent", SelfScript.self, "onMetaDataEvent")
}

function macrosВывестиИзменныеОбъекты() {
    if (changes.length==0) {
        Message("Вроде нет изменений, если видишь * в конфигурации, значит где-то скрипт работает неправильно.")
    }
    for (var key in changes){
        Message(key+"\n        "+changes[key]);
    }
}

function macrosClearChanges(){
    changes = {};
}



SelfScript.self["macrosОчистить список изменений"] = function(){
    macrosClearChanges();
}

SelfScript.self["macrosОстановить логирование"] = function(){
    events.disconnect(metadata, "MetaDataEvent", SelfScript.self, "onMetaDataEvent");
}
function findMdObj(uuid)
{
    if(uuid == metadata.current.rootObject.id)
        return metadata.current.rootObject
    return metadata.current.findByUUID(uuid);
}

(function() {
    macrosЗапуститьЛогированиеСобытийМетаданных()
})()