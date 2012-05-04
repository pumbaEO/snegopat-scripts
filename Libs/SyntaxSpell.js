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
stdlib.require('TextWindow.js', SelfScript);
global.connectGlobals(SelfScript)

var mainFolder = profileRoot.getValue("Snegopat/MainFolder")
var settings; // Хранит настройки скрипта (экземпляр SettingsManager'а).

SelfScript.Self['macrosПроверкаВыделенногоТекста'] = function () {
    //var dsForm = new NotifySendSettingsForm(settings);
    //dsForm.ShowDialog();
    var wnd = GetTextWindow();    
    var text = "";
    if (wnd) 
        text = wnd.GetSelectedText();
    //var  text ="Текст русский с ошибками \n"
    //+"Процедура МояСупперПроцедура ( Знач ПеременнаяАшибка)";
    //debugger;
    spell = GetSpellChecker();
    spell.SpellText(text);
    
}

SelfScript.Self['macrosНастройкаSpellChecker'] = function () {
    //var dsForm = new NotifySendSettingsForm(settings);
    //dsForm.ShowDialog();
    var wnd = GetTextWindow();    
    var text = "";
    if (wnd) 
        text = wnd.GetSelectedText();
    //var  text ="Текст русский с ошибками \n"
    //+"Процедура МояСупперПроцедура ( Знач ПеременнаяАшибка)";
    //debugger;
    spell = GetSpellChecker();
    spell.formParams.ОткрытьМодально();
    //spell.SpellText(text);
    
}


function getDefaultMacros() {
    return "ПроверкаВыделенногоТекста";
}

////////////////////////////////////////////////////////////////////////////////////////
////{ NotifySend
////
function GetSpellChecker() {
    return new _SpellChecker(settings);
}

function _SpellChecker(settings) {
    this.settings = { 
                    'provider': "" ,
                    'dict':v8New("ValueList"), 
                    'prefix':{},
                    'suffix':{}
                    }
       settings.ApplyToForm(this.settings);
       this.settingsManager = settings;
    
    /* this.Парам=null;
    this.ПроверкаОрфографии=null;
    this.Локал=null; */
    
    this.words= {};
    this.provider = null
    switch (this.settings.provider) 
    {
    case "libreoffice":
        this.provider = new _SpellLibreOffice()
        break;
    case "word":
        this.provider = new _SpellWord();
        break;
    }
    
    //this.provider = new _SpellWord();
    var pathToForm = SelfScript.fullPath.replace(/js$/, 'ssf')
    this.form = loadScriptForm(pathToForm, this) // Обработку событий формы привяжем к самому скрипту
    this.form.КлючСохраненияПоложенияОкна = SelfScript.uniqueName;
    var pathToFormSettings = SelfScript.fullPath.replace(/js$/, 'param.ssf');
    this.formParams = loadScriptForm(pathToFormSettings, this) // Обработку событий формы привяжем к самому скрипту
    
    if (this.provider==null)
        this.form.Open();
}


_SpellChecker.prototype.CheckWords = function(words) {
    //var results = {};
    this.ПустойМассив = new Array();
    for (var key in words){
        if (words[key]["spell"] && !words[key]["isValid"]) 
        words[key]["isValid"] = this.provider.CheckWord(key);
        words[key]["spell"] = false;
    }
    return words
}
_SpellChecker.prototype.getAlternatives = function(words) {
    var results = {};
    for (var key in words){
        results[key] = this.provider.getAlternatives(key);
    }
    return results
}

