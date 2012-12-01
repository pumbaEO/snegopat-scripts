$engine JScript
$uname Example_CallPublicEpfMethod
$dname Пример вызова экспортного метода обработки 1С
$addin stdlib

stdlib.require(stdlib.getSnegopatMainFolder() + 'scripts\\epf\\epfloader.js', SelfScript);

function macrosВызватьМетодВнешнейОбработки() {

	var epf = EpfLoader.getEpf('HelloWorld');
	
	var greetings = epf.СформироватьПриветствие("Снегопат");
	
	Message(greetings);
}