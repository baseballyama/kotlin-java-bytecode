import java.util.function.Function;
import java.util.function.Supplier;

class InputJ {
  public static void main(String[] args) {
    new InputJ().doSomething(() -> {
      System.out.println(Math.random());
      return 0;
    });
  }

  void doSomething(Supplier<Integer> process) {
    process.get();
  }
}