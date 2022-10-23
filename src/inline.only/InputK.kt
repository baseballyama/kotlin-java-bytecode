inline fun doSomething(process: () -> Int) {
    process()
}

fun main() {
    doSomething {
        println(0)
        0
    }
}