$engine JScript
$uname NotifySend
$dname Библиотека сообщений пользователю
$addin stdcommands
$addin global
$addin stdlib

// (c) Сосна Евгений <shenja@sosna.zp.ua>
// Библиотека для посылки сообщиений пользовтелю.

stdlib.require('SettingsManagement.js', SelfScript);
global.connectGlobals(SelfScript)

var mainFolder = profileRoot.getValue("Snegopat/MainFolder")
var settings; // Хранит настройки скрипта (экземпляр SettingsManager'а).

SelfScript.Self['macrosНастройка'] = function () {
    var dsForm = new NotifySendSettingsForm(settings);
    dsForm.ShowDialog();
}

function getDefaultMacros() {
    return "Настройка";
}

////////////////////////////////////////////////////////////////////////////////////////
////{ NotifySend
////
function GetNotifySend() {
    return new _NotifySend(settings);
}

function _NotifySend(settings) {
    this.settings = { 
                    'TimeEvent': 0,  //Время сообщения по умолчанию.
                    "TypeEvent":"", // Тип сообщения по умолчанию 
                    "TypeCMDMessage" : "" //оставлю на будущее, для вызова сообщений в linux
                    }
       settings.ApplyToForm(this.settings);
}

_NotifySend.prototype.Warning = function(Title, Text, Timeout, Type) {
    this.Check(Title, Text, Timeout, "Warning");
    this.SendMessage(this.title, this.text, this.time, this.type);
}

_NotifySend.prototype.Info = function(Title, Text, Timeout, Type) {
    this.Check(Title, Text, Timeout, "Info");
    this.SendMessage(this.title, this.text, this.time, this.type);
}

_NotifySend.prototype.Error = function(Title, Text, Timeout, Type) {
    this.Check(Title, Text, Timeout, "Error");
    this.SendMessage(this.title, this.text, this.time, this.type);
}

_NotifySend.prototype.Message = function(Title, Text, Timeout, Type) {
    this.Check(Title, Text, Timeout, Type);
    this.SendMessage(this.title, this.text, this.time, this.type);
}

_NotifySend.prototype.Check = function(Title, Text, Timeout, Type) {
    this.title = Title; this.text = Text, this.time = Timeout, this.type = Type;
    if (this.time==undefined) this.time = this.settings["TimeEvent"]
    if (this.text == undefined) this.text = "";
    if (this.title == undefined) this.title = "";
    
    if ((this.title.length > 62) && (this.text.length==0)) {
        this.text = this.text.substr(62);
        this.title = this.title.substr(0, 62);
    }
    if (this.type == undefined) this.type = this.settings["TypeEvent"];
    
}

_NotifySend.prototype.SendMessage = function(title, text, timeout, type) {
    title = title.replace(/\\/g, "\\\\").substr(0, 62);
    text = text.replace(/\n/g, "~n").replace(/\t/g, "~t").replace(/"/g, "~q");
    var cmd = mainFolder+'scripts\\bin\\TrayTip.exe "'+title+'" "'+ text +'" ' +timeout+' '+type;
    ЗапуститьПриложение(cmd, "", false);
}

////
////} NotifySend
////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
////{ Форма настройки скрипта - NotifySend
////

function NotifySendSettingsForm(settings) {
    this.settings = settings;
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    // Обработку событий формы привяжем к самому скрипту
    this.form = loadScriptForm(pathToForm, this)
}

NotifySendSettingsForm.prototype.ShowDialog = function () {
    return this.form.DoModal();
}

NotifySendSettingsForm.prototype.saveSettings = function () {

    this.settings.ReadFromForm(this.form);
    this.settings.SaveSettings();
}

NotifySendSettingsForm.prototype.CmdBarOK = function (Кнопка) {
    this.saveSettings()
    this.form.Close(true);
}

NotifySendSettingsForm.prototype.CmdBarSave = function (Кнопка) {
	this.saveSettings();
}

NotifySendSettingsForm.prototype.OnOpen = function () {
	this.settings.ApplyToForm(this.form);
}

NotifySendSettingsForm.prototype.BeforeClose = function (Cancel, DefaultHandler) {
    
    if (this.form.Modified)
    {
        var answer = DoQueryBox("Настройки были изменены! Сохранить настройки?", QuestionDialogMode.YesNoCancel);
        switch (answer)
        {
        case DialogReturnCode.Yes:
            DefaultHandler.val = false;
            if (this.saveSettings())
                this.form.Close(true);
            break;
            
        case DialogReturnCode.No:
            DefaultHandler.val = false;
            this.form.Close(false);
            break;
            
        case DialogReturnCode.Cancel:
            Cancel.val = true;
            break;
        }
    }
}

////
////} Форма настройки скрипта - NotifySend
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
////{ Start up
////

settings = SettingsManagement.CreateManager('NotifySend', { 
                    'TimeEvent': 10,  //Время сообщения по умолчанию.
                    "TypeEvent":"Info" // Тип сообщения по умолчанию 
                    })
settings.LoadSettings();

////
////} Start up
////////////////////////////////////////////////////////////////////////////////////////
