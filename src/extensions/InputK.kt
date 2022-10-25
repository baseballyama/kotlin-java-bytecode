class InputK(val value: Int) {
    fun doSomething() = println(value)
}

fun InputK.doSomethingEx() = println(value + 1)

fun main() {
    val instance = InputK(0)
    instance.doSomething()
    instance.doSomethingEx()
}