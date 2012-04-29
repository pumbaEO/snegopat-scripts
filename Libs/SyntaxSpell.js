$engine JScript
$uname SyntaxSpell
$dname Класс SyntaxSpell
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт-библиотека SyntaxSpell (SyntaxSpell.js) для проекта "Снегопат"
////
//// Описание: Реализует функционал по орфографическому контролю исходного кода на 
//// внутреннем языке 1С:Предприятия 8.
//// 
////
//// Автор Сосна Евгений <shenja@sosna.zp.ua>
////}
////////////////////////////////////////////////////////////////////////////////////////


stdlib.require('SettingsManagement.js', SelfScript);
//global.connectGlobals(SelfScript)

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
function GetSpellChecker() {
    return new _SpellChecker(settings);
}

function _SpellChecker(settings) {
    this.settings = { 
                    'provider': ""  
                    }
       settings.ApplyToForm(this.settings);
	   
	this.ServiceManager = null;
	/* this.Парам=null;
	this.ПроверкаОрфографии=null;
	this.Локал=null; */
	this.ПустойМассив = new Array();
	this.Connect()
}
_SpellChecker.prototype.Connect = function(){
	this.ServiceManager = new ActiveXObject('com.sun.star.ServiceManager');
	this.Парам=this.ServiceManager.Bridge_GetStruct('com.sun.star.beans.PropertyValue');
	this.ПроверкаОрфографии=this.ServiceManager.createInstance("com.sun.star.linguistic2.SpellChecker");
	this.Локал=this.ServiceManager.Bridge_GetStruct('com.sun.star.lang.Locale');
	this.Локал.Language = "ru";
    this.Локал.Country = "RU";
}

_SpellChecker.prototype.CheckWords = function(words) {
	var results = {};
	this.ПустойМассив = new Array();
	for (key in words){
		results[key] = (this.ПроверкаОрфографии.isValid(key,this.Локал,this.ПустойМассив)==0)
	}
	return results
}
_SpellChecker.prototype.getAlternatives = function(words) {
	var results = {};
	for (key in words){
		Альтернативы=new VBArray(this.ПроверкаОрфографии.spell(key,this.Локал,this.ПустойМассив).getAlternatives());
		var alternative = new Array();
        for(ii=Альтернативы.lbound(1); ii<Альтернативы.ubound(1); ii++) {
			alternative.push(Альтернативы.getItem(ii));
        }
		results[key] = alternative;
	}
	return results
	
}


_SpellChecker.prototype.ConnectLibreOffice = function(){
	
}
/* SyntaxSpell = {};
 */
/* SyntaxSpell.AnalyseTextDocument = function (textWindow) {
    return new _1CModule(textWindow)
} */

/* SyntaxSpell.WrapWord = function(word, prefix) {
    var list = {}
    var str = word;
    if (prefix==undefined) 
        prefix = {};
     
     for (var key in prefix){
        //TODO: добавиь регулярку по вырезанию из слова префикса (в префиксах у нас будут тип БСП, ир, лкс - первый встречный верезаем и продалжаем.
        if (str.indexOf(key)!=-1){
            list[key] = false
            str = str.substr(key.length-1);
            break;
        }
     }
     list[str]=true
      
      return list
    
}

SyntaxSpell.Create1CSpellDescription = function() {
    return new _1CSpellDescription()
}
 *///Возвращаем список слов неправильных...
/* SyntaxSpell.SpellCheckerText = function (sourceCode) {
    
    var Lines = sourceCode.split("\n");
    
    var n = Lines.length;
    var i = 0; 
    spell = SyntaxSpell.Create1CSpellDescription();
    while (i < n)
    {
       var str = Lines[i];
       //Самое простое, разобъем по пробелам...
       words = str.split(" ");
       for (var ii=0; ii<words.length; ii++){
            spell.addWord(words[ii]);
       }
       i++;
    }
        
    return spell;
}

SyntaxSpell.SpellCheck = function(word) {
    analyse = new Array
    analyse.push("Раз")
    analyse.push("Два")
    return analyse
}
 */
