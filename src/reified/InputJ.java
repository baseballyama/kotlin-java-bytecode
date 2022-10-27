import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collection;

class InputJ {
  public static <T> Collection<String> membersOf(T t) {
    return Arrays.stream(t.getClass().getDeclaredMethods()).map(Method::getName).toList();
  }

  public static void main(String[] args) {
    System.out.println(membersOf(new StringBuilder()));
  }
}