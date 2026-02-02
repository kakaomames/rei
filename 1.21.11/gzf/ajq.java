public record ajq(int b, int c) implements aay<aib> {
   public static final aao<wx, ajq> a = aay.a(ajq::a, ajq::new);

   private ajq(wx $$0) {
      this($$0.l(), $$0.l());
      if (this.c < 0 && this.c != -1) {
         throw new IllegalArgumentException("Invalid selectedItemIndex: " + this.c);
      }
   }

   public ajq(int param1, int param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.c(this.c);
   }

   public aba<ajq> a() {
      return ahz.bs;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public int e() {
      return this.c;
   }
}