////////////////////////////////////////////////////////////////////////////////////////
////{ _1CWordWrap

function _1CWordWrap(Word) {
    this.word = Word;
}

/* Возвращает исходный код метода по названию метода. */
_1CWordWrap.prototype.Split = function(prefix) {
    
    var list = {}
    var str = this.word;
    if (prefix==undefined) 
        prefix = {};
     
     for (key in prefix){
        //TODO: добавиь регулярку по вырезанию из слова префикса (в префиксах у нас будут тип БСП, ир, лкс - первый встречный верезаем и продалжаем.
        if (str.indexOf(key)!=-1){
            list[key] = false
            str = str.substr(key.length-1);
            break;
        }
     }
     list[str]=true
      
      return list
    
}


////} _1CWordWrap

////////////////////////////////////////////////////////////////////////////////////////
////{ _1CSpellDescription

function _1CSpellDescription() {

    
    // Ассоциативный массив Слово -> Ассоциативный массив составляющих этого слова WordsWraps Пример: НовыйЭлемент -> ["Новый", "Элемент"]
    this.Words = {};
    
    // Ассоциативный массив Слов -> Ассоциативный массив проверок для этого слова
    this.WordsWraps = {};
    
    // Ассоциативный массив Слов проверок -> Ассоциативный массив вариантов для этого слова. 
    this.WordsCheck = {};

}

_1CSpellDescription.prototype.addWord = function (method) {

    if (this.Words[method])
        return;
        // Message('Метод ' + method.name + 'уже был объявлен ранее в этом модуле!');
        
     if (!this.WordsWraps[method]) { 
            this.WordsWraps[method] = SyntaxSpell.WrapWord(method)
     }
    
    for (var key in this.WordsWraps) {
            if (!this.WordsCheck[key]){
                this.WordsCheck[key] = SyntaxSpell.SpellCheck(key);
             }
            this.WordsWraps[key] = this.WordsCheck[key]
    }
    this.Words[method] = this.WordsWraps[method]
}

_1CSpellDescription.prototype.getWordSpell = function (name) {
    return this.Words[name];
}



////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные функции объекта Array
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        for(var i = fromIndex||0, length = this.length; i<length; i++)
            if(this[i] === searchElement) return i;
        return -1
    };
};
////} Вспомогательные функции объекта Array

/////{ Пример openoffice
/* Функция СоздатьМассив(Сп,Знач СкриптЗн="")
    Перем Массив;
    Скрипт=СоздатьОбъект("MSScriptControl.ScriptControl");
    Скрипт.language="javascript";
    Массив=Скрипт.eval("Массив=new Array()");
    Значение="";
    Для к=0 По Сп.РазмерСписка()-1 Цикл
        Массив.push(Сп.ПолучитьЗначение(к+1));
        Попытка
            Значение=Сп.ПолучитьЗначение(к+1).Value;
        Исключение
        КонецПопытки;
        Если Значение="Истина" Тогда
            Скрипт.Eval("Массив["+к+"].Value=true");
        ИначеЕсли Значение="Ложь" Тогда
            Скрипт.Eval("Массив["+к+"].Value=false");
        КонецЕсли;
    КонецЦикла;
    Если ПустоеЗначение(СкриптЗн)=0 Тогда
        Стр="";
        Сп.ПолучитьЗначение(1,Стр);
        Если ПустоеЗначение(Стр)=1 Тогда
            Стр="Массив";
        КонецЕсли;
        СкриптЗн.AddObject(Стр,Массив);
    КонецЕсли;
    Возврат Массив;
КонецФункции



//*******************************************
 
Процедура Сформировать()
    Скрипт=СоздатьОбъект("MSScriptControl.ScriptControl");
    Скрипт.language="javascript";
    СпСлов=СоздатьОбъект("СписокЗначений");
    СпСлов.ДобавитьЗначение("праверка");
    СпСлов.ДобавитьЗначение("орфографии");
    СпСлов.ДобавитьЗначение("праходит");
    СпСлов.ДобавитьЗначение("здезь");
    СервисМанагер=Скрипт.eval("СервисМанагер=new ActiveXObject('com.sun.star.ServiceManager')");
    СтрПарам="Парам=СервисМанагер.Bridge_GetStruct('com.sun.star.beans.PropertyValue')";
    МассивСлов=СоздатьМассив(СпСлов);
    ПроверкаОрфографии=СервисМанагер.createInstance("com.sun.star.linguistic2.SpellChecker");
    Скрипт.AddObject("ПроверкаОрфографии",ПроверкаОрфографии);
    Сп=СоздатьОбъект("СписокЗначений");
    Сп.ДобавитьЗначение(Скрипт.eval(СтрПарам),"ПустойМассив");
    ПустойМассив=СоздатьМассив(Сп,Скрипт);
    Локал=Скрипт.eval("Локал=СервисМанагер.Bridge_GetStruct('com.sun.star.lang.Locale')");
    Локал.Language = "ru";
    Локал.Country = "RU";
    Для к=0 По СпСлов.РазмерСписка()-1 Цикл
        Если ПроверкаОрфографии.isValid(СпСлов.ПолучитьЗначение(к+1),Локал,ПустойМассив)=0 Тогда
            Альтернативы=Скрипт.Eval("new VBArray(ПроверкаОрфографии.spell('"+СпСлов.ПолучитьЗначение(к+1)+"',Локал,ПустойМассив).getAlternatives())");
            Для н=Альтернативы.lbound(1) По Альтернативы.ubound(1) Цикл
                Сообщить(Альтернативы.getItem(н));
            КонецЦикла;
        КонецЕсли;
    КонецЦикла;
КонецПроцедуры */

