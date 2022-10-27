import java.util.List;

class InputJ {

  static void printList(List<String> list) {
    System.out.println(list);
  }

  public static void main(String[] args) {
    printList(List.of(new String[] { "foo", "bar" }));
  }
}