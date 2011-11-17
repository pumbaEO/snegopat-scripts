$engine JScript
$uname testIntsManager
$dname Тесты для класса Intellisense.js::IntsManager
$addin global
$addin stdcommands
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);

var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
var testDir = mainFolder + 'scripts\\Tests\\Automated\\Intellisense\\ints_testing';
var Ints = stdlib.require(mainFolder + 'scripts\\Intellisense.js');

function setUp()
{
}

function tearDown()
{
}

function macrosTest_addTypeInfoFromString()
{
    var etalonTypeInfo = {
        n : 'ТаблицаЗначений',
        m : { 'выбратьстроку': { n: 'ВыбратьСтроку', r: 'СтрокаТаблицыЗначений', a: 'c'} },
        p : { 'колонки' :  { n: 'Колонки', t: 'КоллекцияКолонокТаблицыЗначений', a: 'sce'}}
    };

    var intsCode = "meth('ТаблицаЗначений', 'ВыбратьСтроку', 'СтрокаТаблицыЗначений', 'c');\n"
    + "prop('ТаблицаЗначений', 'Колонки', 'КоллекцияКолонокТаблицыЗначений', 'sce');"
    
    var im = new Ints.IntsManager();
    im.addTypeInfoFromString(intsCode);

    var ti = im.getTypeInfo('ТаблицаЗначений');
    assertObjectEquals(etalonTypeInfo, ti);    
}

function macrosTest_loadTypeInfoFromFile()
{
   var etalonTypeInfo = {
        n : 'ТаблицаЗначений',
        m : { 'выбратьстроку': { n: 'ВыбратьСтроку', r: 'СтрокаТаблицыЗначений', a: 'c'} },
        p : { 'колонки' :  { n: 'Колонки', t: 'КоллекцияКолонокТаблицыЗначений', a: 'sce'}}
    };

    var im = new Ints.IntsManager(testDir);
    im.loadTypeInfoFromFile('ТаблицаЗначений');

    var ti = im.getTypeInfo('ТаблицаЗначений');
    assertObjectEquals(etalonTypeInfo, ti);    
}

