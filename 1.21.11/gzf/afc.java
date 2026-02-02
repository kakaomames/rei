public record afc(ftm b, float c, float d) implements aay<adb> {
   public static final aao<wx, afc> a;

   public afc(ftm param1, float param2, float param3) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
   }

   public static afc a(cgk $$0) {
      return new afc($$0.dI(), $$0.ec(), $$0.ee());
   }

   public aba<afc> a() {
      return ahz.aa;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public ftm b() {
      return this.b;
   }

   public float e() {
      return this.c;
   }

   public float f() {
      return this.d;
   }

   static {
      a = aao.a(ftm.b, afc::b, aam.l, afc::e, aam.l, afc::f, afc::new);
   }
}
