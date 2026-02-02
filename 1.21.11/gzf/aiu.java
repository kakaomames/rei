public record aiu(int b, int c, boolean d) implements aay<aib> {
   public static final aao<wx, aiu> a = aay.a(aiu::a, aiu::new);

   private aiu(wx $$0) {
      this($$0.l(), $$0.w(), $$0.readBoolean());
   }

   public aiu(int param1, int param2, boolean param3) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   private void a(wx $$0) {
      $$0.c(this.b);
      $$0.f(this.c);
      $$0.a(this.d);
   }

   public aba<aiu> a() {
      return ahz.bI;
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

   public boolean f() {
      return this.d;
   }
}
