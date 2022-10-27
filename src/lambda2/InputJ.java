import java.util.Arrays;

class InputJ {
  public static void main(String[] args) {
    Integer[] list = new Integer[]{1, 2};
    Arrays.stream(list).forEach(System.out::println);
  }
}