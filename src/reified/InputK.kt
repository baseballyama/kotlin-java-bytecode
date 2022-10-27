import kotlin.reflect.full.functions

inline fun <reified T> membersOf() = T::class.functions.map { it.name }

fun main() {
    println(membersOf<java.lang.StringBuilder>())
}