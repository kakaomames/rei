public record aej(int b, chy c, boolean d) implements aay<adb> {
   public static final aao<wx, aej> a;

   public aej(int param1, chy param2, boolean param3) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public static aej a(cgk $$0) {
      return new aej($$0.aA(), new chy($$0.dJ(), $$0.dN(), $$0.ec(), $$0.ee()), $$0.aV());
   }

   public aba<aej> a() {
      return ahz.H;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public chy e() {
      return this.c;
   }

   public boolean f() {
      return this.d;
   }

   static {
      a = aao.a(aam.h, aej::b, chy.a, aej::e, aam.b, aej::f, aej::new);
   }
}
