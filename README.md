# kotlin-java-bytecode

Kotlin と Java をバイトコードの観点で比較する

## 環境

```sh
kotlin -version
# Kotlin version 1.7.20-release-201 (JRE 19)
java --version
# java 19.0.1 2022-10-18
# Java(TM) SE Runtime Environment (build 19.0.1+10-21)
# Java HotSpot(TM) 64-Bit Server VM (build 19.0.1+10-21, mixed mode, sharing)
node --version
# v18.6.0
npx envinfo --system
#   System:
#    OS: macOS 12.6
#    CPU: (10) arm64 Apple M1 Pro
#    Memory: 112.39 MB / 32.00 GB
#    Shell: 5.8.1 - /bin/zsh
```

## ディレクトリ構造

```
src
  |- テストケースフォルダ
    |- kotlin と java のソースコード / コンパイル後のバイトコード
```

## バイトコード生成方法

```sh
node compile.mjs
```

## 性能検証方法

性能比較は、`java Input` のようなコマンドを 50 回実行してその平均実行時間を計測
これの目的は、Java と Kotlin 間で性能が全然違う、のような状況が発生していないかを確認する程度のものである。
マイクロベンチが目的ではない。

```sh
node performance.mjs
```

## 文字数比較方法

Kotlin の良い点の 1 個として少ない記述量で実装できる、という点があるので、この観点でも比較してみました。
計測方法は、java / kt ファイルの文字数を数え上げるというシンプルなものです。(但し空白や改行は含まない)

```sh
node count.mjs
```

## 参考情報

