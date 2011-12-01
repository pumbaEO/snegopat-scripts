$engine JScript
$uname stg_autoconnect
$dname Авто-подключение к хранилищу
$addin stdcommands

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт для подстановки пути/имени/пароля в диалоге подключения к хранилищу.
// Данные сохраняется в профайле база/пользователь.
// При первом подключении к хранилищу скрипт предлагает запомнить введенные данные,
// и в дальнейшем сразу подставляет их при подключении к хранилищу.
// Если вам надо ввести другие данне, выполните макрос "СброситьСохраненныеДанные"

// Зададим пути хранения настроек
var pflPath = "StgAutoConnect/"
var pflData = pflPath + "data"                      // Данные
var pflShowMessage = pflPath + "ShowMessage"        // Показывать сообщение при подстановке

// Настройку отображения сообщений будем хранить едино для всех баз, в профиле Снегопата
profileRoot.createValue(pflShowMessage, true, pflSnegopat)
// Подцепляемся к событию показа модальных окон. Если со временем появится событие подключения к хранилищу,
// то надо будет делать это в том событии, и после отключаться от перехвата модальных окон.
events.connect(windows, "onDoModal", SelfScript.self)

// Обработчик показа модальных окон.
function onDoModal(dlgInfo)
{
    if(dlgInfo.caption == "Соединение с хранилищем конфигурации")
    {
        if(dlgInfo.stage == beforeDoModal)
        {
            var data = profileRoot.getValue(pflData)
            if(data)
            {
                // Если есть сохраненные данные, то вводим их
                dlgInfo.form.getControl("UserName").value = data.login
                dlgInfo.form.getControl("UserPassword").value = data.password
                dlgInfo.form.getControl("DepotPath").value = data.path
                dlgInfo.cancel = true   // Отменяем показ диалога
                dlgInfo.result = 1      // Как будто в нем нажали Ок
                if(profileRoot.getValue(pflShowMessage))    // Информируем пользователя, если он хочет
                    Message("Авто-подключение к хранилищу '" + data.path + "' пользователем '" + data.login + "'")
            }
        }
        else if(dlgInfo.stage == afterDoModal && dlgInfo.result == 1)
        {
            // Предложим сохранить введенные данные
            if(MessageBox("Подставлять введенные значения автоматически при последующих подключениях?",
                mbYesNo | mbDefButton1 | mbIconQuestion) == mbaYes)
            {
                // Сохраним их
                var data = v8New("Структура", "login,password,path",
                    dlgInfo.form.getControl("UserName").value,
                    dlgInfo.form.getControl("UserPassword").value,
                    dlgInfo.form.getControl("DepotPath").value)
                profileRoot.createValue(pflData, false, pflBaseUser)    // Храним отдельно для базы/пользователя
                profileRoot.setValue(pflData, data)
            }
        }
    }
}

SelfScript.self["macrosСбросить cохраненные данные"] = function()
{
    profileRoot.deleteValue(pflData)
}

SelfScript.self["macrosПоказывать сообщение при подключении"] = function()
{
    profileRoot.setValue(pflShowMessage, true)
}

SelfScript.self["macrosНе показывать сообщение при подключении"] = function()
{
    profileRoot.setValue(pflShowMessage, false)
}