//////}

////{ Пример Word
/* Процедура КнопкаВыполнитьНажатие(Кнопка)
//ТекстДляПроверки = "Данный текст садержит как минемум три ошипки !"; 
ТекстДляПроверки = ЭлементыФормы.ПолеВвода1.Значение;
   // Создадим объект MS Word, он должен быть установлен   
   Попытка
      Word = Новый COMОбъект("Word.Application");
   Исключение
      Предупреждение("Microsoft Word не установлен!",,"Ошибка!");
      Возврат;
   КонецПопытки;
   
   НетОшибок = Word.CheckSpelling(ТекстДляПроверки);
   Если НетОшибок Тогда // Все правильно   
      Сообщить("Нет ошибок");
   Иначе // текст содержит ошибки. Проверим каждое слово и выведем ошибочные.   
      Док = Word.Documents.Add(); // Создадим новый документ   
      Область = Док.Range(0,0); // Получим пустую область в начале документа   
      Область.InsertBefore(ТекстДляПроверки); // Добавим в документ текст   
      Для каждого Слово Из Область.Words Цикл
         СловоДляПроверки = СокрЛП(Слово.Text);
         НетОшибок = Word.CheckSpelling(СловоДляПроверки);
         Если НЕ НетОшибок Тогда // Слово ошибочно   
            // покажем возможные замены неправильного слова   
            СтрокаВариантов = "";
            // Получим варианты правописания   
            Варианты = Слово.GetSpellingSuggestions( ,1, ,0);
            Для каждого Вариант Из Варианты Цикл
               СтрокаВариантов = СтрокаВариантов + ", " + Вариант.Name;
            КонецЦикла;
            СтрокаВариантов = ". Варианты замены: " + Сред(СтрокаВариантов, 2);
            Сообщить("Ошибка в слове: " + СловоДляПроверки + СтрокаВариантов);
         КонецЕсли;
     КонецЦикла;
   Док.Close(0,,); // закроем документ без сохранения wdDoNotSaveChanges   
   КонецЕсли;
   Word.Quit(); // закроем Word   
КонецПроцедуры */

/////}



////////////////////////////////////////////////////////////////////////////////////////
////{ Start up
////

settings = SettingsManagement.CreateManager('SpellChecker', { 
                    'provider': "libreoffice"  //word, libreoffice, aspell, internet Yandex... 
                    })
settings.LoadSettings();

////
////} Start up
////////////////////////////////////////////////////////////////////////////////////////
