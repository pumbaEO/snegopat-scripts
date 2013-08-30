$engine JScript
$uname silence
$dname Тишина в отсеках
$addin stdlib
$addin stdcommands

// (с) Александр Орефков orefkov at gmail.com
// Это небольшой скрипт для подавления некоторых сообщений Конфигуратора, бессмысленных и беспощадных.
// Пока реализовано "в-лоб", в дальнейшем надо сделать список из "регэксп + результат",
// и гуи по настройке, какие подавлять, какие нет.

stdlib.require('log4js.js', SelfScript);

var logger = Log4js.getLogger(SelfScript.uniqueName);
var appender = new Log4js.BrowserConsoleAppender();
appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
logger.addAppender(appender);
logger.setLevel(Log4js.Level.ERROR);

// Подпишемся на событие при выводе предупреждения/вопроса
events.connect(windows, "onMessageBox", SelfScript.self)
if (profileRoot.getValue("ModuleTextEditor/CheckAutomatically")){
    events.connect(windows, "onDoModal", SelfScript.self);  
}
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
        param.result = mbaYes
        param.cancel = true
        return;
    }
    
    // сообщения типа "Объект Роль.Менеджер заблокирован." или "Объект Справочник.СохраненныеНастройки заблокирован."
    reRoleBlock = /Объект\s*[\d\wzа-яё]+\.[\d\wzа-яё\.]+\s*заблокирован\./ig
    if(reRoleBlock.test(param.text)){
        Message(param.text)
        param.result = mbaYes
        param.cancel = true
        return;
    }
    
    // сообщения типа "Объединение конфигураций завершено."
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
                return
                }
            }
       }
    }
}

/** 
 Во время активной разработки очень часто приходится перезапускать предприятие, открытое в режиме отладки 
 при этом у конфигуратора возникают вопросы на которые вроде как чаще отвечаешь да, чем нет. 
По факту оазы
@constructor
@uses stdlib.Class
**/  
DebugModeHelper = stdlib.Class.extend({

    construct : function () {    
        DebugModeHelper._instance = this;
        //events.connect(windows, "onDoModal", this);
        //stdcommands.CDebug.Start.addHandler(this, "onStartDebug");
        stdcommands.CDebug.Restart.addHandler(this, "onRestartDebug");

    },

    onStartDebug:function(cmd){
        if(!cmd.isBefore)
        {   
            //Проверяем Находимся ли в режиме отладки. 

            if (this.isDebugEvalEnabled()) {

            }
            
        }  else {
            
        }

    },

    onRestartDebug:function(cmd){
        if(!cmd.isBefore)
        {   
            if (stdlib.isConfigsDifferent()){
                events.connect(windows, "onDoModal", this, "onDoModalRestart");    
            }
        }  else {
            events.disconnect(windows, "onDoModal", this, "onDoModalRestart");
        }

    },
    isDebugEvalEnabled:function()
    {
        // Команда "Шагнуть в" неактивна - значит, мы не в останове. Считать переменные нельзя, возможен вылет
        var state = stdcommands.CDebug.StepIn.getState()
        return state && state.enabled
    },


    onDoModalRestart:function(dlgInfo){
        if(dlgInfo.caption == "Выбор главы" && dlgInfo.stage == afterInitial)
        {
            var grid = dlgInfo.form.getControl("tblTopics").extInterface
            var sel = this.choiceNative(grid);
            if(sel)
            {
                grid.currentRow = sel
                dlgInfo.form.sendEvent(dlgInfo.form.getControl('btnShow').id, 0)
            }
        }
    },

    choiceNative:function(grid) {
        var choices = v8New('СписокЗначений');
        for(var k = grid.dataSource.root.firstChild; k ; k = k.next)
            choices.Add(k, this.setFilter(k.getCellValue(0)));

        var dlg = new SelectValueDialog("Выберите главу", choices);
        dlg.form.GreedySearch = true;
        if (dlg.selectValue())
            return dlg.selectedValue
        return null
    }
})

function GetDebugModeHelper() {
    if (!DebugModeHelper._instance)
        new DebugModeHelper();
    return DebugModeHelper._instance;
}

var dbg = GetDebugModeHelper();