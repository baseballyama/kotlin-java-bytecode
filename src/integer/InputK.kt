import java.util.ArrayList;
import java.util.Arrays;

fun main() {
  val i: Int = 0
  // MEMO: Kotlinの標準ライブラリの使用を回避してバイトコードの比較を容易にする
  // val j: List<Int> = listOf(1)
  val j = ArrayList(Arrays.asList(1));
  println(i)
  println(j)
}