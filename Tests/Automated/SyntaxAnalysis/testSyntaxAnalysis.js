$engine JScript
$uname testSyntaxAnalysis
$dname Тесты для класса SyntaxAnalysis
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);
stdlib.require('SyntaxAnalysis.js', SelfScript);
    
//{ setUp/tearDown    
function setUp() {
}

function tearDown() {
}
//} setUp/tearDown

//{ tests of AnalyseModule
function macrosTestAnalyseModule1() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Перем ЭкспортнаяПеременная Экспорт;\n"
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"
        + "Процедура МояПроцедура(Парам1, Парам2)\n"
        + "	Перем МояПерем1;\n\n"	
        + "	МояПерем1 = 42;\n\n"
        + "	АвтоматическаяПеременная = 10;\n"	
        + "	мПеременнаяМодуля = \"\";\n"	
        + "КонецПроцедуры\n\n"
        + "Функция МояФункция(ПараметрФункции)\n"
        + "	Сообщить(мПеременнаяМодуля);	\n"
        + "	Возврат Истина;	\n"
        + "КонецФункции\n\n"
        + "МояПроцедура(1, 2);\n"
        + "Результат = МояФункция();\n"
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
        
    //Message(cnt.ModuleVars.join(','));
            
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);

    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);
        
    assertUndefined(cnt.getMethodByName('НесуществующийМетод'));
    
    var method = cnt.getMethodByName('МояФункция');
    assertNotUndefined("Метод МояФункция не найден", method);    
    assertArrayEqualsIgnoringOrder(['ПараметрФункции'], method.Params);
    assertFalse(method.IsProc)

    var proc = cnt.getMethodByName('МояПроцедура');
    assertNotNull("Метод МояПроцедура не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Парам1', 'Парам2'], proc.Params);
    assertTrue(proc.IsProc)
    
}

function macrosTestAnalyseModule2_ТолькоПеременные() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Перем ЭкспортнаяПеременная Экспорт;\n"
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule3_ПеременныеМодуляВОднуСтроку() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля, ЕщеОднаПеременная, ЭкспортнаяПеременная Экспорт,"
        + "ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная";
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule4_ПеременныеМодуляНаНесколькихСтроках() {

    // Тест сломан.

    var moduleText = ""
        + "Перем мПеременнаяМодуля, ЕщеОднаПеременная, ЭкспортнаяПеременная Экспорт,\n"
        + "ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;";
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
            
    //Message(cnt.ModuleVars.join(', '));
            
    assertEquals('Неправильно определено количество методов!', 0, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule5_МодульБезПеременных() {

    var moduleText = ""
        + "Процедура МояПроцедура(Парам1, Парам2)\n"
        + "	Перем МояПерем1;\n\n"	
        + "	МояПерем1 = 42;\n\n"
        + "	АвтоматическаяПеременная = 10;\n"	
        + "	мПеременнаяМодуля = \"\";\n"	
        + "КонецПроцедуры\n\n"
        + "Функция МояФункция(ПараметрФункции)\n"
        + "	Сообщить(мПеременнаяМодуля);	\n"
        + "	Возврат Истина;	\n"
        + "КонецФункции\n\n"
        + "МояПроцедура(1, 2);\n"
        + "Результат = МояФункция();\n"

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
//debugger;        
    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
}

function macrosTestAnalyseModule6_МетодыВОднуСтроку() {

    var moduleText = ""
        + "Процедура МояПроцедура(Парам1, Парам2) "
        + "	Перем МояПерем1; "	
        + "	МояПерем1 = 42; "
        + "	АвтоматическаяПеременная = 10; "	
        + "	мПеременнаяМодуля = \"\"; "	
        + "КонецПроцедуры "
        + "Функция МояФункция(ПараметрФункции) "
        + "	Сообщить(мПеременнаяМодуля); "
        + "	Возврат Истина; "
        + "КонецФункции "
        + "МояПроцедура(1, 2); "
        + "Результат = МояФункция(); "

    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);

    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);    
    assertEquals('Неправильно определено количество переменных модуля!', 0, cnt.ModuleVars.length);
}

function macrosTestAnalyseModule7_МодульВОднуСтроку() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля; "
        + "Перем ЕщеОднаПеременная; "
        + "Перем ЭкспортнаяПеременная Экспорт; "
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная; "
        + "Процедура МояПроцедура(Парам1, Парам2) "
        + "	Перем МояПерем1; "	
        + "	МояПерем1 = 42; "
        + "	АвтоматическаяПеременная = 10; "	
        + "	мПеременнаяМодуля = \"\"; "	
        + "КонецПроцедуры "
        + "Функция МояФункция(ПараметрФункции) "
        + "	Сообщить(мПеременнаяМодуля); "
        + "	Возврат Истина;	 "
        + "КонецФункции "
        + "МояПроцедура(1, 2); "
        + "Результат = МояФункция();"

//debugger;        
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
        
    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);
    
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);
}

function macrosTestAnalyseModule8_ОпределениеЛокальныхПеременных() {

    var moduleText = ""
        + "Перем мПеременнаяМодуля;\n\n"
        + "Перем ЕщеОднаПеременная;\n"
        + "Перем ЭкспортнаяПеременная Экспорт;\n"
        + "Перем ЭкспортныйМассив[10] Экспорт, ЛокальныйМассив[3], ПростоПеременная;\n"
        + "Процедура МояПроцедура(Парам1, Парам2)\n"
        + "	Перем МояПерем1;\n\n"	
        + "	МояПерем1 = 42;\n\n"
        + "	АвтоматическаяПеременная = 10;\n"	
        + "	мПеременнаяМодуля = \"\";\n"	
        + "КонецПроцедуры\n\n"
        + "Функция МояФункция(ПараметрФункции)\n"
        + "	Сообщить(мПеременнаяМодуля);	\n"
        + "	Возврат Истина;	\n"
        + "КонецФункции\n\n"
        + "МояПроцедура(1, 2);\n"
        + "Результат = МояФункция();\n"
//debugger;
    var cnt = SyntaxAnalysis.AnalyseModule(moduleText);
    //Message(cnt.ModuleVars.join(','));
            
    assertEquals('Неправильно определено количество переменных модуля!', 6, cnt.ModuleVars.length);
    assertArrayEqualsIgnoringOrder('Неправильно определен список переменных модуля!',
        ['мПеременнаяМодуля', 'ЕщеОднаПеременная', 'ЭкспортнаяПеременная', 
        'ЭкспортныйМассив', 'ЛокальныйМассив', 'ПростоПеременная'], cnt.ModuleVars);

    assertEquals('Неправильно определено количество методов!', 2, cnt.Methods.length);
            
    var func = cnt.getMethodByName('МояФункция');
    assertNotUndefined("Метод МояФункция не найден", func);    
    assertArrayEqualsIgnoringOrder(['ПараметрФункции'], func.Params);

    assertEquals(0, func.DeclaredVars.length);    
    assertEquals(0, func.AutomaticVars.length);    
    
    var proc = cnt.getMethodByName('МояПроцедура');
    assertNotNull("Метод МояПроцедура не найден", proc);    
    assertArrayEqualsIgnoringOrder(['Парам1', 'Парам2'], proc.Params);

    // Локальные переменные процедуры.
    assertArrayEqualsIgnoringOrder(['МояПерем1'], proc.DeclaredVars);    
    assertArrayEqualsIgnoringOrder(['АвтоматическаяПеременная'], proc.AutomaticVars);    
    
}

//} tests of AnalyseModule