_SpellChecker.prototype.WordJoin = function(word, prefix, suffix) {
    var results = {};
    if (prefix == undefined) prefix = {}
    if (suffix == undefined) suffix = {}
    
    if (this.words[word]) 
        return this.words[word];
    
    for (var key in prefix) {
        var re = new RegExp('^('+key+')(.*)','');
        var Matches = word.match(re);
        
        if (Matches && Matches.length) {
            results[Matches[1]] = {"spell":false, "alternatives":new Array(), "isValid":true};
            word = Matches[2];
            break;
        }
    }
    for (var key in suffix) {
        var re = new RegExp('^(.*)('+key+')','');
        var Matches = word.match(re);
        
        if (Matches && Matches.length) {
            results[Matches[2]] = {"spell":false, "alternatives":new Array(), "isValid":true};
            word = Matches[1];
            break;
        }
    }
    var re = new RegExp('([А-ЯA-Z])([a-zа-я]*)', 'g');
    var find = false
    // debugger
    var Matches = null
            while( (Matches = re.exec(word)) != null ) {
            if (Matches[0].length>0) {
                find = true;
                results[Matches[0].toString()] = {"spell":(Matches[0].toString().length>2), "alternatives":new Array(), "isValid":(Matches[0].toString().length<3)};
                if (!(this.settings.dict.FindByValue(Matches[0].toString().toLowerCase()) == undefined)) {
                    results[Matches[0].toString()] = {"spell":false, "alternatives":new Array(), "isValid":true};
                } 
             }
        }
        if (!find && word.length>0) {
            results[word] = {"spell":true, "alternatives":new Array(), "isValid":false};
            if (!(this.settings.dict.FindByValue(word.toLowerCase()) == undefined)) {
                    results[word] = {"spell":false, "alternatives":new Array(), "isValid":true};
             }
          }
    return results;
}
_SpellChecker.prototype.SpellText = function(text) {
    var re = new RegExp('([\wА-яёЁ\d]+)','gi');
    wordsparse = new Array();
    var i =  0;
    while( (Matches = re.exec(text)) != null ) {
        wordsparse.push(Matches[1]);
    }
    //this.words = {};
    for (var i=0; i<wordsparse.length; i++){
    //debugger;
        if (!this.words[wordsparse[i]]) {
            if (!(this.settings.dict.FindByValue(wordsparse[i].toLowerCase()) == undefined)) {
                var result = {}
                result[wordsparse[i].toLowerCase()] = {"spell":false, "alternatives":new Array(), "isValid":true}
                this.words[wordsparse[i]] = result;
                continue;
            }
            this.words[wordsparse[i]] = this.WordJoin(wordsparse[i], this.settings.prefix, this.settings.suffix)
            // а теперь проверим текст... 
            this.words[wordsparse[i]] = this.CheckWords(this.words[wordsparse[i]]);
         }
    }
    
    this.form.Open();
    
    
}


_SpellChecker.prototype.КнЗаменитьНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    Message("еще не реализовано")
}

_SpellChecker.prototype.КнДобавитьНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    //debugger
    var ТекСтрока  = this.form.Controls.ДеревоПроверки.CurrentRow;
    if (!(ТекСтрока==undefined)) {
        //Message("Строка существует!" + ТекСтрока.Слово);
        if (ТекСтрока.isValid > 0){
            var word = ТекСтрока.Слово;
            this.settings.dict.add(word.toLowerCase());
        }
    }
}

_SpellChecker.prototype.КнНастройкиНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    //Message("Еще не реализованно!");
    this.formParams.ОткрытьМодально();
}

_SpellChecker.prototype.КнЗакрытьНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    this.form.Close();
}

_SpellChecker.prototype.ДеревоПроверкиПриАктивизацииСтроки = function (Элемент) {
	// Вставить содержимое обработчика.
    
}

_SpellChecker.prototype.ДеревоПроверкиПриВыводеСтроки = function (пЭлемент, пОформлениеСтроки, пДанныеСтроки) {
	
    if (пДанныеСтроки.val.isValid>0 && пДанныеСтроки.val.Родитель!=undefined)
        пОформлениеСтроки.val.Ячейки.Слово.ЦветФона = мЦвет;
}

