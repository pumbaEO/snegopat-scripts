$engine JScript
$uname silence
$dname Тишина в отсеках
$addin stdlib

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт для подавления некоторых сообщений Конфигуратора, бессмысленных и беспощадных.
// Пока реализовано "в-лоб", в дальнейшем надо сделать список из "регэксп + результат",
// и гуи по настройке, какие подавлять, какие нет.

// Подпишемся на событие при выводе предупреждения/вопроса
events.connect(windows, "onMessageBox", SelfScript.self)
if (profileRoot.getValue("ModuleTextEditor/CheckAutomatically")){
    events.connect(windows, "onDoModal", SelfScript.self);  
}
events.connect(windows, "onDoModal", SelfScript.self, "onDoModalDebug");  
var notifysend = stdlib.require('NotifySend.js').GetNotifySend();
var notify = true;
// Функция - обработчик
function onMessageBox(param)
{
    // Message(param.caption + " | " + param.text + " | " + param.type + " | " + param.timeout)
    // При отработке события перехват с MessageBox'а снимается, и в обработчике
    // можно смело его вызывать, не боясь зацикливания. Например мы сами хотим узнать ответ
    // пользователя и в зависимости от него выполнить какие-то действия
    // param.result = MessageBox(param.text, param.type, param.caption, param.timeout)
    // param.cancel = true

    if(param.text == "Внимание!!! Месторасположение информационной базы изменилось.\nПродолжить?")
    {
        //Message("Месторасположение информационной базы изменилось.", mInfo)
        param.result = mbaYes
        param.cancel = true
        return ;
    }
    
    // artbear сообщения типа "Объект Роль.Менеджер заблокирован." или "Объект Справочник.СохраненныеНастройки заблокирован."
    reRoleBlock = /Объект\s*[\d\wzа-яё]+\.[\d\wzа-яё\.]+\s*заблокирован\./ig
    if(reRoleBlock.test(param.text)){
        Message(param.text)
        param.result = mbaYes
        param.cancel = true
        return;
    }
    
    // artbear сообщения типа "Объединение конфигураций завершено."
    reConfigUnionEnd = /объединение\s+конфигураций\s+завершено\./ig
    if(reConfigUnionEnd.test(param.text)){
        param.result = mbaYes
        param.cancel = true
        Message(param.text)
        return;
    }
}

function onDoModal(dlgInfo){
    if(dlgInfo.stage == openModalWnd)
    {
        if (dlgInfo.Caption == "Конфигуратор"){

            for(var c = 0; c < dlgInfo.form.controlsCount; c++)
            {
                if (c > 2){
                    return;
                }
                var ctr = dlgInfo.form.getControl(c);
                
                var text = ctr.value;
                if (!text){
                    continue;
                }

                if (text.indexOf("При проверке модуля обнаружены ошибки!")!=-1){
                    try{
                        new ActiveXObject("WScript.Shell").SendKeys("{ENTER}");
                        if (notify)
                        {
                          var notifysend = stdlib.require('NotifySend.js').GetNotifySend();
                          var СистемнаяИнформация = v8New("СистемнаяИнформация");
                          var версия = СистемнаяИнформация.ВерсияПриложения;
                          if (версия.indexOf("8.2.13")==-1){
                              notifysend.provider = notifysend.initprovider("Встроенный1С");
                          }
                          notifysend.Error("Сохраняем ", "При сохранении есть ошибки \n имей ввиду", 3);
                          notify = false;
                          stdlib.setTimeout(function () {
                              notify = true;
                          }, 3000);
                        }
                    } catch (e){
                };
                
                
                return;
                }
                
                
            }
       }
    }
}

function onDoModalDebug(dlgInfo){
    if(dlgInfo.stage == openModalWnd)
    {
        
        if (dlgInfo.Caption == "Конфигуратор"){

            for(var c = 0; c < dlgInfo.form.controlsCount; c++)
            {
                if (c > 2){
                    return;
                }
                var ctr = dlgInfo.form.getControl(c);
                
                var text = ctr.value;
                if (!text){
                    continue;
                }
                
                Message(text);
                if (text.indexOf("Приложение запущено. Перезапустить?")!=-1){
                    new ActiveXObject("WScript.Shell").SendKeys("{ENTER}");
                    TrayMessage("Приложение уже запущенно!", "Перезапускаем не спрашивая!", 3);
                    return;
                }
                
            }
       }
    }
}

function TrayMessage(Title, Text, Timeout, Type) {
    var notifysend = stdlib.require('NotifySend.js').GetNotifySend();
      var СистемнаяИнформация = v8New("СистемнаяИнформация");
      var версия = СистемнаяИнформация.ВерсияПриложения;
      if (версия.indexOf("8.2.13")==-1){
          notifysend.provider = notifysend.initprovider("Встроенный1С");
      }
      notifysend.Error(Title, Text, Timeout);
      notify = false;
      stdlib.setTimeout(function () {
          notify = true;
      }, 3000);
}

