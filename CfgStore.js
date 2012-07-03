$engine JScript
$uname CfgStore
$dname Хранилище
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('TextWindow.js', SelfScript);

global.connectGlobals(SelfScript);

function getPredefinedHotkeys(predef){
    predef.setVersion(1);
    predef.add("Захватить объект в хранилище", "Ctrl + Alt + T");
}

SelfScript.self['macrosЗахватить объект в хранилище'] = function() {

    var w = GetTextWindow();
    if (!w) return false;
    
    view = w.GetView();
    if (!view) return false;
    
    res1 = view.mdObj.activateInTree(); //windows.activeView.mdObj.activateInTree()
    
    res2 = events.connect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")

    res = stdcommands.CfgStore.CaptureIntoCfgStore.send() // true если успешно

    events.disconnect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")
}

function hookCaptureCfgStoreWindow(dlgInfo)
{
   if(dlgInfo.stage == openModalWnd)
   {
      dlgInfo.form.getControl("GetRecursive").value = false;
        //events.disconnect(windows, "onDoModal", SelfScript.self, "hookCaptureCfgStoreWindow")
      var wsh = new ActiveXObject("WScript.Shell")
      //wsh.SendKeys('^~')
      wsh.SendKeys("^{ENTER}")
   }
}