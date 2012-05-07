$engine JScript
$uname ScriptFormExample
$dname Демонстрация ошибки динамического подключения обработчика события формы
$addin global
$addin stdlib

function macrosПоказать() {

    var varWnd = new MyScriptForm();
    varWnd.Show();
}

function getDefaultMacros() {
    return 'Показать';
}

function MyScriptForm () {
    this.form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), this);
    this.attachEvent('OnOpen');
    this.attachEvent('OnClose');
    //this.attachEvent('BeforeClose');
}

MyScriptForm.prototype.Show = function () {
    this.form.Open();
}

MyScriptForm.prototype.attachEvent = function (eventName) {
    this.form.SetAction(eventName, v8New('Action', eventName));
}

MyScriptForm.prototype.OnOpen = function () {
    Message('ПриОткрытии');
}

MyScriptForm.prototype.BeforeClose = function (Отказ, СтандартнаяОбработка) {
    Message('ПередЗакрытием');
}

MyScriptForm.prototype.OnClose = function () {
    Message('ПриЗакрытии');
}


/* Перечень событий формы скрипта.
ПередОткрытием(Отказ, СтандартнаяОбработка)
BeforeOpen(Отказ, СтандартнаяОбработка)

ПриОткрытии
OnOpen()

ПриПовторномОткрытии()
OnReopen(СтандартнаяОбработка)

ОбновлениеОтображения()
RefreshDisplay()

ПередЗакрытием(Отказ, СтандартнаяОбработка)
BeforeClose(Отказ, СтандартнаяОбработка)

ПриЗакрытии()
OnClose()

ОбработкаВыбора(ЗначениеВыбора, Источник)
ChoiceProcessing(ЗначениеВыбора, Источник)

ОбработкаАктивизацииОбъекта(АктивныйОбъект, Источник)
ObjectActivationProcessing(АктивныйОбъект, Источник)

ОбработкаЗаписиНовогоОбъекта(Объект, Источник) 
NewObjectWriteProcessing(Объект, Источник)

ОбработкаОповещения(ИмяСобытия, Параметр, Источник)
NotificationProcessing(ИмяСобытия, Параметр, Источник)

ОбработкаВнешнегоСобытия(Источник, Событие, Данные)
ExternalEvent(Источник, Событие, Данные)

ОбработкаПроверкиЗаполнения(Отказ, ПроверяемыеРеквизиты)
FillCheckProcessing(Отказ, ПроверяемыеРеквизиты)

ПриСменеСтраницы(ТекущаяСтраница)
OnCurrentPageChange(ТекущаяСтраница)
*/