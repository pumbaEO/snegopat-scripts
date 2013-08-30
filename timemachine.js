$engine JScript
$uname TimeMachine
$dname i1CTimeMachine
$addin vbs
$addin global
$addin stdlib

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// для внутреннего пользования... 
// история изменения модулей конфигурации.

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('ScriptForm.js', SelfScript);
global.connectGlobals(SelfScript)

var versions = {}
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
     
    //if(e.kind == 1 || e.kind == 6) {
        //Зарегистрируем изменения
        mdobj = {"uuid":e.obj.id}
        fullmd = getFullMDName(e.obj)
        mdobj["fullmd"]=fullmd
        if (versions[fullmd]==undefined)
            versions[fullmd] = new Array()
        var listver = versions[fullmd]
        var i=listver.length;
        if(e.prop) {
            if (!(propsModules[e.prop.name(1)]==undefined)){
            //is module
                mdobj["module"]=e.obj.getModuleText(e.prop.name(1))
                mdobj["propsModules"] = e.prop.name(1);
            } else {
               mdobj["property"] = e.prop.name(1);
            }
        }
        mdobj["object"]=e.obj.name
        mdobj["container"]=e.container.identifier
        listver.push(mdobj)
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

function macrosTestModifyMetadat(){
    events.connect(metadata, "MetaDataEvent", SelfScript.self, "onMetaDataEvent")
}

function macrosTestPrintModifedObjects() {
    for (var key in versions) {
        var ar = versions[key]
        Message(" object:"+key)
        var isFirstText = true;
        var arrayToCompare = new Array()
        var prop = "";
        //var twoText = "";
        if (ar.length >0){
            for (var i=0;i<ar.length; i++){
                mdobj = ar[i]
                var mdObj = findMdObj(mdobj["uuid"]);
                if(!mdObj)
                {
                    MessageBox("Объект '" + curRow.Name + "' не найден.");
                    break
                }
                Message("   version:"+i)
                if (!mdobj["module"]){
                
                    for (var keyobj in mdobj) {
                        Message("      "+keyobj+":"+mdobj[keyobj])
                    }
                } else {
                    prop = mdobj["propsModules"]
                    if (isFirstText){
                        arrayToCompare = new Array()
                        isFirstText = false
                        arrayToCompare[0]=mdobj["module"]
                    } else {
                        arrayToCompare[1]=mdobj["module"]
                        isFirstText = true
                    }
                }
            }
            if (arrayToCompare.length>1){
                var fc = v8New("СравнениеФайлов")
                var tempFile1 = GetTempFileName('txt')
                var TextDoc = v8New("ТекстовыйДокумент");
                TextDoc.SetText(arrayToCompare[0]);
                TextDoc.Write(tempFile1);
                fc.ПервыйФайл = tempFile1;
                var tempFile2 = GetTempFileName('txt')
                var TextDoc = v8New("ТекстовыйДокумент");
                TextDoc.SetText(arrayToCompare[1]);
                TextDoc.Write(tempFile2);
                fc.ВторойФайл = tempFile2;
                fc.СпособСравнения = СпособСравненияФайлов.ТекстовыйДокумент;
                fc.ПоказатьРазличия();
            } else {
                if (arrayToCompare.length>0){
                    var fc = v8New("СравнениеФайлов")
                    var tempFile1 = GetTempFileName('txt')
                    var TextDoc = v8New("ТекстовыйДокумент");
                    TextDoc.SetText(arrayToCompare[0]);
                    TextDoc.Write(tempFile1);
                    fc.ПервыйФайл = tempFile1;
                    
                    text = mdObj.getModuleText(prop)
                    var tempFile2 = GetTempFileName('txt')
                    var TextDoc = v8New("ТекстовыйДокумент");
                    TextDoc.SetText(text);
                    TextDoc.Write(tempFile2);
                    fc.ВторойФайл = tempFile2;
                    fc.СпособСравнения = СпособСравненияФайлов.ТекстовыйДокумент;
                    fc.ПоказатьРазличия();
                }
                
            }
        }
    }
}


function findMdObj(uuid)
{
    if(uuid == metadata.current.rootObject.id)
        return metadata.current.rootObject
    return metadata.current.findByUUID(uuid);
}
var pflTiemMachineBase     = "TimeMachine/Versions"
versions = {};
versions["test"]=""
profileRoot.createValue(pflTiemMachineBase, versions, pflBase)
versions = profileRoot.getValue(pflTiemMachineBase)
if (versions== undefined)
    versions = {}