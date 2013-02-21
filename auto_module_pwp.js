$engine JScript
$uname auto_module_pwd
$dname Авто-ввод паролей на модуль
$addin stdcommands
$addin global
$addin vbs
$addin stdlib

global.connectGlobals(SelfScript)
var wapi = stdlib.require('winapi.js')

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт, для облегчения работы с паролями на модули.
// При срабатывании команды "Установить пароль на модуль" он автоматически указывает в окне ввода пароля
// заданный в настройках пароль.
// При открытии же запароленного модуля пытается открыть его этим же паролем.

// Зададим пути хранения настроек
var pflPath = "AutoModulePass/"
var pflPwd = pflPath + "pwd"                       // Пароль
var pflShowMessage = pflPath + "ShowMessage"        // Показывать сообщение при подстановке
var prevConnectSuccessed = true
var savedPassword

// Настройку отображения сообщений будем хранить едино для всех баз, в профиле Снегопата
profileRoot.createValue(pflShowMessage, true, pflSnegopat)
// Автопароль хранится отдельно для каждой базы/пользователя
profileRoot.createValue(pflPwd, "", pflBaseUser)    // Храним отдельно для базы/пользователя
savedPassword = profileRoot.getValue(pflPwd)

//////////////////////////////////////////////////////////////////////////
// Часть скрипта по авто-вводу пароля при установке

// Для начала будем отлавливать вызов команды "Установить пароль на модуль"
stdcommands.ModulePass.SetPassword.addHandler(SelfScript.self, "onCmdSetPassword")

// Вызывается при выполнении команды "Установить пароль на модуль"
function onCmdSetPassword(param)
{
    if(param.isBefore)
    {
        // Вызов перед обработкой команды. Подключим обработчик модальных диалогов
        events.connect(windows, "onDoModal", SelfScript.self)
    }
    else
    {
        // Вызов после обработки команды. Отключим обработчик модальных диалогов
        events.disconnect(windows, "onDoModal", SelfScript.self)
    }
}

// Обработчик показа модальных окон.
// Вызывается во время обработки команды "Установить пароль"
// Если на модуль уже установлен пароль, то сначала будет диалог с запросом пароля
function onDoModal(dlgInfo)
{
    try{
    var ctrlPwd = dlgInfo.form.getControl("Password")
    var ctrlConfirm = dlgInfo.form.getControl("ConfirmPassword")
    }catch(e){}
    if(!ctrlPwd || !ctrlConfirm)
        return
    if(dlgInfo.stage == beforeDoModal)
    {
        if(savedPassword.length)
        {
            ctrlPwd.value = savedPassword       // Вводим данные
            ctrlConfirm.value = savedPassword   // в поля диалога
            dlgInfo.cancel = true   // Отменяем показ диалога
            dlgInfo.result = 1      // как будто в нем нажали Ок
            if(profileRoot.getValue(pflShowMessage))    // Информируем пользователя, если он хочет
                Message("Установлен пароль на модуль: " + savedPassword)
        }
    }
    else if(dlgInfo.stage == afterDoModal && dlgInfo.result == 1)
    {
        // ВАЖНО. Если мы в предыдущем коде программно отменили показ диалога,
        // afterDoModal не вызывается, т.е. сюда попадаем когда автопароль не был установлен
        var pwd = ctrlPwd.value
        // Если есть пароль, и оба введенных пароля совпадают, предложим сохранить его
        if(pwd.length && pwd == ctrlConfirm.value && MessageBox("Подставлять указанный пароль при последующих назначениях пароля?",
            mbYesNo | mbDefButton1 | mbIconQuestion) == mbaYes)
        {
            // Сохраним пароль
            savedPassword = pwd
            profileRoot.setValue(pflPwd, savedPassword)
        }
    }
}

//////////////////////////////////////////////////////////////////////////
// Часть скрипта по автовводу пароля при открытии запароленных модулей

events.connect(Designer, "onIdle", SelfScript.self)
var processedViews = {}
//debugger
function onIdle()
{
    if(!savedPassword || windows.modalMode != msNone)
        return
    // Получим активное отображение
    var view = windows.getFocusedView()
    if(!view || !view.mdObj || !view.mdProp)
        return
    // Проверим, а не модуль ли это и не обрабатывает ли он команду установки пароля
    if(view.mdObj.isPropModule(view.mdProp.id) && stdcommands.ModulePass.SetPassword.getState())
    {
        var tw = snegopat.activeTextWindow()
        if(tw)
        {
            var hwnd = wapi.GetFocus()
            if(!wapi.IsChild(view.hwnd, hwnd))
                return
        }

        // Получим редактор модуля
        try{
            // Если модуль запаролен и пароль не введен, тут будет исключение
            view.mdObj.openModule(view.mdProp.id)
            // Ошибки не было, значит пароль не нужен
            return
        }catch(e){}
        // Попробуем ввести пароль, если еще не пробовали
        if(!processedViews[view.id])
        {
            processedViews[view.id] = true
            var hwnd = wapi.GetFocus()
            for(var i = 0; i < savedPassword.length; i++)
                wapi.SendMessage(hwnd, wapi.wndMsg.WM_CHAR, savedPassword.charCodeAt(i), 0)
            new ActiveXObject("WScript.Shell").SendKeys("~")
            if(profileRoot.getValue(pflShowMessage))    // Информируем пользователя, если он хочет
                Message("Введен пароль на модуль")
        }
    }
}

//////////////////////////////////////////////////////////////////////////
// Макросы для настройки скрипта

SelfScript.self["macrosЗадать авто-пароль"] = function()
{
    vbs.result = savedPassword
    var pwd = vbs.DoExecute('InputString result, "Укажите авто-пароль"')
    if(pwd != savedPassword)
    {
        savedPassword = pwd
        profileRoot.setValue(pflPwd, savedPassword);
    }
}

SelfScript.self["macrosПоказывать сообщение при автовводе пароля"] = function()
{
    profileRoot.setValue(pflShowMessage, true)
}

SelfScript.self["macrosНе показывать сообщение при автовводе пароля"] = function()
{
    profileRoot.setValue(pflShowMessage, false)
}
