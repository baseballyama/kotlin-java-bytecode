class InputJ {

  class Inner {
    private int i;

    Inner(int arg) {
      i = arg;
    }

    public void doSomething() {
      System.out.println(i);
    }
  }

  class InnerEx extends Inner {
    InnerEx(int arg) {
      super(arg);
    }

    public void doSomethingEx() {
      System.out.println(super.i);
    }
  }

  public static void main(String[] args) {
    InputJ inputJ = new InputJ();
    InnerEx instance = inputJ.new InnerEx(0);
    instance.doSomething();
    instance.doSomethingEx();
  }
}