- [JVM 仕様書](https://docs.oracle.com/javase/specs/jvms/se18/jvms18.pdf)
  - [インストラクションセット](https://docs.oracle.com/javase/specs/jvms/se18/html/jvms-6.html#jvms-6.5)
- [invokedynamic の説明](https://www.oracle.com/webfolder/technetwork/jp/javamagazine/Java-ND17-MethodInvoc2.pdf)
- src 直下のフォルダ名の末尾に `.only` を付与するとそのフォルダのみバイトコードを生成 / 性能検証することができる
- なんか[Kotlin を Java に変換する Web サイト](https://extendsclass.com/kotlin-to-java.html)を見つけた

## 全体を通して気づいたこと

- ランタイム性能の面では、Kotlin が実現しているバイトコード最適化 (例: `forEach`) は多少ありつつも、Null 検査 (`checkNotNullParameter`) など Kotlin 独自のオーバーヘッドもあるので、特段言語選定の段階では大きな差はないのではないかと感じた
  - ただし、インライン関数など、一部現在の Java では最適化しようがない部分もあるが、そのレベルで性能を追求したい場合は Rust など他の言語を採用した方が良いと思った
- Kotlin の最大の魅力は、Java と比較して約半分の実装量で済むことと、それを実現するための標準ライブラリにあると感じた。

  - これらは Java でも自前で実装すれば実現できるかもしれないが、それをする必要性は個人的には見出せない。

- Kotlin の記述量は Java の半分程度になることを改めて体感した。その上で、Kotlin は Java よりも表現力が豊かと言われている気がするので、業務アプリで使用する上では Kotlin を採用する大きなポイントになると感じた。
- 一方、Kotlin はコンパイル速度が Java よりも 7-8 倍遅い。これはなんでなんですか?実際には IntelliJ を使用するとあまり問題にならない、のような整理がされているのでしょうか?
- なんとなくだが、Java は `dup` 命令をなどを使って、不必要に ローカル変数 を使用しない (オペランドスタックだけで済ます) ようなバイトコードになっている一方 Kotlin `astore` 命令を使用して積極的に ローカル変数 を使用しているように感じた。それが性能などにどのような影響を及ぼすのかはわからない。(Kotlin の場合は `astore` -> `aload` のような命令が散見され、一見無駄に見える)

## 比較

### メイン関数のみ (hello)

#### 気づいたこと

- Kotlin のコンパイルは Java の 7〜10 倍遅い
- Kotlin で、標準入力を受け取らないメイン関数 (`fun main()`) を書くと、バイトコード上では、`public static void main(java.lang.String[]);` 関数から `public static final void main()` が呼ばれる、という構成になるらしい。(つまり 1 スタック余計に使う)
- Kotlin のバイトコードはコンストラクタがない
- Java のバイトコードは単に定数としての 0 を使用しているだけだが、Kotlin のバイトコードでは、定数 0 を一度ローカル変数に設定している。なぜ? (わからない)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 345.605 ms | 2462.764 ms |
| Execution | 73.333 ms  | 65.556 ms   |
| Count     | 71 chars   | 21 chars    |

#### Java バイトコード (抜粋)

```
0: getstatic     #7                  // Field java/lang/System.out:Ljava/io/PrintStream;
3: iconst_0
4: invokevirtual #13                 // Method java/io/PrintStream.println:(I)V
7: return
```

#### Kotlin バイトコード (抜粋)

```
0: iconst_0
1: istore_0
2: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
5: iload_0
6: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
9: return
```

### Companion Object (companion)

#### 気づいたこと

- Java の static と Kotlin の Companion Object は厳密には違うと言われているが、バイトコード上で実際に違うことを確認できた!
- Companion object の部分は、`InputK$Companion.class` という別のクラスファイルにコンパイルされた
- `InputK$Companion.class` の引数なしコンストラクタは private になっている代わりに `DefaultConstructorMarker` が必要なコンストラクタがあった。空のプライベートコンストラクタだけを持つクラスらしい。([ソースコード](https://github.com/JetBrains/kotlin/blob/master/libraries/stdlib/jvm/runtime/kotlin/jvm/internal/DefaultConstructorMarker.java))
  - これにより、コンパイル時点ではコンストラクタが作れないにも関わらず、実行時には呼び出せる、という状況を作り出せる。(実行時には null を渡している)
- じゃあこれを `object` に変更したらどうなる? (`object` の節で調査)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 347.313 ms | 2453.847 ms |
| Execution | 33.522 ms  | 32.401 ms   |
| Count     | 110 chars  | 101 chars   |

#### Java バイトコード (抜粋)

```
public static void main(java.lang.String[]);
  descriptor: ([Ljava/lang/String;)V
  flags: (0x0009) ACC_PUBLIC, ACC_STATIC
  Code:
    stack=0, locals=1, args_size=1
        0: invokestatic  #7                  // Method doSomething:()V
        3: return

static void doSomething();
  descriptor: ()V
  flags: (0x0008) ACC_STATIC
  Code:
    stack=2, locals=0, args_size=0
        0: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
        3: iconst_0
        4: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
        7: return
```

#### Kotlin バイトコード (抜粋)

```
// KotlinKKt
Constant pool:
   #7 = Utf8               InputK
   #8 = Class              #7             // InputK
   #9 = Utf8               Companion
  #10 = Utf8               LInputK$Companion;
  #11 = NameAndType        #9:#10         // Companion:LInputK$Companion;
  #12 = Fieldref           #8.#11         // InputK.Companion:LInputK$Companion;

0: getstatic     #12                 // Field InputK.Companion:LInputK$Companion;
3: invokevirtual #17                 // Method InputK$Companion.doSomething:()V
6: return

// InputK
static {};
  descriptor: ()V
  flags: (0x0008) ACC_STATIC
  Code:
    stack=3, locals=0, args_size=0
        0: new           #13                 // class InputK$Companion
        3: dup
        4: aconst_null
        5: invokespecial #16                 // Method InputK$Companion."<init>":(Lkotlin/jvm/internal/DefaultConstructorMarker;)V
        8: putstatic     #20                 // Field Companion:LInputK$Companion;
      11: return
InnerClasses:
  public static final #17= #13 of #2;     // Companion=class InputK$Companion of class InputK

// InputK$Companion
  public final void doSomething();
    descriptor: ()V
    flags: (0x0011) ACC_PUBLIC, ACC_FINAL
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #17                 // Field java/lang/System.out:Ljava/io/PrintStream;
         3: iconst_0
         4: invokevirtual #23                 // Method java/io/PrintStream.println:(I)V
         7: return

  public InputK$Companion(kotlin.jvm.internal.DefaultConstructorMarker);
    descriptor: (Lkotlin/jvm/internal/DefaultConstructorMarker;)V
    flags: (0x1001) ACC_PUBLIC, ACC_SYNTHETIC
    Code:
      stack=1, locals=2, args_size=2
         0: aload_0
         1: invokespecial #25                 // Method "<init>":()V
         4: return
```

### object (companion-object)

#### 気づいたこと

- `InputK$Companion.class` という class ファイルは生成されなくなった
- Java は単に `invokestatic` を呼び出しているだけ
- 一方 Kotlin は `doSomething` が含まれるクラスのシングルトンインスタンスを生成してから `doSomething` を呼び出している
- では、`object` を使用せずに単にファイルの直下に関数を実装したらどうなるだろうか (`function` の節を参照)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 333.633 ms | 2609.760 ms |
| Execution | 33.747 ms  | 36.040 ms   |
| Count     | 110 chars  | 85 chars    |

#### Java バイトコード (抜粋)

```
public static void main(java.lang.String[]);
  descriptor: ([Ljava/lang/String;)V
  flags: (0x0009) ACC_PUBLIC, ACC_STATIC
  Code:
    stack=0, locals=1, args_size=1
        0: invokestatic  #7                  // Method doSomething:()V
        3: return

static void doSomething();
  descriptor: ()V
  flags: (0x0008) ACC_STATIC
  Code:
    stack=2, locals=0, args_size=0
        0: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
        3: iconst_0
        4: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
        7: return
```

#### Kotlin バイトコード (抜粋)

```
// InputKKt.class
public static final void main();
  descriptor: ()V
  flags: (0x0019) ACC_PUBLIC, ACC_STATIC, ACC_FINAL
  Code:
    stack=1, locals=0, args_size=0
        0: getstatic     #12                 // Field InputK.INSTANCE:LInputK;
        3: invokevirtual #15                 // Method InputK.doSomething:()V
        6: return

// InputK.class
public final void doSomething();
  descriptor: ()V
  flags: (0x0011) ACC_PUBLIC, ACC_FINAL
  Code:
    stack=2, locals=1, args_size=1
        0: getstatic     #17                 // Field java/lang/System.out:Ljava/io/PrintStream;
        3: iconst_0
        4: invokevirtual #23                 // Method java/io/PrintStream.println:(I)V
        7: return

static {};
  descriptor: ()V
  flags: (0x0008) ACC_STATIC
  Code:
    stack=2, locals=0, args_size=0
        0: new           #2                  // class InputK
        3: dup
        4: invokespecial #25                 // Method "<init>":()V
        7: putstatic     #28                 // Field INSTANCE:LInputK;
        10: return
```

### function (companion-fun)

#### 気づいたこと

- Java / Kotlin 共に生成されるファイルが 1 ファイルになり、バイトコードもほぼ同じになった!
- 違いがあるとすると、Java にはコンストラクタがあるにも関わらず Kotlin には存在しない
- static メソッド / static 変数を使用する際はできる限りファイル直下に実装しよう。

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 256.064 ms | 2317.019 ms |
| Execution | 34.310 ms  | 32.038 ms   |
| Count     | 110 chars  | 64 chars    |

#### Java バイトコード (抜粋)

```
public static void main(java.lang.String[]);
  descriptor: ([Ljava/lang/String;)V
  flags: (0x0009) ACC_PUBLIC, ACC_STATIC
  Code:
    stack=0, locals=1, args_size=1
        0: invokestatic  #7                  // Method doSomething:()V
        3: return

static void doSomething();
  descriptor: ()V
  flags: (0x0008) ACC_STATIC
  Code:
    stack=2, locals=0, args_size=0
        0: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
        3: iconst_0
        4: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
        7: return
```

#### Kotlin バイトコード (抜粋)

```
public static final void doSomething();
  descriptor: ()V
  flags: (0x0019) ACC_PUBLIC, ACC_STATIC, ACC_FINAL
  Code:
    stack=2, locals=0, args_size=0
        0: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
        3: iconst_0
        4: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
        7: return

public static final void main();
  descriptor: ()V
  flags: (0x0019) ACC_PUBLIC, ACC_STATIC, ACC_FINAL
  Code:
    stack=0, locals=0, args_size=0
        0: invokestatic  #21                 // Method doSomething:()V
        3: return

public static void main(java.lang.String[]);
  descriptor: ([Ljava/lang/String;)V
  flags: (0x1009) ACC_PUBLIC, ACC_STATIC, ACC_SYNTHETIC
  Code:
    stack=0, locals=1, args_size=1
        0: invokestatic  #24                 // Method main:()V
        3: return
```

### ループ処理 (loop)

#### 気づいたこと

- ローカル変数の格納場所を除いて全く同じバイトコードが生成された!

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 247.636 ms | 2435.147 ms |
| Execution | 68.138 ms  | 67.487 ms   |
| Count     | 79 chars   | 32 chars    |

#### Java バイトコード (抜粋)

```
 0: iconst_0
 1: istore_1
 2: iload_1
 3: bipush        100
 5: if_icmpge     16
 8: iconst_0
 9: istore_2
10: iinc          1, 1
13: goto          2
16: return
```

#### Kotlin バイトコード (抜粋)

```
 0: iconst_0
 1: istore_0
 2: iload_0
 3: bipush        100
 5: if_icmpge     16
 8: iconst_0
 9: istore_1
10: iinc          0, 1
13: goto          2
16: return
```

---

### IF 文 (if1)

`if (1 != 2)` を用いた無意味な IF 文を使用

#### 気づいたこと

- Java も Kotlin も IF 文が除去された。最適化パスによって不要な IF 文は除去されるよう。
- Kotlin では `nop` 命令が挿入された。なぜ? (わからない)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 325.292 ms | 2418.102 ms |
| Execution | 33.619 ms  | 33.921 ms   |
| Count     | 81 chars   | 32 chars    |

#### Java バイトコード (抜粋)

```
0: getstatic     #7                  // Field java/lang/System.out:Ljava/io/PrintStream;
3: iconst_0
4: invokevirtual #13                 // Method java/io/PrintStream.println:(I)V
7: return
```

#### Kotlin バイトコード (抜粋)

```
 0: nop
 1: iconst_0
 2: istore_0
 3: getstatic     #12                 // Field java/lang/System.out:Ljava/io/PrintStream;
 6: iload_0
 7: invokevirtual #18                 // Method java/io/PrintStream.println:(I)V
10: return
```

### IF 文 (if2)

`if (0.5 > Math.random())` を用いた意味のある IF 文を使用

#### 気づいたこと

- ほとんど同じバイトコードが生成された!

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 253.020 ms | 2258.798 ms |
| Execution | 35.264 ms  | 32.647 ms   |
| Count     | 94 chars   | 45 chars    |

#### Java バイトコード (抜粋)

```
 0: ldc2_w        #7                  // double 0.5d
 3: invokestatic  #9                  // Method java/lang/Math.random:()D
 6: dcmpl
 7: ifle          17
10: getstatic     #15                 // Field java/lang/System.out:Ljava/io/PrintStream;
13: iconst_0
14: invokevirtual #21                 // Method java/io/PrintStream.println:(I)V
17: return
```

#### Kotlin バイトコード (抜粋)

```
 0: ldc2_w        #7                  // double 0.5d
 3: invokestatic  #14                 // Method java/lang/Math.random:()D
 6: dcmpl
 7: ifle          19
10: iconst_0
11: istore_0
12: getstatic     #20                 // Field java/lang/System.out:Ljava/io/PrintStream;
15: iload_0
16: invokevirtual #26                 // Method java/io/PrintStream.println:(I)V
19: return
```

### インライン関数 (inline)

#### 気づいたこと

- Kotlin のバイトコードはインライン関数の実装が main 関数に埋め込まれている (`invoke` 命令がない)
- Kotlin 用のランタイム (`kotlin/jvm/functions/Function0`) が必要になったので `java` コマンドの代わりに `kotlin` コマンドで実行したら遅くなった
  - 実際の開発ではランタイムを埋め込んだ Jar ファイルを作成して java コマンドで実行できるようにする必要がある (?)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 397.122 ms | 2524.462 ms |
| Execution | 39.272 ms  | 91.326 ms   |
| Count     | 248 chars  | 83 chars    |

#### Java バイトコード (抜粋)

```
public static void main(java.lang.String[]);
  descriptor: ([Ljava/lang/String;)V
  flags: (0x0009) ACC_PUBLIC, ACC_STATIC
  Code:
    stack=2, locals=1, args_size=1
       0: new           #7                  // class InputJ
       3: dup
       4: invokespecial #9                  // Method "<init>":()V
       7: invokedynamic #10,  0             // InvokeDynamic #0:get:()Ljava/util/function/Supplier;
      12: invokevirtual #14                 // Method doSomething:(Ljava/util/function/Supplier;)V
      15: return

void doSomething(java.util.function.Supplier<java.lang.Integer>);
  descriptor: (Ljava/util/function/Supplier;)V
  flags: (0x0000)
  Code:
    stack=1, locals=2, args_size=2
        0: aload_1
        1: invokeinterface #18,  1           // InterfaceMethod java/util/function/Supplier.get:()Ljava/lang/Object;
        6: pop
        7: return

private static java.lang.Integer lambda$main$0();
  descriptor: ()Ljava/lang/Integer;
  flags: (0x100a) ACC_PRIVATE, ACC_STATIC, ACC_SYNTHETIC
  Code:
    stack=3, locals=0, args_size=0
       0: getstatic     #23                 // Field java/lang/System.out:Ljava/io/PrintStream;
       3: invokestatic  #29                 // Method java/lang/Math.random:()D
       6: invokevirtual #35                 // Method java/io/PrintStream.println:(D)V
       9: iconst_0
      10: invokestatic  #41                 // Method java/lang/Integer.valueOf:(I)Ljava/lang/Integer;
      13: areturn
}
BootstrapMethods:
0: #58 REF_invokeStatic java/lang/invoke/LambdaMetafactory.metafactory:(Ljava/lang/invoke/MethodHandles$Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodType;Ljava/lang/invoke/MethodHandle;Ljava/lang/invoke/MethodType;)Ljava/lang/invoke/CallSite;
  Method arguments:
    #65 ()Ljava/lang/Object;
    #66 REF_invokeStatic InputJ.lambda$main$0:()Ljava/lang/Integer;
    #69 ()Ljava/lang/Integer;
```

#### Kotlin バイトコード (抜粋)

```
 0: iconst_0
 1: istore_0
 2: iconst_0
 3: istore_1
 4: iconst_0
 5: istore_2
 6: getstatic     #33                 // Field java/lang/System.out:Ljava/io/PrintStream;
 9: iload_2
10: invokevirtual #39                 // Method java/io/PrintStream.println:(I)V
13: nop
14: nop
15: nop
16: return
```

### ラッパー型 (integer)

#### 気づいたこと

- ほぼ同じバイトコードが生成された。つまり、Kotlin はプリミティブ型の `int` を使用すべきか ラッパー型の `Integer` を使用すべきかをコンパイラが判断していた。
- 主な Kotlin と Java のバイトコードの違いは Kotlin でのみ `Arrays.asList` の結果に対して `checkcast` 命令を実行していること。なぜ必要なのかわからない。
- あと、全然関係ないが以下に気づいた。

```kt
// おもむろにファイル内に標準ライブラリと同名の関数を宣言するとそちらが優先される。ちょっと罠?
// (警告を出してくれると嬉しい気がした)
fun <T> listOf(element: T): List<T> = throw Exception("")

fun main() {
  // 絶対にここで Exception がスローされる
  val a = listOf(1)
}

```

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 300.423 ms | 2476.075 ms |
| Execution | 60.700 ms  | 61.427 ms   |
| Count     | 209 chars  | 83 chars    |

#### Java バイトコード (抜粋)

```
// 特筆事項がないので省略
```

#### Kotlin バイトコード (抜粋)

```
// 特筆事項がないので省略
```

### 拡張関数 (extensions)

#### 気づいたこと

- Java だと継承しなければならなかったので書きづらかった。
- Kotlin の拡張関数は、拡張元のクラスのインスタンスを引数にとる関数としてコンパイルされる (つまり以下のシンタックスシュガー)

```kt
class InputK(val value: Int) {
    fun doSomething() = println(value)
}
fun doSomethingEx(instance: InputK) = println(instance.value + 1)
```

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 345.605 ms | 2462.764 ms |
| Execution | 73.333 ms  | 65.556 ms   |
| Chars     | 360 chars  | 178 chars   |

#### Java バイトコード (抜粋)

```
// 特筆事項がないので省略
```

#### Kotlin バイトコード (抜粋)

```
public static final void doSomethingEx(InputK);
  Code:
       0: aload_0
       1: ldc           #9                  // String <this>
       3: invokestatic  #15                 // Method kotlin/jvm/internal/Intrinsics.checkNotNullParameter:(Ljava/lang/Object;Ljava/lang/String;)V
       6: aload_0
       7: invokevirtual #21                 // Method InputK.getValue:()I
      10: iconst_1
      11: iadd
      12: istore_1
      13: getstatic     #27                 // Field java/lang/System.out:Ljava/io/PrintStream;
      16: iload_1
      17: invokevirtual #33                 // Method java/io/PrintStream.println:(I)V
      20: return
```

### 中置記法 (infix)

#### 気づいたこと

- これは完全に Java でいう以下のシンタックスシュガー

```kotlin
// Kotlin
infix fun Int.plusEx(n: Int): Int = this + n

fun main() {
  println(1 plusEx 2)
}

// Java
public static final int plusEx(int base, int n) {
  return base + n;
}
```

#### 性能比較

| Step      | Java       | Kotlin                      |
| --------- | ---------- | --------------------------- |
| Compile   | 393.717 ms | 2545.234 ms                 |
| Execution | 60.902 ms  | 63.583 ms (kotlin コマンド) |
| Count     | 136 chars  | 64 chars                    |

#### Java バイトコード (抜粋)

```
// 特筆事項なし
```

#### Kotlin バイトコード (抜粋)

```
// 特筆事項なし
```

### ラムダ式 (lambda)

#### 気づいたこと

- Java は `java/util/stream/Stream` を使用してループ処理を実現していた
- Kotlin は、`java/util/Iterator` を使用してループ処理を実現していた

```kt
// JavaのバイトコードをKotlinでそれっぽく書くとこう
fun main() {
  val list = listOf(1,2)
  Arrays.stream(list).forEach(::println)
}
```

#### 性能比較

| Step      | Java       | Kotlin                       |
| --------- | ---------- | ---------------------------- |
| Compile   | 379.398 ms | 2758.349 ms                  |
| Execution | 67.188 ms  | 133.543 ms (kotlin コマンド) |
| Count     | 153 chars  | 86 chars                     |

### ラムダ式 2 (lambda2)

では、上の `Stream` を使ったコードで再度比較してみた。

#### 気づいたこと

- `println` 以外はほとんど同じになった

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 345.605 ms | 2462.764 ms |
| Execution | 73.333 ms  | 65.556 ms   |
| Count     | 209 chars  | 83 chars    |

### reified (reified)

等価なコードを書くことができなかった。

#### 気づいたこと

- Kotlin のコードの `T::class.functions` がめちゃくちゃ遅かった。`functions` の部分が遅かった。
- その他に特筆すべき点はなかった。 `reified` が必要な理由がイマイチわからなかったが、Java との相互運用性の観点で必要らしい??

#### 性能比較

| Step      | Java       | Kotlin                       |
| --------- | ---------- | ---------------------------- |
| Compile   | 386.515 ms | 2712.356 ms                  |
| Execution | 68.813 ms  | 502.138 ms (kotlin コマンド) |
| Count     | 313 chars  | 153 chars                    |

### ジェネリクス (generics)

#### 気づいたこと

- 特に違いはなかった

#### 性能比較

| Step      | Java       | Kotlin                       |
| --------- | ---------- | ---------------------------- |
| Compile   | 325.439 ms | 2582.832 ms                  |
| Execution | 65.627 ms  | 142.800 ms (kotlin コマンド) |
| Count     | 179 chars  | 86 chars                     |

### Null 安全その 1 (null-safety)

#### 気づいたこと

- Kotlin は、Null 安全を確認するために `doprint` 関数内で `kotlin/jvm/internal/Intrinsics.checkNotNullParameter` を呼び出していた。
- でも、非 Null フィールド全部に対して呼び出していたら効率悪そう -> 次の調査へ

#### 性能比較

| Step      | Java       | Kotlin                       |
| --------- | ---------- | ---------------------------- |
| Compile   | 320.559 ms | 2400.278 ms                  |
| Execution | 66.266 ms  | 134.023 ms (kotlin コマンド) |
| Count     | 145 chars  | 62 chars                     |

### Null 安全その 2 (null-safety)

#### 気づいたこと

- Java と Kotlin で全く同じ命令になった!
- Kotlin の非 Null チェックが不要な場合は多少最適化されるのだろうか
  - (だとしても上の場合も非 Null しかあり得ないので最適化しても良い気がした)

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 360.626 ms | 2414.449 ms |
| Execution | 62.508 ms  | 67.847 ms   |
| Count     | 106 chars  | 31 chars    |

### コルーチン (coroutine)

Java19 でプレビュー機能として入った バーチャルスレッド と コルーチン を比較してみた。

#### 気づいたこと

- バイトコードを見ても Kotlin は Kotlinx を呼び出しているし
- Kotlin のコルーチンはイベントループモデルを採用しているらしいということを知った

- [スレッドと仮想スレッドのパフォーマンス](https://inside.java/2020/08/07/loom-performance/)
- [Java と Kotlin の違い](https://www.baeldung.com/kotlin/java-kotlin-lightweight-concurrency#how_are_java_virtual_threads_different_than_kotlin_coroutines)
- [スタックレス / スタックフルコルーチン](https://qiita.com/hayao0727/items/5ae697fca2d6841709a2)
  - 要はスタックフルだとどこでも yield (中断) ができる。スタックレスだとできる場所が制限される。
  - Kotlin はスタックレス、Java はスタックフル。スタックレスの方が性能は良いらしい。
- [スケジューリング](https://zenn.dev/akatsuki/articles/85dad95a835b0a)
  - Kotlin は協調スケジューリング、Java は先取り (プリエんティブ) スケジューリングを採用している。
  - 今どきのスケジューラーは先取りスケジューラーがほとんどらしいが、先取りスケジューラーは協調スケジューリングよりも実装が複雑。
  - 先取りスケジューラーは任意の時点で中断できる必要があるので、つまりスタックフルである必要があるらしい。
  - Kotlin はそんなせせこましいタスク管理をするよりもオーバーヘッドの少なさが大事であると判断して今の実装を選択したのだろうか?

#### 性能比較

Kotlin は `kotlinx` が必要だったが、このプロジェクトは特段 gradle プロジェクトなどではないので、ベンチの取得は省略した。

| Step      | Java      | Kotlin    |
| --------- | --------- | --------- |
| Compile   | - ms      | - ms      |
| Execution | - ms      | - ms      |
| Count     | 315 chars | 173 chars |

### テンプレート (template)

#### 気づいたこと

- xxx
- yyy

#### 性能比較

| Step      | Java       | Kotlin      |
| --------- | ---------- | ----------- |
| Compile   | 345.605 ms | 2462.764 ms |
| Execution | 73.333 ms  | 65.556 ms   |
| Count     | 209 chars  | 83 chars    |

# TODO

- suspend
- sealed
