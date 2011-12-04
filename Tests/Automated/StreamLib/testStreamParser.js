$engine JScript
$uname testStreamParser
$dname Тесты класса StreamParser
$addin stdlib

stdlib.require('jsUnitCore.js', SelfScript);
stdlib.require('StreamLib.js', SelfScript);

//{ Инициализация DATA_DIR
var snegopatFolder = profileRoot.getValue("Snegopat/MainFolder");
var DATA_DIR = snegopatFolder + "scripts\\Tests\\Automated\\StreamLib\\data\\";
//} Инициализация

var SP = null;

//{ setUp/tearDown
function setUp() {
    SP = StreamFactory.CreateParser();
}

function tearDown() {
    SP = null;
}
//} setUp/tearDown

//{ Простые тесты
function macrosTestParser_EmptyArray()
{
    SP.setStream('{}');
    assertArrayEquals([], SP.parse());
}

function macrosTestParser_SimpleArray_Numbers()
{
    SP.setStream('{1,2,3}');
    assertArrayEquals([1, 2, 3], SP.parse());
}

function macrosTestParser_SimpleArray_Strings()
{
    SP.setStream('{"test string", "second string"}');
    assertArrayEquals(["test string", "second string"], SP.parse());
}

function macrosTestParser_SimpleArray_EmptyStrings()
{
    SP.setStream('{"", ""}');
    assertArrayEquals(["", ""], SP.parse());
}

function macrosTestParser_SimpleArray_QuotesInString1()
{
    SP.setStream('{"""", "this is ""quoted"" word"}');
    assertArrayEquals(['"', 'this is "quoted" word'], SP.parse());
}

function macrosTestParser_SimpleArray_QuotesInString2()
{
    SP.setStream('{""""""}');
    assertArrayEquals(['""'], SP.parse());
}

function macrosTestParser_MultidimensionalArray()
{
    SP.setStream('{{1, 2, 3}, {"first", "second", "third", {"array inside of array"}}}');
    assertArrayEquals([[1,2,3], ['first', 'second', 'third', ['array inside of array']]], SP.parse());
}
//} Простые тесты

//{ Тесты с данными из файлов
function macrosTestParser_templ0_Empty_st() {

    var fname = 'templ0_Empty.st';
    assertTrue("Файл с тестовыми данными не существует: " + dataFile(fname), dataFileExists(fname));
    
    assertTrue(SP.readStreamFromFile(dataFile(fname)));    
    var a = SP.parse(SP.getStream());
    assertArrayEquals([1,[0,['Empty',1,0,'"ddd','']]],a);
}

function macrosTestParser_templ1_st() {

    var fname = 'templ1.st';
    assertTrue("Файл с тестовыми данными не существует: " + dataFile(fname), dataFileExists(fname));
    
    assertTrue(SP.readStreamFromFile(dataFile(fname)));    
    
    var e = [1,[1,["Tmpl1",1,0,"",""],
        [0,["Шаблон1 - Автоматически заменять и включать в контекстное меню",0,1,
        "Автоматически заменять строку","Содержимое шаблона"]]]];
    
    var a = SP.parse(SP.getStream());
    assertArrayEquals(e, a);
}

//} Тесты с данными из файлов

//{ Вспомогательные функции
function dataFile(fileName) {
    return DATA_DIR + fileName
}

function dataFileExists(fileName) {
    var f = v8New('File', dataFile(fileName));
    return (f.Exist() && f.IsFile());
}
//} Вспомогательные функции
