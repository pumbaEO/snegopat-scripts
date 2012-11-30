$engine JScript
$uname Example_stdlib_setTimeout
$dname Пример использования setTimeout
$addin stdlib

SelfScript.self['macrosВывести сообщение с задержкой 5 секунд'] = function() {
	
	// В качестве первого аргумента передаем анонимную функцию,
	// которая будет выводить сообщение. Вторым - время задержки (в миллисекундах).
	
	stdlib.setTimeout(function() { Message('Прошло 5 секунд!'); }, 5000);
	
}