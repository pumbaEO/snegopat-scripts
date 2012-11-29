$engine JScript
$uname CfgStore
$dname Хранилище
$addin global
$addin stdcommands
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Хранилище" (CfgStore.js) для проекта "Снегопат"
////
//// Описание: 
////	Есть макрос Захватить объект в хранилище (временно хоткей "Ctrl + Alt + T") 
////	макрос захватывает любой текущий объект (модуль, форму, макет, сам объект и т.п.) в хранилище.
////	Важно: захват всегда идет без рекурсии, только текущий объект, имхо это более правильно при редактировании текущего объекта.
////	для внешних объектов макрос ничего не делает.
////
//// Автор: Артур Аюханов <aartbear@gmail.com>
////}
////////////////////////////////////////////////////////////////////////////////////////

stdlib.require('TextWindow.js', SelfScript);

global.connectGlobals(SelfScript);

function getPredefinedHotkeys(predef){
    predef.setVersion(1);
    predef.add("Захватить объект в хранилище", "Ctrl + Alt + T");
}

function CaptureIntoCfgStore(mdObj){
    if (!mdObj)
        return
    try{
        res1 = mdObj.activateInTree();
        
        res2 = events.connect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")
        isEventConnected = true

        res = stdcommands.CfgStore.CaptureIntoCfgStore.send() // true если успешно

        if(isEventConnected)
            events.disconnect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")    
    } catch (e) {
        Message("Ошибка : " + e.description)
    }    
}

isEventConnected = false

SelfScript.self['macrosЗахватить объект в хранилище'] = function() {

    try{ //иногда вылетают странные исключения :( при работе с элементами форм
        view = windows.getActiveView();
        if (!view || !view.mdObj || view.mdObj.container != metadata.current) return false;
        CaptureIntoCfgStore(view.mdObj);
        if(view)
            view.activate();
    }catch(e)
    {
        Message("Ошибка : " + e.description)
    }

    return true;
}

SelfScript.self['macrosПоместить объект в хранилище'] = function() {

    try{ //иногда вылетают странные исключения :( при работе с элементами форм
        view = windows.getActiveView();
        if (!view || !view.mdObj || view.mdObj.container != metadata.current) return false;
        
        
        res1 = view.mdObj.activateInTree();
        
        isEventConnected = true

        res = stdcommands.CfgStore.StoreIntoCfgStore.send() // true если успешно

    }catch(e)
    {
        Message("Ошибка : " + e.description)
    }

    return true;
}

function hookCaptureCfgStoreWindow(dlgInfo)
{
   if(dlgInfo.stage == openModalWnd)
   {
        try{ //иногда вылетают странные исключения :( при работе с элементами форм
            dlgInfo.form.getControl("GetRecursive").value = false;
        
            events.disconnect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")
            isEventConnected = false
          
            //new ActiveXObject("WScript.Shell").SendKeys("^{ENTER}")
            // Более идеологически верный способ
            dlgInfo.cancel = true
            dlgInfo.result = mbaOK
        }catch(e)
        {
            Message("Ошибка : " + e.description)
        }
   }
}
