import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    repeat((0..10000).count()) {
        launch {
            delay(1000L)
        }
    }
}