_SpellChecker.prototype.ПриОткрытии = function () {
    //debugger;
    for (var key in this.words) {
       var isValid = true;
        for (var keys in this.words[key]) {
            if (!this.words[key][keys]["isValid"]) {
                isValid = false;
             }
        }
        if (!isValid){
            //Message("Ошибка в слове "+key);
            var НоваяСтрока = this.form.ДеревоПроверки.Строки.Добавить();
            НоваяСтрока.Слово = key;
            НоваяСтрока.isValid = 1;
            for (var keys in this.words[key]) {
                var НоваяСтрокаCamelCase = НоваяСтрока.Строки.Добавить();
                НоваяСтрокаCamelCase.Слово = keys;
                НоваяСтрокаCamelCase.isValid = this.words[key][keys]["isValid"] ? 0:1;
                if (!this.words[key][keys]["isValid"]) { 
                    var result = {}
                    result[keys] = "";
                    result = this.getAlternatives(result);
                    this.words[key][keys]["alternatives"] = result[keys];
                    for (var z=0; z< this.words[key][keys]["alternatives"].length; z++ ){
                          var НоваяСтрокаАльтернатива = НоваяСтрокаCamelCase.Строки.Добавить();
                          НоваяСтрокаАльтернатива.Слово = this.words[key][keys]["alternatives"][z];
                          НоваяСтрокаАльтернатива.isValid = 0;
                    }
                    
                    
                }
            }
       }
       }
       
      if (this.form.ДеревоПроверки.Строки.Count()==0) {
        Message("Ошибок не обнаруженно!")
        this.form.Close();
      }
}

_SpellChecker.prototype.ПриЗакрытии = function () {
    this.settingsManager.ReadFromForm(this.settings);
    this.settingsManager.SaveSettings();
    if (this.provider!=null)
        this.provider.Disconnect();
}


_SpellChecker.prototype.ПараметрыКоманднаяПанельСловарьДействиеУдалитьДобавитьСлово = function (Кнопка) {
	// Вставить содержимое обработчика.
}

_SpellChecker.prototype.ПараметрыКоманднаяПанельСловарьДействиеИзменить = function (Кнопка) {
	// Вставить содержимое обработчика.
}

_SpellChecker.prototype.ПараметрыКоманднаяПанельСловарьДействиеУдалить = function (Кнопка) {
	// Вставить содержимое обработчика.
}

_SpellChecker.prototype.ПараметрыСпПровайдерПроверкиПриИзменении = function (Элемент) {
	// Вставить содержимое обработчика.
}

_SpellChecker.prototype.ПараметрыПриОткрытии = function () {
	// Вставить содержимое обработчика.
    var СписокВыбора = v8New("ValueList");
    СписокВыбора.Добавить("libreoffice");
    СписокВыбора.Добавить("word");
    this.formParams.Controls.СпПровайдерПроверки.СписокВыбора = СписокВыбора;
    //debugger;
    if (this.formParams.Controls.СпПровайдерПроверки.СписокВыбора.findByValue(this.settings.provider)!=undefined)
        this.formParams.Controls.СпПровайдерПроверки.Значение = this.settings.provider;
    
    this.formParams.ПользовательскийСловарь = this.settings.dict;
    //debugger
    for (var key in this.settings.prefix) {
        var НоваяСтрока = this.formParams.ТаблицаПрефиксов.Add();
        НоваяСтрока.Префикс = key
    }
    for (var key in this.settings.suffix) {
        var НоваяСтрока = this.formParams.ТаблицаСуффиксов.Add();
        НоваяСтрока.Суффикс = key
    }
}

_SpellChecker.prototype.ПараметрыКнОкНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    this.settings.dict = this.formParams.ПользовательскийСловарь;
    this.settings.provider = this.formParams.Controls.СпПровайдерПроверки.Значение;
    //debugger;
    prefix = {};
    for(var i=0; i<this.formParams.ТаблицаПрефиксов.Count(); i++) {
        var ТекущаяСтрока = this.formParams.ТаблицаПрефиксов.Get(i);
        prefix[ТекущаяСтрока.Префикс] = true
    }
    
    suffix = {};
    for(var i=0; i<this.formParams.ТаблицаСуффиксов.Count(); i++) {
        var ТекущаяСтрока = this.formParams.ТаблицаСуффиксов.Get(i);
        suffix[ТекущаяСтрока.Суффикс] = true
    }
    
    this.settings.prefix = prefix;
    this.settings.suffix = suffix;
    this.settingsManager.ReadFromForm(this.settings);
    this.settingsManager.SaveSettings();
    this.formParams.Close();
}

_SpellChecker.prototype.ПараметрыКнОтменаНажатие = function (Элемент) {
	// Вставить содержимое обработчика.
    this.formParams.Close();
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


function _SpellLibreOffice() {
    this.ServiceManager = null;
    this.ПустойМассив = new Array();
    this.Connect()
}

_SpellLibreOffice.prototype.Connect = function(){
    try{
       this.ServiceManager = new ActiveXObject('com.sun.star.ServiceManager');
       this.Парам=this.ServiceManager.Bridge_GetStruct('com.sun.star.beans.PropertyValue');
       this.ПроверкаОрфографии=this.ServiceManager.createInstance("com.sun.star.linguistic2.SpellChecker");
       this.Локал=this.ServiceManager.Bridge_GetStruct('com.sun.star.lang.Locale');
       this.Локал.Language = "ru";
        this.Локал.Country = "RU";
    }catch (e) {
        Message("Не удалось создать объект");
    }
}

_SpellLibreOffice.prototype.CheckWord = function(word) {
    //var results = {};
    this.ПустойМассив = new Array();
    return this.ПроверкаОрфографии.isValid(word,this.Локал,this.ПустойМассив);
}
_SpellLibreOffice.prototype.getAlternatives = function(word) {
    Альтернативы=new VBArray(this.ПроверкаОрфографии.spell(word,this.Локал,this.ПустойМассив).getAlternatives());
    var alternative = new Array();
    for(var ii=Альтернативы.lbound(1); ii<Альтернативы.ubound(1); ii++) {
           alternative.push(Альтернативы.getItem(ii));
    }
    return alternative;
}
_SpellLibreOffice.prototype.Disconnect = function(){
    return ''
}

function _SpellWord() {
    this.Word = null;
    //this.ПустойМассив = new Array();
    this.Connect()
}

_SpellWord.prototype.Connect = function(){
    try{
       this.Word =new ActiveXObject('Word.Application');
       if (this.Word.Documents.Count == 0 )
            this.Word.Documents.Add();
            
    }catch (e) {
       Message("Не удалось создать объект Word.Application");
    }
    
}

_SpellWord.prototype.CheckWord = function(word) {
    //var results = {};
    //this.ПустойМассив = new Array();
    //debugger
    return this.Word.CheckSpelling(word);
    //return this.ПроверкаОрфографии.isValid(word,this.Локал,this.ПустойМассив);
}
_SpellWord.prototype.getAlternatives = function(word) {
       if (this.Word.Documents.Count == 0 ) {
            var Док = this.Word.Documents.Add(); // Создадим новый документ   
       } else {
            var Док = this.Word.Documents.Item(1); // Создадим новый документ   
       }
       var Область = Док.Range(0,0); // Получим пустую область в начале документа   
      Область.InsertBefore(word); // Добавим в документ текст   
      var alternative = new Array();
      for (var key in Область.Words){
         var Варианты = key.GetSpellingSuggestions();
         for (var keys in Варианты) {
            alternative.push(keys.Name);
         }
    }   
    Док.Close(0); // закроем документ без сохранения wdDoNotSaveChanges   
    return alternative;
}


////} _1CWordWrap
_SpellWord.prototype.Disconnect = function(){
    try{
       this.Word.Quit();
    }catch (e) {
       Message("Не удалось создать объект");
    }
    
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

var ValueList = v8New("ValueList");

settings = SettingsManagement.CreateManager('SpellChecker', { 
                    'provider': "libreoffice",  //word, libreoffice, aspell, internet Yandex... 
                    'dict': ValueList, // структура с игнорируемыми словами. 
                    'prefix':{},
                    'suffix':{}
                    
                    })
settings.LoadSettings();
var мЦвет = v8New("Цвет", 255, 0, 0);
////
////} Start up
////////////////////////////////////////////////////////////////////////////////////////
